/// <reference types="@cloudflare/workers-types" />
import { STORES, offerFor, type SimOffer } from "../../src/lib/priceSim";

// Pages Function: POST /api/prices
// Body: { items: [{ id, name, basePrice }] }
// Prices every item across all stores CONCURRENTLY (Promise.all), caches each
// item in KV, and records the best offer into D1 as price history.
//
// PREÇOS REAIS (Mercado Livre):
//   As lojas BR (Kabum/Pichau/Terabyte) bloqueiam scraping e não têm API pública,
//   então o preço delas é ESTIMADO de forma determinística (offerFor).
//   O Mercado Livre tem API oficial: defina os secrets `ML_CLIENT_ID` e
//   `ML_CLIENT_SECRET` (app gratuito em developers.mercadolivre.com.br) e a oferta
//   "Mercado Livre" passa a ser o MENOR preço REAL do marketplace, marcada com
//   `real: true`. Sem os secrets, tudo continua estimado (com aviso na UI).

interface Env {
  PRICE_CACHE?: KVNamespace;
  DB?: D1Database;
  ML_CLIENT_ID?: string;
  ML_CLIENT_SECRET?: string;
}

interface ItemIn {
  id: string;
  name: string;
  basePrice: number;
}

interface Offer extends SimOffer {
  installments?: string;
  shipping?: string;
  real?: boolean;
}

interface PriceResult {
  componentId: string;
  offers: Offer[];
  best: Offer | null;
  cached: boolean;
}

const CACHE_TTL = 60 * 10; // 10 minutes

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: { items?: ItemIn[] };
  try {
    body = await ctx.request.json();
  } catch {
    return json({ error: "JSON inválido" }, 400);
  }
  const items = Array.isArray(body.items) ? body.items.slice(0, 24) : [];
  if (items.length === 0) return json({ results: [] });

  // All items priced concurrently; within each item, all stores concurrently.
  const results = await Promise.all(items.map((item) => priceItem(ctx, item)));
  return json({ results });
};

export const onRequestOptions: PagesFunction = async () => corsPreflight();

async function priceItem(
  ctx: EventContext<Env, string, unknown>,
  item: ItemIn
): Promise<PriceResult> {
  const { env } = ctx;
  if (!item?.id || typeof item.basePrice !== "number") {
    return { componentId: item?.id ?? "?", offers: [], best: null, cached: false };
  }

  const cacheKey = `price:${item.id}:${item.basePrice}`;
  if (env.PRICE_CACHE) {
    const cached = await env.PRICE_CACHE.get<PriceResult>(cacheKey, "json");
    if (cached) return { ...cached, cached: true };
  }

  // Query every store at the same time. Each estimated "request" resolves after
  // its (capped) latency so the wall-clock reflects the slowest store — exactly
  // how a real fan-out of fetch() calls would behave.
  const offers: Offer[] = await Promise.all(
    STORES.map(
      (s) =>
        new Promise<Offer>((resolve) => {
          const o = offerFor(item.id, item.name, item.basePrice, s);
          const enriched: Offer = {
            ...o,
            installments: o.price >= 600 ? `em até 10x` : undefined,
            shipping: o.price >= 2500 ? "Frete grátis" : undefined,
          };
          setTimeout(() => resolve(enriched), Math.min(o.fetchedMs, 500));
        })
    )
  );

  // Real price from the Mercado Livre official API (when credentials exist).
  // Replaces the estimated "Mercado Livre" offer; any failure keeps the estimate.
  if (env.ML_CLIENT_ID && env.ML_CLIENT_SECRET) {
    try {
      const token = await mlToken(env);
      if (token) {
        const real = await mlBestOffer(token, item.name);
        if (real) {
          const i = offers.findIndex((o) => o.store === "Mercado Livre");
          const base = i >= 0 ? offers[i] : null;
          const realOffer: Offer = {
            store: "Mercado Livre",
            storeColor: base?.storeColor ?? "#ffe600",
            price: real.price,
            inStock: true,
            url: real.url,
            fetchedMs: real.tookMs,
            real: true,
            installments: real.price >= 600 ? "em até 10x" : undefined,
            shipping: real.price >= 2500 ? "Frete grátis" : undefined,
          };
          if (i >= 0) offers[i] = realOffer;
          else offers.push(realOffer);
        }
      }
    } catch {
      /* keep the estimated Mercado Livre offer */
    }
  }

  offers.sort((a, b) => a.price - b.price);
  const best = offers.filter((o) => o.inStock)[0] ?? null;
  const result: PriceResult = { componentId: item.id, offers, best, cached: false };

  if (env.PRICE_CACHE) {
    ctx.waitUntil(
      env.PRICE_CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: CACHE_TTL })
    );
  }
  // Record best price into D1 history (non-blocking).
  if (env.DB && best) {
    ctx.waitUntil(
      env.DB.prepare(
        "INSERT INTO price_snapshots (component_id, store, price, in_stock, captured_at) VALUES (?, ?, ?, ?, ?)"
      )
        .bind(item.id, best.store, best.price, 1, new Date().toISOString())
        .run()
        .catch(() => {})
    );
  }

  return result;
}

// ── Mercado Livre oficial ────────────────────────────────────────────────────
// client_credentials → access_token (cacheado no KV) → busca o menor preço novo.

async function mlToken(env: Env): Promise<string | null> {
  if (!env.ML_CLIENT_ID || !env.ML_CLIENT_SECRET) return null;
  if (env.PRICE_CACHE) {
    const cached = await env.PRICE_CACHE.get("ml:token");
    if (cached) return cached;
  }
  const res = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: env.ML_CLIENT_ID,
      client_secret: env.ML_CLIENT_SECRET,
    }),
  });
  if (!res.ok) return null;
  const j = (await res.json()) as { access_token?: string; expires_in?: number };
  const tok = j.access_token ?? null;
  if (tok && env.PRICE_CACHE) {
    const ttl = Math.max(60, (j.expires_in ?? 21600) - 300);
    await env.PRICE_CACHE.put("ml:token", tok, { expirationTtl: ttl });
  }
  return tok;
}

async function mlBestOffer(
  token: string,
  name: string
): Promise<{ price: number; url: string; tookMs: number } | null> {
  const started = Date.now();
  const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(
    name
  )}&limit=10&condition=new&sort=price_asc`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
  });
  if (!res.ok) return null;
  const j = (await res.json()) as {
    results?: Array<{ price?: number; permalink?: string; available_quantity?: number }>;
  };
  const hit = (j.results ?? []).find(
    (r) => r && typeof r.price === "number" && r.price > 0 && (r.available_quantity ?? 1) > 0
  );
  if (!hit || typeof hit.price !== "number") return null;
  return {
    price: Math.round(hit.price),
    url: hit.permalink ?? "https://www.mercadolivre.com.br/",
    tookMs: Date.now() - started,
  };
}

// ── helpers ──────────────────────────────────────────────────────────────────
function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });
}

function corsPreflight(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
    },
  });
}
