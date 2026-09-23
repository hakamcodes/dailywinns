
import React, { useState, useEffect } from 'react';
import { TRACKER_FIELDS } from '../constants';

// --- Floating Point Animation Components ---

export interface FloatingPoint {
  id: number;
  x: number;
  y: number;
  value: string;
  isNegative: boolean;
}

export const FloatingPointItem: React.FC<{ item: FloatingPoint; onComplete: (id: number) => void }> = ({ item, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => onComplete(item.id), 1000);
    return () => clearTimeout(timer);
  }, [item.id, onComplete]);

  return (
    <div
      className={`fixed pointer-events-none z-[100] font-black text-lg animate-float-up-fade ${item.isNegative ? 'text-rose-500' : 'text-emerald-500'}`}
      style={{ left: item.x, top: item.y }}
    >
      {item.value}
    </div>
  );
};

// --- UI Components ---

export const Card: React.FC<{ children: React.ReactNode; className?: string; variant?: 'default' | 'accent' | 'subtle' }> = ({ children, className = "", variant = 'default' }) => {
  const baseStyles = "rounded-3xl transition-all duration-300";
  const variants = {
    default: "bg-white dark:bg-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-rose-50/50 dark:border-slate-800 p-4 sm:p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]",
    accent: "bg-gradient-to-br from-rose-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 border border-white dark:border-slate-700 shadow-sm p-6",
    subtle: "bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 p-4"
  };
  
  return (
    <div className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode }> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300 no-print">
      <div className="bg-white dark:bg-slate-950 dark:border dark:border-slate-800 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-4 sm:px-8 py-4 sm:py-6 border-b dark:border-slate-800 flex justify-between items-center bg-rose-50/20 dark:bg-slate-900/50 shrink-0">
          <h3 className="font-bold text-rose-900 dark:text-rose-100 text-base sm:text-xl font-serif leading-tight">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-rose-100/50 dark:hover:bg-slate-800 rounded-full transition-colors text-rose-800 dark:text-rose-200">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-4 sm:p-8 overflow-y-auto custom-scrollbar flex-1 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950">
          {children}
        </div>
        {footer && <div className="p-6 border-t dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 shrink-0">{footer}</div>}
      </div>
    </div>
  );
};

export const InfoTooltip: React.FC<{ fieldKey: string }> = ({ fieldKey }) => {
  const [isOpen, setIsOpen] = useState(false);
  const field = TRACKER_FIELDS[fieldKey];
  if (!field) return null;

  return (
    <>
      <button 
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-rose-200 hover:text-rose-400 transition-colors p-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={field.label}>
        <div className="space-y-6 text-gray-700 dark:text-slate-300 leading-relaxed">
          <p className="font-medium text-lg text-rose-900 dark:text-rose-100 leading-snug">{field.expandedImportance}</p>
          <div className="bg-rose-50/50 dark:bg-rose-900/20 p-6 rounded-3xl border border-rose-100/50 dark:border-rose-800/30">
            <h4 className="font-bold text-rose-800 dark:text-rose-300 text-xs uppercase tracking-widest mb-3">Quick Tips</h4>
            <ul className="space-y-2">
              {field.quickTips.map((tip, i) => (
                <li key={i} className="flex gap-2 text-sm text-rose-900/80 dark:text-rose-100/80">
                  <span className="text-rose-400">•</span> {tip}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-indigo-50/50 dark:bg-indigo-900/20 p-6 rounded-3xl border border-indigo-100/50 dark:border-indigo-800/30">
            <h4 className="font-bold text-indigo-800 dark:text-indigo-300 text-xs uppercase tracking-widest mb-3">Tiny Challenge</h4>
            <p className="text-indigo-900 dark:text-indigo-100 font-medium mb-4">{field.challenge}</p>
            <button 
              onClick={() => { alert('Challenge accepted! You got this!'); setIsOpen(false); }}
              className="w-full bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 font-bold py-3 rounded-2xl shadow-sm border border-indigo-100 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-all active:scale-95"
            >
              Accept Challenge
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export const SectionTitle: React.FC<{ title: string; fieldKey?: string; icon?: React.ReactNode; streak?: number }> = ({ title, fieldKey, icon, streak }) => (
  <div className="flex justify-between items-center mb-1">
    <div className="flex items-center gap-2">
      {icon && <span className="text-xl">{icon}</span>}
      <h3 className="font-bold text-base tracking-tight text-gray-800 dark:text-slate-200 uppercase">{title}</h3>
      {streak !== undefined && streak > 0 && (
        <span className="flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide shadow-sm">
          🔥 {streak}
        </span>
      )}
    </div>
    {fieldKey && <InfoTooltip fieldKey={fieldKey} />}
  </div>
);

export const SubLabel: React.FC<{ text: string }> = ({ text }) => (
  <p className="text-[11px] font-medium text-gray-400 dark:text-slate-500 mb-4 leading-tight">{text}</p>
);
