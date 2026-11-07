"use client";

import React from 'react';
import { Search, ArrowRight, X, Loader2 } from 'lucide-react';

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
    <form onSubmit={handleSubmit} className="relative group w-full">
      <div className="relative flex items-center bg-card dark:bg-card/90 rounded-2xl border border-border/80 shadow-md hover:border-primary/50 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all duration-200">
        <div className="pl-4 sm:pl-5 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none">
          <Search size={20} />
        </div>

        <input
          type="text"
          placeholder={placeholder}
          value={word}
          onChange={(e) => setWord(e.target.value)}
          disabled={isLoading}
          className="w-full px-3 py-3.5 sm:py-4 text-base sm:text-lg bg-transparent text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
          autoComplete="off"
          autoFocus
        />

        <div className="flex items-center gap-1.5 pr-2 sm:pr-3">
          {word && !isLoading && (
            <button
              type="button"
              onClick={() => setWord('')}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-accent transition-colors"
              aria-label="入力をクリア"
            >
              <X size={16} />
            </button>
          )}

          <button
            type="submit"
            disabled={isLoading || !word.trim()}
            className="flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm"
            aria-label="検索する"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <ArrowRight size={18} />
            )}
          </button>
        </div>
      </div>
    </form>
  );
}