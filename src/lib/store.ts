import { create } from "zustand";
import type { Build, CategoryId, Component, PriceResult } from "../types";
import { BY_ID } from "../data/catalog";
import { fetchPrices } from "./api";

const LS_KEY = "pcforge:current-build";

type PricingState = "idle" | "loading" | "done";

interface BuilderState {
  build: Build;
  pickerCategory: CategoryId | null;
  prices: Record<string, PriceResult>;
  pricingState: PricingState;
  lastPricedAt: number | null;

  select: (component: Component) => void;
  remove: (category: CategoryId) => void;
  openPicker: (category: CategoryId) => void;
  closePicker: () => void;
  clearBuild: () => void;
  setBuildFromItems: (items: Record<string, string>) => void;
  refreshPrices: () => Promise<void>;
}

function persist(build: Build) {
  const items: Record<string, string> = {};
  for (const [cat, comp] of Object.entries(build)) if (comp) items[cat] = comp.id;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  } catch {
    /* ignore quota / private mode */
  }
}

function loadPersisted(): Build {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const items = JSON.parse(raw) as Record<string, string>;
    return itemsToBuild(items);
  } catch {
    return {};
  }
}

function itemsToBuild(items: Record<string, string>): Build {
  const build: Build = {};
  for (const [cat, id] of Object.entries(items)) {
    const comp = BY_ID[id];
    if (comp && comp.category === cat) build[cat as CategoryId] = comp;
  }
  return build;
}

export const useBuilder = create<BuilderState>((set, get) => ({
  build: loadPersisted(),
  pickerCategory: null,
  prices: {},
  pricingState: "idle",
  lastPricedAt: null,

  select: (component) => {
    const build = { ...get().build, [component.category]: component };
    persist(build);
    set({ build, pickerCategory: null });
    void get().refreshPrices();
  },

  remove: (category) => {
    const build = { ...get().build };
    delete build[category];
    persist(build);
    set({ build });
    void get().refreshPrices();
  },

  openPicker: (category) => set({ pickerCategory: category }),
  closePicker: () => set({ pickerCategory: null }),

  clearBuild: () => {
    persist({});
    set({ build: {}, prices: {}, pricingState: "idle", lastPricedAt: null });
  },

  setBuildFromItems: (items) => {
    const build = itemsToBuild(items);
    persist(build);
    set({ build });
    void get().refreshPrices();
  },

  refreshPrices: async () => {
    const build = get().build;
    const items = Object.values(build)
      .filter((c): c is Component => Boolean(c) && c!.basePrice > 0)
      .map((c) => ({ id: c.id, name: c.name, basePrice: c.basePrice }));
    if (items.length === 0) {
      set({ prices: {}, pricingState: "idle", lastPricedAt: null });
      return;
    }
    set({ pricingState: "loading" });
    const results = await fetchPrices(items);
    const map: Record<string, PriceResult> = {};
    for (const r of results) map[r.componentId] = r;
    set({ prices: map, pricingState: "done", lastPricedAt: Date.now() });
  },
}));
