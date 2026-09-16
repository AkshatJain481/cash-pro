// Domain constants shared by the client and the server.
// Enum values mirror the enums in prisma/schema.prisma.

export const ENTRY_TYPES = ["EXPENSE", "INCOME"] as const;
export type EntryType = (typeof ENTRY_TYPES)[number];

export const PAYMENT_MODES = ["CASH", "UPI", "BANK_TRANSFER", "CARD", "CHEQUE"] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];

export const TASK_STATUSES = ["PENDING", "IN_PROGRESS", "DONE", "BLOCKED"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TODO_STATUSES = ["PENDING", "IN_PROGRESS", "DONE"] as const;
export type TodoStatus = (typeof TODO_STATUSES)[number];

export const TASK_PRIORITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TODO_PRIORITIES = ["HIGH", "MEDIUM", "LOW"] as const;
export type TodoPriority = (typeof TODO_PRIORITIES)[number];

export const ASSET_CATEGORIES = [
  "BANK_ACCOUNT",
  "FIXED_DEPOSIT",
  "MUTUAL_FUND",
  "STOCKS",
  "PPF_EPF",
  "REAL_ESTATE",
  "GOLD_JEWELLERY",
  "VEHICLES",
  "CASH",
  "LOAN_GIVEN",
  "OTHER_ASSET",
  "CREDIT_CARD_DUE",
  "LOAN_TAKEN",
  "OTHER_LIABILITY",
] as const;
export type AssetCategory = (typeof ASSET_CATEGORIES)[number];

export const ENTRY_TYPE_LABEL: Record<EntryType, string> = {
  EXPENSE: "Expense",
  INCOME: "Income",
};

export const PAYMENT_MODE_LABEL: Record<PaymentMode, string> = {
  CASH: "Cash",
  UPI: "UPI",
  BANK_TRANSFER: "Bank Transfer",
  CARD: "Card",
  CHEQUE: "Cheque",
};

export const STATUS_LABEL: Record<TaskStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
  BLOCKED: "Blocked",
};

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  CRITICAL: "Critical",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

export const ASSET_CATEGORY_LABEL: Record<AssetCategory, string> = {
  BANK_ACCOUNT: "Bank Account",
  FIXED_DEPOSIT: "Fixed Deposit",
  MUTUAL_FUND: "Mutual Fund",
  STOCKS: "Stocks",
  PPF_EPF: "PPF/EPF",
  REAL_ESTATE: "Real Estate",
  GOLD_JEWELLERY: "Gold/Jewellery",
  VEHICLES: "Vehicles",
  CASH: "Cash",
  LOAN_GIVEN: "Loan Given",
  OTHER_ASSET: "Other Asset",
  CREDIT_CARD_DUE: "Credit Card Due",
  LOAN_TAKEN: "Loan Taken",
  OTHER_LIABILITY: "Other Liability",
};

// ─── Liquidity ──────────────────────────────────────────────────────────────

const LIABILITY_CATEGORIES: ReadonlySet<AssetCategory> = new Set([
  "CREDIT_CARD_DUE",
  "LOAN_TAKEN",
  "OTHER_LIABILITY",
]);
/** Instantly accessible. */
const HIGH_LIQUIDITY: ReadonlySet<AssetCategory> = new Set(["CASH", "BANK_ACCOUNT"]);
/** Accessible in days or weeks. Everything else is low / illiquid. */
const MEDIUM_LIQUIDITY: ReadonlySet<AssetCategory> = new Set([
  "FIXED_DEPOSIT",
  "MUTUAL_FUND",
  "STOCKS",
  "PPF_EPF",
  "LOAN_GIVEN",
]);

export type Liquidity = "high" | "medium" | "low" | "liability";

export const LIQUIDITY_LABEL: Record<Liquidity, string> = {
  high: "High Liquidity",
  medium: "Medium Liquidity",
  low: "Low / Illiquid",
  liability: "Liability",
};

export const isLiability = (category: AssetCategory) => LIABILITY_CATEGORIES.has(category);

export function getLiquidity(category: AssetCategory): Liquidity {
  if (LIABILITY_CATEGORIES.has(category)) return "liability";
  if (HIGH_LIQUIDITY.has(category)) return "high";
  if (MEDIUM_LIQUIDITY.has(category)) return "medium";
  return "low";
}

// ─── Limits ─────────────────────────────────────────────────────────────────

/** Max string lengths, kept in sync with `@db.String(n)` in the Prisma schema. */
export const LIMITS = {
  category: 100,
  narration: 2000,
  eventTitle: 200,
  eventNotes: 2000,
  taskTitle: 200,
  assignee: 100,
  taskNotes: 5000,
  remarks: 2000,
  todoTitle: 200,
  assetName: 120,
  assetNotes: 500,
  backupMethod: 200,
} as const;

/** Largest value that fits DECIMAL(15, 2). */
export const MAX_AMOUNT = 9_999_999_999_999.99;
