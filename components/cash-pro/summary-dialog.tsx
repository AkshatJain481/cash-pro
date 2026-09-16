"use client";

import { ChartColumn } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { withCashAsset } from "@/lib/cash-pro/assets";
import { prettyDate, toDateKey, weekdayOf } from "@/lib/cash-pro/dates";
import { formatAmount, formatINR } from "@/lib/cash-pro/format";
import { buildInsights } from "@/lib/cash-pro/insights";
import { buildFundSummary, SUMMARY_RANGES, type SummaryRange } from "@/lib/cash-pro/summary";
import { cn } from "@/lib/utils";

import { Meter, StatTile } from "./common";
import { useMinute } from "./hooks";
import { InsightRow } from "./insight-chip";
import { ResponsiveDialog } from "./responsive-dialog";
import { useCashPro } from "./store";

const RANGE_LABEL: Record<SummaryRange, string> = { 7: "7D", 14: "14D", 30: "30D", 0: "All" };

export function SummaryDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        <>
          <ChartColumn className="size-5 text-primary" />
          Daily Fund Summary
        </>
      }
      description="Cash flow, category breakdown and insights"
    >
      <SummaryContent />
    </ResponsiveDialog>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-muted/70 p-3.5">
      <h3 className="mb-3 text-[11px] font-bold tracking-wider text-faint uppercase">{title}</h3>
      {children}
    </section>
  );
}

function SummaryContent() {
  const { money, events, tasks, assets } = useCashPro(
    useShallow((s) => ({ money: s.money, events: s.events, tasks: s.tasks, assets: s.assets })),
  );
  const [range, setRange] = useState<SummaryRange>(7);
  const minute = useMinute();
  const today = toDateKey(new Date(minute));

  const summary = useMemo(() => buildFundSummary(money, range, today), [money, range, today]);
  const insights = useMemo(
    () => buildInsights({ money, events, tasks, assets: withCashAsset(assets, money) }, today),
    [money, events, tasks, assets, today],
  );
  const topCategory = summary.topCategories[0]?.amount ?? 1;

  return (
    <div className="flex flex-col gap-4">
      <ToggleGroup
        type="single"
        variant="outline"
        spacing={0}
        value={String(range)}
        onValueChange={(value) => value && setRange(Number(value) as SummaryRange)}
        className="w-full"
        aria-label="Date range"
      >
        {SUMMARY_RANGES.map((option) => (
          <ToggleGroupItem
            key={option}
            value={String(option)}
            className="flex-1 font-semibold data-[state=on]:bg-secondary data-[state=on]:text-primary"
          >
            {RANGE_LABEL[option]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <StatTile label="Total Receipts" value={formatINR(summary.totalIncome)} tone="income" />
        <StatTile label="Total Payments" value={formatINR(summary.totalExpense)} tone="expense" />
        <StatTile
          label="Net Flow"
          value={formatINR(summary.net)}
          tone={summary.net >= 0 ? "neutral" : "expense"}
          className={cn(
            "col-span-2 sm:col-span-1",
            summary.net >= 0 &&
              "border-transparent bg-linear-to-br from-primary to-primary-accent [&_p]:text-primary-foreground",
          )}
        />
      </div>

      <Panel title="Daily Cash Flow (Receipts vs Payments)">
        {summary.spark.length ? (
          <div className="flex h-20 items-end gap-1.5">
            {summary.spark.map((day) => (
              <div key={day.date} className="flex h-full min-w-0 flex-1 items-end gap-px">
                <div
                  title={`${prettyDate(day.date)}: +${formatAmount(day.income)}`}
                  className="min-h-0.5 flex-1 rounded-t-[3px] bg-income/85"
                  style={{ height: `${(day.income / summary.sparkMax) * 100}%` }}
                />
                <div
                  title={`${prettyDate(day.date)}: -${formatAmount(day.expense)}`}
                  className="min-h-0.5 flex-1 rounded-t-[3px] bg-expense/85"
                  style={{ height: `${(day.expense / summary.sparkMax) * 100}%` }}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-xs text-faint">No entries in this range.</p>
        )}
        <div className="mt-3 flex gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-[3px] bg-income" />
            Receipts
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-[3px] bg-expense" />
            Payments
          </span>
        </div>
      </Panel>

      <Panel title="Top Expense Categories">
        {summary.topCategories.length ? (
          <div className="flex flex-col gap-3">
            {summary.topCategories.map(({ category, amount }) => (
              <div key={category}>
                <div className="mb-1.5 flex justify-between gap-3 text-[13px]">
                  <span className="truncate font-semibold">{category}</span>
                  <span className="shrink-0 font-mono text-expense">{formatINR(amount)}</span>
                </div>
                <Meter value={(amount / topCategory) * 100} className="h-2" barClassName="bg-expense" />
              </div>
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-xs text-faint">No expense data.</p>
        )}
      </Panel>

      <Panel title="Day-by-Day Statement">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {["Date", "Receipts", "Payments", "Net"].map((heading, index) => (
                <TableHead
                  key={heading}
                  className={cn(
                    "h-8 px-2 text-[10px] font-bold tracking-wider text-faint uppercase",
                    index > 0 && "text-right",
                  )}
                >
                  {heading}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {summary.days.length ? (
              summary.days.map((day) => (
                <TableRow key={day.date}>
                  <TableCell className="px-2 py-2">
                    <div className="text-xs font-semibold">{prettyDate(day.date)}</div>
                    <div className="text-[10px] text-faint">{weekdayOf(day.date)}</div>
                  </TableCell>
                  <TableCell className="px-2 text-right font-mono text-xs text-income">
                    +{formatAmount(day.income)}
                  </TableCell>
                  <TableCell className="px-2 text-right font-mono text-xs text-expense">
                    {day.expense > 0 ? `-${formatAmount(day.expense)}` : "—"}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "px-2 text-right font-mono text-xs font-medium",
                      day.net >= 0 ? "text-income" : "text-expense",
                    )}
                  >
                    {day.net >= 0 ? "+" : ""}
                    {formatAmount(day.net)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="py-6 text-center text-faint">
                  No entries in this range.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Panel>

      <Panel title="All Insights">
        <div className="flex flex-col gap-2">
          {insights.map((insight) => (
            <InsightRow key={insight.kind} insight={insight} />
          ))}
        </div>
      </Panel>
    </div>
  );
}
