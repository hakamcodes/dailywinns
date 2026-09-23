import React, { useState } from 'react';
import { useAuth } from './AuthContext';

const FEATURES = [
  { icon: '🔥', label: 'Habits & Streaks' },
  { icon: '📚', label: 'Deep Work Tracker' },
  { icon: '🧬', label: 'Skill Tree' },
  { icon: '🎯', label: 'Goals & Progress' },
  { icon: '📈', label: 'Life Score & Trends' },
  { icon: '🏆', label: 'Rewards System' },
];

const QUOTES = [
  'Small daily improvements lead to staggering long-term results.',
  'What gets measured, gets managed.',
  'Discipline is choosing between what you want now and what you want most.',
  'You are the average of the five habits you repeat every day.',
  'Track today. Thank yourself tomorrow.',
];

const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

const LoginScreen: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPrivacy, setShowPrivacy] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setError('Sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  if (showPrivacy) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-start p-6 overflow-y-auto">
        <div className="w-full max-w-sm py-8">
          <button
            onClick={() => setShowPrivacy(false)}
            className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-indigo-500 uppercase tracking-widest mb-8 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg mx-auto mb-4 bg-white">
            <img src="/icon-192.png" alt="Daily Wins" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl font-serif font-black text-slate-900 dark:text-white mb-1 text-center">Privacy Policy</h2>
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-8 text-center">Daily Wins · Hakam Singh Lodhi</p>
          <div className="space-y-5 text-sm">
            {[
              {
                icon: '🔐',
                title: 'Your Data is Private',
                body: 'Everything you log is stored in your own private space in Google Firebase — encrypted, isolated to your account, and inaccessible to anyone else.'
              },
              {
                icon: '📦',
                title: 'What We Collect',
                body: 'We receive your name, email, and profile photo from Google Sign-In — the minimum needed to create your account. All other data (logs, journal, habits, goals) is entered by you and belongs to you.'
              },
              {
                icon: '🛡️',
                title: 'App Analytics',
                body: 'Basic account information such as your name, email, and approximate last active time is used to maintain service health and understand overall app usage. No personal logs, journal entries, or health data is ever accessed for this purpose.'
              },
              {
                icon: '🚫',
                title: 'No Ads. No Data Selling.',
                body: 'Daily Wins has no advertisements and never shares, sells, or rents your data to any third party for any reason.'
              },
              {
                icon: '🗑️',
                title: 'Delete Anytime',
                body: 'Permanently delete all your data at any time from Settings → Destroy All Data. Nothing remains after deletion.'
              },
              {
                icon: '📬',
                title: 'Contact',
                body: 'Questions? Email: hakamsinghlodhi674@gmail.com'
              },
            ].map(s => (
              <div key={s.title} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span>{s.icon}</span>
                  <h5 className="font-black text-slate-800 dark:text-slate-100 text-sm">{s.title}</h5>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-6">{s.body}</p>
              </div>
            ))}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 mt-2 border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Copyright</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Daily Wins is an original application designed and developed by{' '}
                <strong className="text-slate-700 dark:text-slate-300">Hakam Singh Lodhi</strong>.
                All rights reserved. Unauthorised copying or redistribution is prohibited.
              </p>
            </div>
            <p className="text-center text-[10px] text-slate-400">© 2025 Hakam Singh Lodhi</p>
          </div>
          <button
            onClick={() => setShowPrivacy(false)}
            className="w-full mt-8 bg-indigo-600 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex flex-col items-center justify-center px-5 py-10 relative overflow-hidden">

      {/* Subtle background glow blobs */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">

        {/* Logo */}
        <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden shadow-2xl shadow-indigo-900/60 mb-5 bg-white ring-2 ring-white/10">
          <img src="/icon-192.png" alt="Daily Wins" className="w-full h-full object-cover" />
        </div>

        {/* App name */}
        <h1 className="text-4xl font-serif font-black text-white tracking-tight mb-1">Daily Wins</h1>
        <p className="text-xs font-bold text-indigo-300 uppercase tracking-[0.25em] mb-6">Your Life. Levelled Up.</p>

        {/* Motivational quote */}
        <div className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 mb-7 text-center">
          <p className="text-sm text-indigo-200 leading-relaxed italic">"{quote}"</p>
        </div>

        {/* Feature chips */}
        <div className="flex flex-wrap justify-center gap-2 mb-7">
          {FEATURES.map(f => (
            <span
              key={f.label}
              className="flex items-center gap-1.5 text-[11px] font-semibold bg-white/8 border border-white/10 text-indigo-200 px-3 py-1.5 rounded-full"
            >
              <span>{f.icon}</span>
              {f.label}
            </span>
          ))}
        </div>

        {/* Description */}
        <p className="text-sm text-slate-400 text-center leading-relaxed mb-8 px-1">
          Track habits, deep work, sleep and mood every day.
          Earn life score points for discipline and watch your
          consistency compound into real, lasting growth.
        </p>

        {/* Google sign in */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white rounded-2xl px-6 py-4 text-slate-800 font-bold text-sm hover:bg-slate-50 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-xl shadow-black/30 mb-3"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin shrink-0" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" className="shrink-0">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          <span>{loading ? 'Signing in…' : 'Continue with Google'}</span>
        </button>

        {error && (
          <p className="text-xs text-rose-400 font-medium text-center mb-3">{error}</p>
        )}

        {/* Trust line */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>End-to-end private — your data belongs to you</span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-3 text-[10px]">
          <button
            onClick={() => setShowPrivacy(true)}
            className="text-slate-600 hover:text-indigo-400 underline underline-offset-2 transition-colors font-medium"
          >
            Privacy Policy
          </button>
          <span className="text-slate-700">·</span>
          <span className="text-slate-700">© 2025 Hakam Singh Lodhi</span>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
