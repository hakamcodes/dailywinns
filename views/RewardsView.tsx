
import React, { useState } from 'react';
import { Card, SectionTitle, Modal } from '../components/Shared';
import { DailyLog, AppSettings, RedeemedReward } from '../types';
import { SOUNDS } from '../utils';

interface RewardsViewProps {
  cumulativeLifeScore: number;
  isEditable: boolean;
  settings: AppSettings;
  currentLog: DailyLog;
  updateLog: (updates: Partial<DailyLog>) => void;
  addFloatingPoint: (x: number, y: number, value: string, isNegative?: boolean) => void;
  playSound: (url: string) => void;
}

export const RewardsView: React.FC<RewardsViewProps> = ({ 
  cumulativeLifeScore, isEditable, settings, currentLog, updateLog, addFloatingPoint, playSound 
}) => {
    const [isPunishModalOpen, setIsPunishModalOpen] = useState(false);
    const [punishPoints, setPunishPoints] = useState('');
    const [punishReason, setPunishReason] = useState('');

    const [isBonusModalOpen, setIsBonusModalOpen] = useState(false);
    const [bonusPoints, setBonusPoints] = useState('');
    const [bonusReason, setBonusReason] = useState('');

    // Calculate daily bonus used
    const dailyBonusTotal = currentLog.redeemedRewards
        ?.filter(r => r.rewardId === 'manual-bonus')
        .reduce((acc, r) => acc + Math.abs(r.points), 0) || 0;
    
    const DAILY_BONUS_LIMIT = 20;
    const remainingBonus = Math.max(0, DAILY_BONUS_LIMIT - dailyBonusTotal);

    const handlePunish = () => {
        const pts = parseInt(punishPoints);
        if (!pts || pts <= 0) return;

        const penalty: RedeemedReward = {
            id: Math.random().toString(),
            rewardId: 'manual-penalty',
            name: punishReason.trim() ? `Penalty: ${punishReason}` : 'Self-Correction Penalty',
            points: pts,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        updateLog({ redeemedRewards: [...(currentLog.redeemedRewards || []), penalty] });
        addFloatingPoint(window.innerWidth / 2, window.innerHeight / 2, `-${pts}`, true); 
        playSound(SOUNDS.CLICK);
        
        setPunishPoints('');
        setPunishReason('');
        setIsPunishModalOpen(false);
    };

    const handleBonus = () => {
        const pts = parseInt(bonusPoints);
        if (!pts || pts <= 0) return;
        
        if (pts > remainingBonus) {
            alert(`Daily limit reached. You can only add up to ${remainingBonus} more points today.`);
            return;
        }

        if (!bonusReason.trim()) {
            alert("You must provide a reason for adding bonus points.");
            return;
        }

        const bonus: RedeemedReward = {
            id: Math.random().toString(),
            rewardId: 'manual-bonus',
            name: `Bonus: ${bonusReason}`,
            points: -pts, // Negative cost = Positive Points in the calculation
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        updateLog({ redeemedRewards: [...(currentLog.redeemedRewards || []), bonus] });
        addFloatingPoint(window.innerWidth / 2, window.innerHeight / 2, `+${pts}`);
        playSound(SOUNDS.SUCCESS);

        setBonusPoints('');
        setBonusReason('');
        setIsBonusModalOpen(false);
    };

    return (
    <div className="space-y-8 animate-in slide-in-from-right-6 duration-700 pb-10 overflow-x-hidden">
      <div className="flex justify-between items-center px-1">
          <h2 className="text-3xl font-serif font-bold text-rose-900 dark:text-rose-100">Life Rewards</h2>
          {isEditable && (
            <div className="flex gap-2">
                <button 
                    onClick={() => { playSound(SOUNDS.CLICK); setIsBonusModalOpen(true); }}
                    className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:text-emerald-600 transition-colors shadow-sm"
                    title="Manual Bonus (Add Points)"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                </button>
                <button 
                    onClick={() => { playSound(SOUNDS.CLICK); setIsPunishModalOpen(true); }}
                    className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 text-rose-400 rounded-full flex items-center justify-center hover:bg-rose-100 dark:hover:bg-rose-900/40 hover:text-rose-600 transition-colors shadow-sm"
                    title="Self-Correction (Deduct Points)"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </button>
            </div>
          )}
      </div>
      
      <section className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-10 -mt-10"></div>
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <p className="text-[10px] uppercase font-black text-indigo-200 tracking-widest mb-1">Available Cumulative Score</p>
            <h4 className="text-2xl sm:text-4xl font-serif font-bold">{cumulativeLifeScore}</h4>
          </div>
          <div className="text-5xl">🎁</div>
        </div>
      </section>

      {!isEditable && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-amber-800 dark:text-amber-200 text-xs font-bold text-center">
          ⚠️ Redemption Locked: Rewards for this date are locked based on current time.
        </div>
      )}

      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${!isEditable ? 'pointer-events-none opacity-90' : ''}`}>
        {settings.rewards.map(reward => {
          const canAfford = cumulativeLifeScore >= reward.points && isEditable;
          return (
            <Card key={reward.id} className="relative group">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-3xl group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-colors shrink-0">
                  {reward.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-800 dark:text-slate-200 truncate">{reward.name}</h4>
                  <p className="text-xs font-black text-rose-500 uppercase tracking-widest">{reward.points} Points</p>
                </div>
                <button 
                  disabled={!canAfford}
                  onClick={(e) => {
                    const redeemed: RedeemedReward = {
                      id: Math.random().toString(),
                      rewardId: reward.id,
                      name: reward.name,
                      points: reward.points,
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    };
                    updateLog({ redeemedRewards: [...(currentLog.redeemedRewards || []), redeemed] });
                    addFloatingPoint(e.clientX, e.clientY, `-${reward.points}`, true);
                    playSound(SOUNDS.REWARD);
                  }}
                  className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${canAfford ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md active:scale-95' : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-500 cursor-not-allowed'}`}
                >
                  Redeem
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="bg-slate-50 dark:bg-slate-900 border-none">
        <SectionTitle title="Redemption & Adjustments" icon="📜" />
        <div className="space-y-2 mt-4">
          {currentLog.redeemedRewards && currentLog.redeemedRewards.length > 0 ? (
            currentLog.redeemedRewards.map(redemption => (
              <div key={redemption.id} className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{redemption.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">{redemption.timestamp}</span>
                  <span className={`text-xs font-black ${redemption.points < 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {redemption.points < 0 ? `+${Math.abs(redemption.points)}` : `-${redemption.points}`}
                  </span>
                  {isEditable && (
                    <button onClick={() => { playSound(SOUNDS.CLICK); updateLog({ redeemedRewards: currentLog.redeemedRewards.filter(r => r.id !== redemption.id) }); }} className="text-slate-200 hover:text-red-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-slate-300 text-xs italic py-4">No rewards or adjustments yet today.</p>
          )}
        </div>
      </Card>

      {/* Manual Bonus Modal */}
      <Modal isOpen={isBonusModalOpen} onClose={() => setIsBonusModalOpen(false)} title="Add Good Deed Bonus">
         <div className="space-y-6">
            <p className="text-xs text-slate-400 font-medium text-center">Reward yourself for good actions not tracked elsewhere. Be honest!</p>
            
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl text-center">
                <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Daily Limit Remaining</p>
                <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{remainingBonus} Points</p>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-emerald-500 tracking-widest pl-1">Points to Add</label>
                <input 
                    type="number" 
                    value={bonusPoints} 
                    onChange={e => setBonusPoints(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-xl font-black text-emerald-500 outline-none border-2 border-transparent focus:border-emerald-200 dark:focus:border-emerald-900 text-center"
                    placeholder="0"
                    autoFocus
                />
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Reason (Mandatory)</label>
                <input 
                    type="text" 
                    value={bonusReason} 
                    onChange={e => setBonusReason(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-bold outline-none border-2 border-transparent focus:border-emerald-200 dark:focus:border-emerald-900 dark:text-slate-200"
                    placeholder="e.g. Helped a stranger, fixed a bug..."
                />
            </div>

            <button 
                onClick={handleBonus}
                disabled={!bonusPoints || !bonusReason.trim() || parseInt(bonusPoints) > remainingBonus}
                className="w-full bg-emerald-600 text-white font-black py-5 rounded-[1.5rem] shadow-xl hover:bg-emerald-700 active:scale-95 transition-all uppercase text-xs tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Confirm Bonus
            </button>
         </div>
      </Modal>

      {/* Manual Penalty Modal */}
      <Modal isOpen={isPunishModalOpen} onClose={() => setIsPunishModalOpen(false)} title="Self-Correction Protocol">
         <div className="space-y-6">
            <p className="text-xs text-slate-400 font-medium text-center">Acknowledge a mistake to maintain integrity. These points will be deducted from your Life Score.</p>
            
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-rose-400 tracking-widest pl-1">Points to Deduct</label>
                <input 
                    type="number" 
                    value={punishPoints} 
                    onChange={e => setPunishPoints(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-xl font-black text-rose-500 outline-none border-2 border-transparent focus:border-rose-200 dark:focus:border-rose-900 text-center"
                    placeholder="0"
                    autoFocus
                />
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Reason (Optional)</label>
                <input 
                    type="text" 
                    value={punishReason} 
                    onChange={e => setPunishReason(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-bold outline-none border-2 border-transparent focus:border-slate-200 dark:focus:border-slate-700 dark:text-slate-200"
                    placeholder="e.g. Wasted time, Lost temper..."
                />
            </div>

            <button 
                onClick={handlePunish}
                disabled={!punishPoints}
                className="w-full bg-rose-600 text-white font-black py-5 rounded-[1.5rem] shadow-xl hover:bg-rose-700 active:scale-95 transition-all uppercase text-xs tracking-widest disabled:opacity-50"
            >
                Confirm Deduction
            </button>
         </div>
      </Modal>
    </div>
    );
};
