export function ScoreRing({
  score,
  size = 76,
  stroke = 8,
  buildable,
}: {
  score: number;
  size?: number;
  stroke?: number;
  buildable?: boolean;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const color = score >= 85 ? "#34d399" : score >= 55 ? "#fbbf24" : "#fb7185";

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.4s" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="text-lg font-extrabold" style={{ color }}>
          {Math.round(score)}
        </span>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
          {buildable ? "pronto" : "score"}
        </span>
      </div>
    </div>
  );
}
