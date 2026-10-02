import type { CategoryId } from "../types";

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  short: string;
  accent: string; // hex used by the SVG art + slot glow
  required: boolean;
  order: number;
  hint: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: "cpu", label: "Processador", short: "CPU", accent: "#5aa2ff", required: true, order: 1, hint: "O cérebro do PC. Define o socket da placa-mãe." },
  { id: "motherboard", label: "Placa-mãe", short: "Mobo", accent: "#a3e635", required: true, order: 2, hint: "A base que conecta tudo. Socket e DDR precisam bater com a CPU." },
  { id: "ram", label: "Memória RAM", short: "RAM", accent: "#22d3ee", required: true, order: 3, hint: "Memória de trabalho. DDR4 ou DDR5 conforme a placa." },
  { id: "gpu", label: "Placa de vídeo", short: "GPU", accent: "#fb7185", required: false, order: 4, hint: "Renderiza jogos e gráficos. Opcional se a CPU tiver vídeo integrado." },
  { id: "storage", label: "Armazenamento", short: "SSD", accent: "#c084fc", required: true, order: 5, hint: "Onde ficam sistema, jogos e arquivos." },
  { id: "psu", label: "Fonte", short: "PSU", accent: "#fbbf24", required: true, order: 6, hint: "Alimenta todos os componentes. Watt suficiente é essencial." },
  { id: "case", label: "Gabinete", short: "Case", accent: "#7dd3fc", required: true, order: 7, hint: "A caixa. Precisa caber placa-mãe, GPU e cooler." },
  { id: "cooler", label: "Cooler da CPU", short: "Cooler", accent: "#34d399", required: false, order: 8, hint: "Mantém a CPU fria. Ar ou water cooler (AIO)." },
];

export const CATEGORY_MAP: Record<CategoryId, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
) as Record<CategoryId, CategoryMeta>;
