export { default as authRu } from "./locales/ru.json";
export { default as authEn } from "./locales/en.json";
export { default as authDe } from "./locales/de.json";

export {
  getAuthRedirectFrom,
  type AuthRedirectLocationState,
} from "./lib/authRedirect";

export { LoginForm } from "./ui/LoginForm/LoginForm";
export type { LoginFormProps } from "./ui/LoginForm/LoginForm";

export { RegisterForm } from "./ui/RegisterForm/RegisterForm";
export type { RegisterFormProps } from "./ui/RegisterForm/RegisterForm";

export { GoogleSignInButton } from "./ui/GoogleSignInButton/GoogleSignInButton";
export type { GoogleSignInButtonProps } from "./ui/GoogleSignInButton/GoogleSignInButton";

export { EmailPasswordAuthForm } from "./ui/EmailPasswordAuthForm/EmailPasswordAuthForm";
export type { EmailPasswordAuthFormProps } from "./ui/EmailPasswordAuthForm/EmailPasswordAuthForm";

export { LogoutButton } from "./ui/LogoutButton/LogoutButton";
export type { LogoutButtonProps } from "./ui/LogoutButton/LogoutButton";

export { AuthDivider } from "./ui/AuthDivider";
export type { AuthDividerProps } from "./ui/AuthDivider";

export { AuthPageShell } from "./ui/AuthPageShell";
export type { AuthPageShellProps } from "./ui/AuthPageShell";

export { AuthFormShell } from "./ui/AuthFormShell";
export type { AuthFormShellProps } from "./ui/AuthFormShell";

export {
  mapFirebaseAuthError,
  mapGoogleAuthError,
} from "./lib/firebaseAuthErrors";
