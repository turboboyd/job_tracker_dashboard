import type { Dispatch } from "@reduxjs/toolkit";
import type { Unsubscribe, User } from "firebase/auth";

import { setAuthReady, setUser } from "./authSlice";
import type { AuthUser } from "./authTypes";


const mapFirebaseUser = (u: User): AuthUser => ({
  uid: u.uid,
  email: u.email,
  displayName: u.displayName,
  photoURL: u.photoURL,
});

let unsubscribe: Unsubscribe | null = null;
let isInitializing = false;

export const initAuthListener = () => (dispatch: Dispatch) => {
  if (unsubscribe || isInitializing) return;

  isInitializing = true;

  Promise.all([
    import("firebase/auth"),
    import("src/shared/config/firebase/auth"),
  ])
    .then(([{ onAuthStateChanged }, { auth }]) => {
      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        dispatch(setUser(firebaseUser ? mapFirebaseUser(firebaseUser) : null));
        dispatch(setAuthReady(true));
      });
    })
    .catch(() => {
      dispatch(setUser(null));
      dispatch(setAuthReady(true));
    })
    .finally(() => {
      isInitializing = false;
    });
};

export const stopAuthListener = () => (_dispatch: Dispatch) => {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
};
