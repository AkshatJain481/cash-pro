import { addDays } from "./dates";
import type { MoneyEntry } from "./types";

export type DayTotals = { income: number; expense: number; count: number };

export function totalsByDate(money: MoneyEntry[]): Map<string, DayTotals> {
  const totals = new Map<string, DayTotals>();
  for (const entry of money) {
    const day = totals.get(entry.date) ?? { income: 0, expense: 0, count: 0 };
    day.count += 1;
    if (entry.type === "INCOME") day.income += entry.amount;
    else day.expense += entry.amount;
    totals.set(entry.date, day);
  }
  return totals;
}

/** Days to include; 0 means every day that has entries. */
export const SUMMARY_RANGES = [7, 14, 30, 0] as const;
export type SummaryRange = (typeof SUMMARY_RANGES)[number];

export type SummaryDay = { date: string; income: number; expense: number; net: number };

export type FundSummary = {
  /** Days with entries, newest first. */
  days: SummaryDay[];
  totalIncome: number;
  totalExpense: number;
  net: number;
  /** Up to the 14 most recent active days, oldest first. */
  spark: SummaryDay[];
  sparkMax: number;
  topCategories: { category: string; amount: number }[];
};

export function buildFundSummary(
  money: MoneyEntry[],
  range: SummaryRange,
  today: string,
): FundSummary {
  const byDate = totalsByDate(money);
  const dates =
    range === 0
      ? [...byDate.keys()].sort((a, b) => b.localeCompare(a))
      : Array.from({ length: range }, (_, i) => addDays(today, -i));

  const days: SummaryDay[] = [];
  for (const date of dates) {
    const totals = byDate.get(date);
    if (!totals) continue;
    days.push({ date, income: totals.income, expense: totals.expense, net: totals.income - totals.expense });
  }

  const totalIncome = days.reduce((sum, day) => sum + day.income, 0);
  const totalExpense = days.reduce((sum, day) => sum + day.expense, 0);
  const spark = [...days].reverse().slice(-14);

  const inRange = new Set(dates);
  const byCategory = new Map<string, number>();
  for (const entry of money) {
    if (entry.type !== "EXPENSE" || !inRange.has(entry.date)) continue;
    byCategory.set(entry.category, (byCategory.get(entry.category) ?? 0) + entry.amount);
  }

  return {
    days,
    totalIncome,
    totalExpense,
    net: totalIncome - totalExpense,
    spark,
    sparkMax: Math.max(1, ...spark.map((day) => Math.max(day.income, day.expense))),
    topCategories: [...byCategory]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([category, amount]) => ({ category, amount })),
  };
}
