export type BuildMode = "development" | "production";

export interface BuildPaths {
  src: string;
  dist: string;
  public: string;
}

export interface BuildOptions {
  mode: BuildMode;
  isDev: boolean;
  isProd: boolean;
  paths: BuildPaths;
  /** Normalised serving base, always trailing-slashed (e.g. "/" or "/dashboard/"). */
  publicPath: string;
}
