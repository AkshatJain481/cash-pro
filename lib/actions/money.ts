"use server";

import type { ActionResult, MoneyEntry } from "@/lib/cash-pro/types";
import { idSchema, moneyEntrySchema, type MoneyEntryInput } from "@/lib/cash-pro/validation";
import { prisma } from "@/lib/prisma";
import { runAction } from "@/lib/server/action";
import { dayToDb, toMoneyEntry } from "@/lib/server/mappers";

export async function createMoneyEntry(input: MoneyEntryInput): Promise<ActionResult<MoneyEntry>> {
  return runAction(moneyEntrySchema, input, async (entry, userId) => {
    const row = await prisma.moneyEntry.create({
      data: { ...entry, userId, date: dayToDb(entry.date) },
    });
    return toMoneyEntry(row);
  });
}

export async function deleteMoneyEntry(id: string): Promise<ActionResult<null>> {
  return runAction(idSchema, id, async (entryId, userId) => {
    await prisma.moneyEntry.deleteMany({ where: { userId, id: entryId } });
    return null;
  });
}
