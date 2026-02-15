export function buildHref(opts: { pathname: string; search?: string; hash?: string }): string {
  const withPrefix = (value: string, prefix: string) => (value.startsWith(prefix) ? value : `${prefix}${value}`);

  let search = "";
  if (opts.search) {
    search = withPrefix(opts.search, "?");
  }

  let hash = "";
  if (opts.hash) {
    hash = withPrefix(opts.hash, "#");
  }

  return `${opts.pathname}${search}${hash}`;
}
