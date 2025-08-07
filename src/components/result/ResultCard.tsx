"use client";

import React, { useRef, useEffect, useState } from 'react';
import DeepDiveFooter from './DeepDiveFooter'; // ★新しいコンポーネントをインポート
import { DrillDownCache } from '@/store/useAppStore';
import { RefreshCw } from 'lucide-react';

interface ResultCardProps {
  content: string;
  isLoading: boolean;
  isStreaming: boolean;
  currentMode: 'quick' | 'deep_dive';
  onModeChange: (newMode: 'quick' | 'deep_dive') => void;
  onRegenerate: () => void;
  searchWord: string;
  onExplainFurther: () => void;
  onCustomQuestion: (question: string) => void;
  additionalContent: string;
  isAdditionalLoading: boolean;
  drillHistory: DrillDownCache[];
  isFlipped: boolean;
}

const CardFace = React.forwardRef<HTMLDivElement, { searchWord: string; onModeChange: () => void; onRegenerate: () => void; content: string; isStreaming: boolean; currentMode: 'quick' | 'deep_dive' }>(
  ({ searchWord, onModeChange, onRegenerate, content, isStreaming, currentMode }, ref) => (
  <div ref={ref} className="absolute w-full h-auto bg-card rounded-xl backface-hidden overflow-hidden border border-border shadow-lg">
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between pb-4 border-b border-border mb-4 gap-2">
        <h2 className="text-2xl font-bold truncate">{`"${searchWord}"`}</h2>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={onRegenerate} className="p-2 rounded-full hover:bg-accent transition-colors" title="再生成">
            <RefreshCw size={14} className={isStreaming ? "animate-spin" : ""} />
          </button>
          <button onClick={onModeChange} className="px-4 py-1.5 text-sm font-semibold bg-accent text-accent-foreground rounded-full hover:opacity-80 transition-opacity">
            {currentMode === 'quick' ? '🎓 詳細表示' : '⚡ 簡易表示'}
          </button>
        </div>
      </div>
      <div className="prose max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: content }} />
      {isStreaming && (
        <div className="text-sm text-muted-foreground mt-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <span>AIが生成中...</span>
        </div>
      )}
    </div>
  </div>
));
CardFace.displayName = 'CardFace';


export default function ResultCard({
  content, isLoading, isStreaming, currentMode, onModeChange, onRegenerate, searchWord,
  onExplainFurther, onCustomQuestion, additionalContent, isAdditionalLoading, drillHistory,
  isFlipped
}: ResultCardProps) {
  
  const [cardHeight, setCardHeight] = useState<number | 'auto'>('auto');
  const frontFaceRef = useRef<HTMLDivElement>(null);
  const backFaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frontHeight = frontFaceRef.current?.scrollHeight || 0;
    const backHeight = backFaceRef.current?.scrollHeight || 0;
    const newHeight = isFlipped ? backHeight : frontHeight;
    if (newHeight > 0) setCardHeight(newHeight);
  }, [isFlipped, content, isStreaming]);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 mt-6 bg-card text-foreground rounded-xl shadow-lg border border-border min-h-[300px] flex items-center justify-center">
        <div className="space-y-4 animate-pulse w-full"><div className="h-5 bg-muted rounded w-3/4"></div><div className="h-5 bg-muted rounded w-1/2"></div><div className="h-5 bg-muted rounded w-2/3"></div></div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="perspective" style={{ height: cardHeight, transition: 'height 0.35s ease-in-out' }}>
        <div className={`relative w-full h-full preserve-3d transition-transform duration-700 ease-in-out ${isFlipped ? 'rotate-y-180' : ''}`}>
          <div className={`absolute w-full h-full backface-hidden ${isFlipped ? 'opacity-0' : 'opacity-100'}`}>
            <CardFace ref={frontFaceRef} searchWord={searchWord} onModeChange={() => onModeChange('deep_dive')} onRegenerate={onRegenerate} content={content} isStreaming={isStreaming} currentMode="quick" />
          </div>
          <div className={`absolute w-full h-full backface-hidden rotate-y-180 ${isFlipped ? 'opacity-100' : 'opacity-0'}`}>
            <CardFace ref={backFaceRef} searchWord={searchWord} onModeChange={() => onModeChange('quick')} onRegenerate={onRegenerate} content={content} isStreaming={isStreaming} currentMode="deep_dive" />
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