
export interface StudySession {
  id: string;
  duration: number; // minutes
  subject: string;
  timestamp: string;
}

export interface WaterEntry {
  id: string;
  amount: number; // liters
  timestamp: string;
}

export interface ExerciseEntry {
  id: string;
  type: string;
  duration: number; // minutes
  timestamp: string;
}

export interface ScreenTimeEntry {
  id: string;
  appName: string;
  duration: number; // minutes
  timestamp: string;
}

export interface MoneyEntry {
  id: string;
  amount: number;
  description: string;
  type: 'income' | 'expense';
  category?: string;
  timestamp: string;
}

export interface Reward {
  id: string;
  name: string;
  points: number;
  emoji: string;
}

export interface RedeemedReward {
  id: string;
  rewardId: string;
  name: string;
  points: number;
  timestamp: string;
}

export interface HappinessPillars {
  physical: boolean;
  problemSolving: boolean;
  helping: boolean;
  creative: boolean;
  explore: boolean;
  learning: boolean;
  ideas: boolean;
  qualityTime: boolean;
  progression: boolean;
}

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  createdAt: string;
  points: number;
}

export type CustomActivityType = 'checklist' | 'score' | 'time' | 'notes';

export interface CustomActivity {
  id: string;
  name: string;
  emoji: string;
  type: CustomActivityType;
  points: number; // Points per completion/unit
}

export type EisenhowerQuadrant = 1 | 2 | 3 | 4; // 1: U&I, 2: NU&I, 3: U&NI, 4: NU&NI

export interface TodoTask {
  id: string;
  text: string;
  completed: boolean;
  quadrant: EisenhowerQuadrant;
  createdAt: string;
}

export interface GalleryItem {
  id: string;
  imageData: string; // Base64 string
  caption: string;
  timestamp: string;
}

export interface StickyNote {
  id: string;
  text: string;
  color: string;
  timestamp: string;
}

export interface Deadline {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: 'Exam' | 'Assignment' | 'Project' | 'Other';
}

export interface AboutMeData {
  goals: string;
  lifeChangingHabit: string;
  biggestStrength: string;
  weaknessWorkingOn: string;
  lowMotivationBoost: string;
  strongLifeLesson: string;
  shortTerm6m: string;
  shortTerm1y: string;
  collegeEndGoals: string;
  longTermVision: string;
  skillsToMaster: string;
  roleModels: string;
  dreamLifestyle: string;
  futureSelfMessage: string;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  waterEntries: WaterEntry[];
  sleepHours: number;
  sleepMinutes: number;
  sleepStart: string;
  sleepEnd: string;
  studySessions: StudySession[];
  exerciseEntries: ExerciseEntry[];
  screenTimeEntries: ScreenTimeEntry[];
  moneyEntries: MoneyEntry[];
  redeemedRewards: RedeemedReward[];
  completedHabits: string[]; // Habit IDs
  customActivitiesData: Record<string, any>; // Stores data for user-defined activities
  todos: TodoTask[];
  happinessPillars: HappinessPillars;
  skincare: {
    morning: boolean;
    afternoon: boolean;
    night: boolean;
  };
  energyLevels: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
  meals: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
    notes: string;
  };
  junkFood: number; // servings
  junkFoodNotes: string;
  screenTimeHours: number;
  screenTimeMinutes: number;
  screenTimeNotes: string;
  mood: number; // 1-10
  moodNotes: string;
  goalsCompleted: number; // percent
  goalText: string;
  achievement: string;
  journal: string;
  gratitude: string;
  social: string[]; // friends, family, none
  socialNotes: string;
  newLearning: string;
  wakeUpTime: string;
  bedtime: string;
  selfCare: string[]; // rest, music, walk, skincare, hobby
  selfCareNotes: string;
  nutritionScore: string; // Healthy, Okay, Poor, Very Poor
  distractions: string[];
  distractionNotes: string;
  negativeThought: string;
  peaceLevel: number;
  dayRating: number;
  autoSummary: string;
  weeklyReflection: string;
  monthlyReview: string;
  breathingSessions: number;
  timeTracking: Record<string, string>; // Key is "HH:MM" start time of 30 min slot
  mindDump: string; // Free text area, not summarized
}

export interface FieldDefinition {
  id: keyof DailyLog | string;
  label: string;
  shortImportance: string;
  expandedImportance: string;
  quickTips: string[];
  challenge: string;
}

export interface TargetSet {
  daily: number;
  weekly: number;
  monthly: number;
}

// --- NEW SKILL TREE TYPES ---
export interface SkillLog {
  id: string;
  date: string;
  minutes: number;
  notes: string;
}

export interface Skill {
  id: string;
  name: string;
  icon: string;
  color: string; // 'indigo' | 'rose' | 'emerald' | 'amber' | 'cyan' | 'purple'
  targetHours: number; // User declared goal for mastery
  totalMinutes: number;
  logs: SkillLog[];
}

export interface AppSettings {
  waterTargets: TargetSet;
  studyTargets: TargetSet;
  exerciseTargets: TargetSet; // minutes
  screenTimeTargets: TargetSet; // hours (limit)
  
  // Deprecated flat targets (kept for migration safety)
  waterTarget?: number;
  studyTarget?: number;
  exerciseTarget?: number;
  screenTimeTarget?: number;

  showImportance: boolean;
  obfuscationEnabled: boolean;
  passphrase?: string;
  settingsPassword?: string; 
  
  // App Lock Features
  isAppLockEnabled: boolean;
  appLockPassword?: string;

  rewards: Reward[];
  habits: Habit[];
  customActivities: CustomActivity[];
  expenseCategories: string[];
  deadlines: Deadline[];
  skills: Skill[]; // NEW: Independent Skill Tree Data
  
  userName?: string;
  schoolName?: string;
  collegeName?: string;
  theme: 'light' | 'dark' | 'system';
  profilePicture?: string | null;
}

export interface CorrelationResult {
  coefficient: number;
  interpretation: string;
  label: string;
}
