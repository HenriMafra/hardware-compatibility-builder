import { Star } from "lucide-react";

export function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" title={`${rating.toFixed(1)} / 5`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          size={size}
          className={
            i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-slate-600"
          }
        />
      ))}
      <span className="ml-1 text-[11px] font-medium text-slate-400">{rating.toFixed(1)}</span>
    </span>
  );
}
