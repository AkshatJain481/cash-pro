"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  ChartNoAxesColumn,
  History,
  IndianRupee,
  Inbox,
  NotebookPen,
  ReceiptIndianRupee,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  ENTRY_TYPE_LABEL,
  LIMITS,
  PAYMENT_MODE_LABEL,
  PAYMENT_MODES,
  type EntryType,
  type PaymentMode,
} from "@/lib/cash-pro/constants";
import { prettyDate, toDateKey, todayKey } from "@/lib/cash-pro/dates";
import { formatINR } from "@/lib/cash-pro/format";
import type { MoneyEntry } from "@/lib/cash-pro/types";
import { cn } from "@/lib/utils";

import {
  DeleteButton,
  EmptyState,
  FormField,
  IconTile,
  ListItem,
  Note,
  SectionCard,
  ShowMore,
  SignedAmount,
  SplitLayout,
  StatTile,
  SubmitButton,
} from "../common";
import { useMinute } from "../hooks";
import { useCashPro, useCashProActions } from "../store";

const PAGE_SIZE = 25;

export function MoneyScreen() {
  const money = useCashPro((s) => s.money);

  return (
    <SplitLayout sticky aside={<EntryForm money={money} />}>
      <DailySummary money={money} />
      <AllEntries money={money} />
    </SplitLayout>
  );
}

function EntryForm({ money }: { money: MoneyEntry[] }) {
  const actions = useCashProActions();
  const [form, setForm] = useState(() => ({
    date: todayKey(),
    type: "EXPENSE" as EntryType,
    category: "",
    amount: "",
    mode: "CASH" as PaymentMode,
    narration: "",
  }));
  const update = (patch: Partial<typeof form>) => setForm((current) => ({ ...current, ...patch }));

  // Most recently used categories first, for the suggestions list.
  const categories = useMemo(() => [...new Set(money.map((m) => m.category).reverse())].slice(0, 50), [money]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.date || !form.category.trim() || !(amount > 0)) {
      toast.error("Fill date, category & amount");
      return;
    }
    update({ category: "", amount: "", narration: "" });
    const saved = await actions.addMoneyEntry({
      date: form.date,
      type: form.type,
      category: form.category,
      amount,
      mode: form.mode,
      narration: form.narration,
    });
    if (saved) toast.success("Entry saved! Cash balance updated.");
  }

  return (
    <SectionCard title="Add R&P Entry" icon={ReceiptIndianRupee}>
      <form onSubmit={save} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2.5">
          <FormField label="Date" htmlFor="money-date">
            <Input
              id="money-date"
              type="date"
              value={form.date}
              onChange={(e) => update({ date: e.target.value })}
              className="h-11"
            />
          </FormField>
          <FormField label="Type">
            <ToggleGroup
              type="single"
              variant="outline"
              spacing={0}
              value={form.type}
              onValueChange={(value) => value && update({ type: value as EntryType })}
              aria-label="Entry type"
              className="w-full"
            >
              <ToggleGroupItem
                value="EXPENSE"
                className="h-11 flex-1 font-semibold data-[state=on]:bg-expense/12 data-[state=on]:text-expense"
              >
                Expense
              </ToggleGroupItem>
              <ToggleGroupItem
                value="INCOME"
                className="h-11 flex-1 font-semibold data-[state=on]:bg-income/12 data-[state=on]:text-income"
              >
                Income
              </ToggleGroupItem>
            </ToggleGroup>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <FormField label="Category" htmlFor="money-category">
            <Input
              id="money-category"
              list="money-categories"
              value={form.category}
              onChange={(e) => update({ category: e.target.value })}
              placeholder="Food, Salary, Rent…"
              maxLength={LIMITS.category}
              autoComplete="off"
              className="h-11"
            />
            <datalist id="money-categories">
              {categories.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
          </FormField>
          <FormField label="Amount (₹)" htmlFor="money-amount">
            <InputGroup className="h-11">
              <InputGroupAddon>
                <IndianRupee />
              </InputGroupAddon>
              <InputGroupInput
                id="money-amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => update({ amount: e.target.value })}
                className="font-mono"
              />
            </InputGroup>
          </FormField>
        </div>

        <FormField label="Mode" htmlFor="money-mode">
          <NativeSelect
            id="money-mode"
            value={form.mode}
            onChange={(e) => update({ mode: e.target.value as PaymentMode })}
            className="[&_select]:h-11"
          >
            {PAYMENT_MODES.map((mode) => (
              <NativeSelectOption key={mode} value={mode}>
                {PAYMENT_MODE_LABEL[mode]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>

        <FormField label="Narration / Description" htmlFor="money-narration">
          <Textarea
            id="money-narration"
            value={form.narration}
            onChange={(e) => update({ narration: e.target.value })}
            placeholder="Party name, purpose, invoice#, remarks…"
            maxLength={LIMITS.narration}
            className="min-h-20"
          />
        </FormField>

        <SubmitButton>Save Entry</SubmitButton>
      </form>
    </SectionCard>
  );
}

function DailySummary({ money }: { money: MoneyEntry[] }) {
  const actions = useCashProActions();
  const minute = useMinute();
  const today = toDateKey(new Date(minute));
  const [date, setDate] = useState(() => todayKey());

  const entries = money.filter((entry) => entry.date === date).reverse();
  const income = entries.reduce((sum, e) => (e.type === "INCOME" ? sum + e.amount : sum), 0);
  const expense = entries.reduce((sum, e) => (e.type === "EXPENSE" ? sum + e.amount : sum), 0);
  const net = income - expense;

  return (
    <SectionCard title="R&P Daily Summary" icon={ChartNoAxesColumn}>
      <div className="flex gap-2 @4xl/main:max-w-sm">
        <Input
          type="date"
          aria-label="Summary date"
          value={date}
          onChange={(e) => setDate(e.target.value || today)}
          className="h-10 flex-1"
        />
        <Button type="button" variant="secondary" className="h-10 px-4" onClick={() => setDate(today)}>
          Today
        </Button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 @5xl/main:grid-cols-4">
        <StatTile label="Income" value={formatINR(income)} tone="income" />
        <StatTile label="Expense" value={formatINR(expense)} tone="expense" />
        <StatTile label="Net" value={formatINR(net)} tone={net >= 0 ? "income" : "expense"} />
        <StatTile label="Entries" value={entries.length} />
      </div>

      <div className="mt-3 grid gap-2 @6xl/main:grid-cols-2 @6xl/main:items-start">
        {entries.length ? (
          entries.map((entry) => {
            const isIncome = entry.type === "INCOME";
            return (
              <ListItem key={entry.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <IconTile icon={isIncome ? ArrowDownLeft : ArrowUpRight} tone={isIncome ? "income" : "expense"} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{entry.category}</p>
                      <p className="font-mono text-[11px] text-faint">
                        {PAYMENT_MODE_LABEL[entry.mode]} • {prettyDate(entry.date)}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <SignedAmount type={entry.type} amount={entry.amount} className="text-base" />
                    <p className="text-[11px] text-faint">{ENTRY_TYPE_LABEL[entry.type]}</p>
                  </div>
                </div>
                {entry.narration && <Note icon={NotebookPen}>{entry.narration}</Note>}
                <div className="mt-2.5 flex">
                  <DeleteButton onClick={() => void actions.removeMoneyEntry(entry.id)} />
                </div>
              </ListItem>
            );
          })
        ) : (
          <div className="@6xl/main:col-span-2">
            <EmptyState icon={Inbox}>No entries for this date.</EmptyState>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

function AllEntries({ money }: { money: MoneyEntry[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const newestFirst = useMemo(() => [...money].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [money]);

  return (
    <SectionCard
      title="All R&P Entries"
      icon={History}
      action={<span className="font-mono text-[11px] text-faint">{money.length} total</span>}
    >
      {newestFirst.length ? (
        <div className="flex flex-col gap-2">
          {newestFirst.slice(0, visible).map((entry) => (
            <ListItem key={entry.id} className="py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={cn(
                      "h-8 w-1.5 shrink-0 rounded-full",
                      entry.type === "INCOME" ? "bg-income" : "bg-expense",
                    )}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold">{entry.category}</p>
                    <p className="font-mono text-[11px] text-faint">
                      {prettyDate(entry.date)} • {PAYMENT_MODE_LABEL[entry.mode]}
                    </p>
                  </div>
                </div>
                {entry.narration && (
                  <p className="hidden min-w-0 flex-1 truncate text-xs text-muted-foreground @4xl/main:block">
                    {entry.narration}
                  </p>
                )}
                <SignedAmount type={entry.type} amount={entry.amount} className="text-sm" />
              </div>
              {entry.narration && (
                <p className="mt-1.5 pl-4 text-[11px] break-words text-muted-foreground @4xl/main:hidden">
                  {entry.narration}
                </p>
              )}
            </ListItem>
          ))}
          {newestFirst.length > visible && (
            <ShowMore remaining={newestFirst.length - visible} onClick={() => setVisible((count) => count + PAGE_SIZE)} />
          )}
        </div>
      ) : (
        <EmptyState icon={BookOpen}>No entries yet.</EmptyState>
      )}
    </SectionCard>
  );
}
