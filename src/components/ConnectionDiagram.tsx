import type {
  Build,
  CategoryId,
  CompatibilityReport,
  CoolerSpec,
  CpuSpec,
  GpuSpec,
  IssueLevel,
  RamSpec,
} from "../types";
import { CATEGORY_ART } from "../lib/icons";
import { CATEGORY_MAP } from "../data/categories";

type Pt = { x: number; y: number };
const NODE_W = 104;
const NODE_H = 64;

// center positions of each node on the 600x400 canvas
const POS: Partial<Record<CategoryId, Pt>> = {
  cooler: { x: 176, y: 44 },
  cpu: { x: 176, y: 132 },
  motherboard: { x: 300, y: 214 },
  ram: { x: 428, y: 118 },
  storage: { x: 486, y: 226 },
  gpu: { x: 300, y: 340 },
  psu: { x: 104, y: 326 },
};

interface Edge {
  a: CategoryId;
  b: CategoryId;
  label: (b: Build) => string;
}

const EDGES: Edge[] = [
  {
    a: "cooler",
    b: "cpu",
    label: (x) => ((x.cooler?.spec as CoolerSpec | undefined)?.type === "aio" ? "AIO" : "Air"),
  },
  { a: "cpu", b: "motherboard", label: (x) => (x.cpu?.spec as CpuSpec | undefined)?.socket ?? "socket" },
  { a: "ram", b: "motherboard", label: (x) => (x.ram?.spec as RamSpec | undefined)?.type ?? "DIMM" },
  { a: "storage", b: "motherboard", label: () => "M.2 / SATA" },
  { a: "gpu", b: "motherboard", label: () => "PCIe x16" },
  { a: "psu", b: "motherboard", label: () => "24-pin" },
  { a: "psu", b: "cpu", label: () => "EPS 8-pin" },
  {
    a: "psu",
    b: "gpu",
    label: (x) => ((x.gpu?.spec as GpuSpec | undefined)?.needs12vhpwr ? "12VHPWR" : "PCIe"),
  },
];

const LEVEL_COLOR: Record<IssueLevel | "missing", string> = {
  error: "#fb7185",
  warning: "#fbbf24",
  ok: "#34d399",
  info: "#475569",
  missing: "#334155",
};

function edgeLevel(report: CompatibilityReport, build: Build, a: CategoryId, b: CategoryId) {
  if (!build[a] || !build[b]) return "missing" as const;
  const rel = report.issues.filter(
    (i) => i.related.includes(a) && i.related.includes(b)
  );
  if (rel.some((i) => i.level === "error")) return "error" as const;
  if (rel.some((i) => i.level === "warning")) return "warning" as const;
  return "ok" as const;
}

function nodeLevel(report: CompatibilityReport, build: Build, cat: CategoryId) {
  if (!build[cat]) return "missing" as const;
  const rel = report.issues.filter((i) => i.related.includes(cat));
  if (rel.some((i) => i.level === "error")) return "error" as const;
  if (rel.some((i) => i.level === "warning")) return "warning" as const;
  return "ok" as const;
}

export function ConnectionDiagram({
  build,
  report,
}: {
  build: Build;
  report: CompatibilityReport;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/8 bg-ink-900/50 p-1">
      <svg viewBox="0 0 600 400" className="w-full" xmlns="http://www.w3.org/2000/svg">
        {/* grid backdrop */}
        <defs>
          <pattern id="diaggrid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M24 0H0V24" fill="none" stroke="rgba(255,255,255,0.035)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="600" height="400" fill="url(#diaggrid)" />

        {/* case frame */}
        <rect
          x="16"
          y="16"
          width="568"
          height="368"
          rx="16"
          fill="none"
          stroke={build.case ? CATEGORY_MAP.case.accent : "#334155"}
          strokeWidth="1.5"
          strokeDasharray={build.case ? "0" : "6 6"}
          opacity="0.5"
        />
        <text x="30" y="36" fontSize="11" fill="#7dd3fc" fontWeight="600">
          {build.case ? `Gabinete · ${build.case.name}` : "Gabinete não selecionado"}
        </text>

        {/* edges */}
        {EDGES.map((e) => {
          const pa = POS[e.a];
          const pb = POS[e.b];
          if (!pa || !pb) return null;
          const level = edgeLevel(report, build, e.a, e.b);
          const color = LEVEL_COLOR[level];
          const mx = (pa.x + pb.x) / 2;
          const my = (pa.y + pb.y) / 2;
          const active = level !== "missing";
          return (
            <g key={`${e.a}-${e.b}`}>
              <line
                x1={pa.x}
                y1={pa.y}
                x2={pb.x}
                y2={pb.y}
                stroke={color}
                strokeWidth={active ? 2.5 : 1.5}
                strokeDasharray={active ? "0" : "5 5"}
                opacity={active ? 0.9 : 0.4}
              />
              {active && (
                <circle r="3" fill={color}>
                  <animateMotion dur="1.6s" repeatCount="indefinite" path={`M${pa.x},${pa.y} L${pb.x},${pb.y}`} />
                </circle>
              )}
              <g>
                <rect x={mx - 30} y={my - 9} width="60" height="18" rx="9" fill="#0b0f1a" stroke={color} strokeWidth="1" opacity="0.95" />
                <text x={mx} y={my + 3.5} textAnchor="middle" fontSize="9.5" fill={color} fontWeight="600">
                  {e.label(build)}
                </text>
              </g>
            </g>
          );
        })}

        {/* nodes */}
        {(Object.keys(POS) as CategoryId[]).map((cat) => {
          const p = POS[cat]!;
          const meta = CATEGORY_MAP[cat];
          const comp = build[cat];
          const level = nodeLevel(report, build, cat);
          const Art = CATEGORY_ART[cat];
          const border = LEVEL_COLOR[level];
          return (
            <foreignObject
              key={cat}
              x={p.x - NODE_W / 2}
              y={p.y - NODE_H / 2}
              width={NODE_W}
              height={NODE_H}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: 12,
                  border: `1.5px solid ${border}`,
                  background: "rgba(15,20,34,0.92)",
                  boxShadow: comp ? `0 0 18px -6px ${border}` : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 8px",
                  backdropFilter: "blur(2px)",
                }}
              >
                <Art className="h-8 w-8 shrink-0" accent={meta.accent} />
                <div style={{ minWidth: 0, lineHeight: 1.15 }}>
                  <div style={{ fontSize: 9, color: meta.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>
                    {meta.short}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: comp ? "#e2e8f0" : "#64748b",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: 64,
                    }}
                    title={comp?.name ?? ""}
                  >
                    {comp ? comp.name : "vazio"}
                  </div>
                </div>
              </div>
            </foreignObject>
          );
        })}
      </svg>

      {/* legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 border-t border-white/5 px-3 py-2 text-[10px] text-slate-400">
        <Legend color={LEVEL_COLOR.ok} label="compatível" />
        <Legend color={LEVEL_COLOR.warning} label="atenção" />
        <Legend color={LEVEL_COLOR.error} label="conflito" />
        <Legend color={LEVEL_COLOR.missing} label="faltando" dashed />
      </div>
    </div>
  );
}

function Legend({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-0 w-5 border-t-2"
        style={{ borderColor: color, borderStyle: dashed ? "dashed" : "solid" }}
      />
      {label}
    </span>
  );
}
