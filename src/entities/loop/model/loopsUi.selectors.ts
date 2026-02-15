import type { RootState } from "src/app/store/rootReducer";

export const selectLoopsResumeUrl = (s: RootState) => {
  if (s.loopsUi.lastLoopsUrl) return s.loopsUi.lastLoopsUrl;
  return `/dashboard/loops?page=${s.loopsUi.listPage}`;
};
