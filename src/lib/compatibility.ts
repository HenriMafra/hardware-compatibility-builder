import type {
  Build,
  CategoryId,
  CaseSpec,
  CompatibilityIssue,
  CompatibilityReport,
  CoolerSpec,
  CpuSpec,
  GpuSpec,
  MotherboardSpec,
  PsuSpec,
  RamSpec,
  StorageSpec,
} from "../types";
import { estimatePower } from "./power";

const REQUIRED: CategoryId[] = ["cpu", "motherboard", "ram", "storage", "psu", "case"];

// Each rule reads the build and may push 0+ issues. Keeping them small and named
// makes the "why" obvious in the UI.
export function checkCompatibility(build: Build): CompatibilityReport {
  const issues: CompatibilityIssue[] = [];
  const push = (i: CompatibilityIssue) => issues.push(i);

  const cpu = build.cpu?.spec as CpuSpec | undefined;
  const mb = build.motherboard?.spec as MotherboardSpec | undefined;
  const ram = build.ram?.spec as RamSpec | undefined;
  const gpu = build.gpu?.spec as GpuSpec | undefined;
  const psu = build.psu?.spec as PsuSpec | undefined;
  const cs = build.case?.spec as CaseSpec | undefined;
  const cooler = build.cooler?.spec as CoolerSpec | undefined;

  // 1 ── CPU ↔ motherboard socket
  if (cpu && mb) {
    if (cpu.socket !== mb.socket) {
      push({
        id: "cpu-mb-socket",
        level: "error",
        title: "Socket incompatível",
        detail: `O ${build.cpu!.name} usa socket ${cpu.socket}, mas a ${build.motherboard!.name} é ${mb.socket}. Eles não encaixam.`,
        related: ["cpu", "motherboard"],
      });
    } else {
      push({
        id: "cpu-mb-socket-ok",
        level: "ok",
        title: `Socket ${cpu.socket} compatível`,
        detail: `CPU e placa-mãe usam o mesmo socket ${cpu.socket}.`,
        related: ["cpu", "motherboard"],
      });
    }
  }

  // 2 ── Memory generation: CPU ↔ mobo ↔ RAM (DDR4 vs DDR5)
  if (mb && ram) {
    if (mb.memoryType !== ram.type) {
      push({
        id: "ram-mb-gen",
        level: "error",
        title: "Geração de memória incompatível",
        detail: `A placa-mãe aceita ${mb.memoryType}, mas a memória é ${ram.type}. Slots de DDR4 e DDR5 são fisicamente diferentes.`,
        related: ["motherboard", "ram"],
      });
    } else {
      push({
        id: "ram-mb-gen-ok",
        level: "ok",
        title: `Memória ${ram.type} compatível`,
        detail: `A placa-mãe suporta ${mb.memoryType} e a RAM é ${ram.type}.`,
        related: ["motherboard", "ram"],
      });
    }
  }
  if (cpu && ram && cpu.memoryType !== ram.type) {
    push({
      id: "ram-cpu-gen",
      level: "error",
      title: "CPU não suporta essa memória",
      detail: `O ${build.cpu!.name} usa controladora ${cpu.memoryType}, mas a memória é ${ram.type}.`,
      related: ["cpu", "ram"],
    });
  }

  // 3 ── RAM capacity & slots
  if (mb && ram) {
    if (ram.capacity > mb.maxMemory) {
      push({
        id: "ram-capacity",
        level: "error",
        title: "Capacidade de RAM acima do limite",
        detail: `A placa suporta até ${mb.maxMemory} GB, mas o kit tem ${ram.capacity} GB.`,
        related: ["motherboard", "ram"],
      });
    }
    if (ram.modules > mb.memorySlots) {
      push({
        id: "ram-slots",
        level: "error",
        title: "Pentes demais para os slots",
        detail: `O kit tem ${ram.modules} módulos, mas a placa só tem ${mb.memorySlots} slots de memória.`,
        related: ["motherboard", "ram"],
      });
    }
    // Speed: RAM faster than the board officially does → runs downclocked.
    if (ram.speed > mb.maxMemorySpeed) {
      push({
        id: "ram-speed",
        level: "warning",
        title: "Memória mais rápida que a placa suporta",
        detail: `A RAM é ${ram.speed} MHz, mas a placa garante até ${mb.maxMemorySpeed} MHz. Ela funciona, porém em frequência menor (ou exige OC manual).`,
        related: ["motherboard", "ram"],
      });
    }
  }

  // 4 ── Motherboard form factor fits the case
  if (mb && cs) {
    if (!cs.supportedFormFactors.includes(mb.formFactor)) {
      push({
        id: "mb-case-form",
        level: "error",
        title: "Placa-mãe não cabe no gabinete",
        detail: `A placa é ${mb.formFactor}, mas o gabinete aceita: ${cs.supportedFormFactors.join(", ")}.`,
        related: ["motherboard", "case"],
      });
    } else {
      push({
        id: "mb-case-form-ok",
        level: "ok",
        title: `Gabinete aceita ${mb.formFactor}`,
        detail: `O formato da placa cabe no gabinete.`,
        related: ["motherboard", "case"],
      });
    }
  }

  // 5 ── GPU length vs case clearance
  if (gpu && cs) {
    if (gpu.length > cs.maxGpuLength) {
      push({
        id: "gpu-length",
        level: "error",
        title: "Placa de vídeo não cabe",
        detail: `A ${build.gpu!.name} tem ${gpu.length} mm, mas o gabinete comporta até ${cs.maxGpuLength} mm.`,
        related: ["gpu", "case"],
      });
    } else if (cs.maxGpuLength - gpu.length < 15) {
      push({
        id: "gpu-length-tight",
        level: "warning",
        title: "Folga apertada para a GPU",
        detail: `Sobram apenas ${cs.maxGpuLength - gpu.length} mm. Cabe, mas a montagem fica justa (atenção a cabos frontais).`,
        related: ["gpu", "case"],
      });
    }
  }

  // 6 ── Cooler ↔ CPU socket
  if (cooler && cpu) {
    if (!cooler.sockets.includes(cpu.socket)) {
      push({
        id: "cooler-socket",
        level: "error",
        title: "Cooler não suporta o socket",
        detail: `O ${build.cooler!.name} não traz suporte para ${cpu.socket}.`,
        related: ["cooler", "cpu"],
      });
    }
    if (cooler.tdpRating < cpuTDP(build)) {
      push({
        id: "cooler-tdp",
        level: "warning",
        title: "Cooler pode ser fraco para essa CPU",
        detail: `O cooler dissipa ~${cooler.tdpRating} W, mas o ${build.cpu!.name} pode pedir mais sob carga. Espere temperaturas e throttle mais altos.`,
        related: ["cooler", "cpu"],
      });
    }
  }

  // 7 ── Cooler clearance (air height / AIO radiator) vs case
  if (cooler && cs) {
    if (cooler.type === "air" && cooler.height && cooler.height > cs.maxCoolerHeight) {
      push({
        id: "cooler-height",
        level: "error",
        title: "Cooler muito alto para o gabinete",
        detail: `O cooler tem ${cooler.height} mm de altura, mas o gabinete aceita até ${cs.maxCoolerHeight} mm.`,
        related: ["cooler", "case"],
      });
    }
    if (cooler.type === "aio" && cooler.radiatorSize && !cs.radiatorSupport.includes(cooler.radiatorSize)) {
      push({
        id: "cooler-radiator",
        level: "error",
        title: "Radiador não cabe no gabinete",
        detail: `O radiador é de ${cooler.radiatorSize} mm, mas o gabinete suporta: ${cs.radiatorSupport.join(", ")} mm.`,
        related: ["cooler", "case"],
      });
    }
  }

  // 8 ── PSU form factor vs case
  if (psu && cs) {
    if (cs.psuFormFactor === "SFX" && psu.formFactor === "ATX") {
      push({
        id: "psu-form",
        level: "error",
        title: "Fonte ATX não cabe no gabinete",
        detail: `Este gabinete usa fonte SFX, mas a ${build.psu!.name} é ATX.`,
        related: ["psu", "case"],
      });
    } else if (cs.psuFormFactor === "ATX" && psu.formFactor === "SFX") {
      push({
        id: "psu-form-info",
        level: "info",
        title: "Fonte SFX em gabinete ATX",
        detail: `Funciona, mas pode exigir um adaptador/bracket SFX→ATX (muitas vezes incluso).`,
        related: ["psu", "case"],
      });
    }
  }

  // 9 ── PSU wattage vs estimated load
  if (psu) {
    const power = estimatePower(build);
    if (psu.wattage < power.total) {
      push({
        id: "psu-watt",
        level: "error",
        title: "Fonte insuficiente",
        detail: `O consumo estimado sob carga é ~${power.total} W, mas a fonte entrega ${psu.wattage} W. Risco de desligamento.`,
        related: ["psu"],
      });
    } else if (psu.wattage < power.total * 1.2) {
      push({
        id: "psu-watt-tight",
        level: "warning",
        title: "Pouca folga na fonte",
        detail: `Consumo ~${power.total} W para uma fonte de ${psu.wattage} W (menos de 20% de folga). Recomendado: ${power.recommendedPsu} W.`,
        related: ["psu"],
      });
    } else if (gpu && psu.wattage < gpu.recommendedPsu) {
      push({
        id: "psu-watt-gpu",
        level: "warning",
        title: "Abaixo do recomendado pela GPU",
        detail: `A ${build.gpu!.name} pede ${gpu.recommendedPsu} W; a fonte tem ${psu.wattage} W.`,
        related: ["psu", "gpu"],
      });
    } else {
      push({
        id: "psu-watt-ok",
        level: "ok",
        title: "Fonte com folga adequada",
        detail: `~${power.total} W estimados para ${psu.wattage} W de fonte. Folga saudável.`,
        related: ["psu"],
      });
    }
  }

  // 10 ── 12VHPWR connector for power-hungry GPUs
  if (gpu && psu && gpu.needs12vhpwr && !psu.has12vhpwr) {
    push({
      id: "gpu-12vhpwr",
      level: "warning",
      title: "GPU usa conector 12VHPWR",
      detail: `A ${build.gpu!.name} usa 12VHPWR e a fonte não tem nativo. Use o adaptador incluso na placa (ocupa ${gpu.powerConnectors}).`,
      related: ["gpu", "psu"],
    });
  }

  // 11 ── No display output (no GPU and no iGPU)
  if (cpu && !build.gpu && !cpu.igpu) {
    push({
      id: "no-video",
      level: "error",
      title: "Sem saída de vídeo",
      detail: `O ${build.cpu!.name} não tem vídeo integrado e não há placa de vídeo. Você não terá imagem.`,
      related: ["cpu", "gpu"],
    });
  }

  // 12 ── M.2 storage needs an M.2 slot
  if (build.storage && mb && (build.storage.spec as StorageSpec).m2 && mb.m2Slots < 1) {
    push({
      id: "storage-m2",
      level: "error",
      title: "Sem slot M.2",
      detail: `O SSD é M.2, mas a placa não tem slots M.2.`,
      related: ["storage", "motherboard"],
    });
  }

  // 13 ── Completeness (info-level nudges for required slots)
  for (const cat of REQUIRED) {
    if (!build[cat]) {
      push({
        id: `missing-${cat}`,
        level: "info",
        title: `Falta ${labelFor(cat)}`,
        detail: `Selecione ${labelFor(cat)} para completar a build.`,
        related: [cat],
      });
    }
  }

  const errors = issues.filter((i) => i.level === "error").length;
  const warnings = issues.filter((i) => i.level === "warning").length;
  const missing = REQUIRED.filter((c) => !build[c]).length;

  // Score: start at 100, subtract for problems and incompleteness.
  let score = 100;
  score -= errors * 25;
  score -= warnings * 8;
  score -= missing * 6;
  score = Math.max(0, Math.min(100, score));

  const buildable = errors === 0 && missing === 0;

  return { issues, errors, warnings, score, buildable };
}

function cpuTDP(build: Build): number {
  const c = build.cpu;
  if (!c) return 0;
  const s = c.spec as CpuSpec;
  // approximate sustained load for cooler sizing
  return c.brand === "Intel" ? Math.round(s.tdp * 1.6) : Math.round(s.tdp * 1.15);
}

function labelFor(cat: CategoryId): string {
  const map: Record<CategoryId, string> = {
    cpu: "um processador",
    motherboard: "uma placa-mãe",
    ram: "memória RAM",
    gpu: "uma placa de vídeo",
    storage: "armazenamento",
    psu: "uma fonte",
    case: "um gabinete",
    cooler: "um cooler",
  };
  return map[cat];
}
