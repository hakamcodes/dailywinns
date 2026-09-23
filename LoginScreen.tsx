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

/* ── Autofill fix styles injected once ─────────────────────────────────────── */
const AUTOFILL_STYLE = `
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus,
  input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 60px #1e293b inset !important;
    -webkit-text-fill-color: #f1f5f9 !important;
    caret-color: #f1f5f9;
    border-color: rgba(99,102,241,0.5) !important;
    transition: background-color 9999s ease-in-out 0s;
  }
`;

// ─── Eye icon ────────────────────────────────────────────────────────────────
const EyeIcon: React.FC<{ open: boolean }> = ({ open }) =>
  open ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = () => (
  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
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
    <label className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-400/80 pl-1">{label}</label>
    <div className="relative group">
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-xl px-4 py-3 text-sm font-medium text-slate-100 placeholder-slate-600 focus:outline-none transition-all duration-200 pr-11"
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)',
        }}
        onFocus={e => {
          e.currentTarget.style.border = '1px solid rgba(99,102,241,0.7)';
          e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.4), 0 0 0 3px rgba(99,102,241,0.12)';
        }}
        onBlur={e => {
          e.currentTarget.style.border = '1px solid rgba(99, 102, 241, 0.2)';
          e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.4)';
        }}
      />
      {rightSlot && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-300 transition-colors">{rightSlot}</div>
      )}
    </div>
  </div>
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
      <style dangerouslySetInnerHTML={{ __html: AUTOFILL_STYLE }} />
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />

      <div className="relative z-10 w-full max-w-sm">
        <button onClick={onBack} className="flex items-center gap-2 text-xs font-black text-slate-500 hover:text-indigo-400 uppercase tracking-widest mb-8 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>

        <div
          className="rounded-3xl p-6"
          style={{
            background: 'rgba(15,23,42,0.7)',
            border: '1px solid rgba(99,102,241,0.2)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="text-3xl mb-3">🔑</div>
          <h2 className="text-xl font-serif font-black text-white mb-1">Reset Password</h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Enter your email and we'll send you a link to reset your password.
          </p>

          {sent ? (
            <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-5 text-center">
              <div className="text-2xl mb-2">✅</div>
              <p className="text-sm font-bold text-emerald-300 mb-1">Email sent!</p>
              <p className="text-xs text-slate-400 mb-4">Check your inbox and follow the link to reset your password.</p>
              <button onClick={onBack} className="w-full bg-indigo-600 text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95">
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="flex flex-col gap-4">
              <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" />
              {error && (
                <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2.5">
                  <span className="text-rose-400 text-xs">⚠</span>
                  <p className="text-xs text-rose-400 font-medium">{error}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 text-white font-black py-3.5 rounded-xl text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
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

  const [googleLoading, setGoogleLoading] = useState(false);
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
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10 relative overflow-hidden"
      style={{ background: 'linear-gradient(145deg, #020617 0%, #0f0c29 40%, #1e1b4b 70%, #0f172a 100%)' }}
    >
      {/* Inject autofill fix */}
      <style dangerouslySetInnerHTML={{ __html: AUTOFILL_STYLE }} />

      {/* Background orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[420px] h-[420px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      <div className="absolute bottom-[-5%] right-[-5%] w-[380px] h-[380px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      <div className="absolute top-[40%] right-[-5%] w-[200px] h-[200px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', filter: 'blur(30px)' }} />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">

        {/* Logo + name */}
        <div className="flex flex-col items-center mb-6">
          <div
            className="w-[72px] h-[72px] rounded-[22px] overflow-hidden mb-4"
            style={{
              boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 20px 50px rgba(99,102,241,0.35), 0 8px 20px rgba(0,0,0,0.5)',
            }}
          >
            <img src="/icon-192.png" alt="Daily Wins" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-[2.2rem] font-serif font-black text-white tracking-tight leading-none mb-1">Daily Wins</h1>
          <p
            className="text-[10px] font-black uppercase tracking-[0.3em]"
            style={{ color: 'rgba(165,180,252,0.7)' }}
          >
            Your Life. Levelled Up.
          </p>
        </div>

        {/* Quote */}
        <div
          className="w-full rounded-2xl px-5 py-3.5 mb-5 text-center"
          style={{
            background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.15)',
          }}
        >
          <p className="text-[13px] text-indigo-200/80 leading-relaxed italic">"{quote}"</p>
        </div>

        {/* Feature chips */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {FEATURES.map(f => (
            <span
              key={f.label}
              className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(199,210,254,0.8)',
              }}
            >
              <span>{f.icon}</span>
              {f.label}
            </span>
          ))}
        </div>

        {/* ── Auth Card ────────────────────────────────────────────── */}
        <div
          className="w-full rounded-3xl p-5 mb-4"
          style={{
            background: 'rgba(10, 15, 30, 0.75)',
            border: '1px solid rgba(99,102,241,0.18)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03) inset, 0 1px 0 rgba(255,255,255,0.06) inset',
            backdropFilter: 'blur(24px)',
          }}
        >
          {/* Google button */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 rounded-2xl px-6 py-3.5 font-bold text-sm active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%)',
              color: '#1e293b',
              boxShadow: '0 4px 20px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.8) inset',
            }}
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin shrink-0" />
            ) : (
              <GoogleLogo />
            )}
            <span className="tracking-wide">{googleLoading ? 'Signing in…' : 'Continue with Google'}</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(148,163,184,0.5)' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
          </div>

          {/* Sign In / Sign Up tabs */}
          <div
            className="flex rounded-2xl p-1 mb-5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {(['signin', 'signup'] as AuthTab[]).map(t => (
              <button
                key={t}
                onClick={() => handleTabChange(t)}
                className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200"
                style={
                  tab === t
                    ? {
                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        color: '#fff',
                        boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
                      }
                    : { color: 'rgba(148,163,184,0.6)' }
                }
              >
                {t === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* ── Sign In Form ── */}
          {tab === 'signin' && (
            <form onSubmit={handleSignIn} className="flex flex-col gap-3.5" noValidate>
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
                  <button type="button" onClick={() => setSiShowPwd(v => !v)} className="transition-colors">
                    <EyeIcon open={siShowPwd} />
                  </button>
                }
              />
              <div className="flex justify-end -mt-0.5">
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-[11px] font-semibold transition-colors"
                  style={{ color: 'rgba(129,140,248,0.8)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#a5b4fc')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(129,140,248,0.8)')}
                >
                  Forgot password?
                </button>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl px-3 py-2.5" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <span className="text-rose-400 text-xs mt-0.5">⚠</span>
                  <p className="text-xs text-rose-400 font-medium leading-snug">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 text-white font-black py-3.5 rounded-xl text-sm tracking-wide transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', boxShadow: '0 8px 24px rgba(99,102,241,0.35)' }}
              >
                {loading ? <Spinner /> : null}
                {loading ? 'Signing in…' : 'Sign In'}
              </button>

              <p className="text-center text-[11px] mt-0.5" style={{ color: 'rgba(100,116,139,0.8)' }}>
                Don't have an account?{' '}
                <button type="button" onClick={() => handleTabChange('signup')} className="font-bold transition-colors" style={{ color: '#818cf8' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#a5b4fc')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#818cf8')}
                >
                  Sign Up
                </button>
              </p>
            </form>
          )}

          {/* ── Sign Up Form ── */}
          {tab === 'signup' && (
            <form onSubmit={handleSignUp} className="flex flex-col gap-3.5" noValidate>
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
                  <button type="button" onClick={() => setSuShowPwd(v => !v)} className="transition-colors">
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
                  <button type="button" onClick={() => setSuShowConfirm(v => !v)} className="transition-colors">
                    <EyeIcon open={suShowConfirm} />
                  </button>
                }
              />

              {error && (
                <div className="flex items-start gap-2 rounded-xl px-3 py-2.5" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <span className="text-rose-400 text-xs mt-0.5">⚠</span>
                  <p className="text-xs text-rose-400 font-medium leading-snug">{error}</p>
                </div>
              )}
              {successMsg && (
                <div className="flex items-start gap-2 rounded-xl px-3 py-2.5" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
                  <span className="text-emerald-400 text-xs mt-0.5">✓</span>
                  <p className="text-xs text-emerald-400 font-medium leading-snug">{successMsg}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 text-white font-black py-3.5 rounded-xl text-sm tracking-wide transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', boxShadow: '0 8px 24px rgba(99,102,241,0.35)' }}
              >
                {loading ? <Spinner /> : null}
                {loading ? 'Creating account…' : 'Create Account'}
              </button>

              <p className="text-center text-[11px] mt-0.5" style={{ color: 'rgba(100,116,139,0.8)' }}>
                Already have an account?{' '}
                <button type="button" onClick={() => handleTabChange('signin')} className="font-bold transition-colors" style={{ color: '#818cf8' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#a5b4fc')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#818cf8')}
                >
                  Sign In
                </button>
              </p>
            </form>
          )}
        </div>

        {/* Trust line */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] mb-4" style={{ color: 'rgba(100,116,139,0.6)' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>End-to-end private — your data belongs to you</span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-3 text-[10px]" style={{ color: 'rgba(71,85,105,0.7)' }}>
          <button
            onClick={() => setShowPrivacy(true)}
            className="underline underline-offset-2 transition-colors font-medium hover:text-indigo-400"
          >
            Privacy Policy
          </button>
          <span>·</span>
          <span>© 2025 Hakam Singh Lodhi</span>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
