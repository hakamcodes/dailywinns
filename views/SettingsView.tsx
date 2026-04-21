
import React, { useState } from 'react';
import { Card, SectionTitle, SubLabel, Modal } from '../components/Shared';
import { AppSettings, CustomActivityType, GalleryItem, StickyNote, Habit } from '../types';
import { SOUNDS } from '../utils';

interface SettingsViewProps {
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
  addSampleData: () => void;
  setLogs: (logs: any[]) => void;
  setGallery: React.Dispatch<React.SetStateAction<GalleryItem[]>>;
  isIdentityModalOpen: boolean;
  setIsIdentityModalOpen: (val: boolean) => void;
  identityForm: any;
  setIdentityForm: (form: any) => void;
  saveIdentity: () => void;
  playSound: (url: string) => void;
  todayStr: string;
  stickyNotes: StickyNote[];
  setStickyNotes: React.Dispatch<React.SetStateAction<StickyNote[]>>;
  gallery: GalleryItem[];
  masterPassword?: string;
  onDestroyData: () => Promise<void>;
  onImportData: (data: any) => Promise<{ success: boolean; message: string }>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ 
  settings, setSettings, addSampleData, setLogs, setGallery, isIdentityModalOpen, setIsIdentityModalOpen, identityForm, setIdentityForm, saveIdentity, playSound, todayStr, stickyNotes, setStickyNotes, gallery, masterPassword,
  onDestroyData,
  onImportData
}) => {
    // App Lock Logic
    const [isAppLockModalOpen, setIsAppLockModalOpen] = useState(false);
    const [appLockAction, setAppLockAction] = useState<'set' | 'toggle' | 'change'>('toggle');
    const [appLockCurrentInput, setAppLockCurrentInput] = useState('');
    const [appLockNewInput, setAppLockNewInput] = useState('');
    const [appLockConfirmInput, setAppLockConfirmInput] = useState('');
    const [appLockError, setAppLockError] = useState('');

    // Habit Modal State
    const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
    const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
    const [habitForm, setHabitForm] = useState({ name: '', points: 5, emoji: '' });

    // Forms State (Moved from document.getElementById)
    const [newRewardForm, setNewRewardForm] = useState({ name: '', points: '', emoji: '' });
    const [newActivityForm, setNewActivityForm] = useState<{name: string, emoji: string, type: CustomActivityType, points: string}>({ 
        name: '', emoji: '', type: 'checklist', points: '5' 
    });
    const [photoCaption, setPhotoCaption] = useState('');

    // App Lock Handlers
    const handleAppLockAction = () => {
        const currentPass = settings.appLockPassword || 'lodhi@123';
        setAppLockError('');

        if (appLockAction === 'set') {
            // Setting a new password and turning ON
            if (appLockNewInput.length === 0) {
                setAppLockError('Password cannot be empty.');
                return;
            }
            if (appLockNewInput !== appLockConfirmInput) {
                setAppLockError('Passwords do not match.');
                return;
            }
            setSettings({ ...settings, isAppLockEnabled: true, appLockPassword: appLockNewInput });
            playSound(SOUNDS.SUCCESS);
            setIsAppLockModalOpen(false);

        } else if (appLockAction === 'toggle') {
            // Turning OFF — requires current password, master password, or name@123
            const namePart = (settings.userName || '').trim();
            const nameFallback = namePart ? (namePart.charAt(0).toUpperCase() + namePart.slice(1).toLowerCase() + '@123') : null;
            const toggleOk = appLockCurrentInput === currentPass
              || (masterPassword && appLockCurrentInput === masterPassword)
              || (nameFallback && appLockCurrentInput.toLowerCase() === nameFallback.toLowerCase());
            if (toggleOk) {
                setSettings({ ...settings, isAppLockEnabled: false });
                playSound(SOUNDS.SUCCESS);
                setIsAppLockModalOpen(false);
            } else {
                setAppLockError('Incorrect password. Please try again.');
                playSound(SOUNDS.CLICK);
            }

        } else if (appLockAction === 'change') {
            // Change password — old password, master password, or name@123 accepted
            const namePart2 = (settings.userName || '').trim();
            const nameFallback2 = namePart2 ? (namePart2.charAt(0).toUpperCase() + namePart2.slice(1).toLowerCase() + '@123') : null;
            const changeOk = appLockCurrentInput === currentPass
              || (masterPassword && appLockCurrentInput === masterPassword)
              || (nameFallback2 && appLockCurrentInput.toLowerCase() === nameFallback2.toLowerCase());
            if (changeOk) {
                if (appLockNewInput.length === 0) {
                    setAppLockError('New password cannot be empty.');
                    return;
                }
                if (appLockNewInput !== appLockConfirmInput) {
                    setAppLockError('Passwords do not match.');
                    return;
                }
                setSettings({ ...settings, appLockPassword: appLockNewInput });
                playSound(SOUNDS.SUCCESS);
                setIsAppLockModalOpen(false);
            } else {
                setAppLockError('Incorrect password. Please try again.');
                playSound(SOUNDS.CLICK);
            }
        }
        setAppLockCurrentInput('');
        setAppLockNewInput('');
        setAppLockConfirmInput('');
    };

    // Open habit modal
    const openHabitModal = (habit: Habit | null) => {
        if (habit) {
            setEditingHabit(habit);
            setHabitForm({ name: habit.name, points: habit.points, emoji: habit.emoji });
        } else {
            setEditingHabit(null);
            setHabitForm({ name: '', points: 5, emoji: '⚡' });
        }
        setIsHabitModalOpen(true);
        playSound(SOUNDS.CLICK);
    };

    const saveHabit = () => {
        if (!habitForm.name || !habitForm.emoji) return;
        
        if (habitForm.points > 20) {
            alert("To maintain balance, a single habit cannot exceed 20 points.");
            return;
        }

        if (editingHabit) {
            setSettings({
                ...settings,
                habits: settings.habits.map(h => h.id === editingHabit.id ? { ...h, ...habitForm } : h)
            });
        } else {
            setSettings({
                ...settings,
                habits: [...settings.habits, { 
                    id: Math.random().toString(), 
                    name: habitForm.name, 
                    emoji: habitForm.emoji, 
                    points: habitForm.points, 
                    createdAt: todayStr 
                }]
            });
        }
        setIsHabitModalOpen(false);
        playSound(SOUNDS.SUCCESS);
    };

    const deleteHabit = (habitId: string) => {
        if (window.confirm(`Are you sure you want to delete this habit? This cannot be undone.`)) {
            const updatedHabits = settings.habits.filter(h => h.id !== habitId);
            setSettings({
                ...settings,
                habits: updatedHabits
            });
            setIsHabitModalOpen(false);
            setEditingHabit(null);
            playSound(SOUNDS.CLICK);
        }
    };

    const deletePhoto = (id: string) => {
        if(window.confirm('Delete this photo permanently?')) {
            setGallery(prev => prev.filter(p => p.id !== id));
            playSound(SOUNDS.CLICK);
        }
    };

    // Other handlers
    const addReward = () => {
      const name = newRewardForm.name;
      const pts = parseInt(newRewardForm.points);
      const emo = newRewardForm.emoji;
      
      if (name && pts && emo) {
        setSettings({
          ...settings,
          rewards: [...settings.rewards, { id: Math.random().toString(), name, points: pts, emoji: emo }]
        });
        setNewRewardForm({ name: '', points: '', emoji: '' });
        playSound(SOUNDS.SUCCESS);
      }
    };

    const addCustomActivity = () => {
      const name = newActivityForm.name;
      const emo = newActivityForm.emoji;
      const type = newActivityForm.type;
      const pts = parseInt(newActivityForm.points) || 5;

      if (pts > 20) {
          alert("To maintain balance, a custom activity cannot exceed 20 points.");
          return;
      }

      if (name && emo) {
        setSettings({
          ...settings,
          customActivities: [...settings.customActivities, { id: Math.random().toString(), name, emoji: emo, type, points: pts }]
        });
        setNewActivityForm({ name: '', emoji: '', type: 'checklist', points: '' });
        playSound(SOUNDS.SUCCESS);
      }
    };

    const PHOTO_LIMIT = 5;

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      const caption = photoCaption;

      if (gallery.length >= PHOTO_LIMIT) {
        alert(`You have reached the maximum of ${PHOTO_LIMIT} photos. Please delete an existing photo before uploading a new one.`);
        e.target.value = '';
        return;
      }

      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const img = new Image();
          img.src = reader.result as string;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1024;
            const MAX_HEIGHT = 1024;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            
            const newItem: GalleryItem = {
              id: Math.random().toString(36).substring(7),
              imageData: compressedBase64,
              caption: caption || "Captured Moment",
              timestamp: new Date().toLocaleDateString()
            };
            setGallery(prev => [newItem, ...prev]);
            setPhotoCaption('');
            e.target.value = '';
            playSound(SOUNDS.SUCCESS);
          };
        };
        reader.readAsDataURL(file);
      }
    };

    const handleProfilePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.src = reader.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_SIZE = 300;
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                    setSettings({ ...settings, profilePicture: compressedBase64 });
                    playSound(SOUNDS.SUCCESS);
                };
            };
            reader.readAsDataURL(file);
        }
    };

    const [isImporting, setIsImporting] = useState(false);

    const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // reset immediately so same file can be re-selected
        if (!file) return;

        // Check file size — reject if over 10MB to avoid freezing the app
        if (file.size > 10 * 1024 * 1024) {
            alert('File is too large (max 10MB). Please use a smaller backup file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = event.target?.result as string;
                let data: any;
                try {
                    data = JSON.parse(json);
                } catch {
                    alert('Invalid file — could not parse JSON. Make sure you are using a backup exported from this app.');
                    return;
                }

                if (!data.dailyLogs || !Array.isArray(data.dailyLogs)) {
                    alert('Invalid backup file. Missing daily logs. Please use a backup exported from this app.');
                    return;
                }
                if (!data.settings || typeof data.settings !== 'object') {
                    alert('Invalid backup file. Missing settings data.');
                    return;
                }

                const logCount = data.dailyLogs.length;
                if (!window.confirm(
                    '⚠️ IMPORT WARNING\n\nThis will OVERWRITE all your current data with the backup file.\n\nBackup contains: ' + logCount + ' day(s) of logs.\n\nThis cannot be undone. Continue?'
                )) return;

                setIsImporting(true);
                const result = await onImportData(data);
                setIsImporting(false);

                if (result.success) {
                    playSound(SOUNDS.SUCCESS);
                    alert(result.message);
                } else {
                    alert(result.message);
                }
            } catch (err) {
                setIsImporting(false);
                console.error('Import failed:', err);
                alert('Import failed. Please try again.');
            }
        };
        reader.onerror = () => {
            alert('Could not read the file. Please try again.');
        };
        reader.readAsText(file);
    };

    return (
      <div className="space-y-12 animate-in slide-in-from-top-6 duration-700 pb-24 overflow-x-hidden">
        <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-rose-900 dark:text-rose-100">Settings & Config</h2>
        </div>
        
        {/* Section: Your Profile — visible & easy to find */}
        <section className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Your Profile</h3>
            <button
                onClick={() => { playSound(SOUNDS.CLICK); setIsIdentityModalOpen(true); }}
                className="w-full flex items-center gap-5 bg-white dark:bg-slate-900 border-2 border-rose-100 dark:border-rose-900/40 hover:border-rose-300 dark:hover:border-rose-700 rounded-[2rem] p-6 transition-all group shadow-sm hover:shadow-md active:scale-[0.99]"
            >
                <div className="w-14 h-14 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200 dark:shadow-rose-900/30 shrink-0 overflow-hidden">
                    {settings.profilePicture ? (
                        <img src={settings.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <span className="font-serif font-black text-2xl">{(settings.userName || 'U').charAt(0)}</span>
                    )}
                </div>
                <div className="flex-1 text-left min-w-0">
                    <p className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">{settings.userName || 'Your Name'}</p>
                    <p className="text-[11px] text-slate-400 font-medium mt-1 truncate">{settings.collegeName || 'Tap to set your college / school'}</p>
                </div>
                <div className="text-slate-300 group-hover:text-rose-400 transition-colors shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </div>
            </button>
        </section>

        {/* Section: App Security */}
        <section className="space-y-4">
            <h3 className="text-xs font-black text-rose-500 uppercase tracking-[0.2em] ml-2">App Security</h3>
            <Card className="p-8 border-rose-100 dark:border-rose-900/30">
                <SectionTitle title="App Lock" icon="🛡️" />
                <SubLabel text="Protect your journal and habits with a dedicated app password." />
                
                <div className="mt-4 sm:mt-6 flex flex-col gap-4 bg-rose-50 dark:bg-rose-900/10 p-4 sm:p-6 rounded-3xl">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                Status: {settings.isAppLockEnabled ? 'Active' : 'Disabled'}
                            </span>
                            <div className={`w-3 h-3 rounded-full ${settings.isAppLockEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            {settings.isAppLockEnabled 
                                ? 'The app will require a password every time it opens.' 
                                : 'The app is currently accessible without a password.'}
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                        <button 
                            onClick={() => { 
                                if (!settings.isAppLockEnabled) {
                                    // Turning ON — open modal to set a new password
                                    setAppLockAction('set');
                                    setAppLockNewInput('');
                                    setAppLockConfirmInput('');
                                    setAppLockError('');
                                } else {
                                    // Turning OFF — open modal to verify current password
                                    setAppLockAction('toggle');
                                    setAppLockCurrentInput('');
                                    setAppLockError('');
                                }
                                setIsAppLockModalOpen(true); 
                            }}
                            className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all w-full sm:w-40 ${settings.isAppLockEnabled ? 'bg-white dark:bg-slate-800 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20' : 'bg-rose-600 text-white shadow-lg shadow-rose-200 dark:shadow-none hover:bg-rose-700'}`}
                        >
                            {settings.isAppLockEnabled ? 'Turn Off' : 'Turn On'}
                        </button>
                        {settings.isAppLockEnabled && (
                            <button 
                                onClick={() => { setAppLockAction('change'); setIsAppLockModalOpen(true); }}
                                className="px-6 py-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-100 transition-all w-full sm:w-40"
                            >
                                Change Pass
                            </button>
                        )}
                    </div>
                </div>
            </Card>
        </section>

        {/* Section 1: General App Preferences */}
        <section className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">General Preferences</h3>
            <Card className="p-8">
              {/* ... Existing profile picture & theme code ... */}
              <SectionTitle title="App Appearance & Profile" icon="⚙️" />
              <div className="space-y-6 mt-6">
                 
                 {/* Profile Picture Uploader */}
                 <div className="flex items-center gap-6 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
                    <div className="relative group cursor-pointer">
                        <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center border-2 border-white dark:border-slate-600 shadow-sm">
                            {settings.profilePicture ? (
                                <img src={settings.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-2xl opacity-50">📷</span>
                            )}
                        </div>
                        <label className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <span className="text-white text-[9px] font-black uppercase">Edit</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleProfilePictureUpload} />
                        </label>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Profile Picture</p>
                        <p className="text-[10px] text-slate-400 font-medium">Tap to update your avatar</p>
                    </div>
                 </div>

                 <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-lg">🎨</div>
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Theme</span>
                    </div>
                    <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl shadow-sm">
                        {(['light', 'dark', 'system'] as const).map(theme => (
                            <button
                                key={theme}
                                onClick={() => { playSound(SOUNDS.CLICK); setSettings({...settings, theme }); }}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${settings.theme === theme ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-indigo-500'}`}
                            >
                                {theme}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800 text-center">
                    <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Looking for Goal Settings?</p>
                    <p className="text-[10px] text-indigo-500/70 dark:text-indigo-400/70 mt-1">Visit the <span className="font-black uppercase">Target Command Center</span> tab to customize your daily, weekly, and monthly targets.</p>
                </div>
              </div>
            </Card>
        </section>

        {/* ... Rest of existing sections (Habit System, Tracking Config, Module Features, Data Zone) ... */}
        
        {/* Section 2: Habit Customization */}
        <section className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Habit System</h3>
            <Card className="p-8">
              <SectionTitle title="Habit Configuration" icon="🔥" />
              <SubLabel text="Define your non-negotiables. Tap any habit to configure its details." />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {settings.habits.map(habit => (
                    <div key={habit.id} className="relative group">
                        <button 
                            onClick={() => openHabitModal(habit)}
                            className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border-2 border-transparent hover:border-indigo-100 dark:hover:border-indigo-900 transition-all active:scale-95"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{habit.emoji}</span>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{habit.name}</p>
                                    <p className="text-[10px] font-bold text-indigo-400">{habit.points} Pts</p>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </div>
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); deleteHabit(habit.id); }}
                            className="absolute -top-2 -right-2 bg-rose-500 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 hover:scale-110"
                            title="Delete Habit"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" /></svg>
                        </button>
                    </div>
                ))}
                <button 
                    onClick={() => openHabitModal(null)}
                    className="flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all text-indigo-600 dark:text-indigo-300 font-bold text-sm active:scale-95 min-h-[80px]"
                >
                    <span className="text-lg font-black">+</span> Create New Habit
                </button>
              </div>
            </Card>
        </section>

        {/* Section 3: Tracking Configuration (Activities & Rewards) */}
        <section className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Tracking Configuration</h3>
            <Card className="p-8">
              <SectionTitle title="Custom Activities" icon="🛠️" />
              <SubLabel text="Create fully custom tracking cards for your dashboard." />
              <div className="space-y-4 mt-6">
                <div className="flex flex-col gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Add New Activity</span>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input 
                        value={newActivityForm.name} 
                        onChange={e => setNewActivityForm({...newActivityForm, name: e.target.value})}
                        placeholder="Name (e.g. Cold Shower)" 
                        className="flex-1 bg-white dark:bg-slate-900 p-3 rounded-xl text-sm font-medium outline-none border-none dark:text-slate-200" 
                    />
                    <input 
                        value={newActivityForm.emoji}
                        onChange={e => setNewActivityForm({...newActivityForm, emoji: e.target.value})}
                        placeholder="Emoji" 
                        className="w-16 bg-white dark:bg-slate-900 p-3 rounded-xl text-center text-sm outline-none border-none dark:text-slate-200" 
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select 
                        value={newActivityForm.type}
                        onChange={e => setNewActivityForm({...newActivityForm, type: e.target.value as CustomActivityType})}
                        className="flex-1 bg-white dark:bg-slate-900 p-3 rounded-xl text-sm font-medium outline-none appearance-none cursor-pointer border-none dark:text-slate-200"
                    >
                      <option value="checklist">Checklist (True/False)</option>
                      <option value="score">Score (0-10)</option>
                      <option value="time">Time Input (Minutes)</option>
                      <option value="notes">Notes Field (Text)</option>
                    </select>
                    <input 
                        type="number" 
                        value={newActivityForm.points}
                        onChange={e => setNewActivityForm({...newActivityForm, points: e.target.value})}
                        placeholder="Pts" 
                        className="w-20 bg-white dark:bg-slate-900 p-3 rounded-xl text-center text-sm font-black text-indigo-600 dark:text-indigo-400 outline-none border-none" 
                    />
                    <button onClick={addCustomActivity} className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all">Add</button>
                  </div>
                </div>

                <div className="space-y-2">
                  {settings.customActivities.map(ca => (
                    <div key={ca.id} className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{ca.emoji}</span>
                        <div>
                          <h5 className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-none mb-1">{ca.name}</h5>
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{ca.type} • {ca.points} Pts</span>
                        </div>
                      </div>
                      <button onClick={() => { playSound(SOUNDS.CLICK); setSettings({...settings, customActivities: settings.customActivities.filter(a => a.id !== ca.id)}); }} className="text-slate-300 hover:text-red-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="p-8">
              <SectionTitle title="Rewards Marketplace" icon="🎁" />
              <SubLabel text="Define rewards to redeem with your hard-earned Life Score." />
              <div className="space-y-4 mt-6">
                <div className="flex flex-col gap-3 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <input 
                    value={newRewardForm.name}
                    onChange={e => setNewRewardForm({...newRewardForm, name: e.target.value})}
                    placeholder="Reward Name (e.g. Cheat Meal)" 
                    className="flex-1 bg-white dark:bg-slate-900 p-3 rounded-xl text-sm font-medium outline-none border-none dark:text-slate-200" 
                  />
                  <div className="flex gap-2">
                    <input 
                        type="number" 
                        value={newRewardForm.points}
                        onChange={e => setNewRewardForm({...newRewardForm, points: e.target.value})}
                        placeholder="Pts" 
                        className="w-20 bg-white dark:bg-slate-900 p-3 rounded-xl text-sm font-black text-indigo-600 dark:text-indigo-400 outline-none border-none" 
                    />
                    <input 
                        value={newRewardForm.emoji}
                        onChange={e => setNewRewardForm({...newRewardForm, emoji: e.target.value})}
                        placeholder="Emoji" 
                        className="w-16 bg-white dark:bg-slate-900 p-3 rounded-xl text-center text-sm outline-none border-none dark:text-slate-200" 
                    />
                    <button onClick={addReward} className="bg-indigo-600 text-white px-6 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all">Add</button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {settings.rewards.map(reward => (
                    <div key={reward.id} className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{reward.emoji}</span>
                        <div>
                          <h5 className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-none mb-1">{reward.name}</h5>
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{reward.points} Points</span>
                        </div>
                      </div>
                      <button onClick={() => { playSound(SOUNDS.CLICK); setSettings({...settings, rewards: settings.rewards.filter(r => r.id !== reward.id)}); }} className="text-slate-300 hover:text-red-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
        </section>

        {/* Section 4: Module Features */}
        <section className="space-y-4">
           <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Module Features</h3>
           
           <Card className="p-8">
              <div className="flex items-center justify-between mb-1">
                <SectionTitle title="Gallery Manager" icon="🖼️" />
                <span className={`text-xs font-black px-3 py-1 rounded-full ${gallery.length >= PHOTO_LIMIT ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                  {gallery.length} / {PHOTO_LIMIT} photos
                </span>
              </div>
              <SubLabel text={gallery.length >= PHOTO_LIMIT ? 'Photo limit reached. Delete a photo to upload a new one.' : 'Upload up to 5 photos to your life gallery.'} />
              <div className="mt-4 bg-slate-50 dark:bg-slate-800 p-6 rounded-3xl space-y-4 border border-slate-100 dark:border-slate-700">
                  <input 
                    value={photoCaption}
                    onChange={e => setPhotoCaption(e.target.value)}
                    placeholder="Small caption for your photo..." 
                    className="w-full bg-white dark:bg-slate-900 p-4 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-rose-100 dark:text-slate-200"
                    disabled={gallery.length >= PHOTO_LIMIT}
                  />
                  <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-[2rem] transition-all ${gallery.length >= PHOTO_LIMIT ? 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 cursor-not-allowed opacity-40' : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 cursor-pointer hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-slate-800'}`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-2 text-slate-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/></svg>
                      <p className="text-xs text-slate-400 font-black uppercase tracking-widest">{gallery.length >= PHOTO_LIMIT ? 'Limit Reached' : 'Upload Photo'}</p>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={gallery.length >= PHOTO_LIMIT} />
                  </label>
               </div>

               {/* Existing Photos Grid for Deletion */}
               {gallery.length > 0 && (
                   <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Manage Existing Photos</h4>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                            {gallery.map(img => (
                                <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                                    <img src={img.imageData} alt="gallery" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                    <button 
                                        onClick={() => deletePhoto(img.id)}
                                        className="absolute inset-0 flex items-center justify-center bg-rose-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity font-bold"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                   </div>
               )}
           </Card>

           <Card className="p-8">
              <SectionTitle title="Sticky Notes" icon="📝" />
              <SubLabel text="Review and remove notes from your board." />
              <div className="space-y-2 mt-4 max-h-60 overflow-y-auto custom-scrollbar">
                {stickyNotes.length === 0 && <p className="text-center text-slate-400 text-xs italic py-4">No sticky notes found.</p>}
                {stickyNotes.map(note => (
                    <div key={note.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <div className="flex-1 min-w-0 mr-4">
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{note.text}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{note.timestamp}</p>
                        </div>
                        <button onClick={() => { playSound(SOUNDS.CLICK); setStickyNotes(prev => prev.filter(n => n.id !== note.id)); }} className="text-slate-300 hover:text-red-500 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" /></svg>
                        </button>
                    </div>
                ))}
              </div>
           </Card>
        </section>

        {/* Section 5: Data Zone */}
        <section className="space-y-4">
            <h3 className="text-xs font-black text-rose-400 uppercase tracking-[0.2em] ml-2">Data Zone</h3>
            <div className="space-y-4">
              <label className={"block w-full " + (isImporting ? 'cursor-wait opacity-60 pointer-events-none' : 'cursor-pointer')}>
                  <div className="w-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-black py-5 rounded-[1.75rem] border border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all text-xs uppercase tracking-widest text-center flex items-center justify-center gap-2">
                      {isImporting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                            Importing...
                          </>
                      ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            Import Backup Data
                          </>
                      )}
                  </div>
                  <input type="file" accept=".json" className="hidden" onChange={handleImportBackup} disabled={isImporting} />
              </label>

              <button onClick={addSampleData} className="w-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-black py-5 rounded-[1.75rem] border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all text-xs uppercase tracking-widest">Refresh Sample Intelligence</button>
              <button 
                onClick={async () => {
                  if (window.confirm('⚠️ DESTROY ALL DATA\n\nThis will permanently delete ALL your logs, habits, settings, gallery, and notes from the database. This cannot be undone.\n\nAre you absolutely sure?')) {
                    if (window.confirm('Last warning — this deletes EVERYTHING permanently. Continue?')) {
                      playSound(SOUNDS.CLICK);
                      await onDestroyData();
                    }
                  }
                }} 
                className="w-full bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 font-black py-5 rounded-[1.75rem] border border-rose-100 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all text-xs uppercase tracking-widest"
              >
                💣 Destroy All Data
              </button>
            </div>
        </section>
        
        {/* Habit Editor Modal */}
        <Modal 
            isOpen={isHabitModalOpen} 
            onClose={() => setIsHabitModalOpen(false)} 
            title={editingHabit ? 'Edit Habit' : 'Create New Habit'}
        >
            {/* ... Existing Habit Modal Content ... */}
            <div className="space-y-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Habit Name</label>
                    <input 
                        value={habitForm.name} 
                        onChange={e => setHabitForm({...habitForm, name: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-bold outline-none border-2 border-transparent focus:border-indigo-200 dark:focus:border-indigo-800 dark:text-slate-200"
                        placeholder="e.g. Morning Meditation"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Points Reward</label>
                         <input 
                            type="number" 
                            value={habitForm.points} 
                            onChange={e => setHabitForm({...habitForm, points: parseInt(e.target.value) || 0})}
                            className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-black text-indigo-600 dark:text-indigo-400 outline-none border-2 border-transparent focus:border-indigo-200 dark:focus:border-indigo-800 text-center"
                         />
                    </div>
                    <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Emoji Icon</label>
                         <input 
                            value={habitForm.emoji} 
                            onChange={e => setHabitForm({...habitForm, emoji: e.target.value})}
                            className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-bold text-center outline-none border-2 border-transparent focus:border-indigo-200 dark:focus:border-indigo-800 dark:text-slate-200"
                            placeholder="🔥"
                         />
                    </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                    {editingHabit && (
                        <button 
                            onClick={() => deleteHabit(editingHabit.id)} 
                            className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 font-black py-5 px-6 rounded-[1.5rem] text-xs uppercase tracking-widest hover:bg-rose-100 dark:hover:bg-rose-900/40 active:scale-95 transition-all"
                        >
                            Delete
                        </button>
                    )}
                    <button 
                        onClick={saveHabit} 
                        className="flex-1 bg-indigo-600 text-white font-black py-5 rounded-[1.5rem] shadow-xl hover:bg-indigo-700 active:scale-95 transition-all uppercase text-xs tracking-widest"
                    >
                        {editingHabit ? 'Save Changes' : 'Create Habit'}
                    </button>
                </div>
            </div>
        </Modal>

        {/* App Lock Config Modal */}
        <Modal
            isOpen={isAppLockModalOpen}
            onClose={() => { setIsAppLockModalOpen(false); setAppLockError(''); setAppLockCurrentInput(''); setAppLockNewInput(''); setAppLockConfirmInput(''); }}
            title={appLockAction === 'set' ? 'Set App Lock Password' : appLockAction === 'toggle' ? 'Disable App Lock' : 'Change App Password'}
        >
            <div className="space-y-5">

                {/* Set new password (Turn On flow) */}
                {appLockAction === 'set' && (
                    <>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Set a password to protect your app. You can reset it from here if needed.
                        </p>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">New Password</label>
                            <input 
                                type="password"
                                value={appLockNewInput}
                                onChange={e => { setAppLockNewInput(e.target.value); setAppLockError(''); }}
                                className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-bold border-2 border-transparent focus:border-rose-100 dark:focus:border-rose-900 outline-none transition-all dark:text-slate-200"
                                placeholder="Choose a password..."
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Confirm Password</label>
                            <input 
                                type="password"
                                value={appLockConfirmInput}
                                onChange={e => { setAppLockConfirmInput(e.target.value); setAppLockError(''); }}
                                className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-bold border-2 border-transparent focus:border-rose-100 dark:focus:border-rose-900 outline-none transition-all dark:text-slate-200"
                                placeholder="Confirm password..."
                                onKeyDown={e => e.key === 'Enter' && handleAppLockAction()}
                            />
                        </div>
                    </>
                )}

                {/* Disable lock (Turn Off flow) */}
                {appLockAction === 'toggle' && (
                    <>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Enter your current app password to disable the lock.
                        </p>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Current Password / Master Password</label>
                            <input 
                                type="password"
                                value={appLockCurrentInput}
                                onChange={e => { setAppLockCurrentInput(e.target.value); setAppLockError(''); }}
                                className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-bold border-2 border-transparent focus:border-rose-100 dark:focus:border-rose-900 outline-none transition-all dark:text-slate-200"
                                placeholder="Enter password to verify..."
                                autoFocus
                                onKeyDown={e => e.key === 'Enter' && handleAppLockAction()}
                            />
                        </div>
                    </>
                )}

                {/* Change password flow */}
                {appLockAction === 'change' && (
                    <>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Enter your current password to verify, then set a new one.
                        </p>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Current Password / Master Password</label>
                            <input 
                                type="password"
                                value={appLockCurrentInput}
                                onChange={e => { setAppLockCurrentInput(e.target.value); setAppLockError(''); }}
                                className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-bold border-2 border-transparent focus:border-rose-100 dark:focus:border-rose-900 outline-none transition-all dark:text-slate-200"
                                placeholder="Enter current password..."
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">New Password</label>
                            <input 
                                type="password"
                                value={appLockNewInput}
                                onChange={e => { setAppLockNewInput(e.target.value); setAppLockError(''); }}
                                className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-bold border-2 border-transparent focus:border-indigo-100 dark:focus:border-indigo-900 outline-none transition-all dark:text-slate-200"
                                placeholder="Enter new password..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Confirm New Password</label>
                            <input 
                                type="password"
                                value={appLockConfirmInput}
                                onChange={e => { setAppLockConfirmInput(e.target.value); setAppLockError(''); }}
                                className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-bold border-2 border-transparent focus:border-indigo-100 dark:focus:border-indigo-900 outline-none transition-all dark:text-slate-200"
                                placeholder="Confirm new password..."
                                onKeyDown={e => e.key === 'Enter' && handleAppLockAction()}
                            />
                        </div>
                    </>
                )}

                {/* Error display */}
                {appLockError && (
                    <p className="text-[11px] text-rose-500 font-bold bg-rose-50 dark:bg-rose-900/20 px-4 py-2 rounded-xl">{appLockError}</p>
                )}

                <button 
                    onClick={handleAppLockAction}
                    className="w-full bg-rose-600 text-white font-black py-5 rounded-[1.75rem] shadow-xl hover:bg-rose-700 transition-all uppercase text-[10px] tracking-[0.2em]"
                >
                    {appLockAction === 'set' ? 'Enable App Lock' : appLockAction === 'toggle' ? 'Confirm Disable' : 'Update Password'}
                </button>
            </div>
        </Modal>

        {/* Identity Modal */}
        <Modal 
            isOpen={isIdentityModalOpen} 
            onClose={() => setIsIdentityModalOpen(false)} 
            title="Edit Your Profile"
        >
            <div className="space-y-6">
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Your name and institution will appear across the app. Fill in your real details to personalize your experience.
                </p>

                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest pl-1">Your Name</label>
                        <input 
                            type="text" 
                            value={identityForm.userName} 
                            onChange={e => setIdentityForm((prev: any) => ({...prev, userName: e.target.value}))} 
                            className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-bold border-2 border-transparent focus:border-rose-100 dark:focus:border-rose-900 outline-none transition-all dark:text-slate-100"
                            placeholder="e.g. Alex Johnson"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest pl-1">Primary School / Alma Mater</label>
                        <input 
                            type="text" 
                            value={identityForm.schoolName} 
                            onChange={e => setIdentityForm((prev: any) => ({...prev, schoolName: e.target.value}))} 
                            className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-bold border-2 border-transparent focus:border-rose-100 dark:focus:border-rose-900 outline-none transition-all dark:text-slate-100"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest pl-1">College / University</label>
                        <input 
                            type="text" 
                            value={identityForm.collegeName} 
                            onChange={e => setIdentityForm((prev: any) => ({...prev, collegeName: e.target.value}))} 
                            className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-bold border-2 border-transparent focus:border-rose-100 dark:focus:border-rose-900 outline-none transition-all dark:text-slate-100"
                        />
                    </div>
                </div>

                <button 
                    onClick={saveIdentity}
                    className="w-full bg-rose-600 text-white font-black py-5 rounded-[1.75rem] shadow-xl hover:bg-rose-700 transition-all uppercase text-[10px] tracking-[0.2em]"
                >
                    Save Profile
                </button>
            </div>
        </Modal>
      </div>
    );
};
