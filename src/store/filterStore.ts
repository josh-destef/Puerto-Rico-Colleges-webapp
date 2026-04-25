import { create } from 'zustand';

export interface FilterState {
  // App mode
  appMode: 'intro' | 'wizard' | 'results' | 'explore';

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

  // Search
  searchQuery: string;

  // Selected campus
  selectedId: string | null;

  // Tour state
  tourIndex: number;

  // Actions
  setFilter: (key: keyof Omit<FilterState,
    'selectedId' | 'appMode' | 'searchQuery' | 'tourIndex' |
    'setFilter' | 'setSelectedId' | 'setAppMode' | 'setTourIndex' | 'setSearchQuery' | 'resetFilters'
  >, value: boolean) => void;
  setSelectedId: (id: string | null) => void;
  setAppMode: (mode: FilterState['appMode']) => void;
  setTourIndex: (i: number) => void;
  setSearchQuery: (q: string) => void;
  resetFilters: () => void;
}

const defaultState = {
  appMode: 'intro' as const,
  showPublic: true,
  showPrivateNonProfit: true,
  showPrivateForProfit: true,
  filterNursing: false,
  filterEngineering: false,
  filterHumanities: false,
  filterBusiness: false,
  filterGrad: false,
  activeOnly: true,
  mainCampusOnly: false,
  searchQuery: '',
  selectedId: null,
  tourIndex: 0,
};

export const useFilterStore = create<FilterState>((set) => ({
  ...defaultState,
  setFilter: (key, value) => set((state) => ({ ...state, [key]: value })),
  setSelectedId: (id) => set({ selectedId: id }),
  setAppMode: (mode) => set({ appMode: mode }),
  setTourIndex: (i) => set({ tourIndex: i }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  resetFilters: () => set(defaultState),
}));
