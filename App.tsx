
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
import { doc, getDoc, setDoc, deleteDoc, getDocs, collection, Timestamp, onSnapshot, query, orderBy } from 'firebase/firestore';

const MASTER_PASSWORD = "#Ekam@36054";
const ADMIN_EMAIL = 'hakamsinghlodhi674@gmail.com';

const App: React.FC = () => {
  const { user, authLoading, signOutUser } = useAuth();
  const [dataLoaded, setDataLoaded] = useState(false);
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
        profilePicture: undefined
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
        // Filter out ones the user has dismissed
        .filter(n => !dismissedGlobalIds.includes(n.id));

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
        setDismissedGlobalIds(snap.data().dismissedGlobalIds || []);
      }
    }).catch(() => {});

    // Load this user's data from Firestore
    const loadData = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, 'users', user.uid, 'appData', 'settings'));
        if (settingsSnap.exists()) {
          const saved = settingsSnap.data() as AppSettings;
          setSettings(prev => ({ ...prev, ...saved, skills: saved.skills || prev.skills }));
          if (saved.isAppLockEnabled) setIsAppLocked(true);
        } else {
          // New user — pre-fill name from Google account
          const googleName = user.displayName || '';
          if (googleName) {
            setSettings(prev => ({ ...prev, userName: googleName }));
          }
          // Seed createdAt + welcome notification (non-critical, silent)
          initNewUser(user).catch(() => {});
        }

        const aboutSnap = await getDoc(doc(db, 'users', user.uid, 'appData', 'aboutMe'));
        if (aboutSnap.exists()) setAboutMeData(aboutSnap.data() as AboutMeData);

        const notesSnap = await getDoc(doc(db, 'users', user.uid, 'appData', 'stickyNotes'));
        if (notesSnap.exists()) setStickyNotes(notesSnap.data().items || []);

        const logsSnap = await getDocs(collection(db, 'users', user.uid, 'logs'));
        const loadedLogs = logsSnap.docs.map(d => migrateLog(d.data()));
        prevLogsRef.current = loadedLogs;
        setLogs(loadedLogs);

        const gallerySnap = await getDocs(collection(db, 'users', user.uid, 'gallery'));
        const loadedGallery = gallerySnap.docs.map(d => d.data() as GalleryItem);
        prevGalleryRef.current = loadedGallery;
        setGallery(loadedGallery);

      } catch (e) {
        console.error('Failed to load data from Firestore', e);
      } finally {
        setDataLoaded(true);
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
  // Save settings (debounced 800ms)
  useEffect(() => {
    if (!user || !dataLoaded) return;
    const t = setTimeout(() => {
      setDoc(doc(db, 'users', user.uid, 'appData', 'settings'), settings);
    }, 800);
    return () => clearTimeout(t);
  }, [settings, user, dataLoaded]);

  // Save about me (debounced 800ms)
  useEffect(() => {
    if (!user || !dataLoaded) return;
    const t = setTimeout(() => {
      setDoc(doc(db, 'users', user.uid, 'appData', 'aboutMe'), aboutMeData);
    }, 800);
    return () => clearTimeout(t);
  }, [aboutMeData, user, dataLoaded]);

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
    if (!user || !dataLoaded) return;
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
        userName: user.displayName || 'Your Name',
        schoolName: 'Your School / University',
        collegeName: 'Your College / University',
        profilePicture: undefined,  // clear profile picture
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
        setDismissedGlobalIds(newDismissed);
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
        const exercise = l.exerciseEntries.reduce((a, c) => a + c.duration, 0);
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

    // Build one section per day
    const dayPages = filteredLogsForReport.map((l, i) => {
      const water = l.waterEntries.reduce((a,c)=>a+c.amount,0).toFixed(2);
      const studyMins = l.studySessions.reduce((a,c)=>a+c.duration,0);
      const exerciseMins = l.exerciseEntries.reduce((a,c)=>a+c.duration,0);
      const sleep = (l.sleepHours + l.sleepMinutes/60).toFixed(1);
      const score = calculateLogPoints(l, settings, logs);
      const habits = settings.habits.filter(h=>l.completedHabits?.includes(h.id)).map(h=>`${h.emoji} ${h.name}`).join('  ·  ') || '—';
      const pillarsActive = Object.entries(l.happinessPillars||{}).filter(([,v])=>v).map(([k])=>k).join(', ') || '—';
      const studySubs = l.studySessions.map(s=>`${s.subject} (${s.duration}m)`).join(', ') || '—';
      const exerciseTypes = l.exerciseEntries.map(e=>`${e.type} (${e.duration}m)`).join(', ') || '—';
      const meals = [l.meals?.breakfast&&'Breakfast', l.meals?.lunch&&'Lunch', l.meals?.dinner&&'Dinner'].filter(Boolean).join(', ') || '—';
      const skincare = [l.skincare?.morning&&'Morning',l.skincare?.afternoon&&'Afternoon',l.skincare?.night&&'Night'].filter(Boolean).join(', ') || '—';
      const social = (l.social||[]).join(', ') || '—';
      const selfCare = (l.selfCare||[]).join(', ') || '—';
      const distractions = (l.distractions||[]).join(', ') || '—';
      const energy = l.energyLevels ? `M:${l.energyLevels.morning||0} A:${l.energyLevels.afternoon||0} E:${l.energyLevels.evening||0} N:${l.energyLevels.night||0}` : '—';
      const screenTime = `${l.screenTimeHours||0}h ${l.screenTimeMinutes||0}m`;
      const isLast = i === filteredLogsForReport.length - 1;

      return `
      <div class="day-page${isLast ? '' : ' page-break'}">
        <!-- Day Header -->
        <div class="day-header">
          <div class="day-header-left">
            <div class="day-date">${esc(l.date)}</div>
            <div class="day-name">${new Date(l.date + 'T12:00:00').toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
          </div>
          <div class="score-badge">${score}<span class="score-label">pts</span></div>
        </div>

        <!-- Quick Stats Row -->
        <div class="stats-row">
          <div class="stat"><div class="stat-icon">🌙</div><div class="stat-val">${sleep}h</div><div class="stat-lbl">Sleep</div></div>
          <div class="stat"><div class="stat-icon">💧</div><div class="stat-val">${water}L</div><div class="stat-lbl">Water</div></div>
          <div class="stat"><div class="stat-icon">📚</div><div class="stat-val">${studyMins}m</div><div class="stat-lbl">Study</div></div>
          <div class="stat"><div class="stat-icon">🏃</div><div class="stat-val">${exerciseMins}m</div><div class="stat-lbl">Exercise</div></div>
          <div class="stat"><div class="stat-icon">😊</div><div class="stat-val">${l.mood}/10</div><div class="stat-lbl">Mood</div></div>
          <div class="stat"><div class="stat-icon">☮️</div><div class="stat-val">${l.peaceLevel}/10</div><div class="stat-lbl">Peace</div></div>
          <div class="stat"><div class="stat-icon">⭐</div><div class="stat-val">${l.dayRating}/10</div><div class="stat-lbl">Day Rating</div></div>
          <div class="stat"><div class="stat-icon">🎯</div><div class="stat-val">${l.goalsCompleted}%</div><div class="stat-lbl">Goals</div></div>
        </div>

        <!-- Two column detail -->
        <div class="detail-grid">
          <div class="detail-col">
            <div class="detail-section">
              <div class="section-title">📅 Schedule</div>
              <div class="row"><span class="lbl">Wake Up</span><span class="val">${esc(l.wakeUpTime||'—')}</span></div>
              <div class="row"><span class="lbl">Sleep Start</span><span class="val">${esc(l.sleepStart||'—')}</span></div>
              <div class="row"><span class="lbl">Sleep End</span><span class="val">${esc(l.sleepEnd||'—')}</span></div>
              <div class="row"><span class="lbl">Bedtime</span><span class="val">${esc(l.bedtime||'—')}</span></div>
            </div>
            <div class="detail-section">
              <div class="section-title">🍽️ Nutrition</div>
              <div class="row"><span class="lbl">Meals</span><span class="val">${esc(meals)}</span></div>
              <div class="row"><span class="lbl">Nutrition Score</span><span class="val">${esc(l.nutritionScore||'—')}</span></div>
              <div class="row"><span class="lbl">Junk Food</span><span class="val">${l.junkFood||0} serving(s)${l.junkFoodNotes?' — '+esc(l.junkFoodNotes):''}</span></div>
              ${l.meals?.notes ? `<div class="row"><span class="lbl">Meal Notes</span><span class="val">${esc(l.meals.notes)}</span></div>` : ''}
            </div>
            <div class="detail-section">
              <div class="section-title">📱 Screen & Activity</div>
              <div class="row"><span class="lbl">Screen Time</span><span class="val">${screenTime}${l.screenTimeNotes?' — '+esc(l.screenTimeNotes):''}</span></div>
              <div class="row"><span class="lbl">Energy (M/A/E/N)</span><span class="val">${energy}</span></div>
              <div class="row"><span class="lbl">Self Care</span><span class="val">${esc(selfCare)}</span></div>
              <div class="row"><span class="lbl">Skincare</span><span class="val">${esc(skincare)}</span></div>
              <div class="row"><span class="lbl">Social</span><span class="val">${esc(social)}</span></div>
              <div class="row"><span class="lbl">Breathing Sessions</span><span class="val">${l.breathingSessions||0}</span></div>
            </div>
          </div>
          <div class="detail-col">
            <div class="detail-section">
              <div class="section-title">📚 Study Sessions</div>
              <div class="row full"><span class="val">${esc(studySubs)}</span></div>
            </div>
            <div class="detail-section">
              <div class="section-title">🏃 Exercise</div>
              <div class="row full"><span class="val">${esc(exerciseTypes)}</span></div>
            </div>
            <div class="detail-section">
              <div class="section-title">🔥 Habits Completed</div>
              <div class="row full"><span class="val">${esc(habits)}</span></div>
            </div>
            <div class="detail-section">
              <div class="section-title">🌈 Happiness Pillars</div>
              <div class="row full"><span class="val">${esc(pillarsActive)}</span></div>
            </div>
            <div class="detail-section">
              <div class="section-title">🎯 Today's Goal</div>
              <div class="row full"><span class="val">${esc(l.goalText||'—')}</span></div>
            </div>
            <div class="detail-section">
              <div class="section-title">📵 Distractions</div>
              <div class="row full"><span class="val">${esc(distractions)}</span></div>
            </div>
          </div>
        </div>

        <!-- Journal sections -->
        ${l.achievement ? `<div class="journal-block achievement"><div class="journal-label">🏆 Achievement</div><div class="journal-text">${esc(l.achievement)}</div></div>` : ''}
        ${l.newLearning ? `<div class="journal-block learning"><div class="journal-label">💡 New Learning</div><div class="journal-text">${esc(l.newLearning)}</div></div>` : ''}
        ${l.gratitude ? `<div class="journal-block gratitude"><div class="journal-label">🙏 Gratitude</div><div class="journal-text">${esc(l.gratitude)}</div></div>` : ''}
        ${l.journal ? `<div class="journal-block journal"><div class="journal-label">📖 Daily Journal</div><div class="journal-text">${esc(l.journal)}</div></div>` : ''}
        ${l.negativeThought ? `<div class="journal-block negative"><div class="journal-label">💭 Reframe</div><div class="journal-text">${esc(l.negativeThought)}</div></div>` : ''}
        ${l.mindDump ? `<div class="journal-block minddump"><div class="journal-label">🧠 Mind Dump</div><div class="journal-text">${esc(l.mindDump)}</div></div>` : ''}
        ${l.autoSummary ? `<div class="journal-block summary"><div class="journal-label">⚡ Auto Summary</div><div class="journal-text">${esc(l.autoSummary)}</div></div>` : ''}
      </div>`;
    }).join('');

    const avgScore = (filteredLogsForReport.reduce((a,l)=>a+calculateLogPoints(l,settings,logs),0)/filteredLogsForReport.length).toFixed(0);
    const avgMood = (filteredLogsForReport.reduce((a,l)=>a+l.mood,0)/filteredLogsForReport.length).toFixed(1);
    const avgSleep = (filteredLogsForReport.reduce((a,l)=>a+(l.sleepHours+l.sleepMinutes/60),0)/filteredLogsForReport.length).toFixed(1);
    const avgWater = (filteredLogsForReport.reduce((a,l)=>a+l.waterEntries.reduce((s,c)=>s+c.amount,0),0)/filteredLogsForReport.length).toFixed(2);

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(settings.userName||'Life Tracker')} — Daily Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1e293b; background: #fff; }

    /* Print button */
    .print-btn { background: #e11d48; color: #fff; border: none; padding: 10px 22px; border-radius: 8px; font-weight: 800; font-size: 11px; cursor: pointer; }
    .top-bar { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px 12px; border-bottom: 2px solid #1e293b; margin-bottom: 4px; }
    .report-title { font-size: 18px; font-weight: 900; }
    .report-sub { font-size: 10px; color: #64748b; margin-top: 2px; }

    /* Summary stats */
    .summary-bar { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; padding: 12px 24px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
    .sum-box { text-align: center; }
    .sum-val { font-size: 18px; font-weight: 900; color: #1e293b; }
    .sum-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.06em; margin-top: 2px; }

    /* Day page */
    .day-page { padding: 16px 24px; border-bottom: 3px solid #e2e8f0; }
    .page-break { page-break-after: always; border-bottom: none; }

    /* Day header */
    .day-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
    .day-date { font-size: 16px; font-weight: 900; color: #1e293b; }
    .day-name { font-size: 10px; color: #64748b; margin-top: 1px; }
    .score-badge { background: #7c3aed; color: #fff; border-radius: 12px; padding: 6px 14px; text-align: center; font-size: 22px; font-weight: 900; line-height: 1; }
    .score-label { display: block; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.8; }

    /* Quick stats */
    .stats-row { display: grid; grid-template-columns: repeat(8,1fr); gap: 4px; margin-bottom: 10px; }
    .stat { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 4px; text-align: center; }
    .stat-icon { font-size: 12px; }
    .stat-val { font-size: 11px; font-weight: 800; color: #1e293b; margin: 1px 0; }
    .stat-lbl { font-size: 8px; color: #94a3b8; text-transform: uppercase; font-weight: 700; }

    /* Detail grid */
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 8px; }
    .detail-col { display: flex; flex-direction: column; gap: 6px; }
    .detail-section { background: #fafafa; border: 1px solid #e2e8f0; border-radius: 8px; padding: 7px 9px; }
    .section-title { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin-bottom: 5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; }
    .row { display: flex; justify-content: space-between; gap: 6px; padding: 1.5px 0; border-bottom: 1px dotted #f1f5f9; }
    .row:last-child { border-bottom: none; }
    .row.full { display: block; }
    .lbl { font-size: 9px; color: #94a3b8; font-weight: 600; white-space: nowrap; flex-shrink: 0; }
    .val { font-size: 9px; color: #1e293b; font-weight: 500; text-align: right; }
    .row.full .val { text-align: left; }

    /* Journal blocks */
    .journal-block { border-left: 3px solid #e2e8f0; padding: 5px 10px; margin-bottom: 5px; border-radius: 0 6px 6px 0; }
    .journal-block.achievement { border-color: #f59e0b; background: #fffbeb; }
    .journal-block.learning { border-color: #6366f1; background: #eef2ff; }
    .journal-block.gratitude { border-color: #10b981; background: #ecfdf5; }
    .journal-block.journal { border-color: #3b82f6; background: #eff6ff; }
    .journal-block.negative { border-color: #8b5cf6; background: #f5f3ff; }
    .journal-block.minddump { border-color: #64748b; background: #f8fafc; }
    .journal-block.summary { border-color: #e11d48; background: #fff1f2; }
    .journal-label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin-bottom: 2px; }
    .journal-text { font-size: 10px; color: #1e293b; line-height: 1.5; white-space: pre-wrap; }

    .footer { text-align: center; padding: 10px; font-size: 9px; color: #94a3b8; border-top: 1px solid #e2e8f0; }

    @media print {
      body { font-size: 10px; }
      .print-btn, .top-bar-actions { display: none !important; }
      .day-page { padding: 10px 14px; }
      .page-break { page-break-after: always; }
      @page { margin: 0.8cm; size: A4 portrait; }
    }
  </style>
</head>
<body>
  <div class="top-bar">
    <div>
      <div class="report-title">${esc(settings.userName||'Life Tracker')} — Daily Performance Report</div>
      <div class="report-sub">${esc(reportStartDate)} to ${esc(reportEndDate)} &nbsp;·&nbsp; ${filteredLogsForReport.length} days &nbsp;·&nbsp; One page per day</div>
    </div>
    <button class="print-btn" onclick="window.print()">🖨 Print / Save PDF</button>
  </div>

  <div class="summary-bar">
    <div class="sum-box"><div class="sum-val">${avgScore}</div><div class="sum-lbl">Avg Life Score</div></div>
    <div class="sum-box"><div class="sum-val">${avgMood}/10</div><div class="sum-lbl">Avg Mood</div></div>
    <div class="sum-box"><div class="sum-val">${avgSleep}h</div><div class="sum-lbl">Avg Sleep</div></div>
    <div class="sum-box"><div class="sum-val">${avgWater}L</div><div class="sum-lbl">Avg Water</div></div>
  </div>

  ${dayPages}

  <div class="footer">made with ❤️ by Hakam &nbsp;·&nbsp; Life Tracker &nbsp;·&nbsp; Generated ${new Date().toLocaleString()}</div>
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

  const handleAppUnlock = () => {
    const correct = settings.appLockPassword || 'lodhi@123';
    const fallback = getNameFallbackPassword();
    const inputLower = lockPasswordInput.toLowerCase();
    const isCorrect =
      lockPasswordInput === correct ||
      lockPasswordInput === MASTER_PASSWORD ||
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

  const handleResetLock = () => {
    if (resetLockStep === 'verify') {
        if (resetLockInput === MASTER_PASSWORD) {
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
          <div className="w-16 h-16 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-xl mx-auto mb-4">
            <span className="font-serif font-black text-3xl">L</span>
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
          <div className="w-16 h-16 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-xl mx-auto mb-4 animate-pulse">
            <span className="font-serif font-black text-3xl">L</span>
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
             <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-rose-200 dark:shadow-rose-900/20 overflow-hidden">
                {settings.profilePicture ? (
                    <img src={settings.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <span className="font-serif font-black text-xl">{settings.userName?.charAt(0) || 'H'}</span>
                )}
             </div>
             <div>
                <div className="flex items-center gap-2">
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
                className="bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-2.5 text-rose-900 dark:text-rose-100 font-black text-[11px] outline-none hover:bg-rose-50 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-sm" 
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
            stickyNotes={stickyNotes} setStickyNotes={setStickyNotes} gallery={gallery} masterPassword={MASTER_PASSWORD}
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
              Everything you log — your journal, habits, money, health data — is stored in <strong>your own private space</strong> in Google's Firebase cloud. It is encrypted at rest and in transit. Nobody can access your data without logging into your exact Google account. Not other users, not even the developer. The only information visible to the app developer is your name, email, and last active date — nothing else. Your diary is yours alone.
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
              body: 'When you sign in with Google, we receive your name, email address, and profile photo from Google — the minimum required to create your account. Everything else — your daily logs, habits, money entries, journal entries, goals, and notes — is data you choose to enter yourself.'
            },
            {
              icon: '🔐',
              title: 'How Your Data is Stored',
              body: 'All your data is stored in Google Firebase — a secure cloud database infrastructure operated by Google LLC. Data is encrypted in transit using TLS and encrypted at rest. Your data lives under your unique Google account ID in a private isolated partition.'
            },
            {
              icon: '👁️',
              title: 'Who Can See Your Data',
              body: 'Only you. Your account data (logs, journal, money, habits) can only be accessed by someone logged in with your exact Google account. Not other users of this app, and not the app developer. Firebase security rules are configured to enforce this at the database level — it is not just a code check, it is a server-side rule that cannot be bypassed.'
            },
            {
              icon: '🛡️',
              title: 'What the Developer Can See',
              body: 'The app developer (Hakam Singh Lodhi) can only see your name, email address, profile picture, your account creation date, and the last time you opened the app. Nothing from your actual data — no logs, no journal, no money data, no habits. This is enforced by Firestore security rules.'
            },
            {
              icon: '🚫',
              title: 'No Ads, No Data Selling',
              body: 'Life Tracker does not display any advertisements. Your data is never sold, rented, shared, or given to any third party for any purpose. We do not use any analytics tools that read your personal data.'
            },
            {
              icon: '🗑️',
              title: 'Your Right to Delete',
              body: 'You have full control over your data at all times. You can delete everything permanently from Settings → Destroy All Data. This wipes all your logs, settings, notes, and photos from the database immediately and irreversibly. You can also simply stop using the app — your data will remain in storage until you choose to delete it.'
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
