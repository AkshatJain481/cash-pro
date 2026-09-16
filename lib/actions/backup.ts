"use server";

import { normalizeBackup } from "@/lib/cash-pro/backup";
import type { ActionResult, BackupLogEntry, Snapshot } from "@/lib/cash-pro/types";
import { backupMethodSchema } from "@/lib/cash-pro/validation";
import { prisma } from "@/lib/prisma";
import { ActionError, runAction, runAuthed } from "@/lib/server/action";
import { replaceUserData, trimBackupLog } from "@/lib/server/backup";
import { toBackupLogEntry } from "@/lib/server/mappers";
import { getSnapshot } from "@/lib/server/snapshot";

/** The latest data for the signed-in user (used to resync other devices). */
export async function fetchSnapshot(): Promise<ActionResult<Snapshot>> {
  return runAuthed((userId) => getSnapshot(userId));
}

/** Records a backup/export in the history and updates "last backup". */
export async function logBackup(
  method: string,
): Promise<ActionResult<{ entry: BackupLogEntry; lastBackupAt: string }>> {
  return runAction(backupMethodSchema, method, async (description, userId) => {
    const now = new Date();
    const [row] = await prisma.$transaction([
      prisma.backupLog.create({ data: { userId, method: description, createdAt: now } }),
      prisma.user.update({ where: { id: userId }, data: { lastBackupAt: now } }),
    ]);
    await trimBackupLog(userId);
    return { entry: toBackupLogEntry(row), lastBackupAt: now.toISOString() };
  });
}

export async function clearBackupLog(): Promise<ActionResult<null>> {
  return runAuthed(async (userId) => {
    await prisma.backupLog.deleteMany({ where: { userId } });
    return null;
  });
}

/** Replaces all data with the contents of a Cash Pro JSON backup. */
export async function restoreBackup(
  backup: unknown,
): Promise<ActionResult<{ snapshot: Snapshot; skipped: number }>> {
  return runAuthed(async (userId) => {
    const result = normalizeBackup(backup);
    if (!result.ok) throw new ActionError("INVALID", result.error);

    await replaceUserData(userId, result.data);
    return { snapshot: await getSnapshot(userId), skipped: result.data.skipped };
  });
}
