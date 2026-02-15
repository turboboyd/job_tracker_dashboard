export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

export type AuthError = {
  code?: string;
  message: string;
};

export type AuthState = {
  user: AuthUser | null;
  isAuthReady: boolean;

  isLoading: boolean;
  error: AuthError | null;
};
