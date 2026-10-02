import type { Build, PriceResult } from "../types";
import { STORES, offerFor } from "./priceSim";

export interface PriceQueryItem {
  id: string;
  name: string;
  basePrice: number;
}

/**
 * Asks the edge function to price a list of components across every store at
 * once. Falls back to an in-browser simulation when the Pages Function isn't
 * running (e.g. `vite dev` without `wrangler pages dev`).
 */
export async function fetchPrices(items: PriceQueryItem[]): Promise<PriceResult[]> {
  if (items.length === 0) return [];
  try {
    const res = await fetch("/api/prices", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = (await res.json()) as { results: PriceResult[] };
    return data.results;
  } catch {
    return simulateLocally(items);
  }
}

function simulateLocally(items: PriceQueryItem[]): Promise<PriceResult[]> {
  // Mirror the edge behaviour: each store "responds" after its latency, and we
  // wait for the slowest, so the UI's live progress still feels real.
  return Promise.all(
    items.map(async (item) => {
      const offers = await Promise.all(
        STORES.map(
          (s) =>
            new Promise<ReturnType<typeof offerFor>>((resolve) => {
              const o = offerFor(item.id, item.name, item.basePrice, s);
              setTimeout(() => resolve(o), o.fetchedMs);
            })
        )
      );
      const mapped = offers.map((o) => ({
        store: o.store,
        storeColor: o.storeColor,
        price: o.price,
        inStock: o.inStock,
        url: o.url,
        installments: undefined,
        shipping: undefined,
        fetchedMs: o.fetchedMs,
      }));
      const inStock = mapped.filter((o) => o.inStock).sort((a, b) => a.price - b.price);
      return {
        componentId: item.id,
        offers: mapped.sort((a, b) => a.price - b.price),
        best: inStock[0] ?? null,
        cached: false,
      } as PriceResult;
    })
  );
}

// ── Saved builds (share links) ──────────────────────────────────────────────

export interface SavedBuild {
  code: string;
  items: Record<string, string>; // category -> componentId
  createdAt?: string;
}

export async function saveBuild(build: Build): Promise<string> {
  const items: Record<string, string> = {};
  for (const [cat, comp] of Object.entries(build)) {
    if (comp) items[cat] = comp.id;
  }
  try {
    const res = await fetch("/api/builds", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = (await res.json()) as { code: string };
    return data.code;
  } catch {
    // Local fallback: stash in localStorage with a short code.
    const code = localCode(JSON.stringify(items));
    localStorage.setItem(`pcforge:build:${code}`, JSON.stringify(items));
    return code;
  }
}

export async function loadBuild(code: string): Promise<Record<string, string> | null> {
  try {
    const res = await fetch(`/api/builds?code=${encodeURIComponent(code)}`);
    if (res.ok) {
      const data = (await res.json()) as { items?: unknown };
      const items = sanitizeItems(data.items);
      if (items) return items;
    }
  } catch {
    /* fall through to local */
  }
  // Local fallback: parse defensively so a corrupted entry never breaks the import.
  try {
    const local = localStorage.getItem(`pcforge:build:${code}`);
    if (!local) return null;
    return sanitizeItems(JSON.parse(local));
  } catch {
    return null;
  }
}

/**
 * Validates a shared/imported payload before it reaches the store. Anything that
 * isn't a plain object of `string -> string` is rejected (returns null), so a
 * malformed `?build=CODE` response or tampered localStorage can't crash the app.
 */
function sanitizeItems(raw: unknown): Record<string, string> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof key === "string" && typeof value === "string") out[key] = value;
  }
  return Object.keys(out).length > 0 ? out : null;
}

function localCode(seed: string): string {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) h = (h * 33) ^ seed.charCodeAt(i);
  return (h >>> 0).toString(36).slice(0, 7);
}
