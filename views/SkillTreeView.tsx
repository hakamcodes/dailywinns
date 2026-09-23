
import React, { useState } from 'react';
import { Card, SectionTitle, SubLabel, Modal } from '../components/Shared';
import { AppSettings, Skill, SkillLog } from '../types';
import { SOUNDS } from '../utils';

interface SkillTreeViewProps {
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
  playSound: (url: string) => void;
  todayStr: string;
  addFloatingPoint: (x: number, y: number, value: string) => void;
}

const SKILL_COLORS = [
    { name: 'indigo', bg: 'bg-indigo-600', border: 'border-indigo-500', text: 'text-indigo-500', lightBg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { name: 'rose', bg: 'bg-rose-600', border: 'border-rose-500', text: 'text-rose-500', lightBg: 'bg-rose-50 dark:bg-rose-900/20' },
    { name: 'emerald', bg: 'bg-emerald-600', border: 'border-emerald-500', text: 'text-emerald-500', lightBg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { name: 'amber', bg: 'bg-amber-600', border: 'border-amber-500', text: 'text-amber-500', lightBg: 'bg-amber-50 dark:bg-amber-900/20' },
    { name: 'cyan', bg: 'bg-cyan-600', border: 'border-cyan-500', text: 'text-cyan-500', lightBg: 'bg-cyan-50 dark:bg-cyan-900/20' },
    { name: 'purple', bg: 'bg-purple-600', border: 'border-purple-500', text: 'text-purple-500', lightBg: 'bg-purple-50 dark:bg-purple-900/20' },
];

const MAX_LEVEL = 30;

export const SkillTreeView: React.FC<SkillTreeViewProps> = ({ 
  settings, setSettings, playSound, todayStr, addFloatingPoint 
}) => {
    // Modal States
    const [isAddSkillModalOpen, setIsAddSkillModalOpen] = useState(false);
    const [isEditSkillModalOpen, setIsEditSkillModalOpen] = useState(false);
    const [isLogTimeModalOpen, setIsLogTimeModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isLevelDetailModalOpen, setIsLevelDetailModalOpen] = useState(false);
    
    const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

    // Form States
    const [newSkillForm, setNewSkillForm] = useState<{name: string, targetHours: string, icon: string, color: string}>({
        name: '', targetHours: '100', icon: '⚡', color: 'indigo'
    });
    const [editSkillForm, setEditSkillForm] = useState<{name: string, targetHours: string, icon: string, color: string}>({
        name: '', targetHours: '', icon: '', color: ''
    });
    const [logTimeForm, setLogTimeForm] = useState<{minutes: string, notes: string}>({
        minutes: '', notes: ''
    });

    const activeSkill = settings.skills.find(s => s.id === selectedSkillId);

    // --- Helpers for 30-Level System ---
    
    // Calculates simple 0-100% progress towards the TOTAL target
    const calculateTotalProgress = (totalMinutes: number, targetHours: number) => {
        const totalHours = totalMinutes / 60;
        const percentage = Math.min(100, (totalHours / targetHours) * 100);
        return percentage;
    };

    // Core Logic: Distributes Target Hours across 30 Levels
    // Level 1 = 0 hours (Start)
    // Level 30 = Target Hours (Mastery)
    // Steps = 29 intervals to get from Lvl 1 to Lvl 30
    const getLevelInfo = (totalMinutes: number, targetHours: number) => {
        const totalHours = totalMinutes / 60;
        
        // Avoid division by zero
        if (targetHours <= 0) return { level: MAX_LEVEL, hoursForNext: 0, progressInLevel: 100, hoursPerLevel: 0 };

        const hoursPerLevel = targetHours / 29; 
        
        // Calculate raw level (1-based)
        // Example: 0h -> Level 1. 
        // 3.44h (if target 100) -> Level 2
        let level = 1 + Math.floor(totalHours / hoursPerLevel);
        
        // Cap at 30
        if (level > MAX_LEVEL) level = MAX_LEVEL;

        // Calculate stats for next level
        const hoursForCurrentLevelStart = (level - 1) * hoursPerLevel;
        const hoursForNextLevel = level * hoursPerLevel;
        
        // If at max level
        if (level === MAX_LEVEL) {
            return {
                level: MAX_LEVEL,
                hoursForNext: 0,
                progressInLevel: 100,
                hoursPerLevel
            };
        }

        const hoursRemaining = hoursForNextLevel - totalHours;
        const progressInLevel = ((totalHours - hoursForCurrentLevelStart) / hoursPerLevel) * 100;

        return {
            level,
            hoursForNext: hoursRemaining,
            progressInLevel,
            hoursPerLevel
        };
    };

    // --- Handlers ---
    const handleAddSkill = () => {
        if (!newSkillForm.name || !newSkillForm.targetHours) return;
        
        const newSkill: Skill = {
            id: Math.random().toString(),
            name: newSkillForm.name,
            icon: newSkillForm.icon,
            color: newSkillForm.color,
            targetHours: parseInt(newSkillForm.targetHours),
            totalMinutes: 0,
            logs: []
        };

        setSettings({ ...settings, skills: [...settings.skills, newSkill] });
        setIsAddSkillModalOpen(false);
        setNewSkillForm({ name: '', targetHours: '100', icon: '⚡', color: 'indigo' });
        playSound(SOUNDS.SUCCESS);
    };

    const openEditModal = (skill: Skill) => {
        setSelectedSkillId(skill.id);
        setEditSkillForm({
            name: skill.name,
            targetHours: skill.targetHours.toString(),
            icon: skill.icon,
            color: skill.color
        });
        setIsEditSkillModalOpen(true);
        playSound(SOUNDS.CLICK);
    };

    const handleUpdateSkill = () => {
        if (!selectedSkillId || !editSkillForm.name || !editSkillForm.targetHours) return;

        const updatedSkills = settings.skills.map(s => {
            if (s.id === selectedSkillId) {
                return {
                    ...s,
                    name: editSkillForm.name,
                    targetHours: parseInt(editSkillForm.targetHours),
                    icon: editSkillForm.icon,
                    color: editSkillForm.color
                };
            }
            return s;
        });

        setSettings({ ...settings, skills: updatedSkills });
        setIsEditSkillModalOpen(false);
        playSound(SOUNDS.SUCCESS);
    };

    const handleDeleteSkill = (id: string) => {
        if (confirm("Are you sure? All progress for this skill will be lost forever.")) {
            setSettings({ ...settings, skills: settings.skills.filter(s => s.id !== id) });
            playSound(SOUNDS.CLICK);
        }
    };

    const openLogModal = (skillId: string) => {
        setSelectedSkillId(skillId);
        setLogTimeForm({ minutes: '', notes: '' });
        setIsLogTimeModalOpen(true);
        playSound(SOUNDS.CLICK);
    };

    const openHistoryModal = (skillId: string) => {
        setSelectedSkillId(skillId);
        setIsHistoryModalOpen(true);
        playSound(SOUNDS.CLICK);
    };

    const openLevelDetailModal = (skillId: string) => {
        setSelectedSkillId(skillId);
        setIsLevelDetailModalOpen(true);
        playSound(SOUNDS.CLICK);
    };

    const handleLogTime = (e: React.MouseEvent) => {
        if (!selectedSkillId || !logTimeForm.minutes) return;
        
        const minutes = parseInt(logTimeForm.minutes);
        if (isNaN(minutes) || minutes <= 0) return;

        const newLog: SkillLog = {
            id: Math.random().toString(),
            date: todayStr,
            minutes: minutes,
            notes: logTimeForm.notes
        };

        const updatedSkills = settings.skills.map(s => {
            if (s.id === selectedSkillId) {
                return {
                    ...s,
                    totalMinutes: s.totalMinutes + minutes,
                    logs: [newLog, ...s.logs] // Add new log to history
                };
            }
            return s;
        });

        setSettings({ ...settings, skills: updatedSkills });
        addFloatingPoint(e.clientX, e.clientY, `+${minutes} XP`);
        playSound(SOUNDS.SUCCESS);
        setIsLogTimeModalOpen(false);
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-right-6 duration-700 pb-24 overflow-x-hidden">
            <div className="flex justify-between items-center px-2">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-rose-900 dark:text-rose-100">Skill Tree</h2>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Mastery Progression</p>
                </div>
                <button 
                    onClick={() => { playSound(SOUNDS.CLICK); setIsAddSkillModalOpen(true); }}
                    className="flex items-center gap-2 bg-indigo-600 px-6 py-3 rounded-2xl shadow-lg shadow-indigo-100 dark:shadow-none text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    New Skill
                </button>
            </div>

            {settings.skills.length === 0 ? (
                <div className="p-20 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-indigo-100 dark:border-indigo-900 flex flex-col items-center gap-6">
                    <div className="text-6xl grayscale opacity-20">🧬</div>
                    <p className="text-slate-400 font-medium italic">No active skills. Initialize your first branch.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {settings.skills.map(skill => {
                        const theme = SKILL_COLORS.find(c => c.name === skill.color) || SKILL_COLORS[0];
                        const totalProgress = calculateTotalProgress(skill.totalMinutes, skill.targetHours);
                        const lvlInfo = getLevelInfo(skill.totalMinutes, skill.targetHours);
                        const hoursLogged = (skill.totalMinutes / 60).toFixed(1);

                        return (
                            <div key={skill.id} className="group relative bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 dark:border-slate-800 overflow-hidden">
                                {/* Background Glow */}
                                <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-10 blur-3xl ${theme.bg}`}></div>
                                
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div 
                                            onClick={() => openLevelDetailModal(skill.id)}
                                            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner ${theme.lightBg} cursor-pointer hover:scale-110 transition-transform active:scale-95`}
                                            title="Click to view Level Roadmap"
                                        >
                                            {skill.icon}
                                        </div>
                                        <div 
                                            onClick={() => openLevelDetailModal(skill.id)}
                                            className="text-right cursor-pointer group-hover:opacity-80 transition-opacity"
                                        >
                                            <span className={`block text-[10px] font-black uppercase tracking-widest ${theme.text}`}>Level {lvlInfo.level} / {MAX_LEVEL}</span>
                                            <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{hoursLogged}h</span>
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">{skill.name}</h3>
                                    <div className="flex justify-between items-end mb-3">
                                        <p className="text-[10px] font-medium text-slate-400">Target: {skill.targetHours} Hours</p>
                                        <p className={`text-[10px] font-black ${theme.text}`}>{totalProgress.toFixed(1)}%</p>
                                    </div>

                                    {/* Progress Bar (Overall) */}
                                    <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-6">
                                        <div 
                                            className={`h-full ${theme.bg} shadow-[0_0_10px_rgba(0,0,0,0.2)] transition-all duration-1000 ease-out`} 
                                            style={{ width: `${totalProgress}%` }}
                                        ></div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => openLogModal(skill.id)}
                                            className={`flex-[2] py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-white shadow-lg active:scale-95 transition-all ${theme.bg} hover:opacity-90`}
                                        >
                                            + Log
                                        </button>
                                        <button 
                                            onClick={() => openHistoryModal(skill.id)}
                                            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
                                            title="View History"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </button>
                                        <button 
                                            onClick={() => openEditModal(skill)}
                                            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all"
                                            title="Edit Skill"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteSkill(skill.id)}
                                            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
                                            title="Delete Skill"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* --- Modals --- */}

            {/* Level Detail Roadmap Modal */}
            <Modal 
                isOpen={isLevelDetailModalOpen} 
                onClose={() => setIsLevelDetailModalOpen(false)} 
                title={activeSkill ? `Roadmap: ${activeSkill.name}` : 'Skill Roadmap'}
            >
                {activeSkill && (() => {
                    const lvlInfo = getLevelInfo(activeSkill.totalMinutes, activeSkill.targetHours);
                    const theme = SKILL_COLORS.find(c => c.name === activeSkill.color) || SKILL_COLORS[0];
                    
                    return (
                        <div className="space-y-6">
                            {/* Current Status Card */}
                            <div className={`p-6 rounded-[2rem] ${theme.lightBg} border-2 ${theme.border} text-center`}>
                                <p className={`text-xs font-black uppercase tracking-widest opacity-60 mb-2 ${theme.text}`}>Current Status</p>
                                <h4 className={`text-4xl font-black ${theme.text} mb-1`}>Level {lvlInfo.level}</h4>
                                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">of {MAX_LEVEL} Levels</p>
                                
                                <div className="mt-6 mb-2 flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <span>Progress to Lvl {Math.min(MAX_LEVEL, lvlInfo.level + 1)}</span>
                                    <span>{lvlInfo.hoursForNext.toFixed(1)}h Remaining</span>
                                </div>
                                <div className="h-4 w-full bg-white dark:bg-slate-800 rounded-full overflow-hidden border border-slate-100 dark:border-slate-700">
                                    <div 
                                        className={`h-full ${theme.bg} transition-all duration-1000`} 
                                        style={{ width: `${lvlInfo.progressInLevel}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Roadmap List */}
                            <div>
                                <h5 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">Mastery Path (Target: {activeSkill.targetHours}h)</h5>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                    {Array.from({ length: MAX_LEVEL }).map((_, idx) => {
                                        const levelNum = idx + 1;
                                        const hoursRequired = (levelNum - 1) * lvlInfo.hoursPerLevel;
                                        const isCompleted = levelNum < lvlInfo.level;
                                        const isCurrent = levelNum === lvlInfo.level;
                                        const isLocked = levelNum > lvlInfo.level;

                                        return (
                                            <div 
                                                key={levelNum}
                                                className={`flex items-center justify-between p-3 rounded-xl border ${
                                                    isCurrent ? `${theme.border} ${theme.lightBg}` : 
                                                    isCompleted ? 'bg-slate-50 dark:bg-slate-800 border-transparent opacity-60' : 
                                                    'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-40'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
                                                        isCurrent ? `${theme.bg} text-white` : 
                                                        isCompleted ? 'bg-slate-200 text-slate-500 dark:bg-slate-700' : 
                                                        'bg-slate-100 text-slate-300 dark:bg-slate-800'
                                                    }`}>
                                                        {levelNum}
                                                    </div>
                                                    <span className={`text-xs font-bold ${isCurrent ? 'text-slate-800 dark:text-white' : 'text-slate-500'}`}>
                                                        {levelNum === MAX_LEVEL ? 'Grandmaster' : `Level ${levelNum}`}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-mono font-medium text-slate-400">
                                                    {hoursRequired.toFixed(1)}h
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </Modal>

            {/* Add Skill Modal */}
            <Modal isOpen={isAddSkillModalOpen} onClose={() => setIsAddSkillModalOpen(false)} title="Initialize New Skill">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Skill Name</label>
                        <input 
                            value={newSkillForm.name}
                            onChange={e => setNewSkillForm({...newSkillForm, name: e.target.value})}
                            placeholder="e.g. Python Programming"
                            className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-bold outline-none border-2 border-transparent focus:border-indigo-500 dark:text-slate-200"
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Mastery Target (Hrs)</label>
                            <input 
                                type="number"
                                value={newSkillForm.targetHours}
                                onChange={e => setNewSkillForm({...newSkillForm, targetHours: e.target.value})}
                                className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-bold outline-none border-2 border-transparent focus:border-indigo-500 text-center dark:text-slate-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Icon</label>
                            <input 
                                value={newSkillForm.icon}
                                onChange={e => setNewSkillForm({...newSkillForm, icon: e.target.value})}
                                className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-bold outline-none border-2 border-transparent focus:border-indigo-500 text-center dark:text-slate-200"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Theme Color</label>
                        <div className="flex gap-2">
                            {SKILL_COLORS.map(c => (
                                <button
                                    key={c.name}
                                    onClick={() => { playSound(SOUNDS.CLICK); setNewSkillForm({...newSkillForm, color: c.name}); }}
                                    className={`w-10 h-10 rounded-full ${c.bg} transition-transform ${newSkillForm.color === c.name ? 'scale-110 ring-2 ring-offset-2 ring-slate-400' : 'opacity-40 hover:opacity-100'}`}
                                />
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={handleAddSkill}
                        className="w-full bg-indigo-600 text-white font-black py-5 rounded-[1.5rem] shadow-xl hover:bg-indigo-700 active:scale-95 transition-all uppercase text-xs tracking-widest"
                    >
                        Create Skill Node
                    </button>
                </div>
            </Modal>

            {/* Edit Skill Modal */}
            <Modal isOpen={isEditSkillModalOpen} onClose={() => setIsEditSkillModalOpen(false)} title="Modify Skill Config">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Skill Name</label>
                        <input 
                            value={editSkillForm.name}
                            onChange={e => setEditSkillForm({...editSkillForm, name: e.target.value})}
                            className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-bold outline-none border-2 border-transparent focus:border-indigo-500 dark:text-slate-200"
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Target (Hrs)</label>
                            <input 
                                type="number"
                                value={editSkillForm.targetHours}
                                onChange={e => setEditSkillForm({...editSkillForm, targetHours: e.target.value})}
                                className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-bold outline-none border-2 border-transparent focus:border-indigo-500 text-center dark:text-slate-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Icon</label>
                            <input 
                                value={editSkillForm.icon}
                                onChange={e => setEditSkillForm({...editSkillForm, icon: e.target.value})}
                                className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-bold outline-none border-2 border-transparent focus:border-indigo-500 text-center dark:text-slate-200"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Theme Color</label>
                        <div className="flex gap-2">
                            {SKILL_COLORS.map(c => (
                                <button
                                    key={c.name}
                                    onClick={() => { playSound(SOUNDS.CLICK); setEditSkillForm({...editSkillForm, color: c.name}); }}
                                    className={`w-10 h-10 rounded-full ${c.bg} transition-transform ${editSkillForm.color === c.name ? 'scale-110 ring-2 ring-offset-2 ring-slate-400' : 'opacity-40 hover:opacity-100'}`}
                                />
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={handleUpdateSkill}
                        className="w-full bg-amber-600 text-white font-black py-5 rounded-[1.5rem] shadow-xl hover:bg-amber-700 active:scale-95 transition-all uppercase text-xs tracking-widest"
                    >
                        Update Configuration
                    </button>
                </div>
            </Modal>

            {/* History Modal */}
            <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title={`${activeSkill?.name || 'Skill'} Logs`}>
                <div className="space-y-4">
                    {(!activeSkill?.logs || activeSkill.logs.length === 0) ? (
                        <p className="text-center text-slate-400 italic text-sm py-8">No session logs recorded yet.</p>
                    ) : (
                        <div className="max-h-[50vh] overflow-y-auto custom-scrollbar pr-2 space-y-3">
                            {activeSkill.logs.map(log => (
                                <div key={log.id} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-black text-slate-700 dark:text-slate-200">{log.minutes}m</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{log.date}</span>
                                        </div>
                                        {log.notes && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">"{log.notes}"</p>}
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl text-center">
                        <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Total Investment</span>
                        <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300">{(activeSkill?.totalMinutes || 0) / 60} Hours</p>
                    </div>
                </div>
            </Modal>

            {/* Log Time Modal */}
            <Modal isOpen={isLogTimeModalOpen} onClose={() => setIsLogTimeModalOpen(false)} title={`Log: ${activeSkill?.name || 'Skill'}`}>
                <div className="space-y-6">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl text-center">
                        <p className="text-[10px] uppercase font-black text-indigo-400 tracking-widest">Total Hours So Far</p>
                        <p className="text-3xl font-black text-indigo-700 dark:text-indigo-200">{(activeSkill?.totalMinutes || 0) / 60}h</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Minutes Spent</label>
                        <input 
                            type="number"
                            value={logTimeForm.minutes}
                            onChange={e => setLogTimeForm({...logTimeForm, minutes: e.target.value})}
                            placeholder="e.g. 45"
                            className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-xl font-black text-center outline-none border-2 border-transparent focus:border-indigo-500 dark:text-slate-200"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Session Notes</label>
                        <input 
                            value={logTimeForm.notes}
                            onChange={e => setLogTimeForm({...logTimeForm, notes: e.target.value})}
                            placeholder="What did you learn?"
                            className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-medium outline-none border-2 border-transparent focus:border-indigo-500 dark:text-slate-200"
                        />
                    </div>

                    <button 
                        onClick={handleLogTime}
                        className="w-full bg-emerald-600 text-white font-black py-5 rounded-[1.5rem] shadow-xl hover:bg-emerald-700 active:scale-95 transition-all uppercase text-xs tracking-widest"
                    >
                        Confirm Progress
                    </button>
                </div>
            </Modal>
        </div>
    );
};
