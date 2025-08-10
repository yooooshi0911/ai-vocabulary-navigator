"use client";

import React, { useState } from 'react';
import { DrillDownCache } from '@/store/useAppStore';
import { Lightbulb, Send } from 'lucide-react';

interface DeepDiveFooterProps {
  onExplainFurther: () => void;
  onCustomQuestion: (question: string) => void;
  additionalContent: string;
  isAdditionalLoading: boolean;
  drillHistory: DrillDownCache[];
}

export default function DeepDiveFooter({
  onExplainFurther,
  onCustomQuestion,
  additionalContent,
  isAdditionalLoading,
  drillHistory,
}: DeepDiveFooterProps) {
  const [question, setQuestion] = useState('');

  const handleQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      onCustomQuestion(question);
    } else {
      onExplainFurther();
    }
    setQuestion('');
  };

  return (
    <div className="mt-[-8px] bg-card rounded-b-xl border-x border-b border-border p-4 sm:p-6 space-y-4 shadow-lg">
      {drillHistory?.map((drill, index) => (
        <div key={index} className="p-4 bg-background rounded-lg">
          <p className="text-sm font-semibold text-muted-foreground border-b border-border pb-2 mb-2">
            {drill.type === 'further' ? <span className="flex items-center gap-2"><Lightbulb size={14}/> 「さらに詳しく」の回答</span> : `Q: ${drill.context}`}
          </p>
          <div className="prose max-w-none dark:prose-invert text-sm" dangerouslySetInnerHTML={{ __html: drill.answer }} />
        </div>
      ))}

      {isAdditionalLoading && <div className="p-4 bg-background rounded-lg animate-pulse h-24"></div>}
      {additionalContent && (
  <div
    className="p-4 bg-background rounded-lg prose max-w-none text-sm text-white"
    dangerouslySetInnerHTML={{ __html: additionalContent }}
  />
)}


      <div className="pt-2">
        <form onSubmit={handleQuestionSubmit} className="relative w-full">
          <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="解説について質問、または空欄で「さらに詳しく」" className="w-full px-4 py-3 text-sm bg-input text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary border border-transparent pr-12" />
          <button type="submit" disabled={isAdditionalLoading} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"> <Send size={18} /> </button>
        </form>
      </div>
    </div>
  );
}