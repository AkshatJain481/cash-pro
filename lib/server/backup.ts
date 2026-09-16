import "server-only";

import { assetKey } from "@/lib/cash-pro/assets";
import type { RestoreData } from "@/lib/cash-pro/backup";
import { prisma } from "@/lib/prisma";

import { dayToDb, timeToDb } from "./mappers";
import { BACKUP_LOG_LIMIT } from "./snapshot";

/** Replaces all of a user's data with a restored backup, atomically. */
export async function replaceUserData(userId: string, data: RestoreData) {
  const owned = { where: { userId } };

  await prisma.$transaction([
    prisma.moneyEntry.deleteMany(owned),
    prisma.event.deleteMany(owned),
    prisma.task.deleteMany(owned),
    prisma.todo.deleteMany(owned),
    prisma.asset.deleteMany(owned),
    prisma.moneyEntry.createMany({
      data: data.money.map((m) => ({
        userId,
        date: dayToDb(m.date),
        type: m.type,
        category: m.category,
        amount: m.amount,
        mode: m.mode,
        narration: m.narration,
        createdAt: new Date(m.createdAt),
      })),
    }),
    prisma.event.createMany({
      data: data.events.map((e) => ({
        userId,
        title: e.title,
        date: dayToDb(e.date),
        time: timeToDb(e.time),
        notes: e.notes,
        alerted: e.alerted,
        createdAt: new Date(e.createdAt),
      })),
    }),
    prisma.task.createMany({
      data: data.tasks.map((t) => ({
        userId,
        title: t.title,
        dueDate: t.dueDate ? dayToDb(t.dueDate) : null,
        priority: t.priority,
        status: t.status,
        assignee: t.assignee,
        notes: t.notes,
        remarks: t.remarks,
        alerted: t.alerted,
        createdAt: new Date(t.createdAt),
      })),
    }),
    prisma.todo.createMany({
      data: data.todos.map((t) => ({
        userId,
        title: t.title,
        status: t.status,
        priority: t.priority,
        remarks: t.remarks,
        createdAt: new Date(t.createdAt),
      })),
    }),
    prisma.asset.createMany({
      data: data.assets.map((a) => ({
        userId,
        name: a.name,
        nameKey: assetKey(a.name),
        category: a.category,
        value: a.value,
        notes: a.notes,
        createdAt: new Date(a.createdAt),
      })),
    }),
    prisma.backupLog.create({ data: { userId, method: "♻️ Restored from file" } }),
  ]);
  await trimBackupLog(userId);
}

/** Keeps only the most recent backup log entries. */
export async function trimBackupLog(userId: string) {
  const stale = await prisma.backupLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    skip: BACKUP_LOG_LIMIT,
    select: { id: true },
  });
  if (stale.length) {
    await prisma.backupLog.deleteMany({ where: { userId, id: { in: stale.map((row) => row.id) } } });
  }
}
