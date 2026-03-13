'use client';

import { useState, useEffect } from 'react';

const VALID_USER = 'Detroit';
const VALID_PASS = 'Iam2slyru';
const AUTH_KEY = 'gravity_auth';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem(AUTH_KEY) === '1') {
      setAuthed(true);
    }
    setChecking(false);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === VALID_USER && password === VALID_PASS) {
      sessionStorage.setItem(AUTH_KEY, '1');
      setAuthed(true);
      setError('');
    } else {
      setError('Invalid credentials');
    }
  };

  if (checking) return null;

  if (authed) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gravity-bg">
      <form onSubmit={handleLogin} className="w-full max-w-sm p-8">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-2 h-2 rounded-full bg-gray-400" />
          <span className="font-semibold text-sm tracking-wide text-gravity-text">GRAVITY</span>
          <span className="text-[10px] font-medium uppercase tracking-widest text-gravity-text-whisper ml-1">Vehicle Health</span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-gravity-text-whisper block mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 bg-gravity-surface border border-gravity-border rounded-lg text-sm text-gravity-text placeholder:text-gravity-text-whisper focus:outline-none focus:border-gravity-accent/40"
              autoFocus
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-gravity-text-whisper block mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-gravity-surface border border-gravity-border rounded-lg text-sm text-gravity-text placeholder:text-gravity-text-whisper focus:outline-none focus:border-gravity-accent/40"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-gravity-accent hover:bg-gravity-accent/90 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Sign In
          </button>
        </div>
      </form>
    </div>
  );
}
