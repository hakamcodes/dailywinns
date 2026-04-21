
import React, { useState } from 'react';
import { Card, SectionTitle, SubLabel, Modal, FloatingPointItem, FloatingPoint } from '../components/Shared';
import { DailyLog, AppSettings, Habit } from '../types';
import { calculateHabitStreak } from '../helpers';
import { SOUNDS } from '../utils';

interface HabitsViewProps {
  logs: DailyLog[];
  currentLog: DailyLog;
  updateLog: (updates: Partial<DailyLog>) => void;
  settings: AppSettings;
  isEditable: boolean;
  addFloatingPoint: (x: number, y: number, value: string, isNegative?: boolean) => void;
  removeFloatingPoint: (id: number) => void;
  floatingPoints: FloatingPoint[];
  playSound: (url: string) => void;
  // Modal states
  isPomodoroModalOpen: boolean;
  setIsPomodoroModalOpen: (val: boolean) => void;
  isBreathingModalOpen: boolean;
  setIsBreathingModalOpen: (val: boolean) => void;
  // Pomodoro
  pomodoroStatus: 'setup' | 'running' | 'paused' | 'finished';
  setPomodoroStatus: (status: 'setup' | 'running' | 'paused' | 'finished') => void;
  pomoHours: number;
  setPomoHours: (val: number) => void;
  pomoMinutes: number;
  setPomoMinutes: (val: number) => void;
  pomoSubject: string;
  setPomoSubject: (val: string) => void;
  timeRemaining: number;
  setTimeRemaining: (val: number) => void;
  stopPomoAlarm: () => void;
  abortPomodoro: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  pomoTimerRef: React.MutableRefObject<any>;
  // Breathing
  breathingStatus: 'setup' | 'inhale' | 'hold' | 'exhale' | 'finished';
  setBreathingStatus: (status: 'setup' | 'inhale' | 'hold' | 'exhale' | 'finished') => void;
  breathingTimeRemaining: number;
  setBreathingTimeRemaining: (val: number) => void;
  breathingPhaseRemaining: number;
  setBreathingPhaseRemaining: (val: number) => void;
  stopBreathing: () => void;
  // Habit Selection
  selectedHabitForCalendar: Habit | null;
  setSelectedHabitForCalendar: (habit: Habit | null) => void;
  todayStr: string;
}

export const HabitsView: React.FC<HabitsViewProps> = ({ 
  logs, currentLog, updateLog, settings, isEditable, addFloatingPoint, removeFloatingPoint, floatingPoints, playSound,
  isPomodoroModalOpen, setIsPomodoroModalOpen, isBreathingModalOpen, setIsBreathingModalOpen,
  pomodoroStatus, setPomodoroStatus, pomoHours, setPomoHours, pomoMinutes, setPomoMinutes, pomoSubject, setPomoSubject, timeRemaining, setTimeRemaining, stopPomoAlarm, abortPomodoro, audioRef, pomoTimerRef,
  breathingStatus, setBreathingStatus, breathingTimeRemaining, setBreathingTimeRemaining, breathingPhaseRemaining, setBreathingPhaseRemaining, stopBreathing,
  selectedHabitForCalendar, setSelectedHabitForCalendar, todayStr
}) => {
    // Local state for Time Tracker Modal
    const [isTimeTrackerOpen, setIsTimeTrackerOpen] = useState(false);

    // Generate 30-min time slots for the day
    const generateTimeSlots = () => {
      const slots = [];
      for (let i = 0; i < 48; i++) {
        const startH = Math.floor(i / 2).toString().padStart(2, '0');
        const startM = ((i % 2) * 30).toString().padStart(2, '0');
        
        const endMinsTotal = (i + 1) * 30;
        const endH = Math.floor(endMinsTotal / 60).toString().padStart(2, '0');
        const endM = (endMinsTotal % 60).toString().padStart(2, '0');
        
        const label = `${startH}:${startM} - ${endH === '24' ? '00' : endH}:${endM}`;
        const key = `${startH}:${startM}`; // Unique key for storage
        slots.push({ key, label });
      }
      return slots;
    };

    const timeSlots = generateTimeSlots();

    return (
        <div className="space-y-8 animate-in slide-in-from-right-6 duration-700 pb-10 overflow-x-hidden">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-rose-900 dark:text-rose-100">Consistency Hub</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => { playSound(SOUNDS.CLICK); setIsTimeTrackerOpen(true); }}
                  className="p-3 sm:p-4 bg-amber-500 text-white rounded-2xl shadow-xl shadow-amber-100 dark:shadow-amber-900/30 hover:bg-amber-600 transition-all active:scale-95 flex items-center justify-center gap-2"
                  title="Daily Time Audit"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </button>
                <button 
                  onClick={() => { playSound(SOUNDS.CLICK); setIsBreathingModalOpen(true); }}
                  className="p-3 sm:p-4 bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-100 dark:shadow-emerald-900/30 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                  title="Breathing Exercise"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </button>
                <button 
                  onClick={() => { playSound(SOUNDS.CLICK); setIsPomodoroModalOpen(true); }}
                  className="p-3 sm:p-4 bg-rose-600 text-white rounded-2xl shadow-xl shadow-emerald-100 dark:shadow-rose-900/30 hover:bg-rose-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                  title="Pomodoro Timer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </button>
              </div>
            </div>

            <Card className={`border-indigo-100/50 dark:border-indigo-800/30 ${!isEditable ? 'pointer-events-none opacity-90' : ''}`}>
                <SectionTitle title="Daily Habits" icon="🔥" />
                <SubLabel text="Consistent actions build your future. Each habit earned contributes directly to your Life Score." />
                <div className="grid grid-cols-1 gap-4 mt-6">
                    {settings.habits.length === 0 && (
                        <p className="text-center text-slate-300 italic py-8 text-sm">No habits defined. Add some in Settings!</p>
                    )}
                    {settings.habits.map((habit) => {
                        const isCompleted = currentLog.completedHabits?.includes(habit.id);
                        const streak = calculateHabitStreak(habit.id, logs, todayStr);
                        let multiplier = 1;
                        if (streak > 30) multiplier = 2;
                        else if (streak > 7) multiplier = 1.5;
                        
                        const actualPoints = habit.points * multiplier;

                        return (
                            <div key={habit.id} className="flex gap-2">
                                <button
                                    disabled={!isEditable}
                                    onClick={(e) => {
                                        const newCompleted = isCompleted 
                                            ? currentLog.completedHabits.filter(id => id !== habit.id)
                                            : [...(currentLog.completedHabits || []), habit.id];
                                        updateLog({ completedHabits: newCompleted });
                                        addFloatingPoint(e.clientX, e.clientY, isCompleted ? `-${actualPoints}` : `+${actualPoints}`, isCompleted);
                                        playSound(isCompleted ? SOUNDS.CLICK : SOUNDS.POP);
                                    }}
                                    className={`flex-1 group relative flex items-center gap-4 p-5 rounded-[2rem] text-left transition-all border-2 ${isCompleted ? 'bg-indigo-600 border-indigo-500 shadow-xl' : 'bg-slate-50 dark:bg-slate-800 border-transparent hover:border-indigo-100 dark:hover:border-indigo-900'}`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-colors ${isCompleted ? 'bg-white/20' : 'bg-white dark:bg-slate-700 shadow-sm'}`}>
                                        {habit.emoji}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                            <h4 className={`text-xs font-black uppercase tracking-tight truncate ${isCompleted ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>{habit.name}</h4>
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${isCompleted ? 'bg-white/10 text-white' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'}`}>+{actualPoints} Points</span>
                                            {multiplier > 1 && <span className="text-[8px] font-black bg-amber-500 text-white px-1.5 rounded-sm shadow-sm">x{multiplier}</span>}
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <span className={`text-[10px] font-bold ${isCompleted ? 'text-indigo-200' : 'text-slate-400'}`}>Streak:</span>
                                            <span className={`text-[10px] font-black ${isCompleted ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`}>{streak} days</span>
                                        </div>
                                    </div>
                                    {isCompleted && (
                                        <div className="absolute top-4 right-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                    )}
                                </button>
                                <button 
                                    onClick={() => { playSound(SOUNDS.CLICK); setSelectedHabitForCalendar(habit); }}
                                    className="w-16 flex items-center justify-center bg-slate-50 dark:bg-slate-800 border-none rounded-[2rem] text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all active:scale-95"
                                    aria-label="Habit History"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </Card>

            <Modal 
                isOpen={!!selectedHabitForCalendar} 
                onClose={() => setSelectedHabitForCalendar(null)} 
                title={`${selectedHabitForCalendar?.emoji} ${selectedHabitForCalendar?.name} History`}
            >
                <div className="space-y-6">
                    <p className="text-xs text-slate-400 font-medium text-center uppercase tracking-widest">Last 30 Days Activity</p>
                    <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: 30 }).map((_, i) => {
                            const d = new Date();
                            d.setDate(d.getDate() - (29 - i));
                            const dateStr = d.toISOString().split('T')[0];
                            const log = logs.find(l => l.date === dateStr);
                            const done = log?.completedHabits?.includes(selectedHabitForCalendar?.id || '');
                            
                            return (
                                <div key={dateStr} className="flex flex-col items-center gap-1">
                                    <div 
                                        className={`w-full aspect-square rounded-lg border-2 transition-colors ${done ? 'bg-emerald-500 border-emerald-400 shadow-sm' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}
                                        title={dateStr}
                                    />
                                    <span className="text-[8px] font-black text-slate-300">{d.getDate()}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Modal>

            {/* Time Tracker Modal */}
            <Modal
                isOpen={isTimeTrackerOpen}
                onClose={() => setIsTimeTrackerOpen(false)}
                title="Daily Time Audit"
            >
                <div className="space-y-2">
                    <p className="text-xs text-slate-400 font-medium text-center mb-4">Track every 30 mins. Be honest. Where did the time go?</p>
                    <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-2 space-y-3">
                        {timeSlots.map((slot) => (
                            <div key={slot.key} className="flex items-center gap-3">
                                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 w-14 sm:w-20 shrink-0 text-right">{slot.label}</span>
                                <input 
                                    disabled={!isEditable}
                                    maxLength={25}
                                    placeholder="..."
                                    value={currentLog.timeTracking?.[slot.key] || ''}
                                    onChange={(e) => {
                                        const newTracking = { ...currentLog.timeTracking, [slot.key]: e.target.value };
                                        updateLog({ timeTracking: newTracking });
                                    }}
                                    className="flex-1 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 border border-transparent focus:border-amber-300 dark:focus:border-amber-700 outline-none transition-all placeholder:text-slate-200 dark:placeholder:text-slate-700"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>

            <Modal 
              isOpen={isPomodoroModalOpen && pomodoroStatus === 'setup'} 
              onClose={() => setIsPomodoroModalOpen(false)} 
              title="Deep Work Pomodoro"
            >
              <div className="space-y-8">
                  <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-[3rem] text-center">
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] mb-6">Duration Settings</p>
                      <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6">
                          <div className="flex flex-col items-center gap-2">
                            <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Hours</label>
                            <input type="number" value={pomoHours} onChange={e => { playSound(SOUNDS.CLICK); setPomoHours(Math.max(0, parseInt(e.target.value) || 0)); }} className="w-20 text-4xl font-serif font-bold bg-transparent text-center focus:outline-none dark:text-slate-200" />
                          </div>
                          <span className="text-4xl font-serif font-bold text-slate-200 dark:text-slate-600">:</span>
                          <div className="flex flex-col items-center gap-2">
                            <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Minutes</label>
                            <input type="number" value={pomoMinutes} onChange={e => { playSound(SOUNDS.CLICK); setPomoMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0))); }} className="w-20 text-4xl font-serif font-bold bg-transparent text-center focus:outline-none dark:text-slate-200" />
                          </div>
                      </div>
                  </div>
                  <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Focus Subject</label>
                      <input 
                        placeholder="e.g. System Design, Calculus..." 
                        value={pomoSubject}
                        onChange={e => setPomoSubject(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 p-5 rounded-3xl text-sm font-bold border-2 border-transparent focus:border-indigo-100 dark:focus:border-indigo-900 outline-none dark:text-slate-200"
                      />
                  </div>
                  <button 
                    onClick={() => {
                      const totalSeconds = (pomoHours * 3600) + (pomoMinutes * 60);
                      if (totalSeconds > 0) {
                        setTimeRemaining(totalSeconds);
                        setPomodoroStatus('running');
                        playSound(SOUNDS.SUCCESS);
                      }
                    }}
                    className="w-full bg-indigo-600 text-white font-black py-6 rounded-[2.5rem] shadow-2xl shadow-indigo-100 dark:shadow-none uppercase text-xs tracking-[0.3em] hover:bg-indigo-700 active:scale-95 transition-all"
                  >
                    Initiate Focus
                  </button>
              </div>
            </Modal>

            <Modal
              isOpen={isBreathingModalOpen && breathingStatus === 'setup'}
              onClose={() => setIsBreathingModalOpen(false)}
              title="Relaxing Breathing"
            >
              <div className="space-y-8 text-center">
                <div className="p-8 bg-emerald-50 dark:bg-emerald-900/20 rounded-[3rem] border border-emerald-100 dark:border-emerald-800">
                   <div className="text-4xl mb-4">🌬️</div>
                   <h4 className="text-lg font-serif font-bold text-emerald-900 dark:text-emerald-200 mb-2">2-Minute Mindful Reset</h4>
                   <p className="text-xs text-emerald-800/60 dark:text-emerald-200/60 leading-relaxed font-medium">
                     Follow the simple rhythm: Inhale, Hold, and Exhale. Just two minutes to calm your nervous system and regain focus.
                   </p>
                </div>
                <button
                  onClick={() => {
                    setBreathingTimeRemaining(120);
                    setBreathingPhaseRemaining(4);
                    setBreathingStatus('inhale');
                    playSound(SOUNDS.SUCCESS);
                  }}
                  className="w-full bg-emerald-600 text-white font-black py-6 rounded-[2.5rem] shadow-2xl shadow-indigo-100 dark:shadow-none uppercase text-xs tracking-[0.3em] hover:bg-emerald-700 active:scale-95 transition-all"
                >
                  Begin Exercise
                </button>
              </div>
            </Modal>
            
            <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" />

            {(breathingStatus !== 'setup') && isBreathingModalOpen && (
               <div className="fixed inset-0 z-[10000] bg-slate-900 flex flex-col items-center justify-center text-white p-10 animate-in fade-in duration-500 no-print">
                 <div className="text-center space-y-16">
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] opacity-80">
                        {breathingStatus === 'finished' ? 'Session Complete' : `Time Remaining: ${Math.floor(breathingTimeRemaining / 60)}:${(breathingTimeRemaining % 60).toString().padStart(2, '0')}`}
                      </p>
                      <h4 className="text-5xl font-serif font-bold tracking-tight">
                        {breathingStatus === 'inhale' && 'Inhale Deeply'}
                        {breathingStatus === 'hold' && 'Hold Gently'}
                        {breathingStatus === 'exhale' && 'Release Breath'}
                        {breathingStatus === 'finished' && 'Peace Restored'}
                      </h4>
                    </div>

                    <div className="relative flex items-center justify-center">
                       <div 
                         className={`w-40 h-40 sm:w-64 sm:h-64 rounded-full border-4 border-emerald-400/20 flex items-center justify-center transition-all duration-[4000ms] ease-linear
                          ${breathingStatus === 'inhale' ? 'scale-[1.6] bg-emerald-400/20' : ''}
                          ${breathingStatus === 'hold' ? 'scale-[1.6] bg-emerald-400/30' : ''}
                          ${breathingStatus === 'exhale' ? 'scale-[0.8] bg-transparent' : ''}
                          ${breathingStatus === 'finished' ? 'scale-100 bg-emerald-500/10' : ''}
                         `}
                       >
                          <span className="text-4xl sm:text-6xl font-serif font-black">{breathingPhaseRemaining}</span>
                       </div>
                    </div>

                    {breathingStatus === 'finished' ? (
                       <button 
                         onClick={stopBreathing}
                         className="px-16 py-6 bg-white text-emerald-900 font-black uppercase text-xs tracking-[0.3em] rounded-full shadow-2xl animate-bounce"
                       >
                         Complete & Return
                       </button>
                    ) : (
                       <button 
                         onClick={stopBreathing}
                         className="px-8 py-3 border-2 border-white/10 rounded-full font-black uppercase text-[9px] tracking-[0.2em] text-slate-500 hover:text-white hover:border-white/40 transition-all"
                       >
                         Abort Session
                       </button>
                    )}
                 </div>
               </div>
            )}

            {(pomodoroStatus === 'running' || pomodoroStatus === 'paused' || pomodoroStatus === 'finished') && isPomodoroModalOpen && (
              <div className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center text-white p-4 sm:p-10 animate-in fade-in duration-300 no-print">
                 <div className="text-center space-y-12">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] opacity-60">
                        {pomoSubject || 'Deep Work Focus'}
                    </p>
                    
                    <h4 className={`font-serif font-bold tracking-tight transition-all duration-500 ${pomodoroStatus === 'finished' ? 'text-4xl sm:text-8xl animate-pulse text-white' : 'text-4xl sm:text-9xl'}`}>
                      {Math.floor(timeRemaining / 3600).toString().padStart(2, '0')}:
                      {Math.floor((timeRemaining % 3600) / 60).toString().padStart(2, '0')}:
                      {(timeRemaining % 60).toString().padStart(2, '0')}
                    </h4>

                    {pomodoroStatus === 'finished' ? (
                       <div className="space-y-8">
                          <p className="text-lg font-medium text-slate-400 italic">Session Complete. Please consolidate your work.</p>
                          <button 
                            onClick={stopPomoAlarm}
                            className="px-16 py-6 bg-white text-black font-black uppercase text-xs tracking-[0.3em] rounded-full shadow-2xl animate-bounce"
                          >
                            Terminate Alarm & Save
                          </button>
                       </div>
                    ) : (
                       <div className="flex flex-wrap gap-4 sm:gap-6 justify-center items-center">
                          <button 
                            onClick={() => { playSound(SOUNDS.CLICK); setPomodoroStatus(pomodoroStatus === 'running' ? 'paused' : 'running'); }}
                            className="w-48 py-6 border-2 border-white/10 rounded-full font-black uppercase text-[10px] tracking-[0.2em] hover:bg-white/5 transition-all"
                          >
                            {pomodoroStatus === 'running' ? 'Suspend' : 'Resume'}
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm('Abort focus session?')) {
                                abortPomodoro();
                              }
                            }}
                            className="w-48 py-6 border-2 border-white/10 rounded-full font-black uppercase text-[10px] tracking-[0.2em] text-slate-500 hover:text-white hover:border-white/40 transition-all"
                          >
                            Abort
                          </button>
                       </div>
                    )}
                 </div>
              </div>
            )}
            
            {floatingPoints.map(p => (
                <FloatingPointItem key={p.id} item={p} onComplete={removeFloatingPoint} />
            ))}
        </div>
    );
};
