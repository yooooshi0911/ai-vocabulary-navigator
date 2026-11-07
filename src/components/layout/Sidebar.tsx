"use client";

import { useState, useMemo } from 'react';
import { useAppStore, WordStatus } from '@/store/useAppStore';
import { 
  Trash2, BookOpen, Star, Search, Volume2, CheckCircle, 
  Clock, Sparkles, Filter, X
} from 'lucide-react';

interface SidebarProps {
  onHistoryClick: (word: string) => void;
}

type FilterType = 'all' | 'favorites' | 'learning' | 'mastered';

const statusDotColors: Record<WordStatus, string> = {
  new: 'bg-amber-400',
  learning: 'bg-blue-400',
  mastered: 'bg-emerald-400',
};

export default function Sidebar({ onHistoryClick }: SidebarProps) {
  const { 
    searchHistory, removeWordFromHistory, metadata, 
    toggleFavorite, setWordStatus, clearHistory, toggleSidebar 
  } = useAppStore();

  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 統計情報
  const stats = useMemo(() => {
    let favCount = 0;
    let masteredCount = 0;
    let learningCount = 0;

    searchHistory.forEach((word) => {
      const meta = metadata[word];
      if (meta?.isFavorite) favCount++;
      if (meta?.status === 'mastered') masteredCount++;
      if (meta?.status === 'learning') learningCount++;
    });

    return {
      total: searchHistory.length,
      favorites: favCount,
      mastered: masteredCount,
      learning: learningCount,
    };
  }, [searchHistory, metadata]);

  // フィルタリング
  const filteredWords = useMemo(() => {
    return searchHistory.filter((word) => {
      const meta = metadata[word] || {};
      const matchesSearch = word.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (filter === 'favorites') return !!meta.isFavorite;
      if (filter === 'mastered') return meta.status === 'mastered';
      if (filter === 'learning') return meta.status === 'learning';
      return true;
    });
  }, [searchHistory, metadata, filter, searchQuery]);

  const handleSpeak = (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = /^[a-zA-Z0-9\s.,?!'"-]*$/.test(word) ? 'en-US' : 'ja-JP';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const handleRemoveClick = (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    if (window.confirm(`「${word}」を単語帳から削除しますか？`)) {
      removeWordFromHistory(word);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('単語帳の履歴をすべて消去しますか？この操作は取り消せません。')) {
      clearHistory();
    }
  };

  return (
    <aside className="w-80 bg-card/95 border-r border-border/80 flex flex-col h-full shadow-2xl backdrop-blur-md">
      {/* ヘッダーエリア */}
      <div className="flex-shrink-0 p-4 border-b border-border/60">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <BookOpen size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">単語帳</h2>
              <p className="text-[11px] text-muted-foreground">{stats.total} 個の登録単語</p>
            </div>
          </div>
          
          <button
            onClick={toggleSidebar}
            className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-accent"
            aria-label="単語帳を閉じる"
          >
            <X size={18} />
          </button>
        </div>

        {/* サマリーカウンター */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-secondary/60 rounded-lg p-2 border border-border/40">
            <div className="text-[10px] text-muted-foreground">総数</div>
            <div className="font-bold text-foreground">{stats.total}</div>
          </div>
          <div className="bg-secondary/60 rounded-lg p-2 border border-border/40">
            <div className="text-[10px] text-amber-500 font-medium">★ お気に入り</div>
            <div className="font-bold text-amber-500">{stats.favorites}</div>
          </div>
          <div className="bg-secondary/60 rounded-lg p-2 border border-border/40">
            <div className="text-[10px] text-emerald-500 font-medium">✓ 習得済</div>
            <div className="font-bold text-emerald-500">{stats.mastered}</div>
          </div>
        </div>

        {/* 単語検索バー */}
        <div className="relative mt-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="単語帳内を検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-background/80 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* フィルタータブ */}
        <div className="flex gap-1 mt-3 bg-secondary/50 p-1 rounded-lg text-[11px]">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-1 rounded font-medium transition-colors ${
              filter === 'all' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            すべて
          </button>
          <button
            onClick={() => setFilter('favorites')}
            className={`flex-1 py-1 rounded font-medium transition-colors flex items-center justify-center gap-1 ${
              filter === 'favorites' ? 'bg-card text-amber-500 shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            ★
          </button>
          <button
            onClick={() => setFilter('learning')}
            className={`flex-1 py-1 rounded font-medium transition-colors ${
              filter === 'learning' ? 'bg-card text-blue-500 shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            学習中
          </button>
          <button
            onClick={() => setFilter('mastered')}
            className={`flex-1 py-1 rounded font-medium transition-colors ${
              filter === 'mastered' ? 'bg-card text-emerald-500 shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            習得済
          </button>
        </div>
      </div>

      {/* 単語リスト */}
      <div className="flex-grow overflow-y-auto custom-scrollbar p-2">
        {filteredWords.length === 0 ? (
          <div className="text-muted-foreground text-xs py-12 text-center px-4 space-y-2">
            <BookOpen size={24} className="mx-auto opacity-40" />
            <p>
              {searchQuery
                ? '一致する単語が見つかりません。'
                : filter !== 'all'
                ? '該当する単語がありません。'
                : '検索した単語が自動で追加されます。'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredWords.map((word) => {
              const meta = metadata[word] || { status: 'new', isFavorite: false };
              const status: WordStatus = meta.status || 'new';
              const isFav = !!meta.isFavorite;

              return (
                <div
                  key={word}
                  onClick={() => onHistoryClick(word)}
                  className="group flex items-center justify-between p-2 rounded-xl hover:bg-accent/70 text-foreground cursor-pointer transition-all border border-transparent hover:border-border/60"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDotColors[status]}`}
                      title={`ステータス: ${status === 'mastered' ? '習得済' : status === 'learning' ? '学習中' : '未習得'}`}
                    />
                    <span className="text-sm font-medium truncate">{word}</span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {/* 音声再生 */}
                    <button
                      onClick={(e) => handleSpeak(e, word)}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
                      title="発音を再生"
                    >
                      <Volume2 size={13} />
                    </button>

                    {/* お気に入り切り替え */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(word);
                      }}
                      className="p-1 rounded-md hover:bg-secondary"
                      title={isFav ? "お気に入りを解除" : "お気に入りに追加"}
                    >
                      <Star
                        size={13}
                        className={isFav ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}
                      />
                    </button>

                    {/* 削除 */}
                    <button
                      onClick={(e) => handleRemoveClick(e, word)}
                      className="p-1 rounded-md text-muted-foreground hover:text-red-500 hover:bg-secondary"
                      title="削除"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* フッターエリア */}
      <div className="flex-shrink-0 p-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Sparkles size={12} className="text-primary" />
          <span>Gemini 3.8 Flash</span>
        </span>

        {searchHistory.length > 0 && (
          <button
            onClick={handleClearAll}
            className="hover:text-red-500 transition-colors p-1 rounded"
            title="単語帳をクリア"
          >
            全消去
          </button>
        )}
      </div>
    </aside>
  );
}