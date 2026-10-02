import { Zap, Plug } from "lucide-react";
import type { Component, PowerEstimate, PsuSpec } from "../types";
import { CATEGORY_MAP } from "../data/categories";
import { watts } from "../lib/format";

export function PowerMeter({
  power,
  psu,
}: {
  power: PowerEstimate;
  psu?: Component;
}) {
  const psuW = psu ? (psu.spec as PsuSpec).wattage : 0;
  // Scale the bar to the larger of PSU capacity or recommended, with margin.
  const scaleMax = Math.max(psuW, power.recommendedPsu, power.total) * 1.05;
  const pct = (w: number) => `${Math.min(100, (w / scaleMax) * 100)}%`;

  const util = psuW ? Math.round((power.total / psuW) * 100) : null;
  const utilTone =
    util === null
      ? "text-slate-400"
      : util > 100
      ? "text-rose-300"
      : util > 85
      ? "text-amber-300"
      : "text-emerald-300";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/8 bg-ink-850/60 p-3">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Zap size={14} className="text-amber-400" />
            <span className="label">Consumo estimado</span>
          </div>
          <p className="mt-1 text-2xl font-extrabold text-slate-100">{watts(power.total)}</p>
          <p className="text-[11px] text-slate-500">pico sob carga</p>
        </div>
        <div className="rounded-xl border border-white/8 bg-ink-850/60 p-3">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Plug size={14} className="text-brand-400" />
            <span className="label">Fonte recomendada</span>
          </div>
          <p className="mt-1 text-2xl font-extrabold text-brand-300">{watts(power.recommendedPsu)}</p>
          <p className="text-[11px] text-slate-500">com folga saudável</p>
        </div>
      </div>

      {/* gauge */}
      <div>
        <div className="relative h-7 overflow-hidden rounded-full border border-white/10 bg-ink-900">
          {/* load fill */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
            style={{ width: pct(power.total) }}
          />
          {/* recommended marker */}
          <Marker position={pct(power.recommendedPsu)} label="rec." color="#5aa2ff" />
          {/* PSU capacity marker */}
          {psuW > 0 && <Marker position={pct(psuW)} label={`${psuW}W`} color="#34d399" solid />}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-slate-500">
          <span>0 W</span>
          <span>{Math.round(scaleMax)} W</span>
        </div>
      </div>

      {psu ? (
        <div className="flex items-center justify-between rounded-xl border border-white/8 bg-ink-850/60 px-3 py-2.5">
          <div>
            <p className="text-xs text-slate-400">{psu.name}</p>
            <p className="text-[11px] text-slate-500">Utilização no pico</p>
          </div>
          <p className={`text-xl font-extrabold ${utilTone}`}>{util}%</p>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-white/10 px-3 py-2.5 text-center text-xs text-slate-500">
          Selecione uma fonte para ver a folga de energia.
        </div>
      )}

      {/* breakdown */}
      <div>
        <p className="label mb-2">Consumo por componente</p>
        <div className="space-y-1.5">
          {power.breakdown.map((b, i) => {
            const accent =
              b.category in CATEGORY_MAP ? CATEGORY_MAP[b.category].accent : "#64748b";
            return (
              <div key={i} className="flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(b.watts / power.total) * 100}%`,
                      background: accent,
                    }}
                  />
                </div>
                <span className="w-32 truncate text-[11px] text-slate-400" title={b.label}>
                  {b.label}
                </span>
                <span className="w-12 text-right font-mono text-[11px] text-slate-300">
                  {b.watts}W
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Marker({
  position,
  label,
  color,
  solid,
}: {
  position: string;
  label: string;
  color: string;
  solid?: boolean;
}) {
  return (
    <div
      className="absolute inset-y-0 flex flex-col items-center"
      style={{ left: position, transform: "translateX(-50%)" }}
    >
      <div
        className="h-full w-0.5"
        style={{ background: color, opacity: solid ? 1 : 0.7, borderRadius: 2 }}
      />
      <span
        className="absolute -top-0.5 whitespace-nowrap rounded px-1 text-[9px] font-bold"
        style={{ color, background: "rgba(7,10,18,0.85)", transform: "translateY(-100%)" }}
      >
        {label}
      </span>
    </div>
  );
}
