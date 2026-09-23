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

function parseFirebaseError(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Try signing in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/wrong-password':
      return 'Incorrect password. Try again or reset it.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed. Please try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

// ─── Eye icon ────────────────────────────────────────────────────────────────
const EyeIcon: React.FC<{ open: boolean }> = ({ open }) =>
  open ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

// ─── Google SVG ───────────────────────────────────────────────────────────────
const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" className="shrink-0">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// ─── Input field ──────────────────────────────────────────────────────────────
interface InputProps {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  rightSlot?: React.ReactNode;
}
const Input: React.FC<InputProps> = ({ label, type, value, onChange, placeholder, autoComplete, rightSlot }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-black uppercase tracking-widest text-indigo-300">{label}</label>
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all pr-11"
      />
      {rightSlot && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{rightSlot}</div>
      )}
    </div>
  </div>
);

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = () => (
  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
);

// ─── Privacy Policy ──────────────────────────────────────────────────────────
const PrivacyView: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-start p-6 overflow-y-auto">
    <div className="w-full max-w-sm py-8">
      <button
        onClick={onBack}
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
            body: 'We receive your name and email when you create an account — the minimum needed to identify you. All other data (logs, journal, habits, goals) is entered by you and belongs to you.'
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
        onClick={onBack}
        className="w-full mt-8 bg-indigo-600 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95"
      >
        Back to Sign In
      </button>
    </div>
  </div>
);

// ─── Forgot Password ──────────────────────────────────────────────────────────
const ForgotPasswordView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setLoading(true);
    setError('');
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (err: any) {
      setError(parseFirebaseError(err?.code ?? ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex flex-col items-center justify-center px-5 py-10 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />

      <div className="relative z-10 w-full max-w-sm">
        <button onClick={onBack} className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-indigo-400 uppercase tracking-widest mb-8 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
          <div className="text-3xl mb-3">🔑</div>
          <h2 className="text-xl font-serif font-black text-white mb-1">Reset Password</h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Enter your email and we'll send you a link to reset your password.
          </p>

          {sent ? (
            <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-2xl p-4 text-center">
              <div className="text-2xl mb-2">✅</div>
              <p className="text-sm font-bold text-emerald-300 mb-1">Email sent!</p>
              <p className="text-xs text-slate-400">Check your inbox and follow the link to reset your password.</p>
              <button onClick={onBack} className="mt-4 w-full bg-indigo-600 text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95">
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="flex flex-col gap-4">
              <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" />
              {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3.5 rounded-xl text-sm transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? <Spinner /> : null}
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Login Screen ────────────────────────────────────────────────────────
type AuthTab = 'signin' | 'signup';

const LoginScreen: React.FC = () => {
  const { signInWithGoogle, signUpWithEmail, signInWithEmail } = useAuth();

  const [tab, setTab] = useState<AuthTab>('signin');
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  // Google
  const [googleLoading, setGoogleLoading] = useState(false);

  // Shared
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sign In fields
  const [siEmail, setSiEmail] = useState('');
  const [siPassword, setSiPassword] = useState('');
  const [siShowPwd, setSiShowPwd] = useState(false);

  // Sign Up fields
  const [suName, setSuName] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [suConfirm, setSuConfirm] = useState('');
  const [suShowPwd, setSuShowPwd] = useState(false);
  const [suShowConfirm, setSuShowConfirm] = useState(false);

  const clearMessages = () => { setError(''); setSuccessMsg(''); };

  const handleTabChange = (t: AuthTab) => {
    setTab(t);
    clearMessages();
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    clearMessages();
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setError(parseFirebaseError(e?.code ?? ''));
      setGoogleLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siEmail.trim() || !siPassword) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    clearMessages();
    try {
      await signInWithEmail(siEmail.trim(), siPassword);
    } catch (e: any) {
      setError(parseFirebaseError(e?.code ?? ''));
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suName.trim() || !suEmail.trim() || !suPassword || !suConfirm) { setError('Please fill in all fields.'); return; }
    if (suPassword !== suConfirm) { setError('Passwords do not match.'); return; }
    if (suPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    clearMessages();
    try {
      await signUpWithEmail(suEmail.trim(), suPassword, suName.trim());
      setSuccessMsg('Account created! A verification email has been sent. You are now signed in.');
    } catch (e: any) {
      setError(parseFirebaseError(e?.code ?? ''));
      setLoading(false);
    }
  };

  if (showPrivacy) return <PrivacyView onBack={() => setShowPrivacy(false)} />;
  if (showForgot) return <ForgotPasswordView onBack={() => setShowForgot(false)} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex flex-col items-center justify-center px-5 py-10 relative overflow-hidden">

      {/* Background glow blobs */}
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
        <div className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 mb-5 text-center">
          <p className="text-sm text-indigo-200 leading-relaxed italic">"{quote}"</p>
        </div>

        {/* Feature chips */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
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

        {/* Auth card */}
        <div className="w-full bg-white/5 border border-white/10 rounded-3xl p-5 mb-4 backdrop-blur-sm">

          {/* Google button — always visible */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 bg-white rounded-2xl px-6 py-3.5 text-slate-800 font-bold text-sm hover:bg-slate-50 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-black/20 mb-4"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin shrink-0" />
            ) : (
              <GoogleLogo />
            )}
            <span>{googleLoading ? 'Signing in…' : 'Continue with Google'}</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Tabs */}
          <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 mb-5">
            {(['signin', 'signup'] as AuthTab[]).map(t => (
              <button
                key={t}
                onClick={() => handleTabChange(t)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  tab === t
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Sign In Form */}
          {tab === 'signin' && (
            <form onSubmit={handleSignIn} className="flex flex-col gap-4" noValidate>
              <Input
                label="Email"
                type="email"
                value={siEmail}
                onChange={setSiEmail}
                placeholder="you@example.com"
                autoComplete="email"
              />
              <Input
                label="Password"
                type={siShowPwd ? 'text' : 'password'}
                value={siPassword}
                onChange={setSiPassword}
                placeholder="••••••••"
                autoComplete="current-password"
                rightSlot={
                  <button type="button" onClick={() => setSiShowPwd(v => !v)} className="hover:text-indigo-300 transition-colors">
                    <EyeIcon open={siShowPwd} />
                  </button>
                }
              />
              <div className="flex justify-end -mt-1">
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {error && <p className="text-xs text-rose-400 font-medium text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3.5 rounded-xl text-sm transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? <Spinner /> : null}
                {loading ? 'Signing in…' : 'Sign In'}
              </button>

              <p className="text-center text-[11px] text-slate-500">
                Don't have an account?{' '}
                <button type="button" onClick={() => handleTabChange('signup')} className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
                  Sign Up
                </button>
              </p>
            </form>
          )}

          {/* Sign Up Form */}
          {tab === 'signup' && (
            <form onSubmit={handleSignUp} className="flex flex-col gap-4" noValidate>
              <Input
                label="Full Name"
                type="text"
                value={suName}
                onChange={setSuName}
                placeholder="Your name"
                autoComplete="name"
              />
              <Input
                label="Email"
                type="email"
                value={suEmail}
                onChange={setSuEmail}
                placeholder="you@example.com"
                autoComplete="email"
              />
              <Input
                label="Password"
                type={suShowPwd ? 'text' : 'password'}
                value={suPassword}
                onChange={setSuPassword}
                placeholder="Min. 6 characters"
                autoComplete="new-password"
                rightSlot={
                  <button type="button" onClick={() => setSuShowPwd(v => !v)} className="hover:text-indigo-300 transition-colors">
                    <EyeIcon open={suShowPwd} />
                  </button>
                }
              />
              <Input
                label="Confirm Password"
                type={suShowConfirm ? 'text' : 'password'}
                value={suConfirm}
                onChange={setSuConfirm}
                placeholder="Repeat password"
                autoComplete="new-password"
                rightSlot={
                  <button type="button" onClick={() => setSuShowConfirm(v => !v)} className="hover:text-indigo-300 transition-colors">
                    <EyeIcon open={suShowConfirm} />
                  </button>
                }
              />

              {error && <p className="text-xs text-rose-400 font-medium text-center">{error}</p>}
              {successMsg && <p className="text-xs text-emerald-400 font-medium text-center">{successMsg}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3.5 rounded-xl text-sm transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? <Spinner /> : null}
                {loading ? 'Creating account…' : 'Create Account'}
              </button>

              <p className="text-center text-[11px] text-slate-500">
                Already have an account?{' '}
                <button type="button" onClick={() => handleTabChange('signin')} className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
                  Sign In
                </button>
              </p>
            </form>
          )}
        </div>

        {/* Trust line */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 mb-5">
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
