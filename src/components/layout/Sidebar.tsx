"use client";

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Trash2, BookOpen, Settings, Sun, Moon, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';

interface SidebarProps {
  onHistoryClick: (word: string) => void;
}

export default function Sidebar({ onHistoryClick }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'history' | 'settings'>('history');
  const { searchHistory, removeWordFromHistory, defaultMode, setDefaultMode } = useAppStore();
  const { theme, setTheme } = useTheme();

  const handleRemoveClick = (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    if (window.confirm(`「${word}」を単語帳から削除しますか？`)) {
      removeWordFromHistory(word);
    }
  };

  const TabButton = ({ isActive, onClick, children, label }: { isActive: boolean; onClick: () => void; children: React.ReactNode; label: string; }) => (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-all rounded-md ${
        isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent'
      }`}
      aria-label={label}
    >
      {children}
    </button>
  );

  const SettingButton = ({ isActive, onClick, children }: { isActive: boolean; onClick: () => void; children: React.ReactNode; }) => (
    <button
      onClick={onClick}
      className={`relative flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full ${
        isActive ? 'bg-primary text-primary-foreground shadow-inner' : 'bg-accent hover:bg-border'
      }`}
    >
      {children}
    </button>
  );

  const handleLogout = () => {
    document.cookie = "loggedIn=; path=/; max-age=0";
    window.location.reload();
  };

  return (
    <aside className="w-64 bg-card p-3 border-r border-border flex flex-col h-full">
      <div className="flex-shrink-0">
        <div className="flex bg-background p-1 rounded-lg gap-1">
          <TabButton isActive={activeTab === 'history'} onClick={() => setActiveTab('history')} label="単語帳">
            <BookOpen size={18} /> 単語帳
          </TabButton>
          <TabButton isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} label="設定">
            <Settings size={18} /> 設定
          </TabButton>
        </div>
      </div>
      
      <div className="flex-grow overflow-y-auto mt-4">
        {activeTab === 'history' && (
          <div className="space-y-1">
            {searchHistory.length === 0 ? (
              <div className="text-muted-foreground text-sm px-2 py-8 text-center"><p>検索した単語がここに追加されます。</p></div>
            ) : (
              searchHistory.map((word) => (
                <div key={word} className="group">
                  <button onClick={() => onHistoryClick(word)} className="w-full flex justify-between items-center text-left p-2 rounded-md hover:bg-accent text-foreground transition-colors text-sm">
                    <span className="truncate">{word}</span>
                    <span onClick={(e) => handleRemoveClick(e, word)} className="p-1 rounded-full text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="削除"><Trash2 size={14} /></span>
                  </button>
                </div>
              ))
            )}
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="space-y-6 p-2 text-foreground">
            <div>
              <h3 className="text-sm font-semibold mb-2 text-muted-foreground px-1">テーマ設定</h3>
              <div className="grid grid-cols-2 gap-2">
                <SettingButton isActive={theme === 'light'} onClick={() => setTheme('light')}> <Sun size={14}/> Light</SettingButton>
                <SettingButton isActive={theme === 'dark'} onClick={() => setTheme('dark')}> <Moon size={14}/> Dark</SettingButton>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2 text-muted-foreground px-1">検索モードの初期設定</h3>
              <div className="grid grid-cols-1 gap-2">
                <SettingButton isActive={defaultMode === 'quick'} onClick={() => setDefaultMode('quick')}>クイック</SettingButton>
                <SettingButton isActive={defaultMode === 'deep_dive'} onClick={() => setDefaultMode('deep_dive')}>ディープダイブ</SettingButton>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-shrink-0 pt-2 border-t border-border">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors text-sm">
            <LogOut size={14}/> ログアウト
          </button>
      </div>
    </aside>
  );
}