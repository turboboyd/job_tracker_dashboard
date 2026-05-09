import type { UserSettings } from "../model/types";

export const DEFAULT_USER_SETTINGS: UserSettings = {
  timeZone: "Europe/Berlin",
  dateFormat: "DD.MM.YYYY",
  notifications: {
    applicationReminders: {
      enabled: true,
      leadTimeMinutes: 30,
      dailyDigestEnabled: false,
      dailyDigestTime: "09:00",
      browserEnabled: true,
      emailEnabled: false,
      googleCalendarEnabled: false,
    },
  },
  pipeline: {
    version: 1,
    defaultStageId: "active",
    stages: [
      {
        id: "active",
        label: "Active",
        order: 10,
        visible: true,
        defaultSubStatusId: "applied",
        subStatuses: [
          { id: "saved", label: "Saved", order: 10, visible: true, legacyStatus: "SAVED" },
          { id: "planned", label: "Planned", order: 20, visible: true, legacyStatus: "PLANNED" },
          { id: "applied", label: "Applied", order: 30, visible: true, legacyStatus: "APPLIED" },
          { id: "viewed", label: "Viewed", order: 40, visible: true, legacyStatus: "VIEWED" },
          { id: "follow_up_1", label: "Follow-up #1", order: 50, visible: true },
          { id: "follow_up_2", label: "Follow-up #2", order: 60, visible: true },
        ],
      },
      {
        id: "interview",
        label: "Interview",
        order: 20,
        visible: true,
        defaultSubStatusId: "interview_1",
        subStatuses: [
          {
            id: "interview_1",
            label: "Interview 1",
            order: 10,
            visible: true,
            legacyStatus: "INTERVIEW_1",
          },
          {
            id: "interview_2",
            label: "Interview 2",
            order: 20,
            visible: true,
            legacyStatus: "INTERVIEW_2",
          },
          {
            id: "test_task",
            label: "Test task",
            order: 30,
            visible: true,
            legacyStatus: "TEST_TASK",
          },
        ],
      },
      {
        id: "offer",
        label: "Offer",
        order: 30,
        visible: true,
        defaultSubStatusId: "offer",
        subStatuses: [
          { id: "offer", label: "Offer received", order: 10, visible: true, legacyStatus: "OFFER" },
          { id: "negotiation", label: "Negotiation", order: 20, visible: true },
        ],
      },
      {
        id: "hired",
        label: "Hired",
        order: 40,
        visible: true,
        defaultSubStatusId: "hired",
        subStatuses: [{ id: "hired", label: "Hired", order: 10, visible: true }],
      },
      {
        id: "no_response",
        label: "No response",
        order: 50,
        visible: true,
        defaultSubStatusId: "ghosting",
        subStatuses: [
          {
            id: "ghosting",
            label: "Ghosting",
            order: 10,
            visible: true,
            legacyStatus: "NO_RESPONSE",
          },
          { id: "closed", label: "Closed", order: 20, visible: true },
        ],
      },
      {
        id: "rejected",
        label: "Rejected",
        order: 60,
        visible: true,
        defaultSubStatusId: "rejected",
        subStatuses: [
          {
            id: "rejected",
            label: "Rejected",
            order: 10,
            visible: true,
            legacyStatus: "REJECTED",
          },
        ],
      },
      {
        id: "archived",
        label: "Archived",
        order: 70,
        visible: false,
        defaultSubStatusId: "archived",
        subStatuses: [{ id: "archived", label: "Archived", order: 10, visible: true }],
      },
    ],
  },
};
