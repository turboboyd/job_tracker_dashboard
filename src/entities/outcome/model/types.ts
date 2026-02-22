export type EmploymentStatus = "waiting" | "hired";
export type Feedback = "positive" | "neutral" | "negative";

export type UserOutcome = {
  userId?: string;
  employmentStatus: EmploymentStatus;
  feedback?: Feedback;
  updatedAt?: number;
};
