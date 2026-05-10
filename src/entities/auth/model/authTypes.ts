export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface AuthError {
  code?: string;
  message: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthReady: boolean;

  isLoading: boolean;
  error: AuthError | null;
}
