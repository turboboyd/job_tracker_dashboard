export interface CreateLoopModalProps {
  onCreated: (loopId: string) => void;
  onOpenChange: (v: boolean) => void;
  open: boolean;
}

export interface CreateLoopForm {
  location: string;
  name: string;
  role: string;
}
