
import React from 'react';
import { GalleryItem } from '../types';
import { SOUNDS } from '../utils';

interface GalleryViewProps {
  gallery: GalleryItem[];
  setGallery: React.Dispatch<React.SetStateAction<GalleryItem[]>>;
  selectedGalleryItem: GalleryItem | null;
  setSelectedGalleryItem: (item: GalleryItem | null) => void;
  playSound: (url: string) => void;
  setView: (view: any) => void;
}

export const GalleryView: React.FC<GalleryViewProps> = ({ 
  gallery, setGallery, selectedGalleryItem, setSelectedGalleryItem, playSound, setView 
}) => {
    return (
      <div className="space-y-8 animate-in slide-in-from-right-6 duration-700 pb-24">
        <div className="flex justify-between items-center px-2">
            <div>
                <h2 className="text-3xl font-serif font-bold text-rose-900 dark:text-rose-100">Life Gallery</h2>
                <p className={`text-xs font-bold mt-1 ${gallery.length >= 5 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {gallery.length} / 5 photos used
                </p>
            </div>
            <button 
                onClick={() => { playSound(SOUNDS.CLICK); setView('settings'); }}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 ${gallery.length >= 5 ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 shadow-lg shadow-indigo-100 dark:shadow-none text-white hover:bg-indigo-700'}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                {gallery.length >= 5 ? 'Limit Reached' : 'Upload Photo'}
            </button>
        </div>

        {gallery.length === 0 ? (
            <div className="p-20 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-rose-100 dark:border-rose-900 flex flex-col items-center gap-6">
                <div className="text-6xl grayscale opacity-20">📸</div>
                <p className="text-slate-400 font-medium italic">Your gallery is empty. Head to settings to upload your favorite moments.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-4 sm:gap-8 px-1">
                {gallery.map(item => (
                    <div key={item.id} className="group relative bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                        <div 
                          className="aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer"
                          onClick={() => { playSound(SOUNDS.CLICK); setSelectedGalleryItem(item); }}
                        >
                           <img 
                            src={item.imageData} 
                            alt={item.caption} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                           />
                        </div>
                        <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent translate-y-2 group-hover:translate-y-0 transition-transform duration-500 pointer-events-none">
                           <p className="text-white text-lg font-serif font-bold mb-1">{item.caption}</p>
                           <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">{item.timestamp}</p>
                        </div>
                        <button 
                            onClick={() => {
                                if (window.confirm('Remove this memory?')) {
                                    setGallery(prev => prev.filter(p => p.id !== item.id));
                                    playSound(SOUNDS.CLICK);
                                }
                            }}
                            className="absolute top-6 right-6 p-3 bg-white/20 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" /></svg>
                        </button>
                    </div>
                ))}
            </div>
        )}

        {/* Gallery Image Preview Modal */}
        {selectedGalleryItem && (
          <div 
            className="fixed inset-0 z-[1000] bg-black/95 flex flex-col items-center justify-center p-4 md:p-12 no-print animate-in fade-in duration-300"
            onClick={() => setSelectedGalleryItem(null)}
          >
             <button 
                className="absolute top-8 right-8 p-4 text-white hover:bg-white/10 rounded-full transition-colors"
                onClick={() => setSelectedGalleryItem(null)}
             >
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
             
             <img 
               src={selectedGalleryItem.imageData} 
               className="max-w-full max-h-[80vh] object-contain shadow-2xl rounded-lg"
               alt={selectedGalleryItem.caption}
               onClick={(e) => e.stopPropagation()} 
             />
             
             <div className="mt-8 text-center space-y-2 max-w-2xl px-4" onClick={(e) => e.stopPropagation()}>
                <h4 className="text-2xl font-serif font-bold text-white leading-tight">{selectedGalleryItem.caption}</h4>
                <p className="text-white/40 text-xs font-black uppercase tracking-widest">{selectedGalleryItem.timestamp}</p>
             </div>
          </div>
        )}
      </div>
    );
};
