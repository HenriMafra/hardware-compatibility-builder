import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Check, AlertTriangle, CircleAlert, ArrowUpDown, ShieldCheck } from "lucide-react";
import type { Build, CategoryId, Component } from "../types";
import { componentsOf } from "../data/catalog";
import { CATEGORY_MAP } from "../data/categories";
import { CATEGORY_ART } from "../lib/icons";
import { checkCompatibility } from "../lib/compatibility";
import { money } from "../lib/format";
import { useBuilder } from "../lib/store";
import { usePrefersReducedMotion } from "../lib/usePrefersReducedMotion";
import { Stars } from "./Stars";

type Sort = "relevance" | "price-asc" | "price-desc" | "rating";

function optionStatus(build: Build, option: Component) {
  const trial: Build = { ...build, [option.category]: option };
  const report = checkCompatibility(trial);
  const related = report.issues.filter(
    (i) => i.related.includes(option.category) && (i.level === "error" || i.level === "warning")
  );
  const err = related.find((i) => i.level === "error");
  if (err) return { level: "error" as const, reason: err.title };
  const warn = related.find((i) => i.level === "warning");
  if (warn) return { level: "warning" as const, reason: warn.title };
  return { level: "ok" as const, reason: "Compatível com a build" };
}

export function PartPicker() {
  const category = useBuilder((s) => s.pickerCategory);
  const build = useBuilder((s) => s.build);
  const select = useBuilder((s) => s.select);
  const close = useBuilder((s) => s.closePicker);

  const [sort, setSort] = useState<Sort>("relevance");
  const [onlyCompat, setOnlyCompat] = useState(false);
  const reduceMotion = usePrefersReducedMotion();
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  // Move focus into the dialog when it opens (keyboard users land inside it).
  useEffect(() => {
    if (category) closeBtnRef.current?.focus();
  }, [category]);

  // reset toolbar when category changes
  useEffect(() => {
    setSort("relevance");
    setOnlyCompat(false);
  }, [category]);

  const options = useMemo(() => {
    if (!category) return [];
    let list = componentsOf(category).map((c) => ({ comp: c, status: optionStatus(build, c) }));
    if (onlyCompat) list = list.filter((o) => o.status.level !== "error");
    switch (sort) {
      case "price-asc":
        list.sort((a, b) => a.comp.basePrice - b.comp.basePrice);
        break;
      case "price-desc":
        list.sort((a, b) => b.comp.basePrice - a.comp.basePrice);
        break;
      case "rating":
        list.sort((a, b) => b.comp.rating - a.comp.rating);
        break;
      default:
        // relevance: compatible first, then rating
        list.sort((a, b) => {
          const rank = (lvl: string) => (lvl === "error" ? 2 : lvl === "warning" ? 1 : 0);
          return rank(a.status.level) - rank(b.status.level) || b.comp.rating - a.comp.rating;
        });
    }
    return list;
  }, [category, build, sort, onlyCompat]);

  const meta = category ? CATEGORY_MAP[category] : null;
  const Art = category ? CATEGORY_ART[category as CategoryId] : null;
  const selectedId = category ? build[category]?.id : undefined;

  return (
    <AnimatePresence>
      {category && meta && (
        <motion.div
          className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/60 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0 }}
          onClick={close}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Escolher ${meta.label}`}
            className="flex h-full w-full max-w-4xl flex-col overflow-hidden border border-white/10 bg-ink-900 shadow-2xl sm:rounded-2xl"
            initial={reduceMotion ? false : { y: 24, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { y: 24, scale: 0.98, opacity: 0 }}
            transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* header */}
            <div className="flex items-center gap-3 border-b border-white/10 p-4">
              {Art && (
                <div className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-ink-850">
                  <Art className="h-8 w-8" accent={meta.accent} />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-base font-bold text-slate-100">
                  Escolher {meta.label}
                </h2>
                <p className="text-xs text-slate-500">{meta.hint}</p>
              </div>
              <button
                ref={closeBtnRef}
                onClick={close}
                className="btn-ghost !p-2"
                aria-label="Fechar"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            {/* toolbar */}
            <div className="flex flex-wrap items-center gap-2 border-b border-white/5 bg-ink-850/50 px-4 py-2.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <ArrowUpDown size={13} />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as Sort)}
                  className="rounded-lg border border-white/10 bg-ink-800 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-brand-400"
                >
                  <option value="relevance">Relevância</option>
                  <option value="price-asc">Menor preço</option>
                  <option value="price-desc">Maior preço</option>
                  <option value="rating">Melhor avaliação</option>
                </select>
              </div>
              <button
                onClick={() => setOnlyCompat((v) => !v)}
                className={`chip transition ${
                  onlyCompat ? "!border-emerald-400/40 !bg-emerald-400/10 !text-emerald-300" : ""
                }`}
              >
                <ShieldCheck size={13} /> Só compatíveis
              </button>
              <span className="ml-auto text-xs text-slate-500">{options.length} opções</span>
            </div>

            {/* list */}
            <div className="grid flex-1 grid-cols-1 gap-3 overflow-y-auto p-4 md:grid-cols-2">
              {options.map(({ comp, status }) => (
                <OptionCard
                  key={comp.id}
                  comp={comp}
                  status={status}
                  selected={comp.id === selectedId}
                  accent={meta.accent}
                  onSelect={() => select(comp)}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function OptionCard({
  comp,
  status,
  selected,
  accent,
  onSelect,
}: {
  comp: Component;
  status: { level: "ok" | "warning" | "error"; reason: string };
  selected: boolean;
  accent: string;
  onSelect: () => void;
}) {
  const Art = CATEGORY_ART[comp.category];
  const incompatible = status.level === "error";

  return (
    <div
      className={`relative flex flex-col rounded-xl border bg-ink-850/60 p-3 transition ${
        selected
          ? "border-brand-400/70 ring-1 ring-brand-400/40"
          : incompatible
          ? "border-rose-500/30 opacity-80"
          : "border-white/8 hover:border-white/20"
      }`}
    >
      <div className="flex gap-3">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg border border-white/10 bg-ink-900/70">
          <Art className="h-12 w-12" accent={accent} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight text-slate-100">{comp.name}</p>
          <div className="mt-1 flex items-center gap-2">
            <Stars rating={comp.rating} />
            <span className="text-[11px] text-slate-500">{comp.brand}</span>
          </div>
          <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-slate-400">{comp.blurb}</p>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {comp.highlights.slice(0, 4).map((h) => (
          <span key={h} className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-300">
            {h}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <CompatBadge level={status.level} reason={status.reason} />
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-100">
            {comp.basePrice > 0 ? money(comp.basePrice) : "incluso"}
          </span>
          <button
            onClick={onSelect}
            className={`btn !py-1.5 !px-3 text-xs ${
              selected ? "btn-ghost" : "btn-primary"
            }`}
          >
            {selected ? (
              <>
                <Check size={13} /> Selecionado
              </>
            ) : (
              "Selecionar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function CompatBadge({ level, reason }: { level: "ok" | "warning" | "error"; reason: string }) {
  if (level === "error")
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-300" title={reason}>
        <CircleAlert size={13} /> {reason}
      </span>
    );
  if (level === "warning")
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-300" title={reason}>
        <AlertTriangle size={13} /> {reason}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-300">
      <Check size={13} /> Compatível
    </span>
  );
}
