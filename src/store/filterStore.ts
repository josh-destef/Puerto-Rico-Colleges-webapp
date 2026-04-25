import { create } from 'zustand';

export interface FilterState {
  // Ownership filters
  showPublic: boolean;
  showPrivateNonProfit: boolean;
  showPrivateForProfit: boolean;

  // Academic program filters
  filterNursing: boolean;
  filterEngineering: boolean;
  filterHumanities: boolean;
  filterBusiness: boolean;
  filterGrad: boolean;

  // Logic filters
  activeOnly: boolean;
  mainCampusOnly: boolean;

  // Selected campus
  selectedId: string | null;

  // Actions
  setFilter: (key: keyof Omit<FilterState, 'selectedId' | 'setFilter' | 'setSelectedId' | 'resetFilters'>, value: boolean) => void;
  setSelectedId: (id: string | null) => void;
  resetFilters: () => void;
}

const defaultState = {
  showPublic: true,
  showPrivateNonProfit: true,
  showPrivateForProfit: true,
  filterNursing: false,
  filterEngineering: false,
  filterHumanities: false,
  filterBusiness: false,
  filterGrad: false,
  activeOnly: false,
  mainCampusOnly: false,
  selectedId: null,
};

export const useFilterStore = create<FilterState>((set) => ({
  ...defaultState,
  setFilter: (key, value) => set((state) => ({ ...state, [key]: value })),
  setSelectedId: (id) => set({ selectedId: id }),
  resetFilters: () => set(defaultState),
}));
