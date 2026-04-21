
import React, { useState } from 'react';
import { Card, SectionTitle, SubLabel, Modal, FloatingPointItem, FloatingPoint } from '../components/Shared';
import { DailyLog, AppSettings, TodoTask, EisenhowerQuadrant, Deadline } from '../types';
import { TRACKER_FIELDS, LEVEL_SYSTEM } from '../constants';
import { PILLARS_METADATA, PillarMeta, SOUNDS } from '../utils';
import { calculateActivityStreak, calculateCustomActivityStreak, calculateLogXP } from '../helpers';

interface TodayViewProps {
  currentLog: DailyLog;
  updateLog: (updates: Partial<DailyLog>) => void;
  isEditable: boolean;
  settings: AppSettings;
  playSound: (url: string) => void;
  addFloatingPoint: (x: number, y: number, value: string, isNegative?: boolean) => void;
  removeFloatingPoint: (id: number) => void;
  floatingPoints: FloatingPoint[];
  todayWater: number;
  todayStudyMinutes: number;
  cumulativeLifeScore: number;
  currentDate: string;
  isToday: boolean;
  isScoreBreakdownOpen: boolean;
  setIsScoreBreakdownOpen: (val: boolean) => void;
  getPointsBreakdown: (log: DailyLog) => any[];
  currentDailyNetScore: number;
  yesterdayLog?: DailyLog;
  yesterdayDailyNetScore: number;
  todayStr: string;
  isTodoModalOpen: boolean;
  setIsTodoModalOpen: (val: boolean) => void;
  newTodoQuadrant: EisenhowerQuadrant;
  setNewTodoQuadrant: (q: EisenhowerQuadrant) => void;
  generateLocalSummary: () => void;
  handleSleepTimeChange: (field: 'sleepStart' | 'sleepEnd', value: string) => void;
  logs: DailyLog[];
  setSettings: (settings: AppSettings) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({ 
  currentLog, updateLog, isEditable, settings, playSound, addFloatingPoint, removeFloatingPoint, floatingPoints,
  todayWater, todayStudyMinutes, cumulativeLifeScore, currentDate, isToday, 
  isScoreBreakdownOpen, setIsScoreBreakdownOpen, getPointsBreakdown, currentDailyNetScore, yesterdayLog, yesterdayDailyNetScore, todayStr,
  isTodoModalOpen, setIsTodoModalOpen, newTodoQuadrant, setNewTodoQuadrant, generateLocalSummary, handleSleepTimeChange, logs, setSettings
}) => {
    const [isPillarsExpanded, setIsPillarsExpanded] = useState(false);
  const [selectedPillarInfo, setSelectedPillarInfo] = useState<PillarMeta | null>(null);
    const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
    
    // Deadline State
    const [isDeadlineModalOpen, setIsDeadlineModalOpen] = useState(false);
    const [editingDeadlineId, setEditingDeadlineId] = useState<string | null>(null);
    const [deadlineForm, setDeadlineForm] = useState<Partial<Deadline>>({ title: '', date: '', type: 'Exam' });

    // --- Level Calculation ---
    const totalXP = logs.reduce((acc, log) => acc + calculateLogXP(log, settings, logs), 0);
    
    // Find current level
    let currentLevel = LEVEL_SYSTEM[0];
    let nextLevel = LEVEL_SYSTEM[1];
    
    for (let i = 0; i < LEVEL_SYSTEM.length; i++) {
        if (totalXP >= LEVEL_SYSTEM[i].minPoints) {
            currentLevel = LEVEL_SYSTEM[i];
            nextLevel = LEVEL_SYSTEM[i + 1] || LEVEL_SYSTEM[i];
        } else {
            break;
        }
    }

    const xpForCurrentLevel = currentLevel.minPoints;
    const xpForNextLevel = nextLevel.minPoints;
    const xpProgress = Math.min(100, Math.max(0, ((totalXP - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100));

    const sortedTodos = [...(currentLog.todos || [])].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return a.quadrant - b.quadrant;
    });

    const getQuadrantColor = (q: EisenhowerQuadrant) => {
      switch (q) {
        case 1: return 'text-rose-700 bg-rose-50 border-rose-200 ring-rose-100 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-300';
        case 2: return 'text-indigo-700 bg-indigo-50 border-indigo-200 ring-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300';
        case 3: return 'text-amber-700 bg-amber-50 border-amber-200 ring-amber-100 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300';
        case 4: return 'text-slate-600 bg-slate-50 border-slate-200 ring-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300';
      }
    };

    const getQuadrantLabel = (q: EisenhowerQuadrant) => {
      switch (q) {
        case 1: return '🔥 Urgent & Important';
        case 2: return '📈 Important, Not Urgent';
        case 3: return '🔔 Urgent, Not Important';
        case 4: return '☁️ Not Urgent / Important';
      }
    };

    // Streak Calculations
    const waterStreak = calculateActivityStreak(logs, 'water', settings, todayStr);
    const studyStreak = calculateActivityStreak(logs, 'study', settings, todayStr);
    const exerciseStreak = calculateActivityStreak(logs, 'exercise', settings, todayStr);
    const sleepStreak = calculateActivityStreak(logs, 'sleep', settings, todayStr);
    const screenTimeStreak = calculateActivityStreak(logs, 'screenTime', settings, todayStr);
    const skincareStreak = calculateActivityStreak(logs, 'skincare', settings, todayStr);
    const mealsStreak = calculateActivityStreak(logs, 'meals', settings, todayStr);
    const journalStreak = calculateActivityStreak(logs, 'journaling', settings, todayStr);

    // Deadline Handlers
    const calculateDaysLeft = (targetDate: string) => {
        const today = new Date(todayStr);
        const target = new Date(targetDate);
        const diffTime = target.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const openAddDeadlineModal = () => {
        setEditingDeadlineId(null);
        setDeadlineForm({ title: '', date: '', type: 'Exam' });
        setIsDeadlineModalOpen(true);
        playSound(SOUNDS.CLICK);
    };

    const handleEditDeadline = (deadline: Deadline) => {
        setEditingDeadlineId(deadline.id);
        setDeadlineForm({ title: deadline.title, date: deadline.date, type: deadline.type });
        setIsDeadlineModalOpen(true);
        playSound(SOUNDS.CLICK);
    };

    const handleSaveDeadline = () => {
        if (deadlineForm.title && deadlineForm.date) {
            let updatedDeadlines;
            
            if (editingDeadlineId) {
                // Update Existing
                updatedDeadlines = settings.deadlines.map(d => 
                    d.id === editingDeadlineId 
                    ? { ...d, title: deadlineForm.title!, date: deadlineForm.date!, type: deadlineForm.type as any }
                    : d
                );
            } else {
                // Create New
                const newDeadline: Deadline = {
                    id: Math.random().toString(),
                    title: deadlineForm.title!,
                    date: deadlineForm.date!,
                    type: deadlineForm.type as any || 'Exam'
                };
                updatedDeadlines = [...(settings.deadlines || []), newDeadline];
            }

            setSettings({ ...settings, deadlines: updatedDeadlines });
            setIsDeadlineModalOpen(false);
            setEditingDeadlineId(null);
            setDeadlineForm({ title: '', date: '', type: 'Exam' });
            playSound(SOUNDS.SUCCESS);
        }
    };

    const handleDeleteDeadline = (id: string) => {
        if(confirm('Are you sure you want to remove this deadline?')) {
             const updatedSettings = { ...settings, deadlines: settings.deadlines.filter(d => d.id !== id) };
             setSettings(updatedSettings);
             playSound(SOUNDS.CLICK);
        }
    };

    const sortedDeadlines = [...(settings.deadlines || [])].sort((a, b) => a.date.localeCompare(b.date));

    return (
      <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-700 pb-24 overflow-x-hidden">
        
        {/* Level Banner (Top of Dashboard) */}
        <div 
            onClick={() => { playSound(SOUNDS.CLICK); setIsLevelModalOpen(true); }}
            className="bg-slate-900 dark:bg-black text-white p-4 rounded-[2rem] shadow-xl flex items-center justify-between cursor-pointer group hover:scale-[1.01] transition-transform relative overflow-hidden"
        >
            <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-600/20 to-transparent w-1/2"></div>
            
            <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-lg font-black shadow-inner border border-white/10">
                    {currentLevel.level}
                </div>
                <div>
                    <p className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest mb-0.5">Current Rank</p>
                    <h3 className="text-xl font-serif font-bold leading-none">{currentLevel.name}</h3>
                </div>
            </div>

            <div className="flex flex-col items-end gap-1 relative z-10 w-1/3">
                <p className="text-[9px] font-bold text-slate-400">{Math.floor(totalXP)} / {xpForNextLevel} XP</p>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 shadow-[0_0_10px_rgba(129,140,248,0.5)] transition-all duration-1000" 
                        style={{ width: `${xpProgress}%` }}
                    />
                </div>
            </div>
        </div>

        {/* Dashboard Stats */}
        <section className="bg-gradient-to-br from-rose-200 via-indigo-100 to-emerald-100 dark:from-rose-900/40 dark:via-indigo-900/40 dark:to-emerald-900/40 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 blur-3xl rounded-full -mr-10 -mt-10"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-5 mb-6">
                {settings.profilePicture && isToday ? (
                    <div className="relative shrink-0 group">
                        <img 
                            src={settings.profilePicture} 
                            className="w-20 h-20 rounded-full object-cover border-[3px] border-white/60 dark:border-white/10 shadow-lg transform group-hover:scale-105 transition-transform duration-500" 
                            alt="Profile" 
                        />
                    </div>
                ) : null}
                <div>
                    <h2 className="text-3xl sm:text-4xl font-serif font-bold text-rose-900 dark:text-rose-100 leading-none mb-1.5">
                        {isToday ? `Hello, ${settings.userName}!` : `Record for ${currentDate}`}
                    </h2>
                    {isToday && (
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 italic tracking-wide opacity-90">
                            “Show up today—your future self is watching.”
                        </p>
                    )}
                </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
               <div className="flex-1 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl p-5 text-center shadow-sm">
                  <span className="text-[10px] uppercase font-black text-rose-400 tracking-tighter block mb-1">Hydration</span>
                  <p className="text-2xl font-black text-rose-900 dark:text-rose-200">{todayWater.toFixed(1)}L</p>
               </div>
               <div className="flex-1 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl p-5 text-center shadow-sm">
                  <span className="text-[10px] uppercase font-black text-indigo-400 tracking-tighter block mb-1">Productive</span>
                  <p className="text-2xl font-black text-rose-900 dark:text-rose-200">{Math.floor(todayStudyMinutes/60)}h <span className="text-sm font-bold opacity-40">{todayStudyMinutes % 60}m</span></p>
               </div>
               <button 
                onClick={() => { playSound(SOUNDS.CLICK); setIsScoreBreakdownOpen(true); }}
                className="flex-1 bg-emerald-500 rounded-2xl p-5 text-center shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40 animate-pulse-slow hover:bg-emerald-600 transition-all hover:-translate-y-1"
               >
                  <span className="text-[10px] uppercase font-black text-emerald-100 tracking-tighter block mb-1">Daily Score</span>
                  <p className="text-2xl font-black text-white">{cumulativeLifeScore}</p>
               </button>
            </div>
          </div>
        </section>

        {/* Deadline Radar (Moved Below Dashboard) */}
        <section className="space-y-2">
            <div className="flex justify-between items-center gap-2 px-1 sm:px-2">
                <h3 className="font-bold text-base tracking-tight text-gray-800 dark:text-slate-200 uppercase flex items-center gap-2">
                    <span className="text-xl">📡</span> Deadline Radar
                </h3>
                <button 
                    onClick={openAddDeadlineModal}
                    className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-500 flex items-center justify-center hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                </button>
            </div>
            
            {sortedDeadlines.length === 0 ? (
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center text-slate-400 text-xs font-medium italic">
                    No academic threats detected. Horizon clear.
                </div>
            ) : (
                <div className="flex gap-3 overflow-x-auto pb-4 px-1 custom-scrollbar snap-x">
                    {sortedDeadlines.map(d => {
                        const daysLeft = calculateDaysLeft(d.date);
                        let bgClass = 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300';
                        let badgeClass = 'bg-slate-100 dark:bg-slate-700 text-slate-500';
                        
                        if (daysLeft <= 3) {
                            bgClass = 'bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-200 dark:shadow-rose-900/20';
                            badgeClass = 'bg-white/20 text-white';
                        } else if (daysLeft <= 7) {
                            bgClass = 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800';
                            badgeClass = 'bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100';
                        } else {
                            bgClass = 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 border-emerald-100 dark:border-emerald-800';
                            badgeClass = 'bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-300';
                        }

                        return (
                            <div key={d.id} className={`snap-center min-w-[160px] p-4 rounded-3xl border flex flex-col justify-between h-36 relative group transition-all hover:scale-105 ${bgClass}`}>
                                <div>
                                    <div className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg w-max mb-2 ${badgeClass}`}>
                                        {d.type}
                                    </div>
                                    <h4 className="font-bold text-sm leading-tight line-clamp-2 pr-4">{d.title}</h4>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-3xl font-black leading-none">{Math.max(0, daysLeft)}</p>
                                        <p className="text-[8px] font-bold uppercase opacity-80">Days Left</p>
                                    </div>
                                    <p className="text-[9px] font-medium opacity-60">{new Date(d.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</p>
                                </div>
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleEditDeadline(d); }}
                                        className="bg-black/10 hover:bg-black/20 rounded-full p-1.5 backdrop-blur-sm"
                                        title="Edit Deadline"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDeleteDeadline(d.id); }}
                                        className="bg-black/10 hover:bg-rose-500 hover:text-white rounded-full p-1.5 backdrop-blur-sm transition-colors"
                                        title="Remove Deadline"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>

        {!isEditable && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-amber-800 dark:text-amber-200 text-xs font-bold text-center">
            ⚠️ View Only Mode: Entries for this date are locked based on current time.
          </div>
        )}

        <div className="flex justify-between items-center gap-2 px-1 sm:px-2">
            <h3 className="font-bold text-base tracking-tight text-gray-800 dark:text-slate-200 uppercase flex items-center gap-2">
                <span className="text-xl">🛠️</span> Activities & Focus
            </h3>
            <button 
                onClick={() => { playSound(SOUNDS.CLICK); setIsTodoModalOpen(true); }}
                className="flex items-center gap-2 bg-indigo-600 px-5 py-2.5 rounded-2xl shadow-lg shadow-indigo-100 dark:shadow-indigo-900/30 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Manage Missions
            </button>
        </div>

        {/* ... (Existing Todo Modal, Pillars Card, Custom Activities, Energy, Water, Sleep, etc.) ... */}
        
        {/* Render rest of the component exactly as before, simply cutting for brevity as requested not to change other parts */}
        {/* RE-INSERTING THE REST OF THE COMPONENT LOGIC HERE TO ENSURE INTEGRITY */}
        
        <Modal isOpen={isDeadlineModalOpen} onClose={() => setIsDeadlineModalOpen(false)} title={editingDeadlineId ? "Edit Academic Threat" : "Add Academic Threat"}>
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Title</label>
                    <input 
                        value={deadlineForm.title}
                        onChange={e => setDeadlineForm({...deadlineForm, title: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-bold border-2 border-transparent focus:border-indigo-100 dark:focus:border-indigo-900 outline-none dark:text-slate-200"
                        placeholder="e.g. Data Structures Final"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Due Date</label>
                    <input 
                        type="date"
                        min={todayStr}
                        value={deadlineForm.date}
                        onChange={e => setDeadlineForm({...deadlineForm, date: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-bold border-2 border-transparent focus:border-indigo-100 dark:focus:border-indigo-900 outline-none dark:text-slate-200"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Type</label>
                    <select 
                        value={deadlineForm.type}
                        onChange={e => setDeadlineForm({...deadlineForm, type: e.target.value as any})}
                        className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-bold border-2 border-transparent focus:border-indigo-100 dark:focus:border-indigo-900 outline-none dark:text-slate-200 appearance-none cursor-pointer"
                    >
                        <option value="Exam">Exam</option>
                        <option value="Assignment">Assignment</option>
                        <option value="Project">Project</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <button 
                    onClick={handleSaveDeadline}
                    disabled={!deadlineForm.title || !deadlineForm.date}
                    className="w-full bg-rose-600 text-white font-black py-5 rounded-[1.5rem] shadow-xl hover:bg-rose-700 active:scale-95 transition-all uppercase text-xs tracking-widest disabled:opacity-50"
                >
                    {editingDeadlineId ? 'Update Deadline' : 'Set Deadline'}
                </button>
            </div>
        </Modal>

        <Modal isOpen={isTodoModalOpen} onClose={() => setIsTodoModalOpen(false)} title="Mission Control Matrix">
            <div className="space-y-6 pb-6">
                <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-[2.5rem] space-y-5 border border-slate-100 dark:border-slate-800">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-2">Task Details</label>
                      <input 
                          id="todo-input"
                          placeholder="What is your next move?..."
                          className="w-full bg-white dark:bg-slate-800 p-5 rounded-2xl text-sm font-bold shadow-sm border-2 border-transparent focus:border-indigo-100 dark:focus:border-indigo-900 outline-none transition-all placeholder:text-slate-200 dark:placeholder:text-slate-600 dark:text-slate-100"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const input = document.getElementById('todo-input') as HTMLInputElement;
                              if (input.value.trim()) {
                                  const newTask: TodoTask = {
                                      id: Math.random().toString(),
                                      text: input.value.trim(),
                                      completed: false,
                                      quadrant: newTodoQuadrant,
                                      createdAt: new Date().toISOString()
                                  };
                                  updateLog({ todos: [...(currentLog.todos || []), newTask] });
                                  input.value = '';
                                  playSound(SOUNDS.SUCCESS);
                              }
                            }
                          }}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-2">Quadrant Strategy</label>
                      <div className="grid grid-cols-2 gap-2">
                          {[1, 2, 3, 4].map(q => (
                              <button 
                                  key={q}
                                  onClick={() => { playSound(SOUNDS.CLICK); setNewTodoQuadrant(q as EisenhowerQuadrant); }}
                                  className={`p-4 rounded-xl text-[9px] font-black uppercase tracking-tighter text-center transition-all border-2 ${newTodoQuadrant === q ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-100 dark:shadow-none' : 'bg-white dark:bg-slate-800 text-slate-400 border-transparent hover:border-slate-100 dark:hover:border-slate-700'}`}
                              >
                                  {getQuadrantLabel(q as EisenhowerQuadrant)}
                              </button>
                          ))}
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-300 text-center uppercase font-bold tracking-[0.3em]">Return to deploy task</p>
                </div>

                <div className="space-y-3 px-1">
                    {sortedTodos.length === 0 && <div className="text-center py-16 text-slate-300 italic flex flex-col items-center gap-4"><div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-2xl grayscale">🧗</div><p>No active missions. Plot your path.</p></div>}
                    {sortedTodos.map(todo => (
                        <div 
                            key={todo.id} 
                            className={`group relative flex items-center gap-4 p-5 rounded-3xl border transition-all duration-300 ${todo.completed ? 'opacity-40 grayscale bg-slate-50 dark:bg-slate-800 border-transparent' : `${getQuadrantColor(todo.quadrant)} border-opacity-50 shadow-sm hover:shadow-md hover:-translate-y-0.5`}`}
                        >
                            <button 
                                onClick={() => {
                                    const updated = currentLog.todos.map(t => t.id === todo.id ? { ...t, completed: !t.completed } : t);
                                    updateLog({ todos: updated });
                                    if (!todo.completed) {
                                      const rect = document.getElementById(`todo-check-${todo.id}`)?.getBoundingClientRect();
                                      if (rect) addFloatingPoint(rect.left, rect.top, '+5');
                                      playSound(SOUNDS.SUCCESS);
                                    } else {
                                      playSound(SOUNDS.CLICK);
                                    }
                                }}
                                id={`todo-check-${todo.id}`}
                                className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all shrink-0 ${todo.completed ? 'bg-emerald-500 border-emerald-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 group-hover:border-indigo-300'}`}
                            >
                                {todo.completed && <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                            </button>
                            <div className="flex-1 min-w-0 overflow-hidden">
                                <p className={`text-sm font-bold leading-tight ${todo.completed ? 'line-through text-slate-500 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'}`}>{todo.text}</p>
                                <span className={`text-[8px] font-black uppercase tracking-[0.1em] mt-1 block opacity-70`}>{getQuadrantLabel(todo.quadrant).split(' ').slice(1).join(' ')}</span>
                            </div>
                            <button 
                                onClick={() => { playSound(SOUNDS.CLICK); updateLog({ todos: currentLog.todos.filter(t => t.id !== todo.id) }); }}
                                className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition-all active:scale-90"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </Modal>

        <Card className={`bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-100/50 dark:border-emerald-800/30 ${!isEditable ? 'pointer-events-none opacity-90' : ''}`}>
          <div 
            className="flex justify-between items-center cursor-pointer py-2"
            onClick={() => setIsPillarsExpanded(!isPillarsExpanded)}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">🌈</span>
              <h3 className="font-bold text-base tracking-tight text-emerald-900 dark:text-emerald-200 uppercase">Pillars of Happiness</h3>
            </div>
            <div className="flex items-center gap-3">
                <div className="bg-white/60 dark:bg-slate-800/60 px-3 py-1 rounded-full text-[10px] font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-widest">
                    {Object.values(currentLog.happinessPillars || {}).filter(v => v).length} / {PILLARS_METADATA.length} Active
                </div>
                <button className={`w-8 h-8 flex items-center justify-center rounded-full bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 text-emerald-800 dark:text-emerald-300 transition-all duration-300 ${isPillarsExpanded ? 'rotate-180' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
            </div>
          </div>
          
          {isPillarsExpanded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 animate-in slide-in-from-top-4 duration-300">
                {PILLARS_METADATA.map((pillar) => {
                  const isActive = currentLog.happinessPillars?.[pillar.key];
                  return (
                    <div key={pillar.key} className="relative group/pillar">
                      <button
                        disabled={!isEditable}
                        onClick={(e) => {
                          e.stopPropagation();
                          const newPillars = { ...currentLog.happinessPillars, [pillar.key]: !isActive };
                          updateLog({ happinessPillars: newPillars });
                          if (!isActive) {
                            addFloatingPoint(e.clientX, e.clientY, '+10');
                            playSound(SOUNDS.POP);
                          } else {
                            addFloatingPoint(e.clientX, e.clientY, '-10', true);
                            playSound(SOUNDS.CLICK);
                          }
                        }}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all border-2 pr-8 ${isActive ? 'bg-emerald-500 text-white border-emerald-400 shadow-md' : 'bg-white/80 dark:bg-slate-800/80 text-emerald-900/60 dark:text-emerald-200/60 border-transparent hover:bg-white dark:hover:bg-slate-800 hover:border-emerald-100 dark:hover:border-emerald-900'}`}
                      >
                        <span className="text-xl">{pillar.icon}</span>
                        <span className={`text-xs font-bold flex-1 ${isActive ? 'text-white' : 'text-emerald-900/80 dark:text-emerald-200/80'}`}>{pillar.label}</span>
                        {isActive && (
                           <svg className="shrink-0" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        )}
                      </button>
                      {/* Info icon — always visible */}
                      <button
                        onClick={e => { e.stopPropagation(); setSelectedPillarInfo(pillar); playSound(SOUNDS.CLICK); }}
                        className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-all ${isActive ? 'text-white/70 hover:text-white hover:bg-white/20' : 'text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'}`}
                        title="Learn more"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </Card>

        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 ${!isEditable ? 'pointer-events-none opacity-90' : ''}`}>
          {settings.customActivities.map(ca => {
            const data = currentLog.customActivitiesData?.[ca.id];
            
            // Checklist Streak Logic
            let streak = 0;
            let multiplier = 1;
            let currentPoints = ca.points;
            
            if (ca.type === 'checklist') {
                streak = calculateCustomActivityStreak(ca.id, logs, todayStr);
                if (streak > 30) multiplier = 2;
                else if (streak > 7) multiplier = 1.5;
                currentPoints = ca.points * multiplier;
            }

            return (
              <Card key={ca.id}>
                <div className="flex justify-between items-start mb-2">
                    <SectionTitle title={ca.name} icon={ca.emoji} />
                    {ca.type === 'checklist' && streak > 0 && (
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-black uppercase text-orange-500 tracking-widest">🔥 {streak} Day Streak</span>
                            {multiplier > 1 && <span className="text-[8px] font-black bg-amber-100 text-amber-600 px-1.5 rounded-sm">x{multiplier} Multiplier</span>}
                        </div>
                    )}
                </div>
                
                {ca.type === 'checklist' && (
                  <button 
                    disabled={!isEditable}
                    onClick={(e) => {
                      const newVal = !data;
                      const newData = { ...currentLog.customActivitiesData, [ca.id]: newVal };
                      updateLog({ customActivitiesData: newData });
                      addFloatingPoint(e.clientX, e.clientY, newVal ? `+${currentPoints}` : `-${currentPoints}`, !newVal);
                      playSound(newVal ? SOUNDS.POP : SOUNDS.CLICK);
                    }}
                    className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border-2 flex justify-center items-center gap-2 ${data ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-300 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                  >
                    {data ? 'Completed' : 'Mark Done'} {multiplier > 1 && <span className="opacity-70 text-[8px]">(+{currentPoints}pts)</span>}
                  </button>
                )}
                {ca.type === 'score' && (
                  <div className="flex items-center gap-4">
                    <input 
                      disabled={!isEditable}
                      type="range" min="0" max="10" step="1" value={data || 0} 
                      onChange={(e) => {
                        const newVal = parseInt(e.target.value);
                        const oldVal = data || 0;
                        const newData = { ...currentLog.customActivitiesData, [ca.id]: newVal };
                        updateLog({ customActivitiesData: newData });
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = rect.left + rect.width / 2;
                        const y = rect.top;
                        if (newVal > oldVal) {
                          addFloatingPoint(x, y, `+${(newVal - oldVal) * ca.points}`);
                          playSound(SOUNDS.CLICK);
                        } else if (newVal < oldVal) {
                          addFloatingPoint(x, y, `-${(oldVal - newVal) * ca.points}`, true);
                        }
                      }}
                      className="flex-1 accent-indigo-600"
                    />
                    <span className="w-10 text-center font-black text-indigo-600 dark:text-indigo-400 text-sm">{data || 0}</span>
                  </div>
                )}
                {ca.type === 'time' && (
                  <div className="flex gap-2">
                    <input 
                      disabled={!isEditable}
                      type="number" placeholder="Mins" value={data || ''} 
                      onChange={(e) => {
                        const newVal = parseInt(e.target.value) || 0;
                        const newData = { ...currentLog.customActivitiesData, [ca.id]: newVal };
                        updateLog({ customActivitiesData: newData });
                      }}
                      onBlur={(e) => {
                        const val = parseInt(e.currentTarget.value) || 0;
                        if (val > 0) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          addFloatingPoint(rect.left + rect.width / 2, rect.top, `+${Math.floor((val / 30) * ca.points)}`);
                          playSound(SOUNDS.SUCCESS);
                        }
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-black text-center text-indigo-600 dark:text-indigo-400 outline-none"
                    />
                  </div>
                )}
                {ca.type === 'notes' && (
                   <textarea 
                      disabled={!isEditable}
                      placeholder="Add notes..." value={data || ''} 
                      onChange={(e) => {
                        const newData = { ...currentLog.customActivitiesData, [ca.id]: e.target.value };
                        updateLog({ customActivitiesData: newData });
                      }}
                      onBlur={(e) => {
                        if (e.currentTarget.value.trim().length > 0 && !(data && data.trim().length > 0)) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          addFloatingPoint(rect.left + rect.width / 2, rect.top, `+${ca.points}`);
                          playSound(SOUNDS.CLICK);
                        }
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-xs font-medium border-2 border-transparent focus:border-indigo-200 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all min-h-[80px] resize-none custom-scrollbar leading-relaxed dark:text-slate-200"
                   />
                )}
              </Card>
            );
          })}

          <Card>
            <SectionTitle title="Energy Levels" icon="🔋" />
            <SubLabel text="Rate your energy throughout the day." />
            <div className="space-y-4 mt-2">
              {[
                { key: 'morning', label: 'Morning (Wake Up)' },
                { key: 'afternoon', label: 'Afternoon (1:30 PM)' },
                { key: 'evening', label: 'Evening (6:00 PM)' },
                { key: 'night', label: 'Night (Bedtime)' }
              ].map(period => {
                const pKey = period.key as 'morning' | 'afternoon' | 'evening' | 'night';
                const val = currentLog.energyLevels?.[pKey] || 0;
                
                return (
                  <div key={pKey} className="space-y-1">
                    <div className="flex justify-between items-center">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{period.label}</label>
                        <span className={`text-[10px] font-bold ${val > 7 ? 'text-emerald-500' : val > 4 ? 'text-amber-500' : 'text-rose-500'}`}>{val}/10</span>
                    </div>
                    <input 
                      type="range" min="0" max="10" step="1" 
                      value={val}
                      disabled={!isEditable}
                      onChange={(e) => {
                        const newVal = parseInt(e.target.value);
                        updateLog({ energyLevels: { ...(currentLog.energyLevels || { morning: 0, afternoon: 0, evening: 0, night: 0 }), [pKey]: newVal } });
                        if (newVal === 10) playSound(SOUNDS.SUCCESS);
                      }}
                      className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <SectionTitle title={TRACKER_FIELDS.water.label} fieldKey="water" icon="💧" streak={waterStreak} />
            <SubLabel text={TRACKER_FIELDS.water.shortImportance} />
            <div className="flex gap-2 mb-4">
              {[0.25, 0.5, 1.0].map(v => (
                <button disabled={!isEditable} key={v} onClick={(e) => {
                  if (todayWater + v > 5) {
                    alert("Whoa! That's a lot of water. Maximum daily limit is 5 Liters.");
                    return;
                  }
                  updateLog({ waterEntries: [...currentLog.waterEntries, { id: Math.random().toString(), amount: v, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }] });
                  addFloatingPoint(e.clientX, e.clientY, `+${Math.floor(v * 10)}`);
                  playSound(SOUNDS.SUCCESS);
                }} className="flex-1 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-300 font-bold py-2.5 sm:py-3 rounded-2xl border border-sky-100/50 dark:border-sky-800/30 hover:bg-sky-500 hover:text-white hover:shadow-lg hover:shadow-sky-100 transition-all active:scale-95 text-xs sm:text-sm disabled:opacity-50">+{v}L</button>
              ))}
            </div>
            <div className="max-h-24 overflow-y-auto custom-scrollbar space-y-1 pr-1">
              {currentLog.waterEntries.length === 0 ? (
                <p className="text-[10px] text-gray-300 italic text-center py-2">No water logged yet today.</p>
              ) : (
                currentLog.waterEntries.map(e => <div key={e.id} className="text-[10px] flex justify-between bg-sky-50/30 dark:bg-sky-900/20 p-2 rounded-lg text-sky-700/60 dark:text-sky-300/60 font-medium"><span>{e.amount}L Intake</span><span>{e.timestamp}</span></div>)
              )}
            </div>
          </Card>

          <Card>
            <SectionTitle title={TRACKER_FIELDS.sleep.label} fieldKey="sleep" icon="🌙" streak={sleepStreak} />
            <SubLabel text={TRACKER_FIELDS.sleep.shortImportance} />
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest pl-1">Bedtime</label>
                <input disabled={!isEditable} type="time" value={currentLog.sleepStart} onChange={e => handleSleepTimeChange('sleepStart', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-xs font-bold border-2 border-transparent focus:border-indigo-100 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all disabled:opacity-50 dark:text-slate-200" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest pl-1">Wake up</label>
                <input disabled={!isEditable} type="time" value={currentLog.sleepEnd} onChange={e => handleSleepTimeChange('sleepEnd', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-xs font-bold border-2 border-transparent focus:border-indigo-100 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all disabled:opacity-50 dark:text-slate-200" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input disabled={!isEditable} type="number" placeholder="Hours" value={currentLog.sleepHours || ''} onChange={e => { playSound(SOUNDS.CLICK); updateLog({ sleepHours: parseInt(e.target.value) || 0 }); }} className="w-full min-w-0 bg-indigo-50/50 dark:bg-indigo-900/20 p-3 rounded-xl text-xs text-center font-black text-indigo-600 dark:text-indigo-400 border-none outline-none disabled:opacity-50" />
              <input disabled={!isEditable} type="number" placeholder="Minutes" value={currentLog.sleepMinutes || ''} onChange={e => { playSound(SOUNDS.CLICK); updateLog({ sleepMinutes: parseInt(e.target.value) || 0 }); }} className="w-full min-w-0 bg-indigo-50/50 dark:bg-indigo-900/20 p-3 rounded-xl text-xs text-center font-black text-indigo-600 dark:text-indigo-400 border-none outline-none disabled:opacity-50" />
            </div>
          </Card>

          <Card className="sm:col-span-2">
            <SectionTitle title={TRACKER_FIELDS.study.label} fieldKey="study" icon="📚" streak={studyStreak} />
            <SubLabel text={TRACKER_FIELDS.study.shortImportance} />
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <input disabled={!isEditable} id="sub" placeholder="Topic: Coding, Math, Project..." className="flex-1 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-medium border-2 border-transparent focus:border-indigo-200 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all disabled:opacity-50 dark:text-slate-200" />
              <div className="flex gap-2">
                <input disabled={!isEditable} id="dur" type="number" placeholder="Mins" className="w-24 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm border-none font-black text-indigo-600 dark:text-indigo-400 outline-none disabled:opacity-50" />
                <button disabled={!isEditable} onClick={(e) => {
                  const s = (document.getElementById('sub') as HTMLInputElement).value;
                  const d = parseInt((document.getElementById('dur') as HTMLInputElement).value);
                  if (s && d) {
                    const currentTotal = currentLog.studySessions.reduce((a,c) => a + c.duration, 0);
                    if (currentTotal + d > 15 * 60) {
                        alert("Maximum study limit (15 hours) reached for the day. Go get some sleep!");
                        return;
                    }
                    updateLog({ studySessions: [...(currentLog.studySessions || []), { id: Math.random().toString(), subject: s, duration: d, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }] });
                    addFloatingPoint(e.clientX, e.clientY, `+${Math.floor((d / 30) * 10)}`);
                    (document.getElementById('sub') as HTMLInputElement).value = '';
                    (document.getElementById('dur') as HTMLInputElement).value = '';
                    playSound(SOUNDS.SUCCESS);
                  }
                }} className="bg-indigo-600 text-white px-8 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50">Add</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentLog.studySessions.length === 0 ? (
                <p className="text-xs text-slate-300 italic w-full text-center py-2">No focus sessions recorded yet.</p>
              ) : (
                currentLog.studySessions.map(s => (
                  <div key={s.id} className="group flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-2xl border border-indigo-100/50 dark:border-indigo-800/30 animate-in zoom-in-95 duration-200">
                      <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                      <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">{s.subject} <span className="opacity-40 ml-1 font-medium">{s.duration}m</span></span>
                      {isEditable && (
                        <button onClick={() => { playSound(SOUNDS.CLICK); updateLog({ studySessions: currentLog.studySessions.filter(item => item.id !== s.id) }); }} className="text-indigo-300 hover:text-red-500 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="sm:col-span-2">
            <SectionTitle title="Exercise & Workouts" fieldKey="exercise" icon="🏃" streak={exerciseStreak} />
            <SubLabel text="Track your movement: pick a type and how long you went." />
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <select disabled={!isEditable} id="ex_type" className="flex-1 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-bold border-2 border-transparent focus:border-emerald-200 focus:bg-white dark:focus:bg-slate-900 outline-none appearance-none cursor-pointer disabled:opacity-50 dark:text-slate-200">
                <option value="Running">Running 🏃</option>
                <option value="Gym">Gym 🏋️</option>
                <option value="Yoga">Yoga 🧘</option>
                <option value="Cycling">Cycling 🚴</option>
                <option value="Walking">Walking 🚶</option>
                <option value="Swimming">Swimming 🏊</option>
                <option value="Other">Other ⚡</option>
              </select>
              <div className="flex gap-2">
                <input disabled={!isEditable} id="ex_dur" type="number" placeholder="Mins" className="w-24 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm border-none font-black text-emerald-600 dark:text-emerald-400 outline-none disabled:opacity-50" />
                <button disabled={!isEditable} onClick={(e) => {
                  const t = (document.getElementById('ex_type') as HTMLSelectElement).value;
                  const d = parseInt((document.getElementById('ex_dur') as HTMLInputElement).value);
                  if (t && d) {
                    const currentTotal = currentLog.exerciseEntries.reduce((a,c) => a + c.duration, 0);
                    if (currentTotal + d > 5 * 60) {
                        alert("Maximum exercise limit (5 hours) reached. Don't overtrain!");
                        return;
                    }
                    updateLog({ exerciseEntries: [...(currentLog.exerciseEntries || []), { id: Math.random().toString(), type: t, duration: d, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }] });
                    addFloatingPoint(e.clientX, e.clientY, `+${Math.floor((d / 30) * 20)}`);
                    (document.getElementById('ex_dur') as HTMLInputElement).value = '';
                    playSound(SOUNDS.SUCCESS);
                  }
                }} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl text-sm font-bold shadow-lg shadow-emerald-100 dark:shadow-none hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50">Log</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentLog.exerciseEntries.length === 0 ? (
                <p className="text-xs text-slate-300 italic w-full text-center py-2">Time to move!</p>
              ) : (
                currentLog.exerciseEntries.map(e => (
                  <div key={e.id} className="group flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-2xl border border-indigo-100/50 dark:border-emerald-800/30 animate-in zoom-in-95 duration-200">
                      <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">{e.type} <span className="opacity-40 ml-1 font-medium">{e.duration}m</span></span>
                      {isEditable && (
                        <button onClick={() => { playSound(SOUNDS.CLICK); updateLog({ exerciseEntries: currentLog.exerciseEntries.filter(item => item.id !== e.id) }); }} className="text-emerald-300 hover:text-red-500 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="sm:col-span-2">
            <SectionTitle title={TRACKER_FIELDS.screenTime.label} fieldKey="screenTime" icon="📱" streak={screenTimeStreak} />
            <SubLabel text="Log your digital consumption app-by-app. Points auto-deduct if over 4h total." />
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <input disabled={!isEditable} id="st_app" placeholder="App: YouTube, Reddit, WhatsApp..." className="flex-1 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-medium border-2 border-transparent focus:border-amber-200 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all disabled:opacity-50 dark:text-slate-200" />
              <div className="flex gap-2">
                <input disabled={!isEditable} id="st_dur" type="number" placeholder="Mins" className="w-24 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm border-none font-black text-amber-600 outline-none disabled:opacity-50" />
                <button disabled={!isEditable} onClick={(e) => {
                  const app = (document.getElementById('st_app') as HTMLInputElement).value;
                  const mins = parseInt((document.getElementById('st_dur') as HTMLInputElement).value);
                  if (app && mins) {
                    const currentTotal = currentLog.screenTimeHours * 60 + currentLog.screenTimeMinutes;
                    if (currentTotal + mins > 15 * 60) {
                        alert("Screen time limit (15 hours) reached. Maybe touch some grass?");
                        return;
                    }
                    const newEntries = [...(currentLog.screenTimeEntries || []), { id: Math.random().toString(), appName: app, duration: mins, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }];
                    const totalMins = newEntries.reduce((a, c) => a + c.duration, 0);
                    updateLog({ 
                      screenTimeEntries: newEntries,
                      screenTimeHours: Math.floor(totalMins / 60),
                      screenTimeMinutes: totalMins % 60
                    });
                    (document.getElementById('st_app') as HTMLInputElement).value = '';
                    (document.getElementById('st_dur') as HTMLInputElement).value = '';
                    playSound(SOUNDS.SUCCESS);
                  }
                }} className="bg-amber-500 text-white px-8 rounded-2xl text-sm font-bold shadow-lg shadow-amber-100 dark:shadow-none hover:bg-amber-600 transition-all active:scale-95 disabled:opacity-50">Add</button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {(!currentLog.screenTimeEntries || currentLog.screenTimeEntries.length === 0) ? (
                <p className="text-xs text-slate-300 italic w-full text-center py-2">No apps logged yet.</p>
              ) : (
                currentLog.screenTimeEntries.map(e => (
                  <div key={e.id} className="group flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-2xl border border-amber-100 dark:border-amber-800/30 animate-in zoom-in-95 duration-200">
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-200">{e.appName} <span className="opacity-40 ml-1 font-medium">{e.duration}m</span></span>
                      {isEditable && (
                        <button onClick={() => { 
                          playSound(SOUNDS.CLICK); 
                          const filtered = currentLog.screenTimeEntries.filter(item => item.id !== e.id);
                          const totalMins = filtered.reduce((a, c) => a + c.duration, 0);
                          updateLog({ 
                            screenTimeEntries: filtered,
                            screenTimeHours: Math.floor(totalMins / 60),
                            screenTimeMinutes: totalMins % 60
                          }); 
                        }} className="text-amber-300 hover:text-red-500 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
               <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Calculated Total Usage</span>
                  <p className="text-lg font-black text-amber-600">{currentLog.screenTimeHours}h <span className="text-sm opacity-60">{currentLog.screenTimeMinutes}m</span></p>
               </div>
               <div className="text-right">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Budget 4h/Day</span>
                  { (currentLog.screenTimeHours + currentLog.screenTimeMinutes/60) > 4 ? (
                    <div className="text-rose-500 text-[10px] font-black flex items-center gap-1 mt-1 animate-pulse">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      Deducting Points
                    </div>
                  ) : (
                    <div className="text-emerald-500 text-[10px] font-black mt-1">Within Safe Range</div>
                  )}
               </div>
            </div>
          </Card>

          <Card>
            <SectionTitle title="Daily Skincare" fieldKey="skincare" icon="✨" streak={skincareStreak} />
            <SubLabel text="Check off your routine for healthy, glowing skin." />
            <div className="flex gap-2">
               {['Morning', 'Afternoon', 'Night'].map(period => {
                 const key = period.toLowerCase() as 'morning' | 'afternoon' | 'night';
                 const isActive = currentLog.skincare[key];
                 return (
                  <button 
                    key={period} 
                    disabled={!isEditable}
                    onClick={(e) => {
                      updateLog({ skincare: {...currentLog.skincare, [key]: !isActive} });
                      addFloatingPoint(e.clientX, e.clientY, !isActive ? '+10' : '-10', isActive);
                      playSound(isActive ? SOUNDS.CLICK : SOUNDS.POP);
                    }} 
                    className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all border-2 disabled:opacity-50 ${isActive ? 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-100 dark:shadow-none scale-105' : 'bg-slate-50 dark:bg-slate-800 text-slate-300 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                  >
                    {period}
                  </button>
                 )
               })}
            </div>
          </Card>

          <Card>
            <SectionTitle title={TRACKER_FIELDS.meals.label} fieldKey="meals" icon="🍽️" streak={mealsStreak} />
            <SubLabel text={TRACKER_FIELDS.meals.shortImportance} />
            <div className="flex gap-2">
               {['Breakfast', 'Lunch', 'Dinner'].map(meal => {
                 const key = meal.toLowerCase() as 'breakfast' | 'lunch' | 'dinner';
                 const isActive = currentLog.meals[key];
                 return (
                  <button 
                    key={meal} 
                    disabled={!isEditable}
                    onClick={(e) => {
                      updateLog({ meals: {...currentLog.meals, [key]: !isActive} });
                      addFloatingPoint(e.clientX, e.clientY, !isActive ? '+5' : '-5', isActive);
                      playSound(isActive ? SOUNDS.CLICK : SOUNDS.POP);
                    }} 
                    className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all border-2 disabled:opacity-50 ${isActive ? 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-100 dark:shadow-none scale-105' : 'bg-slate-50 dark:bg-slate-800 text-slate-300 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                  >
                    {meal}
                  </button>
                 )
               })}
            </div>
          </Card>

          <Card>
            <SectionTitle title={TRACKER_FIELDS.junkFood.label} fieldKey="junkFood" icon="🍕" />
            <SubLabel text={TRACKER_FIELDS.junkFood.shortImportance} />
            <div className="flex gap-2 items-center">
              <input disabled={!isEditable} type="number" placeholder="Qty" value={currentLog.junkFood || ''} onChange={(e) => {
                  const newVal = parseInt(e.target.value) || 0;
                  if (newVal > 10) {
                    alert("Maximum limit of 10 junk food servings reached. That's enough for today!");
                    return;
                  }
                  const oldVal = currentLog.junkFood;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = rect.left + rect.width / 2;
                  const y = rect.top;
                  if (newVal > oldVal) {
                    addFloatingPoint(x, y, `-${(newVal-oldVal)*10}`, true);
                    playSound(SOUNDS.CLICK);
                  } else if (newVal < oldVal) {
                    addFloatingPoint(x, y, `+${(oldVal-newVal)*10}`);
                    playSound(SOUNDS.SUCCESS);
                  }
                  updateLog({ junkFood: newVal });
              }} className="w-16 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm text-center font-black border-none outline-none focus:bg-amber-50 dark:focus:bg-amber-900/20 disabled:opacity-50 dark:text-slate-200" />
              <input disabled={!isEditable} placeholder="What did you have?..." value={currentLog.junkFoodNotes} onChange={e => updateLog({ junkFoodNotes: e.target.value })} className="flex-1 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-xs font-medium border-none outline-none focus:bg-amber-50 dark:focus:bg-amber-900/20 disabled:opacity-50 dark:text-slate-200" />
            </div>
          </Card>

          {/* Wellness Check Replacement */}
          <Card className="overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-6xl">🧘</div>
              <SectionTitle title="Wellness & State" icon="🧠" />
              <SubLabel text="Quantify your internal vibration." />
              
              <div className="space-y-6 mt-4">
                  {/* Mood Slider */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl">
                      <div className="flex justify-between items-end mb-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Mood</label>
                          <div className="flex items-center gap-2">
                              <span className="text-2xl animate-in zoom-in duration-300 key={currentLog.mood}">
                                  {currentLog.mood >= 9 ? '🤩' : currentLog.mood >= 7 ? '🙂' : currentLog.mood >= 5 ? '😐' : currentLog.mood >= 3 ? '😔' : '😫'}
                              </span>
                              <span className={`text-lg font-black ${currentLog.mood >= 7 ? 'text-emerald-500' : currentLog.mood >= 4 ? 'text-amber-500' : 'text-rose-500'}`}>
                                  {currentLog.mood}/10
                              </span>
                          </div>
                      </div>
                      <input 
                          type="range" min="1" max="10" step="1"
                          disabled={!isEditable} 
                          value={currentLog.mood} 
                          onChange={(e) => { playSound(SOUNDS.CLICK); updateLog({ mood: parseInt(e.target.value) }); }} 
                          className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400 transition-all"
                      />
                      <div className="flex justify-between px-1 mt-1">
                          <span className="text-[8px] font-bold text-slate-300 uppercase">Low</span>
                          <span className="text-[8px] font-bold text-slate-300 uppercase">High</span>
                      </div>
                  </div>

                  {/* Peace Slider */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl">
                      <div className="flex justify-between items-end mb-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Peace Level</label>
                          <div className="flex items-center gap-2">
                              <span className="text-2xl animate-in zoom-in duration-300 key={currentLog.peaceLevel}">
                                  {currentLog.peaceLevel >= 9 ? '🧘‍♂️' : currentLog.peaceLevel >= 7 ? '😌' : currentLog.peaceLevel >= 5 ? '🤔' : '🤯'}
                              </span>
                              <span className={`text-lg font-black ${currentLog.peaceLevel >= 7 ? 'text-indigo-500' : currentLog.peaceLevel >= 4 ? 'text-blue-400' : 'text-slate-500'}`}>
                                  {currentLog.peaceLevel}/10
                              </span>
                          </div>
                      </div>
                      <input 
                          type="range" min="1" max="10" disabled={!isEditable} 
                          value={currentLog.peaceLevel} 
                          onChange={(e) => { playSound(SOUNDS.CLICK); updateLog({ peaceLevel: parseInt(e.target.value) }); }} 
                          className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all" 
                      />
                  </div>

                  {/* Day Rating Slider */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl">
                      <div className="flex justify-between items-end mb-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Day Rating</label>
                          <div className="flex items-center gap-2">
                              <span className="text-lg font-black text-rose-500">{currentLog.dayRating}/10</span>
                          </div>
                      </div>
                      <div className="relative h-4 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                           <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-rose-400 via-purple-500 to-indigo-600 transition-all duration-300" style={{ width: `${currentLog.dayRating * 10}%` }}></div>
                           <input 
                              type="range" min="1" max="10" disabled={!isEditable} 
                              value={currentLog.dayRating} 
                              onChange={(e) => { playSound(SOUNDS.CLICK); updateLog({ dayRating: parseInt(e.target.value) }); }} 
                              className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" 
                          />
                      </div>
                  </div>

                  {/* Nutrition Selector */}
                  <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block">Nutrition Quality</label>
                      <div className="grid grid-cols-2 gap-3">
                          {[
                              { val: 'Healthy', icon: '🥗', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
                              { val: 'Okay', icon: '🍛', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                              { val: 'Poor', icon: '🍔', color: 'bg-orange-100 text-orange-700 border-orange-200' },
                              { val: 'Very Poor', icon: '🍟', color: 'bg-rose-100 text-rose-700 border-rose-200' }
                          ].map((opt) => (
                              <button
                                  key={opt.val}
                                  disabled={!isEditable}
                                  onClick={() => { playSound(SOUNDS.POP); updateLog({ nutritionScore: opt.val }); }}
                                  className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${currentLog.nutritionScore === opt.val ? `ring-2 ring-offset-1 ring-slate-300 dark:ring-offset-slate-900 ${opt.color} shadow-sm font-bold` : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500 dark:text-slate-400 opacity-70 hover:opacity-100'}`}
                              >
                                  <span className="text-xl">{opt.icon}</span>
                                  <span className="text-xs">{opt.val}</span>
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
          </Card>

          {/* Mind & Writing Replacement */}
          <Card className="sm:col-span-2 relative overflow-hidden bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
              <SectionTitle title="Journaling & Clarity" icon="✍️" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  {/* Mind Dump */}
                  <div className="sm:col-span-2 space-y-2">
                      <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">🌩️</span>
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Mind Dump</label>
                      </div>
                      <div className="relative group">
                          <textarea 
                              disabled={!isEditable} 
                              value={currentLog.mindDump} 
                              onChange={(e) => updateLog({ mindDump: e.target.value })} 
                              className="w-full bg-yellow-50 dark:bg-yellow-900/10 p-5 rounded-tr-3xl rounded-bl-3xl rounded-tl-lg rounded-br-lg text-xs font-medium border-2 border-yellow-100 dark:border-yellow-900/30 focus:border-yellow-400 dark:focus:border-yellow-600 focus:bg-yellow-100/50 dark:focus:bg-yellow-900/20 outline-none transition-all resize-none h-24 dark:text-yellow-100 placeholder:text-yellow-700/30 dark:placeholder:text-yellow-200/20 leading-relaxed" 
                              placeholder="Get the noise out of your head..." 
                          />
                      </div>
                  </div>

                  {/* Gratitude */}
                  <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">🙏</span>
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Gratitude</label>
                      </div>
                      <input 
                          disabled={!isEditable} 
                          value={currentLog.gratitude} 
                          onChange={(e) => updateLog({ gratitude: e.target.value })} 
                          className="w-full bg-white dark:bg-slate-800 p-4 rounded-2xl text-sm font-bold border-2 border-slate-100 dark:border-slate-700 focus:border-pink-300 dark:focus:border-pink-700 focus:shadow-lg focus:shadow-pink-100 dark:focus:shadow-none outline-none transition-all dark:text-slate-200" 
                          placeholder="One good thing..." 
                      />
                  </div>

                  {/* Journal */}
                  <div className="sm:col-span-2 space-y-2">
                      <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">📓</span>
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Daily Chronicle</label>
                      </div>
                      <textarea 
                          disabled={!isEditable} 
                          value={currentLog.journal} 
                          onChange={(e) => updateLog({ journal: e.target.value })} 
                          className="w-full bg-white dark:bg-slate-800 p-6 rounded-[2rem] text-sm font-serif leading-loose border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-200 dark:focus:border-indigo-800 outline-none transition-all resize-none h-40 dark:text-slate-200 placeholder:text-slate-300 italic" 
                          placeholder="Capture the story of today..." 
                      />
                  </div>
              </div>
          </Card>

          {/* Summary Replacement */}
          <Card className="sm:col-span-2 bg-gradient-to-br from-indigo-900 to-slate-900 text-white border-none shadow-2xl relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/30 blur-[60px] rounded-full group-hover:bg-indigo-500/50 transition-colors duration-1000"></div>
              <div className="relative z-10">
                  <div className="flex justify-between items-center mb-6">
                      <SectionTitle title="Daily Intelligence Brief" icon="🤖" />
                      <button 
                          disabled={!isEditable}
                          onClick={generateLocalSummary}
                          className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 border border-white/10"
                      >
                          <span className="text-lg">⚡</span> Update
                      </button>
                  </div>
                  
                  <div className="bg-black/20 backdrop-blur-sm rounded-3xl p-6 border border-white/5 min-h-[120px]">
                      {currentLog.autoSummary ? (
                          <p className="text-xs md:text-sm text-indigo-100 leading-relaxed whitespace-pre-wrap font-medium font-mono opacity-90">
                              {currentLog.autoSummary}
                          </p>
                      ) : (
                          <div className="flex flex-col items-center justify-center h-full py-8 text-indigo-300/50">
                              <span className="text-3xl mb-2">📡</span>
                              <p className="text-xs uppercase font-black tracking-widest">No Intelligence Data Generated</p>
                          </div>
                      )}
                  </div>
                  
                  <p className="text-[9px] text-indigo-300/60 mt-4 text-center font-mono">
                      AI-POWERED • DAILY SYNTHESIS • {new Date().toLocaleTimeString()}
                  </p>
              </div>
          </Card>
        </div>

        {/* --- Level System Modal --- */}
        <Modal isOpen={isLevelModalOpen} onClose={() => setIsLevelModalOpen(false)} title="Life Mastery Hierarchy">
            <div className="space-y-4">
                {LEVEL_SYSTEM.map((level) => {
                    const isReached = totalXP >= level.minPoints;
                    const isCurrent = currentLevel.level === level.level;
                    const isNext = nextLevel.level === level.level && !isCurrent;

                    return (
                        <div key={level.level} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${isCurrent ? 'bg-indigo-50 border-indigo-500 dark:bg-indigo-900/30 dark:border-indigo-500 scale-105 shadow-md' : isReached ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30 opacity-70' : 'bg-slate-50 border-transparent dark:bg-slate-900 opacity-40 grayscale'}`}>
                            <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center font-black text-sm shadow-sm ${isCurrent ? 'bg-indigo-600 text-white' : isReached ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500 dark:bg-slate-800'}`}>
                                {level.level}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className={`font-bold text-sm ${isCurrent ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-700 dark:text-slate-300'}`}>{level.name}</h4>
                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{level.minPoints.toLocaleString()} XP Required</p>
                            </div>
                            {isCurrent && <span className="text-[9px] font-black uppercase bg-indigo-100 text-indigo-600 px-2 py-1 rounded shadow-sm">Current Rank</span>}
                            {isReached && !isCurrent && <span className="text-emerald-500 text-lg font-bold">✓</span>}
                            {!isReached && <span className="text-slate-300 text-lg">🔒</span>}
                        </div>
                    )
                })}
            </div>
        </Modal>

        {/* --- Score Breakdown Modal --- */}
        <Modal 
            isOpen={isScoreBreakdownOpen} 
            onClose={() => setIsScoreBreakdownOpen(false)} 
            title="Daily Score Breakdown"
            footer={
                <div className="flex justify-between items-center w-full">
                    <span className="text-xs font-bold text-slate-400">Net Score Today</span>
                    <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{currentDailyNetScore}</span>
                </div>
            }
        >
            <div className="space-y-3">
                {getPointsBreakdown(currentLog).length === 0 ? (
                    <p className="text-center text-slate-400 italic text-sm">No points recorded yet today.</p>
                ) : (
                    getPointsBreakdown(currentLog).map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                <span className="text-lg">{item.icon}</span>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{item.label}</span>
                            </div>
                            <span className={`text-xs font-black ${item.points > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {item.points > 0 ? '+' : ''}{item.points}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </Modal>

        {floatingPoints.map(p => (
            <FloatingPointItem key={p.id} item={p} onComplete={removeFloatingPoint} />
        ))}

        {/* Pillar of Happiness detail modal */}
        {selectedPillarInfo && (
          <div
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setSelectedPillarInfo(null)}
          >
            <div
              className="bg-white dark:bg-slate-950 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border dark:border-slate-800 animate-in slide-in-from-bottom-4 duration-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b dark:border-slate-800 flex items-start justify-between gap-3 bg-emerald-50/50 dark:bg-emerald-900/10">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-3xl shrink-0">{selectedPillarInfo.icon}</span>
                  <div className="min-w-0">
                    <h3 className="font-black text-emerald-900 dark:text-emerald-100 text-base sm:text-lg font-serif leading-tight">{selectedPillarInfo.label}</h3>
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-0.5">Pillar of Happiness</p>
                  </div>
                </div>
                <button onClick={() => setSelectedPillarInfo(null)} className="p-2 hover:bg-emerald-100 dark:hover:bg-slate-800 rounded-full transition-colors text-emerald-700 dark:text-emerald-300 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[65vh] space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{selectedPillarInfo.description}</p>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl p-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">Why it matters</h4>
                  <p className="text-sm text-emerald-900 dark:text-emerald-100 leading-relaxed">{selectedPillarInfo.whyItMatters}</p>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl p-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-1">💡 Tip for Today</h4>
                  <p className="text-sm text-indigo-800 dark:text-indigo-200 leading-relaxed">{selectedPillarInfo.tip}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-3 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] text-slate-400 leading-relaxed text-center">Try to activate as many pillars as possible each day. Covering multiple pillars weekly is a strong predictor of long-term happiness.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
};
