import "server-only";

import type { Snapshot } from "@/lib/cash-pro/types";
import { prisma } from "@/lib/prisma";

import {
  toAsset,
  toBackupLogEntry,
  toCalendarEvent,
  toMoneyEntry,
  toTask,
  toTodo,
} from "./mappers";

export const BACKUP_LOG_LIMIT = 30;

const insertionOrder = [{ createdAt: "asc" as const }, { id: "asc" as const }];

/** Everything the app renders for one user, in insertion order. */
export async function getSnapshot(userId: string): Promise<Snapshot> {
  const [money, events, tasks, todos, assets, backupLog, user] = await Promise.all([
    prisma.moneyEntry.findMany({ where: { userId }, orderBy: insertionOrder }),
    prisma.event.findMany({ where: { userId }, orderBy: insertionOrder }),
    prisma.task.findMany({ where: { userId }, orderBy: insertionOrder }),
    prisma.todo.findMany({ where: { userId }, orderBy: insertionOrder }),
    prisma.asset.findMany({ where: { userId }, orderBy: insertionOrder }),
    prisma.backupLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: BACKUP_LOG_LIMIT,
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { lastBackupAt: true } }),
  ]);

  return {
    money: money.map(toMoneyEntry),
    events: events.map(toCalendarEvent),
    tasks: tasks.map(toTask),
    todos: todos.map(toTodo),
    assets: assets.map(toAsset),
    backupLog: backupLog.map(toBackupLogEntry),
    lastBackupAt: user?.lastBackupAt?.toISOString() ?? null,
  };
}
