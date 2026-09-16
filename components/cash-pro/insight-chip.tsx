import {
  CalendarDays,
  ClipboardList,
  Gem,
  Landmark,
  PartyPopper,
  PiggyBank,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import type { Insight, InsightKind, InsightTone } from "@/lib/cash-pro/insights";
import { cn } from "@/lib/utils";

import { IconTile, type Tone } from "./common";

const KIND_ICON: Record<InsightKind, LucideIcon> = {
  "cash-flow": Wallet,
  trend: TrendingUp,
  "peak-spend": TriangleAlert,
  "liquid-cash": Landmark,
  backlog: ClipboardList,
  "all-done": PartyPopper,
  "net-worth": Gem,
  liability: ShieldAlert,
  savings: PiggyBank,
  events: CalendarDays,
  welcome: Sparkles,
};

const TONE: Record<InsightTone, Tone> = { good: "income", warn: "warning", info: "info", bad: "expense" };

const CHIP_STYLE: Record<InsightTone, string> = {
  good: "border-income/25 bg-income/6",
  warn: "border-warning/25 bg-warning/6",
  info: "border-info/25 bg-info/6",
  bad: "border-expense/25 bg-expense/6",
};

const ROW_BORDER: Record<InsightTone, string> = {
  good: "border-l-income",
  warn: "border-l-warning",
  info: "border-l-info",
  bad: "border-l-expense",
};

const iconFor = (insight: Insight) =>
  insight.kind === "trend" && insight.tone === "bad" ? TrendingDown : KIND_ICON[insight.kind];

/** A card in the horizontally scrolling "Smart Insights" strip. */
export function InsightChip({ insight }: { insight: Insight }) {
  return (
    <article
      className={cn("w-[212px] shrink-0 snap-start rounded-2xl border p-3.5 @4xl/main:w-auto", CHIP_STYLE[insight.tone])}
    >
      <IconTile icon={iconFor(insight)} tone={TONE[insight.tone]} className="mb-2 size-8 rounded-lg" />
      <h3 className="text-xs font-bold">{insight.title}</h3>
      <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{insight.body}</p>
    </article>
  );
}

/** A full-width insight, as listed in the daily summary. */
export function InsightRow({ insight }: { insight: Insight }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border border-border/70 border-l-[3px] bg-card p-3",
        ROW_BORDER[insight.tone],
      )}
    >
      <IconTile icon={iconFor(insight)} tone={TONE[insight.tone]} className="size-8 rounded-lg" />
      <div className="min-w-0">
        <p className="text-sm font-bold">{insight.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{insight.body}</p>
      </div>
    </div>
  );
}
