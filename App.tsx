
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DailyLog, StudySession, AppSettings, AboutMeData, ExerciseEntry, Habit, CustomActivityType, TodoTask, EisenhowerQuadrant, GalleryItem, StickyNote, MoneyEntry } from './types';
import { NOTE_THEMES, SOUNDS, playSound } from './utils';
import { calculateLogPoints, getPointsBreakdown, createSummaryText, calculateHabitStreak } from './helpers';
import { FloatingPointItem, FloatingPoint, Modal } from './components/Shared';

// Import Views
import { TodayView } from './views/TodayView';
import { HabitsView } from './views/HabitsView';
import { StickyNotesView } from './views/StickyNotesView';
import { TrendsView } from './views/TrendsView';
import { RewardsView } from './views/RewardsView';
import { ReviewView } from './views/ReviewView';
import { SettingsView } from './views/SettingsView';
import { AboutView } from './views/AboutView';
import { GalleryView } from './views/GalleryView';
import { MoneyView } from './views/MoneyView';
import { GoalsView } from './views/GoalsView';
import { SkillTreeView } from './views/SkillTreeView';
import { useAuth } from './AuthContext';
import LoginScreen from './LoginScreen';
import AdminView from './AdminView';
import { registerUserProfile, initNewUser } from './userRegistry';
import { db } from './firebase';
import { doc, getDoc, setDoc, deleteDoc, getDocs, collection, Timestamp, onSnapshot, query, orderBy, limit } from 'firebase/firestore';

// Master password stored as SHA-256 hash — plain text never in source or bundle
const MASTER_HASH = import.meta.env.VITE_MASTER_HASH as string;
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL as string;

async function hashPassword(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function isMasterPassword(input: string): Promise<boolean> {
  try {
    const h = await hashPassword(input);
    return h === MASTER_HASH;
  } catch {
    return false;
  }
}

const App: React.FC = () => {
  const { user, authLoading, signOutUser } = useAuth();
  const [dataLoaded, setDataLoaded] = useState(false);
  const [galleryLoaded, setGalleryLoaded] = useState(false);
  const [aboutLoaded, setAboutLoaded] = useState(false);
  const [logsFullyLoaded, setLogsFullyLoaded] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const isAdmin = user?.email === ADMIN_EMAIL;
  const prevLogsRef = useRef<DailyLog[]>([]);
  const prevGalleryRef = useRef<GalleryItem[]>([]);
  const [view, setView] = useState<'today' | 'habits' | 'trends' | 'rewards' | 'review' | 'settings' | 'about' | 'gallery' | 'sticky-notes' | 'money' | 'goals' | 'skills'>('today');
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  
  // UI State
  const [isEditingAboutMe, setIsEditingAboutMe] = useState(false);
  const [floatingPoints, setFloatingPoints] = useState<FloatingPoint[]>([]);
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  // ── NOTIFICATIONS ──────────────────────────────────────────
  interface AppNotification {
    id: string;
    title: string;
    body: string;
    type: 'info' | 'important' | 'announcement';
    createdAt: Timestamp | null;
    targetUid?: string; // if set, only that user sees it
  }
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [lastReadAt, setLastReadAt] = useState<number>(0); // epoch ms
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [dismissedGlobalIds, setDismissedGlobalIds] = useState<string[]>([]);
  const dismissedGlobalIdsRef = useRef<string[]>([]);
  const updateDismissedIds = (ids: string[]) => {
    dismissedGlobalIdsRef.current = ids;
    setDismissedGlobalIds(ids);
  };
  const [selectedHabitForCalendar, setSelectedHabitForCalendar] = useState<Habit | null>(null);
  const [isScoreBreakdownOpen, setIsScoreBreakdownOpen] = useState(false);
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
  const [newTodoQuadrant, setNewTodoQuadrant] = useState<EisenhowerQuadrant>(1);
  const [selectedGalleryItem, setSelectedGalleryItem] = useState<GalleryItem | null>(null);

  // Range State
  const [moneyStartDate, setMoneyStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [moneyEndDate, setMoneyEndDate] = useState(currentDate);
  
  const [reportStartDate, setReportStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [reportEndDate, setReportEndDate] = useState(currentDate);

  const [trendStartDate, setTrendStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [trendEndDate, setTrendEndDate] = useState(currentDate);

  // Sticky Note Editor State
  const [isNoteEditorOpen, setIsNoteEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<StickyNote | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [noteColor, setNoteColor] = useState(NOTE_THEMES[0].name);

  // Pomodoro State
  const [isPomodoroModalOpen, setIsPomodoroModalOpen] = useState(false);
  const [pomodoroStatus, setPomodoroStatus] = useState<'setup' | 'running' | 'paused' | 'finished'>('setup');
  const [pomoHours, setPomoHours] = useState(0);
  const [pomoMinutes, setPomoMinutes] = useState(25);
  const [pomoSubject, setPomoSubject] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const pomoTimerRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Breathing State
  const [isBreathingModalOpen, setIsBreathingModalOpen] = useState(false);
  const [breathingStatus, setBreathingStatus] = useState<'setup' | 'inhale' | 'hold' | 'exhale' | 'finished'>('setup');
  const [breathingTimeRemaining, setBreathingTimeRemaining] = useState(120); // 2 minutes
  const [breathingPhaseRemaining, setBreathingPhaseRemaining] = useState(4);
  const breathingTimerRef = useRef<any>(null);

  // --- Initialize Settings Synchronously to handle App Lock ---
  const [settings, setSettings] = useState<AppSettings>(() => {
    const defaultSettings: AppSettings = {
        waterTargets: { daily: 2.5, weekly: 17.5, monthly: 75 },
        studyTargets: { daily: 4, weekly: 28, monthly: 120 },
        exerciseTargets: { daily: 30, weekly: 210, monthly: 900 },
        screenTimeTargets: { daily: 4, weekly: 28, monthly: 120 },
        showImportance: true,
        obfuscationEnabled: false,
        settingsPassword: 'hakam@123',
        // App Lock Defaults
        isAppLockEnabled: false,
        appLockPassword: 'lodhi@123',
        rewards: [
          { id: 'default-ig', name: '30 min Instagram', points: 50, emoji: '📸' },
          { id: 'default-game', name: '1 Hour Gaming', points: 100, emoji: '🎮' },
          { id: 'default-snack', name: 'Cheat Snack', points: 80, emoji: '🍫' }
        ],
        habits: [
          { id: 'h1', name: 'Morning Meditation', emoji: '🧘', createdAt: new Date().toISOString().split('T')[0], points: 5 },
          { id: 'h2', name: 'Read 10 Pages', emoji: '📖', createdAt: new Date().toISOString().split('T')[0], points: 5 }
        ],
        customActivities: [],
        expenseCategories: ['Clg fees', 'Study expenses', 'Transport', 'Other expenses'],
        deadlines: [],
        skills: [], // New Skill Tree Defaults
        userName: "Your Name",
        schoolName: "Your School / University",
        collegeName: "Your College / University",
        theme: 'system',
        profilePicture: null
    };

    return defaultSettings;
  });

  // --- App Lock State ---
  const [isAppLocked, setIsAppLocked] = useState(false);
  const [lockPasswordInput, setLockPasswordInput] = useState('');
  const [lockError, setLockError] = useState(false);
  const [lockWrongCount, setLockWrongCount] = useState(0);
  const [showResetLock, setShowResetLock] = useState(false);
  const [resetLockStep, setResetLockStep] = useState<'verify' | 'new'>('verify');
  const [resetLockInput, setResetLockInput] = useState('');

  // --- Date Logic ---
  const { todayStr, isToday, isEditable } = useMemo(() => {
    const now = new Date();
    const toLocalDateStr = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const tStr = toLocalDateStr(now);
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yStr = toLocalDateStr(yesterday);
    
    const editable = true;
    
    return { 
      todayStr: tStr, 
      yesterdayStr: yStr,
      isToday: currentDate === tStr,
      isEditable: editable 
    };
  }, [currentDate]);
  
  const addFloatingPoint = (x: number, y: number, value: string, isNegative: boolean = false) => {
    const id = Date.now() + Math.random();
    setFloatingPoints(prev => [...prev, { id, x, y, value, isNegative }]);
  };

  const removeFloatingPoint = (id: number) => {
    setFloatingPoints(prev => prev.filter(p => p.id !== id));
  };

  const [aboutMeData, setAboutMeData] = useState<AboutMeData>({
    goals: "", lifeChangingHabit: "", biggestStrength: "", weaknessWorkingOn: "", lowMotivationBoost: "", strongLifeLesson: "", shortTerm6m: "", shortTerm1y: "", collegeEndGoals: "", longTermVision: "", skillsToMaster: "", roleModels: "", dreamLifestyle: "", futureSelfMessage: ""
  });

  const [tempAboutMe, setTempAboutMe] = useState<AboutMeData>(aboutMeData);

  const [identityForm, setIdentityForm] = useState({
    userName: settings.userName || "Your Name",
    schoolName: settings.schoolName || "",
    collegeName: settings.collegeName || ""
  });

  // Theme Logic
  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }

    if (settings.theme === 'system') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
             if (e.matches) root.classList.add('dark');
             else root.classList.remove('dark');
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.theme]);

  // --- Firestore Data Load ---
  const migrateLog = (log: any): DailyLog => {
    if (!log.breathingSessions) log.breathingSessions = 0;
    if (!log.skincare) log.skincare = { morning: false, afternoon: false, night: false };
    if (!log.meals) log.meals = { breakfast: false, lunch: false, dinner: false, notes: '' };
    if (!log.energyLevels) log.energyLevels = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    if (!log.redeemedRewards) log.redeemedRewards = [];
    if (!log.completedHabits) log.completedHabits = [];
    if (!log.customActivitiesData) log.customActivitiesData = {};
    if (!log.todos) log.todos = [];
    if (!log.screenTimeEntries) log.screenTimeEntries = [];
    if (!log.moneyEntries) log.moneyEntries = [];
    if (!log.happinessPillars) log.happinessPillars = { physical: false, problemSolving: false, helping: false, creative: false, explore: false, learning: false, ideas: false, qualityTime: false, progression: false };
    if (!log.timeTracking) log.timeTracking = {};
    if (!log.mindDump) log.mindDump = "";
    if (!log.waterEntries) log.waterEntries = [];
    if (!log.studySessions) log.studySessions = [];
    if (!log.exerciseEntries) log.exerciseEntries = [];
    if (log.exerciseDone && (!log.exerciseEntries || log.exerciseEntries.length === 0)) {
      log.exerciseEntries = [{ id: Math.random().toString(), type: log.exerciseType || 'walking', duration: log.exerciseDuration || 0, timestamp: 'Legacy Entry' }];
    }
    return log as DailyLog;
  };

  useEffect(() => {
    // ALWAYS wipe state when user changes (handles logout AND account switching)
    // Clear refs FIRST (synchronous) so save effects see empty prev state
    prevLogsRef.current = [];
    prevGalleryRef.current = [];

    // Reset all app data to blank slate
    setLogs([]);
    setGallery([]);
    setStickyNotes([]);
    setAboutMeData({ goals: "", lifeChangingHabit: "", biggestStrength: "", weaknessWorkingOn: "", lowMotivationBoost: "", strongLifeLesson: "", shortTerm6m: "", shortTerm1y: "", collegeEndGoals: "", longTermVision: "", skillsToMaster: "", roleModels: "", dreamLifestyle: "", futureSelfMessage: "" });
    setSettings(prev => ({
      ...prev,
      rewards: [
        { id: 'default-ig', name: '30 min Instagram', points: 50, emoji: '📸' },
        { id: 'default-game', name: '1 Hour Gaming', points: 100, emoji: '🎮' },
        { id: 'default-snack', name: 'Cheat Snack', points: 80, emoji: '🍫' }
      ],
      habits: [
        { id: 'h1', name: 'Morning Meditation', emoji: '🧘', createdAt: new Date().toISOString().split('T')[0], points: 5 },
        { id: 'h2', name: 'Read 10 Pages', emoji: '📖', createdAt: new Date().toISOString().split('T')[0], points: 5 }
      ],
      customActivities: [], deadlines: [], skills: [],
      expenseCategories: ['Clg fees', 'Study expenses', 'Transport', 'Other expenses'],
      isAppLockEnabled: false, userName: "Your Name", schoolName: "Your School / University", collegeName: "Your College / University",
    }));
    setIsAppLocked(false);
    setDataLoaded(false);
    setGalleryLoaded(false);
    setAboutLoaded(false);
    setLogsFullyLoaded(false);

    // If logged out — state is clean, nothing more to do
    if (!user) { setNotifications([]); setLastReadAt(0); return; }

    // Register user profile for admin tracking (non-critical, silent fail inside)
    registerUserProfile(user);

    // ── Real-time notification listener ──────────────────────
    // Subscribe to global notifications + user-specific ones
    // User's join time from Firebase Auth — used to filter old global notifications
    const userJoinedMs = user.metadata.creationTime
      ? new Date(user.metadata.creationTime).getTime()
      : 0;

    const globalQuery = query(
      collection(db, 'notifications'),
      orderBy('createdAt', 'desc')
    );

    const mergeAndSet = (globalDocs: any[], welcomeNotif: AppNotification | null) => {
      const globalNotifs: AppNotification[] = globalDocs
        .map(d => ({ id: 'g_' + d.id, ...d.data() } as AppNotification))
        // Only show global notifications created AFTER this user joined
        .filter(n => (n.createdAt?.toMillis() || 0) >= userJoinedMs - 60000) // 1 min grace
        // Filter out ones the user has dismissed (use ref so closure always sees latest)
        .filter(n => !dismissedGlobalIdsRef.current.includes(n.id));

      const all: AppNotification[] = [
        ...(welcomeNotif ? [welcomeNotif] : []),
        ...globalNotifs,
      ].sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setNotifications(all);
    };

    let globalCache: any[] = [];
    let welcomeCache: AppNotification | null = null;

    const unsubGlobal = onSnapshot(globalQuery, snap => {
      globalCache = snap.docs;
      mergeAndSet(globalCache, welcomeCache);
    }, () => {});

    // Read welcome notification from user's private space
    getDoc(doc(db, 'users', user.uid, 'appData', 'welcomeNotif')).then(snap => {
      if (snap.exists()) {
        welcomeCache = { id: 'welcome', ...snap.data() } as AppNotification;
        mergeAndSet(globalCache, welcomeCache);
      }
    }).catch(() => {});

    // Load lastReadAt and dismissedGlobalIds from user's Firestore profile
    getDoc(doc(db, 'users', user.uid, 'appData', 'notifMeta')).then(snap => {
      if (snap.exists()) {
        setLastReadAt(snap.data().lastReadAt || 0);
        updateDismissedIds(snap.data().dismissedGlobalIds || []);
        // Re-run mergeAndSet now that dismissedIds are loaded — fixes race condition
        // where onSnapshot fired before dismissedIds were populated from Firestore
        mergeAndSet(globalCache, welcomeCache);
      }
    }).catch(() => {});

    // Load this user's data from Firestore
    const loadData = async () => {
      try {
        // ── Settings (critical — load first) ──────────────────
        const settingsSnap = await getDoc(doc(db, 'users', user.uid, 'appData', 'settings'));
        if (settingsSnap.exists()) {
          const saved = settingsSnap.data() as AppSettings;
          setSettings(prev => ({ ...prev, ...saved, skills: saved.skills || prev.skills }));
          if (saved.isAppLockEnabled) setIsAppLocked(true);
        } else {
          // Brand new user — write settings IMMEDIATELY so next refresh finds it
          const googleName = user.displayName || '';
          const firstName = googleName.split(' ')[0] || googleName;
          const newSettings: AppSettings = {
            waterTargets: { daily: 2.5, weekly: 17.5, monthly: 75 },
            studyTargets: { daily: 4, weekly: 28, monthly: 120 },
            exerciseTargets: { daily: 30, weekly: 210, monthly: 900 },
            screenTimeTargets: { daily: 4, weekly: 28, monthly: 120 },
            showImportance: true, obfuscationEnabled: false,
            settingsPassword: 'user@123', isAppLockEnabled: false, appLockPassword: '',
            rewards: [
              { id: 'default-ig', name: '30 min Instagram', points: 50, emoji: '📸' },
              { id: 'default-game', name: '1 Hour Gaming', points: 100, emoji: '🎮' },
              { id: 'default-snack', name: 'Cheat Snack', points: 80, emoji: '🍫' }
            ],
            habits: [
              { id: 'h1', name: 'Morning Meditation', emoji: '🧘', createdAt: new Date().toISOString().split('T')[0], points: 5 },
              { id: 'h2', name: 'Read 10 Pages', emoji: '📖', createdAt: new Date().toISOString().split('T')[0], points: 5 }
            ],
            customActivities: [], deadlines: [], skills: [],
            expenseCategories: ['Clg fees', 'Study expenses', 'Transport', 'Other expenses'],
            userName: firstName || 'Your Name',
            schoolName: 'Your School / University', collegeName: 'Your College / University',
            theme: 'system', profilePicture: null
          };
          // Write immediately — prevents "new user" detection on refresh
          await setDoc(doc(db, 'users', user.uid, 'appData', 'settings'), newSettings);
          setSettings(newSettings);
          initNewUser(user).catch(() => {});
        }

        // ── Sticky notes (small, load immediately) ────────────
        const notesSnap = await getDoc(doc(db, 'users', user.uid, 'appData', 'stickyNotes'));
        if (notesSnap.exists()) setStickyNotes(notesSnap.data().items || []);

        // ── Logs: load last 35 days first (covers streaks + today) ──
        const recentLogsQuery = query(
          collection(db, 'users', user.uid, 'logs'),
          orderBy('date', 'desc'),
          limit(35)
        );
        const recentSnap = await getDocs(recentLogsQuery);
        const recentLogs = recentSnap.docs.map(d => migrateLog(d.data()));
        prevLogsRef.current = recentLogs;
        setLogs(recentLogs);

        // App is usable now — show it
        setDataLoaded(true);

        // ── Load rest of logs in background (for Trends/Review/Score) ──
        const allLogsSnap = await getDocs(collection(db, 'users', user.uid, 'logs'));
        const allLogs = allLogsSnap.docs.map(d => migrateLog(d.data()));
        if (allLogs.length > recentLogs.length) {
          prevLogsRef.current = allLogs;
          setLogs(allLogs);
        }
        setLogsFullyLoaded(true);

        // ── About me: lazy (loaded when About tab opened) ─────
        // ── Gallery: lazy (loaded when Gallery tab opened) ────
        // Both are loaded via loadGallery() / loadAbout() on tab open

      } catch (e) {
        console.error('Failed to load data from Firestore', e);
        setDataLoaded(true); // show app even on error
      }
    };

    loadData().then(() => {
      setIdentityForm(prev => ({
        ...prev,
        userName: settings.userName || prev.userName,
        schoolName: settings.schoolName || prev.schoolName,
        collegeName: settings.collegeName || prev.collegeName,
      }));
    });
  }, [user]);

  // --- Lazy loader: Gallery (load only when tab first opened) ---
  useEffect(() => {
    if (!user || !dataLoaded || galleryLoaded || view !== 'gallery') return;
    const loadGallery = async () => {
      try {
        const snap = await getDocs(collection(db, 'users', user.uid, 'gallery'));
        const items = snap.docs.map(d => d.data() as GalleryItem);
        prevGalleryRef.current = items;
        setGallery(items);
      } catch {}
      setGalleryLoaded(true);
    };
    loadGallery();
  }, [view, user, dataLoaded, galleryLoaded]);

  // --- Lazy loader: About Me (load only when tab first opened) ---
  useEffect(() => {
    if (!user || !dataLoaded || aboutLoaded || view !== 'about') return;
    const loadAbout = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid, 'appData', 'aboutMe'));
        if (snap.exists()) setAboutMeData(snap.data() as AboutMeData);
      } catch {}
      setAboutLoaded(true);
    };
    loadAbout();
  }, [view, user, dataLoaded, aboutLoaded]);

  // --- Auto Summary Logic ---
  useEffect(() => {
    const pastLogsNeedingSummary = logs.filter(l => l.date !== todayStr && (!l.autoSummary || l.autoSummary === ""));
    if (pastLogsNeedingSummary.length > 0) {
      setLogs(prev => prev.map(l => {
        if (l.date !== todayStr && (!l.autoSummary || l.autoSummary === "")) {
          return { ...l, autoSummary: createSummaryText(l, settings, logs) };
        }
        return l;
      }));
    }
  }, [logs, todayStr]);

  useEffect(() => {
    document.title = `${settings.userName || 'Your Name'} — Daily Life Tracker`;
  }, [settings.userName]);

  useEffect(() => {
    if (isIdentityModalOpen) {
      setIdentityForm({
        userName: settings.userName || "Your Name",
        schoolName: settings.schoolName || "Your School / University",
        collegeName: settings.collegeName || "Your College / University"
      });
    }
  }, [isIdentityModalOpen, settings]);

  // --- Firestore Persistence ---
  // Save settings immediately — no debounce so name changes never lost on refresh
  useEffect(() => {
    if (!user || !dataLoaded) return;
    setDoc(doc(db, 'users', user.uid, 'appData', 'settings'), settings)
      .catch(e => console.warn('Settings save failed:', e));
  }, [settings, user, dataLoaded]);

  // Save about me (only after it was actually loaded, prevent overwriting with defaults)
  useEffect(() => {
    if (!user || !dataLoaded || !aboutLoaded) return;
    const t = setTimeout(() => {
      setDoc(doc(db, 'users', user.uid, 'appData', 'aboutMe'), aboutMeData)
        .catch(e => console.warn('AboutMe save failed:', e));
    }, 500);
    return () => clearTimeout(t);
  }, [aboutMeData, user, dataLoaded, aboutLoaded]);

  // Save sticky notes (debounced 800ms)
  useEffect(() => {
    if (!user || !dataLoaded) return;
    const t = setTimeout(() => {
      setDoc(doc(db, 'users', user.uid, 'appData', 'stickyNotes'), { items: stickyNotes });
    }, 800);
    return () => clearTimeout(t);
  }, [stickyNotes, user, dataLoaded]);

  // Save logs — only changed/new logs (per-day documents)
  useEffect(() => {
    if (!user || !dataLoaded) return;
    const changed = logs.filter(log => {
      const prev = prevLogsRef.current.find(l => l.date === log.date);
      return !prev || JSON.stringify(prev) !== JSON.stringify(log);
    });
    if (changed.length > 0) {
      changed.forEach(log => {
        setDoc(doc(db, 'users', user.uid, 'logs', log.date), log);
      });
      prevLogsRef.current = [...logs];
    }
  }, [logs, user, dataLoaded]);

  // Save gallery — only changed/new items (per-item documents)
  useEffect(() => {
    if (!user || !dataLoaded || !galleryLoaded) return;
    // Delete removed items
    prevGalleryRef.current.forEach(item => {
      if (!gallery.find(g => g.id === item.id)) {
        deleteDoc(doc(db, 'users', user.uid, 'gallery', item.id));
      }
    });
    // Save new/changed items
    const changed = gallery.filter(item => {
      const prev = prevGalleryRef.current.find(g => g.id === item.id);
      return !prev || JSON.stringify(prev) !== JSON.stringify(item);
    });
    if (changed.length > 0) {
      changed.forEach(item => {
        setDoc(doc(db, 'users', user.uid, 'gallery', item.id), item);
      });
      prevGalleryRef.current = [...gallery];
    }
  }, [gallery, user, dataLoaded]);

  // --- Core Log Logic ---
  const currentLog = useMemo(() => {
    const log = logs.find(l => l.date === currentDate);
    if (log) return log;
    return {
      date: currentDate, waterEntries: [], sleepHours: 7, sleepMinutes: 0, sleepStart: "23:00", sleepEnd: "07:00", studySessions: [], exerciseEntries: [], screenTimeEntries: [], moneyEntries: [], redeemedRewards: [], completedHabits: [], customActivitiesData: {}, todos: [], happinessPillars: { physical: false, problemSolving: false, helping: false, creative: false, explore: false, learning: false, ideas: false, qualityTime: false, progression: false }, skincare: { morning: false, afternoon: false, night: false }, energyLevels: { morning: 0, afternoon: 0, evening: 0, night: 0 }, meals: { breakfast: false, lunch: false, dinner: false, notes: "" }, junkFood: 0, junkFoodNotes: "", screenTimeHours: 0, screenTimeMinutes: 0, screenTimeNotes: "", mood: 7, moodNotes: "", goalsCompleted: 0, goalText: "", achievement: "", journal: "", gratitude: "", social: [], socialNotes: "", newLearning: "", wakeUpTime: "07:00", bedtime: "23:00", selfCare: [], selfCareNotes: "", nutritionScore: "Okay", distractions: [], distractionNotes: "", negativeThought: "", peaceLevel: 5, dayRating: 5, autoSummary: "", weeklyReflection: "", monthlyReview: "", breathingSessions: 0, timeTracking: {}, mindDump: ""
    } as DailyLog;
  }, [logs, currentDate]);

  const yesterdayLog = useMemo(() => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    const dateStr = d.toISOString().split('T')[0];
    return logs.find(l => l.date === dateStr);
  }, [logs, currentDate]);

  const updateLog = (updatedFields: Partial<DailyLog>) => {
    if (!isEditable) return; 
    setLogs(prev => {
      const index = prev.findIndex(l => l.date === currentDate);
      if (index > -1) {
        const newLogs = [...prev];
        newLogs[index] = { ...newLogs[index], ...updatedFields };
        return newLogs;
      } else {
        return [...prev, { ...currentLog, ...updatedFields }];
      }
    });
  };

  const handleSleepTimeChange = (field: 'sleepStart' | 'sleepEnd', value: string) => {
    const start = field === 'sleepStart' ? value : currentLog.sleepStart;
    const end = field === 'sleepEnd' ? value : currentLog.sleepEnd;
    const updates: Partial<DailyLog> = { [field]: value };
    if (start && end) {
      const [sH, sM] = start.split(':').map(Number);
      const [eH, eM] = end.split(':').map(Number);
      let diffMins = (eH * 60 + eM) - (sH * 60 + sM);
      if (diffMins < 0) diffMins += 24 * 60;
      updates.sleepHours = Math.floor(diffMins / 60);
      updates.sleepMinutes = diffMins % 60;
    }
    updateLog(updates);
    playSound(SOUNDS.CLICK);
  };

  // --- Derived Stats ---
  const cumulativeLifeScore = useMemo(() => {
    return logs.reduce((total, log) => {
      const dailyEarned = calculateLogPoints(log, settings, logs);
      const dailySpent = log.redeemedRewards?.reduce((sum, r) => sum + r.points, 0) || 0;
      return total + dailyEarned - dailySpent;
    }, 0);
  }, [logs, settings]);

  const totalAvailableBalance = useMemo(() => {
    return logs.reduce((acc, log) => {
        const income = (log.moneyEntries || []).filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
        const expense = (log.moneyEntries || []).filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
        return acc + income - expense;
    }, 0);
  }, [logs]);

  const todayWater = currentLog.waterEntries.reduce((acc, curr) => acc + curr.amount, 0);
  const todayStudyMinutes = currentLog.studySessions.reduce((acc, curr) => acc + curr.duration, 0);
  
  const currentDailyNetScore = useMemo(() => {
    const earned = calculateLogPoints(currentLog, settings, logs);
    const spent = currentLog.redeemedRewards?.reduce((sum, r) => sum + r.points, 0) || 0;
    return earned - spent;
  }, [currentLog, settings, logs]);

  const yesterdayDailyNetScore = useMemo(() => {
    if (!yesterdayLog) return 0;
    const earned = calculateLogPoints(yesterdayLog, settings, logs);
    const spent = yesterdayLog.redeemedRewards?.reduce((sum, r) => sum + r.points, 0) || 0;
    return earned - spent;
  }, [yesterdayLog, settings, logs]);

  // --- Timer Effects (Pomodoro/Breathing) ---
  useEffect(() => {
    if (pomodoroStatus === 'running' && timeRemaining > 0) {
      pomoTimerRef.current = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && pomodoroStatus === 'running') {
      if (pomoTimerRef.current) clearInterval(pomoTimerRef.current);
      setPomodoroStatus('finished');
      if (audioRef.current) {
        audioRef.current.loop = true;
        audioRef.current.play().catch(() => {});
      }
      const totalMinutes = pomoHours * 60 + pomoMinutes;
      if (totalMinutes > 0) {
        const newSession: StudySession = {
          id: Math.random().toString(),
          duration: totalMinutes,
          subject: pomoSubject || 'Deep Work',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        updateLog({ studySessions: [...(currentLog.studySessions || []), newSession] });
        addFloatingPoint(window.innerWidth / 2, window.innerHeight / 2, `+${Math.floor((totalMinutes / 30) * 10)}`);
        playSound(SOUNDS.SUCCESS);
      }
    }
    return () => { if (pomoTimerRef.current) clearInterval(pomoTimerRef.current); };
  }, [pomodoroStatus, timeRemaining]);

  useEffect(() => {
    if (breathingStatus !== 'setup' && breathingStatus !== 'finished' && breathingTimeRemaining > 0) {
      breathingTimerRef.current = setInterval(() => {
        setBreathingTimeRemaining(prev => prev - 1);
        setBreathingPhaseRemaining(prev => {
          if (prev <= 1) {
            setBreathingStatus(curr => {
              const next = curr === 'inhale' ? 'hold' : (curr === 'hold' ? 'exhale' : 'inhale');
              playSound(SOUNDS.TRANSITION, 0.15);
              return next;
            });
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (breathingTimeRemaining <= 0 && breathingStatus !== 'finished' && breathingStatus !== 'setup') {
      if (breathingTimerRef.current) clearInterval(breathingTimerRef.current);
      setBreathingStatus('finished');
      updateLog({ breathingSessions: (currentLog.breathingSessions || 0) + 1 });
      addFloatingPoint(window.innerWidth / 2, window.innerHeight / 2, '+10');
      playSound(SOUNDS.REWARD);
    }
    return () => { if (breathingTimerRef.current) clearInterval(breathingTimerRef.current); };
  }, [breathingStatus, breathingTimeRemaining]);

  // --- Handlers ---
  const saveStickyNote = () => {
    if (!noteContent.trim()) return;
    if (editingNote) {
        setStickyNotes(prev => prev.map(n => n.id === editingNote.id ? { ...n, text: noteContent, color: noteColor } : n));
    } else {
        const newNote: StickyNote = { id: Math.random().toString(36).substring(7), text: noteContent, color: noteColor, timestamp: new Date().toLocaleDateString() };
        setStickyNotes(prev => [newNote, ...prev]);
    }
    setIsNoteEditorOpen(false);
    playSound(SOUNDS.SUCCESS);
  };

  const deleteStickyNote = (id: string) => {
    if (window.confirm('Delete this note?')) {
        setStickyNotes(prev => prev.filter(n => n.id !== id));
        playSound(SOUNDS.CLICK);
    }
  };

  const openStickyEditor = (note?: StickyNote) => {
    if (note) { setEditingNote(note); setNoteContent(note.text); setNoteColor(note.color); } 
    else { setEditingNote(null); setNoteContent(''); setNoteColor(NOTE_THEMES[0].name); }
    setIsNoteEditorOpen(true);
    playSound(SOUNDS.CLICK);
  };

  const stopPomoAlarm = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    setPomodoroStatus('setup');
    setIsPomodoroModalOpen(false);
    playSound(SOUNDS.CLICK);
  };

  const abortPomodoro = () => {
    if (pomoTimerRef.current) clearInterval(pomoTimerRef.current);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    setPomodoroStatus('setup');
    setIsPomodoroModalOpen(false);
    playSound(SOUNDS.CLICK);
  };

  const stopBreathing = () => {
    setBreathingStatus('setup');
    setIsBreathingModalOpen(false);
    if (breathingTimerRef.current) clearInterval(breathingTimerRef.current);
    playSound(SOUNDS.CLICK);
  };

  const addSampleData = () => {
    const sampleLogs: DailyLog[] = [];
    const now = new Date();
    for (let i = 0; i < 35; i++) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const randSleep = 6.5 + Math.random() * 2;
      const randStudy = 2 + Math.random() * 4;
      const log = {
        date: dateStr,
        waterEntries: [{ id: Math.random().toString(), amount: 1.5, timestamp: '10:00 AM' }],
        sleepHours: Math.floor(randSleep), sleepMinutes: Math.round((randSleep % 1) * 60), sleepStart: "23:00", sleepEnd: "07:00",
        studySessions: [{ id: Math.random().toString(), duration: Math.floor(randStudy * 60), subject: 'Project Work', timestamp: '2:00 PM' }],
        exerciseEntries: Math.random() > 0.4 ? [{ id: Math.random().toString(), type: 'Running', duration: 30, timestamp: '7:00 AM' }] : [],
        screenTimeEntries: [], moneyEntries: [], redeemedRewards: [], completedHabits: Math.random() > 0.3 ? ['h1', 'h2'] : [], customActivitiesData: {}, todos: [],
        happinessPillars: { physical: true, problemSolving: true, helping: false, creative: false, explore: false, learning: true, ideas: false, qualityTime: false, progression: true },
        skincare: { morning: true, afternoon: false, night: true }, 
        energyLevels: { morning: 6, afternoon: 7, evening: 5, night: 4 },
        meals: { breakfast: true, lunch: true, dinner: true, notes: "" },
        junkFood: 0, junkFoodNotes: "", screenTimeHours: 2, screenTimeMinutes: 30, screenTimeNotes: "",
        mood: 7, moodNotes: "", goalsCompleted: 80, goalText: "", achievement: "Code refactor", journal: "Productive day", gratitude: "Coffee", social: [], socialNotes: "", newLearning: "", wakeUpTime: "07:00", bedtime: "23:30", selfCare: [], selfCareNotes: "", nutritionScore: "Healthy", distractions: [], distractionNotes: "", negativeThought: "", peaceLevel: 7, dayRating: 8, autoSummary: "", weeklyReflection: "", monthlyReview: "", breathingSessions: 0, mindDump: "", timeTracking: {}
      } as DailyLog;
      log.autoSummary = createSummaryText(log, settings, sampleLogs); 
      sampleLogs.push(log);
    }
    setLogs(sampleLogs);
    alert(`Loaded sample data for ${settings.userName}!`);
    playSound(SOUNDS.SUCCESS);
  };

  // --- Import Backup Data (Firestore, once per day limit) ---
  const onImportData = async (data: any): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: 'Not signed in.' };

    // Once-per-day guard: store last import timestamp in Firestore
    try {
      const limitRef = doc(db, 'users', user.uid, 'appData', 'importLimit');
      const limitSnap = await getDoc(limitRef);
      if (limitSnap.exists()) {
        const lastImport = limitSnap.data().lastImport?.toDate?.() || null;
        if (lastImport) {
          const now = new Date();
          const sameDay =
            lastImport.getFullYear() === now.getFullYear() &&
            lastImport.getMonth() === now.getMonth() &&
            lastImport.getDate() === now.getDate();
          if (sameDay) {
            return {
              success: false,
              message: 'Import limit reached. You can only import data once per day to protect your data. Please try again tomorrow.'
            };
          }
        }
      }
    } catch (e) {
      console.warn('Could not check import limit, proceeding:', e);
    }

    try {
      // Migrate and validate each log
      const migratedLogs: DailyLog[] = (data.dailyLogs || []).map((log: any) => migrateLog(log));

      // Write logs to Firestore — batch them to avoid hitting limits
      const BATCH_SIZE = 20;
      for (let i = 0; i < migratedLogs.length; i += BATCH_SIZE) {
        const batch = migratedLogs.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map((log: DailyLog) =>
          setDoc(doc(db, 'users', user.uid, 'logs', log.date), log)
        ));
      }

      // Write settings (merge with current to keep things like profilePicture unless backup has one)
      if (data.settings) {
        const importedSettings = { ...data.settings };
        await setDoc(doc(db, 'users', user.uid, 'appData', 'settings'), importedSettings, { merge: true });
        setSettings(prev => ({ ...prev, ...importedSettings, skills: importedSettings.skills || prev.skills }));
      }

      // Write aboutMe
      if (data.aboutMe && typeof data.aboutMe === 'object') {
        await setDoc(doc(db, 'users', user.uid, 'appData', 'aboutMe'), data.aboutMe);
        setAboutMeData(data.aboutMe);
      }

      // Write sticky notes
      if (data.stickyNotes && Array.isArray(data.stickyNotes)) {
        await setDoc(doc(db, 'users', user.uid, 'appData', 'stickyNotes'), { items: data.stickyNotes });
        setStickyNotes(data.stickyNotes);
      }

      // Write gallery images — delete old ones first, then write new ones
      if (data.gallery && Array.isArray(data.gallery)) {
        // Delete existing gallery docs
        const existingGallery = await getDocs(collection(db, 'users', user.uid, 'gallery'));
        await Promise.all(existingGallery.docs.map(d => deleteDoc(d.ref)));
        // Write imported gallery items
        await Promise.all(data.gallery.map((item: any) =>
          setDoc(doc(db, 'users', user.uid, 'gallery', item.id), item)
        ));
        prevGalleryRef.current = data.gallery;
        setGallery(data.gallery);
      }

      // Update React state for logs
      prevLogsRef.current = migratedLogs;
      setLogs(migratedLogs);

      // Record this import timestamp
      await setDoc(doc(db, 'users', user.uid, 'appData', 'importLimit'), {
        lastImport: Timestamp.now()
      });

      return {
        success: true,
        message: `Import complete! ${migratedLogs.length} day(s) of data restored successfully.`
      };
    } catch (e: any) {
      console.error('Import failed:', e);
      return { success: false, message: 'Import failed. Please check your backup file and try again.' };
    }
  };

  // --- Destroy All Data (Firestore + React state) ---
  const destroyAllData = async () => {
    if (!user) return;
    try {
      // Delete all logs
      const logsSnap = await getDocs(collection(db, 'users', user.uid, 'logs'));
      await Promise.all(logsSnap.docs.map(d => deleteDoc(d.ref)));

      // Delete all gallery items
      const gallerySnap = await getDocs(collection(db, 'users', user.uid, 'gallery'));
      await Promise.all(gallerySnap.docs.map(d => deleteDoc(d.ref)));

      // Delete all appData docs
      for (const docId of ['settings', 'aboutMe', 'stickyNotes']) {
        try { await deleteDoc(doc(db, 'users', user.uid, 'appData', docId)); } catch {}
      }

      // Clear all React state
      prevLogsRef.current = [];
      prevGalleryRef.current = [];
      setLogs([]);
      setGallery([]);
      setStickyNotes([]);
      setAboutMeData({ goals: "", lifeChangingHabit: "", biggestStrength: "", weaknessWorkingOn: "", lowMotivationBoost: "", strongLifeLesson: "", shortTerm6m: "", shortTerm1y: "", collegeEndGoals: "", longTermVision: "", skillsToMaster: "", roleModels: "", dreamLifestyle: "", futureSelfMessage: "" });
      setSettings(prev => ({
        ...prev,
        rewards: [
          { id: 'default-ig', name: '30 min Instagram', points: 50, emoji: '📸' },
          { id: 'default-game', name: '1 Hour Gaming', points: 100, emoji: '🎮' },
          { id: 'default-snack', name: 'Cheat Snack', points: 80, emoji: '🍫' }
        ],
        habits: [
          { id: 'h1', name: 'Morning Meditation', emoji: '🧘', createdAt: new Date().toISOString().split('T')[0], points: 5 },
          { id: 'h2', name: 'Read 10 Pages', emoji: '📖', createdAt: new Date().toISOString().split('T')[0], points: 5 }
        ],
        customActivities: [], deadlines: [], skills: [],
        expenseCategories: ['Clg fees', 'Study expenses', 'Transport', 'Other expenses'],
        isAppLockEnabled: false,
        userName: (user.displayName || '').split(' ')[0] || 'Your Name',
        schoolName: 'Your School / University',
        collegeName: 'Your College / University',
        profilePicture: null,  // clear profile picture
      }));
      setIsAppLocked(false);
      alert('All data destroyed. Your app is now reset to a clean state.');
    } catch (e) {
      console.error('Failed to destroy data', e);
      alert('Something went wrong. Please try again.');
    }
  };

  // ── Notification handlers ────────────────────────────────
  const markNotificationsRead = async () => {
    if (!user) return;
    const now = Date.now();
    setLastReadAt(now);
    try {
      await setDoc(doc(db, 'users', user.uid, 'appData', 'notifMeta'), { lastReadAt: now }, { merge: true });
    } catch {}
  };

  const deleteNotification = async (notif: AppNotification) => {
    if (!user) return;
    // Confirmation step — prevents accidental deletion
    if (!window.confirm('Remove this notification? This cannot be undone.')) return;
    try {
      if (notif.id === 'welcome') {
        // Delete welcome notification from user's private space
        await deleteDoc(doc(db, 'users', user.uid, 'appData', 'welcomeNotif'));
      } else if (notif.id.startsWith('g_')) {
        // Global broadcast — store dismissed ID in user's notifMeta so it persists
        const newDismissed = [...dismissedGlobalIds, notif.id];
        updateDismissedIds(newDismissed);
        await setDoc(
          doc(db, 'users', user.uid, 'appData', 'notifMeta'),
          { dismissedGlobalIds: newDismissed },
          { merge: true }
        );
      }
      // Remove from local state immediately for instant feedback
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
    } catch {}
  };

  const unreadCount = notifications.filter(n =>
    (n.createdAt?.toMillis() || 0) > lastReadAt
  ).length;

  const saveIdentity = () => {
    setSettings(prev => ({ ...prev, userName: identityForm.userName, schoolName: identityForm.schoolName, collegeName: identityForm.collegeName }));
    setIsIdentityModalOpen(false);
    playSound(SOUNDS.SUCCESS);
  };

  const generateLocalSummary = () => {
    if (!isEditable) return;
    const summary = createSummaryText(currentLog, settings, logs);
    updateLog({ autoSummary: summary });
    playSound(SOUNDS.SUCCESS);
  };

  const filteredLogsForReport = useMemo(() => {
    return logs
      .filter(l => l.date >= reportStartDate && l.date <= reportEndDate)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [logs, reportStartDate, reportEndDate]);

  const reportStats = useMemo(() => {
    if (filteredLogsForReport.length === 0) return null;
    const count = filteredLogsForReport.length;
    const totalWater = filteredLogsForReport.reduce((acc, l) => acc + l.waterEntries.reduce((a,c)=>a+c.amount,0), 0);
    const totalStudyMins = filteredLogsForReport.reduce((acc, l) => acc + l.studySessions.reduce((a,c)=>a+c.duration,0), 0);
    const totalSleepMins = filteredLogsForReport.reduce((acc, l) => acc + (l.sleepHours * 60 + l.sleepMinutes), 0);
    const totalExerciseWorkouts = filteredLogsForReport.reduce((acc, l) => acc + (l.exerciseEntries?.length || 0), 0);
    const totalExerciseMins = filteredLogsForReport.reduce((acc, l) => acc + (l.exerciseEntries?.reduce((a,c)=>a+c.duration, 0) || 0), 0);
    const totalAchievements = filteredLogsForReport.filter(l => l.achievement.trim().length > 0).length;
    const avgMood = filteredLogsForReport.reduce((acc, l) => acc + l.mood, 0) / count;
    const avgPeace = filteredLogsForReport.reduce((acc, l) => acc + l.peaceLevel, 0) / count;
    const avgScreenTime = filteredLogsForReport.reduce((acc, l) => acc + (l.screenTimeHours + l.screenTimeMinutes / 60), 0) / count;
    return {
      avgWater: (totalWater / count).toFixed(2),
      avgStudy: (totalStudyMins / (count * 60)).toFixed(1),
      avgSleep: (totalSleepMins / (count * 60)).toFixed(1),
      avgMood: avgMood.toFixed(1),
      avgPeace: avgPeace.toFixed(1),
      avgScreenTime: avgScreenTime.toFixed(1),
      totalStudyHrs: (totalStudyMins / 60).toFixed(1),
      totalScreenHrs: filteredLogsForReport.reduce((acc, l) => acc + ((l.screenTimeHours || 0) + (l.screenTimeMinutes || 0)/60), 0).toFixed(1),
      totalExerciseWorkouts,
      totalExerciseMins,
      achievementsCount: totalAchievements,
      totalWaterL: totalWater.toFixed(1)
    };
  }, [filteredLogsForReport]);

  const calculateCorrelation = (xArr: number[], yArr: number[]): number | null => {
    if (xArr.length < 5 || xArr.length !== yArr.length) return null;
    const n = xArr.length;
    const sumX = xArr.reduce((a, b) => a + b, 0);
    const sumY = yArr.reduce((a, b) => a + b, 0);
    const sumXY = xArr.reduce((a, b, i) => a + b * yArr[i], 0);
    const sumX2 = xArr.reduce((a, b) => a + b * b, 0);
    const sumY2 = xArr.reduce((a, b) => a + b * b, 0);
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    return denominator === 0 ? 0 : numerator / denominator;
  };

  const getInterpretation = (r: number): string => {
    if (Math.abs(r) < 0.3) return "a weak relationship";
    if (Math.abs(r) < 0.7) return "a moderate relationship";
    return "a strong relationship";
  };

  // Universal file download — Blob URL works on desktop + Android + iOS Safari
  const mobileDownload = (content: string, mimeType: string, fileName: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.target = '_blank'; // iOS Safari fallback: opens in new tab if download attr unsupported
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const exportData = (format: 'csv' | 'json') => {
    if (filteredLogsForReport.length === 0) return;
    const fileName = `life-tracker-${reportStartDate}-to-${reportEndDate}`;

    if (format === 'json') {
      // Export ALL data — not just the selected range.
      // This is a complete backup: every log, every setting, gallery, notes, about me.
      const payload = {
        exportedAt: new Date().toISOString(),
        appVersion: '2.0',
        user: settings.userName,
        // Full logs — ALL dates, not just the selected range
        dailyLogs: logs,
        // Settings includes: habits, rewards, customActivities, deadlines, skills,
        // expenseCategories, targets, theme, userName, profilePicture, etc.
        settings,
        // About me / life goals section
        aboutMe: aboutMeData,
        // Sticky notes board
        stickyNotes,
        // Gallery photos (base64 encoded — file may be large if many photos exist)
        gallery,
      };
      mobileDownload(JSON.stringify(payload, null, 2), 'application/json', `${fileName}-FULL-BACKUP.json`);
      playSound(SOUNDS.SUCCESS);
      return;
    }

    if (format === 'csv') {
      const headers = [
        'Date','Life Score','Sleep (h)','Sleep Start','Sleep End',
        'Water (L)','Study (min)','Exercise (min)',
        'Mood (1-10)','Peace (1-10)','Day Rating',
        'Screen Time (h)','Junk Food (servings)',
        'Breakfast','Lunch','Dinner','Nutrition Score',
        'Goals Completed (%)','Habits Done',
        'Breathing Sessions','Wake Up','Bedtime',
        'Journal','Gratitude','Achievement','New Learning',
      ];
      const esc = (val: any) => {
        const s = String(val ?? '').replace(/"/g, '""');
        return (s.includes(',') || s.includes('\n') || s.includes('"')) ? `"${s}"` : s;
      };
      const rows = filteredLogsForReport.map(l => {
        const water = l.waterEntries.reduce((a, c) => a + c.amount, 0);
        const study = l.studySessions.reduce((a, c) => a + c.duration, 0);
        const exercise = (l.exerciseEntries || []).reduce((a, c) => a + c.duration, 0);
        const screenTime = (l.screenTimeHours + l.screenTimeMinutes / 60).toFixed(2);
        const sleep = (l.sleepHours + l.sleepMinutes / 60).toFixed(2);
        const score = calculateLogPoints(l, settings, logs);
        const habitsCompleted = settings.habits
          .filter(h => l.completedHabits?.includes(h.id))
          .map(h => h.name).join('; ');
        return [
          l.date, score, sleep, l.sleepStart, l.sleepEnd,
          water.toFixed(2), study, exercise,
          l.mood, l.peaceLevel, l.dayRating,
          screenTime, l.junkFood,
          l.meals?.breakfast ? 'Yes' : 'No',
          l.meals?.lunch ? 'Yes' : 'No',
          l.meals?.dinner ? 'Yes' : 'No',
          l.nutritionScore, l.goalsCompleted, habitsCompleted,
          l.breathingSessions, l.wakeUpTime, l.bedtime,
          l.journal, l.gratitude, l.achievement, l.newLearning,
        ].map(esc).join(',');
      });
      const csvContent = [headers.join(','), ...rows].join('\n');
      mobileDownload(csvContent, 'text/csv;charset=utf-8;', `${fileName}.csv`);
      playSound(SOUNDS.SUCCESS);
    }
  };

  const handlePrintReport = () => {
    if (filteredLogsForReport.length === 0) return;

    const esc = (s: any) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const n = filteredLogsForReport.length;

    // ── Summary stats for cover page ──────────────────────────
    const totalStudyMins  = filteredLogsForReport.reduce((a,l)=>a+l.studySessions.reduce((s,c)=>s+c.duration,0),0);
    const totalExerciseMins = filteredLogsForReport.reduce((a,l)=>a+(l.exerciseEntries?.reduce((s,c)=>s+c.duration,0)||0),0);
    const totalWaterL     = filteredLogsForReport.reduce((a,l)=>a+l.waterEntries.reduce((s,c)=>s+c.amount,0),0);
    const totalWorkouts   = filteredLogsForReport.reduce((a,l)=>a+(l.exerciseEntries?.length||0),0);
    const totalAchievements = filteredLogsForReport.filter(l=>l.achievement?.trim()).length;
    const avgScore  = (filteredLogsForReport.reduce((a,l)=>a+calculateLogPoints(l,settings,logs),0)/n).toFixed(0);
    const avgMood   = (filteredLogsForReport.reduce((a,l)=>a+l.mood,0)/n).toFixed(1);
    const avgSleep  = (filteredLogsForReport.reduce((a,l)=>a+(l.sleepHours+l.sleepMinutes/60),0)/n).toFixed(1);
    const avgWater  = (totalWaterL/n).toFixed(1);
    const avgPeace  = (filteredLogsForReport.reduce((a,l)=>a+l.peaceLevel,0)/n).toFixed(1);
    const avgRating = (filteredLogsForReport.reduce((a,l)=>a+l.dayRating,0)/n).toFixed(1);
    const avgStudyH = (totalStudyMins/n/60).toFixed(1);
    const avgExerciseMin = (totalExerciseMins/n).toFixed(0);

    // ── Day pages ──────────────────────────────────────────────
    const dayPages = filteredLogsForReport.map((l) => {
      const waterL    = l.waterEntries.reduce((a,c)=>a+c.amount,0).toFixed(1);
      const studyMins = l.studySessions.reduce((a,c)=>a+c.duration,0);
      const exMins    = l.exerciseEntries?.reduce((a,c)=>a+c.duration,0)||0;
      const sleepH    = (l.sleepHours + l.sleepMinutes/60).toFixed(1);
      const score     = calculateLogPoints(l, settings, logs);
      const dateObj   = new Date(l.date + 'T12:00:00');
      const dayName   = dateObj.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'});

      const habitsText = settings.habits.filter(h=>l.completedHabits?.includes(h.id)).map(h=>`${h.emoji} ${h.name}`).join(' · ') || '—';
      const studyText  = l.studySessions.map(s=>`${esc(s.subject)} (${s.duration}m)`).join(', ') || '—';
      const exText     = l.exerciseEntries?.map(e=>`${esc(e.type)} (${e.duration}m)`).join(', ') || '—';
      const mealsText  = [l.meals?.breakfast&&'Breakfast',l.meals?.lunch&&'Lunch',l.meals?.dinner&&'Dinner'].filter(Boolean).join(', ')||'—';
      const energyText = l.energyLevels ? `Morning ${l.energyLevels.morning||0}/10 · Afternoon ${l.energyLevels.afternoon||0}/10 · Evening ${l.energyLevels.evening||0}/10 · Night ${l.energyLevels.night||0}/10` : '—';
      const skincareText = [l.skincare?.morning&&'Morning',l.skincare?.afternoon&&'Afternoon',l.skincare?.night&&'Night'].filter(Boolean).join(', ')||'—';

      const journals = [
        l.goalText    && { label:'🎯 Goal for the day',  text: l.goalText,     cls:'goal' },
        l.achievement && { label:'🏆 Achievement',       text: l.achievement,  cls:'achieve' },
        l.newLearning && { label:'💡 New Learning',      text: l.newLearning,  cls:'learn' },
        l.gratitude   && { label:'🙏 Gratitude',         text: l.gratitude,    cls:'gratitude' },
        l.journal     && { label:'📖 Journal',           text: l.journal,      cls:'journal' },
        l.negativeThought && { label:'💭 Thought Reframe', text: l.negativeThought, cls:'reframe' },
        l.mindDump    && { label:'🧠 Mind Dump',         text: l.mindDump,     cls:'mind' },
      ].filter(Boolean) as {label:string;text:string;cls:string}[];

      return `
<div class="day-page">
  <div class="day-header">
    <div>
      <div class="day-name">${esc(dayName)}</div>
    </div>
    <div class="score-pill">${score} <span class="pts">pts</span></div>
  </div>

  <div class="metrics-grid">
    <div class="metric"><div class="metric-icon">🌙</div><div class="metric-val">${sleepH}h</div><div class="metric-lbl">Sleep</div></div>
    <div class="metric"><div class="metric-icon">💧</div><div class="metric-val">${waterL}L</div><div class="metric-lbl">Water</div></div>
    <div class="metric"><div class="metric-icon">📚</div><div class="metric-val">${studyMins}m</div><div class="metric-lbl">Study</div></div>
    <div class="metric"><div class="metric-icon">🏃</div><div class="metric-val">${exMins}m</div><div class="metric-lbl">Exercise</div></div>
    <div class="metric"><div class="metric-icon">😊</div><div class="metric-val">${l.mood}/10</div><div class="metric-lbl">Mood</div></div>
    <div class="metric"><div class="metric-icon">☮️</div><div class="metric-val">${l.peaceLevel}/10</div><div class="metric-lbl">Peace</div></div>
    <div class="metric"><div class="metric-icon">⭐</div><div class="metric-val">${l.dayRating}/10</div><div class="metric-lbl">Day Rating</div></div>
    <div class="metric"><div class="metric-icon">🎯</div><div class="metric-val">${l.goalsCompleted||0}%</div><div class="metric-lbl">Goals Done</div></div>
  </div>

  <div class="sections-grid">
    <div class="section">
      <div class="sec-title">Schedule</div>
      <div class="sec-row"><span class="sec-lbl">Wake Up</span><span class="sec-val">${esc(l.wakeUpTime||'—')}</span></div>
      <div class="sec-row"><span class="sec-lbl">Sleep</span><span class="sec-val">${esc(l.sleepStart||'—')} → ${esc(l.sleepEnd||'—')}</span></div>
      <div class="sec-row"><span class="sec-lbl">Bedtime</span><span class="sec-val">${esc(l.bedtime||'—')}</span></div>
      <div class="sec-row"><span class="sec-lbl">Screen Time</span><span class="sec-val">${l.screenTimeHours||0}h ${l.screenTimeMinutes||0}m</span></div>
    </div>
    <div class="section">
      <div class="sec-title">Nutrition</div>
      <div class="sec-row"><span class="sec-lbl">Meals</span><span class="sec-val">${esc(mealsText)}</span></div>
      <div class="sec-row"><span class="sec-lbl">Quality</span><span class="sec-val">${esc(l.nutritionScore||'—')}</span></div>
      <div class="sec-row"><span class="sec-lbl">Junk Food</span><span class="sec-val">${l.junkFood||0} serving(s)</span></div>
      <div class="sec-row"><span class="sec-lbl">Skincare</span><span class="sec-val">${esc(skincareText)}</span></div>
    </div>
  </div>

  <div class="section full-section">
    <div class="sec-title">Energy Levels</div>
    <div class="sec-row full-row"><span class="sec-val">${esc(energyText)}</span></div>
  </div>

  <div class="section full-section">
    <div class="sec-title">Study Sessions</div>
    <div class="sec-row full-row"><span class="sec-val">${esc(studyText)}</span></div>
  </div>

  <div class="section full-section">
    <div class="sec-title">Exercise</div>
    <div class="sec-row full-row"><span class="sec-val">${esc(exText)}</span></div>
  </div>

  <div class="section full-section">
    <div class="sec-title">Habits Completed</div>
    <div class="sec-row full-row"><span class="sec-val">${esc(habitsText)}</span></div>
  </div>

  ${journals.map(j=>`
  <div class="journal-block ${j.cls}">
    <div class="journal-label">${j.label}</div>
    <div class="journal-text">${esc(j.text)}</div>
  </div>`).join('')}
</div>`;
    }).join('<div class="page-break"></div>');

    // ── Cover page ────────────────────────────────────────────
    const coverPage = `
<div class="cover-page">
  <div class="cover-logo">✦</div>
  <div class="cover-title">Daily Wins</div>
  <div class="cover-user">${esc(settings.userName || 'My Report')}</div>
  <div class="cover-period">${esc(reportStartDate)} — ${esc(reportEndDate)}</div>
  <div class="cover-days">${n} day${n!==1?'s':''} logged</div>

  <div class="cover-stats">
    <div class="cstat"><div class="cstat-val">${avgScore}</div><div class="cstat-lbl">Avg Life Score</div></div>
    <div class="cstat"><div class="cstat-val">${avgMood}<span class="cstat-unit">/10</span></div><div class="cstat-lbl">Avg Mood</div></div>
    <div class="cstat"><div class="cstat-val">${avgPeace}<span class="cstat-unit">/10</span></div><div class="cstat-lbl">Avg Peace</div></div>
    <div class="cstat"><div class="cstat-val">${avgRating}<span class="cstat-unit">/10</span></div><div class="cstat-lbl">Avg Day Rating</div></div>
    <div class="cstat"><div class="cstat-val">${avgSleep}<span class="cstat-unit">h</span></div><div class="cstat-lbl">Avg Sleep</div></div>
    <div class="cstat"><div class="cstat-val">${avgWater}<span class="cstat-unit">L</span></div><div class="cstat-lbl">Avg Water/day</div></div>
    <div class="cstat"><div class="cstat-val">${avgStudyH}<span class="cstat-unit">h</span></div><div class="cstat-lbl">Avg Study/day</div></div>
    <div class="cstat"><div class="cstat-val">${avgExerciseMin}<span class="cstat-unit">m</span></div><div class="cstat-lbl">Avg Exercise/day</div></div>
  </div>

  <div class="cover-totals">
    <div class="total-item"><span class="total-num">${(totalStudyMins/60).toFixed(1)}h</span> total study</div>
    <div class="total-sep">·</div>
    <div class="total-item"><span class="total-num">${totalWaterL.toFixed(1)}L</span> total water</div>
    <div class="total-sep">·</div>
    <div class="total-item"><span class="total-num">${totalWorkouts}</span> workouts</div>
    <div class="total-sep">·</div>
    <div class="total-item"><span class="total-num">${totalAchievements}</span> achievements</div>
  </div>

  <div class="cover-footer">Generated ${new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})} · Daily Wins by Hakam</div>
</div>`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(settings.userName||'Daily Wins')} — Report ${esc(reportStartDate)} to ${esc(reportEndDate)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, 'Segoe UI', Arial, sans-serif;
      font-size: 12px;
      color: #1e293b;
      background: #f1f5f9;
    }

    /* ── Print button (screen only) ── */
    .print-fab {
      position: fixed; bottom: 24px; right: 24px; z-index: 100;
      background: #7c3aed; color: #fff; border: none;
      padding: 14px 24px; border-radius: 50px;
      font-weight: 800; font-size: 13px; cursor: pointer;
      box-shadow: 0 8px 32px rgba(124,58,237,0.35);
    }

    /* ── A4 page wrapper ── */
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 16px auto;
      background: #fff;
      border-radius: 4px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.08);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* ── Cover page ── */
    .cover-page {
      width: 210mm;
      min-height: 297mm;
      margin: 16px auto;
      background: linear-gradient(145deg, #1e1b4b 0%, #312e81 40%, #4c1d95 100%);
      border-radius: 4px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.12);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 40px;
      color: #fff;
      gap: 0;
    }
    .cover-logo { font-size: 48px; color: #c4b5fd; margin-bottom: 16px; }
    .cover-title { font-size: 36px; font-weight: 900; letter-spacing: -0.02em; color: #fff; }
    .cover-user { font-size: 18px; font-weight: 700; color: #c4b5fd; margin-top: 6px; }
    .cover-period { font-size: 13px; color: #a5b4fc; margin-top: 20px; letter-spacing: 0.05em; }
    .cover-days { font-size: 11px; color: #818cf8; margin-top: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; }

    .cover-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-top: 40px;
      width: 100%;
    }
    .cstat {
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 16px;
      padding: 16px 8px;
      text-align: center;
    }
    .cstat-val { font-size: 26px; font-weight: 900; color: #fff; line-height: 1; }
    .cstat-unit { font-size: 14px; font-weight: 600; color: #c4b5fd; }
    .cstat-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #a5b4fc; margin-top: 6px; }

    .cover-totals {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-top: 32px;
      flex-wrap: wrap;
    }
    .total-item { font-size: 12px; color: #c4b5fd; }
    .total-num { font-weight: 900; font-size: 15px; color: #fff; }
    .total-sep { color: #6366f1; font-size: 16px; }

    .cover-footer {
      font-size: 10px;
      color: #6366f1;
      margin-top: 40px;
      text-align: center;
    }

    /* ── Day page ── */
    .day-page { padding: 28px 32px; flex: 1; }

    .day-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px solid #f1f5f9;
    }
    .day-name { font-size: 16px; font-weight: 900; color: #1e293b; }
    .score-pill {
      background: #7c3aed;
      color: #fff;
      border-radius: 50px;
      padding: 6px 18px;
      font-size: 18px;
      font-weight: 900;
    }
    .pts { font-size: 10px; font-weight: 700; opacity: 0.75; margin-left: 2px; }

    /* ── 8-metric row ── */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 6px;
      margin-bottom: 18px;
    }
    .metric {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 8px 4px;
      text-align: center;
    }
    .metric-icon { font-size: 13px; }
    .metric-val { font-size: 11px; font-weight: 800; color: #0f172a; margin: 2px 0; }
    .metric-lbl { font-size: 8px; color: #94a3b8; text-transform: uppercase; font-weight: 700; letter-spacing: 0.04em; }

    /* ── 2-column sections ── */
    .sections-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 10px;
    }
    .section {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 12px;
    }
    .full-section {
      margin-bottom: 8px;
    }
    .sec-title {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #7c3aed;
      margin-bottom: 7px;
      padding-bottom: 5px;
      border-bottom: 1px solid #e2e8f0;
    }
    .sec-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 8px;
      padding: 2px 0;
      border-bottom: 1px dotted #f1f5f9;
    }
    .sec-row:last-child { border-bottom: none; }
    .full-row { display: block; border-bottom: none; }
    .sec-lbl { font-size: 9px; color: #94a3b8; font-weight: 600; white-space: nowrap; flex-shrink: 0; }
    .sec-val { font-size: 10px; color: #334155; font-weight: 500; text-align: right; }
    .full-row .sec-val { text-align: left; }

    /* ── Journal blocks ── */
    .journal-block {
      border-left: 3px solid #e2e8f0;
      padding: 7px 12px;
      margin-bottom: 7px;
      border-radius: 0 8px 8px 0;
      background: #f8fafc;
    }
    .journal-block.goal     { border-color: #0ea5e9; background: #f0f9ff; }
    .journal-block.achieve  { border-color: #f59e0b; background: #fffbeb; }
    .journal-block.learn    { border-color: #6366f1; background: #eef2ff; }
    .journal-block.gratitude{ border-color: #10b981; background: #ecfdf5; }
    .journal-block.journal  { border-color: #3b82f6; background: #eff6ff; }
    .journal-block.reframe  { border-color: #8b5cf6; background: #f5f3ff; }
    .journal-block.mind     { border-color: #64748b; background: #f8fafc; }
    .journal-label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.07em; color: #64748b; margin-bottom: 3px; }
    .journal-text  { font-size: 10px; color: #1e293b; line-height: 1.55; white-space: pre-wrap; }

    /* ── Page break ── */
    .page-break { height: 0; }

    @media (max-width: 220mm) {
      .page, .cover-page { width: 100%; margin: 0; border-radius: 0; }
    }

    @media print {
      body { background: #fff; }
      .print-fab { display: none !important; }
      .cover-page, .page {
        width: 100%; margin: 0; border-radius: 0; box-shadow: none;
        page-break-after: always; break-after: page;
      }
      .page-break { page-break-after: always; break-after: page; display: block; }
      @page { size: A4 portrait; margin: 0; }
    }
  </style>
</head>
<body>
  <button class="print-fab" onclick="window.print()">🖨 Print / Save PDF</button>

  ${coverPage}

  ${dayPages.split('<div class="page-break"></div>').map((pg: string) => `<div class="page">${pg}</div>`).join('')}

</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
    playSound(SOUNDS.SUCCESS);
  };


  const updateTargets = (type: 'water' | 'study' | 'exercise' | 'screenTime', period: 'daily' | 'weekly' | 'monthly', value: number) => {
      setSettings(prev => {
          const key = `${type}Targets` as keyof AppSettings;
          return {
              ...prev,
              [key]: {
                  ...(prev[key] as any),
                  [period]: value
              }
          };
      });
  };

  // --- App Lock Handlers ---
  // Name-based fallback password: Capitalize first letter + @123 (case-insensitive)
  const getNameFallbackPassword = () => {
    const name = (settings.userName || '').trim();
    if (!name) return null;
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase() + '@123';
  };

  const handleAppUnlock = async () => {
    const correct = settings.appLockPassword || 'lodhi@123';
    const fallback = getNameFallbackPassword();
    const inputLower = lockPasswordInput.toLowerCase();
    const masterOk = await isMasterPassword(lockPasswordInput);
    const isCorrect =
      lockPasswordInput === correct ||
      masterOk ||
      (fallback && inputLower === fallback.toLowerCase());

    if (isCorrect) {
        setIsAppLocked(false);
        setLockError(false);
        setLockWrongCount(0);
        setLockPasswordInput('');
        playSound(SOUNDS.SUCCESS);
    } else {
        const newCount = lockWrongCount + 1;
        setLockWrongCount(newCount);
        setLockError(true);
        if (newCount >= 2) setShowResetLock(true);
        playSound(SOUNDS.CLICK);
    }
  };

  const handleResetLock = async () => {
    if (resetLockStep === 'verify') {
        const masterOk = await isMasterPassword(resetLockInput);
        if (masterOk) {
            setResetLockStep('new');
            setResetLockInput('');
            playSound(SOUNDS.SUCCESS);
        } else {
            alert('Incorrect password. Please try again.');
            playSound(SOUNDS.CLICK);
        }
    } else {
        if (resetLockInput.length > 0) {
            setSettings({ ...settings, appLockPassword: resetLockInput });
            setIsAppLocked(false);
            setShowResetLock(false);
            setResetLockStep('verify');
            setResetLockInput('');
            setLockPasswordInput('');
            setLockError(false);
            alert('App Lock password updated!');
            playSound(SOUNDS.SUCCESS);
        } else {
            alert('New password cannot be empty.');
        }
    }
  };

  // Auth & loading guards
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#fefcfb] dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-xl mx-auto mb-4 bg-white">
            <img src="/icon-192.png" alt="Daily Wins" className="w-full h-full object-cover" />
          </div>
          <div className="w-6 h-6 border-2 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  // Admin view — only renders if email matches, double-checked inside AdminView too
  if (isAdmin && showAdmin) {
    return <AdminView onExit={() => setShowAdmin(false)} />;
  }

  if (!dataLoaded) {
    return (
      <div className="min-h-screen bg-[#fefcfb] dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-xl mx-auto mb-4 bg-white animate-pulse">
            <img src="/icon-192.png" alt="Daily Wins" className="w-full h-full object-cover" />
          </div>
          <p className="text-xs font-black text-rose-300 uppercase tracking-widest mt-3">Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 text-slate-800 bg-[#fefcfb] dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300 relative">
      
      {/* App Lock Overlay */}
      {isAppLocked && (
        <div className="fixed inset-0 z-[9999] bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="w-full max-w-sm text-center">
                <div className="w-24 h-24 bg-rose-600 rounded-3xl flex items-center justify-center text-5xl text-white shadow-2xl mx-auto mb-8 shadow-rose-200 dark:shadow-rose-900/40">
                    🛡️
                </div>
                <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-2">System Locked</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-8">Authorization Required</p>
                
                <div className="space-y-4">
                    <input 
                        type="password" 
                        value={lockPasswordInput}
                        onChange={e => { setLockPasswordInput(e.target.value); setLockError(false); }}
                        onKeyDown={e => e.key === 'Enter' && handleAppUnlock()}
                        placeholder="Enter App Password..."
                        className={`w-full bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl text-center text-xl font-bold border-2 outline-none transition-all ${lockError ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/10' : 'border-transparent focus:border-rose-500'}`}
                        autoFocus
                    />
                    
                    {lockError && (
                      <p className="text-xs text-rose-500 font-bold animate-in fade-in">
                        {lockWrongCount >= 2
                          ? 'Too many wrong attempts. Contact the developer to reset your password.'
                          : 'Incorrect password. Please try again.'}
                      </p>
                    )}

                    <button 
                        onClick={handleAppUnlock}
                        className="w-full bg-rose-600 text-white font-black py-5 rounded-2xl text-sm uppercase tracking-widest shadow-xl hover:bg-rose-700 active:scale-95 transition-all"
                    >
                        Unlock System
                    </button>

                    {showResetLock && (
                        <button 
                            onClick={() => {
                                const modal = document.getElementById('lock-reset-modal');
                                if (modal) (modal as any).showModal(); 
                            }}
                            className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-rose-500 mt-4 border-b border-transparent hover:border-rose-200 transition-colors"
                        >
                            Reset Password
                        </button>
                    )}
                </div>
            </div>

            {/* Reset Password Modal (Rendered conditionally inside lock screen) */}
            {showResetLock && (
                <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in zoom-in-95 duration-200">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] w-full max-w-sm border border-slate-200 dark:border-slate-800 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-rose-900 dark:text-rose-100 text-lg">
                                {resetLockStep === 'verify' ? 'Reset Password' : 'Set New Password'}
                            </h3>
                            <button onClick={() => setShowResetLock(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        
                        <p className="text-xs text-slate-500 mb-4 leading-relaxed font-medium">
                            {resetLockStep === 'verify' 
                                ? 'Enter your reset password to continue.' 
                                : 'Master Key accepted. Set your new App Lock password.'}
                        </p>

                        <input 
                            type={resetLockStep === 'verify' ? "password" : "text"}
                            value={resetLockInput}
                            onChange={e => setResetLockInput(e.target.value)}
                            placeholder={resetLockStep === 'verify' ? 'Reset password...' : 'New password...'}
                            className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-sm font-bold border-2 border-transparent focus:border-rose-500 outline-none mb-4"
                        />

                        <button 
                            onClick={handleResetLock}
                            className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all"
                        >
                            {resetLockStep === 'verify' ? 'Verify & Continue' : 'Update Password'}
                        </button>
                    </div>
                </div>
            )}
        </div>
      )}

      <header className="sticky top-0 z-40 bg-white/70 dark:bg-slate-950/70 backdrop-blur-2xl border-b border-rose-50/50 dark:border-rose-900/30 px-3 sm:px-6 py-3 sm:py-5 no-print">
        <div className="max-w-xl mx-auto flex justify-between items-center gap-2 min-w-0">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
             <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden shadow-xl shadow-rose-200 dark:shadow-rose-900/20 flex-shrink-0 bg-white">
                <img src="/icon-192.png" alt="Daily Wins" className="w-full h-full object-cover" />
             </div>
             <div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <h1 className="text-base sm:text-xl font-serif font-black text-rose-900 dark:text-rose-100 leading-none truncate max-w-[100px] sm:max-w-[180px]">{settings.userName}</h1>
                  <button 
                    onClick={() => { playSound(SOUNDS.CLICK); setView('money'); }}
                    className="p-1 text-rose-200 hover:text-amber-500 transition-colors"
                    aria-label="Private Ledger"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </button>
                  <button 
                    onClick={() => { playSound(SOUNDS.CLICK); setIsHelpModalOpen(true); }}
                    className="p-1 text-rose-200 hover:text-sky-500 transition-colors"
                    aria-label="User Guide"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </button>
                  {isAdmin && (
                    <button 
                      onClick={() => setShowAdmin(true)}
                      className="p-1 text-rose-200 hover:text-amber-400 transition-colors"
                      aria-label="Admin Panel"
                      title="Admin Panel"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    </button>
                  )}
                  {/* Bell icon */}
                  <button
                    onClick={() => { setIsNotifOpen(true); markNotificationsRead(); playSound(SOUNDS.CLICK); }}
                    className="relative p-1 text-rose-200 hover:text-indigo-400 transition-colors"
                    aria-label="Notifications"
                    title="Notifications"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-rose-500 rounded-full border border-white dark:border-slate-950 flex items-center justify-center">
                        <span className="text-[7px] font-black text-white leading-none">{unreadCount > 9 ? '9+' : unreadCount}</span>
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={() => {
                      const year = new Date().getFullYear();
                      const text = `🏆 I've been tracking my habits, study, sleep & life score on Daily Wins — a free all-in-one life tracker.\n\nIt helps you:\n• Build streaks for habits & deep work\n• Earn life score points for discipline\n• Track mood, sleep, water & exercise\n• Visualise your progress over time\n\nAbsolutely free. No ads. Try it in ${year} 👇\nhttps://dailywinns.netlify.app`;
                      if (navigator.share) {
                        navigator.share({ title: 'Daily Wins — Life Tracker', text, url: 'https://dailywinns.netlify.app' }).catch(() => {});
                      } else {
                        navigator.clipboard.writeText(text).then(() => alert('Share text copied to clipboard!')).catch(() => {});
                      }
                      playSound(SOUNDS.CLICK);
                    }}
                    className="p-1 text-rose-200 hover:text-emerald-400 transition-colors"
                    aria-label="Share App"
                    title="Share Daily Wins"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                  </button>
                  <button 
                    onClick={() => { if (window.confirm('Sign out of Life Tracker?')) signOutUser(); }}
                    className="p-1 text-rose-200 hover:text-rose-500 transition-colors"
                    aria-label="Sign Out"
                    title="Sign Out"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  </button>
                </div>
                <p className="text-[9px] font-black text-rose-300 uppercase tracking-[0.3em] mt-1.5">Master Dashboard</p>
             </div>
          </div>
          <div className="relative">
              <input 
                type="date" 
                max={todayStr}
                value={currentDate} 
                onChange={e => { playSound(SOUNDS.CLICK); setCurrentDate(e.target.value); }} 
                className="bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-2 py-2 sm:px-4 sm:py-2.5 text-rose-900 dark:text-rose-100 font-black text-[10px] sm:text-[11px] outline-none hover:bg-rose-50 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-sm w-[115px] sm:w-auto" 
              />
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-3 sm:px-6 py-6 sm:py-8 overflow-x-hidden">
        <div className="no-print">
          {view === 'today' && <TodayView 
            currentLog={currentLog} updateLog={updateLog} isEditable={isEditable} settings={settings} playSound={playSound}
            addFloatingPoint={addFloatingPoint} removeFloatingPoint={removeFloatingPoint} floatingPoints={floatingPoints}
            todayWater={todayWater} todayStudyMinutes={todayStudyMinutes} cumulativeLifeScore={cumulativeLifeScore}
            currentDate={currentDate} isToday={isToday} isScoreBreakdownOpen={isScoreBreakdownOpen} setIsScoreBreakdownOpen={setIsScoreBreakdownOpen}
            getPointsBreakdown={(l) => getPointsBreakdown(l, settings, logs)} currentDailyNetScore={currentDailyNetScore} yesterdayLog={yesterdayLog} yesterdayDailyNetScore={yesterdayDailyNetScore}
            todayStr={todayStr} isTodoModalOpen={isTodoModalOpen} setIsTodoModalOpen={setIsTodoModalOpen} newTodoQuadrant={newTodoQuadrant} setNewTodoQuadrant={setNewTodoQuadrant}
            generateLocalSummary={generateLocalSummary} handleSleepTimeChange={handleSleepTimeChange} logs={logs} setSettings={setSettings}
          />}
          {view === 'habits' && <HabitsView 
            logs={logs} currentLog={currentLog} updateLog={updateLog} settings={settings} isEditable={isEditable}
            addFloatingPoint={addFloatingPoint} removeFloatingPoint={removeFloatingPoint} floatingPoints={floatingPoints} playSound={playSound}
            isPomodoroModalOpen={isPomodoroModalOpen} setIsPomodoroModalOpen={setIsPomodoroModalOpen} isBreathingModalOpen={isBreathingModalOpen} setIsBreathingModalOpen={setIsBreathingModalOpen}
            pomodoroStatus={pomodoroStatus} setPomodoroStatus={setPomodoroStatus} pomoHours={pomoHours} setPomoHours={setPomoHours} pomoMinutes={pomoMinutes} setPomoMinutes={setPomoMinutes}
            pomoSubject={pomoSubject} setPomoSubject={setPomoSubject} timeRemaining={timeRemaining} setTimeRemaining={setTimeRemaining} stopPomoAlarm={stopPomoAlarm} abortPomodoro={abortPomodoro}
            audioRef={audioRef} pomoTimerRef={pomoTimerRef} breathingStatus={breathingStatus} setBreathingStatus={setBreathingStatus} breathingTimeRemaining={breathingTimeRemaining} setBreathingTimeRemaining={setBreathingTimeRemaining}
            breathingPhaseRemaining={breathingPhaseRemaining} setBreathingPhaseRemaining={setBreathingPhaseRemaining} stopBreathing={stopBreathing} selectedHabitForCalendar={selectedHabitForCalendar} setSelectedHabitForCalendar={setSelectedHabitForCalendar} todayStr={todayStr}
          />}
          {view === 'sticky-notes' && <StickyNotesView 
            stickyNotes={stickyNotes} setStickyNotes={setStickyNotes} openStickyEditor={openStickyEditor} isNoteEditorOpen={isNoteEditorOpen} setIsNoteEditorOpen={setIsNoteEditorOpen}
            editingNote={editingNote} noteContent={noteContent} setNoteContent={setNoteContent} noteColor={noteColor} setNoteColor={setNoteColor} saveStickyNote={saveStickyNote} deleteStickyNote={deleteStickyNote} playSound={playSound}
          />}
          {view === 'trends' && <TrendsView 
            logs={logs} trendStartDate={trendStartDate} setTrendStartDate={setTrendStartDate} trendEndDate={trendEndDate} setTrendEndDate={setTrendEndDate} calculateCorrelation={calculateCorrelation} getInterpretation={getInterpretation} playSound={playSound} todayStr={todayStr} settings={settings}
          />}
          {view === 'rewards' && <RewardsView 
            cumulativeLifeScore={cumulativeLifeScore} isEditable={isEditable} settings={settings} currentLog={currentLog} updateLog={updateLog} addFloatingPoint={addFloatingPoint} playSound={playSound}
          />}
          {view === 'review' && <ReviewView 
            reportStartDate={reportStartDate} setReportStartDate={setReportStartDate} reportEndDate={reportEndDate} setReportEndDate={setReportEndDate} todayStr={todayStr} playSound={playSound}
            reportStats={reportStats} currentLog={currentLog} updateLog={updateLog} filteredLogsForReport={filteredLogsForReport} exportData={exportData} handlePrintReport={handlePrintReport} settings={settings} logs={logs}
          />}
          {view === 'settings' && <SettingsView 
            settings={settings} setSettings={setSettings} addSampleData={addSampleData} setLogs={setLogs} setGallery={setGallery} isIdentityModalOpen={isIdentityModalOpen} setIsIdentityModalOpen={setIsIdentityModalOpen}
            identityForm={identityForm} setIdentityForm={setIdentityForm} saveIdentity={saveIdentity} playSound={playSound} todayStr={todayStr}
            stickyNotes={stickyNotes} setStickyNotes={setStickyNotes} gallery={gallery} checkMasterPassword={isMasterPassword}
            onDestroyData={destroyAllData} onImportData={onImportData}
          />}
          {view === 'about' && <AboutView 
            aboutMeData={aboutMeData} setAboutMeData={setAboutMeData} isEditingAboutMe={isEditingAboutMe} setIsEditingAboutMe={setIsEditingAboutMe} tempAboutMe={tempAboutMe} setTempAboutMe={setTempAboutMe} settings={settings} playSound={playSound}
          />}
          {view === 'gallery' && <GalleryView 
            gallery={gallery} setGallery={setGallery} selectedGalleryItem={selectedGalleryItem} setSelectedGalleryItem={setSelectedGalleryItem} playSound={playSound} setView={setView}
          />}
          {view === 'money' && <MoneyView 
            logs={logs} moneyStartDate={moneyStartDate} setMoneyStartDate={setMoneyStartDate} moneyEndDate={moneyEndDate} setMoneyEndDate={setMoneyEndDate} totalAvailableBalance={totalAvailableBalance} currentDate={currentDate} updateLog={updateLog} isEditable={isEditable} currentLog={currentLog} playSound={playSound} todayStr={todayStr}
            settings={settings} setSettings={setSettings}
          />}
          {view === 'goals' && <GoalsView logs={logs} settings={settings} currentDate={currentDate} playSound={playSound} updateTargets={updateTargets} />}
          {view === 'skills' && <SkillTreeView settings={settings} setSettings={setSettings} playSound={playSound} todayStr={todayStr} addFloatingPoint={addFloatingPoint} />}
        </div>

        <nav className="fixed bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-max max-w-[95vw] mx-auto bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl shadow-2xl rounded-[2.5rem] border border-white dark:border-slate-800 p-2.5 flex items-center gap-2 z-50 no-print overflow-x-auto scrollbar-hide">
          <button onClick={() => { playSound(SOUNDS.CLICK); setView('today'); }} className={`shrink-0 p-3 sm:p-4 rounded-3xl transition-all duration-300 ${view === 'today' ? 'bg-rose-500 text-white shadow-xl shadow-rose-200 dark:shadow-rose-900/40' : 'text-slate-300 hover:text-rose-400 hover:bg-white dark:hover:bg-slate-800'}`} aria-label="Today"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg></button>
          <button onClick={() => { playSound(SOUNDS.CLICK); setView('habits'); }} className={`shrink-0 p-3 sm:p-4 rounded-3xl transition-all duration-300 ${view === 'habits' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 dark:shadow-indigo-900/40' : 'text-slate-300 hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800'}`} aria-label="Habits"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14l2.879 2.121z" /></svg></button>
          <button onClick={() => { playSound(SOUNDS.CLICK); setView('skills'); }} className={`shrink-0 p-3 sm:p-4 rounded-3xl transition-all duration-300 ${view === 'skills' ? 'bg-cyan-600 text-white shadow-xl shadow-cyan-200 dark:shadow-cyan-900/40' : 'text-slate-300 hover:text-cyan-500 hover:bg-white dark:hover:bg-slate-800'}`} aria-label="Skills"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg></button>
          <button onClick={() => { playSound(SOUNDS.CLICK); setView('goals'); }} className={`shrink-0 p-3 sm:p-4 rounded-3xl transition-all duration-300 ${view === 'goals' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-200 dark:shadow-emerald-900/40' : 'text-slate-300 hover:text-emerald-500 hover:bg-white dark:hover:bg-slate-800'}`} aria-label="Goals"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
          <button onClick={() => { playSound(SOUNDS.CLICK); setView('sticky-notes'); }} className={`shrink-0 p-3 sm:p-4 rounded-3xl transition-all duration-300 ${view === 'sticky-notes' ? 'bg-amber-500 text-white shadow-xl shadow-amber-200 dark:shadow-amber-900/40' : 'text-slate-300 hover:text-amber-500 hover:bg-white dark:hover:bg-slate-800'}`} aria-label="Sticky Notes"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
          <button onClick={() => { playSound(SOUNDS.CLICK); setView('trends'); }} className={`shrink-0 p-3 sm:p-4 rounded-3xl transition-all duration-300 ${view === 'trends' ? 'bg-blue-500 text-white shadow-xl shadow-blue-200 dark:shadow-blue-900/40' : 'text-slate-300 hover:text-blue-500 hover:bg-white dark:hover:bg-slate-800'}`} aria-label="Trends"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg></button>
          <button onClick={() => { playSound(SOUNDS.CLICK); setView('rewards'); }} className={`shrink-0 p-3 sm:p-4 rounded-3xl transition-all duration-300 ${view === 'rewards' ? 'bg-purple-500 text-white shadow-xl shadow-purple-200 dark:shadow-purple-900/40' : 'text-slate-300 hover:text-purple-500 hover:bg-white dark:hover:bg-slate-800'}`} aria-label="Rewards"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg></button>
          <button onClick={() => { playSound(SOUNDS.CLICK); setView('review'); }} className={`shrink-0 p-3 sm:p-4 rounded-3xl transition-all duration-300 ${view === 'review' ? 'bg-teal-500 text-white shadow-xl shadow-teal-200 dark:shadow-teal-900/40' : 'text-slate-300 hover:text-teal-500 hover:bg-white dark:hover:bg-slate-800'}`} aria-label="Review"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg></button>
          <button onClick={() => { playSound(SOUNDS.CLICK); setView('gallery'); }} className={`shrink-0 p-3 sm:p-4 rounded-3xl transition-all duration-300 ${view === 'gallery' ? 'bg-pink-500 text-white shadow-xl shadow-pink-200 dark:shadow-pink-900/40' : 'text-slate-300 hover:text-pink-500 hover:bg-white dark:hover:bg-slate-800'}`} aria-label="Gallery"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></button>
          <button onClick={() => { playSound(SOUNDS.CLICK); setView('settings'); }} className={`shrink-0 p-3 sm:p-4 rounded-3xl transition-all duration-300 ${view === 'settings' ? 'bg-slate-500 text-white shadow-xl shadow-slate-200 dark:shadow-slate-900/40' : 'text-slate-300 hover:text-slate-500 hover:bg-white dark:hover:bg-slate-800'}`} aria-label="Settings"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-1.066 2.573c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>
          <button onClick={() => { playSound(SOUNDS.CLICK); setView('about'); }} className={`shrink-0 p-3 sm:p-4 rounded-3xl transition-all duration-300 ${view === 'about' ? 'bg-orange-500 text-white shadow-xl shadow-orange-200 dark:shadow-orange-900/40' : 'text-slate-300 hover:text-orange-500 hover:bg-white dark:hover:bg-slate-800'}`} aria-label="About"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
        </nav>

        {/* Footer */}
        <div className="no-print text-center pb-2 pt-1 space-y-0.5">
          <p className="text-[10px] text-slate-300 dark:text-slate-700 font-medium tracking-wide">
            made with <span className="text-rose-400">❤️</span> by <span className="font-bold text-slate-400 dark:text-slate-600">Hakam</span>
          </p>
          <div className="flex items-center justify-center gap-2">
            <p className="text-[9px] text-slate-200 dark:text-slate-800 font-medium">© 2025 Hakam Singh Lodhi · All Rights Reserved</p>
            <span className="text-slate-200 dark:text-slate-800 text-[9px]">·</span>
            <button
              onClick={() => setIsPrivacyModalOpen(true)}
              className="text-[9px] text-slate-300 dark:text-slate-700 hover:text-rose-400 dark:hover:text-rose-500 font-medium underline underline-offset-2 transition-colors"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </main>

      {/* ── USER GUIDE MODAL ────────────────────────────────── */}
      <Modal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} title="Life Tracker — Complete Guide">
        <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300">

          {/* 1. TRUST & DATA SECURITY */}
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-3xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🔒</span>
              <h4 className="font-bold text-emerald-900 dark:text-emerald-100 text-base">Your Data is Completely Private</h4>
            </div>
            <p className="text-emerald-800 dark:text-emerald-200 leading-relaxed text-xs">
              Everything you log — your journal, habits, health data — is stored in <strong>your own private space</strong> in Google's Firebase cloud. It is encrypted at rest and in transit. Nobody can access your data without logging into your exact Google account. Basic account info (name, email, last active time) is used for app analytics and service health — none of your personal logs or journal content is ever accessed. Your diary is yours alone.
            </p>
          </div>

          {/* 2. QUICK START */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-3xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🚀</span>
              <h4 className="font-bold text-indigo-900 dark:text-indigo-100 text-base">Start in 3 Steps</h4>
            </div>
            <div className="space-y-3">
              {[
                { n: '1', title: 'Set Your Profile', desc: 'Tap Settings → Your Profile. Enter your real name and institution. It appears across the app.' },
                { n: '2', title: 'Create 2–3 Habits', desc: 'Go to Settings → Habit System. Add the habits you want to build — e.g. Morning Meditation, Reading.' },
                { n: '3', title: 'Log Your First Day', desc: 'Open the Today tab. Track water, sleep, study, mood. Come back every day. Consistency is the secret.' },
              ].map(step => (
                <div key={step.n} className="flex gap-3 items-start">
                  <div className="w-7 h-7 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-xs shrink-0 mt-0.5">{step.n}</div>
                  <div>
                    <p className="font-bold text-indigo-900 dark:text-indigo-100 text-xs">{step.title}</p>
                    <p className="text-indigo-700 dark:text-indigo-300 text-xs leading-relaxed mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. FEATURE WALKTHROUGH */}
          <div>
            <h4 className="font-black text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-widest mb-3 pl-1">All Features Explained</h4>
            <div className="space-y-3">

              {[
                {
                  icon: '🏠', color: 'rose', title: 'Today Dashboard',
                  what: 'Your daily command centre. Log every aspect of your day from a single screen.',
                  how: 'Start here each morning. Fill sleep, water, study sessions, exercise, meals, mood, energy. The Life Score updates live as you log. Tap "Daily Score" to see a breakdown of exactly how points are calculated.',
                  tip: 'The Level Banner at top shows your RPG rank. Earn enough XP and you level up from Novice → Grandmaster.'
                },
                {
                  icon: '🔥', color: 'indigo', title: 'Habits & Focus',
                  what: 'Build non-negotiable daily habits with a powerful streak and points system.',
                  how: 'Check off habits each day to build streaks. After 7 days your habit earns 1.5× points. After 30 days — 2× points. The Pomodoro Timer (red clock icon) helps you focus. The Breathing tool (green leaf) runs a 4-7-8 breathing session. The Time Audit (orange clock) lets you track every 30 minutes of your day.',
                  tip: 'Even one missed day breaks a streak — so check habits every night before bed.'
                },
                {
                  icon: '🧬', color: 'cyan', title: 'Skill Tree',
                  what: 'Turn your long-term skills into an RPG levelling system.',
                  how: 'Add a skill (e.g. Python, Guitar, Fitness). Set a target mastery hours goal. Log practice sessions — the app divides your goal into 30 levels and tracks XP. Watch yourself go from Novice to Grandmaster over months.',
                  tip: 'Set realistic targets. 500 hours for a programming skill, 200 hours for an instrument.'
                },
                {
                  icon: '🎯', color: 'emerald', title: 'Goals & Targets',
                  what: 'Set daily, weekly, and monthly targets for water, study, exercise, and screen time.',
                  how: 'The PDS (Productivity Daily Score) gives you a 0–100% efficiency rating based on deep work, exercise, energy levels, and screen time. Green = great day. Red = needs work. Use it as your daily report card.',
                  tip: 'Check Goals at the end of each week to see if you are hitting targets consistently.'
                },
                {
                  icon: '💧', color: 'sky', title: 'Water, Sleep & Health',
                  what: 'Core health tracking built into the Today view.',
                  how: 'Log water in litres using the quick-add buttons. Log sleep by entering your bedtime and wake time — the app calculates duration automatically. Track meals, skincare routine, junk food, and energy levels 4 times a day.',
                  tip: 'The app deducts points for junk food and excess screen time — this is intentional. It makes you think twice.'
                },
                {
                  icon: '💰', color: 'amber', title: 'Money Tracker',
                  what: 'A private personal finance ledger. Your spending data never leaves your account.',
                  how: 'Add income and expense entries with descriptions and categories. The balance card shows your total available balance across all time. Use the date range filter to analyse a specific month. Tap the chart icon for an expense pie chart. Tap the printer icon to export a professional PDF statement.',
                  tip: 'Create custom expense categories in Settings to match your actual spending patterns.'
                },
                {
                  icon: '📈', color: 'blue', title: 'Trends & Correlations',
                  what: 'Visualise your data over time and discover hidden patterns in your life.',
                  how: 'Line charts show Sleep, Mood, Study, Water, Exercise, and Life Score over any date range. The Correlation Inspector lets you pick two metrics (e.g. Sleep vs Mood) and calculates a mathematical correlation score from −1.0 to +1.0. Above +0.7 means a strong positive link.',
                  tip: 'Most people discover their mood strongly correlates with sleep after just 2 weeks of data.'
                },
                {
                  icon: '🎁', color: 'purple', title: 'Rewards System',
                  what: 'Spend the Life Score you earn on guilt-free leisure rewards.',
                  how: 'Create rewards in Settings (e.g. 30 min gaming = 100 points). When you have enough points, go to the Rewards tab and redeem. You can also add manual bonuses for exceptional achievements or penalties for bad decisions — both affect your permanent score.',
                  tip: 'This turns discipline into a game. You literally earn screen time by being productive.'
                },
                {
                  icon: '📊', color: 'teal', title: 'Review & Export',
                  what: 'Generate professional reports and back up your data.',
                  how: 'Select a date range and see period averages for all metrics. Click Print/PDF to get a printable performance report. Export CSV to open your data in Excel or Google Sheets. Export JSON as a full backup you can re-import later.',
                  tip: 'Export a JSON backup once a month as insurance. Import it back any time from Settings.'
                },
                {
                  icon: '📝', color: 'rose', title: 'Sticky Notes & Gallery',
                  what: 'Quick notes that stay visible, and a small photo memory gallery.',
                  how: 'Sticky Notes are for quick thoughts, reminders, or ideas — they persist across days. The Gallery stores up to 5 meaningful photos with captions. Both sync to your account.',
                  tip: 'Use sticky notes for your weekly goals or affirmations so they are always visible.'
                },
              ].map(f => (
                <div key={f.title} className={`bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-700`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{f.icon}</span>
                    <h5 className="font-black text-slate-800 dark:text-slate-100 text-sm">{f.title}</h5>
                  </div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">{f.what}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-2">{f.how}</p>
                  <div className="bg-white dark:bg-slate-900 rounded-xl px-3 py-2 border border-slate-100 dark:border-slate-700">
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">💡 Tip  </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{f.tip}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. SCORING SYSTEM */}
          <div className="bg-slate-900 dark:bg-black rounded-3xl p-5 text-white">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">⚡</span>
              <h4 className="font-black text-white text-base">How the Life Score Works</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-emerald-400 font-black text-[10px] uppercase tracking-widest mb-2">Points Earned</p>
                {[
                  ['+10 per litre', 'Water intake'],
                  ['+10/30 min', 'Deep work/study'],
                  ['+20/30 min', 'Exercise'],
                  ['+10 per habit', 'Completed habits'],
                  ['+10 each', 'Happiness Pillars'],
                  ['+5 each', 'Meals logged'],
                  ['+10 each', 'Skincare routine'],
                  ['+10', 'Journaling / Gratitude'],
                  ['+20', '100% goals completed'],
                  ['×1.5', 'Streak 7+ days'],
                  ['×2.0', 'Streak 30+ days'],
                ].map(([pts, label]) => (
                  <div key={label} className="flex justify-between py-0.5 border-b border-white/5 last:border-0">
                    <span className="text-emerald-300 font-bold">{pts}</span>
                    <span className="text-slate-400">{label}</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-rose-400 font-black text-[10px] uppercase tracking-widest mb-2">Points Deducted</p>
                {[
                  ['−30', 'No exercise at all'],
                  ['−10/serving', 'Junk food'],
                  ['−10/hr', 'Screen time over 4h'],
                  ['−20', 'Sleep under 5 hours'],
                  ['Varies', 'Reward redemptions'],
                  ['Manual', 'Self-penalty entries'],
                ].map(([pts, label]) => (
                  <div key={label} className="flex justify-between py-0.5 border-b border-white/5 last:border-0">
                    <span className="text-rose-300 font-bold">{pts}</span>
                    <span className="text-slate-400">{label}</span>
                  </div>
                ))}
                <div className="mt-4 bg-white/5 rounded-xl p-3">
                  <p className="text-[10px] text-slate-300 leading-relaxed">The <span className="text-white font-bold">Cumulative Life Score</span> is your total across all time. Spend it on rewards. Your <span className="text-white font-bold">XP</span> never decreases — it is permanent and determines your level.</p>
                </div>
              </div>
            </div>
          </div>

          {/* 5. TIPS */}
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-3xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">✨</span>
              <h4 className="font-bold text-rose-900 dark:text-rose-100 text-base">Getting the Most Out of It</h4>
            </div>
            <div className="space-y-2.5">
              {[
                ['Log every day, even briefly', 'A 2-minute log is infinitely better than no log. Consistency compounds.'],
                ['Check Trends after 2 weeks', 'That is when the charts become meaningful and you can spot real patterns.'],
                ['Use the journal section', 'Even 2–3 lines per day. Future you will be grateful for the record.'],
                ['Set up Rewards first', 'Knowing you can redeem gaming time by earning points makes discipline enjoyable.'],
              ].map(([title, desc]) => (
                <div key={title} className="flex gap-3">
                  <span className="text-rose-400 text-base shrink-0 mt-0.5">→</span>
                  <div>
                    <p className="font-bold text-rose-900 dark:text-rose-100 text-xs">{title}</p>
                    <p className="text-rose-700 dark:text-rose-300 text-xs mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </Modal>

      {/* ── NOTIFICATIONS MODAL ─────────────────────────────── */}
      <Modal isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} title="Notifications">
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="text-5xl opacity-20">🔔</div>
              <p className="text-slate-400 text-sm italic">No notifications yet.</p>
            </div>
          ) : (
            notifications.map(notif => {
              const isUnread = (notif.createdAt?.toMillis() || 0) > lastReadAt;
              const typeColors: Record<string, string> = {
                info: 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800',
                important: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
                announcement: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800',
              };
              const typeIcons: Record<string, string> = {
                info: 'ℹ️', important: '⚠️', announcement: '📢'
              };
              const timeAgo = (ts: Timestamp | null) => {
                if (!ts) return '';
                const diff = Date.now() - ts.toMillis();
                const m = Math.floor(diff / 60000);
                const h = Math.floor(m / 60);
                const d = Math.floor(h / 24);
                if (m < 2) return 'Just now';
                if (m < 60) return m + 'm ago';
                if (h < 24) return h + 'h ago';
                if (d === 1) return 'Yesterday';
                return ts.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
              };
              const isUserNotif = notif.id.startsWith('u_');
              return (
                <div
                  key={notif.id}
                  className={`relative rounded-2xl border p-4 transition-all ${typeColors[notif.type] || typeColors.info} ${isUnread ? 'shadow-sm' : 'opacity-75'}`}
                >
                  {isUnread && (
                    <span className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full" />
                  )}
                  <div className="flex items-start gap-3 pr-4">
                    <span className="text-xl shrink-0 mt-0.5">{typeIcons[notif.type] || 'ℹ️'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-800 dark:text-slate-100 text-sm leading-tight">{notif.title}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{notif.body}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-slate-400 font-medium">{timeAgo(notif.createdAt)}</span>
                        <button
                          onClick={() => deleteNotification(notif)}
                          className="text-[10px] text-slate-400 hover:text-rose-500 font-bold uppercase tracking-widest transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Modal>

      {/* ── PRIVACY POLICY MODAL ────────────────────────────── */}
      <Modal isOpen={isPrivacyModalOpen} onClose={() => setIsPrivacyModalOpen(false)} title="Privacy Policy & Legal">
        <div className="space-y-5 text-sm text-slate-700 dark:text-slate-300">

          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
            <p className="text-emerald-800 dark:text-emerald-200 text-xs leading-relaxed font-medium">
              Life Tracker takes your privacy seriously. This policy explains exactly what data we collect, how it is stored, and who can access it — in plain language.
            </p>
          </div>

          {[
            {
              icon: '📦',
              title: 'What Data We Collect',
              body: 'When you sign in with Google, we receive your name, email address, and profile photo — the minimum required to create your account. Everything else — your logs, habits, journal entries, goals, and notes — is data you enter yourself and belongs entirely to you.'
            },
            {
              icon: '🔐',
              title: 'How Your Data is Stored',
              body: 'All your data is stored in Google Firebase — a secure cloud database operated by Google LLC. Data is encrypted in transit using TLS and encrypted at rest. Your data lives under your unique Google account ID in a private isolated partition.'
            },
            {
              icon: '👁️',
              title: 'Who Can See Your Data',
              body: 'Only you. Your logs, journal, and personal data can only be accessed by someone signed into your exact Google account. Firebase security rules enforce this at the server level — not just in code, but as a database rule that cannot be bypassed.'
            },
            {
              icon: '🛡️',
              title: 'App Analytics',
              body: 'To keep the app running well and understand how it is being used, basic account information — such as your name, email, and approximate last active time — is used for service analytics. No personal logs, journal content, or health data is ever accessed or processed for this purpose.'
            },
            {
              icon: '🚫',
              title: 'No Ads, No Data Selling',
              body: 'Daily Wins does not display any advertisements. Your data is never sold, rented, or shared with any third party for any purpose.'
            },
            {
              icon: '🗑️',
              title: 'Your Right to Delete',
              body: 'You have full control over your data at all times. Delete everything permanently from Settings → Destroy All Data. This wipes all your logs, settings, notes, and photos immediately and irreversibly.'
            },
            {
              icon: '📬',
              title: 'Contact',
              body: 'For any privacy-related questions or data deletion requests, contact: hakamsinghlodhi674@gmail.com'
            },
          ].map(section => (
            <div key={section.title} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-lg">{section.icon}</span>
                <h5 className="font-black text-slate-800 dark:text-slate-100 text-sm">{section.title}</h5>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 pl-7">{section.body}</p>
            </div>
          ))}

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Copyright Notice</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Life Tracker is an original application designed and developed by <strong className="text-slate-800 dark:text-slate-200">Hakam Singh Lodhi</strong>. The codebase, design, concepts, and all intellectual property are proprietary. Unauthorised copying, redistribution, reselling, or commercial use of this application or any part of it is strictly prohibited and may be subject to legal action.
              </p>
            </div>
            <p className="text-center text-[10px] text-slate-400 dark:text-slate-600">
              © 2025 Hakam Singh Lodhi · All Rights Reserved · Last updated June 2025
            </p>
          </div>

        </div>
      </Modal>
    </div>
  );
};

export default App;
