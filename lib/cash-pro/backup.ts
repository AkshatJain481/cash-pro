import { z } from "zod";

import { assetKey, isAutoCashRow, summarizeAssets } from "./assets";
import {
  ASSET_CATEGORY_LABEL,
  ENTRY_TYPE_LABEL,
  getLiquidity,
  isLiability,
  LIMITS,
  LIQUIDITY_LABEL,
  MAX_AMOUNT,
  PAYMENT_MODE_LABEL,
  PRIORITY_LABEL,
  STATUS_LABEL,
  type AssetCategory,
  type TaskPriority,
  type TodoPriority,
  type TodoStatus,
} from "./constants";
import { roundMoney } from "./format";
import type { Asset, CalendarEvent, MoneyEntry, Snapshot, Task, Todo } from "./types";

// Backups use the original Cash Pro JSON format, so files move freely between
// the old single-file app and this one.

export const BACKUP_APP = "CashPro";

const LEGACY_TASK_PRIORITY: Record<TaskPriority, string> = {
  CRITICAL: "🔴 Critical",
  HIGH: "🟠 High",
  MEDIUM: "🟡 Medium",
  LOW: "🟢 Low",
};

const LEGACY_CASH_ASSET_ID = 9000000001;

// ─── Export ─────────────────────────────────────────────────────────────────

export function buildBackupPayload(
  data: Pick<Snapshot, "money" | "events" | "tasks" | "todos">,
  assets: Asset[],
) {
  // The original app used millisecond timestamps as numeric ids.
  const usedIds = new Set<number>();
  const legacyId = (iso: string) => {
    let id = Date.parse(iso) || Date.now();
    while (usedIds.has(id)) id += 1;
    usedIds.add(id);
    return id;
  };

  const backup = {
    money: data.money.map((m) => ({
      id: legacyId(m.createdAt),
      date: m.date,
      type: ENTRY_TYPE_LABEL[m.type],
      category: m.category,
      amount: m.amount,
      mode: PAYMENT_MODE_LABEL[m.mode],
      narration: m.narration,
      ts: m.createdAt,
    })),
    events: data.events.map((e) => ({
      id: legacyId(e.createdAt),
      title: e.title,
      date: e.date,
      time: e.time,
      notes: e.notes,
      _alerted: e.alerted || undefined,
    })),
    tasks: data.tasks.map((t) => ({
      id: legacyId(t.createdAt),
      title: t.title,
      date: t.dueDate ?? "",
      priority: LEGACY_TASK_PRIORITY[t.priority],
      status: STATUS_LABEL[t.status],
      assignee: t.assignee,
      notes: t.notes,
      remarks: t.remarks,
      created: t.createdAt,
      _alerted: t.alerted || undefined,
    })),
    todos: data.todos.map((t) => ({
      id: legacyId(t.createdAt),
      title: t.title,
      status: STATUS_LABEL[t.status],
      priority: PRIORITY_LABEL[t.priority],
      remarks: t.remarks,
      created: t.createdAt,
    })),
    assets: assets.map((a) =>
      a.autoLinked
        ? {
            id: LEGACY_CASH_ASSET_ID,
            name: a.name,
            category: ASSET_CATEGORY_LABEL[a.category],
            value: a.value,
            notes: a.notes,
            _autoLinked: true,
            updated: new Date().toISOString(),
          }
        : {
            id: legacyId(a.createdAt),
            name: a.name,
            category: ASSET_CATEGORY_LABEL[a.category],
            value: a.value,
            notes: a.notes,
            updated: a.createdAt,
          },
    ),
  };

  return {
    app: BACKUP_APP,
    version: "2.0",
    exported: new Date().toISOString(),
    data: backup,
    summary: {
      moneyEntries: backup.money.length,
      events: backup.events.length,
      tasks: backup.tasks.length,
      todos: backup.todos.length,
      assets: backup.assets.length,
    },
  };
}

export type BackupPayload = ReturnType<typeof buildBackupPayload>;

const BOM = "﻿"; // lets Excel read ₹ and non-Latin text correctly
const quote = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

/** Receipts & payments ledger, oldest first. */
export function buildMoneyCsv(money: MoneyEntry[]): string {
  const lines = ["Date,Type,Category,Amount,Mode,Narration"];
  for (const m of [...money].sort((a, b) => a.date.localeCompare(b.date))) {
    lines.push(
      [m.date, ENTRY_TYPE_LABEL[m.type], quote(m.category), m.amount, PAYMENT_MODE_LABEL[m.mode], quote(m.narration)].join(","),
    );
  }
  return BOM + lines.join("\n");
}

/** Assets & liabilities statement with liquidity classification. */
export function buildAssetsCsv(assets: Asset[]): string {
  const summary = summarizeAssets(assets);
  const rows: unknown[][] = [
    ["CASH PRO — ASSETS & LIABILITIES STATEMENT"],
    [`Generated: ${new Date().toLocaleString("en-IN")}`],
    [],
    ["SUMMARY"],
    ["Total Assets", "", summary.totalAssets.toFixed(2)],
    ["Total Liabilities", "", summary.totalLiabilities.toFixed(2)],
    ["NET WORTH", "", summary.netWorth.toFixed(2)],
    [],
    ["DETAIL"],
    ["Asset Name", "Category", "Liquidity", "Value (₹)", "Notes", "Type"],
    ...assets.map((a) => [
      a.name,
      ASSET_CATEGORY_LABEL[a.category],
      LIQUIDITY_LABEL[getLiquidity(a.category)],
      a.value.toFixed(2),
      a.notes,
      isLiability(a.category) ? "Liability" : "Asset",
    ]),
    [],
    ["LIQUIDITY BREAKDOWN"],
    ["Tier", "Description", "Total (₹)"],
    ["High Liquidity", "Cash, Bank — instant access", summary.high.total.toFixed(2)],
    ["Medium Liquidity", "FD, MF, Stocks — days/weeks", summary.medium.total.toFixed(2)],
    ["Low / Illiquid", "Real Estate, Gold — months", summary.low.total.toFixed(2)],
    ["Liabilities", "Loans, Credit Cards", summary.totalLiabilities.toFixed(2)],
  ];
  return BOM + rows.map((row) => row.map(quote).join(",")).join("\n");
}

// ─── Parsing helpers ────────────────────────────────────────────────────────

type Row = Record<string, unknown>;

const isRow = (value: unknown): value is Row =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const rowsOf = (value: unknown): Row[] => (Array.isArray(value) ? value.filter(isRow) : []);

const textOf = (value: unknown, max: number) =>
  (typeof value === "string" ? value : typeof value === "number" ? String(value) : "").trim().slice(0, max);

const isDay = (value: unknown): value is string => z.iso.date().safeParse(value).success;

function timeOf(value: unknown): string | null {
  const time = typeof value === "string" ? value.trim().slice(0, 5) : "";
  return z.iso.time({ precision: -1 }).safeParse(time).success ? time : null;
}

function amountOf(value: unknown, min: number): number | null {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseFloat(value.replace(/[₹,\s]/g, ""))
        : Number.NaN;
  if (!Number.isFinite(parsed)) return null;
  const amount = roundMoney(parsed);
  return amount >= min && amount <= MAX_AMOUNT ? amount : null;
}

/** Matches an enum key or its display label, case-insensitively. */
export function fromLabel<T extends string>(labels: Record<T, string>, value: unknown): T | undefined {
  if (typeof value !== "string") return undefined;
  const needle = value.trim().toLowerCase();
  return (Object.keys(labels) as T[]).find(
    (key) => key.toLowerCase() === needle || labels[key].toLowerCase() === needle,
  );
}

/** Legacy priorities look like "🔴 Critical"; enum keys work too. */
function priorityOf(value: unknown): TaskPriority {
  const text = typeof value === "string" ? value.toLowerCase() : "";
  if (text.includes("critical")) return "CRITICAL";
  if (text.includes("high")) return "HIGH";
  if (text.includes("low")) return "LOW";
  return "MEDIUM";
}

/**
 * Creation timestamps for restored rows: taken from the first usable field,
 * nudged to be strictly increasing so the backup's order is preserved.
 */
function timestampsOf(items: Row[], ...fields: string[]): string[] {
  let previous = 0;
  const fallback = Date.now() - items.length;
  return items.map((item, index) => {
    const candidate = fields
      .map((field) => item[field])
      .map((value) => (typeof value === "string" || typeof value === "number" ? new Date(value).getTime() : Number.NaN))
      .find(Number.isFinite);
    const time = Math.max(candidate ?? fallback + index, previous + 1);
    previous = time;
    return new Date(time).toISOString();
  });
}

// ─── Restore ────────────────────────────────────────────────────────────────

export type RestoreData = {
  money: Omit<MoneyEntry, "id">[];
  events: Omit<CalendarEvent, "id">[];
  tasks: Omit<Task, "id">[];
  todos: Omit<Todo, "id">[];
  assets: Omit<Asset, "id" | "autoLinked">[];
  /** Rows dropped because required fields were missing or invalid. */
  skipped: number;
};

export type NormalizeResult = { ok: true; data: RestoreData } | { ok: false; error: string };

/** Quick check of a parsed file before asking the user to confirm a restore. */
export function readBackupHeader(raw: unknown): { exported: string | null } | null {
  if (!isRow(raw) || raw.app !== BACKUP_APP || !isRow(raw.data)) return null;
  return { exported: typeof raw.exported === "string" ? raw.exported : null };
}

/** Validates a parsed backup file and converts it to rows ready for the database. */
export function normalizeBackup(raw: unknown): NormalizeResult {
  if (!isRow(raw) || raw.app !== BACKUP_APP || !isRow(raw.data)) {
    return { ok: false, error: "Not a valid CashPro backup file" };
  }
  const source = raw.data;
  let skipped = 0;

  const moneyRows = rowsOf(source.money);
  const moneyTimes = timestampsOf(moneyRows, "ts", "id");
  const money: RestoreData["money"] = [];
  moneyRows.forEach((row, i) => {
    const type = fromLabel(ENTRY_TYPE_LABEL, row.type);
    const amount = amountOf(row.amount, 0.01);
    if (!isDay(row.date) || !type || amount === null) return void skipped++;
    money.push({
      date: row.date,
      type,
      category: textOf(row.category, LIMITS.category) || "Uncategorized",
      amount,
      mode: fromLabel(PAYMENT_MODE_LABEL, row.mode) ?? "CASH",
      narration: textOf(row.narration, LIMITS.narration),
      createdAt: moneyTimes[i],
    });
  });

  const eventRows = rowsOf(source.events);
  const eventTimes = timestampsOf(eventRows, "created", "id");
  const events: RestoreData["events"] = [];
  eventRows.forEach((row, i) => {
    const title = textOf(row.title, LIMITS.eventTitle);
    const time = timeOf(row.time);
    if (!title || !isDay(row.date) || !time) return void skipped++;
    events.push({
      title,
      date: row.date,
      time,
      notes: textOf(row.notes, LIMITS.eventNotes),
      alerted: row._alerted === true,
      createdAt: eventTimes[i],
    });
  });

  const taskRows = rowsOf(source.tasks);
  const taskTimes = timestampsOf(taskRows, "created", "id");
  const tasks: RestoreData["tasks"] = [];
  taskRows.forEach((row, i) => {
    const title = textOf(row.title, LIMITS.taskTitle);
    if (!title) return void skipped++;
    tasks.push({
      title,
      dueDate: isDay(row.date) ? row.date : null,
      priority: priorityOf(row.priority),
      status: fromLabel(STATUS_LABEL, row.status) ?? "PENDING",
      assignee: textOf(row.assignee, LIMITS.assignee),
      notes: textOf(row.notes, LIMITS.taskNotes),
      remarks: textOf(row.remarks, LIMITS.remarks),
      alerted: row._alerted === true,
      createdAt: taskTimes[i],
    });
  });

  const todoRows = rowsOf(source.todos);
  const todoTimes = timestampsOf(todoRows, "created", "id");
  const todos: RestoreData["todos"] = [];
  todoRows.forEach((row, i) => {
    const title = textOf(row.title, LIMITS.todoTitle);
    if (!title) return void skipped++;
    const status = fromLabel(STATUS_LABEL, row.status);
    const priority = priorityOf(row.priority);
    todos.push({
      title,
      status: (status === "IN_PROGRESS" || status === "DONE" ? status : "PENDING") satisfies TodoStatus,
      priority: (priority === "CRITICAL" ? "HIGH" : priority) satisfies TodoPriority,
      remarks: textOf(row.remarks, LIMITS.remarks),
      createdAt: todoTimes[i],
    });
  });

  // The auto-synced cash balance is derived, so it is not restored.
  const assetRows = rowsOf(source.assets).filter((row) => row._autoLinked !== true);
  const assetTimes = timestampsOf(assetRows, "updated", "id");
  const assetsByKey = new Map<string, RestoreData["assets"][number]>();
  assetRows.forEach((row, i) => {
    const name = textOf(row.name, LIMITS.assetName);
    const value = amountOf(row.value, 0);
    if (!name || value === null) return void skipped++;
    const previous = assetsByKey.get(assetKey(name));
    assetsByKey.set(assetKey(name), {
      name,
      category: fromLabel(ASSET_CATEGORY_LABEL, row.category) ?? "OTHER_ASSET",
      value,
      notes: textOf(row.notes, LIMITS.assetNotes),
      createdAt: previous?.createdAt ?? assetTimes[i],
    });
  });

  return {
    ok: true,
    data: { money, events, tasks, todos, assets: [...assetsByKey.values()], skipped },
  };
}

// ─── Asset import (CSV) ─────────────────────────────────────────────────────

export type ImportedAsset = { name: string; category: AssetCategory; value: number; notes: string };

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += char;
    }
  }
  cells.push(cell.trim());
  return cells;
}

/** Header, summary and breakdown rows (e.g. from this app's own export). */
const NON_ASSET_PREFIXES = ["asset name", "name", "summary", "detail", "tier", "generated", "cash pro", "total", "net worth"];

/**
 * Reads `Name, Category, Value, Notes` rows. A header row with "Value" and
 * "Notes" columns is honoured, so the app's own assets export imports back.
 */
export function parseAssetsCsv(text: string): ImportedAsset[] {
  let columns: { value: number; notes: number } | null = null;
  const assets: ImportedAsset[] = [];

  for (const line of text.replace(/^﻿/, "").split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cells = parseCsvLine(line);
    const lower = cells.map((cell) => cell.toLowerCase());

    const valueColumn = lower.findIndex((cell) => cell.startsWith("value"));
    if (valueColumn > 0 && lower.some((cell) => cell.includes("name"))) {
      columns = { value: valueColumn, notes: lower.indexOf("notes") };
      continue;
    }

    const name = cells[0] ?? "";
    if (!name || NON_ASSET_PREFIXES.some((prefix) => name.toLowerCase().startsWith(prefix))) continue;

    // Without a header: Value is column 3 (or 4 when column 3 is empty).
    const [rawValue, rawNotes] = columns
      ? [cells[columns.value], columns.notes >= 0 ? cells[columns.notes] : ""]
      : cells[2]
        ? [cells[2], cells[3]]
        : [cells[3], cells[4]];
    const value = amountOf(rawValue ?? "", 0);
    // The auto-synced cash balance is derived from entries, so it isn't imported.
    if (value === null || isAutoCashRow(name, rawNotes ?? "")) continue;

    assets.push({
      name: name.slice(0, LIMITS.assetName),
      category: fromLabel(ASSET_CATEGORY_LABEL, cells[1]) ?? "OTHER_ASSET",
      value,
      notes: (rawNotes ?? "").slice(0, LIMITS.assetNotes),
    });
  }
  return assets;
}
