"use client";

import {
  AlarmClock,
  ArrowDownLeft,
  ArrowUpRight,
  CircleCheck,
  Inbox,
  Lightbulb,
  SquareCheckBig,
  type LucideIcon,
} from "lucide-react";
import { useMemo, type CSSProperties } from "react";
import { useShallow } from "zustand/react/shallow";

import { Button } from "@/components/ui/button";
import { summarizeAssets, withCashAsset } from "@/lib/cash-pro/assets";
import { ENTRY_TYPE_LABEL, PAYMENT_MODE_LABEL } from "@/lib/cash-pro/constants";
import { atLocalTime, clockTime, longDate, prettyDate, toDateKey } from "@/lib/cash-pro/dates";
import { formatAmount, formatINR } from "@/lib/cash-pro/format";
import { buildInsights } from "@/lib/cash-pro/insights";
import { cn } from "@/lib/utils";

import { EmptyState, FeedRow, Pill, SectionCard, SignedAmount, StatTile, StatusBadge } from "../common";
import { useMinute } from "../hooks";
import { InsightChip } from "../insight-chip";
import { useCashPro } from "../store";

const DAY_MS = 24 * 60 * 60 * 1000;

// On wide layouts the stat tiles fill the column beside the hero.
const statTileClass = "bg-card @container @4xl/main:flex @4xl/main:flex-col @4xl/main:justify-between @4xl/main:p-4";
const statValueClass = "@4xl/main:text-2xl";

export function HomeScreen({ onOpenSummary }: { onOpenSummary: () => void }) {
  const { money, events, tasks, todos, assets } = useCashPro(
    useShallow((s) => ({ money: s.money, events: s.events, tasks: s.tasks, todos: s.todos, assets: s.assets })),
  );
  const minute = useMinute();
  const now = new Date(minute);
  const today = toDateKey(new Date(minute));

  const allAssets = useMemo(() => withCashAsset(assets, money), [assets, money]);
  const { netWorth, totalAssets, totalLiabilities } = useMemo(() => summarizeAssets(allAssets), [allAssets]);
  const insights = useMemo(
    () => buildInsights({ money, events, tasks, assets: allAssets }, today),
    [money, events, tasks, allAssets, today],
  );

  const todaysMoney = money.filter((entry) => entry.date === today);
  const receipts = todaysMoney.reduce((sum, e) => (e.type === "INCOME" ? sum + e.amount : sum), 0);
  const payments = todaysMoney.reduce((sum, e) => (e.type === "EXPENSE" ? sum + e.amount : sum), 0);
  const todaysEvents = events.filter((e) => e.date === today).sort((a, b) => a.time.localeCompare(b.time));
  const tasksDueToday = tasks.filter((t) => t.dueDate === today && t.status !== "DONE");
  const upcomingEvents = events
    .filter((e) => {
      const start = atLocalTime(e.date, e.time).getTime();
      return start >= minute && start <= minute + DAY_MS;
    })
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  return (
    // Dense packing lets the stat tiles fill the gap beside the hero on wide layouts.
    <div className="grid gap-3 @4xl/main:grid-flow-row-dense @4xl/main:grid-cols-3 @4xl/main:gap-5">
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-hero-from to-hero-to px-5 pt-5 pb-4 text-white shadow-lg shadow-hero-from/25 @4xl/main:col-span-2 @4xl/main:px-7 @4xl/main:py-6">
        <div aria-hidden className="pointer-events-none absolute -top-10 -right-8 size-32 rounded-full bg-white/7 @4xl/main:size-56" />
        <div aria-hidden className="pointer-events-none absolute -bottom-6 left-12 size-24 rounded-full bg-white/5" />
        <div aria-hidden className="pointer-events-none absolute top-8 right-10 size-12 rounded-full bg-white/4" />

        <p className="relative font-mono text-[11px] tracking-wide text-white/65">
          {longDate(now)} — {clockTime(now, false)}
        </p>
        <p className="relative mt-3 font-mono text-[32px] leading-none font-medium tracking-tight break-words tabular-nums @4xl/main:mt-4 @4xl/main:text-[44px]">
          {formatINR(netWorth)}
        </p>
        <div className="relative mt-2 flex items-center gap-2">
          <span className="text-[11px] font-semibold tracking-[0.08em] text-white/60 uppercase">Net Worth</span>
          {netWorth < 0 && (
            <span className="rounded-full bg-red-400/25 px-2 py-0.5 text-[10px] font-semibold text-red-100">Negative</span>
          )}
        </div>
        <p className="relative mt-1 font-mono text-[10.5px] text-white/50 @4xl/main:text-xs">
          Assets {formatINR(totalAssets)} · Liabilities {formatINR(totalLiabilities)}
        </p>

        <div className="relative mt-4 grid grid-cols-3 gap-2 @4xl/main:mt-6 @4xl/main:gap-3">
          <HeroStat icon={ArrowDownLeft} label="Today Receipts" value={formatAmount(receipts)} />
          <HeroStat icon={ArrowUpRight} label="Today Payments" value={formatAmount(payments)} />
          <HeroStat
            icon={SquareCheckBig}
            label="Open Tasks"
            value={String(tasks.filter((t) => t.status !== "DONE").length)}
          />
        </div>
      </section>

      <SectionCard
        title="Smart Insights"
        icon={Lightbulb}
        iconClassName="text-warning"
        action={
          <Button size="sm" variant="secondary" onClick={onOpenSummary}>
            Full Summary
          </Button>
        }
        className="gap-3 @4xl/main:col-span-3"
        contentClassName="px-0"
      >
        <div className="no-scrollbar flex snap-x snap-mandatory scroll-px-5 gap-2.5 overflow-x-auto px-5 pb-1 @4xl/main:grid @4xl/main:grid-cols-3 @4xl/main:gap-3 @4xl/main:overflow-visible @6xl/main:grid-cols-4">
          {insights.map((insight) => (
            <InsightChip key={insight.kind} insight={insight} />
          ))}
        </div>
      </SectionCard>

      <div className="grid grid-cols-2 gap-2 @4xl/main:gap-3">
        <StatTile
          label="Net Today"
          value={<FitValue>{formatINR(receipts - payments)}</FitValue>}
          tone={receipts - payments >= 0 ? "income" : "expense"}
          className={statTileClass}
          valueClassName={statValueClass}
        />
        <StatTile label="Events Today" value={todaysEvents.length} className={statTileClass} valueClassName={statValueClass} />
        <StatTile
          label="Pending To-Dos"
          value={todos.filter((t) => t.status === "PENDING").length}
          className={statTileClass}
          valueClassName={statValueClass}
        />
        <StatTile
          label="Blocked Tasks"
          value={tasks.filter((t) => t.status === "BLOCKED").length}
          tone="expense"
          className={statTileClass}
          valueClassName={statValueClass}
        />
      </div>

      <SectionCard
        title="Today's Activity"
        action={<span className="font-mono text-[11px] text-faint">{prettyDate(today)}</span>}
        className="@4xl/main:col-span-2"
      >
        {todaysEvents.length + todaysMoney.length + tasksDueToday.length > 0 ? (
          <div className="flex flex-col gap-2">
            {todaysEvents.map((event) => (
              <FeedRow
                key={event.id}
                dotClassName="bg-warning"
                title={event.title}
                meta={`Event • ${prettyDate(event.date)}`}
                trailing={<Pill tone="warning" className="font-mono">{event.time}</Pill>}
                note={event.notes}
              />
            ))}
            {[...todaysMoney].reverse().map((entry) => (
              <FeedRow
                key={entry.id}
                dotClassName={entry.type === "INCOME" ? "bg-income" : "bg-expense"}
                title={entry.category}
                meta={`${PAYMENT_MODE_LABEL[entry.mode]} • ${ENTRY_TYPE_LABEL[entry.type]}`}
                trailing={<SignedAmount type={entry.type} amount={entry.amount} className="text-[15px]" />}
                note={entry.narration}
              />
            ))}
            {tasksDueToday.map((task) => (
              <FeedRow
                key={task.id}
                dotClassName="bg-info"
                title={task.title}
                meta="Task due today"
                trailing={<StatusBadge status={task.status} />}
              />
            ))}
          </div>
        ) : (
          <EmptyState icon={Inbox}>Nothing logged today yet.</EmptyState>
        )}
      </SectionCard>

      <SectionCard title="Next 24 Hours" icon={AlarmClock}>
        {upcomingEvents.length + tasksDueToday.length > 0 ? (
          <div className="flex flex-col gap-2">
            {upcomingEvents.map((event) => (
              <FeedRow
                key={event.id}
                dotClassName="bg-warning"
                title={event.title}
                meta={prettyDate(event.date)}
                trailing={<Pill tone="warning" className="font-mono">{event.time}</Pill>}
              />
            ))}
            {tasksDueToday.map((task) => (
              <FeedRow key={task.id} dotClassName="bg-info" title={task.title} trailing={<Pill tone="primary">Task</Pill>} />
            ))}
          </div>
        ) : (
          <EmptyState icon={CircleCheck}>All clear for the next 24 hours!</EmptyState>
        )}
      </SectionCard>
    </div>
  );
}

/**
 * The desktop stat tiles are narrow, so an amount shrinks with the tile's width
 * instead of wrapping mid-number.
 */
function FitValue({ children }: { children: string }) {
  return (
    <span
      style={{ "--chars": children.length } as CSSProperties}
      className="@4xl/main:text-[length:clamp(0.875rem,calc(100cqi/(var(--chars)*0.64)),1.5rem)] @4xl/main:whitespace-nowrap"
    >
      {children}
    </span>
  );
}

function HeroStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur-sm @4xl/main:px-4 @4xl/main:py-3">
      <p
        className={cn(
          "font-mono leading-tight font-medium break-words tabular-nums @4xl/main:text-lg",
          // Long amounts shrink to stay on one line in the narrow phone tile.
          value.length > 11 ? "text-xs" : value.length > 9 ? "text-[13px]" : "text-[15px]",
        )}
      >
        {value}
      </p>
      <p className="mt-1 flex items-center gap-1 text-[10px] leading-tight text-white/70 @4xl/main:text-xs">
        <Icon className="size-3 shrink-0" />
        {label}
      </p>
    </div>
  );
}
