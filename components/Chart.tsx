
import React, { useEffect, useRef } from 'react';
import { DailyLog } from '../types';

export const MonthlyActivityChart: React.FC<{ logs: DailyLog[]; range?: [string, string]; metric?: string }> = ({ logs, range, metric }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    if (!chartRef.current || typeof window === 'undefined' || !(window as any).Chart) return;

    let filtered = [...logs].sort((a, b) => a.date.localeCompare(b.date));
    if (range) {
      filtered = filtered.filter(l => l.date >= range[0] && l.date <= range[1]);
    } else {
      filtered = filtered.slice(-30);
    }

    if (filtered.length === 0) return;

    const labels = filtered.map(l => {
      const parts = l.date.split('-');
      return `${parts[1]}/${parts[2]}`;
    });

    // Helper to convert HH:MM to decimal hours
    const timeToDecimal = (timeStr: string) => {
      if (!timeStr) return 0;
      const [h, m] = timeStr.split(':').map(Number);
      return h + m / 60;
    };

    // Helper to format decimal to HH:MM
    const decimalToTime = (val: number) => {
        let normalized = val;
        if (normalized >= 24) normalized -= 24;
        const h = Math.floor(normalized);
        const m = Math.round((normalized - h) * 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    let datasets = [];
    let yAxisCallback = (value: any) => value + 'h';
    let yAxisStepSize = undefined;
    let suggestedMax = undefined;
    let suggestedMin = 0;

    if (metric) {
        // Single Metric Mode
        let data: number[] = [];
        let label = '';
        let color = '';
        let bgColor = '';

        switch (metric) {
            case 'study':
                label = 'Study Hours';
                data = filtered.map(l => l.studySessions.reduce((acc, s) => acc + s.duration, 0) / 60);
                color = '#6366f1'; // Indigo
                bgColor = 'rgba(99, 102, 241, 0.1)';
                yAxisCallback = (val) => val + 'h';
                break;
            case 'sleep':
                label = 'Sleep Hours';
                data = filtered.map(l => l.sleepHours + l.sleepMinutes / 60);
                color = '#f43f5e'; // Rose
                bgColor = 'rgba(244, 63, 94, 0.1)';
                yAxisCallback = (val) => val + 'h';
                break;
            case 'bedtime':
                label = 'Bedtime';
                data = filtered.map(l => {
                    let val = timeToDecimal(l.sleepStart);
                    // Adjust: if time is 00:00-12:00, add 24 so graph line doesn't drop to 0 from 23
                    if (val < 12) val += 24; 
                    return val;
                });
                color = '#334155'; // Slate
                bgColor = 'rgba(51, 65, 85, 0.1)';
                yAxisCallback = (val) => decimalToTime(val);
                suggestedMin = 20; // Start around 8 PM
                suggestedMax = 28; // End around 4 AM (24+4)
                break;
            case 'wakeup':
                label = 'Wake Up Time';
                data = filtered.map(l => timeToDecimal(l.sleepEnd));
                color = '#f97316'; // Orange
                bgColor = 'rgba(249, 115, 22, 0.1)';
                yAxisCallback = (val) => decimalToTime(val);
                suggestedMin = 4;
                suggestedMax = 11;
                break;
            case 'screen':
                label = 'Screen Time';
                data = filtered.map(l => l.screenTimeHours + l.screenTimeMinutes / 60);
                color = '#f59e0b'; // Amber
                bgColor = 'rgba(245, 158, 11, 0.1)';
                yAxisCallback = (val) => val + 'h';
                break;
            case 'mood':
                label = 'Mood Score';
                data = filtered.map(l => l.mood);
                color = '#eab308'; // Yellow
                bgColor = 'rgba(234, 179, 8, 0.1)';
                yAxisCallback = (val) => val + '';
                suggestedMax = 10;
                yAxisStepSize = 1;
                break;
            case 'water':
                label = 'Water Intake';
                data = filtered.map(l => l.waterEntries.reduce((a,c) => a + c.amount, 0));
                color = '#0ea5e9'; // Sky
                bgColor = 'rgba(14, 165, 233, 0.1)';
                yAxisCallback = (val) => val + 'L';
                break;
            case 'peace':
                label = 'Peace Level';
                data = filtered.map(l => l.peaceLevel);
                color = '#10b981'; // Emerald
                bgColor = 'rgba(16, 185, 129, 0.1)';
                yAxisCallback = (val) => val + '';
                suggestedMax = 10;
                yAxisStepSize = 1;
                break;
            default:
                break;
        }

        datasets = [{
            label: label,
            data: data,
            borderColor: color,
            backgroundColor: bgColor,
            borderWidth: 3,
            pointRadius: filtered.length > 50 ? 0 : 4,
            pointBackgroundColor: '#fff',
            pointBorderWidth: 2,
            tension: 0.4,
            fill: true,
        }];

    } else {
        // Default Multi-Line Mode (Preserved for compatibility)
        datasets = [
          {
            label: 'Productive Hours',
            data: filtered.map(l => l.studySessions.reduce((acc, s) => acc + s.duration, 0) / 60),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.05)',
            borderWidth: 3,
            pointRadius: filtered.length > 50 ? 0 : 4,
            pointBackgroundColor: '#fff',
            pointBorderWidth: 2,
            tension: 0.4,
            fill: true,
          },
          {
            label: 'Sleep Hours',
            data: filtered.map(l => l.sleepHours + l.sleepMinutes / 60),
            borderColor: '#f43f5e',
            backgroundColor: 'rgba(244, 63, 94, 0.05)',
            borderWidth: 3,
            pointRadius: filtered.length > 50 ? 0 : 4,
            pointBackgroundColor: '#fff',
            pointBorderWidth: 2,
            tension: 0.4,
            fill: true,
          },
          {
            label: 'Screen Time',
            data: filtered.map(l => l.screenTimeHours + l.screenTimeMinutes / 60),
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.05)',
            borderWidth: 3,
            pointRadius: filtered.length > 50 ? 0 : 4,
            pointBackgroundColor: '#fff',
            pointBorderWidth: 2,
            tension: 0.4,
            fill: true,
          }
        ];
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // @ts-ignore
    chartInstance.current = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 1000, easing: 'easeOutQuart' },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              usePointStyle: true,
              boxWidth: 6,
              font: { size: 10, weight: '700' },
              padding: 15
            }
          },
          tooltip: {
             callbacks: {
                 label: function(context: any) {
                     let label = context.dataset.label || '';
                     if (label) {
                         label += ': ';
                     }
                     if (context.parsed.y !== null) {
                         label += yAxisCallback(context.parsed.y);
                     }
                     return label;
                 }
             }
          }
        },
        scales: {
          y: {
            beginAtZero: suggestedMin === undefined, // If suggestedMin is set (bedtime), don't force zero
            min: suggestedMin,
            max: suggestedMax,
            grid: { color: '#f1f5f9', drawBorder: false },
            ticks: { 
                stepSize: yAxisStepSize,
                font: { size: 10, weight: '500' },
                color: '#94a3b8',
                callback: yAxisCallback
            }
          },
          x: {
            grid: { display: false },
            ticks: { 
              font: { size: 9, weight: '500' },
              color: '#94a3b8',
              maxRotation: 45,
              minRotation: 45
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [logs, range, metric]);

  const hasData = range 
    ? logs.some(l => l.date >= range[0] && l.date <= range[1])
    : logs.length > 0;

  if (!hasData) {
    return <div className="h-48 flex flex-col items-center justify-center text-gray-400 text-sm italic bg-slate-50 rounded-3xl border border-dashed border-slate-200">
      No activity data available for this range.
    </div>;
  }

  return (
    <div className="h-64 w-full mt-4 chart-container">
      <canvas ref={chartRef}></canvas>
    </div>
  );
};
