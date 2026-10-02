import type { CategoryId } from "../types";

// Hand-drawn SVG illustrations per category. They scale crisply and carry the
// "product image" feel without shipping heavy bitmaps. `accent` tints the art.
type Props = { className?: string; accent?: string };

function Frame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg" fill="none">
      {children}
    </svg>
  );
}

const CpuArt = ({ className, accent = "#5aa2ff" }: Props) => (
  <Frame className={className}>
    <rect x="34" y="34" width="52" height="52" rx="6" fill="#0f1422" stroke={accent} strokeWidth="2.5" />
    <rect x="46" y="46" width="28" height="28" rx="3" fill={accent} opacity="0.18" stroke={accent} strokeWidth="1.5" />
    <text x="60" y="64" textAnchor="middle" fontSize="9" fill={accent} fontFamily="monospace">CPU</text>
    {Array.from({ length: 6 }).map((_, i) => (
      <g key={i} stroke={accent} strokeWidth="2.5" strokeLinecap="round">
        <line x1={42 + i * 7} y1="34" x2={42 + i * 7} y2="26" />
        <line x1={42 + i * 7} y1="86" x2={42 + i * 7} y2="94" />
        <line x1="34" y1={42 + i * 7} x2="26" y2={42 + i * 7} />
        <line x1="86" y1={42 + i * 7} x2="94" y2={42 + i * 7} />
      </g>
    ))}
  </Frame>
);

const MoboArt = ({ className, accent = "#a3e635" }: Props) => (
  <Frame className={className}>
    <rect x="20" y="20" width="80" height="80" rx="5" fill="#0f1422" stroke={accent} strokeWidth="2.5" />
    <rect x="30" y="30" width="22" height="22" rx="3" fill={accent} opacity="0.2" stroke={accent} strokeWidth="1.5" />
    {Array.from({ length: 4 }).map((_, i) => (
      <rect key={i} x={58 + i * 6} y="30" width="3.5" height="40" rx="1.5" fill={accent} opacity="0.55" />
    ))}
    <rect x="30" y="78" width="60" height="6" rx="3" fill={accent} opacity="0.4" />
    <rect x="30" y="60" width="20" height="10" rx="2" fill={accent} opacity="0.25" stroke={accent} strokeWidth="1" />
    <circle cx="86" cy="40" r="3" fill={accent} />
  </Frame>
);

const RamArt = ({ className, accent = "#22d3ee" }: Props) => (
  <Frame className={className}>
    {[36, 56].map((x) => (
      <g key={x}>
        <rect x={x} y="24" width="28" height="72" rx="3" fill="#0f1422" stroke={accent} strokeWidth="2.5" />
        <rect x={x + 4} y="30" width="20" height="20" rx="2" fill={accent} opacity="0.18" />
        {Array.from({ length: 9 }).map((_, i) => (
          <rect key={i} x={x + 3 + i * 2.6} y="90" width="1.6" height="6" fill={accent} opacity="0.7" />
        ))}
      </g>
    ))}
  </Frame>
);

const GpuArt = ({ className, accent = "#fb7185" }: Props) => (
  <Frame className={className}>
    <rect x="16" y="42" width="88" height="42" rx="5" fill="#0f1422" stroke={accent} strokeWidth="2.5" />
    <circle cx="44" cy="63" r="13" fill="none" stroke={accent} strokeWidth="2" />
    <circle cx="44" cy="63" r="5" fill={accent} opacity="0.5" />
    <circle cx="78" cy="63" r="13" fill="none" stroke={accent} strokeWidth="2" />
    <circle cx="78" cy="63" r="5" fill={accent} opacity="0.5" />
    <rect x="24" y="84" width="14" height="8" rx="1.5" fill={accent} opacity="0.4" />
    <rect x="92" y="36" width="8" height="6" rx="1.5" fill={accent} opacity="0.7" />
  </Frame>
);

const StorageArt = ({ className, accent = "#c084fc" }: Props) => (
  <Frame className={className}>
    <rect x="22" y="50" width="76" height="20" rx="3" fill="#0f1422" stroke={accent} strokeWidth="2.5" />
    <rect x="28" y="55" width="18" height="10" rx="2" fill={accent} opacity="0.3" />
    <rect x="50" y="56" width="30" height="3" rx="1.5" fill={accent} opacity="0.5" />
    <rect x="50" y="62" width="22" height="3" rx="1.5" fill={accent} opacity="0.35" />
    <circle cx="90" cy="60" r="3" fill={accent} />
    {Array.from({ length: 6 }).map((_, i) => (
      <rect key={i} x={24 + i * 2.4} y="70" width="1.4" height="5" fill={accent} opacity="0.6" />
    ))}
  </Frame>
);

const PsuArt = ({ className, accent = "#fbbf24" }: Props) => (
  <Frame className={className}>
    <rect x="22" y="34" width="76" height="52" rx="5" fill="#0f1422" stroke={accent} strokeWidth="2.5" />
    <circle cx="44" cy="60" r="15" fill="none" stroke={accent} strokeWidth="2" />
    {Array.from({ length: 8 }).map((_, i) => {
      const a = (i / 8) * Math.PI * 2;
      return (
        <line key={i} x1="44" y1="60" x2={44 + Math.cos(a) * 14} y2={60 + Math.sin(a) * 14} stroke={accent} strokeWidth="2" opacity="0.6" />
      );
    })}
    <rect x="70" y="46" width="20" height="6" rx="2" fill={accent} opacity="0.45" />
    <rect x="70" y="58" width="20" height="6" rx="2" fill={accent} opacity="0.3" />
    <rect x="70" y="70" width="14" height="6" rx="2" fill={accent} opacity="0.3" />
  </Frame>
);

const CaseArt = ({ className, accent = "#7dd3fc" }: Props) => (
  <Frame className={className}>
    <rect x="34" y="18" width="52" height="84" rx="5" fill="#0f1422" stroke={accent} strokeWidth="2.5" />
    <rect x="40" y="24" width="40" height="50" rx="3" fill={accent} opacity="0.08" stroke={accent} strokeWidth="1" />
    <rect x="44" y="30" width="20" height="10" rx="2" fill={accent} opacity="0.3" />
    <circle cx="71" cy="52" r="9" fill="none" stroke={accent} strokeWidth="1.5" />
    <circle cx="71" cy="52" r="3" fill={accent} opacity="0.6" />
    {Array.from({ length: 4 }).map((_, i) => (
      <circle key={i} cx="40" cy={84 + 0} r="0" />
    ))}
    <rect x="40" y="80" width="40" height="3" rx="1.5" fill={accent} opacity="0.3" />
    <rect x="40" y="88" width="40" height="3" rx="1.5" fill={accent} opacity="0.2" />
    <circle cx="44" cy="22" r="1.5" fill={accent} />
  </Frame>
);

const CoolerArt = ({ className, accent = "#34d399" }: Props) => (
  <Frame className={className}>
    <circle cx="60" cy="60" r="34" fill="#0f1422" stroke={accent} strokeWidth="2.5" />
    <circle cx="60" cy="60" r="8" fill={accent} opacity="0.4" />
    {Array.from({ length: 7 }).map((_, i) => {
      const a = (i / 7) * Math.PI * 2;
      return (
        <path
          key={i}
          d={`M60 60 Q ${60 + Math.cos(a) * 14} ${60 + Math.sin(a) * 14} ${60 + Math.cos(a + 0.6) * 30} ${60 + Math.sin(a + 0.6) * 30}`}
          stroke={accent}
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.7"
          fill="none"
        />
      );
    })}
  </Frame>
);

export const CATEGORY_ART: Record<CategoryId, (p: Props) => JSX.Element> = {
  cpu: CpuArt,
  motherboard: MoboArt,
  ram: RamArt,
  gpu: GpuArt,
  storage: StorageArt,
  psu: PsuArt,
  case: CaseArt,
  cooler: CoolerArt,
};
