import {
  LayoutDashboard,
  Repeat2,
  KanbanSquare,
  CalendarDays,
  Sparkles,
  FileText,
  ClipboardCheck,
  FileEdit,
  HelpCircle,
  Settings,
  BookOpen,
  Mail,
  TrendingUp,
  X,
  ExternalLink,
} from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import {
  AppRoutes,
  RoutePath,
} from "src/app/providers/router/routeConfig/routeConfig";
import { useAppSelector } from "src/app/store/hooks";
import { useAuthSelectors } from "src/entities/auth";
import { selectLoopsResumeUrl } from "src/entities/loop";

type AppSidebarProps = {
  isOpen: boolean;
  onClose?: () => void;
  onToggle?: () => void;
};

const NAV_ITEMS = [
  { labelKey: "common.nav.overview", labelDefault: "Overview", path: RoutePath[AppRoutes.DASHBOARD], Icon: LayoutDashboard, end: true },
  { labelKey: "common.nav.myApplications", labelDefault: "Applications", path: RoutePath[AppRoutes.APPLICATIONS], Icon: FileText, onboardingId: "nav-applications" },
  { labelKey: "common.nav.board", labelDefault: "Board", path: RoutePath[AppRoutes.BOARD], Icon: KanbanSquare, onboardingId: "nav-board" },
  { labelKey: "common.nav.myLoops", labelDefault: "Loops", path: RoutePath[AppRoutes.LOOPS], Icon: Repeat2, isLoops: true, onboardingId: "nav-loops" },
  { labelKey: "common.nav.allMatches", labelDefault: "Matches", path: RoutePath[AppRoutes.MATCHES], Icon: Sparkles, onboardingId: "nav-matches" },
  { labelKey: "common.nav.calendar", labelDefault: "Calendar", path: RoutePath[AppRoutes.CALENDAR], Icon: CalendarDays, onboardingId: "nav-calendar" },
];

const SECONDARY_ITEMS = [
  { labelKey: "common.nav.cvChecker", labelDefault: "CV Checker", path: RoutePath[AppRoutes.CV_CHECKER], Icon: ClipboardCheck },
  { labelKey: "common.nav.cvBuilder", labelDefault: "CV Builder", path: RoutePath[AppRoutes.CV_BUILDER], Icon: FileEdit },
  { labelKey: "common.nav.questions", labelDefault: "Questions", path: RoutePath[AppRoutes.QUESTIONS], Icon: HelpCircle },
  { labelKey: "common.nav.resources", labelDefault: "Resources", path: RoutePath[AppRoutes.RESOURCES], Icon: BookOpen },
  { labelKey: "common.nav.inbox", labelDefault: "Inbox", path: RoutePath[AppRoutes.INBOX], Icon: Mail },
  { labelKey: "common.nav.optimization", labelDefault: "Optimization", path: RoutePath[AppRoutes.OPTIMIZATION], Icon: TrendingUp },
];

function SidebarNavItem({
  labelKey,
  labelDefault,
  path,
  Icon,
  end,
  isLoops,
  onboardingId,
  onClose,
}: {
  labelKey: string;
  labelDefault: string;
  path: string;
  Icon: React.ElementType;
  end?: boolean;
  isLoops?: boolean;
  onboardingId?: string;
  onClose?: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const loopsResumeUrl = useAppSelector(selectLoopsResumeUrl);
  const label = t(labelKey, labelDefault);

  const isActive = end
    ? location.pathname === path
    : location.pathname === path || location.pathname.startsWith(path + "/");

  const cls = [
    "relative flex items-center gap-2.5 rounded-md py-1.5 pr-2.5 text-[13px] transition-colors duration-100 cursor-pointer select-none w-full overflow-hidden",
    // left border accent
    "border-l-2",
    isActive
      ? "border-primary bg-muted pl-[9px] text-foreground font-medium"
      : "border-transparent pl-[9px] text-muted-foreground hover:bg-muted hover:text-foreground font-normal",
  ].join(" ");

  if (isLoops) {
    return (
      <button
        type="button"
        data-onboarding-id={onboardingId}
        onClick={() => { navigate(loopsResumeUrl); onClose?.(); }}
        className={cls}
      >
        <Icon className={["h-4 w-4 shrink-0", isActive ? "text-foreground" : "text-subtle-foreground"].join(" ")} />
        <span className="truncate">{label}</span>
      </button>
    );
  }

  return (
    <NavLink
      to={path}
      end={end}
      data-onboarding-id={onboardingId}
      onClick={onClose}
      className={cls}
    >
      <Icon className={["h-4 w-4 shrink-0", isActive ? "text-foreground" : "text-subtle-foreground"].join(" ")} />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

function SidebarLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2.5 pb-1 pt-0.5 text-[10.5px] font-medium uppercase tracking-widest text-subtle-foreground">
      {children}
    </div>
  );
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { user } = useAuthSelectors();

  const initials = user?.displayName
    ? user.displayName.split(" ").map((p: string) => p[0]).slice(0, 2).join("").toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "?";

  const displayName = user?.displayName || user?.email?.split("@")[0] || "User";

  const sidebar = (
    <aside
      className={[
        "flex h-screen w-[var(--sidebar-width)] shrink-0 flex-col border-r border-border bg-background",
        "transition-transform duration-200 ease-out",
        // Mobile: overlay fixed; desktop: static
        "fixed md:static z-50 top-0 left-0",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      ].join(" ")}
    >
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-border px-4">
        <div className="grid h-6 w-6 shrink-0 place-items-center rounded-[6px] bg-foreground text-[13px] font-bold tracking-tighter text-background">
          L
        </div>
        <span className="text-sm font-semibold tracking-tight text-foreground">Loopboard</span>
        {/* Mobile close */}
        <button
          type="button"
          onClick={onClose}
          className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* User card */}
      <div className="mx-3 mt-3 flex items-center gap-2.5 rounded-lg border border-border bg-muted/50 px-2.5 py-2">
        <div
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-[11px] font-semibold text-white"
          style={{ background: "linear-gradient(135deg, rgb(230 94 76), rgb(59 130 246))" }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12.5px] font-medium text-foreground">{displayName}</div>
          <div className="text-[10.5px] text-subtle-foreground">Free plan</div>
        </div>
      </div>

      {/* Nav */}
      <nav data-onboarding-id="nav" className="flex flex-1 flex-col gap-px overflow-y-auto p-3 pt-4">
        <SidebarLabel>Workspace</SidebarLabel>
        <div className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => (
            <SidebarNavItem key={item.path} {...item} onClose={onClose} />
          ))}
        </div>

        <div className="my-3 h-px bg-border" />
        <SidebarLabel>Tools</SidebarLabel>
        <div className="flex flex-col gap-0.5">
          {SECONDARY_ITEMS.map((item) => (
            <SidebarNavItem key={item.path} {...item} onClose={onClose} />
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-border px-3 py-3">
        <div className="flex flex-col gap-0.5">
          <NavLink
            to={RoutePath[AppRoutes.SETTINGS_PROFILE]}
            className={({ isActive }) => [
              "flex items-center gap-2 rounded-md border-l-2 py-1.5 pr-2.5 pl-[9px] text-[12.5px] transition-colors duration-100",
              isActive
                ? "border-primary bg-muted text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
            ].join(" ")}
          >
            <Settings className="h-3.5 w-3.5 shrink-0 text-subtle-foreground" />
            {t("common.nav.settings", "Settings")}
          </NavLink>
          <NavLink
            to={RoutePath[AppRoutes.WHATS_NEW]}
            className={({ isActive }) => [
              "flex items-center gap-2 rounded-md border-l-2 py-1.5 pr-2.5 pl-[9px] text-[12.5px] transition-colors duration-100",
              isActive
                ? "border-primary bg-muted text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
            ].join(" ")}
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-subtle-foreground" />
            {t("common.whatsNew", "What's new")}
          </NavLink>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        className={["fixed inset-0 z-40 bg-foreground/20 md:hidden transition-opacity", isOpen ? "block" : "hidden"].join(" ")}
      />
      {sidebar}
    </>
  );
};
