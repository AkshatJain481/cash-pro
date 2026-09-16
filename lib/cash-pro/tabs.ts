export const TABS = ["home", "money", "calendar", "tasks", "todo", "assets"] as const;
export type Tab = (typeof TABS)[number];

export const parseTab = (value: unknown): Tab =>
  TABS.includes(value as Tab) ? (value as Tab) : "home";
