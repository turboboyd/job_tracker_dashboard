import { Timestamp } from "firebase/firestore";

export function nowTs(): Timestamp {
  return Timestamp.now();
}

export function timestampFromDate(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

export function timestampFromIso(iso: string): Timestamp {
  return Timestamp.fromDate(new Date(iso));
}
