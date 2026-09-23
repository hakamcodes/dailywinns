import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './AuthContext';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL as string;

interface UserRecord {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  lastActive: Timestamp | null;
  createdAt: Timestamp | null;
}

const formatDate = (ts: Timestamp | null): string => {
  if (!ts) return '—';
  const d = ts.toDate();
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateTime = (ts: Timestamp | null): string => {
  if (!ts) return '—';
  const d = ts.toDate();
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 2) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(ts);
};

const AdminView: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'lastActive' | 'createdAt' | 'name'>('lastActive');

  // Notification composer
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [notifType, setNotifType] = useState<'info' | 'important' | 'announcement'>('info');
  const [notifTarget, setNotifTarget] = useState<'all' | string>('all');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState('');

  // Hard gate — this check is both in App.tsx (renders nothing) and here (double lock)
  if (!user || user.email !== ADMIN_EMAIL) {
    return null;
  }

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, 'userRegistry'));
        const records: UserRecord[] = snap.docs.map(d => ({
          uid: d.id,
          name: d.data().name || 'Unknown',
          email: d.data().email || '',
          photoURL: d.data().photoURL || '',
          lastActive: d.data().lastActive || null,
          createdAt: d.data().createdAt || null,
        }));
        setUsers(records);
      } catch (e: any) {
        setError('Failed to load user data. Check Firestore rules.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const sendNotification = async () => {
    if (!notifTitle.trim() || !notifBody.trim()) {
      setSendResult('⚠️ Please fill in both title and message.');
      return;
    }
    setSending(true);
    setSendResult('');
    try {
      const payload = {
        title: notifTitle.trim(),
        body: notifBody.trim(),
        type: notifType,
        createdAt: serverTimestamp(),
      };

      if (notifTarget === 'all') {
        // Broadcast — write to global /notifications collection
        await addDoc(collection(db, 'notifications'), payload);
        setSendResult('✅ Sent to all users!');
      } else {
        // User-specific — write to /userNotifications/{uid}/items
        await addDoc(collection(db, 'userNotifications', notifTarget, 'items'), {
          ...payload,
          targetUid: notifTarget,
        });
        const targetUser = users.find(u => u.uid === notifTarget);
        setSendResult('✅ Sent to ' + (targetUser?.name || notifTarget));
      }
      setNotifTitle('');
      setNotifBody('');
    } catch (e) {
      setSendResult('❌ Failed to send. Check Firestore rules.');
    } finally {
      setSending(false);
    }
  };

  const filtered = users
    .filter(u =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      const aTs = a[sortBy]?.toMillis() ?? 0;
      const bTs = b[sortBy]?.toMillis() ?? 0;
      return bTs - aTs; // newest first
    });

  const activeThisWeek = users.filter(u => {
    if (!u.lastActive) return false;
    const diff = Date.now() - u.lastActive.toMillis();
    return diff < 7 * 24 * 60 * 60 * 1000;
  }).length;

  const activeThisMonth = users.filter(u => {
    if (!u.lastActive) return false;
    const diff = Date.now() - u.lastActive.toMillis();
    return diff < 30 * 24 * 60 * 60 * 1000;
  }).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 overflow-x-hidden">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center text-xs font-black">A</div>
              <h1 className="text-2xl font-serif font-black text-white">Admin Panel</h1>
              <span className="text-[10px] font-black bg-rose-600/20 text-rose-400 border border-rose-600/30 px-2 py-0.5 rounded-full uppercase tracking-widest">
                Private
              </span>
            </div>
            <p className="text-xs text-slate-500">Signed in as {user.email}</p>
          </div>
          <button
            onClick={onExit}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-300 transition-all active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to App
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total Users', value: users.length, color: 'text-white' },
            { label: 'Active This Week', value: activeThisWeek, color: 'text-emerald-400' },
            { label: 'Active This Month', value: activeThisMonth, color: 'text-sky-400' },
            { label: 'Inactive', value: users.length - activeThisMonth, color: 'text-slate-500' },
          ].map(stat => (
            <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">{stat.label}</p>
              <p className={`text-3xl font-black ${stat.color}`}>{loading ? '—' : stat.value}</p>
            </div>
          ))}
        </div>

        {/* Notification Composer */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 mb-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">📢 Send Notification</h3>
          <div className="space-y-3">
            {/* Target selector */}
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Send To</label>
              <select
                value={notifTarget}
                onChange={e => setNotifTarget(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-rose-600 transition-colors"
              >
                <option value="all">📢 All Users (Broadcast)</option>
                {users.map(u => (
                  <option key={u.uid} value={u.uid}>👤 {u.name} ({u.email})</option>
                ))}
              </select>
            </div>

            {/* Type + Title row */}
            <div className="flex gap-2">
              <select
                value={notifType}
                onChange={e => setNotifType(e.target.value as any)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-rose-600 transition-colors shrink-0"
              >
                <option value="info">ℹ️ Info</option>
                <option value="important">⚠️ Important</option>
                <option value="announcement">📢 Announcement</option>
              </select>
              <input
                value={notifTitle}
                onChange={e => setNotifTitle(e.target.value)}
                placeholder="Notification title..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-rose-600 transition-colors"
              />
            </div>

            {/* Body */}
            <textarea
              value={notifBody}
              onChange={e => setNotifBody(e.target.value)}
              placeholder="Notification message..."
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-rose-600 transition-colors resize-none"
            />

            {/* Send button + result */}
            <div className="flex items-center justify-between gap-3">
              {sendResult ? (
                <p className="text-xs font-bold text-slate-300">{sendResult}</p>
              ) : <span />}
              <button
                onClick={sendNotification}
                disabled={sending}
                className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black px-6 py-2.5 rounded-xl text-xs uppercase tracking-widest transition-all active:scale-95 shrink-0"
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 mb-5">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="flex-1 min-w-[200px] bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-rose-600 transition-colors"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Sort:</span>
            {(['lastActive', 'createdAt', 'name'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  sortBy === s ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {s === 'lastActive' ? 'Last Active' : s === 'createdAt' ? 'Joined' : 'Name'}
              </button>
            ))}
          </div>
        </div>

        {/* User table */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-slate-700 border-t-rose-500 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-rose-900/20 border border-rose-800 rounded-2xl p-6 text-center text-rose-400 text-sm font-medium">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-slate-600 italic text-sm">No users found.</div>
        ) : (
          <div className="space-y-2">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-2 px-4 pb-2 text-[10px] font-black uppercase text-slate-600 tracking-widest">
              <div className="col-span-5">User</div>
              <div className="col-span-3 hidden sm:block">Joined</div>
              <div className="col-span-4 sm:col-span-4">Last Active</div>
            </div>

            {filtered.map((u, i) => (
              <div
                key={u.uid}
                className="grid grid-cols-12 gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 items-center transition-colors"
              >
                {/* Avatar + name + email */}
                <div className="col-span-8 sm:col-span-5 flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-800 shrink-0 flex items-center justify-center text-sm font-black text-slate-400">
                    {u.photoURL
                      ? <img src={u.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      : (u.name?.charAt(0) || '?')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-100 truncate">{u.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                  </div>
                </div>

                {/* Joined */}
                <div className="col-span-3 hidden sm:flex flex-col">
                  <span className="text-xs text-slate-400">{formatDate(u.createdAt)}</span>
                </div>

                {/* Last active */}
                <div className="col-span-4 flex flex-col items-end sm:items-start">
                  <span className={`text-xs font-bold ${
                    u.lastActive && (Date.now() - u.lastActive.toMillis()) < 24 * 60 * 60 * 1000
                      ? 'text-emerald-400'
                      : u.lastActive && (Date.now() - u.lastActive.toMillis()) < 7 * 24 * 60 * 60 * 1000
                      ? 'text-amber-400'
                      : 'text-slate-500'
                  }`}>
                    {formatDateTime(u.lastActive)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-[10px] text-slate-700 mt-8 font-medium">
          Admin access · {new Date().toLocaleString()} · {users.length} records loaded
        </p>
      </div>
    </div>
  );
};

export default AdminView;
