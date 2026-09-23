
import React from 'react';
import { Card, SectionTitle } from '../components/Shared';
import { DailyLog, AppSettings } from '../types';
import { calculateLogPoints } from '../helpers';
import { SOUNDS } from '../utils';

interface ReviewViewProps {
  reportStartDate: string;
  setReportStartDate: (date: string) => void;
  reportEndDate: string;
  setReportEndDate: (date: string) => void;
  todayStr: string;
  playSound: (url: string) => void;
  reportStats: any;
  currentLog: DailyLog;
  updateLog: (updates: Partial<DailyLog>) => void;
  filteredLogsForReport: DailyLog[];
  exportData: (format: 'csv' | 'json') => void;
  handlePrintReport: () => void;
  settings: AppSettings;
  logs: DailyLog[];
}

export const ReviewView: React.FC<ReviewViewProps> = ({ 
  reportStartDate, setReportStartDate, reportEndDate, setReportEndDate, todayStr, playSound, reportStats, currentLog, updateLog, filteredLogsForReport, exportData, handlePrintReport, settings, logs
}) => {
    return (
      <div className="space-y-8 animate-in slide-in-from-right-6 duration-700 pb-10 overflow-x-hidden">
        <h2 className="text-3xl font-serif font-bold text-rose-900 dark:text-rose-100 no-print">Reports & Export</h2>
        
        <Card className="bg-gradient-to-br from-white to-rose-50/30 dark:from-slate-900 dark:to-rose-900/10 border-none shadow-xl p-8 no-print">
          <SectionTitle title="Select Report Period" icon="🗓️" />
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
            <div>
              <label className="block text-[10px] uppercase font-black text-slate-300 mb-2 tracking-widest pl-1">Start Date</label>
              <input type="date" max={todayStr} value={reportStartDate} onChange={e => { playSound(SOUNDS.CLICK); setReportStartDate(e.target.value); }} className="w-full bg-white dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-700 p-4 rounded-2xl text-xs font-black text-rose-900 dark:text-rose-200 focus:ring-2 focus:ring-rose-100 outline-none" />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-black text-slate-300 mb-2 tracking-widest pl-1">End Date</label>
              <input type="date" max={todayStr} value={reportEndDate} onChange={e => { playSound(SOUNDS.CLICK); setReportEndDate(e.target.value); }} className="w-full bg-white dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-700 p-4 rounded-2xl text-xs font-black text-rose-900 dark:text-rose-200 focus:ring-2 focus:ring-rose-100 outline-none" />
            </div>
          </div>
        </Card>

        {reportStats ? (
          <div className="space-y-6 no-print">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-indigo-600 rounded-[2rem] p-5 sm:p-8 text-white shadow-xl">
                <span className="text-[10px] uppercase font-black opacity-50 tracking-widest block mb-1">Work Volume</span>
                <p className="text-4xl font-serif font-bold">{reportStats.totalStudyHrs}<span className="text-lg opacity-60 ml-1">h</span></p>
              </div>
              <div className="bg-rose-600 rounded-[2rem] p-5 sm:p-8 text-white shadow-xl">
                <span className="text-[10px] uppercase font-black opacity-50 tracking-widest block mb-1">Key Wins</span>
                <p className="text-4xl font-serif font-bold">{reportStats.achievementsCount}</p>
              </div>
            </div>

            <Card className="p-8">
              <h4 className="font-black text-rose-900 dark:text-rose-200 mb-8 text-[10px] uppercase tracking-[0.3em] text-center opacity-40">Period Averages</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
                 <div className="text-center group"><span className="block text-[9px] uppercase font-bold text-gray-400 group-hover:text-rose-500 transition-colors">Sleep</span><p className="text-2xl font-black text-slate-700 dark:text-slate-200">{reportStats.avgSleep}h</p></div>
                 <div className="text-center group"><span className="block text-[9px] uppercase font-bold text-gray-400 group-hover:text-sky-500 transition-colors">Water</span><p className="text-2xl font-black text-slate-700 dark:text-slate-200">{reportStats.avgWater}L</p></div>
                 <div className="text-center group"><span className="block text-[9px] uppercase font-bold text-gray-400 group-hover:text-amber-500 transition-colors">Mood</span><p className="text-2xl font-black text-slate-700 dark:text-slate-200">{reportStats.avgMood}</p></div>
                 <div className="text-center group"><span className="block text-[9px] uppercase font-bold text-gray-400 group-hover:text-emerald-500 transition-colors">Workouts</span><p className="text-2xl font-black text-slate-700 dark:text-slate-200">{reportStats.totalExerciseWorkouts}</p></div>
              </div>
            </Card>

            <Card className="p-8">
              <SectionTitle title="Periodic Reflection" icon="💭" />
              <textarea value={currentLog.weeklyReflection} onChange={e => updateLog({ weeklyReflection: e.target.value })} placeholder="Any patterns or takeaways from this period?..." className="w-full bg-slate-50 dark:bg-slate-800 p-6 rounded-3xl text-sm font-medium h-40 border-2 border-transparent focus:border-indigo-100 dark:focus:border-indigo-900 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all resize-none custom-scrollbar dark:text-slate-200" />
            </Card>

            <div className="space-y-4">
                <SectionTitle title="Daily Summaries in Range" icon="📅" />
                {filteredLogsForReport.length === 0 ? (
                   <p className="text-slate-400 text-sm italic">No logs found in this range.</p>
                ) : (
                   <div className="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                     {filteredLogsForReport.map(log => (
                       <div key={log.date} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                         <div className="flex justify-between items-center mb-3">
                           <h5 className="font-bold text-rose-900 dark:text-rose-200">{log.date}</h5>
                           <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500 dark:text-slate-400">Score: {calculateLogPoints(log, settings, logs)}</span>
                         </div>
                         <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{log.autoSummary || "No summary available."}</p>
                         {log.journal && (
                            <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                                <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest block mb-1">Journal Excerpt</span>
                                <p className="text-xs text-slate-500 dark:text-slate-400 italic">"{log.journal}"</p>
                            </div>
                         )}
                       </div>
                     ))}
                   </div>
                )}
            </div>
          </div>
        ) : (
          <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-rose-100 dark:border-rose-900 text-gray-300 italic text-sm no-print">
            Choose a range with logs to see your stats.
          </div>
        )}

        {/* Detailed Print Table Section */}
        <div className="hidden print:block space-y-8">
            <div className="text-center border-b-2 border-slate-900 pb-8">
                <h1 className="text-4xl font-serif font-bold text-slate-900 uppercase tracking-tight">{settings.userName}'s Report</h1>
                <p className="text-sm text-slate-500 font-medium mt-2">Comprehensive Performance Audit: <span className="text-slate-900">{reportStartDate}</span> to <span className="text-slate-900">{reportEndDate}</span></p>
            </div>

            {reportStats && (
                <div className="grid grid-cols-4 gap-4 border border-slate-200 p-4 rounded-lg bg-slate-50">
                    <div className="text-center">
                        <span className="block text-[9px] font-bold uppercase text-slate-400">Avg Life Score</span>
                        <span className="text-xl font-black text-slate-800">{ (filteredLogsForReport.reduce((a, l) => a + calculateLogPoints(l, settings, logs), 0) / filteredLogsForReport.length).toFixed(0) }</span>
                    </div>
                    <div className="text-center">
                        <span className="block text-[9px] font-bold uppercase text-slate-400">Total Focus</span>
                        <span className="text-xl font-black text-slate-800">{reportStats.totalStudyHrs}h</span>
                    </div>
                    <div className="text-center">
                        <span className="block text-[9px] font-bold uppercase text-slate-400">Avg Sleep</span>
                        <span className="text-xl font-black text-slate-800">{reportStats.avgSleep}h</span>
                    </div>
                    <div className="text-center">
                        <span className="block text-[9px] font-bold uppercase text-slate-400">Avg Mood</span>
                        <span className="text-xl font-black text-slate-800">{reportStats.avgMood}/10</span>
                    </div>
                </div>
            )}

            <div className="mt-8">
                <table className="w-full text-left border-collapse table-auto">
                    <thead>
                        <tr className="border-b-2 border-slate-800">
                            <th className="py-2 text-[9px] font-black uppercase text-slate-600">Date</th>
                            <th className="py-2 text-[9px] font-black uppercase text-slate-600">Score</th>
                            <th className="py-2 text-[9px] font-black uppercase text-slate-600">Routine</th>
                            <th className="py-2 text-[9px] font-black uppercase text-slate-600">Habits/Pillars</th>
                            <th className="py-2 text-[9px] font-black uppercase text-slate-600">Notes/Achievement</th>
                        </tr>
                    </thead>
                    <tbody className="text-[10px] text-slate-700 align-top">
                        {filteredLogsForReport.map((l, i) => {
                            const water = l.waterEntries.reduce((a,c)=>a+c.amount,0);
                            const study = (l.studySessions.reduce((a,c)=>a+c.duration,0) / 60).toFixed(1);
                            const sleep = (l.sleepHours + l.sleepMinutes/60).toFixed(1);
                            const exercise = (l.exerciseEntries.reduce((a,c)=>a+c.duration,0) / 60).toFixed(1);
                            
                            const habits = settings.habits.filter(h => l.completedHabits?.includes(h.id)).map(h => h.name).join(', ');
                            const pillarsCount = Object.values(l.happinessPillars || {}).filter(v => v).length;
                            
                            return (
                                <tr key={i} className="border-b border-slate-200">
                                    <td className="py-3 font-bold whitespace-nowrap">{l.date}</td>
                                    <td className="py-3 font-black text-indigo-700">{calculateLogPoints(l, settings, logs)}</td>
                                    <td className="py-3 space-y-1">
                                        <div className="flex gap-2"><span>💧 {water}L</span> <span>📚 {study}h</span></div>
                                        <div className="flex gap-2"><span>🌙 {sleep}h</span> <span>🏃 {exercise}h</span></div>
                                        <div className="flex gap-2"><span>🙂 {l.mood}/10</span> <span>☮️ {l.peaceLevel}/10</span></div>
                                    </td>
                                    <td className="py-3 max-w-[150px]">
                                        <p className="font-bold mb-1">Habits: {habits || '-'}</p>
                                        <p>Pillars Active: {pillarsCount}</p>
                                        <p>Goals: {l.goalsCompleted}%</p>
                                    </td>
                                    <td className="py-3 max-w-[200px]">
                                        {l.achievement && <p className="mb-1 font-bold text-emerald-700">🏆 {l.achievement}</p>}
                                        {l.journal && <p className="italic text-slate-500 line-clamp-3">"{l.journal}"</p>}
                                        {l.gratitude && <p className="text-slate-500 mt-1">🙏 {l.gratitude}</p>}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            
            <div className="pt-8 text-center text-[10px] text-slate-400">
                Generated via Hakam — Daily Life Tracker
            </div>
        </div>

        <div className="grid grid-cols-1 gap-4 no-print pb-10">
          <button 
            disabled={filteredLogsForReport.length === 0}
            onClick={() => { playSound(SOUNDS.CLICK); handlePrintReport(); }} 
            className="bg-rose-500 text-white font-black py-6 rounded-[2rem] shadow-2xl shadow-rose-200 dark:shadow-rose-900/40 flex items-center justify-center gap-3 disabled:opacity-50 hover:bg-rose-600 transition-all hover:scale-[1.02] active:scale-95 text-xs uppercase tracking-widest"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zM17 9V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h8z" /></svg>
            Print / Download PDF Report
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button 
              disabled={filteredLogsForReport.length === 0}
              onClick={() => exportData('csv')} 
              className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 font-black py-5 rounded-[1.75rem] shadow-md border border-indigo-100 dark:border-indigo-800 disabled:opacity-50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all uppercase text-[10px] tracking-widest"
            >
              Export CSV
            </button>
            <button 
              disabled={filteredLogsForReport.length === 0}
              onClick={() => exportData('json')} 
              className="bg-slate-800 text-white font-black py-5 rounded-[1.75rem] shadow-md disabled:opacity-50 hover:bg-slate-900 transition-all uppercase text-[10px] tracking-widest"
            >
              Export JSON
            </button>
          </div>
        </div>
      </div>
    );
};
