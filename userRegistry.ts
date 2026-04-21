import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from './firebase';

/**
 * Called on every login. Updates lastActive + profile fields.
 * Uses mergeFields so createdAt is never overwritten after first write.
 * No getDoc needed — avoids the read-permission issue for regular users.
 */
export const registerUserProfile = async (user: User): Promise<void> => {
  try {
    const registryRef = doc(db, 'userRegistry', user.uid);

    // Update profile + lastActive — mergeFields means createdAt is untouched
    await setDoc(
      registryRef,
      {
        uid: user.uid,
        name: user.displayName || 'Unknown',
        email: user.email || '',
        photoURL: user.photoURL || '',
        lastActive: serverTimestamp(),
      },
      { mergeFields: ['uid', 'name', 'email', 'photoURL', 'lastActive'] }
    );
  } catch (e) {
    console.warn('userRegistry lastActive update failed (non-critical):', e);
  }
};

/**
 * Called only for brand-new users (detected in App.tsx via settingsSnap check).
 * Writes createdAt to registry and seeds the welcome notification
 * to the user's own private space (/users/{uid}/appData/welcomeNotif).
 */
export const initNewUser = async (user: User): Promise<void> => {
  try {
    const registryRef = doc(db, 'userRegistry', user.uid);

    // Write createdAt — merge:true so this only sets it once
    // (if doc already exists somehow, createdAt won't be overwritten by mergeFields above)
    await setDoc(
      registryRef,
      { createdAt: serverTimestamp() },
      { merge: true }
    );

    // Store welcome notification in user's own private space (they own /users/{uid}/...)
    await setDoc(
      doc(db, 'users', user.uid, 'appData', 'welcomeNotif'),
      {
        id: 'welcome',
        title: '👋 Welcome to Life Tracker!',
        body: "Here's a tip: add Life Tracker to your phone's home screen so it works like a real app — no app store needed!\n\nOn Android: tap the ⋮ (3-dot menu) in your browser → tap \"Add to Home Screen\".\nOn iPhone: tap the Share button (□↑) → tap \"Add to Home Screen\".\n\nThis gives you a full-screen experience. Log every day — even 2 minutes is enough. Consistency is everything. Welcome aboard! 🚀",
        type: 'announcement',
        createdAt: serverTimestamp(),
      }
    );
  } catch (e) {
    console.warn('initNewUser failed (non-critical):', e);
  }
};
