import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentSingleTabManager } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAufXiRRi9H0DBKZWPDlFquIe6RwvFPm3o",
  authDomain: "life-tracker-21d6d.firebaseapp.com",
  projectId: "life-tracker-21d6d",
  storageBucket: "life-tracker-21d6d.firebasestorage.app",
  messagingSenderId: "1075763210088",
  appId: "1:1075763210088:web:8233e808870a05320998dd"
};

const app = initializeApp(firebaseConfig);

// Persistent IndexedDB cache — repeat opens (20x/day) served instantly from device
// First open fetches from network and caches. All subsequent opens use cache.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentSingleTabManager({ forceOwnership: true })
  })
});

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
