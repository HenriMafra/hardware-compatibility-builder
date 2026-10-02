// ─────────────────────────────────────────────────────────────────────────────
// Domain types for the PC builder. These are shared between the UI and the
// compatibility / power engines. Specs are intentionally explicit so the
// compatibility checker can reason over real hardware constraints.
// ─────────────────────────────────────────────────────────────────────────────

export type CategoryId =
  | "cpu"
  | "motherboard"
  | "ram"
  | "gpu"
  | "storage"
  | "psu"
  | "case"
  | "cooler";

export type Socket = "AM5" | "AM4" | "LGA1700" | "LGA1851";
export type MemoryType = "DDR4" | "DDR5";
export type FormFactor = "ATX" | "Micro-ATX" | "Mini-ITX" | "E-ATX";
export type CoolerType = "air" | "aio";
export type StorageKind = "NVMe" | "SATA SSD" | "HDD";
export type PsuRating =
  | "80+ White"
  | "80+ Bronze"
  | "80+ Gold"
  | "80+ Platinum"
  | "80+ Titanium";

/** Brand-ish accent so cards can carry a manufacturer color. */
export type Brand =
  | "AMD"
  | "Intel"
  | "NVIDIA"
  | "Corsair"
  | "G.Skill"
  | "Kingston"
  | "ASUS"
  | "MSI"
  | "Gigabyte"
  | "NZXT"
  | "Lian Li"
  | "Samsung"
  | "WD"
  | "Seagate"
  | "Noctua"
  | "be quiet!"
  | "Cooler Master"
  | "EVGA"
  | "Generic";

export interface CpuSpec {
  socket: Socket;
  memoryType: MemoryType;
  cores: number;
  threads: number;
  baseClock: number; // GHz
  boostClock: number; // GHz
  tdp: number; // watts
  igpu: boolean; // has integrated graphics
  maxMemorySpeed: number; // MHz officially supported
  pcieGen: number;
}

export interface MotherboardSpec {
  socket: Socket;
  chipset: string;
  formFactor: FormFactor;
  memoryType: MemoryType;
  memorySlots: number;
  maxMemory: number; // GB
  maxMemorySpeed: number; // MHz (with OC/EXPO)
  m2Slots: number;
  pcieGen: number;
  wifi: boolean;
}

export interface RamSpec {
  type: MemoryType;
  speed: number; // MHz
  capacity: number; // total GB
  modules: number; // sticks
  casLatency: number;
  tdp: number;
  rgb: boolean;
}

export interface GpuSpec {
  vram: number; // GB
  length: number; // mm
  slots: number;
  tdp: number; // watts
  recommendedPsu: number; // watts
  powerConnectors: string; // e.g. "1x 12VHPWR" | "2x 8-pin" | "none"
  needs12vhpwr: boolean;
}

export interface StorageSpec {
  kind: StorageKind;
  capacity: number; // GB
  interface: string; // e.g. "PCIe 4.0 x4" | "SATA III"
  readSpeed: number; // MB/s
  tdp: number;
  m2: boolean;
}

export interface PsuSpec {
  wattage: number;
  rating: PsuRating;
  modular: "Full" | "Semi" | "No";
  pcie8pin: number;
  has12vhpwr: boolean;
  formFactor: "ATX" | "SFX";
}

export interface CaseSpec {
  supportedFormFactors: FormFactor[];
  maxGpuLength: number; // mm
  maxCoolerHeight: number; // mm
  radiatorSupport: number[]; // mm sizes, e.g. [240, 280, 360]
  fanMounts: number;
  psuFormFactor: "ATX" | "SFX";
}

export interface CoolerSpec {
  type: CoolerType;
  sockets: Socket[];
  tdpRating: number; // watts it can dissipate
  height?: number; // mm, air coolers
  radiatorSize?: number; // mm, AIO
  fanmm?: number;
  rgb: boolean;
}

export type SpecMap = {
  cpu: CpuSpec;
  motherboard: MotherboardSpec;
  ram: RamSpec;
  gpu: GpuSpec;
  storage: StorageSpec;
  psu: PsuSpec;
  case: CaseSpec;
  cooler: CoolerSpec;
};

export interface Component<C extends CategoryId = CategoryId> {
  id: string;
  category: C;
  brand: Brand;
  name: string;
  /** Short marketing-style blurb shown in the detail panel. */
  blurb: string;
  /** Base reference price in BRL — store adapters jitter around this. */
  basePrice: number;
  rating: number; // 0-5 editorial score
  releaseYear: number;
  spec: SpecMap[C];
  /** Highlight bullet specs for the card. */
  highlights: string[];
}

/** A build is one selected component per category (single-select v1). */
export type Build = Partial<Record<CategoryId, Component>>;

// ── Compatibility ────────────────────────────────────────────────────────────

export type IssueLevel = "error" | "warning" | "ok" | "info";

export interface CompatibilityIssue {
  id: string;
  level: IssueLevel;
  title: string;
  detail: string;
  /** Categories involved, used to highlight the relevant slots. */
  related: CategoryId[];
}

export interface CompatibilityReport {
  issues: CompatibilityIssue[];
  errors: number;
  warnings: number;
  /** 0-100 readiness score. */
  score: number;
  buildable: boolean;
}

// ── Power ────────────────────────────────────────────────────────────────────

export interface PowerEstimate {
  total: number; // estimated load wattage
  breakdown: { category: CategoryId; label: string; watts: number }[];
  recommendedPsu: number; // suggested PSU wattage with headroom
  headroomPct: number | null; // % headroom of selected PSU vs load
}

// ── Pricing (returned by the /api/prices Pages Function) ─────────────────────

export interface StoreOffer {
  store: string;
  storeColor: string;
  price: number;
  inStock: boolean;
  url: string;
  installments?: string; // e.g. "10x R$ 89,90"
  shipping?: string;
  fetchedMs: number; // simulated latency for the "live" feel
  real?: boolean; // true when the price came from a real source (Mercado Livre API)
}

export interface PriceResult {
  componentId: string;
  offers: StoreOffer[];
  best: StoreOffer | null;
  cached: boolean;
}
