import { summarizeAssets } from "./assets";
import { getLiquidity } from "./constants";
import { addDays, prettyDate } from "./dates";
import { formatINR } from "./format";
import { totalsByDate } from "./summary";
import type { Asset, CalendarEvent, MoneyEntry, Task } from "./types";

export type InsightTone = "good" | "warn" | "info" | "bad";

export type InsightKind =
  | "cash-flow"
  | "trend"
  | "peak-spend"
  | "liquid-cash"
  | "backlog"
  | "all-done"
  | "net-worth"
  | "liability"
  | "savings"
  | "events"
  | "welcome";

export type Insight = { kind: InsightKind; tone: InsightTone; title: string; body: string };

type InsightInput = {
  money: MoneyEntry[];
  events: CalendarEvent[];
  tasks: Task[];
  /** Including the auto-synced cash balance. */
  assets: Asset[];
};

/** Average over the days that actually had a value. */
function activeDayAverage(values: number[]): number {
  const active = values.filter(Boolean);
  return active.length ? active.reduce((sum, value) => sum + value, 0) / active.length : 0;
}

export function buildInsights({ money, events, tasks, assets }: InsightInput, today: string): Insight[] {
  const insights: Insight[] = [];
  const byDate = totalsByDate(money);
  const lastWeek = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, -i);
    return { date, ...(byDate.get(date) ?? { income: 0, expense: 0, count: 0 }) };
  });

  const todayTotals = lastWeek[0];
  const weekNet = lastWeek.reduce((sum, day) => sum + day.income - day.expense, 0);
  const avgExpense = activeDayAverage(lastWeek.map((day) => day.expense));
  const avgIncome = activeDayAverage(lastWeek.map((day) => day.income));
  const openTasks = tasks.filter((task) => task.status !== "DONE").length;
  const { totalAssets, totalLiabilities, netWorth } = summarizeAssets(assets);
  const liquidCash = assets
    .filter((asset) => getLiquidity(asset.category) === "high")
    .reduce((sum, asset) => sum + asset.value, 0);

  if (todayTotals.income > 0 || todayTotals.expense > 0) {
    const net = todayTotals.income - todayTotals.expense;
    insights.push({
      kind: "cash-flow",
      tone: net >= 0 ? "good" : "warn",
      title: "Today Cash Flow",
      body: `Receipts ${formatINR(todayTotals.income)} | Payments ${formatINR(todayTotals.expense)} | Net ${net >= 0 ? "+ " : "- "}${formatINR(Math.abs(net))}`,
    });
  }

  if (lastWeek.some((day) => day.count > 0)) {
    insights.push({
      kind: "trend",
      tone: weekNet >= 0 ? "good" : "bad",
      title: "7-Day Net Trend",
      body: `Last 7 days net: ${weekNet >= 0 ? "positive" : "negative"} ${formatINR(Math.abs(weekNet))}. Avg daily expense: ${formatINR(avgExpense)}`,
    });
  }

  const peak = lastWeek.reduce((best, day) => (day.expense > best.expense ? day : best), lastWeek[0]);
  if (peak.expense > 0) {
    insights.push({
      kind: "peak-spend",
      tone: "warn",
      title: "Highest Spend Day",
      body: `${prettyDate(peak.date)} had highest payments of ${formatINR(peak.expense)} in last 7 days.`,
    });
  }

  if (liquidCash > 0) {
    const share = totalAssets > 0 ? ` ${((liquidCash / totalAssets) * 100).toFixed(0)}% of total assets.` : "";
    insights.push({
      kind: "liquid-cash",
      tone: "info",
      title: "Liquid Cash",
      body: `${formatINR(liquidCash)} is immediately accessible (Bank + Cash).${share}`,
    });
  }

  if (openTasks > 5) {
    insights.push({
      kind: "backlog",
      tone: "warn",
      title: "Task Backlog",
      body: `${openTasks} tasks are still open. Consider reviewing and closing completed ones.`,
    });
  }
  if (openTasks === 0 && tasks.length > 0) {
    insights.push({
      kind: "all-done",
      tone: "good",
      title: "All Tasks Done!",
      body: "Great job — no open tasks. Ready to add new goals?",
    });
  }

  if (netWorth > 0) {
    const cover = totalLiabilities > 0 ? `${((netWorth / totalLiabilities) * 100).toFixed(0)}%` : "100%";
    insights.push({
      kind: "net-worth",
      tone: "good",
      title: "Net Worth Positive",
      body: `Your net worth is ${formatINR(netWorth)}. Assets cover liabilities by ${cover}.`,
    });
  }
  if (totalLiabilities > 0 && totalLiabilities > totalAssets * 0.5) {
    insights.push({
      kind: "liability",
      tone: "bad",
      title: "Liability Alert",
      body: `Liabilities (${formatINR(totalLiabilities)}) are high relative to assets. Review loan obligations.`,
    });
  }

  if (avgIncome > 0) {
    const rate = Number((((avgIncome - avgExpense) / avgIncome) * 100).toFixed(0));
    insights.push({
      kind: "savings",
      tone: rate >= 20 ? "good" : rate >= 0 ? "info" : "bad",
      title: "Savings Rate",
      body: `You save approximately ${rate}% of daily income over last 7 days. ${rate >= 20 ? "Excellent!" : rate >= 0 ? "Room to improve." : "Spending exceeds income."}`,
    });
  }

  const todaysEvents = events
    .filter((event) => event.date === today)
    .sort((a, b) => a.time.localeCompare(b.time));
  if (todaysEvents.length) {
    insights.push({
      kind: "events",
      tone: "info",
      title: `${todaysEvents.length} Event${todaysEvents.length > 1 ? "s" : ""} Today`,
      body: todaysEvents.map((event) => `${event.time} — ${event.title}`).join(" | "),
    });
  }

  if (!insights.length) {
    insights.push({
      kind: "welcome",
      tone: "info",
      title: "Welcome to Cash Pro!",
      body: "Start by adding your assets and first R&P entry to see personalised insights here.",
    });
  }
  return insights;
}
