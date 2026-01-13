import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Repeat2,
  Presentation,
  Share2,
  FileText,
  HelpCircle,
  ClipboardCheck,
  FileEdit,
  Mail,
} from "lucide-react";

export type SidebarItem = {
  label: string;
  path: string;
  Icon: LucideIcon;
};

export const sidebarItems: SidebarItem[] = [
  { label: "Overview", path: "/dashboard", Icon: LayoutDashboard },
  { label: "My loops", path: "/dashboard/loops", Icon: Repeat2 },
  { label: "Board", path: "/dashboard/board", Icon: Presentation },
  { label: "All Matches", path: "/dashboard/matches", Icon: Share2 },
  { label: "My Applications", path: "/dashboard/applications", Icon: FileText },
  { label: "Questions", path: "/dashboard/questions", Icon: HelpCircle },
  { label: "CV Checker", path: "/dashboard/cv-checker", Icon: ClipboardCheck },
  { label: "CV Builder", path: "/dashboard/cv-builder", Icon: FileEdit },
  { label: "Inbox", path: "/dashboard/inbox", Icon: Mail },
];
