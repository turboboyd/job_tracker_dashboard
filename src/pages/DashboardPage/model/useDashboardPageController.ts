import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { Loop } from 'src/entities/loop';
import { AppRoutes, RoutePath } from "src/shared/config/routes";

import { useDashboardData } from './useDashboardData';

export interface DashboardLoopOption {
  id: string;
  name: string;
}

export interface DashboardPageController {
  loopsModalOpen: boolean;
  setLoopsModalOpen: (next: boolean) => void;
  loopsForModal: DashboardLoopOption[];
  dashboard: ReturnType<typeof useDashboardData>;
  actions: {
    goProfile: () => void;
    goQuestions: () => void;
    goLoop: () => void;
    goMatches: () => void;
    goApplicationsByStatus: (status?: string) => void;
    goApplicationDetails: (appId: string) => void;
    focusAddApplication: () => void;
  };
}

export function useDashboardPageController(): DashboardPageController {
  const navigate = useNavigate();
  const dashboard = useDashboardData();
  const [loopsModalOpen, setLoopsModalOpen] = useState(false);

  const loopsForModal = useMemo(
    () =>
      dashboard.loops
        .slice()
        .sort((left: Loop, right: Loop) => left.name.localeCompare(right.name))
        .map((loop: Loop) => ({ id: loop.id, name: loop.name })),
    [dashboard.loops],
  );

  return {
    loopsModalOpen,
    setLoopsModalOpen,
    loopsForModal,
    dashboard,
    actions: {
      goProfile: () => {
        void navigate(RoutePath[AppRoutes.SETTINGS_PROFILE]);
      },
      goQuestions: () => {
        void navigate(RoutePath[AppRoutes.PROFILE_QUESTIONS]);
      },
      goLoop: () => {
        void navigate(RoutePath[AppRoutes.LOOPS]);
      },
      goMatches: () => {
        void navigate(RoutePath[AppRoutes.APPLICATIONS]);
      },
      goApplicationsByStatus: (status?: string) => {
        if (!status) {
          void navigate(RoutePath[AppRoutes.APPLICATIONS]);
          return;
        }

        void navigate(`${RoutePath[AppRoutes.APPLICATIONS]}?col=${status}`);
      },
      goApplicationDetails: (appId: string) => {
        void navigate(`${RoutePath[AppRoutes.APPLICATIONS]}/${appId}`);
      },
      focusAddApplication: () => {
        void navigate(`${RoutePath[AppRoutes.APPLICATIONS]}?focus=add`);
      },
    },
  };
}
