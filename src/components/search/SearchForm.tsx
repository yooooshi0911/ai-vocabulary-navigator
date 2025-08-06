"use client";
import React from 'react';
import { Search } from 'lucide-react';

interface SearchFormProps {
  word: string;
  setWord: (word: string) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}

export default function SearchForm({
  word,
  setWord,
  handleSubmit,
  isLoading,
}: SearchFormProps) {
  return (
    <form onSubmit={handleSubmit} className="relative w-full group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none">
        <Search size={20} />
      </div>
      <input
        type="search"
        placeholder="英単語を検索..."
        value={word}
        onChange={(e) => setWord(e.target.value)}
        disabled={isLoading}
        className="w-full pl-12 pr-4 py-4 text-lg bg-card text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-primary border border-border shadow-sm transition-all"
        autoComplete="off"
      />
      {isLoading && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-primary"></div>
        </div>
      )}
    </form>
  );
}