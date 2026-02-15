export type AuthRedirectLocationState = {
  from?: {
    pathname?: string;
    search?: string;
  };
};

export function getAuthRedirectFrom(
  state: AuthRedirectLocationState | null | undefined,
  fallback = "/dashboard",
): string {
  const fromPath = state?.from?.pathname ?? fallback;
  const fromSearch = state?.from?.search ?? "";
  return `${fromPath}${fromSearch}`;
}
