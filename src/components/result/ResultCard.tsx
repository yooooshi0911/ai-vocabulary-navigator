"use client";

import React, { useRef, useEffect, useState } from 'react';
import DeepDiveFooter from './DeepDiveFooter';
import { DrillDownCache, useAppStore, WordStatus } from '@/store/useAppStore';
import { 
  RefreshCw, Volume2, Star, CheckCircle2, Bookmark, 
  Copy, Check, Sparkles, BookOpen, Zap
} from 'lucide-react';

interface ResultCardProps {
  content: string;
  isLoading: boolean;
  isStreaming: boolean;
  currentMode: 'quick' | 'deep_dive';
  onModeChange: () => void;
  onRegenerate: () => void;
  searchWord: string;
  onExplainFurther: () => void;
  onCustomQuestion: (question: string) => void;
  additionalContent: string;
  isAdditionalLoading: boolean;
  drillHistory: DrillDownCache[];
  isFlipped: boolean;
  translationDirection: 'en-ja' | 'ja-en';
}

const statusConfig: Record<WordStatus, { label: string; color: string; bg: string }> = {
  new: { label: '未習得', color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  learning: { label: '学習中', color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  mastered: { label: '習得済', color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
};

const CardFace = React.forwardRef<HTMLDivElement, {
  searchWord: string;
  onModeChange: () => void;
  onRegenerate: () => void;
  content: string;
  isStreaming: boolean;
  currentMode: 'quick' | 'deep_dive';
  translationDirection: 'en-ja' | 'ja-en';
}>(({ searchWord, onModeChange, onRegenerate, content, isStreaming, currentMode, translationDirection }, ref) => {
  const { metadata, toggleFavorite, setWordStatus } = useAppStore();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copied, setCopied] = useState(false);

  const wordMeta = metadata[searchWord] || { status: 'new', isFavorite: false };
  const currentStatus: WordStatus = wordMeta.status || 'new';
  const isFavorite = !!wordMeta.isFavorite;

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(searchWord);
    utterance.lang = translationDirection === 'en-ja' ? 'en-US' : 'ja-JP';
    utterance.rate = 0.9;

    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const plainText = content.replace(/<[^>]*>/g, '').trim();
      await navigator.clipboard.writeText(`${searchWord}\n\n${plainText}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const cycleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    const order: WordStatus[] = ['new', 'learning', 'mastered'];
    const nextIndex = (order.indexOf(currentStatus) + 1) % order.length;
    setWordStatus(searchWord, order[nextIndex]);
  };

  return (
    <div
      ref={ref}
      className="absolute w-full h-auto bg-card rounded-2xl border border-border/80 shadow-xl overflow-hidden backdrop-blur-sm"
    >
      {/* 上部ヘッダーグラデーション */}
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

      <div className="p-5 sm:p-7">
        {/* カードトップ：単語名、発音、ステータス、アクション */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-border/70 gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {searchWord}
            </h2>

            {/* 音声発音ボタン */}
            <button
              onClick={handleSpeak}
              className={`p-2 rounded-xl transition-all ${
                isPlayingAudio
                  ? 'bg-primary text-primary-foreground scale-105 animate-pulse'
                  : 'bg-secondary hover:bg-accent text-foreground'
              }`}
              title="ネイティブ発音を聴く"
              aria-label="発音を再生"
            >
              <Volume2 size={18} className={isPlayingAudio ? 'animate-bounce' : ''} />
            </button>

            {/* お気に入りスター */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(searchWord);
              }}
              className="p-2 rounded-xl hover:bg-accent transition-colors"
              title={isFavorite ? "お気に入りから削除" : "お気に入りに追加"}
            >
              <Star
                size={18}
                className={isFavorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}
              />
            </button>

            {/* 習得ステータスバッジ */}
            <button
              onClick={cycleStatus}
              className={`px-3 py-1 text-xs font-semibold rounded-full border transition-transform active:scale-95 flex items-center gap-1.5 ${statusConfig[currentStatus].bg} ${statusConfig[currentStatus].color}`}
              title="クリックして学習ステータスを変更"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
              {statusConfig[currentStatus].label}
            </button>
          </div>

          {/* 右側アクション群 */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* コピーボタン */}
            <button
              onClick={handleCopy}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors relative"
              title="解説をコピー"
            >
              {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              {copied && (
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] bg-foreground text-background px-1.5 py-0.5 rounded shadow">
                  コピー完了
                </span>
              )}
            </button>

            {/* 再生成ボタン */}
            <button
              onClick={onRegenerate}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="AIによる再生成"
            >
              <RefreshCw size={16} className={isStreaming ? 'animate-spin text-primary' : ''} />
            </button>

            {/* 簡易 / 詳細切り替えボタン */}
            <button
              onClick={onModeChange}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-sm ${
                currentMode === 'deep_dive'
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20'
                  : 'bg-primary hover:opacity-90 text-primary-foreground shadow-primary/20'
              }`}
            >
              {currentMode === 'quick' ? (
                <>
                  <BookOpen size={14} />
                  <span>🎓 詳細解説</span>
                </>
              ) : (
                <>
                  <Zap size={14} />
                  <span>⚡ 簡易要約</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* AIモデルバッジ */}
        <div className="flex items-center justify-between pt-3 pb-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Sparkles size={12} className="text-primary" />
            <span className="font-medium tracking-wide">Gemini 3.8 Flash</span>
          </div>
          <span className="bg-muted px-2 py-0.5 rounded text-[10px]">
            {currentMode === 'quick' ? 'クイック解説モード' : 'ディープダイブ詳細分析'}
          </span>
        </div>

        {/* 本文エリア */}
        <div
          className="prose prose-slate dark:prose-invert max-w-none pt-2 leading-relaxed text-foreground"
          dangerouslySetInnerHTML={{ __html: content }}
        />

        {/* ストリーミング中インジケーター */}
        {isStreaming && (
          <div className="text-xs text-muted-foreground mt-4 flex items-center gap-2 py-1 px-3 bg-accent/40 rounded-lg w-fit">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span>Gemini 3.8 Flash が思考・生成中...</span>
          </div>
        )}
      </div>
    </div>
  );
});
CardFace.displayName = 'CardFace';

export default function ResultCard({
  content,
  isLoading,
  isStreaming,
  currentMode,
  onModeChange,
  onRegenerate,
  searchWord,
  onExplainFurther,
  onCustomQuestion,
  additionalContent,
  isAdditionalLoading,
  drillHistory,
  isFlipped,
  translationDirection,
}: ResultCardProps) {
  const [cardHeight, setCardHeight] = useState<number | 'auto'>('auto');
  const frontFaceRef = useRef<HTMLDivElement>(null);
  const backFaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frontHeight = frontFaceRef.current?.scrollHeight || 0;
    const backHeight = backFaceRef.current?.scrollHeight || 0;
    const newHeight = isFlipped ? backHeight : frontHeight;
    if (newHeight > 0) setCardHeight(newHeight);
  }, [isFlipped, content, isStreaming, additionalContent, drillHistory]);

  if (isLoading) {
    return (
      <div className="mt-6 p-6 sm:p-8 bg-card rounded-2xl shadow-xl border border-border/80 min-h-[320px] flex flex-col items-center justify-center space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary animate-pulse">
            <Sparkles size={24} />
          </div>
        </div>
        <div className="space-y-2 text-center w-full max-w-sm">
          <p className="text-sm font-semibold text-foreground">Gemini 3.8 Flash が分析中...</p>
          <div className="space-y-2 pt-2">
            <div className="h-3 bg-muted rounded-full w-4/5 mx-auto animate-pulse"></div>
            <div className="h-3 bg-muted rounded-full w-3/5 mx-auto animate-pulse delay-75"></div>
            <div className="h-3 bg-muted rounded-full w-2/3 mx-auto animate-pulse delay-150"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="perspective" style={{ height: cardHeight, transition: 'height 0.35s ease-in-out' }}>
        <div className={`relative w-full h-full preserve-3d transition-transform duration-700 ease-in-out ${isFlipped ? 'rotate-y-180' : ''}`}>
          <div className={`absolute w-full h-full backface-hidden ${isFlipped ? 'opacity-0' : 'opacity-100'}`}>
            <CardFace
              ref={frontFaceRef}
              searchWord={searchWord}
              onModeChange={onModeChange}
              onRegenerate={onRegenerate}
              content={content}
              isStreaming={isStreaming}
              currentMode="quick"
              translationDirection={translationDirection}
            />
          </div>
          <div className={`absolute w-full h-full backface-hidden rotate-y-180 ${isFlipped ? 'opacity-100' : 'opacity-0'}`}>
            <CardFace
              ref={backFaceRef}
              searchWord={searchWord}
              onModeChange={onModeChange}
              onRegenerate={onRegenerate}
              content={content}
              isStreaming={isStreaming}
              currentMode="deep_dive"
              translationDirection={translationDirection}
            />
          </div>
        </div>
      </div>

      {currentMode === 'deep_dive' && content && !isLoading && (
        <DeepDiveFooter
          onExplainFurther={onExplainFurther}
          onCustomQuestion={onCustomQuestion}
          additionalContent={additionalContent}
          isAdditionalLoading={isAdditionalLoading}
          drillHistory={drillHistory}
        />
      )}
    </div>
  );
}