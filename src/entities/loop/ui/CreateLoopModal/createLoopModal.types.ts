import type { CreateLoopInput, Loop } from "../../model";

export interface CreateLoopModalProps {
  onCreateLoop: (input: CreateLoopInput) => Promise<Pick<Loop, "id">>;
  onCreated: (loopId: string) => void;
  onOpenChange: (v: boolean) => void;
  open: boolean;
}

export interface CreateLoopForm {
  location: string;
  name: string;
  platforms: string[];
  role: string;
}
