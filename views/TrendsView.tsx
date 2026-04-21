
import React, { useState, useMemo } from 'react';
import { Card, SectionTitle, SubLabel } from '../components/Shared';
import { MonthlyActivityChart } from '../components/Chart';
import { DailyLog, AppSettings } from '../types';
import { TRACKER_FIELDS } from '../constants';
import { SOUNDS } from '../utils';
import { calculateLogPoints } from '../helpers';

interface TrendsViewProps {
  logs: DailyLog[];
  trendStartDate: string;
  setTrendStartDate: (date: string) => void;
  trendEndDate: string;
  setTrendEndDate: (date: string) => void;
  calculateCorrelation: (x: number[], y: number[]) => number | null;
  getInterpretation: (r: number) => string;
  playSound: (url: string) => void;
  todayStr: string;
  settings: AppSettings;
}

export const TrendsView: React.FC<TrendsViewProps> = ({ 
  logs, trendStartDate, setTrendStartDate, trendEndDate, setTrendEndDate, calculateCorrelation, getInterpretation, playSound, todayStr, settings
}) => {
    const [selectedMetric, setSelectedMetric] = useState('study');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Inspector State
    const [inspectorMetricA, setInspectorMetricA] = useState('study');
    const [inspectorMetricB, setInspectorMetricB] = useState('mood');

    // Metrics for Chart Dropdown
    const chartMetrics = [
      { key: 'study', label: 'Study Hours', icon: '📚', color: 'bg-indigo-600' },
      { key: 'sleep', label: 'Sleep Hours', icon: '🌙', color: 'bg-rose-500' },
      { key: 'bedtime', label: 'Bedtime', icon: '🛌', color: 'bg-slate-700' },
      { key: 'wakeup', label: 'Wake Up Time', icon: '⏰', color: 'bg-orange-500' },
      { key: 'screen', label: 'Screen Time', icon: '📱', color: 'bg-amber-500' },
      { key: 'mood', label: 'Daily Mood', icon: '✨', color: 'bg-yellow-500' },
      { key: 'water', label: 'Water Intake', icon: '💧', color: 'bg-sky-500' },
      { key: 'peace', label: 'Peace Level', icon: '🕊️', color: 'bg-emerald-500' },
    ];
    const activeChartMetric = chartMetrics.find(m => m.key === selectedMetric) || chartMetrics[0];

    // --- Correlation Data Preparation ---
    const matrixMetrics = [
        { id: 'score', label: 'Life Score', icon: '🏆' },
        { id: 'mood', label: 'Mood', icon: '🙂' },
        { id: 'peace', label: 'Peace Level', icon: '🕊️' },
        { id: 'energy', label: 'Avg Energy', icon: '⚡' },
        { id: 'sleep', label: 'Sleep Hours', icon: '🌙' },
        { id: 'study', label: 'Study Hours', icon: '📚' },
        { id: 'screen', label: 'Screen Time', icon: '📱' },
        { id: 'water', label: 'Water Intake', icon: '💧' },
        { id: 'exercise', label: 'Exercise', icon: '🏃' },
        { id: 'junk', label: 'Junk Food', icon: '🍕' },
        { id: 'pillars', label: 'Active Pillars', icon: '🏛️' },
        { id: 'goals', label: 'Goals %', icon: '🎯' },
    ];

    const processedData = useMemo(() => {
        // Filter logs by date range first
        const relevantLogs = logs.filter(l => l.date >= trendStartDate && l.date <= trendEndDate);
        
        if (relevantLogs.length < 5) return null; // Need minimum data points

        // Extract vectors with safe fallbacks
        const vectors: Record<string, number[]> = {};
        
        vectors['score'] = relevantLogs.map(l => calculateLogPoints(l, settings, logs));
        vectors['mood'] = relevantLogs.map(l => l.mood || 0);
        vectors['peace'] = relevantLogs.map(l => l.peaceLevel || 0);
        vectors['energy'] = relevantLogs.map(l => {
             const e = l.energyLevels || { morning: 0, afternoon: 0, evening: 0, night: 0 };
             const levels = [e.morning, e.afternoon, e.evening, e.night].filter(v => (v || 0) > 0);
             return levels.length ? levels.reduce((a,b)=>a+b,0)/levels.length : 0;
        });
        vectors['sleep'] = relevantLogs.map(l => (l.sleepHours || 0) + (l.sleepMinutes || 0)/60);
        vectors['study'] = relevantLogs.map(l => (l.studySessions || []).reduce((a,c)=>a+c.duration,0)/60);
        vectors['screen'] = relevantLogs.map(l => (l.screenTimeHours || 0) + (l.screenTimeMinutes || 0)/60);
        vectors['water'] = relevantLogs.map(l => (l.waterEntries || []).reduce((a,c)=>a+c.amount,0));
        vectors['exercise'] = relevantLogs.map(l => (l.exerciseEntries || []).reduce((a,c)=>a+c.duration,0));
        vectors['junk'] = relevantLogs.map(l => l.junkFood || 0);
        vectors['pillars'] = relevantLogs.map(l => Object.values(l.happinessPillars || {}).filter(Boolean).length);
        vectors['goals'] = relevantLogs.map(l => l.goalsCompleted || 0);

        return { vectors, relevantLogs };
    }, [logs, trendStartDate, trendEndDate, settings]);

    const correlationMatrix = useMemo(() => {
        if (!processedData) return null;
        const { vectors } = processedData;

        // Compute Matrix
        const matrix: { x: string; y: string; r: number }[] = [];
        
        for (let i = 0; i < matrixMetrics.length; i++) {
            for (let j = 0; j < matrixMetrics.length; j++) {
                const metricA = matrixMetrics[i].id;
                const metricB = matrixMetrics[j].id;
                
                // Don't calculate if same metric (always 1)
                if (metricA === metricB) {
                     matrix.push({ x: metricA, y: metricB, r: 1 });
                     continue;
                }
                
                // Calculate r
                const r = calculateCorrelation(vectors[metricA], vectors[metricB]);
                matrix.push({ x: metricA, y: metricB, r: r !== null ? r : 0 });
            }
        }
        return matrix;
    }, [processedData, calculateCorrelation]);

    const inspectorStats = useMemo(() => {
        if (!processedData || !inspectorMetricA || !inspectorMetricB) return null;
        
        const vecA = processedData.vectors[inspectorMetricA];
        const vecB = processedData.vectors[inspectorMetricB];
        const r = calculateCorrelation(vecA, vecB);
        
        if (r === null) return null;

        // Prepare points for Scatter Plot
        const dataPoints = vecA.map((valA, i) => ({ x: valA, y: vecB[i] }));
        
        // Min/Max for scaling
        const minA = Math.min(...vecA);
        const maxA = Math.max(...vecA);
        const minB = Math.min(...vecB);
        const maxB = Math.max(...vecB);

        return { r, dataPoints, minA, maxA, minB, maxB };
    }, [processedData, inspectorMetricA, inspectorMetricB, calculateCorrelation]);

    const getCellColor = (r: number) => {
        if (r === 1) return 'bg-slate-100 dark:bg-slate-800 text-slate-300'; // Self-correlation
        
        // Strong Positive (Green/Blue)
        if (r > 0.7) return 'bg-emerald-500 text-white font-black';
        if (r > 0.4) return 'bg-emerald-300 text-emerald-900 font-bold';
        if (r > 0.2) return 'bg-emerald-100 text-emerald-800';

        // Strong Negative (Red)
        if (r < -0.7) return 'bg-rose-500 text-white font-black';
        if (r < -0.4) return 'bg-rose-300 text-rose-900 font-bold';
        if (r < -0.2) return 'bg-rose-100 text-rose-800';

        return 'bg-white dark:bg-slate-900 text-slate-300';
    };

    return (
      <div className="space-y-8 animate-in fade-in duration-700 pb-10 overflow-x-hidden">
        <h2 className="text-3xl font-serif font-bold text-rose-900 dark:text-rose-100">Personal Insights</h2>
        
        <Card className="p-8 overflow-visible">
          <SectionTitle title="Metric Analysis" icon="📈" />
          <SubLabel text="Deep dive into specific areas of your life to spot trends and consistency." />
          
          <div className="relative mb-8 z-20">
              <button 
                  onClick={() => { playSound(SOUNDS.CLICK); setIsDropdownOpen(!isDropdownOpen); }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 hover:border-indigo-100 dark:hover:border-indigo-900 p-4 rounded-2xl flex items-center justify-between transition-all group"
              >
                  <div className="flex items-center gap-3">
                       <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest mr-2">Showing Graph For:</span>
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-md ${activeChartMetric.color}`}>
                          <span className="text-sm">{activeChartMetric.icon}</span>
                       </div>
                       <span className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide text-xs">{activeChartMetric.label}</span>
                  </div>
                  <svg className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-indigo-500' : 'group-hover:text-indigo-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
              </button>

              {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200 z-30">
                      <div className="max-h-60 overflow-y-auto custom-scrollbar p-2">
                        {chartMetrics.map(m => (
                            <button
                                key={m.key}
                                onClick={() => {
                                    playSound(SOUNDS.CLICK);
                                    setSelectedMetric(m.key);
                                    setIsDropdownOpen(false);
                                }}
                                className={`w-full p-3 rounded-2xl flex items-center gap-3 transition-colors text-left mb-1 ${selectedMetric === m.key ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${m.color}`}>
                                   <span className="text-sm">{m.icon}</span>
                                </div>
                                <span className={`text-xs font-bold uppercase tracking-widest flex-1 ${selectedMetric === m.key ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-500 dark:text-slate-400'}`}>
                                    {m.label}
                                </span>
                                {selectedMetric === m.key && (
                                     <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                                     </div>
                                )}
                            </button>
                        ))}
                      </div>
                  </div>
              )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 relative z-10">
            <div>
              <label className="block text-[10px] uppercase font-black text-slate-300 mb-2 tracking-widest pl-1">Start Date</label>
              <input type="date" max={todayStr} value={trendStartDate} onChange={e => { playSound(SOUNDS.CLICK); setTrendStartDate(e.target.value); }} className="w-full bg-slate-50 dark:bg-slate-800 border-none p-3 rounded-xl text-[11px] font-black text-rose-900 dark:text-rose-200 outline-none" />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-black text-slate-300 mb-2 tracking-widest pl-1">End Date</label>
              <input type="date" max={todayStr} value={trendEndDate} onChange={e => { playSound(SOUNDS.CLICK); setTrendEndDate(e.target.value); }} className="w-full bg-slate-50 dark:bg-slate-800 border-none p-3 rounded-xl text-[11px] font-black text-rose-900 dark:text-rose-200 outline-none" />
            </div>
          </div>
          
          <MonthlyActivityChart logs={logs} range={[trendStartDate, trendEndDate]} metric={selectedMetric} />
        </Card>

        {/* Pairwise Inspector */}
        <Card className="p-8">
            <SectionTitle title="Pairwise Correlation Inspector" icon="🔎" />
            <SubLabel text="Select any two metrics to visualize their direct relationship. Useful for answering questions like: 'Does sleeping more make me happier?'" />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Variable A (X-Axis)</label>
                    <select 
                        value={inspectorMetricA} 
                        onChange={e => setInspectorMetricA(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none border-r-8 border-transparent focus:border-indigo-500"
                    >
                        {matrixMetrics.map(m => (
                            <option key={m.id} value={m.id}>{m.icon} {m.label}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Variable B (Y-Axis)</label>
                    <select 
                        value={inspectorMetricB} 
                        onChange={e => setInspectorMetricB(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none border-r-8 border-transparent focus:border-rose-500"
                    >
                        {matrixMetrics.map(m => (
                            <option key={m.id} value={m.id}>{m.icon} {m.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {inspectorStats ? (
                <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className={`p-6 rounded-3xl mb-6 text-center ${inspectorStats.r > 0 ? 'bg-emerald-50 dark:bg-emerald-900/10' : 'bg-rose-50 dark:bg-rose-900/10'}`}>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-2">Correlation Coefficient</p>
                        <h4 className={`text-5xl font-serif font-bold ${inspectorStats.r > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {inspectorStats.r > 0 ? '+' : ''}{inspectorStats.r.toFixed(3)}
                        </h4>
                        <p className="text-xs font-bold mt-2 text-slate-600 dark:text-slate-300">
                            {getInterpretation(inspectorStats.r)}
                        </p>
                    </div>

                    {/* Scatter Plot */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 relative h-64">
                        {inspectorStats.dataPoints.map((pt, i) => {
                            // Normalize coordinates to 0-100%
                            const rangeA = inspectorStats.maxA - inspectorStats.minA || 1;
                            const rangeB = inspectorStats.maxB - inspectorStats.minB || 1;
                            
                            const x = ((pt.x - inspectorStats.minA) / rangeA) * 90 + 5; // 5% padding
                            const y = 100 - (((pt.y - inspectorStats.minB) / rangeB) * 90 + 5); // Invert Y

                            return (
                                <div 
                                    key={i}
                                    className="absolute w-3 h-3 rounded-full bg-indigo-500/60 dark:bg-indigo-400/60 border border-indigo-600 dark:border-indigo-300 hover:scale-150 transition-transform cursor-crosshair"
                                    style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                                    title={`X: ${pt.x}, Y: ${pt.y}`}
                                />
                            );
                        })}
                        {/* Axis Labels */}
                        <div className="absolute bottom-2 right-4 text-[9px] font-black text-slate-400 uppercase">{matrixMetrics.find(m=>m.id===inspectorMetricA)?.label} →</div>
                        <div className="absolute top-4 left-2 text-[9px] font-black text-slate-400 uppercase rotate-90 origin-left">↑ {matrixMetrics.find(m=>m.id===inspectorMetricB)?.label}</div>
                    </div>
                </div>
            ) : (
                <div className="p-12 text-center mt-6">
                    <p className="text-slate-400 text-sm italic">Not enough data points in selected range to correlate.</p>
                </div>
            )}
        </Card>

        {/* Existing Correlation Matrix */}
        <Card className="p-8">
            <SectionTitle title="Full Correlation Matrix" icon="🔬" />
            <SubLabel text="Overview of all connections. Discover hidden relationships across your entire life system." />
            
            {!correlationMatrix ? (
                <div className="p-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                    <p className="text-slate-400 text-sm italic">Need at least 5 days of data in this range to calculate complex correlations.</p>
                </div>
            ) : (
                <div className="overflow-x-auto custom-scrollbar pb-4 mt-6">
                    <div className="min-w-[600px]">
                        {/* Header Row */}
                        <div className="flex mb-1">
                            <div className="w-20 shrink-0"></div> {/* Empty corner */}
                            {matrixMetrics.map(m => (
                                <div key={m.id} className="w-12 flex items-center justify-center text-xl shrink-0" title={m.label}>
                                    {m.icon}
                                </div>
                            ))}
                        </div>
                        
                        {/* Rows */}
                        {matrixMetrics.map(rowMetric => (
                            <div key={rowMetric.id} className="flex mb-1">
                                {/* Row Header */}
                                <div className="w-20 shrink-0 flex items-center gap-2 pr-2 justify-end">
                                    <span className="text-[9px] font-bold uppercase text-slate-500 dark:text-slate-400 truncate">{rowMetric.label}</span>
                                    <span className="text-sm">{rowMetric.icon}</span>
                                </div>
                                
                                {/* Cells */}
                                {matrixMetrics.map(colMetric => {
                                    const cell = correlationMatrix.find(c => c.x === colMetric.id && c.y === rowMetric.id);
                                    const r = cell ? cell.r : 0;
                                    
                                    return (
                                        <div 
                                            key={`${rowMetric.id}-${colMetric.id}`}
                                            onClick={() => {
                                                // Quick jump to inspector
                                                setInspectorMetricA(colMetric.id);
                                                setInspectorMetricB(rowMetric.id);
                                                window.scrollTo({ top: 400, behavior: 'smooth' }); // Rough scroll to inspector
                                            }}
                                            className={`w-12 h-10 flex items-center justify-center text-[10px] shrink-0 rounded-md mx-[1px] transition-transform hover:scale-110 cursor-pointer ${getCellColor(r)}`}
                                            title={`Click to Inspect: ${rowMetric.label} vs ${colMetric.label} (${r.toFixed(3)})`}
                                        >
                                            {r !== 1 ? r.toFixed(1).replace('0.', '.') : ''}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {correlationMatrix && (
                <div className="flex justify-center gap-4 mt-6">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Positive Correlation</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Negative Correlation</span>
                    </div>
                </div>
            )}
        </Card>
      </div>
    );
};
