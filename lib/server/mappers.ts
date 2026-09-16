import "server-only";

import type {
  Asset as AssetRow,
  BackupLog as BackupLogRow,
  Event as EventRow,
  MoneyEntry as MoneyEntryRow,
  Task as TaskRow,
  Todo as TodoRow,
} from "@/generated/prisma/client";
import type { Asset, BackupLogEntry, CalendarEvent, MoneyEntry, Task, Todo } from "@/lib/cash-pro/types";

// DATE columns map to midnight UTC and TIME columns to 1970-01-01 UTC, so the
// conversions below never depend on the server's time zone.
export const dayToDb = (day: string) => new Date(`${day}T00:00:00.000Z`);
const dayFromDb = (date: Date) => date.toISOString().slice(0, 10);
export const timeToDb = (time: string) => new Date(`1970-01-01T${time}:00.000Z`);
const timeFromDb = (date: Date) => date.toISOString().slice(11, 16);

export const toMoneyEntry = (row: MoneyEntryRow): MoneyEntry => ({
  id: row.id,
  date: dayFromDb(row.date),
  type: row.type,
  category: row.category,
  amount: row.amount.toNumber(),
  mode: row.mode,
  narration: row.narration,
  createdAt: row.createdAt.toISOString(),
});

export const toCalendarEvent = (row: EventRow): CalendarEvent => ({
  id: row.id,
  title: row.title,
  date: dayFromDb(row.date),
  time: timeFromDb(row.time),
  notes: row.notes,
  alerted: row.alerted,
  createdAt: row.createdAt.toISOString(),
});

export const toTask = (row: TaskRow): Task => ({
  id: row.id,
  title: row.title,
  dueDate: row.dueDate ? dayFromDb(row.dueDate) : null,
  priority: row.priority,
  status: row.status,
  assignee: row.assignee,
  notes: row.notes,
  remarks: row.remarks,
  alerted: row.alerted,
  createdAt: row.createdAt.toISOString(),
});

export const toTodo = (row: TodoRow): Todo => ({
  id: row.id,
  title: row.title,
  status: row.status,
  priority: row.priority,
  remarks: row.remarks,
  createdAt: row.createdAt.toISOString(),
});

export const toAsset = (row: AssetRow): Asset => ({
  id: row.id,
  name: row.name,
  category: row.category,
  value: row.value.toNumber(),
  notes: row.notes,
  createdAt: row.createdAt.toISOString(),
});

export const toBackupLogEntry = (row: BackupLogRow): BackupLogEntry => ({
  id: row.id,
  method: row.method,
  createdAt: row.createdAt.toISOString(),
});
