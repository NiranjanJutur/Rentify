import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// PASTE YOUR FIREBASE WEB CONFIG HERE:
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "rentify-07.firebaseapp.com",
  projectId: "rentify-07",
  storageBucket: "rentify-07.appspot.com",
  messagingSenderId: "832275018018",
  appId: "YOUR_APP_ID_HERE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
