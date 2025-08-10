"use client";

import { useAppStore } from '@/store/useAppStore';
import { Trash2, LogOut, BookText } from 'lucide-react';

interface SidebarProps {
  onHistoryClick: (word: string) => void;
}

export default function Sidebar({ onHistoryClick }: SidebarProps) {
  const { searchHistory, removeWordFromHistory } = useAppStore();

  const handleRemoveClick = (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    if (window.confirm(`「${word}」を単語帳から削除しますか？`)) {
      removeWordFromHistory(word);
    }
  };

  const handleLogout = () => {
    document.cookie = "loggedIn=; path=/; max-age=0";
    window.location.reload();
  };

  return (
    <aside className="w-64 bg-card/95 dark:bg-slate-900/95 p-3 border-r border-border flex flex-col h-full shadow-xl backdrop-blur-sm">
      <div className="flex-shrink-0 p-2 mb-4">
        <div className="flex items-center gap-3">
            <BookText size={24} className="text-primary"/>
            <h2 className="text-lg font-bold text-foreground">単語帳</h2>
        </div>
      </div>
      
      <div className="flex-grow overflow-y-auto custom-scrollbar">
        <div className="space-y-1">
          {searchHistory.length === 0 ? (
            <div className="text-muted-foreground text-sm px-2 py-8 text-center">
              <p>検索した単語がここに追加されます。</p>
            </div>
          ) : (
            searchHistory.map((word) => (
              <div key={word} className="group">
                <button
                  onClick={() => onHistoryClick(word)}
                  className="w-full flex justify-between items-center text-left p-2 rounded-md hover:bg-accent text-foreground transition-colors text-sm"
                >
                  <span className="truncate">{word}</span>
                  <span 
                    onClick={(e) => handleRemoveClick(e, word)}
                    className="p-1 rounded-full text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="削除"
                  >
                    <Trash2 size={14} />
                  </span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="flex-shrink-0 pt-2 border-t border-border">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors text-sm">
            <LogOut size={14}/> ログアウト
          </button>
      </div>
    </aside>
  );
}