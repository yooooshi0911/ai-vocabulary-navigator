import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Mode = `quick_${'en-ja' | 'ja-en'}` | `deep_dive_${'en-ja' | 'ja-en'}`;

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
  isSidebarOpen: boolean;
  toggleSidebar: () => void; // ★この行を追加
  addWordToHistory: (word: string) => void;
  setWordData: (word: string, mode: Mode, data: string) => void;
  addDrillDownData: (word: string, drillData: DrillDownCache) => void;
  removeWordFromHistory: (wordToRemove: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      searchHistory: [],
      wordData: {},
      isSidebarOpen: true,
      
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      
      addWordToHistory: (word) => set((state) => ({ searchHistory: [...new Set([word, ...state.searchHistory])] })),
      
      setWordData: (word, mode, data) => set((state) => ({
        wordData: { ...state.wordData, [word]: { ...state.wordData[word], [mode]: data } },
      })),
        
      addDrillDownData: (word, drillData) => set((state) => ({
        wordData: { ...state.wordData, [word]: { ...state.wordData[word], drills: [...(state.wordData[word]?.drills || []), drillData] } },
      })),
        
      removeWordFromHistory: (wordToRemove) => {
        const { wordData, searchHistory } = get();
        const newWordData = { ...wordData };
        delete newWordData[wordToRemove];
        set({
          searchHistory: searchHistory.filter(word => word !== wordToRemove),
          wordData: newWordData,
        });
      },
    }),
    { name: 'vocabulary-storage' }
  )
);