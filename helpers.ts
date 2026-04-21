
import { DailyLog, AppSettings, ExerciseEntry } from './types';

export const calculateHabitStreak = (habitId: string, logs: DailyLog[], refDateStr: string) => {
    let streak = 0;
    
    // Helper to format date consistent with App.tsx
    const toDateStr = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    let checkDate = new Date(refDateStr);
    
    // Check if the habit is done on the reference date itself (Today)
    const refLog = logs.find(l => l.date === refDateStr);
    if (refLog && refLog.completedHabits?.includes(habitId)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1); // Move to yesterday for next loop
    } else {
        // If NOT done today, check if it was done yesterday. 
        // If done yesterday, the streak is still "alive" (just pending for today), so we count backwards from yesterday.
        const yesterday = new Date(refDateStr);
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = toDateStr(yesterday);
        const yLog = logs.find(l => l.date === yStr);
        
        if (yLog && yLog.completedHabits?.includes(habitId)) {
            // Streak continues from yesterday
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            // Not done today AND not done yesterday = Streak broken
            return 0;
        }
    }

    // Count backwards contiguously
    while (true) {
        const dateStr = toDateStr(checkDate);
        const log = logs.find(l => l.date === dateStr);
        if (log && log.completedHabits?.includes(habitId)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
};

export const calculateCustomActivityStreak = (activityId: string, logs: DailyLog[], refDateStr: string) => {
    let streak = 0;
    
    const toDateStr = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    let checkDate = new Date(refDateStr);
    
    const refLog = logs.find(l => l.date === refDateStr);
    if (refLog && refLog.customActivitiesData?.[activityId] === true) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
    } else {
        // Logic fix: Check yesterday if today is empty
        const yesterday = new Date(refDateStr);
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = toDateStr(yesterday);
        const yLog = logs.find(l => l.date === yStr);

        if (yLog && yLog.customActivitiesData?.[activityId] === true) {
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            return 0;
        }
    }

    while (true) {
        const dateStr = toDateStr(checkDate);
        const log = logs.find(l => l.date === dateStr);
        if (log && log.customActivitiesData?.[activityId] === true) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
};

// Permanent XP Calculator: Same as Points, but DOES NOT subtract Rewards.
export const calculateLogXP = (log: DailyLog, settings: AppSettings, allLogs?: DailyLog[]) => {
    let score = 0;
    const totalWater = log.waterEntries.reduce((acc, curr) => acc + curr.amount, 0);
    const totalStudyMinutes = log.studySessions.reduce((acc, curr) => acc + curr.duration, 0);
    const totalExerciseMinutes = log.exerciseEntries.reduce((acc, curr) => acc + curr.duration, 0);
    const totalScreenTime = log.screenTimeHours + log.screenTimeMinutes / 60;

    // Pillars of happiness: +10 each
    if (log.happinessPillars) {
      Object.values(log.happinessPillars).forEach(val => {
        if (val) score += 10;
      });
    }

    // Habits: based on custom points with Streak Multiplier
    if (log.completedHabits) {
        log.completedHabits.forEach(habitId => {
            const habit = settings.habits.find(h => h.id === habitId);
            if (habit) {
                let pts = habit.points;
                if (allLogs) {
                    const streak = calculateHabitStreak(habitId, allLogs, log.date);
                    if (streak > 30) pts *= 2;
                    else if (streak > 7) pts *= 1.5;
                }
                score += pts;
            }
        });
    }

    // Custom Activities
    if (log.customActivitiesData) {
      settings.customActivities.forEach(ca => {
        const val = log.customActivitiesData[ca.id];
        if (ca.type === 'checklist' && val === true) {
          let pts = ca.points;
          if (allLogs) {
             const streak = calculateCustomActivityStreak(ca.id, allLogs, log.date);
             if (streak > 30) pts *= 2;
             else if (streak > 7) pts *= 1.5;
          }
          score += pts;
        } else if (ca.type === 'score' && typeof val === 'number') {
          score += Math.floor(val * ca.points);
        } else if (ca.type === 'time' && typeof val === 'number') {
          score += Math.floor((val / 30) * ca.points);
        } else if (ca.type === 'notes' && typeof val === 'string' && val.trim().length > 0) {
          score += ca.points;
        }
      });
    }

    // Breathing exercises: +10 each
    score += (log.breathingSessions || 0) * 10;

    // +10 points for every 1 liter water (proportional floor)
    score += Math.floor(totalWater * 10);
    
    // Sleep points
    const sleepTotal = log.sleepHours + log.sleepMinutes / 60;
    if (sleepTotal < 5 && sleepTotal > 0) score -= 20;
    if (sleepTotal > 6) {
      score -= Math.floor((sleepTotal - 6) * 20);
    }
    
    // +10 points every 30 min deep work (proportional floor)
    score += Math.floor((totalStudyMinutes / 30) * 10);
    
    // +20 point for 30 min body maintenance (proportional floor)
    score += Math.floor((totalExerciseMinutes / 30) * 20);
    
    // -30 point if don't does any body maintenance in a day
    if (log.exerciseEntries.length === 0) score -= 30;
    
    // -10 point for each hour for screentime after 4 hours (proportional floor)
    if (totalScreenTime > 4) {
      score -= Math.floor((totalScreenTime - 4) * 10);
    }
    
    // +5 point for each meal
    if (log.meals.breakfast) score += 5;
    if (log.meals.lunch) score += 5;
    if (log.meals.dinner) score += 5;
    
    // -10 points for one junk food
    score -= log.junkFood * 10;
    
    // +10 for writing
    if (log.journal?.trim().length > 0) score += 10;
    if (log.gratitude?.trim().length > 0) score += 10;
    
    // +20 points for 100% target achieved
    if (log.goalsCompleted === 100) score += 20;
    
    // +10 for skincare (each check)
    if (log.skincare.morning) score += 10;
    if (log.skincare.afternoon) score += 10;
    if (log.skincare.night) score += 10;

    // Apply Self-Correction Penalties manually (RedeemedReward with negative points for penalty, but we check if it is a 'penalty' type)
    if (log.redeemedRewards) {
        log.redeemedRewards.forEach(r => {
            // If the user manually punished themselves, it counts against XP
            if (r.rewardId === 'manual-penalty' && r.points > 0) {
                score -= r.points; // Penalty removes points
            }
            // If the user added a manual bonus, it adds to XP
            if (r.rewardId === 'manual-bonus' && r.points < 0) {
                score += Math.abs(r.points); // Negative points cost means positive value added
            }
        });
    }

    return score;
};

// Spendable Points Calculator (Includes Reward deductions)
export const calculateLogPoints = (log: DailyLog, settings: AppSettings, allLogs?: DailyLog[]) => {
    // Start with the Gross XP
    let score = calculateLogXP(log, settings, allLogs);

    // Subtract Shop Rewards
    if (log.redeemedRewards) {
        log.redeemedRewards.forEach(r => {
            // Ignore manual adjustments as they are already handled in calculateLogXP
            if (r.rewardId !== 'manual-penalty' && r.rewardId !== 'manual-bonus') {
                score -= r.points;
            }
        });
    }

    return score;
};

export const getPointsBreakdown = (log: DailyLog, settings: AppSettings, allLogs?: DailyLog[]) => {
    const items: { label: string; points: number; icon: string }[] = [];
    
    const pillarsPoints = Object.values(log.happinessPillars || {}).filter(v => v).length * 10;
    if (pillarsPoints !== 0) items.push({ label: 'Happiness Pillars', points: pillarsPoints, icon: '🌈' });

    if (log.completedHabits) {
        log.completedHabits.forEach(habitId => {
            const habit = settings.habits.find(h => h.id === habitId);
            if (habit) {
                let pts = habit.points;
                let suffix = '';
                if (allLogs) {
                    const streak = calculateHabitStreak(habitId, allLogs, log.date);
                    if (streak > 30) {
                        pts *= 2;
                        suffix = ' (x2 Streak)';
                    } else if (streak > 7) {
                        pts *= 1.5;
                        suffix = ' (x1.5 Streak)';
                    }
                }
                items.push({ label: `${habit.name}${suffix}`, points: pts, icon: habit.emoji });
            }
        });
    }

    // Custom Activities Breakdown
    if (log.customActivitiesData) {
      settings.customActivities.forEach(ca => {
        const val = log.customActivitiesData[ca.id];
        let pts = 0;
        let suffix = '';
        
        if (ca.type === 'checklist' && val === true) {
            pts = ca.points;
            if (allLogs) {
                const streak = calculateCustomActivityStreak(ca.id, allLogs, log.date);
                if (streak > 30) {
                    pts *= 2;
                    suffix = ' (x2 Streak)';
                } else if (streak > 7) {
                    pts *= 1.5;
                    suffix = ' (x1.5 Streak)';
                }
            }
        }
        else if (ca.type === 'score' && typeof val === 'number') pts = Math.floor(val * ca.points);
        else if (ca.type === 'time' && typeof val === 'number') pts = Math.floor((val / 30) * ca.points);
        else if (ca.type === 'notes' && typeof val === 'string' && val.trim().length > 0) pts = ca.points;
        
        if (pts !== 0) items.push({ label: `${ca.name}${suffix}`, points: pts, icon: ca.emoji });
      });
    }

    if (log.breathingSessions > 0) {
      items.push({ label: 'Breathing Exercises', points: log.breathingSessions * 10, icon: '🌬️' });
    }

    const totalWater = log.waterEntries.reduce((acc, curr) => acc + curr.amount, 0);
    const waterPts = Math.floor(totalWater * 10);
    if (waterPts !== 0) items.push({ label: 'Hydration', points: waterPts, icon: '💧' });

    const sleepTotal = log.sleepHours + log.sleepMinutes / 60;
    if (sleepTotal < 5 && sleepTotal > 0) items.push({ label: 'Sleep Penalty (<5h)', points: -20, icon: '🌙' });
    if (sleepTotal > 6) items.push({ label: 'Sleep Overshoot (>6h)', points: -Math.floor((sleepTotal - 6) * 20), icon: '🌙' });

    const totalStudyMinutes = log.studySessions.reduce((acc, curr) => acc + curr.duration, 0);
    const studyPts = Math.floor((totalStudyMinutes / 30) * 10);
    if (studyPts !== 0) items.push({ label: 'Deep Work', points: studyPts, icon: '📚' });

    const totalExerciseMinutes = log.exerciseEntries.reduce((acc, curr) => acc + curr.duration, 0);
    const exercisePts = Math.floor((totalExerciseMinutes / 30) * 20);
    if (exercisePts !== 0) items.push({ label: 'Exercise', points: exercisePts, icon: '🏃' });
    if (log.exerciseEntries.length === 0) items.push({ label: 'No Exercise Penalty', points: -30, icon: '🏃' });

    const totalScreenTime = log.screenTimeHours + log.screenTimeMinutes / 60;
    if (totalScreenTime > 4) items.push({ label: 'Screen Time Overuse', points: -Math.floor((totalScreenTime - 4) * 10), icon: '📱' });

    const mealPts = (log.meals.breakfast ? 5 : 0) + (log.meals.lunch ? 5 : 0) + (log.meals.dinner ? 5 : 0);
    if (mealPts !== 0) items.push({ label: 'Regular Meals', points: mealPts, icon: '🍽️' });

    if (log.junkFood > 0) items.push({ label: 'Junk Food Penalty', points: -log.junkFood * 10, icon: '🍕' });

    if (log.journal?.trim().length > 0) items.push({ label: 'Journaling', points: 10, icon: '📝' });
    if (log.gratitude?.trim().length > 0) items.push({ label: 'Gratitude', points: 10, icon: '🙏' });

    if (log.goalsCompleted === 100) items.push({ label: 'Perfect Goals', points: 20, icon: '🎯' });

    const skincarePts = (log.skincare.morning ? 10 : 0) + (log.skincare.afternoon ? 10 : 0) + (log.skincare.night ? 10 : 0);
    if (skincarePts !== 0) items.push({ label: 'Skincare Routine', points: skincarePts, icon: '✨' });

    // Rewards (Deductions)
    if (log.redeemedRewards) {
      log.redeemedRewards.forEach(r => {
        items.push({ label: `Reward: ${r.name}`, points: -r.points, icon: '🎁' });
      });
    }

    return items;
};

export const createSummaryText = (log: DailyLog, settings: AppSettings, allLogs?: DailyLog[]) => {
    const points = calculateLogPoints(log, settings, allLogs);
    const water = log.waterEntries.reduce((a, c) => a + c.amount, 0);
    const study = log.studySessions.reduce((a, c) => a + c.duration, 0);
    const subjects = Array.from(new Set(log.studySessions.map(s => s.subject))).join(', ');
    const exercise = log.exerciseEntries.reduce((a, c) => a + c.duration, 0);
    const exerciseTypes = Array.from(new Set(log.exerciseEntries.map(e => e.type))).join(', ');
    
    const activePillars = [];
    if (log.happinessPillars.physical) activePillars.push("Physical Activity");
    if (log.happinessPillars.problemSolving) activePillars.push("Complex Problem Solving");
    if (log.happinessPillars.helping) activePillars.push("Help People/Animals/Plants");
    if (log.happinessPillars.creative) activePillars.push("Creative Work");
    if (log.happinessPillars.explore) activePillars.push("Explore New Places");
    if (log.happinessPillars.learning) activePillars.push("Learning New Things");
    if (log.happinessPillars.ideas) activePillars.push("New Ideas");
    if (log.happinessPillars.qualityTime) activePillars.push("Quality Time");
    if (log.happinessPillars.progression) activePillars.push("Progression");

    const skincare = [];
    if (log.skincare.morning) skincare.push("Morning");
    if (log.skincare.afternoon) skincare.push("Afternoon");
    if (log.skincare.night) skincare.push("Night");

    const meals = [];
    if (log.meals.breakfast) meals.push("Breakfast");
    if (log.meals.lunch) meals.push("Lunch");
    if (log.meals.dinner) meals.push("Dinner");

    let text = `Summary for ${log.date}:\n`;
    text += `• Life Score: ${points}\n`;
    text += `• Hydration: ${water.toFixed(2)}L\n`;
    text += `• Sleep: ${log.sleepHours}h ${log.sleepMinutes}m (${log.sleepStart} to ${log.sleepEnd})\n`;
    text += `• Focus: ${study}m ${subjects ? `on [${subjects}]` : ''}\n`;
    text += `• Movement: ${exercise}m ${exerciseTypes ? `(${exerciseTypes})` : ''}\n`;
    if (log.completedHabits?.length > 0) {
        const habits = settings.habits.filter(h => log.completedHabits.includes(h.id)).map(h => h.name);
        text += `• Habits Mastered: ${habits.join(', ')}\n`;
    }
    if (activePillars.length > 0) text += `• Happiness Pillars: ${activePillars.join(', ')}\n`;
    if (skincare.length > 0) text += `• Skincare: ${skincare.join(', ')}\n`;
    // New Energy Section
    if (log.energyLevels) {
        const { morning, afternoon, evening, night } = log.energyLevels;
        text += `• Energy: M:${morning || '-'} A:${afternoon || '-'} E:${evening || '-'} N:${night || '-'}\n`;
    }
    if (meals.length > 0) text += `• Meals: ${meals.join(', ')} ${log.meals.notes ? `(${log.meals.notes})` : ''}\n`;
    if (log.junkFood > 0) text += `• Junk Food: ${log.junkFood} serving(s) ${log.junkFoodNotes ? `(${log.junkFoodNotes})` : ''}\n`;
    text += `• Screen Time: ${log.screenTimeHours}h ${log.screenTimeMinutes}m ${log.screenTimeNotes ? `(${log.screenTimeNotes})` : ''}\n`;
    text += `• Wellness: Mood ${log.mood}/10, Peace ${log.peaceLevel}/10. Nutrition: ${log.nutritionScore}.\n`;
    text += `• Progress: ${log.goalsCompleted}% of goals met. ${log.goalText ? `Target: ${log.goalText}` : ''}\n`;
    if (log.achievement) text += `• Achievement: ${log.achievement}\n`;
    if (log.newLearning) text += `• Learning: ${log.newLearning}\n`;
    if (log.gratitude) text += `• Gratitude: ${log.gratitude}\n`;
    if (log.journal) text += `• Journal: ${log.journal}\n`;
    if (log.redeemedRewards?.length > 0) text += `• Rewards Redeemed: ${log.redeemedRewards.map(r => r.name).join(', ')}\n`;

    return text.trim();
};

export const calculateActivityStreak = (logs: DailyLog[], type: 'water' | 'study' | 'exercise' | 'skincare' | 'screenTime' | 'sleep' | 'meals' | 'journaling', settings: AppSettings, todayStr: string): number => {
    const checkLog = (log: DailyLog) => {
        switch (type) {
            case 'water':
                const water = log.waterEntries.reduce((a, c) => a + c.amount, 0);
                return water >= settings.waterTarget;
            case 'study':
                const study = log.studySessions.reduce((a, c) => a + c.duration, 0);
                return study >= 60; // 1 hour
            case 'exercise':
                const exercise = log.exerciseEntries.reduce((a, c) => a + c.duration, 0);
                return exercise >= 15; // 15 mins
            case 'skincare':
                return log.skincare.morning && log.skincare.afternoon && log.skincare.night;
            case 'screenTime':
                const screen = log.screenTimeHours + log.screenTimeMinutes / 60;
                return screen < 4; // < 4 hours
            case 'sleep':
                const sleep = log.sleepHours + log.sleepMinutes / 60;
                return sleep >= 5 && sleep <= 7; // 5 to 7 hours
            case 'meals':
                const meals = [log.meals.breakfast, log.meals.lunch, log.meals.dinner].filter(Boolean).length;
                return meals >= 2; // At least 2 meals
            case 'journaling':
                const textLen = (log.journal || "").length + (log.gratitude || "").length;
                return textLen > 100; // > 100 chars
            default:
                return false;
        }
    };

    let streak = 0;
    const todayLog = logs.find(l => l.date === todayStr);
    
    // Use current date object for iteration
    let currentCheckDate = new Date();
    
    const toDateStr = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // If today is completed, streak includes today.
    if (todayLog && checkLog(todayLog)) {
        streak++;
        currentCheckDate.setDate(currentCheckDate.getDate() - 1);
    } else {
        // If not today, check yesterday for grace
        const yesterday = new Date(todayStr);
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = toDateStr(yesterday);
        const yLog = logs.find(l => l.date === yStr);
        if (yLog && checkLog(yLog)) {
            currentCheckDate.setDate(currentCheckDate.getDate() - 1);
        } else {
            return 0;
        }
    }

    while (true) {
        const dateStr = toDateStr(currentCheckDate);
        const log = logs.find(l => l.date === dateStr);
        if (log && checkLog(log)) {
            streak++;
            currentCheckDate.setDate(currentCheckDate.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
};
