"use client";

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  Auth,
  UserCredential,
} from "firebase/auth";

// Firebase Configuration from Environment Variables with project defaults
const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyBYSJznulkKkeZIShS-s38WPVdn03Umnlk",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "aiva-chatbot-55b17.firebaseapp.com",
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "aiva-chatbot-55b17",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "aiva-chatbot-55b17.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "263379300082",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    "1:263379300082:web:5531fc332043a302bb2a6b",
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-L7HTRJ6Y0K",
};

// Initialize Singleton Firebase App
export const app: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth
export const auth: Auth = getAuth(app);

// Configure Google Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

/**
 * Perform 1-click Google Sign-in with native Firebase Popup.
 * Returns the authenticated user and their Firebase ID Token.
 */
export async function signInWithGooglePopup(): Promise<{
  credential: UserCredential;
  idToken: string;
}> {
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();

  if (typeof window !== "undefined") {
    localStorage.setItem("aiva_firebase_token", idToken);
    localStorage.setItem(
      "aiva_firebase_user",
      JSON.stringify({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      })
    );
  }

  return { credential: result, idToken };
}

/**
 * Sign out of Firebase.
 */
export async function signOutFirebase(): Promise<void> {
  await signOut(auth);
  if (typeof window !== "undefined") {
    localStorage.removeItem("aiva_firebase_token");
    localStorage.removeItem("aiva_firebase_user");
  }
}
