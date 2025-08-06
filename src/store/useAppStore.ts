import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Mode = 'quick' | 'deep_dive';

// 深掘り解説のキャッシュの型定義
export interface DrillDownCache {
  type: 'further' | 'question';
  context: string;
  answer: string;
}

// 単語ごとのキャッシュの型定義
export interface WordCache {
  quick?: string;
  deep_dive?: string;
  drills?: DrillDownCache[];
}

// アプリ全体のStateの型定義
interface AppState {
  searchHistory: string[];
  wordData: { [word: string]: WordCache };
  isSidebarOpen: boolean;
  defaultMode: Mode;
  toggleSidebar: () => void;
  addWordToHistory: (word: string) => void;
  setWordData: (word: string, mode: Mode, data: string) => void;
  addDrillDownData: (word: string, drillData: DrillDownCache) => void;
  removeWordFromHistory: (wordToRemove: string) => void;
  setDefaultMode: (mode: Mode) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 初期状態
      searchHistory: [],
      wordData: {},
      isSidebarOpen: true,
      defaultMode: 'quick',
      
      // アクション（状態を変更する関数）
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      
      addWordToHistory: (word) =>
        set((state) => {
          const newHistory = [word, ...state.searchHistory.filter(w => w !== word)];
          return { searchHistory: newHistory };
        }),
        
      setWordData: (word, mode, data) =>
        set((state) => ({
          wordData: {
            ...state.wordData,
            [word]: {
              ...state.wordData[word],
              [mode]: data,
            },
          },
        })),
        
      addDrillDownData: (word, drillData) =>
        set((state) => {
          const existingDrills = state.wordData[word]?.drills || [];
          return {
            wordData: {
              ...state.wordData,
              [word]: {
                ...state.wordData[word],
                drills: [...existingDrills, drillData],
              },
            },
          };
        }),
        
      setDefaultMode: (mode) => set({ defaultMode: mode }),

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
    {
      name: 'vocabulary-storage', // localStorageのキー名
    }
  )
);