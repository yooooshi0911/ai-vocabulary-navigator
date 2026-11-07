"use client";

import { useState, useEffect, useCallback } from 'react';
import { marked } from 'marked';
import { useAppStore } from '@/store/useAppStore';
import { 
  Menu, X, ArrowRightLeft, Sparkles, BookOpen, 
  Compass, Volume2, HelpCircle, Layers, ChevronRight
} from 'lucide-react';
import SearchForm from '@/components/search/SearchForm';
import ResultCard from '@/components/result/ResultCard';
import Sidebar from '@/components/layout/Sidebar';
import ThemeToggle from '@/components/layout/ThemeToggle';

type Direction = 'en-ja' | 'ja-en';
type DetailLevel = 'quick' | 'deep_dive';
type Mode = `${DetailLevel}_${Direction}`;

const suggestedWords = {
  'en-ja': [
    { word: 'serendipity', desc: '思いがけない幸運な発見' },
    { word: 'resilient', desc: '回復力がある・しなやかな' },
    { word: 'ephemeral', desc: 'つかの間の・はかない' },
    { word: 'ubiquitous', desc: 'いたる所にある・遍在する' },
    { word: 'pragmatic', desc: '実用的な・現実的な' },
  ],
  'ja-en': [
    { word: '初志貫徹', desc: '最初に決めた志を貫き通すこと' },
    { word: '臨機応変', desc: '状況に応じて柔軟に対応すること' },
    { word: '切磋琢磨', desc: '互いに励まし合って向上すること' },
    { word: '本音と建前', desc: '真意と建前のニュアンス' },
    { word: 'お疲れ様です', desc: '日常ビジネスでの自然な英語表現' },
  ],
};

export default function MainPage() {
  const { 
    wordData, addWordToHistory, setWordData, addDrillDownData, 
    isSidebarOpen, toggleSidebar 
  } = useAppStore();

  const [word, setWord] = useState('');
  const [searchedWord, setSearchedWord] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<Mode>('quick_en-ja');
  const [additionalResult, setAdditionalResult] = useState('');
  const [isAdditionalLoading, setIsAdditionalLoading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [direction, setDirection] = useState<Direction>('en-ja');

  useEffect(() => {
    const checkSidebar = () => {
      const shouldBeOpen = window.innerWidth >= 1024;
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
      const response = await fetch('/api/gemini', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(body) 
      });
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
      onChunk("<p class='text-red-500 font-medium'>エラーが発生しました。しばらく待ってから再度お試しください。</p>");
    } finally {
      setIsStreaming(false);
    }
  }, []);

  const handleMainSearch = useCallback(async (term: string, mode: Mode, forceRegenerate = false) => {
    if (window.innerWidth < 1024 && useAppStore.getState().isSidebarOpen) {
      useAppStore.getState().toggleSidebar();
    }
    
    if (!forceRegenerate && wordData[term]?.[mode]) {
      setResult(wordData[term][mode] as string);
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
        addDrillDownData(searchedWord, { 
          type: type === 'explain_further' ? 'further' : 'question', 
          context: question || context, 
          answer: finalHtml 
        });
        setAdditionalResult('');
      }
    );
    setIsAdditionalLoading(false);
  }, [searchedWord, streamApiCall, addDrillDownData]);

  const handleExplainFurther = useCallback(() => {
    const mainContent = wordData[searchedWord]?.[currentMode];
    if (!mainContent) return;
    const plainText = (mainContent as string).replace(/<[^>]*>/g, '\n').replace(/\n+/g, '\n').trim();
    handleDeepDrill('explain_further', plainText);
  }, [wordData, searchedWord, currentMode, handleDeepDrill]);
  
  const handleCustomQuestion = useCallback((question: string) => {
    const mainContent = wordData[searchedWord]?.[currentMode];
    if (!mainContent) return;
    const plainText = (mainContent as string).replace(/<[^>]*>/g, '\n').replace(/\n+/g, '\n').trim();
    handleDeepDrill('custom_question', plainText, question);
  }, [wordData, searchedWord, currentMode, handleDeepDrill]);

  useEffect(() => {
    if (searchedWord) {
      handleMainSearch(searchedWord, currentMode);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchedWord, currentMode]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!word.trim() || isLoading) return;
    if (searchedWord === word.trim()) return;
    
    const newMode: Mode = `quick_${direction}`;
    setIsFlipped(false);
    setCurrentMode(newMode);
    setSearchedWord(word.trim());
  };
  
  const handleHistoryClick = (historyWord: string) => {
    const newDirection = /^[a-zA-Z0-9\s.,?!'"-]*$/.test(historyWord) ? 'en-ja' : 'ja-en';
    const newMode: Mode = `quick_${newDirection}`;
    
    setWord(historyWord);
    setDirection(newDirection);
    setIsFlipped(false);
    setCurrentMode(newMode);
    setSearchedWord(historyWord);
  };

  const handleModeChange = () => {
    const newFlipped = !isFlipped;
    setIsFlipped(newFlipped);
    setCurrentMode(prev => prev.startsWith('quick') ? `deep_dive_${direction}` : `quick_${direction}`);
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

  const handleDirectionChange = () => {
    const newDirection = direction === 'en-ja' ? 'ja-en' : 'en-ja';
    setDirection(newDirection);
    setWord('');
    setSearchedWord('');
    setResult('');
    setAdditionalResult('');
    setIsFlipped(false);
    setCurrentMode(`quick_${newDirection}`);
  };

  const handleQuickWordClick = (targetWord: string) => {
    setWord(targetWord);
    const newMode: Mode = `quick_${direction}`;
    setIsFlipped(false);
    setCurrentMode(newMode);
    setSearchedWord(targetWord);
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* デスクトップ＆モバイルサイドバー */}
      <div 
        className={`fixed inset-y-0 left-0 z-40 h-full transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:translate-x-0`}
      >
        <Sidebar onHistoryClick={handleHistoryClick} />
      </div>

      {/* モバイル時のオーバーレイ背景 */}
      {isSidebarOpen && (
        <div 
          onClick={toggleSidebar} 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden transition-opacity" 
          aria-hidden="true" 
        />
      )}

      {/* メインコンテンツエリア */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* トップナビゲーションバー */}
        <header className="px-4 sm:px-6 py-3 border-b border-border/80 sticky top-0 z-20 flex items-center justify-between bg-background/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleSidebar} 
              className="lg:hidden p-2 rounded-xl hover:bg-accent text-foreground transition-colors"
              aria-label="メニュー開閉"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <button onClick={handleHomeClick} className="flex items-center gap-2.5 group text-left">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <Compass size={18} />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-foreground flex items-center gap-2">
                  <span>AI Vocabulary Navigator</span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    <Sparkles size={10} />
                    Gemini 3.8 Flash
                  </span>
                </h1>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* 英語 ⇄ 日本語 切り替えボタン */}
            <button
              onClick={handleDirectionChange}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-secondary hover:bg-accent border border-border/70 text-foreground transition-all active:scale-95 shadow-sm"
              title="翻訳・解説方向を切り替え"
            >
              <span>{direction === 'en-ja' ? '英 → 日' : '日 → 英'}</span>
              <ArrowRightLeft size={12} className="text-muted-foreground" />
            </button>

            {/* テーマ切り替え */}
            <ThemeToggle />
          </div>
        </header>

        {/* スクロール可能メインエリア */}
        <main className="flex-1 px-4 sm:px-6 md:px-8 pb-20 lg:pb-8 overflow-y-auto custom-scrollbar">
          <div className="max-w-3xl mx-auto pt-4 sm:pt-6">
            {/* 検索入力セクション */}
            <div className="sticky top-0 z-10 py-2 sm:py-3 bg-background/90 backdrop-blur-sm">
              <SearchForm
                word={word}
                setWord={setWord}
                handleSubmit={handleSubmit}
                isLoading={isLoading}
                placeholder={direction === 'en-ja' ? '英単語を入力してAIナビゲート...' : '日本語の単語や表現を入力...'}
              />
            </div>

            {/* 検索結果または初期ウェルカムビュー */}
            {searchedWord ? (
              <ResultCard
                content={result}
                isLoading={isLoading}
                isStreaming={isStreaming}
                currentMode={currentMode.startsWith('quick') ? 'quick' : 'deep_dive'}
                onModeChange={handleModeChange}
                onRegenerate={handleRegenerate}
                searchWord={searchedWord}
                onExplainFurther={handleExplainFurther}
                onCustomQuestion={handleCustomQuestion}
                additionalContent={additionalResult}
                isAdditionalLoading={isAdditionalLoading}
                drillHistory={wordData[searchedWord]?.drills || []}
                isFlipped={isFlipped}
                translationDirection={direction}
              />
            ) : (
              <div className="py-8 sm:py-12 space-y-8 animate-fade-in">
                {/* ヒーローセクション */}
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                    <Sparkles size={13} />
                    <span>Gemini 3.8 Flash 搭載の新世代AI学習</span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                    単語を「覚える」から、<br className="sm:hidden" />
                    <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
                      「深くつかむ」
                    </span>
                    へ。
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
                    単語の核となるコアイメージ、ネイティブの感覚、類語との違い、自然な例文まで。
                    発音機能と単語帳で、記憶に深く定着させます。
                  </p>
                </div>

                {/* おすすめ単語チップス */}
                <div className="bg-card/70 rounded-2xl p-5 border border-border/80 shadow-sm backdrop-blur-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={13} className="text-primary" />
                      おすすめの単語で試してみる
                    </span>
                    <span className="text-[11px] text-muted-foreground">クリックで即検索</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {suggestedWords[direction].map((item) => (
                      <button
                        key={item.word}
                        onClick={() => handleQuickWordClick(item.word)}
                        className="group flex items-center justify-between p-3 rounded-xl bg-background/60 hover:bg-accent border border-border/50 hover:border-primary/40 transition-all text-left shadow-sm"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                            {item.word}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {item.desc}
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* 特徴ハイライトカード */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-4 rounded-xl bg-card/50 border border-border/60 space-y-1.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center mb-2">
                      <Volume2 size={16} />
                    </div>
                    <h3 className="font-bold text-sm text-foreground">ネイティブ発音</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Web Speech APIによる高音質な音声再生で、正しいリスニング＆スピーキングをサポート。
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-card/50 border border-border/60 space-y-1.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-2">
                      <Layers size={16} />
                    </div>
                    <h3 className="font-bold text-sm text-foreground">3Dカード＆深掘り</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      「簡易要約」と「詳細分析」をワンタップ切替。疑問はその場ですぐAIに対話質問。
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-card/50 border border-border/60 space-y-1.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center mb-2">
                      <BookOpen size={16} />
                    </div>
                    <h3 className="font-bold text-sm text-foreground">学習ステータス管理</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      単語帳でお気に入りや習得度（未習得・学習中・習得済）をスマートに整理・復習。
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* モバイル用ボトムアクションバー */}
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-card/95 border-t border-border/80 px-4 py-2.5 backdrop-blur-md flex items-center justify-around shadow-lg">
          <button
            onClick={handleHomeClick}
            className={`flex flex-col items-center gap-1 text-[11px] ${
              !searchedWord ? 'text-primary font-bold' : 'text-muted-foreground'
            }`}
          >
            <Compass size={18} />
            <span>ホーム</span>
          </button>

          <button
            onClick={handleDirectionChange}
            className="flex flex-col items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <ArrowRightLeft size={18} />
            <span>{direction === 'en-ja' ? '英 → 日' : '日 → 英'}</span>
          </button>

          <button
            onClick={toggleSidebar}
            className="flex flex-col items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground relative"
          >
            <BookOpen size={18} />
            <span>単語帳</span>
          </button>
        </div>
      </div>
    </div>
  );
}