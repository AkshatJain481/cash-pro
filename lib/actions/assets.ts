"use server";

import { assetKey } from "@/lib/cash-pro/assets";
import type { ActionResult, Asset } from "@/lib/cash-pro/types";
import {
  assetSchema,
  assetValuesSchema,
  idSchema,
  importAssetsSchema,
  type AssetInput,
  type ImportAssetsInput,
} from "@/lib/cash-pro/validation";
import { prisma } from "@/lib/prisma";
import { runAction } from "@/lib/server/action";
import { toAsset } from "@/lib/server/mappers";

/** Creates an asset, or updates the existing one with the same name. */
export async function saveAsset(input: AssetInput): Promise<ActionResult<Asset>> {
  return runAction(assetSchema, input, async ({ id, name, category, value, notes }, userId) => {
    const nameKey = assetKey(name);
    const row = await prisma.asset.upsert({
      where: { userId_nameKey: { userId, nameKey } },
      create: { id, userId, name, nameKey, category, value, notes },
      update: { category, value, notes },
    });
    return toAsset(row);
  });
}

export async function deleteAsset(id: string): Promise<ActionResult<null>> {
  return runAction(idSchema, id, async (assetId, userId) => {
    await prisma.asset.deleteMany({ where: { userId, id: assetId } });
    return null;
  });
}

/** Quick edit: updates many asset values at once. */
export async function updateAssetValues(
  values: { id: string; value: number }[],
): Promise<ActionResult<null>> {
  return runAction(assetValuesSchema, values, async (updates, userId) => {
    await prisma.$transaction(
      updates.map(({ id, value }) =>
        prisma.asset.updateMany({ where: { userId, id }, data: { value } }),
      ),
    );
    return null;
  });
}

/** Imports assets from a spreadsheet, merging by name or replacing everything. */
export async function importAssets(input: ImportAssetsInput): Promise<ActionResult<Asset[]>> {
  return runAction(importAssetsSchema, input, async ({ mode, assets }, userId) => {
    // Duplicate names: the last row wins, at the position of the first.
    const byKey = new Map(assets.map((asset) => [assetKey(asset.name), asset]));
    const start = Date.now();
    const rows = [...byKey].map(([nameKey, asset], index) => ({
      ...asset,
      nameKey,
      userId,
      createdAt: new Date(start + index),
    }));

    if (mode === "replace") {
      await prisma.$transaction([
        prisma.asset.deleteMany({ where: { userId } }),
        prisma.asset.createMany({ data: rows }),
      ]);
    } else {
      await prisma.$transaction(
        rows.map((row) =>
          prisma.asset.upsert({
            where: { userId_nameKey: { userId, nameKey: row.nameKey } },
            create: row,
            update: { category: row.category, value: row.value, notes: row.notes },
          }),
        ),
      );
    }

    const all = await prisma.asset.findMany({
      where: { userId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    return all.map(toAsset);
  });
}
