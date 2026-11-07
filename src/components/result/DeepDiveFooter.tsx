"use client";

import React, { useState } from 'react';
import { DrillDownCache } from '@/store/useAppStore';
import { Lightbulb, Send, MessageSquareQuote, Sparkles, HelpCircle } from 'lucide-react';

interface DeepDiveFooterProps {
  onExplainFurther: () => void;
  onCustomQuestion: (question: string) => void;
  additionalContent: string;
  isAdditionalLoading: boolean;
  drillHistory: DrillDownCache[];
}

const quickPrompts = [
  { label: '💡 例え話でわかりやすく', query: '初心者でも直感的に理解できるように、身近なたとえ話やストーリーを使って説明してください。' },
  { label: '🔍 似た単語との違い', query: 'よく混同されがちな類義語との決定的な違いや使い分けの基準を教えてください。' },
  { label: '💼 実践的なビジネス例文', query: '実際のビジネスや職場でそのまま使える実践的な英語フレーズ・例文を3つ教えてください。' },
  { label: '🧠 覚え方のコツ・イメージ', query: '記憶に強く定着させるための語呂合わせや視覚的イメージ、覚え方のコツを教えてください。' },
];

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
      onCustomQuestion(question.trim());
    } else {
      onExplainFurther();
    }
    setQuestion('');
  };

  const handlePromptClick = (queryText: string) => {
    onCustomQuestion(queryText);
  };

  return (
    <div className="mt-[-6px] bg-card/95 rounded-b-2xl border-x border-b border-border/80 p-5 sm:p-7 space-y-5 shadow-xl backdrop-blur-sm">
      {/* 過去の質問・深掘り履歴 */}
      {drillHistory && drillHistory.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <MessageSquareQuote size={14} className="text-primary" />
            <span>AI深掘り質問の履歴</span>
          </div>

          <div className="space-y-3">
            {drillHistory.map((drill, index) => (
              <div
                key={index}
                className="p-4 sm:p-5 bg-background/80 rounded-xl border border-border/60 shadow-sm"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-2.5 pb-2 border-b border-border/50">
                  {drill.type === 'further' ? (
                    <>
                      <Lightbulb size={14} />
                      <span>さらに詳しい解説</span>
                    </>
                  ) : (
                    <>
                      <HelpCircle size={14} />
                      <span className="text-foreground">Q: {drill.context}</span>
                    </>
                  )}
                </div>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: drill.answer }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ストリーミング中または生成中の表示 */}
      {isAdditionalLoading && (
        <div className="p-5 bg-background/80 rounded-xl border border-border/60 animate-pulse space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <Sparkles size={14} className="animate-spin" />
            <span>Gemini 3.8 Flash が回答を生成中...</span>
          </div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      )}

      {additionalContent && (
        <div className="p-5 bg-background/80 rounded-xl border border-border/60 shadow-sm">
          <div
            className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed"
            dangerouslySetInnerHTML={{ __html: additionalContent }}
          />
        </div>
      )}

      {/* クイック質問チップス */}
      <div className="pt-2">
        <p className="text-xs text-muted-foreground mb-2.5 font-medium">
          ワンタップで深掘り質問：
        </p>
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((item, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isAdditionalLoading}
              onClick={() => handlePromptClick(item.query)}
              className="text-xs px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent text-secondary-foreground border border-border/60 transition-all hover:border-primary/40 active:scale-95 disabled:opacity-50"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 質問入力フォーム */}
      <div className="pt-1">
        <form onSubmit={handleQuestionSubmit} className="relative w-full">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={isAdditionalLoading}
            placeholder="解説について質問を入力（空欄で送信すると「さらに詳しく」）"
            className="w-full px-4 py-3 text-sm bg-background text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-primary border border-border/80 pr-12 shadow-inner"
          />
          <button
            type="submit"
            disabled={isAdditionalLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
            title="送信"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}