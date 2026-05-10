export { useAuthActions, useAuthSelectors } from "./model";

export {
  getAuthRedirectFrom,
  type AuthRedirectLocationState,
} from "./lib/authRedirect";

export { LoginForm } from "./ui/LoginForm/LoginForm";
export type { LoginFormProps } from "./ui/LoginForm/LoginForm";

export { RegisterForm } from "./ui/RegisterForm/RegisterForm";
export type { RegisterFormProps } from "./ui/RegisterForm/RegisterForm";

export { LogoutButton } from "./ui/LogoutButton/LogoutButton";
export type { LogoutButtonProps } from "./ui/LogoutButton/LogoutButton";

export { AuthPageShell } from "./ui/AuthPageShell";
export type { AuthPageShellProps } from "./ui/AuthPageShell";

export { AuthPageFooterLinks } from "./ui/AuthPageFooterLinks";
export type { AuthPageFooterLinksProps } from "./ui/AuthPageFooterLinks";
