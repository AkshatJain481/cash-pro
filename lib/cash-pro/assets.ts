import { getLiquidity, isLiability } from "./constants";
import { roundMoney } from "./format";
import type { Asset, MoneyEntry } from "./types";

export const CASH_ASSET_ID = "cash-balance";

/** Assets are unique per user by trimmed, case-insensitive name. */
export const assetKey = (name: string) => name.trim().toLowerCase();

/** Cash-mode receipts minus cash-mode payments. */
export function computeCashBalance(money: MoneyEntry[]): number {
  let balance = 0;
  for (const entry of money) {
    if (entry.mode !== "CASH") continue;
    balance += entry.type === "INCOME" ? entry.amount : -entry.amount;
  }
  return roundMoney(balance);
}

const CASH_ASSET_NAME = "Cash Balance";
const CASH_ASSET_NOTES = "Auto-synced from money entries";

/** Stored assets plus the auto-synced "Cash Balance" (never below zero). */
export function withCashAsset(assets: Asset[], money: MoneyEntry[]): Asset[] {
  const cash: Asset = {
    id: CASH_ASSET_ID,
    name: CASH_ASSET_NAME,
    category: "CASH",
    value: Math.max(0, computeCashBalance(money)),
    notes: CASH_ASSET_NOTES,
    createdAt: "",
    autoLinked: true,
  };
  return [cash, ...assets];
}

/** Whether a spreadsheet row is the exported auto-synced cash balance. */
export const isAutoCashRow = (name: string, notes: string) =>
  name === CASH_ASSET_NAME && notes === CASH_ASSET_NOTES;

export type LiquidityTier = {
  items: Asset[];
  total: number;
  /** Share of total assets, e.g. `"42.5"`. */
  percent: string;
};

export type AssetSummary = {
  assets: Asset[];
  liabilities: Asset[];
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  high: LiquidityTier;
  medium: LiquidityTier;
  low: LiquidityTier;
};

const sumValues = (items: Asset[]) => items.reduce((total, asset) => total + asset.value, 0);

export function summarizeAssets(all: Asset[]): AssetSummary {
  const assets: Asset[] = [];
  const liabilities: Asset[] = [];
  const tiers: Record<"high" | "medium" | "low", Asset[]> = { high: [], medium: [], low: [] };

  for (const asset of all) {
    const liquidity = getLiquidity(asset.category);
    if (liquidity === "liability") {
      liabilities.push(asset);
    } else {
      assets.push(asset);
      tiers[liquidity].push(asset);
    }
  }

  const totalAssets = sumValues(assets);
  const totalLiabilities = sumValues(liabilities);
  const tier = (items: Asset[]): LiquidityTier => {
    const total = sumValues(items);
    return { items, total, percent: ((total / (totalAssets || 1)) * 100).toFixed(1) };
  };

  return {
    assets,
    liabilities,
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    high: tier(tiers.high),
    medium: tier(tiers.medium),
    low: tier(tiers.low),
  };
}

export { isLiability };
