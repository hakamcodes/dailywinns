
import React from 'react';
import { Modal } from '../components/Shared';
import { StickyNote } from '../types';
import { NOTE_THEMES, SOUNDS } from '../utils';

interface StickyNotesViewProps {
  stickyNotes: StickyNote[];
  setStickyNotes: React.Dispatch<React.SetStateAction<StickyNote[]>>;
  openStickyEditor: (note?: StickyNote) => void;
  isNoteEditorOpen: boolean;
  setIsNoteEditorOpen: (val: boolean) => void;
  editingNote: StickyNote | null;
  noteContent: string;
  setNoteContent: (content: string) => void;
  noteColor: string;
  setNoteColor: (color: string) => void;
  saveStickyNote: () => void;
  deleteStickyNote: (id: string) => void;
  playSound: (url: string) => void;
}

export const StickyNotesView: React.FC<StickyNotesViewProps> = ({ 
  stickyNotes, setStickyNotes, openStickyEditor, isNoteEditorOpen, setIsNoteEditorOpen, 
  editingNote, noteContent, setNoteContent, noteColor, setNoteColor, saveStickyNote, deleteStickyNote, playSound 
}) => {
    return (
      <div className="space-y-8 animate-in slide-in-from-right-6 duration-700 pb-24">
        <div className="flex justify-between items-center px-2">
            <h2 className="text-3xl font-serif font-bold text-rose-900 dark:text-rose-100">Sticky Notes</h2>
            <button 
                onClick={() => openStickyEditor()}
                className="flex items-center gap-2 bg-indigo-600 px-6 py-3 rounded-2xl shadow-lg shadow-indigo-100 dark:shadow-none text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                New Thought
            </button>
        </div>

        {stickyNotes.length === 0 ? (
            <div className="p-20 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-rose-100 dark:border-rose-900 flex flex-col items-center gap-6">
                <div className="text-6xl grayscale opacity-20">✍️</div>
                <p className="text-slate-400 font-medium italic">Your board is empty. Start capturing tiny ideas or important reminders.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-1">
                {stickyNotes.map(note => {
                    const theme = NOTE_THEMES.find(t => t.name === note.color) || NOTE_THEMES[0];
                    return (
                        <div 
                            key={note.id} 
                            onClick={() => openStickyEditor(note)}
                            className={`${theme.bg} ${theme.border} border-2 rounded-[2.5rem] p-8 shadow-sm hover:shadow-md transition-all cursor-pointer group relative min-h-[260px] flex flex-col transform hover:-rotate-1 active:scale-95`}
                        >
                            <p className={`${theme.text} text-xl font-medium leading-relaxed flex-1 whitespace-pre-wrap`}>
                                {note.text}
                            </p>
                            <div className="mt-6 pt-4 border-t border-black/5 flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
                                <span className={`${theme.text} text-[10px] font-black uppercase tracking-widest`}>{note.timestamp}</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}

        <Modal isOpen={isNoteEditorOpen} onClose={() => setIsNoteEditorOpen(false)} title={editingNote ? 'Refine Note' : 'Capture New Thought'}>
            <div className="space-y-8">
                <textarea 
                    value={noteContent}
                    onChange={e => setNoteContent(e.target.value)}
                    placeholder="Type your thought here..."
                    className="w-full bg-slate-50 dark:bg-slate-800 p-8 rounded-[2.5rem] text-lg font-medium min-h-[320px] outline-none border-2 border-transparent focus:border-rose-100 dark:focus:border-rose-900 transition-all resize-none custom-scrollbar leading-relaxed dark:text-slate-100 dark:placeholder:text-slate-500"
                    autoFocus
                />
                
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-4">Note Color Theme</label>
                    <div className="flex gap-4 px-2">
                        {NOTE_THEMES.map(theme => (
                            <button 
                                key={theme.name}
                                onClick={() => { playSound(SOUNDS.CLICK); setNoteColor(theme.name); }}
                                className={`w-12 h-12 rounded-full border-4 transition-all ${theme.bg} ${noteColor === theme.name ? `border-indigo-500 ring-4 ${theme.ring}` : 'border-transparent hover:scale-110'}`}
                            />
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {editingNote && (
                        <button 
                            onClick={() => { deleteStickyNote(editingNote.id); setIsNoteEditorOpen(false); }}
                            className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 font-black py-5 rounded-[2rem] text-xs uppercase tracking-widest hover:bg-rose-100 dark:hover:bg-rose-900/40 active:scale-95 transition-all"
                        >
                            Trash It
                        </button>
                    )}
                    <button 
                        onClick={saveStickyNote}
                        className={`bg-indigo-600 text-white font-black py-5 rounded-[2rem] shadow-xl hover:bg-indigo-700 active:scale-95 transition-all uppercase text-xs tracking-widest ${!editingNote ? 'col-span-2' : ''}`}
                    >
                        {editingNote ? 'Update Board' : 'Stick to Board'}
                    </button>
                </div>
            </div>
        </Modal>
      </div>
    );
};
