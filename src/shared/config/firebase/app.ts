import { initializeApp } from "firebase/app";

declare const __ENV__: {
  NODE_ENV: "development" | "production";
  FIREBASE_API_KEY: string;
  FIREBASE_AUTH_DOMAIN: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_APP_ID: string;
  FIREBASE_STORAGE_BUCKET: string;
  FIREBASE_MESSAGING_SENDER_ID: string;
  GOOGLE_CALENDAR_CONNECT_URL?: string;
  GOOGLE_CALENDAR_CLIENT_ID?: string;
};

const firebaseConfig = {
  apiKey: __ENV__.FIREBASE_API_KEY,
  authDomain: __ENV__.FIREBASE_AUTH_DOMAIN,
  projectId: __ENV__.FIREBASE_PROJECT_ID,
  appId: __ENV__.FIREBASE_APP_ID,
  storageBucket: __ENV__.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: __ENV__.FIREBASE_MESSAGING_SENDER_ID,
};

export const firebaseApp = initializeApp(firebaseConfig);
