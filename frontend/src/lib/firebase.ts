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
    // Set session cookie for Next.js middleware routing
    document.cookie = "aiva_auth_session=1; path=/; max-age=2592000; SameSite=Lax";
    document.cookie = `aiva_admin_token=firebase_${result.user.uid}; path=/; max-age=2592000; SameSite=Lax`;
    localStorage.setItem("aiva_firebase_token", idToken);
    localStorage.setItem("aiva_admin_token", `firebase_${result.user.uid}`);
    localStorage.setItem(
      "aiva_firebase_user",
      JSON.stringify({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        role: "admin",
      })
    );
    localStorage.setItem(
      "aiva_admin_user",
      JSON.stringify({
        id: result.user.uid,
        email: result.user.email,
        full_name: result.user.displayName,
        role: "admin",
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
    document.cookie = "aiva_auth_session=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "aiva_admin_token=; path=/; max-age=0; SameSite=Lax";
    localStorage.removeItem("aiva_firebase_token");
    localStorage.removeItem("aiva_firebase_user");
    localStorage.removeItem("aiva_admin_token");
    localStorage.removeItem("aiva_admin_user");
  }
}
