import { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  Zap,
  Tags,
  Workflow,
  Share2,
  Check,
  Copy,
  CheckCircle2,
  AlertOctagon,
} from "lucide-react";
import type { Build, CategoryId, IssueLevel } from "./types";
import { CATEGORIES } from "./data/categories";
import { checkCompatibility } from "./lib/compatibility";
import { estimatePower } from "./lib/power";
import { money } from "./lib/format";
import { saveBuild, loadBuild } from "./lib/api";
import { useBuilder } from "./lib/store";

import { Header } from "./components/Header";
import { SlotCard } from "./components/SlotCard";
import { PartPicker } from "./components/PartPicker";
import { CompatibilityPanel } from "./components/CompatibilityPanel";
import { PowerMeter } from "./components/PowerMeter";
import { PriceCompare } from "./components/PriceCompare";
import { ConnectionDiagram } from "./components/ConnectionDiagram";
import { ScoreRing } from "./components/ScoreRing";

const SAMPLE: Record<string, string> = {
  cpu: "cpu-r7-7800x3d",
  motherboard: "mb-msi-b650-tomahawk",
  ram: "ram-corsair-ddr5-32-6000",
  gpu: "gpu-rtx-4070s",
  storage: "ssd-samsung-990pro-2tb",
  psu: "psu-corsair-rm850x",
  case: "case-nzxt-h7-flow",
  cooler: "cooler-nzxt-kraken-240",
};

type Tab = "compat" | "power" | "prices" | "diagram";

const TABS: { id: Tab; label: string; icon: typeof Zap }[] = [
  { id: "compat", label: "Compatibilidade", icon: ShieldCheck },
  { id: "power", label: "Energia", icon: Zap },
  { id: "prices", label: "Preços", icon: Tags },
  { id: "diagram", label: "Diagrama", icon: Workflow },
];

function worstStatus(
  build: Build,
  report: ReturnType<typeof checkCompatibility>,
  cat: CategoryId
): IssueLevel | null {
  if (!build[cat]) return null;
  const rel = report.issues.filter((i) => i.related.includes(cat));
  if (rel.some((i) => i.level === "error")) return "error";
  if (rel.some((i) => i.level === "warning")) return "warning";
  return "ok";
}

export default function App() {
  const build = useBuilder((s) => s.build);
  const prices = useBuilder((s) => s.prices);
  const openPicker = useBuilder((s) => s.openPicker);
  const remove = useBuilder((s) => s.remove);
  const clearBuild = useBuilder((s) => s.clearBuild);
  const setBuildFromItems = useBuilder((s) => s.setBuildFromItems);
  const refreshPrices = useBuilder((s) => s.refreshPrices);

  const [tab, setTab] = useState<Tab>("compat");
  const [share, setShare] = useState<{ loading: boolean; url?: string; copied?: boolean }>({
    loading: false,
  });
  const [toast, setToast] = useState<{ msg: string; tone: "ok" | "error" } | null>(null);

  // Auto-dismiss any toast after a few seconds.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const report = useMemo(() => checkCompatibility(build), [build]);
  const power = useMemo(() => estimatePower(build), [build]);

  const selectedCount = Object.values(build).filter(Boolean).length;

  const total = useMemo(() => {
    return Object.values(build)
      .filter((c) => c && c.basePrice > 0)
      .reduce((sum, c) => sum + (prices[c!.id]?.best?.price ?? c!.basePrice), 0);
  }, [build, prices]);

  // Load a shared build from ?build=CODE, otherwise price the persisted build.
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("build");
    if (code) {
      void loadBuild(code)
        .then((items) => {
          if (items) {
            setBuildFromItems(items);
            setToast({ msg: "Build compartilhada carregada.", tone: "ok" });
          } else {
            setToast({ msg: "Não encontramos uma build para esse link.", tone: "error" });
          }
        })
        .catch(() => setToast({ msg: "Não foi possível abrir a build compartilhada.", tone: "error" }));
    } else {
      void refreshPrices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset stale share link whenever the build changes.
  useEffect(() => setShare({ loading: false }), [build]);

  async function onShare() {
    setShare({ loading: true });
    try {
      const code = await saveBuild(build);
      const url = `${window.location.origin}/?build=${code}`;
      window.history.replaceState(null, "", `/?build=${code}`);
      let copied = false;
      try {
        await navigator.clipboard.writeText(url);
        copied = true;
      } catch {
        /* clipboard blocked */
      }
      setShare({ loading: false, url, copied });
      setToast({
        msg: copied ? "Link copiado para a área de transferência." : "Link gerado — copie abaixo.",
        tone: "ok",
      });
    } catch {
      setShare({ loading: false });
      setToast({ msg: "Não foi possível gerar o link de compartilhamento.", tone: "error" });
    }
  }

  return (
    <div className="min-h-screen pb-24 xl:pb-0">
      <Header
        onSample={() => setBuildFromItems(SAMPLE)}
        onClear={() => {
          if (
            selectedCount === 0 ||
            window.confirm("Limpar a build atual? Todos os componentes selecionados serão removidos.")
          ) {
            clearBuild();
          }
        }}
        hasBuild={selectedCount > 0}
      />

      {/* hero */}
      <section className="mx-auto max-w-7xl px-4 pt-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Monte seu PC, peça por peça.
          </h2>
          <p className="max-w-2xl text-sm text-slate-400">
            Escolha cada componente e veja, em tempo real, se tudo é{" "}
            <span className="text-emerald-300">compatível</span>, quanta{" "}
            <span className="text-amber-300">energia</span> consome, como as peças se{" "}
            <span className="text-brand-300">conectam</span> e o{" "}
            <span className="text-neon-cyan">menor preço</span> em várias lojas.
          </p>
        </div>
      </section>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 py-6 xl:grid-cols-12">
        {/* build slots */}
        <div className="xl:col-span-7">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Sua build
            </h3>
            <span className="text-xs text-slate-500">
              {selectedCount}/{CATEGORIES.length} componentes
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {CATEGORIES.map((meta) => (
              <SlotCard
                key={meta.id}
                meta={meta}
                component={build[meta.id]}
                status={worstStatus(build, report, meta.id)}
                price={build[meta.id] ? prices[build[meta.id]!.id] : undefined}
                onPick={() => openPicker(meta.id)}
                onRemove={() => remove(meta.id)}
              />
            ))}
          </div>
        </div>

        {/* side panel */}
        <div className="xl:col-span-5">
          <div className="xl:sticky xl:top-20 space-y-4">
            {/* summary */}
            <div className="card p-4">
              <div className="flex items-center gap-4">
                <ScoreRing score={report.score} buildable={report.buildable} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {report.buildable ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                        <CheckCircle2 size={13} /> Pronta para montar
                      </span>
                    ) : report.errors > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-xs font-semibold text-rose-300">
                        <AlertOctagon size={13} /> {report.errors}{" "}
                        {report.errors === 1 ? "conflito" : "conflitos"}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Em montagem…</span>
                    )}
                  </div>
                  <p className="mt-1 text-3xl font-extrabold text-white">{money(total)}</p>
                  <p className="text-[11px] text-slate-500">
                    no menor preço · ~{power.total} W de consumo
                  </p>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={onShare}
                  disabled={selectedCount === 0 || share.loading}
                  className="btn-primary flex-1 !py-2 text-sm"
                >
                  {share.copied ? <Check size={15} /> : <Share2 size={15} />}
                  {share.loading
                    ? "Gerando…"
                    : share.copied
                    ? "Link copiado!"
                    : "Compartilhar build"}
                </button>
              </div>

              {share.url && (
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-white/10 bg-ink-900/60 px-2.5 py-1.5">
                  <input
                    readOnly
                    value={share.url}
                    onFocus={(e) => e.currentTarget.select()}
                    className="flex-1 bg-transparent text-[11px] text-slate-300 outline-none"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(share.url!);
                      setShare((s) => ({ ...s, copied: true }));
                      setToast({ msg: "Link copiado para a área de transferência.", tone: "ok" });
                    }}
                    className="text-slate-400 hover:text-white"
                    title="Copiar link"
                    aria-label="Copiar link"
                  >
                    <Copy size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* tabs */}
            <div className="card overflow-hidden">
              <div className="flex border-b border-white/5">
                {TABS.map((t) => {
                  const Icon = t.icon;
                  const active = tab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className={`relative flex flex-1 items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-semibold transition ${
                        active ? "text-white" : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      <Icon size={14} />
                      <span className="hidden sm:inline">{t.label}</span>
                      {/* badge for problems on compat tab */}
                      {t.id === "compat" && report.errors + report.warnings > 0 && (
                        <span
                          className={`absolute right-1 top-1 h-1.5 w-1.5 rounded-full ${
                            report.errors > 0 ? "bg-rose-400" : "bg-amber-400"
                          }`}
                        />
                      )}
                      {active && (
                        <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-brand-400" />
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="p-4">
                {tab === "compat" && <CompatibilityPanel report={report} />}
                {tab === "power" && <PowerMeter power={power} psu={build.psu} />}
                {tab === "prices" && <PriceCompare />}
                {tab === "diagram" && <ConnectionDiagram build={build} report={report} />}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* mobile sticky summary */}
      {selectedCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-ink-900/95 px-4 py-2.5 backdrop-blur-md xl:hidden">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <ScoreRing score={report.score} size={42} stroke={5} buildable={report.buildable} />
            <div className="flex-1">
              <p className="text-lg font-extrabold leading-none text-white">{money(total)}</p>
              <p className="text-[10px] text-slate-500">
                {selectedCount}/{CATEGORIES.length} peças · ~{power.total} W
              </p>
            </div>
            <button onClick={onShare} className="btn-primary !py-1.5 !px-3 text-xs">
              <Share2 size={14} /> Compartilhar
            </button>
          </div>
        </div>
      )}

      <PartPicker />

      {/* toast feedback (copiar / compartilhar / importar) */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-0 top-3 z-[60] flex justify-center px-4"
        >
          <div
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium shadow-lg backdrop-blur-md ${
              toast.tone === "ok"
                ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
                : "border-rose-400/30 bg-rose-500/15 text-rose-200"
            }`}
          >
            {toast.tone === "ok" ? <CheckCircle2 size={15} /> : <AlertOctagon size={15} />}
            {toast.msg}
          </div>
        </div>
      )}

      <footer className="mx-auto max-w-7xl px-4 py-8 text-center text-[11px] text-slate-600">
        PCForge · feito com React + Cloudflare Pages + D1 · preços estimados (referência) — Mercado Livre real quando configurado
      </footer>
    </div>
  );
}
