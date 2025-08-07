"use client";

import { useState, useEffect, useCallback } from 'react';
import { marked } from 'marked';
import { useAppStore } from '@/store/useAppStore';
import { Menu, X } from 'lucide-react';
import SearchForm from '@/components/search/SearchForm';
import ResultCard from '@/components/result/ResultCard';
import Sidebar from '@/components/layout/Sidebar';

type Mode = 'quick' | 'deep_dive';

export default function MainPage() {
  const { 
    wordData, addWordToHistory, setWordData, addDrillDownData, 
    isSidebarOpen, toggleSidebar, defaultMode 
  } = useAppStore();

  const [word, setWord] = useState('');
  const [searchedWord, setSearchedWord] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<Mode>(defaultMode);
  const [additionalResult, setAdditionalResult] = useState('');
  const [isAdditionalLoading, setIsAdditionalLoading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    // 【★バグ修正★】デフォルトモードがディープの時、isFlippedも追従させる
    setCurrentMode(defaultMode);
    setIsFlipped(defaultMode === 'deep_dive');
  }, [defaultMode]);

  useEffect(() => {
    const checkSidebar = () => {
      const shouldBeOpen = window.innerWidth >= 768;
      if (useAppStore.getState().isSidebarOpen !== shouldBeOpen) {
        useAppStore.getState().toggleSidebar();
      }
    };
    checkSidebar();
    window.addEventListener('resize', checkSidebar);
    return () => window.removeEventListener('resize', checkSidebar);
  }, []);

  const streamApiCall = useCallback(async (
    body: object,
    onChunk: (html: string) => void,
    onDone: (fullText: string) => void
  ) => {
    let fullText = '';
    setIsStreaming(true);
    try {
      const response = await fetch('/api/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!response.ok || !response.body) throw new Error("API Error");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value);
        onChunk(marked.parse(fullText) as string);
      }
      onDone(marked.parse(fullText) as string);
    } catch (error) {
      console.error("API Call failed:", error);
      onChunk("<p class='text-red-500'>エラーが発生しました。</p>");
    } finally {
      setIsStreaming(false);
    }
  }, []);

  const handleMainSearch = useCallback(async (term: string, mode: Mode, forceRegenerate = false) => {
    if (window.innerWidth < 768 && useAppStore.getState().isSidebarOpen) { useAppStore.getState().toggleSidebar(); }
    
    if (!forceRegenerate && wordData[term]?.[mode]) {
      setResult(wordData[term][mode]!);
      setSearchedWord(term);
      setAdditionalResult('');
      return;
    }
    
    setIsLoading(true);
    setResult('');
    setAdditionalResult('');
    setSearchedWord(term);
    if (!forceRegenerate) {
      addWordToHistory(term);
    }
    await streamApiCall(
      { word: term, mode: mode },
      (html) => {
        setIsLoading(false);
        setResult(html);
      },
      (finalHtml) => setWordData(term, mode, finalHtml)
    );
  }, [wordData, addWordToHistory, setWordData, streamApiCall]);

  const handleDeepDrill = useCallback(async (type: 'explain_further' | 'custom_question', context: string, question?: string) => {
    setIsAdditionalLoading(true);
    setAdditionalResult('');
    const requestBody = { word: searchedWord, mode: type, context: context, question: question };
    await streamApiCall(
      requestBody,
      (html) => setAdditionalResult(html),
      (finalHtml) => {
        addDrillDownData(searchedWord, { type: type === 'explain_further' ? 'further' : 'question', context: question || context, answer: finalHtml });
        setAdditionalResult('');
      }
    );
    setIsAdditionalLoading(false);
  }, [searchedWord, streamApiCall, addDrillDownData]);

  const handleExplainFurther = useCallback(() => {
    const mainContent = wordData[searchedWord]?.deep_dive;
    if (!mainContent) return;
    const plainText = mainContent.replace(/<[^>]*>/g, '\n').replace(/\n+/g, '\n').trim();
    handleDeepDrill('explain_further', plainText);
  }, [wordData, searchedWord, handleDeepDrill]);
  
  const handleCustomQuestion = useCallback((question: string) => {
    const mainContent = wordData[searchedWord]?.deep_dive;
    if (!mainContent) return;
    const plainText = mainContent.replace(/<[^>]*>/g, '\n').replace(/\n+/g, '\n').trim();
    handleDeepDrill('custom_question', plainText, question);
  }, [wordData, searchedWord, handleDeepDrill]);

  useEffect(() => {
    if (searchedWord) { handleMainSearch(searchedWord, currentMode); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMode, searchedWord]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!word.trim() || isLoading) return;
    if (searchedWord === word) return;
    setCurrentMode(defaultMode);
    setIsFlipped(defaultMode === 'deep_dive'); // ★バグ修正
    setSearchedWord(word);
  };
  
  const handleHistoryClick = (historyWord: string) => {
    setWord(historyWord);
    setCurrentMode(defaultMode);
    setIsFlipped(defaultMode === 'deep_dive'); // ★バグ修正
    setSearchedWord(historyWord);
  };

  const handleModeChange = (newMode: Mode) => {
    setIsFlipped(newMode === 'deep_dive');
    setCurrentMode(newMode);
  };
  
  const handleRegenerate = () => {
    if (searchedWord) {
      handleMainSearch(searchedWord, currentMode, true);
    }
  };
  
  const handleHomeClick = () => {
    setSearchedWord('');
    setWord('');
    setResult('');
    setAdditionalResult('');
    setIsFlipped(false);
  };
  
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <div className={`fixed md:static z-30 h-full transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <Sidebar onHistoryClick={handleHistoryClick} />
      </div>
      {isSidebarOpen && ( <div onClick={useAppStore.getState().toggleSidebar} className="fixed inset-0 bg-black/60 z-20 md:hidden" aria-hidden="true" /> )}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="p-3 border-b border-border sticky top-0 z-20 flex items-center gap-2 bg-background/80 backdrop-blur-sm">
          <button onClick={toggleSidebar} className="md:hidden p-2 rounded-lg hover:bg-accent text-foreground">
            {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <button onClick={handleHomeClick} className="flex items-center gap-3 group">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary flex-shrink-0 group-hover:scale-110 transition-transform"><path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 7L12 12L22 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 12V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <h1 className="text-lg font-bold tracking-tight hidden sm:block">AI Vocabulary Navigator</h1>
          </button>
        </header>
        <main className="flex-1 px-4 pb-4 md:px-8 md:pb-8 overflow-y-auto">
          <div className="max-w-3xl mx-auto pt-4 md:pt-8">
            <div className="sticky top-[-1rem] md:top-[-2rem] z-10 py-4 bg-background">
              <SearchForm
                word={word}
                setWord={setWord}
                handleSubmit={handleSubmit}
                isLoading={isLoading}
              />
            </div>
            {searchedWord && (
              <ResultCard
                content={result}
                isLoading={isLoading}
                isStreaming={isStreaming}
                currentMode={currentMode}
                onModeChange={handleModeChange}
                onRegenerate={handleRegenerate}
                searchWord={searchedWord}
                onExplainFurther={handleExplainFurther}
                onCustomQuestion={handleCustomQuestion}
                additionalContent={additionalResult}
                isAdditionalLoading={isAdditionalLoading}
                drillHistory={wordData[searchedWord]?.drills || []}
                isFlipped={isFlipped}
              />
            )}
            {!searchedWord && (
              <div className="text-center py-20 text-muted-foreground animate-fade-in">
                  <h2 className="text-2xl font-bold text-foreground">ようこそ！</h2>
                  <p className="mt-2">単語を検索して、AIによる解説をはじめましょう。</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}