
import React, { useState, useMemo } from 'react';
import { Card, SectionTitle, Modal } from '../components/Shared';
import { DailyLog, AppSettings } from '../types';
import { SOUNDS } from '../utils';

interface GoalsViewProps {
  logs: DailyLog[];
  settings: AppSettings;
  currentDate: string;
  playSound: (url: string) => void;
  updateTargets: (type: 'water' | 'study' | 'exercise' | 'screenTime', period: 'daily' | 'weekly' | 'monthly', value: number) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({ logs, settings, currentDate, playSound, updateTargets }) => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [isEditingTargets, setIsEditingTargets] = useState(false);

  // --- Date Calculation Logic ---
  const { startStr, endStr, label, daysInPeriod } = useMemo(() => {
    const curr = new Date(currentDate);
    let start = new Date(curr);
    let end = new Date(curr);
    let lbl = '';
    let days = 1;

    const toStr = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    if (period === 'daily') {
        lbl = `Target for ${currentDate}`;
        days = 1;
    } else if (period === 'weekly') {
        // Monday is 1, Sunday is 0. Calculate diff to get to previous Monday
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        lbl = `${toStr(start)} to ${toStr(end)}`;
        days = 7;
    } else {
        // Monthly
        start = new Date(curr.getFullYear(), curr.getMonth(), 1);
        end = new Date(curr.getFullYear(), curr.getMonth() + 1, 0);
        lbl = start.toLocaleString('default', { month: 'long', year: 'numeric' });
        days = end.getDate(); // Number of days in this month
    }

    return { startStr: toStr(start), endStr: toStr(end), label: lbl, daysInPeriod: days };
  }, [currentDate, period]);

  // --- PDS Calculation Helper ---
  const calculatePDS = (log: DailyLog) => {
    const studyHours = log.studySessions.reduce((a, c) => a + c.duration, 0) / 60;
    const exerciseMinutes = log.exerciseEntries.reduce((a, c) => a + c.duration, 0);
    
    // Average Energy
    const levels = log.energyLevels || { morning: 0, afternoon: 0, evening: 0, night: 0 };
    const avgEnergy = (levels.morning + levels.afternoon + levels.evening + levels.night) / 4;

    const screenTime = log.screenTimeHours + log.screenTimeMinutes / 60;

    // Formula Implementation
    // 1. Study Score: Max 60 points if study > 8 hours
    const studyScore = Math.min(studyHours / 8, 1) * 60;
    
    // 2. Exercise Score: Max 15 points if exercise > 30 mins
    const exerciseScore = Math.min(exerciseMinutes / 30, 1) * 15;
    
    // 3. Energy Score: Max 15 points if average energy is 10
    const energyScore = (avgEnergy / 10) * 15;
    
    // 4. Screen Time Penalty
    // Penalty starts if > 2 hours.
    // Scales up to 10 hours (max penalty 10 points).
    // Rate = 10 points / (10h - 2h) = 1.25 points per hour
    let screenPenalty = 0;
    if (screenTime > 2) {
        screenPenalty = Math.min((screenTime - 2) * 1.25, 10);
    }

    const pds = studyScore + exerciseScore + energyScore - screenPenalty;
    return Math.max(0, Math.min(100, Math.round(pds)));
  };

  // --- Aggregation Logic ---
  const { stats, overallSuccess, productivityExtremes } = useMemo(() => {
    const relevantLogs = logs.filter(l => l.date >= startStr && l.date <= endStr);
    
    const actualWater = relevantLogs.reduce((acc, l) => acc + l.waterEntries.reduce((a,c) => a + c.amount, 0), 0);
    const actualStudy = relevantLogs.reduce((acc, l) => acc + l.studySessions.reduce((a,c) => a + c.duration, 0), 0) / 60; // hours
    const actualExercise = relevantLogs.reduce((acc, l) => acc + l.exerciseEntries.reduce((a,c) => a + c.duration, 0), 0); // mins
    const actualScreen = relevantLogs.reduce((acc, l) => acc + (l.screenTimeHours + l.screenTimeMinutes/60), 0); // hours

    // Targets from settings based on period
    const targetWater = settings.waterTargets[period];
    const targetStudy = settings.studyTargets[period];
    const targetExercise = settings.exerciseTargets[period];
    const limitScreen = settings.screenTimeTargets[period];

    const _stats = {
        water: { actual: actualWater, target: targetWater, unit: 'L' },
        study: { actual: actualStudy, target: targetStudy, unit: 'hrs' },
        exercise: { actual: actualExercise, target: targetExercise, unit: 'min' },
        screen: { actual: actualScreen, limit: limitScreen, unit: 'hrs' }
    };

    const _overallSuccess = Math.round(
      (
          Math.min(100, (_stats.water.actual / (_stats.water.target || 1)) * 100) + 
          Math.min(100, (_stats.study.actual / (_stats.study.target || 1)) * 100) +
          Math.min(100, (_stats.exercise.actual / (_stats.exercise.target || 1)) * 100) +
          Math.max(0, 100 - ((_stats.screen.actual / (_stats.screen.limit || 1)) * 100))
      ) / 4
    );

    let _productivityExtremes = null;
    if (period !== 'daily' && relevantLogs.length > 0) {
        const scoredLogs = relevantLogs.map(l => ({
            date: l.date,
            score: calculatePDS(l)
        }));
        scoredLogs.sort((a, b) => b.score - a.score);
        _productivityExtremes = {
            best: scoredLogs[0],
            worst: scoredLogs[scoredLogs.length - 1]
        };
    }

    return { stats: _stats, overallSuccess: _overallSuccess, productivityExtremes: _productivityExtremes };
  }, [logs, startStr, endStr, settings, period]);

  // --- Percentage Helpers ---
  const getPercent = (actual: number, target: number) => Math.min(100, Math.round((actual / (target || 1)) * 100));
  
  // Inverse for screen time
  const getScreenPercent = (actual: number, limit: number) => Math.min(100, Math.round((actual / (limit || 1)) * 100));

  return (
    <div className="space-y-8 animate-in slide-in-from-right-6 duration-700 pb-24 overflow-x-hidden">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-serif font-bold text-rose-900 dark:text-rose-100">Target Command Center</h2>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">{label}</p>
        </div>
        <button 
            onClick={() => { playSound(SOUNDS.CLICK); setIsEditingTargets(true); }}
            className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 rounded-2xl hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors shadow-sm"
            title="Customize Targets"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
        </button>
      </div>

      <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        {(['daily', 'weekly', 'monthly'] as const).map((p) => (
            <button
                key={p}
                onClick={() => { playSound(SOUNDS.CLICK); setPeriod(p); }}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
                {p}
            </button>
        ))}
      </div>

      {/* Overview Card */}
      <Card className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white border-none relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/20 blur-[80px] rounded-full -mr-10 -mt-10"></div>
         <div className="relative z-10 flex items-center justify-between">
            <div>
                <p className="text-[10px] font-black uppercase text-indigo-300 tracking-widest mb-1">Total Target Efficiency</p>
                <h3 className="text-5xl font-serif font-bold">{overallSuccess}%</h3>
                <p className="text-xs text-slate-300 mt-2 font-medium">Aggregated success across all metrics</p>
            </div>
            <div className="w-24 h-24 relative flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-700" />
                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * overallSuccess) / 100} className="text-emerald-400 transition-all duration-1000 ease-out" />
                </svg>
                <span className="absolute text-2xl">🎯</span>
            </div>
         </div>
      </Card>

      {/* Productivity Extremes (Weekly/Monthly Only) */}
      {productivityExtremes && (
        <div className="grid grid-cols-2 gap-2 sm:gap-4 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-[2rem] border border-emerald-100 dark:border-emerald-800/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl">👑</div>
                <p className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest mb-2">Most Productive Day</p>
                <h4 className="text-xl font-black text-slate-800 dark:text-slate-100">{productivityExtremes.best.date}</h4>
                <div className="mt-3 inline-block bg-emerald-500 text-white text-xs font-black px-3 py-1.5 rounded-lg shadow-sm">
                    PDS: {productivityExtremes.best.score}/100
                </div>
            </div>
            <div className="bg-rose-50 dark:bg-rose-900/10 p-6 rounded-[2rem] border border-rose-100 dark:border-rose-800/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl">📉</div>
                <p className="text-[9px] font-black uppercase text-rose-600 dark:text-rose-400 tracking-widest mb-2">Least Productive Day</p>
                <h4 className="text-xl font-black text-slate-800 dark:text-slate-100">{productivityExtremes.worst.date}</h4>
                <div className="mt-3 inline-block bg-rose-500 text-white text-xs font-black px-3 py-1.5 rounded-lg shadow-sm">
                    PDS: {productivityExtremes.worst.score}/100
                </div>
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Water Card */}
        <Card>
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-xl">💧</div>
                    <div>
                        <h4 className="font-bold text-slate-700 dark:text-slate-200">Hydration</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target: {stats.water.target}{stats.water.unit}</p>
                    </div>
                </div>
                <span className="text-xl font-black text-sky-500">{getPercent(stats.water.actual, stats.water.target)}%</span>
            </div>
            <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                    <span>{stats.water.actual.toFixed(1)} {stats.water.unit}</span>
                    <span>{stats.water.target.toFixed(1)} {stats.water.unit}</span>
                </div>
                <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500 transition-all duration-1000 ease-out" style={{ width: `${getPercent(stats.water.actual, stats.water.target)}%` }}></div>
                </div>
            </div>
        </Card>

        {/* Study Card */}
        <Card>
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xl">📚</div>
                    <div>
                        <h4 className="font-bold text-slate-700 dark:text-slate-200">Deep Work</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target: {stats.study.target}{stats.study.unit}</p>
                    </div>
                </div>
                <span className="text-xl font-black text-indigo-500">{getPercent(stats.study.actual, stats.study.target)}%</span>
            </div>
            <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                    <span>{stats.study.actual.toFixed(1)} {stats.study.unit}</span>
                    <span>{stats.study.target.toFixed(1)} {stats.study.unit}</span>
                </div>
                <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-1000 ease-out" style={{ width: `${getPercent(stats.study.actual, stats.study.target)}%` }}></div>
                </div>
            </div>
        </Card>

        {/* Exercise Card */}
        <Card>
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xl">🏃</div>
                    <div>
                        <h4 className="font-bold text-slate-700 dark:text-slate-200">Movement</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target: {stats.exercise.target}{stats.exercise.unit}</p>
                    </div>
                </div>
                <span className="text-xl font-black text-emerald-500">{getPercent(stats.exercise.actual, stats.exercise.target)}%</span>
            </div>
            <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                    <span>{stats.exercise.actual.toFixed(0)} {stats.exercise.unit}</span>
                    <span>{stats.exercise.target.toFixed(0)} {stats.exercise.unit}</span>
                </div>
                <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-1000 ease-out" style={{ width: `${getPercent(stats.exercise.actual, stats.exercise.target)}%` }}></div>
                </div>
            </div>
        </Card>

        {/* Screen Time Card (Inverse Logic) */}
        <Card>
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-xl">📱</div>
                    <div>
                        <h4 className="font-bold text-slate-700 dark:text-slate-200">Screen Limit</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max Budget: {stats.screen.limit}{stats.screen.unit}</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className={`text-xl font-black ${stats.screen.actual > stats.screen.limit ? 'text-rose-500' : 'text-amber-500'}`}>
                        {getScreenPercent(stats.screen.actual, stats.screen.limit)}%
                    </span>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Used</p>
                </div>
            </div>
            <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                    <span>{stats.screen.actual.toFixed(1)} {stats.screen.unit}</span>
                    <span>{stats.screen.limit.toFixed(1)} {stats.screen.unit}</span>
                </div>
                <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
                    <div 
                        className={`h-full transition-all duration-1000 ease-out ${stats.screen.actual > stats.screen.limit ? 'bg-rose-500' : stats.screen.actual > stats.screen.limit * 0.8 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${Math.min(100, getScreenPercent(stats.screen.actual, stats.screen.limit))}%` }}
                    ></div>
                </div>
                {stats.screen.actual > stats.screen.limit && (
                    <p className="text-[10px] font-black text-rose-500 text-center animate-pulse mt-1">⚠️ Budget Exceeded by {(stats.screen.actual - stats.screen.limit).toFixed(1)} hrs</p>
                )}
            </div>
        </Card>
      </div>

      <Modal 
        isOpen={isEditingTargets} 
        onClose={() => setIsEditingTargets(false)} 
        title="Customize Goals"
      >
        <div className="space-y-6">
            <p className="text-xs text-slate-400 font-medium text-center">Set your ideal targets for each period. Screen time is a maximum limit.</p>
            
            {/* Helper to render a section */}
            {[
                { type: 'water', label: 'Hydration (L)', icon: '💧', color: 'text-sky-500' },
                { type: 'study', label: 'Deep Work (Hrs)', icon: '📚', color: 'text-indigo-500' },
                { type: 'exercise', label: 'Exercise (Mins)', icon: '🏃', color: 'text-emerald-500' },
                { type: 'screenTime', label: 'Screen Limit (Hrs)', icon: '📱', color: 'text-amber-500' }
            ].map(metric => (
                <div key={metric.type} className="space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">{metric.icon}</span>
                        <h4 className={`text-sm font-bold ${metric.color}`}>{metric.label}</h4>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {(['daily', 'weekly', 'monthly'] as const).map(p => (
                            <div key={p} className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">{p}</label>
                                <input 
                                    type="number" 
                                    value={(settings as any)[`${metric.type}Targets`][p]} 
                                    onChange={(e) => updateTargets(metric.type as any, p, parseFloat(e.target.value) || 0)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-xs font-bold border border-transparent focus:border-indigo-500 outline-none text-center dark:text-slate-200"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <button 
                onClick={() => { playSound(SOUNDS.SUCCESS); setIsEditingTargets(false); }}
                className="w-full bg-indigo-600 text-white font-black py-4 rounded-[1.5rem] shadow-xl hover:bg-indigo-700 active:scale-95 transition-all uppercase text-xs tracking-widest mt-4"
            >
                Save Targets
            </button>
        </div>
      </Modal>
    </div>
  );
};
