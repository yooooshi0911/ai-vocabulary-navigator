"use client";

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    // ここで設定するパスワードが、ログイン時のパスワードになります
    if (password === 'password123') { 
      document.cookie = "loggedIn=true; path=/; max-age=86400"; // 1日間有効
      router.push('/main');
    } else {
      setError('パスワードが違います。');
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-sm p-8 space-y-6 bg-card rounded-xl shadow-lg border border-border">
        <div className="text-center">
            <div className="flex justify-center items-center gap-3 mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary flex-shrink-0"><path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 7L12 12L22 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 12V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <h1 className="text-2xl font-bold text-foreground">AI Vocabulary Navigator</h1>
            </div>
            <p className="text-muted-foreground">ログインしてください</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="パスワード"
              className="w-full px-4 py-3 text-foreground bg-input border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
          <div>
            <button
              type="submit"
              className="w-full px-4 py-3 font-semibold text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition-opacity"
            >
              ログイン
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}