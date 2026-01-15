/**
 * Firebase Configuration Template
 *
 * Instructions:
 * 1. Create a Google Cloud Project at https://console.cloud.google.com
 * 2. Enable Firestore, Authentication, and Cloud Functions
 * 3. Create a Web app in Firebase Console
 * 4. Copy your config values below
 * 5. Keep this file in .gitignore (DO NOT commit credentials)
 *
 * Example:
 * const firebaseConfig = {
 *   apiKey: "AIzaSyDcKfD...",
 *   authDomain: "project-id.firebaseapp.com",
 *   projectId: "project-id",
 *   storageBucket: "project-id.appspot.com",
 *   messagingSenderId: "123456789",
 *   appId: "1:123456789:web:abcdef..."
 * };
 */

export const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || '',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || '',
};

// Validate configuration
export function validateFirebaseConfig(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!firebaseConfig.apiKey) errors.push('Missing REACT_APP_FIREBASE_API_KEY');
  if (!firebaseConfig.authDomain)
    errors.push('Missing REACT_APP_FIREBASE_AUTH_DOMAIN');
  if (!firebaseConfig.projectId)
    errors.push('Missing REACT_APP_FIREBASE_PROJECT_ID');
  if (!firebaseConfig.storageBucket)
    errors.push('Missing REACT_APP_FIREBASE_STORAGE_BUCKET');
  if (!firebaseConfig.messagingSenderId)
    errors.push('Missing REACT_APP_FIREBASE_MESSAGING_SENDER_ID');
  if (!firebaseConfig.appId) errors.push('Missing REACT_APP_FIREBASE_APP_ID');

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default firebaseConfig;
