import { motion } from "framer-motion";
import { Plus, X, RefreshCw, AlertTriangle, CircleAlert, Check } from "lucide-react";
import type { Component, IssueLevel, PriceResult } from "../types";
import type { CategoryMeta } from "../data/categories";
import { CATEGORY_ART } from "../lib/icons";
import { money } from "../lib/format";
import { Stars } from "./Stars";

export function SlotCard({
  meta,
  component,
  status,
  price,
  onPick,
  onRemove,
}: {
  meta: CategoryMeta;
  component?: Component;
  status: IssueLevel | null; // worst issue level touching this slot
  price?: PriceResult;
  onPick: () => void;
  onRemove: () => void;
}) {
  const Art = CATEGORY_ART[meta.id];
  const ring =
    status === "error"
      ? "border-rose-500/60 shadow-[0_0_0_1px_rgba(251,113,133,0.4)]"
      : status === "warning"
      ? "border-amber-400/50 shadow-[0_0_0_1px_rgba(251,191,36,0.3)]"
      : component
      ? "border-emerald-400/30"
      : "border-white/5 hover:border-white/15";

  return (
    <motion.div layout className={`card group relative overflow-hidden border ${ring} transition`}>
      {/* accent glow */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-20 blur-3xl"
        style={{ background: meta.accent }}
      />
      <div className="flex items-start gap-3 p-4">
        <div
          className="grid h-16 w-16 shrink-0 place-items-center rounded-xl border border-white/10 bg-ink-900/60"
          style={{ boxShadow: `inset 0 0 24px ${meta.accent}22` }}
        >
          <Art className="h-12 w-12" accent={meta.accent} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="label" style={{ color: meta.accent }}>
              {meta.label}
            </span>
            {!meta.required && <span className="chip !px-1.5 !py-0 text-[9px]">opcional</span>}
            <StatusDot status={status} hasComponent={!!component} />
          </div>

          {component ? (
            <div className="mt-1">
              <p className="truncate text-sm font-semibold text-slate-100">{component.name}</p>
              <div className="mt-1 flex items-center gap-3">
                <Stars rating={component.rating} />
                <span className="text-xs text-slate-500">{component.brand}</span>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-xs text-slate-500">{meta.hint}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          {component && (
            <div className="text-right">
              {price?.best ? (
                <>
                  <p className="text-sm font-bold text-emerald-300">{money(price.best.price)}</p>
                  <p className="text-[10px] text-slate-500">menor • {price.best.store}</p>
                </>
              ) : component.basePrice > 0 ? (
                <p className="text-sm font-semibold text-slate-300">{money(component.basePrice)}</p>
              ) : (
                <p className="text-xs font-semibold text-emerald-300">incluso</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-white/5 px-4 py-2.5">
        {component ? (
          <>
            <button onClick={onPick} className="btn-ghost !py-1.5 !px-3 text-xs">
              <RefreshCw size={13} /> Trocar
            </button>
            <button
              onClick={onRemove}
              className="btn !py-1.5 !px-3 text-xs text-rose-300 hover:bg-rose-500/10"
            >
              <X size={13} /> Remover
            </button>
          </>
        ) : (
          <button
            onClick={onPick}
            className="btn w-full !py-1.5 text-xs font-semibold text-slate-200 ring-1 ring-inset ring-white/10 hover:bg-white/5"
            style={{ color: meta.accent }}
          >
            <Plus size={14} /> Adicionar {meta.short}
          </button>
        )}
      </div>
    </motion.div>
  );
}

function StatusDot({ status, hasComponent }: { status: IssueLevel | null; hasComponent: boolean }) {
  if (!hasComponent) return null;
  if (status === "error")
    return <CircleAlert size={14} className="text-rose-400" aria-label="erro de compatibilidade" />;
  if (status === "warning")
    return <AlertTriangle size={14} className="text-amber-400" aria-label="atenção" />;
  return <Check size={14} className="text-emerald-400" aria-label="ok" />;
}
