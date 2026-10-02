import { RefreshCw, ExternalLink, Store, TrendingDown, Zap } from "lucide-react";
import type { Component, PriceResult, StoreOffer } from "../types";
import { CATEGORY_ART } from "../lib/icons";
import { CATEGORY_MAP } from "../data/categories";
import { money, installments } from "../lib/format";
import { useBuilder } from "../lib/store";

export function PriceCompare() {
  const build = useBuilder((s) => s.build);
  const prices = useBuilder((s) => s.prices);
  const pricingState = useBuilder((s) => s.pricingState);
  const refresh = useBuilder((s) => s.refreshPrices);

  const priced = Object.values(build).filter(
    (c): c is Component => Boolean(c) && c!.basePrice > 0
  );

  const loading = pricingState === "loading";

  const bestTotal = priced.reduce((sum, c) => {
    const best = prices[c.id]?.best;
    return sum + (best ? best.price : c.basePrice);
  }, 0);

  // Worst-case (max in-stock per item) to show potential savings.
  const worstTotal = priced.reduce((sum, c) => {
    const offers = prices[c.id]?.offers.filter((o) => o.inStock) ?? [];
    const max = offers.length ? Math.max(...offers.map((o) => o.price)) : c.basePrice;
    return sum + max;
  }, 0);
  const savings = Math.max(0, worstTotal - bestTotal);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400">
            Consultando <strong className="text-slate-200">5 lojas</strong> em paralelo
          </p>
          <p className="text-[11px] text-slate-500">Kabum!, Pichau, Terabyte, Amazon, Mercado Livre</p>
        </div>
        <button
          onClick={() => void refresh()}
          disabled={loading || priced.length === 0}
          className="btn-ghost !py-1.5 !px-3 text-xs"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Atualizar
        </button>
      </div>

      {priced.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-xs text-slate-500">
          Adicione componentes para comparar preços nas lojas.
        </div>
      ) : (
        <>
          {/* totals */}
          <div className="rounded-xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 to-transparent p-3">
            <div className="flex items-end justify-between">
              <div>
                <p className="label text-emerald-300/80">Total no menor preço</p>
                <p className="text-3xl font-extrabold text-emerald-300">{money(bestTotal)}</p>
              </div>
              {savings > 0 && (
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-300">
                    <TrendingDown size={13} /> economia de {money(savings)}
                  </span>
                  <p className="mt-1 text-[11px] text-slate-500">
                    vs. comprar tudo na loja mais cara
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* per-component rows */}
          <div className="space-y-2">
            {priced.map((c) =>
              loading && !prices[c.id] ? (
                <SkeletonRow key={c.id} comp={c} />
              ) : (
                <PriceRow key={c.id} comp={c} result={prices[c.id]} />
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}

function PriceRow({ comp, result }: { comp: Component; result?: PriceResult }) {
  const Art = CATEGORY_ART[comp.category];
  const accent = CATEGORY_MAP[comp.category].accent;
  const offers = result?.offers ?? [];
  const bestPrice = result?.best?.price;

  return (
    <div className="rounded-xl border border-white/8 bg-ink-850/60 p-3">
      <div className="mb-2 flex items-center gap-2.5">
        <div className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-ink-900/70">
          <Art className="h-7 w-7" accent={accent} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-slate-200">{comp.name}</p>
          <p className="text-[10px] text-slate-500">{CATEGORY_MAP[comp.category].label}</p>
        </div>
        {result?.cached && (
          <span className="chip !py-0 text-[9px] text-slate-500">cache</span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {offers.map((o) => (
          <OfferChip key={o.store} offer={o} isBest={o.price === bestPrice && o.inStock} />
        ))}
      </div>
    </div>
  );
}

function OfferChip({ offer, isBest }: { offer: StoreOffer; isBest: boolean }) {
  return (
    <a
      href={offer.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition ${
        isBest
          ? "border-emerald-400/50 bg-emerald-500/10"
          : offer.inStock
          ? "border-white/8 bg-ink-900/50 hover:border-white/20"
          : "border-white/5 bg-ink-900/30 opacity-55"
      }`}
    >
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ background: offer.storeColor }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span className="truncate text-xs font-medium text-slate-200">{offer.store}</span>
          {isBest && (
            <span className="rounded bg-emerald-500/20 px-1 text-[8px] font-bold uppercase text-emerald-300">
              menor
            </span>
          )}
        </div>
        <span className="flex items-center gap-1 text-[9px] text-slate-500">
          <Zap size={8} /> {offer.fetchedMs} ms
        </span>
      </div>
      {offer.inStock ? (
        <div className="text-right">
          <p className="text-xs font-bold text-slate-100">{money(offer.price)}</p>
          <p className="text-[8px] text-slate-500">{installments(offer.price)}</p>
        </div>
      ) : (
        <span className="text-[10px] font-medium text-slate-500">indisponível</span>
      )}
      <ExternalLink size={11} className="shrink-0 text-slate-600 group-hover:text-slate-300" />
    </a>
  );
}

function SkeletonRow({ comp }: { comp: Component }) {
  return (
    <div className="rounded-xl border border-white/8 bg-ink-850/60 p-3">
      <div className="mb-2 flex items-center gap-2.5">
        <div className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-ink-900/70">
          <Store size={15} className="text-slate-600" />
        </div>
        <p className="truncate text-xs font-semibold text-slate-300">{comp.name}</p>
      </div>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="shimmer h-8 rounded-lg bg-white/5" />
        ))}
      </div>
    </div>
  );
}
