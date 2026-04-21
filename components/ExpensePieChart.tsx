
import React, { useEffect, useRef } from 'react';
import { MoneyEntry } from '../types';

export const ExpensePieChart: React.FC<{ entries: MoneyEntry[] }> = ({ entries }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    if (!chartRef.current || typeof window === 'undefined' || !(window as any).Chart) return;

    // Filter only expenses
    const expenses = entries.filter(e => e.type === 'expense');
    
    if (expenses.length === 0) return;

    // Aggregate by category
    const categoryTotals: Record<string, number> = {};
    expenses.forEach(e => {
        const cat = e.category || 'Uncategorized';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + e.amount;
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    // Chart Colors
    const backgroundColors = [
        '#f43f5e', // Rose
        '#6366f1', // Indigo
        '#f59e0b', // Amber
        '#10b981', // Emerald
        '#0ea5e9', // Sky
        '#8b5cf6', // Violet
        '#ec4899', // Pink
        '#64748b'  // Slate
    ];

    if (chartInstance.current) {
        chartInstance.current.destroy();
    }

    // @ts-ignore
    chartInstance.current = new window.Chart(chartRef.current, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 0,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        font: { size: 11, weight: '700' },
                        padding: 20,
                        color: '#94a3b8'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context: any) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.chart._metasets[context.datasetIndex].total;
                            const percentage = ((value / total) * 100).toFixed(1) + "%";
                            return ` ${label}: ₹${value.toLocaleString()} (${percentage})`;
                        }
                    },
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: true
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    });

    return () => {
        if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [entries]);

  if (entries.filter(e => e.type === 'expense').length === 0) {
      return (
          <div className="h-64 flex items-center justify-center text-slate-400 text-xs italic">
              No expense data to visualize.
          </div>
      );
  }

  return (
    <div className="h-72 w-full mt-4">
      <canvas ref={chartRef}></canvas>
    </div>
  );
};
