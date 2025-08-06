"use client";

import React from 'react';
import { DrillDownCache } from '@/store/useAppStore';
import { Lightbulb, Send } from 'lucide-react';

interface ResultCardProps {
  content: string;
  isLoading: boolean;
  currentMode: 'quick' | 'deep_dive';
  onModeChange: (newMode: 'quick' | 'deep_dive') => void;
  searchWord: string;
  onExplainFurther: () => void;
  onCustomQuestion: (question: string) => void;
  additionalContent: string;
  isAdditionalLoading: boolean;
  drillHistory: DrillDownCache[];
  isFlipped: boolean;
}

export default function ResultCard({
  content, isLoading, currentMode, onModeChange, searchWord,
  onExplainFurther, onCustomQuestion, additionalContent, isAdditionalLoading, drillHistory,
  isFlipped
}: ResultCardProps) {
  
  const [question, setQuestion] = React.useState('');
  const [cardHeight, setCardHeight] = React.useState<number | 'auto'>('auto');
  const frontFaceRef = React.useRef<HTMLDivElement>(null);
  const backFaceRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const frontHeight = frontFaceRef.current?.scrollHeight || 0;
    const backHeight = backFaceRef.current?.scrollHeight || 0;
    const newHeight = isFlipped ? backHeight : frontHeight;
    if (newHeight > 0) {
      setCardHeight(newHeight);
    }
  }, [isFlipped, content, additionalContent, drillHistory, isLoading]);

  const handleQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      onCustomQuestion(question);
    } else {
      onExplainFurther();
    }
    setQuestion('');
  };

  const CardFace = ({ mode, refEl }: { mode: 'quick' | 'deep_dive', refEl: React.RefObject<HTMLDivElement> }) => (
    <div 
      ref={refEl}
      className={`absolute w-full h-auto bg-card rounded-xl backface-hidden overflow-hidden border border-border shadow-lg ${mode === 'deep_dive' ? 'rotate-y-180' : ''}`}
    >
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
          <h2 className="text-2xl font-bold truncate">{`"${searchWord}"`}</h2>
          <button onClick={() => onModeChange(currentMode === 'quick' ? 'deep_dive' : 'quick')} className="px-4 py-1.5 text-sm font-semibold bg-accent text-accent-foreground rounded-full hover:opacity-80 transition-opacity flex-shrink-0">
            {mode === 'quick' ? '🎓 詳細表示' : '⚡ 簡易表示'}
          </button>
        </div>
        <div className="prose max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: content }} />
      </div>
      
      {mode === 'deep_dive' && (
        <div className="p-4 sm:p-6 border-t border-border space-y-4">
          {drillHistory?.map((drill, index) => (
            <div key={index} className="p-4 bg-background rounded-lg">
              <p className="text-sm font-semibold text-muted-foreground border-b border-border pb-2 mb-2">
                {drill.type === 'further' ? <span className="flex items-center gap-2"><Lightbulb size={14}/> 「さらに詳しく」の回答</span> : `Q: ${drill.context}`}
              </p>
              <div className="prose max-w-none text-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: drill.answer }} />
            </div>
          ))}

          {isAdditionalLoading && <div className="p-4 bg-background rounded-lg animate-pulse h-24"></div>}
          {additionalContent && (
             <div className="p-4 bg-background rounded-lg prose max-w-none text-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: additionalContent }} />
          )}

          <div className="pt-2">
            <form onSubmit={handleQuestionSubmit} className="relative w-full">
              <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="解説について質問、または空欄で「さらに詳しく」" className="w-full px-4 py-3 text-sm bg-input text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary border border-transparent pr-12" />
              <button type="submit" disabled={isAdditionalLoading} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"> <Send size={18} /> </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  if ((isLoading || !content) && searchWord) {
    return (
      <div className="p-4 sm:p-6 mt-6 bg-card text-foreground rounded-xl shadow-lg border border-border min-h-[300px]">
        {isLoading ? <div className="space-y-4 animate-pulse"><div className="h-5 bg-muted rounded w-3/4"></div><div className="h-5 bg-muted rounded w-1/2"></div><div className="h-5 bg-muted rounded w-2/3"></div></div> : <div className="text-muted-foreground text-center py-12"><p>ここにAIによる解説が表示されます。</p></div>}
      </div>
    );
  }

  return (
    <div className="mt-6 perspective" style={{ height: cardHeight, transition: 'height 0.35s ease-in-out' }}>
      <div 
        className={`relative w-full h-full preserve-3d transition-transform duration-700 ease-in-out ${isFlipped ? 'rotate-y-180' : ''}`}
      >
        <CardFace mode="quick" refEl={frontFaceRef} />
        <CardFace mode="deep_dive" refEl={backFaceRef} />
      </div>
    </div>
  );
}