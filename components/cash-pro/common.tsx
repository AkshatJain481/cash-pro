import { ChevronDown, Trash2, type LucideIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from "@/components/ui/empty";
import { Field, FieldLabel, FieldTitle } from "@/components/ui/field";
import {
  PRIORITY_LABEL,
  STATUS_LABEL,
  type EntryType,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/cash-pro/constants";
import { formatAmount } from "@/lib/cash-pro/format";
import { cn } from "@/lib/utils";

// Small building blocks shared by the Cash Pro screens.

export type Tone = "income" | "expense" | "warning" | "info" | "primary" | "neutral";

export const toneText: Record<Tone, string> = {
  income: "text-income",
  expense: "text-expense",
  warning: "text-warning",
  info: "text-info",
  primary: "text-primary",
  neutral: "text-foreground",
};

export const toneSoft: Record<Tone, string> = {
  income: "bg-income/12 text-income",
  expense: "bg-expense/12 text-expense",
  warning: "bg-warning/12 text-warning",
  info: "bg-info/12 text-info",
  primary: "bg-secondary text-primary",
  neutral: "bg-accent text-muted-foreground",
};

export const toneBg: Record<Tone, string> = {
  income: "bg-income",
  expense: "bg-expense",
  warning: "bg-warning",
  info: "bg-info",
  primary: "bg-primary",
  neutral: "bg-border",
};

export function SectionCard({
  title,
  icon: Icon,
  iconClassName,
  action,
  className,
  contentClassName,
  children,
}: {
  title?: ReactNode;
  icon?: LucideIcon;
  iconClassName?: string;
  action?: ReactNode;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
}) {
  return (
    <Card className={cn("gap-4 py-5 shadow-xs", className)}>
      {(title || action) && (
        <div className="flex min-h-8 items-center justify-between gap-3 px-5">
          {title && (
            <h2 className="flex items-center gap-2 text-[15px] font-bold tracking-tight">
              {Icon && <Icon className={cn("size-4 text-muted-foreground", iconClassName)} />}
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      <div className={cn("px-5", contentClassName)}>{children}</div>
    </Card>
  );
}

export function StatTile({
  label,
  value,
  tone = "neutral",
  className,
  valueClassName,
}: {
  label: string;
  value: ReactNode;
  tone?: Tone;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={cn("min-w-0 rounded-2xl border border-border/70 bg-muted/70 px-3 py-3", className)}>
      <p className="truncate text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</p>
      <p
        className={cn(
          "mt-1 font-mono text-[15px] leading-tight font-medium break-words tabular-nums",
          toneText[tone],
          valueClassName,
        )}
      >
        {value}
      </p>
    </div>
  );
}

const labelClassName = "text-[11px] font-bold tracking-wider text-muted-foreground uppercase";

export function FormField({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string;
  /** Omit for controls that aren't labelable elements (e.g. toggle groups). */
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Field className={cn("gap-1.5", className)}>
      {htmlFor ? (
        <FieldLabel htmlFor={htmlFor} className={labelClassName}>
          {label}
        </FieldLabel>
      ) : (
        <FieldTitle className={labelClassName}>{label}</FieldTitle>
      )}
      {children}
    </Field>
  );
}

export function SubmitButton({ className, ...props }: ComponentProps<typeof Button>) {
  return (
    <Button
      type="submit"
      size="lg"
      className={cn(
        "h-11 w-full bg-linear-to-br from-primary to-primary-accent text-[15px] font-semibold shadow-md shadow-primary/25 hover:brightness-110",
        className,
      )}
      {...props}
    />
  );
}

export function EmptyState({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <Empty className="gap-2 rounded-2xl border border-dashed border-border/80 p-6">
      <EmptyHeader className="gap-1.5">
        <EmptyMedia variant="icon" className="mb-1 rounded-xl bg-muted text-faint">
          <Icon />
        </EmptyMedia>
        <EmptyDescription className="text-[13px]">{children}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export function Pill({ tone = "neutral", className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1 rounded-full px-2 text-[11px] font-semibold whitespace-nowrap",
        toneSoft[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export const STATUS_TONE: Record<TaskStatus, Tone> = {
  PENDING: "warning",
  IN_PROGRESS: "info",
  DONE: "income",
  BLOCKED: "expense",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <Pill tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Pill>;
}

const PRIORITY_TONE: Record<TaskPriority, Tone> = {
  CRITICAL: "expense",
  HIGH: "warning",
  MEDIUM: "info",
  LOW: "income",
};

export function PriorityLabel({ priority }: { priority: TaskPriority }) {
  const tone = PRIORITY_TONE[priority];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-bold", toneText[tone])}>
      <span className={cn("size-1.5 rounded-full", toneBg[tone])} />
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

export function SignedAmount({ type, amount, className }: { type: EntryType; amount: number; className?: string }) {
  const income = type === "INCOME";
  return (
    <span
      className={cn(
        "font-mono font-medium whitespace-nowrap tabular-nums",
        income ? "text-income" : "text-expense",
        className,
      )}
    >
      {income ? "+" : "-"}
      {formatAmount(amount)}
    </span>
  );
}

export function IconTile({ icon: Icon, tone, className }: { icon: LucideIcon; tone: Tone; className?: string }) {
  return (
    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", toneSoft[tone], className)}>
      <Icon className="size-4" />
    </span>
  );
}

export function ListItem({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-2xl border border-border/70 bg-muted/60 p-3.5 transition-shadow hover:shadow-xs", className)}
      {...props}
    />
  );
}

export function Note({
  icon: Icon,
  tone = "neutral",
  className,
  children,
}: {
  icon?: LucideIcon;
  tone?: "neutral" | "warning";
  className?: string;
  children: ReactNode;
}) {
  return (
    <p
      className={cn(
        "mt-2.5 flex gap-2 rounded-xl px-3 py-2 text-xs leading-relaxed",
        tone === "warning" ? "bg-warning/10 text-warning" : "bg-accent/70 text-muted-foreground",
        className,
      )}
    >
      {Icon && <Icon className="mt-0.5 size-3.5 shrink-0" />}
      <span className="min-w-0 break-words whitespace-pre-wrap">{children}</span>
    </p>
  );
}

export function DeleteButton({
  onClick,
  label = "Delete",
  iconOnly = false,
}: {
  onClick: () => void;
  label?: string;
  iconOnly?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="destructive"
      size={iconOnly ? "icon-sm" : "sm"}
      onClick={onClick}
      aria-label={label}
    >
      <Trash2 />
      {!iconOnly && label}
    </Button>
  );
}

export function Meter({ value, className, barClassName }: { value: number; className?: string; barClassName?: string }) {
  return (
    <div className={cn("h-1.5 overflow-hidden rounded-full bg-accent", className)}>
      <div
        className={cn("h-full rounded-full transition-[width] duration-500 ease-out", barClassName)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function ShowMore({ remaining, onClick }: { remaining: number; onClick: () => void }) {
  return (
    <Button type="button" variant="ghost" size="sm" className="self-center text-muted-foreground" onClick={onClick}>
      <ChevronDown />
      Show more ({remaining} left)
    </Button>
  );
}

/** A compact row for the home feed: coloured dot, title, meta and a trailing value. */
export function FeedRow({
  dotClassName,
  title,
  meta,
  trailing,
  note,
}: {
  dotClassName: string;
  title: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
  note?: ReactNode;
}) {
  return (
    <ListItem className="py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={cn("size-2.5 shrink-0 rounded-full", dotClassName)} />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{title}</p>
            {meta && <p className="truncate font-mono text-[11px] text-faint">{meta}</p>}
          </div>
        </div>
        {trailing && <div className="shrink-0">{trailing}</div>}
      </div>
      {note && <p className="mt-1 pl-5 text-xs break-words text-muted-foreground">{note}</p>}
    </ListItem>
  );
}

/**
 * One column on phones. When the content area is wide, `aside` (usually a
 * form) sits in a narrower column beside `children`.
 */
export function SplitLayout({
  aside,
  sticky = false,
  children,
}: {
  aside: ReactNode;
  /** Keep the aside in view while scrolling long lists. Only for short asides. */
  sticky?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-3 @4xl/main:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] @4xl/main:items-start @4xl/main:gap-5 @5xl/main:grid-cols-[minmax(0,25rem)_minmax(0,1fr)]">
      <div className={cn("flex min-w-0 flex-col gap-3 @4xl/main:gap-5", sticky && "@4xl/main:sticky @4xl/main:top-[5.25rem]")}>
        {aside}
      </div>
      <div className="flex min-w-0 flex-col gap-3 @4xl/main:gap-5">{children}</div>
    </div>
  );
}
