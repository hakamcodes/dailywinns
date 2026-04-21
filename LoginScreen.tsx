import React, { useState } from 'react';
import { useAuth } from './AuthContext';

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
      <div className="min-h-screen bg-[#fefcfb] dark:bg-slate-950 flex flex-col items-center justify-start p-6 overflow-y-auto">
        <div className="w-full max-w-sm py-8">
          <button onClick={() => setShowPrivacy(false)} className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest mb-8 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back
          </button>
          <h2 className="text-2xl font-serif font-black text-rose-900 dark:text-rose-100 mb-1">Privacy Policy</h2>
          <p className="text-[10px] font-black text-rose-300 uppercase tracking-widest mb-8">Life Tracker · Hakam Singh Lodhi</p>
          <div className="space-y-5 text-sm">
            {[
              { icon: '🔐', title: 'Your Data is Private', body: 'Everything you log is stored in your own private space in Google Firebase. It is encrypted and isolated to your account. No one else can access it — not other users, not the developer.' },
              { icon: '📦', title: 'What We Collect', body: 'We collect your name, email, and profile photo from Google Sign-In — the minimum needed to create your account. All other data (logs, journal, money, habits) is entered by you and belongs to you.' },
              { icon: '👁️', title: 'What the Developer Can See', body: 'Only your name, email, profile picture, and last active date. Nothing from your actual data — no journal entries, no money records, no health logs. This is enforced at the database level by Firebase security rules.' },
              { icon: '🚫', title: 'No Ads. No Data Selling.', body: 'Life Tracker has no advertisements and never shares, sells, or rents your data to any third party for any reason.' },
              { icon: '🗑️', title: 'Delete Anytime', body: 'You can permanently delete all your data at any time from Settings → Destroy All Data. Nothing remains after deletion.' },
              { icon: '📬', title: 'Contact', body: 'Questions? Email: hakamsinghlodhi674@gmail.com' },
            ].map(s => (
              <div key={s.title} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span>{s.icon}</span>
                  <h5 className="font-black text-slate-800 dark:text-slate-100 text-sm">{s.title}</h5>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-6">{s.body}</p>
              </div>
            ))}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 mt-4 border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Copyright</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Life Tracker is an original application designed and developed by <strong className="text-slate-700 dark:text-slate-300">Hakam Singh Lodhi</strong>. All rights reserved. Unauthorised copying or redistribution is prohibited.</p>
            </div>
            <p className="text-center text-[10px] text-slate-400">© 2025 Hakam Singh Lodhi</p>
          </div>
          <button onClick={() => setShowPrivacy(false)} className="w-full mt-8 bg-rose-600 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest hover:bg-rose-700 transition-all active:scale-95">Back to Sign In</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fefcfb] dark:bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className="w-24 h-24 bg-rose-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-rose-200 dark:shadow-rose-900/40 mx-auto mb-6">
          <span className="font-serif font-black text-5xl">L</span>
        </div>
        <h1 className="text-4xl font-serif font-black text-rose-900 dark:text-rose-100 mb-2">Life Tracker</h1>
        <p className="text-xs font-black text-rose-300 uppercase tracking-[0.3em] mb-8">Master Dashboard</p>
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {['Habits', 'Money', 'Skills', 'Goals', 'Journal', 'Trends'].map(f => (
            <span key={f} className="text-[10px] font-black bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 px-3 py-1 rounded-full border border-rose-100 dark:border-rose-800 uppercase tracking-widest">{f}</span>
          ))}
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          Your all-in-one life operating system. Track what matters, earn points for good habits, and watch your data tell the story of your growth.
        </p>
        <button onClick={handleLogin} disabled={loading} className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 text-slate-700 dark:text-slate-200 font-bold text-sm hover:border-rose-300 hover:shadow-lg hover:shadow-rose-100 dark:hover:shadow-rose-900/20 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm">
          {loading ? (
            <div className="w-5 h-5 border-2 border-slate-300 border-t-rose-500 rounded-full animate-spin" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>
        {error && <p className="mt-4 text-xs text-rose-500 font-medium">{error}</p>}
        <div className="mt-8 space-y-3">
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 dark:text-slate-600">
            <span>🔒</span>
            <span>Your data is private — only you can access it</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-[10px]">
            <button onClick={() => setShowPrivacy(true)} className="text-slate-400 dark:text-slate-600 hover:text-rose-500 underline underline-offset-2 transition-colors font-medium">Privacy Policy</button>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-slate-300 dark:text-slate-700">© 2025 Hakam Singh Lodhi</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
