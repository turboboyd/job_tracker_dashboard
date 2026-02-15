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

import { AppRoutes, RoutePath } from "../routeConfig/routeConfig";

export type SidebarItem = {
  labelKey: string;
  labelDefault: string;
  path: string;
  Icon: LucideIcon;
};

export const sidebarItems: SidebarItem[] = [
  {
    labelKey: "common.nav.overview",
    labelDefault: "Overview",
    path: RoutePath[AppRoutes.DASHBOARD],
    Icon: LayoutDashboard,
  },
  {
    labelKey: "common.nav.myLoops",
    labelDefault: "My loops",
    path: RoutePath[AppRoutes.LOOPS],
    Icon: Repeat2,
  },
  {
    labelKey: "common.nav.board",
    labelDefault: "Board",
    path: RoutePath[AppRoutes.BOARD],
    Icon: Presentation,
  },
  {
    labelKey: "common.nav.allMatches",
    labelDefault: "All Matches",
    path: RoutePath[AppRoutes.MATCHES],
    Icon: Share2,
  },
  {
    labelKey: "common.nav.myApplications",
    labelDefault: "My Applications",
    path: RoutePath[AppRoutes.APPLICATIONS],
    Icon: FileText,
  },
  {
    labelKey: "common.nav.questions",
    labelDefault: "Questions",
    path: RoutePath[AppRoutes.QUESTIONS],
    Icon: HelpCircle,
  },
  {
    labelKey: "common.nav.cvChecker",
    labelDefault: "CV Checker",
    path: RoutePath[AppRoutes.CV_CHECKER],
    Icon: ClipboardCheck,
  },
  {
    labelKey: "common.nav.cvBuilder",
    labelDefault: "CV Builder",
    path: RoutePath[AppRoutes.CV_BUILDER],
    Icon: FileEdit,
  },
  {
    labelKey: "common.nav.inbox",
    labelDefault: "Inbox",
    path: RoutePath[AppRoutes.INBOX],
    Icon: Mail,
  },
];
