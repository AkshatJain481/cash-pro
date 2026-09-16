"use client";

import { CreditCard, IndianRupee, Landmark, Link2, PencilLine, RefreshCw, Scale } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from "@/components/ui/native-select";
import { summarizeAssets, withCashAsset, type AssetSummary } from "@/lib/cash-pro/assets";
import {
  ASSET_CATEGORIES,
  ASSET_CATEGORY_LABEL,
  isLiability,
  LIMITS,
  type AssetCategory,
} from "@/lib/cash-pro/constants";
import { formatAmount, formatINR } from "@/lib/cash-pro/format";
import type { Asset } from "@/lib/cash-pro/types";
import { cn } from "@/lib/utils";

import {
  DeleteButton,
  EmptyState,
  FormField,
  IconTile,
  Pill,
  SectionCard,
  SplitLayout,
  StatTile,
  SubmitButton,
  toneBg,
  toneText,
  type Tone,
} from "../common";
import { QuickEditDialog } from "../quick-edit-dialog";
import { useCashPro, useCashProActions } from "../store";

const TIERS = [
  {
    key: "high",
    label: "High Liquidity",
    description: "Cash, Bank — instantly accessible",
    tone: "income",
    panel: "border-income/20 bg-income/8",
  },
  {
    key: "medium",
    label: "Medium Liquidity",
    description: "FD, MF, Stocks — accessible in days/weeks",
    tone: "warning",
    panel: "border-warning/20 bg-warning/8",
  },
  {
    key: "low",
    label: "Low / Illiquid",
    description: "Real Estate, Gold, Vehicles — months to liquidate",
    tone: "info",
    panel: "border-info/20 bg-info/8",
  },
] as const satisfies readonly {
  key: "high" | "medium" | "low";
  label: string;
  description: string;
  tone: Tone;
  panel: string;
}[];

export function AssetsScreen() {
  const { assets, money } = useCashPro(useShallow((s) => ({ assets: s.assets, money: s.money })));
  const actions = useCashProActions();
  const [quickEditOpen, setQuickEditOpen] = useState(false);

  const allAssets = useMemo(() => withCashAsset(assets, money), [assets, money]);
  const summary = useMemo(() => summarizeAssets(allAssets), [allAssets]);
  const netTone: Tone = summary.netWorth >= 0 ? "income" : "expense";
  const openQuickEdit = () => setQuickEditOpen(true);

  async function recalculate() {
    if (await actions.resync()) toast.success("Net worth updated!");
  }

  return (
    <>
      <SectionCard>
        <div className="flex flex-col gap-4 @3xl/main:flex-row @3xl/main:items-center @3xl/main:justify-between @3xl/main:gap-8">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-3 @3xl/main:justify-start">
              <p className="text-xs font-medium text-muted-foreground">Total Net Worth</p>
              <Button variant="secondary" size="sm" onClick={recalculate}>
                <RefreshCw />
                Recalculate
              </Button>
            </div>
            <p
              className={cn(
                "mt-1 font-mono text-[28px] leading-tight font-medium tracking-tight break-words tabular-nums @3xl/main:text-4xl",
                toneText[netTone],
              )}
            >
              {formatINR(summary.netWorth)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 @3xl/main:w-[26rem] @3xl/main:shrink-0">
            <StatTile
              label="Total Assets"
              value={formatINR(summary.totalAssets)}
              tone="income"
              valueClassName="@3xl/main:text-lg"
            />
            <StatTile
              label="Liabilities"
              value={formatINR(summary.totalLiabilities)}
              tone="expense"
              valueClassName="@3xl/main:text-lg"
            />
          </div>
        </div>
      </SectionCard>

      <SplitLayout
        sticky
        aside={
          <>
            <AssetForm assets={assets} onQuickEdit={openQuickEdit} />
            <CashSyncCard balance={allAssets[0].value} />
          </>
        }
      >
        <LiquidityCard summary={summary} onQuickEdit={openQuickEdit} onDelete={(id) => void actions.removeAsset(id)} />
        <SectionCard title="Liabilities" icon={CreditCard}>
          {summary.liabilities.length ? (
            <div className="px-1">
              {summary.liabilities.map((asset) => (
                <AssetRow key={asset.id} asset={asset} tone="expense" onDelete={() => void actions.removeAsset(asset.id)} />
              ))}
            </div>
          ) : (
            <EmptyState icon={CreditCard}>No liabilities added.</EmptyState>
          )}
        </SectionCard>
      </SplitLayout>

      <QuickEditDialog open={quickEditOpen} onOpenChange={setQuickEditOpen} />
    </>
  );
}

function CashSyncCard({ balance }: { balance: number }) {
  return (
    <SectionCard className="py-4">
      <div className="flex items-center gap-3">
        <IconTile icon={Link2} tone="income" className="size-10" />
        <div className="min-w-0">
          <p className="text-[13px] font-bold">Cash Auto-Linked to Money Entries</p>
          <p className="text-xs text-muted-foreground">
            Income (Cash mode) adds • Expense (Cash mode) deducts from your Cash asset automatically
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        Cash balance in assets:
        <Pill tone="income" className="font-mono">
          {formatINR(balance)}
        </Pill>
      </div>
    </SectionCard>
  );
}

function LiquidityCard({
  summary,
  onQuickEdit,
  onDelete,
}: {
  summary: AssetSummary;
  onQuickEdit: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <SectionCard
      title="Assets by Liquidity"
      icon={Scale}
      action={
        <Button variant="secondary" size="sm" onClick={onQuickEdit}>
          <PencilLine />
          Quick Edit
        </Button>
      }
    >
      <div
        role="img"
        aria-label={TIERS.map((tier) => `${tier.label}: ${summary[tier.key].percent}%`).join(", ")}
        className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-accent"
      >
        {TIERS.map((tier) => (
          <div
            key={tier.key}
            className={cn("h-full transition-[width] duration-500 ease-out", toneBg[tier.tone])}
            style={{ width: `${summary[tier.key].percent}%` }}
          />
        ))}
      </div>
      <ul className="mt-3 grid gap-2 @4xl/main:grid-cols-3 @4xl/main:gap-3">
        {TIERS.map((tier) => (
          <li
            key={tier.key}
            className="flex items-center gap-2 text-[13px] @4xl/main:flex-col @4xl/main:items-start @4xl/main:gap-1 @4xl/main:rounded-2xl @4xl/main:border @4xl/main:border-border/70 @4xl/main:bg-muted/60 @4xl/main:p-3"
          >
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <span className={cn("size-2.5 shrink-0 rounded-full", toneBg[tier.tone])} />
              <span className="truncate font-medium">{tier.label}</span>
            </span>
            <span className="w-12 shrink-0 text-right font-mono text-[11px] text-faint tabular-nums @4xl/main:order-last @4xl/main:w-auto @4xl/main:text-left">
              {summary[tier.key].percent}% of assets
            </span>
            <span
              className={cn(
                "shrink-0 text-right font-mono font-medium tabular-nums @4xl/main:text-base",
                toneText[tier.tone],
              )}
            >
              {formatINR(summary[tier.key].total)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-col gap-4">
        {TIERS.filter((tier) => summary[tier.key].items.length > 0).map((tier) => (
          <div key={tier.key}>
            <div className={cn("flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5", tier.panel)}>
              <div className="flex min-w-0 items-center gap-2">
                <span className={cn("size-2 shrink-0 rounded-full", toneBg[tier.tone])} />
                <div className="min-w-0">
                  <p className={cn("text-xs font-bold", toneText[tier.tone])}>{tier.label}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{tier.description}</p>
                </div>
              </div>
              <p className={cn("shrink-0 font-mono text-[13px] font-medium", toneText[tier.tone])}>
                {formatINR(summary[tier.key].total)}
              </p>
            </div>
            <div className="mt-1 px-1">
              {summary[tier.key].items.map((asset) => (
                <AssetRow
                  key={asset.id}
                  asset={asset}
                  tone={tier.key === "low" ? "neutral" : tier.tone}
                  onDelete={() => onDelete(asset.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function AssetForm({ assets, onQuickEdit }: { assets: Asset[]; onQuickEdit: () => void }) {
  const actions = useCashProActions();
  const [form, setForm] = useState({ name: "", category: "BANK_ACCOUNT" as AssetCategory, value: "", notes: "" });
  const update = (patch: Partial<typeof form>) => setForm((current) => ({ ...current, ...patch }));

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(form.value);
    if (!form.name.trim() || !(value > 0)) {
      toast.error("Enter name & value");
      return;
    }
    update({ name: "", value: "", notes: "" });
    const saved = await actions.upsertAsset({ name: form.name, category: form.category, value, notes: form.notes });
    if (saved) toast.success("Asset saved!");
  }

  return (
    <SectionCard title="Add / Update Asset" icon={Landmark}>
      <form onSubmit={save} className="flex flex-col gap-3">
        <FormField label="Asset Name" htmlFor="asset-name">
          <Input
            id="asset-name"
            list="asset-names"
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="SBI Savings, Flat in Delhi, Gold, PPF…"
            maxLength={LIMITS.assetName}
            autoComplete="off"
            className="h-11"
          />
          <datalist id="asset-names">
            {assets.map((asset) => (
              <option key={asset.id} value={asset.name} />
            ))}
          </datalist>
        </FormField>
        <div className="grid grid-cols-2 gap-2.5">
          <FormField label="Category" htmlFor="asset-category">
            <NativeSelect
              id="asset-category"
              value={form.category}
              onChange={(e) => update({ category: e.target.value as AssetCategory })}
              className="[&_select]:h-11"
            >
              <NativeSelectOptGroup label="Assets">
                {ASSET_CATEGORIES.filter((category) => !isLiability(category)).map((category) => (
                  <NativeSelectOption key={category} value={category}>
                    {ASSET_CATEGORY_LABEL[category]}
                  </NativeSelectOption>
                ))}
              </NativeSelectOptGroup>
              <NativeSelectOptGroup label="Liabilities">
                {ASSET_CATEGORIES.filter((category) => isLiability(category)).map((category) => (
                  <NativeSelectOption key={category} value={category}>
                    {ASSET_CATEGORY_LABEL[category]}
                  </NativeSelectOption>
                ))}
              </NativeSelectOptGroup>
            </NativeSelect>
          </FormField>
          <FormField label="Value (₹)" htmlFor="asset-value">
            <InputGroup className="h-11">
              <InputGroupAddon>
                <IndianRupee />
              </InputGroupAddon>
              <InputGroupInput
                id="asset-value"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="Current value"
                value={form.value}
                onChange={(e) => update({ value: e.target.value })}
                className="font-mono"
              />
            </InputGroup>
          </FormField>
        </div>
        <FormField label="Notes" htmlFor="asset-notes">
          <Input
            id="asset-notes"
            value={form.notes}
            onChange={(e) => update({ notes: e.target.value })}
            placeholder="Bank, details, last updated…"
            maxLength={LIMITS.assetNotes}
            className="h-11"
          />
        </FormField>
        <div className="flex gap-2">
          <SubmitButton className="w-auto flex-1">Save Asset</SubmitButton>
          <Button type="button" variant="secondary" size="lg" className="h-11" onClick={onQuickEdit}>
            <PencilLine />
            Quick Edit
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}

function AssetRow({ asset, tone, onDelete }: { asset: Asset; tone: Tone; onDelete: () => void }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 border-b border-border/60 py-2.5 last:border-b-0",
        asset.autoLinked && "border-l-[3px] border-l-income pl-2.5",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-1.5 text-sm leading-tight font-semibold">
          {asset.name}
          {asset.autoLinked && (
            <Pill tone="income" className="h-4 px-1.5 text-[10px]">
              <Link2 className="size-2.5" />
              Auto
            </Pill>
          )}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
          {ASSET_CATEGORY_LABEL[asset.category]}
          {asset.notes && ` • ${asset.notes}`}
        </p>
      </div>
      <span className={cn("shrink-0 font-mono text-sm font-medium tabular-nums", toneText[tone])}>
        {formatAmount(asset.value)}
      </span>
      {asset.autoLinked ? (
        <span className="w-8 shrink-0" aria-hidden />
      ) : (
        <DeleteButton iconOnly label={`Delete ${asset.name}`} onClick={onDelete} />
      )}
    </div>
  );
}
