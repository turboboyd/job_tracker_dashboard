import { DEMO_ITEM_SEEDS_PRIMARY } from "./demoItemSeeds.primary";
import { DEMO_ITEM_SEEDS_SECONDARY } from "./demoItemSeeds.secondary";
import type { DemoItemSeed } from "./seedDemoData.types";

export const DEMO_ITEM_SEEDS: readonly DemoItemSeed[] = [
  ...DEMO_ITEM_SEEDS_PRIMARY,
  ...DEMO_ITEM_SEEDS_SECONDARY,
];
