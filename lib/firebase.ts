import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDn-e2BIUiztIxqGQfyg6cx2bkYC36wE-U",
  authDomain: "ba-comesa.firebaseapp.com",
  projectId: "ba-comesa",
  storageBucket: "ba-comesa.firebasestorage.app",
  messagingSenderId: "530722182708",
  appId: "1:530722182708:web:05b3780584931d3040dc61",
  measurementId: "G-X4GC74X3CG"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);