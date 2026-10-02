import { AnimatePresence, motion } from "framer-motion";
import { CircleAlert, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { CompatibilityReport, IssueLevel } from "../types";
import { CATEGORY_MAP } from "../data/categories";

const ORDER: Record<IssueLevel, number> = { error: 0, warning: 1, ok: 2, info: 3 };

const STYLE: Record<
  IssueLevel,
  { icon: typeof Info; color: string; bg: string; border: string }
> = {
  error: { icon: CircleAlert, color: "text-rose-300", bg: "bg-rose-500/10", border: "border-rose-500/30" },
  warning: { icon: AlertTriangle, color: "text-amber-300", bg: "bg-amber-400/10", border: "border-amber-400/25" },
  ok: { icon: CheckCircle2, color: "text-emerald-300", bg: "bg-emerald-500/5", border: "border-emerald-500/20" },
  info: { icon: Info, color: "text-slate-400", bg: "bg-white/5", border: "border-white/10" },
};

export function CompatibilityPanel({ report }: { report: CompatibilityReport }) {
  const issues = [...report.issues].sort(
    (a, b) => ORDER[a.level] - ORDER[b.level] || a.title.localeCompare(b.title)
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Erros" value={report.errors} tone="rose" />
        <Stat label="Atenções" value={report.warnings} tone="amber" />
        <Stat
          label="Status"
          value={report.buildable ? "OK" : "—"}
          tone={report.buildable ? "emerald" : "slate"}
        />
      </div>

      {report.buildable && report.warnings === 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-200">
          <CheckCircle2 size={16} /> Tudo compatível — essa build está pronta para montar!
        </div>
      )}

      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {issues.map((issue) => {
            const s = STYLE[issue.level];
            const Icon = s.icon;
            return (
              <motion.li
                key={issue.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={`rounded-xl border ${s.border} ${s.bg} p-3`}
              >
                <div className="flex gap-2.5">
                  <Icon size={16} className={`${s.color} mt-0.5 shrink-0`} />
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${s.color}`}>{issue.title}</p>
                    <p className="mt-0.5 text-xs leading-snug text-slate-400">{issue.detail}</p>
                    {issue.related.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {issue.related.map((cat) => (
                          <span
                            key={cat}
                            className="rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                            style={{
                              color: CATEGORY_MAP[cat].accent,
                              background: `${CATEGORY_MAP[cat].accent}1a`,
                            }}
                          >
                            {CATEGORY_MAP[cat].label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: "rose" | "amber" | "emerald" | "slate";
}) {
  const color = {
    rose: "text-rose-300",
    amber: "text-amber-300",
    emerald: "text-emerald-300",
    slate: "text-slate-300",
  }[tone];
  return (
    <div className="rounded-xl border border-white/8 bg-ink-850/60 px-3 py-2 text-center">
      <p className={`text-xl font-extrabold ${color}`}>{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
    </div>
  );
}
