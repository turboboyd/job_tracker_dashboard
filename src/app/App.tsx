import { Suspense } from "react";

import { Loader } from "src/shared/ui/Loader";

import { AppRouter } from "./providers/router";

export function App() {
  return (
    <Suspense fallback={<Loader />}>
      <AppRouter />
    </Suspense>
  );
}
