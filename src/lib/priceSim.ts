// ─────────────────────────────────────────────────────────────────────────────
// Deterministic price simulator shared by the client fallback and the edge
// Pages Function. Each store derives a stable price from the component id, so
// reloads are consistent. This is where a REAL retailer scraper/API adapter
// would plug in (see functions/api/prices.ts and README → "Preços reais").
// ─────────────────────────────────────────────────────────────────────────────

export interface SimStore {
  store: string;
  color: string;
  /** Typical price multiplier vs reference basePrice. */
  bias: number;
  /** Base simulated latency in ms (the edge function awaits this). */
  latency: number;
  domain: string;
}

export const STORES: SimStore[] = [
  { store: "Kabum!", color: "#ff6500", bias: 1.0, latency: 220, domain: "kabum.com.br" },
  { store: "Pichau", color: "#e4002b", bias: 0.985, latency: 260, domain: "pichau.com.br" },
  { store: "Terabyte", color: "#16a34a", bias: 0.97, latency: 300, domain: "terabyteshop.com.br" },
  { store: "Amazon", color: "#ff9900", bias: 1.03, latency: 180, domain: "amazon.com.br" },
  { store: "Mercado Livre", color: "#ffe600", bias: 1.01, latency: 240, domain: "mercadolivre.com.br" },
];

// Small deterministic string hash → 0..1
export function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // unsigned → 0..1
  return ((h >>> 0) % 100000) / 100000;
}

export interface SimOffer {
  store: string;
  storeColor: string;
  price: number;
  inStock: boolean;
  url: string;
  fetchedMs: number;
}

export function offerFor(
  componentId: string,
  componentName: string,
  basePrice: number,
  s: SimStore
): SimOffer {
  const r = hash01(`${componentId}:${s.store}`);
  // ±9% spread around the store bias
  const variance = 0.91 + r * 0.18;
  const price = Math.round((basePrice * s.bias * variance) / 10) * 10;
  // ~12% chance a given store is out of stock (but never for free/stock items)
  const inStock = basePrice === 0 ? true : hash01(`${componentId}:${s.store}:stk`) > 0.12;
  const jitter = Math.round(hash01(`${componentId}:${s.store}:lat`) * 220);
  const query = encodeURIComponent(componentName);
  return {
    store: s.store,
    storeColor: s.color,
    price,
    inStock,
    url: `https://www.${s.domain}/busca?q=${query}`,
    fetchedMs: s.latency + jitter,
  };
}
