"use client";

import { Link2, PencilLine } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { computeCashBalance } from "@/lib/cash-pro/assets";
import { ASSET_CATEGORY_LABEL } from "@/lib/cash-pro/constants";
import { formatAmount } from "@/lib/cash-pro/format";

import { Pill } from "./common";
import { ResponsiveDialog } from "./responsive-dialog";
import { useCashPro, useCashProActions } from "./store";

export function QuickEditDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        <>
          <PencilLine className="size-5 text-primary" />
          Quick Edit Values
        </>
      }
      description="Update the current value of every asset and liability at once"
      className="sm:max-w-md"
    >
      <QuickEditForm onDone={() => onOpenChange(false)} />
    </ResponsiveDialog>
  );
}

function QuickEditForm({ onDone }: { onDone: () => void }) {
  const { assets, money } = useCashPro(useShallow((s) => ({ assets: s.assets, money: s.money })));
  const actions = useCashProActions();
  const [values, setValues] = useState(() => Object.fromEntries(assets.map((a) => [a.id, String(a.value)])));

  async function save() {
    const updates = assets.flatMap((asset) => {
      const value = Number(values[asset.id] ?? asset.value);
      return Number.isFinite(value) && value >= 0 && value !== asset.value ? [{ id: asset.id, value }] : [];
    });
    onDone();
    if (!updates.length || (await actions.setAssetValues(updates))) toast.success("All values updated!");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="divide-y divide-border/70 rounded-2xl border border-border/70 bg-muted/50 px-3.5">
        <div className="flex items-center gap-3 border-l-[3px] border-l-income py-2.5 pl-2.5">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              Cash Balance
              <Pill tone="income" className="h-4 px-1.5 text-[10px]">
                <Link2 className="size-2.5" />
                Auto-synced
              </Pill>
            </p>
            <p className="text-[11px] text-muted-foreground">Cash</p>
          </div>
          <span className="font-mono text-[13px] text-income">
            {formatAmount(Math.max(0, computeCashBalance(money)))}
          </span>
        </div>
        {assets.map((asset) => (
          <label key={asset.id} className="flex items-center gap-3 py-2.5">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{asset.name}</span>
              <span className="block text-[11px] text-muted-foreground">{ASSET_CATEGORY_LABEL[asset.category]}</span>
            </span>
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={values[asset.id] ?? ""}
              onChange={(event) => setValues((current) => ({ ...current, [asset.id]: event.target.value }))}
              className="h-9 w-32 text-right font-mono"
            />
          </label>
        ))}
      </div>
      {!assets.length && (
        <p className="text-center text-xs text-muted-foreground">Add an asset first to edit its value here.</p>
      )}
      <Button size="lg" className="h-11 w-full" onClick={save}>
        Save All Changes
      </Button>
    </div>
  );
}
