"use client";

import React from 'react';
// ★ アイコンをインポート
import { Search, Send } from 'lucide-react';

interface SearchFormProps {
  word: string;
  setWord: (word: string) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  placeholder: string;
}

export default function SearchForm({
  word,
  setWord,
  handleSubmit,
  isLoading,
  placeholder,
}: SearchFormProps) {
  return (
    // 【★改善点①】フォーム自体をFlexboxコンテナにする
    <form onSubmit={handleSubmit} className="flex items-center gap-2 md:gap-3">
      {/* --- 入力欄部分 --- */}
      <div className="relative flex-grow">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none">
          <Search size={20} />
        </div>
        <input
          type="search"
          placeholder={placeholder}
          value={word}
          onChange={(e) => setWord(e.target.value)}
          disabled={isLoading}
          className="w-full pl-12 pr-4 py-3 text-lg bg-card text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-primary border border-border shadow-sm transition-all"
          autoComplete="off"
        />
      </div>

      {/* 【★改善点②】送信ボタンを独立させる */}
      <button
        type="submit"
        disabled={isLoading}
        className="flex-shrink-0 p-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="検索"
      >
        {/* ローディング中はスピナー、それ以外は送信アイコンを表示 */}
        {isLoading ? (
          <div className="w-6 h-6 border-2 border-primary-foreground/50 border-t-primary-foreground rounded-full animate-spin"></div>
        ) : (
          <Send size={24} />
        )}
      </button>
    </form>
  );
}