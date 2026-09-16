"use client";

import {
  CalendarPlus,
  ChartColumn,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FolderOpen,
  LogOut,
  Mail,
  Moon,
  Share2,
  Sheet as SheetIcon,
  Sun,
  Upload,
  X,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { summarizeAssets, withCashAsset } from "@/lib/cash-pro/assets";
import { parseAssetsCsv, readBackupHeader, type ImportedAsset } from "@/lib/cash-pro/backup";
import { formatINR } from "@/lib/cash-pro/format";
import { cn } from "@/lib/utils";

import { THEME_OPTIONS, UserAvatar, useAppTheme, useSignOut, type ThemePreference } from "./account";
import { useBackupTools } from "./backup-tools";
import { toneSoft } from "./common";
import { useCashPro, useCashProActions } from "./store";

type SettingsSheetProps = {
  side: "left" | "right";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenSummary: () => void;
};

/**
 * The sheet is mostly read-only, so focus lands on the panel itself rather than
 * selecting the backup email (or opening the keyboard on phones).
 */
function focusSheet(event: Event) {
  event.preventDefault();
  (event.currentTarget as HTMLElement | null)?.focus({ preventScroll: true });
}

/** Profile, data overview, backup & restore and app settings. */
export function SettingsSheet({ side, open, onOpenChange, onOpenSummary }: SettingsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        showCloseButton={false}
        onOpenAutoFocus={focusSheet}
        className="gap-0 p-0 data-[side=left]:w-[min(360px,92vw)] data-[side=left]:sm:max-w-[360px] data-[side=right]:w-[min(400px,92vw)] data-[side=right]:sm:max-w-[400px]"
      >
        <SettingsPanel close={() => onOpenChange(false)} onOpenSummary={onOpenSummary} />
      </SheetContent>
    </Sheet>
  );
}

function SettingsPanel({ close, onOpenSummary }: { close: () => void; onOpenSummary: () => void }) {
  const { user, money, events, tasks, assets, backupLog, lastBackupAt } = useCashPro(
    useShallow((s) => ({
      user: s.user,
      money: s.money,
      events: s.events,
      tasks: s.tasks,
      assets: s.assets,
      backupLog: s.backupLog,
      lastBackupAt: s.lastBackupAt,
    })),
  );
  const actions = useCashProActions();
  const tools = useBackupTools();
  const { signOut, pending: signingOut } = useSignOut();

  const [gmail, setGmail] = useState(user.email);
  const [restore, setRestore] = useState<{ backup: unknown; exported: string } | null>(null);
  const [importRows, setImportRows] = useState<ImportedAsset[] | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [busy, setBusy] = useState(false);

  const stats = useMemo(() => {
    const allAssets = withCashAsset(assets, money);
    const receipts = money.reduce((sum, m) => (m.type === "INCOME" ? sum + m.amount : sum), 0);
    const payments = money.reduce((sum, m) => (m.type === "EXPENSE" ? sum + m.amount : sum), 0);
    return [
      ["R&P Entries", money.length],
      ["Total Receipts", formatINR(receipts)],
      ["Total Payments", formatINR(payments)],
      ["Net (R-P)", formatINR(receipts - payments)],
      ["Tasks", tasks.length],
      ["Events", events.length],
      ["Assets / Liabilities", allAssets.length],
      ["Net Worth", formatINR(summarizeAssets(allAssets).netWorth)],
    ] as const;
  }, [money, events, tasks, assets]);

  async function readRestoreFile(file: File) {
    try {
      const backup: unknown = JSON.parse(await file.text());
      const header = readBackupHeader(backup);
      if (!header) {
        toast.error("❌ Not a valid CashPro backup file");
        return;
      }
      setRestore({ backup, exported: header.exported?.slice(0, 10) ?? "an unknown date" });
    } catch {
      toast.error("❌ Could not read backup file");
    }
  }

  async function confirmRestore() {
    if (!restore) return;
    setBusy(true);
    const result = await actions.restoreFromBackup(restore.backup);
    setBusy(false);
    setRestore(null);
    if (!result) return;
    toast.success(
      result.skipped
        ? `✅ Data restored (${result.skipped} invalid rows skipped)`
        : "✅ Data restored successfully!",
    );
    close();
  }

  async function readImportFile(file: File) {
    if (/\.xlsx?$/i.test(file.name)) {
      toast.error("Save the sheet as CSV (File → Save As → CSV), then import the .csv file");
      return;
    }
    try {
      const rows = parseAssetsCsv(await file.text());
      if (!rows.length) toast.error("No valid asset rows found in file");
      else setImportRows(rows);
    } catch {
      toast.error("❌ Could not parse file. Use CSV with columns: Name, Category, Value, Notes");
    }
  }

  async function runImport(mode: "merge" | "replace") {
    if (!importRows) return;
    setBusy(true);
    const imported = await actions.importAssetRows({ mode, assets: importRows });
    setBusy(false);
    setImportRows(null);
    if (!imported) return;
    toast.success(`✅ ${importRows.length} assets imported!`);
    actions.recordBackup(`📋 Imported ${importRows.length} assets from file`);
    close();
  }

  return (
    <>
      <SheetHeader className="relative gap-3 overflow-hidden bg-linear-to-br from-hero-from to-hero-to p-5 text-white">
        <div aria-hidden className="pointer-events-none absolute -top-12 -right-10 size-36 rounded-full bg-white/7" />
        <p className="relative text-[11px] font-semibold tracking-wider text-white/60 uppercase">
          Cash Pro · Settings &amp; Backup
        </p>
        <div className="relative flex items-center gap-3">
          <UserAvatar
            user={user}
            className="size-12 ring-2 ring-white/25 after:hidden"
            fallbackClassName="bg-white/15 text-white"
          />
          <div className="min-w-0">
            <SheetTitle className="truncate text-lg font-bold text-white">{user.name}</SheetTitle>
            <SheetDescription className="truncate text-xs text-white/70">{user.email}</SheetDescription>
          </div>
        </div>
        <p className="relative font-mono text-[11px] text-white/70">
          Last backup: {lastBackupAt ? new Date(lastBackupAt).toLocaleString("en-IN") : "Never"}
        </p>
      </SheetHeader>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4">
        <Section title="Your Data">
          <dl className="divide-y divide-border/70 rounded-2xl border border-border/70 bg-muted/50 px-3.5">
            {stats.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 py-2 text-[13px]">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-mono font-medium text-primary">{value}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section title="Backup">
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              tools.sendToGmail(gmail.trim());
            }}
          >
            <Input
              type="email"
              value={gmail}
              onChange={(event) => setGmail(event.target.value)}
              placeholder="yourname@gmail.com"
              aria-label="Gmail address"
              className="h-10 flex-1"
            />
            <Button type="submit" className="h-10">
              <Mail />
              Send
            </Button>
          </form>
          <ActionRow
            icon={Download}
            tile={toneSoft.income}
            title="Download JSON Backup"
            description="Full backup to your Downloads folder"
            onClick={() => tools.downloadJson()}
          />
          <ActionRow
            icon={FileSpreadsheet}
            tile={toneSoft.info}
            title="Export R&P as CSV"
            description="Income & expense ledger for Excel / Sheets"
            onClick={tools.exportMoneyCsv}
          />
          <ActionRow
            icon={SheetIcon}
            tile="bg-violet-500/12 text-violet-700 dark:text-violet-300"
            title="Export Assets for Excel (CSV)"
            description="Assets & liabilities with liquidity classification"
            onClick={() => {
              tools.exportAssetsCsv();
              close();
            }}
          />
          <ActionRow
            icon={Share2}
            tile={toneSoft.warning}
            title="Share via WhatsApp / Drive"
            description="Use your phone's share menu"
            onClick={tools.share}
          />
        </Section>

        <Section title="Import & Restore">
          <DropZone
            icon={FolderOpen}
            title="Restore from JSON backup"
            description="Tap or drop a file · current data will be replaced"
            accept=".json,application/json"
            onFile={readRestoreFile}
          />
          <DropZone
            icon={Upload}
            title="Import assets from CSV"
            description="Columns: Name, Category, Value, Notes"
            accept=".csv,text/csv"
            onFile={readImportFile}
          />
        </Section>

        <Section title="Analytics">
          <ActionRow
            icon={ChartColumn}
            tile={toneSoft.income}
            title="Daily Fund Summary"
            description="Cash flow, insights, category breakdown"
            onClick={onOpenSummary}
          />
        </Section>

        <Section title="App">
          <ThemeRow />
          <ActionRow
            icon={CalendarPlus}
            tile={toneSoft.warning}
            title="Add Weekly Backup Reminder"
            description="Adds an event to your Calendar tab"
            onClick={tools.addBackupReminder}
          />
        </Section>

        <Section title="Account">
          <ActionRow
            icon={LogOut}
            tile={toneSoft.expense}
            title="Sign out"
            description={`Signed in with Google as ${user.email}`}
            onClick={signOut}
            disabled={busy || signingOut}
          />
        </Section>

        <Section
          title="Backup History"
          action={
            backupLog.length > 0 && (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="text-[11px] font-bold text-expense hover:underline"
              >
                Clear
              </button>
            )
          }
        >
          {backupLog.length ? (
            <ul className="divide-y divide-border/70 font-mono text-[11px] text-muted-foreground">
              {backupLog.slice(0, 8).map((entry) => (
                <li key={entry.id} className="py-1.5">
                  ✓ {entry.method} — {new Date(entry.createdAt).toLocaleString("en-IN")}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-faint">No backups yet.</p>
          )}
        </Section>
      </div>

      <SheetFooter className="border-t p-3">
        <SheetClose asChild>
          <Button variant="ghost" className="w-full text-muted-foreground">
            <X />
            Close
          </Button>
        </SheetClose>
      </SheetFooter>

      <AlertDialog open={restore !== null} onOpenChange={(open) => !open && !busy && setRestore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore this backup?</AlertDialogTitle>
            <AlertDialogDescription>
              Backup from {restore?.exported}. This will <strong>replace all</strong> your current entries, events,
              tasks, to-dos and assets. Download a backup first if you might need them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={confirmRestore} disabled={busy}>
              {busy && <Spinner />}
              Replace my data
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={importRows !== null} onOpenChange={(open) => !open && !busy && setImportRows(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import {importRows?.length} assets?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>Merge</strong> updates assets with the same name and adds new ones. <strong>Replace</strong>{" "}
              removes all current assets first. The auto-synced cash balance is always kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <Button variant="outline" onClick={() => runImport("replace")} disabled={busy}>
              Replace all
            </Button>
            <Button onClick={() => runImport("merge")} disabled={busy}>
              {busy && <Spinner />}
              Merge
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear backup history?</AlertDialogTitle>
            <AlertDialogDescription>This only clears the log, not your backups or data.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmClear(false);
                void actions.clearBackupHistory();
              }}
            >
              Clear
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-0.5">
        <h3 className="text-[10px] font-bold tracking-[0.1em] text-faint uppercase">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function ThemeRow() {
  const { preference, setPreference, dark } = useAppTheme();
  const Icon = dark ? Moon : Sun;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/50 p-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-foreground">
        <Icon className="size-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-bold">Theme</span>
        <span className="block truncate text-[11px] text-muted-foreground">
          {preference === "system" ? "Matches your device" : `Always ${preference}`}
        </span>
      </span>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        spacing={0}
        value={preference}
        onValueChange={(value) => value && setPreference(value as ThemePreference)}
        aria-label="Theme"
      >
        {THEME_OPTIONS.map(({ value, label, icon: OptionIcon }) => (
          <ToggleGroupItem
            key={value}
            value={value}
            aria-label={label}
            title={label}
            className="px-2.5 data-[state=on]:bg-secondary data-[state=on]:text-primary"
          >
            <OptionIcon />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

function ActionRow({
  icon: Icon,
  tile,
  title,
  description,
  onClick,
  disabled,
}: {
  icon: LucideIcon;
  tile: string;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-muted/50 p-3 text-left transition-colors outline-none hover:border-primary/40 hover:bg-secondary/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
    >
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", tile)}>
        <Icon className="size-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-bold">{title}</span>
        <span className="block truncate text-[11px] text-muted-foreground">{description}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

function DropZone({
  icon: Icon,
  title,
  description,
  accept,
  onFile,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  accept: string;
  onFile: (file: File) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files[0];
          if (file) onFile(file);
        }}
        className={cn(
          "flex w-full flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-border bg-muted/40 px-4 py-4 text-center transition-colors outline-none hover:border-primary/50 hover:bg-secondary/40 focus-visible:ring-[3px] focus-visible:ring-ring/50",
          dragging && "border-primary bg-secondary/60",
        )}
      >
        <Icon className="size-6 text-primary" />
        <span className="mt-1 text-sm font-bold">{title}</span>
        <span className="text-[11px] text-muted-foreground">{description}</span>
      </button>
      <input
        ref={input}
        type="file"
        accept={accept}
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onFile(file);
        }}
      />
    </>
  );
}
