import {
  CalendarDays,
  House,
  Landmark,
  ListTodo,
  SquareCheckBig,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import type { Tab } from "@/lib/cash-pro/tabs";

export type Screen = {
  tab: Tab;
  /** Sidebar and page header. */
  label: string;
  /** Phone bottom navigation. */
  shortLabel: string;
  description: string;
  icon: LucideIcon;
};

export const SCREENS: Screen[] = [
  {
    tab: "home",
    label: "Overview",
    shortLabel: "Home",
    description: "Net worth, today's cash flow and what's coming up",
    icon: House,
  },
  {
    tab: "money",
    label: "Receipts & Payments",
    shortLabel: "R&P",
    description: "Record income and expenses, review any day",
    icon: WalletCards,
  },
  {
    tab: "calendar",
    label: "Calendar",
    shortLabel: "Calendar",
    description: "Events with a reminder an hour before",
    icon: CalendarDays,
  },
  {
    tab: "tasks",
    label: "Tasks",
    shortLabel: "Tasks",
    description: "Work by status, priority and due date",
    icon: SquareCheckBig,
  },
  {
    tab: "todo",
    label: "To-Do",
    shortLabel: "To-Do",
    description: "Your quick personal checklist",
    icon: ListTodo,
  },
  {
    tab: "assets",
    label: "Assets & Net Worth",
    shortLabel: "Assets",
    description: "Assets, liabilities and how liquid they are",
    icon: Landmark,
  },
];

export const screenFor = (tab: Tab) => SCREENS.find((screen) => screen.tab === tab) ?? SCREENS[0];
