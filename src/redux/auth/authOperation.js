import { createAsyncThunk } from '@reduxjs/toolkit';
import { auth } from 'server/firebaseConfig';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';

const googleAuthProvider = new GoogleAuthProvider();


const getAuthErrorMessage = error => {
  switch (error?.code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Email or password is incorrect. Please check your credentials and try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please log in instead.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was closed before completion.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    default:
      return 'Authentication failed. Please try again.';
  }
};

export const registrationUser = createAsyncThunk(
  'user/registrationUser',
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(userCredential.user, {
        displayName: name,
      });

      return {
        displayName: userCredential.user.displayName,
        email: userCredential.user.email,
        uid: userCredential.user.uid,
        accessToken: userCredential.user.accessToken,
      };
    } catch (error) {
      return rejectWithValue(getAuthErrorMessage(error));
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      return {
        displayName: userCredential.user.displayName,
        email: userCredential.user.email,
        uid: userCredential.user.uid,
        accessToken: userCredential.user.accessToken,
      };
    } catch (error) {
      return rejectWithValue(getAuthErrorMessage(error));
    }
  }
);

export const currentUser = createAsyncThunk(
  'auth/currentUser',
  async (_, { rejectWithValue }) => {
    try {
      return new Promise((resolve, reject) => {
        onAuthStateChanged(auth, currentUser => {
          if (currentUser) {
            const user = {
              displayName: currentUser.displayName,
              email: currentUser.email,
              uid: currentUser.uid,
              accessToken: currentUser.accessToken,
            };
            resolve(user);
          } else {
            return reject('Пользователь не аутентифицирован');
          }
        });
      });
    } catch (error) {
      return rejectWithValue(getAuthErrorMessage(error));
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await signOut(auth);
    } catch (error) {
      return rejectWithValue(getAuthErrorMessage(error));
    }
  }
);

export const authorizationGoogle = createAsyncThunk(
  'auth/authorizationGoogle',
  async (_, { rejectWithValue }) => {
    try {
      const userCredential = await signInWithPopup(auth, googleAuthProvider);
      return {
        displayName: userCredential.user.displayName,
        email: userCredential.user.email,
        uid: userCredential.user.uid,
        accessToken: userCredential.user.accessToken,
      };
    } catch (error) {
      console.error('Login error:', error.message);
      return rejectWithValue(getAuthErrorMessage(error));
    }
  }
);
