import type { Timestamp } from "firebase/firestore";

export type PublicStats = {
  hiredCount: number;
  waitingCount: number;
  positiveRate: number; 
  updatedAt?: Timestamp;
};
