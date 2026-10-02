import type {
  Build,
  Component,
  CoolerSpec,
  CpuSpec,
  GpuSpec,
  PowerEstimate,
  PsuSpec,
  RamSpec,
  StorageSpec,
} from "../types";

// Coerces any wattage to a finite, non-negative integer. Guards the estimate
// against a malformed/non-finite spec value (e.g. a tampered shared build) ever
// turning the total into NaN/Infinity and breaking the meter.
function safeWatts(n: number): number {
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}

// Peak draw is higher than rated TDP, especially for Intel "K" turbo. We model
// a realistic load so the PSU recommendation has sane headroom.
function cpuPeak(c: Component<"cpu">): number {
  const s = c.spec as CpuSpec;
  const factor = c.brand === "Intel" ? 1.9 : 1.35;
  return safeWatts(Math.max(s.tdp, s.tdp * factor));
}

const BASE_OVERHEAD = 70; // mobo + fans + RGB + USB devices

export function estimatePower(build: Build): PowerEstimate {
  const breakdown: PowerEstimate["breakdown"] = [];

  breakdown.push({ category: "case", label: "Placa-mãe + ventoinhas + periféricos", watts: BASE_OVERHEAD });

  if (build.cpu) {
    breakdown.push({ category: "cpu", label: build.cpu.name, watts: cpuPeak(build.cpu as Component<"cpu">) });
  }
  if (build.gpu) {
    const g = build.gpu.spec as GpuSpec;
    breakdown.push({ category: "gpu", label: build.gpu.name, watts: safeWatts(g.tdp * 1.1) });
  }
  if (build.ram) {
    breakdown.push({ category: "ram", label: build.ram.name, watts: safeWatts((build.ram.spec as RamSpec).tdp) });
  }
  if (build.storage) {
    breakdown.push({
      category: "storage",
      label: build.storage.name,
      watts: safeWatts((build.storage.spec as StorageSpec).tdp),
    });
  }
  if (build.cooler) {
    const watts = (build.cooler.spec as CoolerSpec).type === "aio" ? 18 : 6;
    breakdown.push({ category: "cooler", label: build.cooler.name, watts });
  }

  const total = breakdown.reduce((sum, b) => sum + b.watts, 0);

  // Recommend ~40% headroom (PSUs are most efficient ~50-60% load), and never
  // below the GPU maker's recommendation.
  const gpuRec = build.gpu ? (build.gpu.spec as GpuSpec).recommendedPsu : 0;
  const recommendedPsu = Math.max(roundUp50(Math.round(total * 1.4)), gpuRec);

  const headroomPct = build.psu
    ? Math.round((((build.psu.spec as PsuSpec).wattage - total) / total) * 100)
    : null;

  return { total, breakdown, recommendedPsu, headroomPct };
}

function roundUp50(n: number): number {
  return Math.ceil(n / 50) * 50;
}
