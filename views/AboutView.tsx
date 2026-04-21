
import React from 'react';
import { AboutMeData, AppSettings } from '../types';
import { SOUNDS } from '../utils';

interface AboutViewProps {
  aboutMeData: AboutMeData;
  setAboutMeData: (data: AboutMeData) => void;
  isEditingAboutMe: boolean;
  setIsEditingAboutMe: (val: boolean) => void;
  tempAboutMe: AboutMeData;
  setTempAboutMe: (data: AboutMeData) => void;
  settings: AppSettings;
  playSound: (url: string) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ 
  aboutMeData, setAboutMeData, isEditingAboutMe, setIsEditingAboutMe, tempAboutMe, setTempAboutMe, settings, playSound 
}) => {
    // Enhanced field definitions with layout hints and themes
    const fields: { key: keyof AboutMeData; label: string; placeholder: string; icon: string; className?: string; textColor: string; bgColor: string }[] = [
      { key: 'goals', label: 'Ultimate Goals & Dreams', placeholder: 'e.g., Build a successful tech startup...', icon: '🚀', className: 'md:col-span-2', textColor: 'text-indigo-600 dark:text-indigo-300', bgColor: 'bg-indigo-50 dark:bg-indigo-900/20' },
      { key: 'lifeChangingHabit', label: 'Life-Changing Habit', placeholder: 'e.g., Waking up at 5 AM...', icon: '⚡', textColor: 'text-amber-600 dark:text-amber-300', bgColor: 'bg-amber-50 dark:bg-amber-900/20' },
      { key: 'biggestStrength', label: 'My Superpower', placeholder: 'e.g., Resilience and deep focus...', icon: '💪', textColor: 'text-emerald-600 dark:text-emerald-300', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20' },
      { key: 'weaknessWorkingOn', label: 'Work In Progress', placeholder: 'e.g., Procrastination on small tasks...', icon: '🛠️', textColor: 'text-slate-500 dark:text-slate-400', bgColor: 'bg-slate-50 dark:bg-slate-800' },
      { key: 'lowMotivationBoost', label: 'Motivation Protocol', placeholder: 'e.g., Listening to cinematic music...', icon: '🔥', textColor: 'text-orange-500 dark:text-orange-300', bgColor: 'bg-orange-50 dark:bg-orange-900/20' },
      { key: 'strongLifeLesson', label: 'Core Life Philosophy', placeholder: 'e.g., Consistency beats intensity...', icon: '📖', className: 'md:col-span-2', textColor: 'text-rose-600 dark:text-rose-300', bgColor: 'bg-rose-50 dark:bg-rose-900/20' },
      { key: 'shortTerm6m', label: '6-Month Horizon', placeholder: 'e.g., Learn cloud architecture...', icon: '📅', textColor: 'text-sky-600 dark:text-sky-300', bgColor: 'bg-sky-50 dark:bg-sky-900/20' },
      { key: 'shortTerm1y', label: '1-Year Horizon', placeholder: 'e.g., Get a professional certification...', icon: '🗓️', textColor: 'text-blue-600 dark:text-blue-300', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
      { key: 'collegeEndGoals', label: 'College Endgame', placeholder: 'e.g., Master system design...', icon: '🎓', className: 'md:col-span-2', textColor: 'text-violet-600 dark:text-violet-300', bgColor: 'bg-violet-50 dark:bg-violet-900/20' },
      { key: 'longTermVision', label: 'The 10-Year Vision', placeholder: 'e.g., Leading a technical team in AI...', icon: '🔭', className: 'md:col-span-2', textColor: 'text-fuchsia-600 dark:text-fuchsia-300', bgColor: 'bg-fuchsia-50 dark:bg-fuchsia-900/20' },
      { key: 'skillsToMaster', label: 'Skill Stack To Master', placeholder: 'e.g., TypeScript, Golang, DevOps...', icon: '🧠', textColor: 'text-pink-500 dark:text-pink-300', bgColor: 'bg-pink-50 dark:bg-pink-900/20' },
      { key: 'roleModels', label: 'Council of Role Models', placeholder: 'e.g., Naval Ravikant, Steve Jobs...', icon: '🌟', textColor: 'text-yellow-600 dark:text-yellow-300', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20' },
      { key: 'dreamLifestyle', label: 'Dream Lifestyle Design', placeholder: 'e.g., Remote work with total freedom...', icon: '🏝️', className: 'md:col-span-2', textColor: 'text-teal-600 dark:text-teal-300', bgColor: 'bg-teal-50 dark:bg-teal-900/20' },
      { key: 'futureSelfMessage', label: 'Note to Future Self', placeholder: 'e.g., Remember why you started...', icon: '💌', className: 'md:col-span-2', textColor: 'text-rose-500 dark:text-rose-300', bgColor: 'bg-rose-50 dark:bg-rose-900/20' },
    ];

    const handleSave = () => {
      setAboutMeData(tempAboutMe);
      setIsEditingAboutMe(false);
      playSound(SOUNDS.SUCCESS);
    };
    const handleCancel = () => {
      setTempAboutMe(aboutMeData);
      setIsEditingAboutMe(false);
      playSound(SOUNDS.CLICK);
    };
    const startEditing = () => {
      setTempAboutMe(aboutMeData);
      setIsEditingAboutMe(true);
      playSound(SOUNDS.CLICK);
    };

    return (
      <div className="space-y-8 animate-in slide-in-from-right-6 duration-700 pb-10">
        <h2 className="text-3xl font-serif font-bold text-rose-900 dark:text-rose-100">Legacy & Vision</h2>
        
        {/* Enhanced Profile Card */}
        <div className="relative bg-[#1e1b4b] rounded-[3rem] p-8 md:p-10 text-white shadow-2xl overflow-hidden group">
           {/* Background Elements */}
           <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/20 blur-[100px] rounded-full -mr-20 -mt-20 group-hover:bg-rose-500/30 transition-all duration-1000"></div>
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full -ml-10 -mb-10 group-hover:bg-indigo-500/30 transition-all duration-1000"></div>
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
           
           <div className="relative z-10">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-8">
                 <div className="relative">
                    <div className="w-28 h-28 bg-gradient-to-br from-rose-400 to-indigo-600 rounded-3xl flex items-center justify-center text-5xl shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500 border-4 border-white/10 overflow-hidden">
                        {settings.profilePicture ? (
                            <img src={settings.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <span className="drop-shadow-md">👤</span>
                        )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-white text-indigo-900 text-xs font-black px-3 py-1 rounded-full shadow-lg">
                        LVL {Object.values(aboutMeData).filter(v => v).length}
                    </div>
                 </div>
                 <div className="text-center md:text-left flex-1">
                    <h4 className="text-4xl md:text-5xl font-serif font-bold mb-2 tracking-tight">{settings.userName}</h4>
                    <p className="text-[10px] uppercase font-black text-indigo-200 tracking-[0.4em] mb-4">Master Profile • Architect of Future</p>
                    <div className="h-1 w-20 bg-gradient-to-r from-rose-400 to-transparent mx-auto md:mx-0 rounded-full"></div>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="flex gap-4 items-center bg-white/5 backdrop-blur-md p-5 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl">🏫</div>
                    <div>
                       <p className="text-[9px] font-black text-indigo-200/60 uppercase tracking-widest mb-1">Alma Mater</p>
                       <p className="text-sm font-bold text-white leading-tight">{settings.schoolName || "Not set"}</p>
                    </div>
                 </div>
                 <div className="flex gap-4 items-center bg-white/5 backdrop-blur-md p-5 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl">🎓</div>
                    <div>
                       <p className="text-[9px] font-black text-rose-200/60 uppercase tracking-widest mb-1">Academic Path</p>
                       <p className="text-sm font-bold text-white leading-tight">{settings.collegeName || "Not set"}</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Action Header */}
        <div className="flex justify-between items-center px-2 pt-2 sticky top-20 z-10 bg-[#fefcfb]/80 dark:bg-slate-950/80 backdrop-blur-xl py-4 -mx-2 md:mx-0 rounded-2xl">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-300">⚡</div>
                <h3 className="font-black text-slate-800 dark:text-slate-200 text-xs uppercase tracking-[0.3em]">Identity Matrix</h3>
            </div>
            
            {!isEditingAboutMe ? (
                <button 
                    onClick={startEditing} 
                    className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-2xl shadow-sm hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-800 transition-all active:scale-95 flex items-center gap-2"
                >
                    <span>Edit Profile</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" className="group-hover:translate-x-1 transition-transform"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
            ) : (
                <div className="flex gap-3 animate-in fade-in slide-in-from-right-4">
                    <button onClick={handleCancel} className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Discard</button>
                    <button onClick={handleSave} className="px-6 py-3 rounded-2xl bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-200 dark:shadow-none hover:bg-rose-700 active:scale-95 transition-all">Save Changes</button>
                </div>
            )}
        </div>

        {/* Masonry Grid for Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map(f => (
            <div 
                key={f.key} 
                className={`bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 dark:border-slate-800 transition-all duration-300 ${f.className || ''} ${isEditingAboutMe ? 'ring-2 ring-indigo-50 dark:ring-indigo-900/30 scale-[1.01]' : 'hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1'}`}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${f.bgColor} ${f.textColor}`}>
                    {f.icon}
                </div>
                <label className={`text-[10px] font-black uppercase tracking-[0.2em] ${f.textColor}`}>
                  {f.label}
                </label>
              </div>

              {isEditingAboutMe ? (
                <textarea 
                  value={tempAboutMe[f.key]} 
                  onChange={e => setTempAboutMe({ ...tempAboutMe, [f.key]: e.target.value })} 
                  placeholder={f.placeholder}
                  className="w-full bg-slate-50 dark:bg-slate-800 p-6 rounded-3xl text-sm font-medium border-2 border-transparent focus:border-indigo-100 dark:focus:border-indigo-900 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all min-h-[140px] resize-none custom-scrollbar leading-relaxed placeholder:text-slate-300 dark:placeholder:text-slate-600 dark:text-slate-200"
                  autoFocus={f.key === 'goals'}
                />
              ) : (
                <div className={`relative min-h-[80px] p-6 rounded-[2rem] bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100/50 dark:border-slate-700/50`}>
                    {/* Decorative quote icon */}
                    <span className="absolute top-4 left-4 text-4xl text-slate-200 dark:text-slate-700 opacity-30 font-serif leading-none">“</span>
                    
                    <p className={`relative z-10 text-sm leading-relaxed whitespace-pre-wrap ${aboutMeData[f.key] ? 'text-slate-700 dark:text-slate-200 font-medium' : 'text-slate-400 italic'}`}>
                        {aboutMeData[f.key] || "Drafting in progress..."}
                    </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
};
