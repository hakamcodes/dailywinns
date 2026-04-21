
import React, { useState } from 'react';
import { Card, SectionTitle, Modal } from '../components/Shared';
import { ExpensePieChart } from '../components/ExpensePieChart';
import { DailyLog, MoneyEntry, AppSettings } from '../types';
import { SOUNDS } from '../utils';

interface MoneyViewProps {
  logs: DailyLog[];
  moneyStartDate: string;
  setMoneyStartDate: (date: string) => void;
  moneyEndDate: string;
  setMoneyEndDate: (date: string) => void;
  totalAvailableBalance: number;
  currentDate: string;
  updateLog: (updates: Partial<DailyLog>) => void;
  isEditable: boolean;
  currentLog: DailyLog;
  playSound: (url: string) => void;
  todayStr: string;
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
}

export const MoneyView: React.FC<MoneyViewProps> = ({ 
  logs, moneyStartDate, setMoneyStartDate, moneyEndDate, setMoneyEndDate, 
  totalAvailableBalance, currentDate, updateLog, isEditable, currentLog, playSound, todayStr, settings, setSettings
}) => {
    const [showChart, setShowChart] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [newCategoryInput, setNewCategoryInput] = useState('');
    
    // Transaction Input State
    const [transDesc, setTransDesc] = useState('');
    const [transAmt, setTransAmt] = useState('');
    const [transCat, setTransCat] = useState((settings.expenseCategories || [])[0] || 'Other expenses');

    // Range Calcs
    const logsInRange = logs.filter(l => l.date >= moneyStartDate && l.date <= moneyEndDate);
    const rangeEntries = logsInRange.flatMap(l => (l.moneyEntries || []).map(e => ({ ...e, date: l.date })));
    
    const rangeIncome = rangeEntries.filter(e => e.type === 'income').reduce((a, c) => a + c.amount, 0);
    const rangeExpense = rangeEntries.filter(e => e.type === 'expense').reduce((a, c) => a + c.amount, 0);
    const rangeNet = rangeIncome - rangeExpense;

    const addMoneyEntry = (type: 'income' | 'expense') => {
        const amt = parseFloat(transAmt);

        if (transDesc && amt) {
            const newEntry: MoneyEntry = {
                id: Math.random().toString(),
                description: transDesc,
                amount: amt,
                type: type,
                // Never pass undefined to Firestore — omit the field entirely for income
                ...(type === 'expense' ? { category: transCat } : {}),
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            updateLog({ moneyEntries: [...(currentLog.moneyEntries || []), newEntry] });
            setTransDesc('');
            setTransAmt('');
            playSound(SOUNDS.SUCCESS);
        }
    };

    // Category Management
    const addCategory = () => {
        if (newCategoryInput.trim() && !(settings.expenseCategories || []).includes(newCategoryInput.trim())) {
            setSettings({
                ...settings,
                expenseCategories: [...(settings.expenseCategories || []), newCategoryInput.trim()]
            });
            setNewCategoryInput('');
            playSound(SOUNDS.SUCCESS);
        }
    };

    const removeCategory = (cat: string) => {
        if (confirm(`Delete category "${cat}"?`)) {
            setSettings({
                ...settings,
                expenseCategories: (settings.expenseCategories || []).filter(c => c !== cat)
            });
            playSound(SOUNDS.CLICK);
        }
    };

    const handleMoneyPDF = () => {
        const esc = (s: any) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

        const sorted = [...rangeEntries].sort((a, b) => a.date.localeCompare(b.date) || (a.timestamp||'').localeCompare(b.timestamp||''));

        const rows = sorted.map(e => `
          <tr>
            <td>${esc(e.date)}</td>
            <td>${esc(e.timestamp || '')}</td>
            <td style="font-weight:600">${esc(e.description)}</td>
            <td style="font-size:9px;text-transform:uppercase;color:#64748b">${esc(e.category || '—')}</td>
            <td style="color:#e11d48;text-align:right">${e.type === 'expense' ? '₹' + e.amount.toLocaleString() : ''}</td>
            <td style="color:#16a34a;text-align:right">${e.type === 'income' ? '₹' + e.amount.toLocaleString() : ''}</td>
          </tr>`).join('');

        const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(settings.userName)} — Financial Ledger</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1e293b; padding: 28px; background: #fff; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 2px solid #1e293b; padding-bottom: 16px; }
    h1 { font-size: 24px; font-weight: 900; }
    .subtitle { color: #64748b; font-size: 11px; margin-top: 4px; }
    .print-btn { background: #4f46e5; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 800; font-size: 11px; cursor: pointer; letter-spacing: 0.05em; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .summary-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; }
    .summary-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 4px; }
    .summary-val { font-size: 20px; font-weight: 900; }
    .income-val { color: #16a34a; }
    .expense-val { color: #e11d48; }
    .net-pos { color: #4f46e5; }
    .net-neg { color: #475569; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    thead tr { background: #1e293b; color: #fff; }
    thead th { padding: 9px 8px; text-align: left; font-weight: 700; text-transform: uppercase; font-size: 9px; letter-spacing: 0.05em; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    td { padding: 8px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
    .footer { margin-top: 20px; display: flex; justify-content: space-between; color: #94a3b8; font-size: 10px; border-top: 1px solid #e2e8f0; padding-top: 12px; }
    @media print {
      body { padding: 12px; }
      .print-btn { display: none !important; }
      @page { margin: 1cm; size: A4; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${esc(settings.userName || 'Life Tracker')} — Financial Ledger</h1>
      <p class="subtitle">Statement Period: ${esc(moneyStartDate)} to ${esc(moneyEndDate)} &nbsp;·&nbsp; ${sorted.length} transactions</p>
    </div>
    <button class="print-btn" onclick="window.print()">🖨 Print / Save PDF</button>
  </div>

  <div class="summary">
    <div class="summary-box"><div class="summary-label">Total Income</div><div class="summary-val income-val">₹${rangeIncome.toLocaleString()}</div></div>
    <div class="summary-box"><div class="summary-label">Total Expenses</div><div class="summary-val expense-val">₹${rangeExpense.toLocaleString()}</div></div>
    <div class="summary-box"><div class="summary-label">Net Flow</div><div class="summary-val ${rangeNet >= 0 ? 'net-pos' : 'net-neg'}">${rangeNet >= 0 ? '+' : ''}₹${rangeNet.toLocaleString()}</div></div>
    <div class="summary-box"><div class="summary-label">Closing Balance</div><div class="summary-val">₹${totalAvailableBalance.toLocaleString()}</div></div>
  </div>

  <table>
    <thead>
      <tr><th>Date</th><th>Time</th><th>Description</th><th>Category</th><th style="text-align:right">Debit (₹)</th><th style="text-align:right">Credit (₹)</th></tr>
    </thead>
    <tbody>
      ${rows.length > 0 ? rows : '<tr><td colspan="6" style="text-align:center;padding:24px;color:#94a3b8;font-style:italic">No transactions in this period.</td></tr>'}
    </tbody>
  </table>

  <div class="footer">
    <span>made with ❤️ by Hakam &nbsp;·&nbsp; Life Tracker</span>
    <span>Generated ${new Date().toLocaleDateString()}</span>
  </div>
</body>
</html>`;

        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.target = '_blank';
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
        playSound(SOUNDS.SUCCESS);
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-right-6 duration-700 pb-24 overflow-x-hidden">
            <div className="flex justify-between items-center px-2">
                <h2 className="text-3xl font-serif font-bold text-rose-900 dark:text-rose-100 no-print">Private Ledger</h2>
                <div className="flex gap-2 no-print">
                    <button 
                        onClick={() => { playSound(SOUNDS.CLICK); setShowSettings(true); }}
                        className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all"
                        title="Manage Categories"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-1.066 2.573c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                    <button 
                        onClick={() => { playSound(SOUNDS.CLICK); setShowChart(!showChart); }}
                        className={`p-3 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm transition-all ${showChart ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50'}`}
                        title="Visualize Expenses"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
                    </button>
                    <button 
                        onClick={() => handleMoneyPDF()}
                        className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                        title="Export PDF Report"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zM17 9V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h8z" /></svg>
                    </button>
                </div>
            </div>

            <Card className="bg-indigo-900 text-white p-8 relative overflow-hidden no-print">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full -mr-10 -mt-10"></div>
                <div className="flex flex-wrap justify-between items-start mb-4 sm:mb-6 gap-2">
                    <div>
                        <p className="text-[10px] uppercase font-black opacity-60 tracking-widest mb-1">Total Available Balance</p>
                        <h4 className="text-4xl font-serif font-bold">₹{totalAvailableBalance.toLocaleString()}</h4>
                    </div>
                    <div className="text-3xl">🏦</div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:gap-4 mt-4 sm:mt-6 no-print">
                   <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-indigo-300">Range Start</label>
                      <input type="date" value={moneyStartDate} onChange={e => setMoneyStartDate(e.target.value)} className="w-full bg-white/10 border-none rounded-xl p-2 text-xs font-bold focus:ring-1 focus:ring-indigo-400 outline-none" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-indigo-300">Range End</label>
                      <input type="date" value={moneyEndDate} onChange={e => setMoneyEndDate(e.target.value)} className="w-full bg-white/10 border-none rounded-xl p-2 text-xs font-bold focus:ring-1 focus:ring-indigo-400 outline-none" />
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-white/10">
                   <div>
                      <span className="text-[9px] font-black uppercase opacity-60 tracking-widest block mb-1">Range Credits</span>
                      <p className="text-xl font-bold text-emerald-300">₹{rangeIncome.toLocaleString()}</p>
                   </div>
                   <div>
                      <span className="text-[9px] font-black uppercase opacity-60 tracking-widest block mb-1">Range Debits</span>
                      <p className="text-xl font-bold text-rose-300">₹{rangeExpense.toLocaleString()}</p>
                   </div>
                </div>
            </Card>

            {/* Visualization Section */}
            {showChart && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-500 no-print">
                    <Card>
                        <SectionTitle title="Expense Breakdown" icon="📊" />
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-xs text-slate-400 font-medium">Categorized spending for selected range.</p>
                            <span className="text-[10px] font-black uppercase tracking-widest bg-rose-50 text-rose-500 px-2 py-1 rounded-lg">
                                Total: ₹{rangeExpense.toLocaleString()}
                            </span>
                        </div>
                        <ExpensePieChart entries={rangeEntries} />
                    </Card>
                </div>
            )}

            <Card className="no-print">
                <SectionTitle title="New Transaction" icon="📝" />
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <input 
                            value={transDesc} 
                            onChange={e => setTransDesc(e.target.value)}
                            placeholder="What for?..." 
                            className="flex-1 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-medium border-2 border-transparent focus:border-indigo-100 dark:focus:border-indigo-900 outline-none dark:text-slate-200" 
                        />
                        <input 
                            type="number" 
                            value={transAmt} 
                            onChange={e => setTransAmt(e.target.value)}
                            placeholder="₹" 
                            className="w-24 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-black text-center text-indigo-600 dark:text-indigo-400 outline-none" 
                        />
                    </div>
                    
                    {/* Category Selector */}
                    <div className="relative">
                        <select 
                            value={transCat}
                            onChange={e => setTransCat(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 outline-none appearance-none cursor-pointer border-r-8 border-transparent"
                        >
                            {(settings.expenseCategories || []).map((cat, i) => (
                                <option key={i} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => addMoneyEntry('income')} className="bg-emerald-500 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-emerald-50 dark:shadow-none active:scale-95 transition-all">Income</button>
                        <button onClick={() => addMoneyEntry('expense')} className="bg-rose-500 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-rose-50 dark:shadow-none active:scale-95 transition-all">Expense</button>
                    </div>
                </div>
            </Card>

            <div className="space-y-4 print-financials no-print">
                <SectionTitle title="Transaction History" icon="📜" />
                {rangeEntries.length === 0 ? (
                    <p className="text-center text-slate-300 italic py-12">No records found.</p>
                ) : (
                    [...rangeEntries].sort((a, b) => b.date.localeCompare(a.date) || (b.timestamp||'').localeCompare(a.timestamp||'')).map(e => (
                        <div key={e.id} className="flex items-center justify-between bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${e.type === 'income' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600'}`}>
                                    {e.type === 'income' ? '↙️' : '↗️'}
                                </div>
                                <div>
                                    <h5 className="text-sm font-bold text-slate-700 dark:text-slate-200">{e.description}</h5>
                                    <span className="text-[10px] text-slate-400 flex items-center gap-2">
                                        {e.date} • {e.timestamp}
                                        {e.category && e.type === 'expense' && (
                                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider">{e.category}</span>
                                        )}
                                    </span>
                                </div>
                            </div>
                            <span className={`text-sm font-black ${e.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {e.type === 'income' ? '+' : '-'}₹{e.amount.toLocaleString()}
                            </span>
                        </div>
                    ))
                )}
            </div>

            {/* Dedicated Professional Print View for Money */}
            <div className="hidden print:block space-y-8">
                <div className="text-center border-b-2 border-slate-900 pb-8">
                    <h2 className="text-4xl font-serif font-bold text-slate-900 uppercase tracking-tight">{settings.userName}'s Financial Ledger</h2>
                    <p className="text-sm text-slate-500 font-medium mt-2">Statement Period: <span className="text-slate-900">{moneyStartDate}</span> to <span className="text-slate-900">{moneyEndDate}</span></p>
                </div>

                {/* Summary Cards */}
                <div className="flex justify-between items-center border border-slate-200 rounded-lg p-6 bg-slate-50">
                    <div className="text-left">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Credits</span>
                         <p className="text-2xl font-bold text-emerald-600">+₹{rangeIncome.toLocaleString()}</p>
                    </div>
                    <div className="text-left border-l border-slate-200 pl-8">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Debits</span>
                         <p className="text-2xl font-bold text-rose-600">-₹{rangeExpense.toLocaleString()}</p>
                    </div>
                    <div className="text-left border-l border-slate-200 pl-8">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Net Flow</span>
                         <p className={`text-2xl font-bold ${rangeNet >= 0 ? 'text-indigo-600' : 'text-slate-600'}`}>
                            {rangeNet >= 0 ? '+' : ''}₹{rangeNet.toLocaleString()}
                         </p>
                    </div>
                    <div className="text-right border-l border-slate-200 pl-8">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Closing Balance</span>
                         <p className="text-2xl font-black text-slate-900">₹{totalAvailableBalance.toLocaleString()}</p>
                    </div>
                </div>

                {/* Transaction Table */}
                <div className="mt-8">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-[0.2em] mb-4 border-b border-slate-200 pb-2">Detailed Transactions</h3>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-300">
                                <th className="py-2 text-[10px] font-black uppercase text-slate-500 tracking-wider">Date</th>
                                <th className="py-2 text-[10px] font-black uppercase text-slate-500 tracking-wider">Description</th>
                                <th className="py-2 text-[10px] font-black uppercase text-slate-500 tracking-wider">Category</th>
                                <th className="py-2 text-[10px] font-black uppercase text-slate-500 tracking-wider text-right">Debit</th>
                                <th className="py-2 text-[10px] font-black uppercase text-slate-500 tracking-wider text-right">Credit</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs text-slate-700">
                            {[...rangeEntries].sort((a, b) => a.date.localeCompare(b.date) || (a.timestamp||'').localeCompare(b.timestamp||'')).map((e, i) => (
                                <tr key={i} className="border-b border-slate-100">
                                    <td className="py-3 font-medium text-slate-500">{e.date} <span className="opacity-50">{e.timestamp}</span></td>
                                    <td className="py-3 font-bold text-slate-800">{e.description}</td>
                                    <td className="py-3 font-medium text-slate-600 uppercase text-[9px] tracking-wide">{e.category || '-'}</td>
                                    <td className="py-3 text-right font-medium text-rose-600">
                                        {e.type === 'expense' ? `₹${e.amount.toLocaleString()}` : '-'}
                                    </td>
                                    <td className="py-3 text-right font-medium text-emerald-600">
                                         {e.type === 'income' ? `₹${e.amount.toLocaleString()}` : '-'}
                                    </td>
                                </tr>
                            ))}
                            {rangeEntries.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-slate-400 italic">No transactions found in this period.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="pt-8 border-t-2 border-slate-900 flex justify-between items-center">
                     <p className="text-[10px] text-slate-400 font-medium">Generated by Hakam — Daily Life Tracker</p>
                     <p className="text-[10px] text-slate-400 font-medium">Page 1 of 1</p>
                </div>
            </div>

            {/* Category Management Modal */}
            <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Manage Expense Categories">
                <div className="space-y-6">
                    <div className="flex gap-2">
                        <input 
                            value={newCategoryInput}
                            onChange={(e) => setNewCategoryInput(e.target.value)}
                            placeholder="New category..."
                            className="flex-1 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-bold outline-none border-2 border-transparent focus:border-indigo-100 dark:focus:border-indigo-900 dark:text-slate-200"
                        />
                        <button 
                            onClick={addCategory}
                            className="bg-indigo-600 text-white px-6 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95"
                        >
                            Add
                        </button>
                    </div>
                    
                    <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {(settings.expenseCategories || []).map((cat, i) => (
                            <div key={i} className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl">
                                <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">{cat}</span>
                                <button 
                                    onClick={() => removeCategory(cat)}
                                    className="text-slate-400 hover:text-rose-500 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>
        </div>
    );
};
