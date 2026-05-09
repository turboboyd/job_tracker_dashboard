interface LoopsUiStateLike {
  loopsUi: {
    lastLoopsUrl: string | null;
    listPage: number;
  };
}

export const selectLoopsResumeUrl = (s: LoopsUiStateLike) => {
  if (s.loopsUi.lastLoopsUrl) return s.loopsUi.lastLoopsUrl;
  return `/dashboard/loops?page=${s.loopsUi.listPage}`;
};
