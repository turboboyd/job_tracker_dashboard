import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type SetPageOpts = {
  replace?: boolean;
};

export function clampPage(n: number) {
  if (!Number.isFinite(n)) return 1;
  const x = Math.floor(n);
  return x < 1 ? 1 : x;
}

export function updateURLParams(params: Record<string, string | null>, search: string) {
  const sp = new URLSearchParams(search);
  Object.entries(params).forEach(([k, v]) => {
    if (v === null || v === "") sp.delete(k);
    else sp.set(k, v);
  });
  const next = sp.toString();
  return next ? `?${next}` : "";
}

export function usePageParam(key: string = "page") {
  const navigate = useNavigate();
  const location = useLocation();

  const page = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    const raw = sp.get(key);
    const n = raw ? Number(raw) : 1;
    return clampPage(n);
  }, [location.search, key]);

  const setPage = (nextPage: number, opts: SetPageOpts = {}) => {
    const p = clampPage(nextPage);
    const nextSearch = updateURLParams({ [key]: String(p) }, location.search);

    navigate(
      {
        pathname: location.pathname,
        search: nextSearch,
      },
      { replace: Boolean(opts.replace) }
    );
  };

  return { page, setPage };
}
