import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Mode = `quick_${'en-ja' | 'ja-en'}` | `deep_dive_${'en-ja' | 'ja-en'}`;

export type WordStatus = 'new' | 'learning' | 'mastered';

export interface WordMeta {
  status?: WordStatus;
  isFavorite?: boolean;
  addedAt?: number;
}

export interface DrillDownCache {
  type: 'further' | 'question';
  context: string;
  answer: string;
}

export interface WordCache {
  [modeKey: string]: string | DrillDownCache[] | undefined;
  drills?: DrillDownCache[];
}

interface AppState {
  searchHistory: string[];
  wordData: { [word: string]: WordCache };
  metadata: { [word: string]: WordMeta };
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  addWordToHistory: (word: string) => void;
  setWordData: (word: string, mode: Mode, data: string) => void;
  addDrillDownData: (word: string, drillData: DrillDownCache) => void;
  removeWordFromHistory: (wordToRemove: string) => void;
  toggleFavorite: (word: string) => void;
  setWordStatus: (word: string, status: WordStatus) => void;
  clearHistory: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      searchHistory: [],
      wordData: {},
      metadata: {},
      isSidebarOpen: true,
      
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      
      addWordToHistory: (word) => set((state) => {
        const history = [...new Set([word, ...state.searchHistory])];
        const existingMeta = state.metadata[word] || {
          status: 'new',
          isFavorite: false,
          addedAt: Date.now(),
        };
        return {
          searchHistory: history,
          metadata: {
            ...state.metadata,
            [word]: existingMeta,
          },
        };
      }),
      
      setWordData: (word, mode, data) => set((state) => ({
        wordData: { ...state.wordData, [word]: { ...state.wordData[word], [mode]: data } },
      })),
        
      addDrillDownData: (word, drillData) => set((state) => ({
        wordData: { ...state.wordData, [word]: { ...state.wordData[word], drills: [...(state.wordData[word]?.drills || []), drillData] } },
      })),
        
      removeWordFromHistory: (wordToRemove) => {
        const { wordData, searchHistory, metadata } = get();
        const newWordData = { ...wordData };
        delete newWordData[wordToRemove];
        const newMetadata = { ...metadata };
        delete newMetadata[wordToRemove];
        set({
          searchHistory: searchHistory.filter(word => word !== wordToRemove),
          wordData: newWordData,
          metadata: newMetadata,
        });
      },

      toggleFavorite: (word) => set((state) => {
        const currentMeta = state.metadata[word] || { status: 'new', isFavorite: false, addedAt: Date.now() };
        return {
          metadata: {
            ...state.metadata,
            [word]: {
              ...currentMeta,
              isFavorite: !currentMeta.isFavorite,
            },
          },
        };
      }),

      setWordStatus: (word, status) => set((state) => {
        const currentMeta = state.metadata[word] || { status: 'new', isFavorite: false, addedAt: Date.now() };
        return {
          metadata: {
            ...state.metadata,
            [word]: {
              ...currentMeta,
              status,
            },
          },
        };
      }),

      clearHistory: () => set({ searchHistory: [], wordData: {}, metadata: {} }),
    }),
    { name: 'vocabulary-storage' }
  )
);