import { z } from "zod";

import {
  ASSET_CATEGORIES,
  ENTRY_TYPES,
  LIMITS,
  MAX_AMOUNT,
  PAYMENT_MODES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TODO_PRIORITIES,
  TODO_STATUSES,
} from "./constants";
import { roundMoney } from "./format";

// Input schemas for server actions. The client generates row ids (UUIDs) so
// the UI can update optimistically; ownership comes from the session.

export const idSchema = z.uuid();

const day = z.iso.date();
const optionalText = (max: number) => z.string().trim().max(max);
const requiredText = (max: number, message: string) => z.string().trim().min(1, message).max(max);

const amount = z
  .number()
  .min(0.01, "Amount must be at least ₹0.01")
  .max(MAX_AMOUNT, "Amount is too large")
  .transform(roundMoney);

const assetValue = z.number().min(0, "Value can't be negative").max(MAX_AMOUNT, "Value is too large").transform(roundMoney);

export const moneyEntrySchema = z.object({
  id: idSchema,
  date: day,
  type: z.enum(ENTRY_TYPES),
  category: requiredText(LIMITS.category, "Enter a category"),
  amount,
  mode: z.enum(PAYMENT_MODES),
  narration: optionalText(LIMITS.narration),
});

export const eventSchema = z.object({
  id: idSchema,
  title: requiredText(LIMITS.eventTitle, "Enter a title"),
  date: day,
  time: z.iso.time({ precision: -1 }),
  notes: optionalText(LIMITS.eventNotes),
});

export const taskSchema = z.object({
  id: idSchema,
  title: requiredText(LIMITS.taskTitle, "Enter a task title"),
  dueDate: day.nullable(),
  priority: z.enum(TASK_PRIORITIES),
  status: z.enum(TASK_STATUSES),
  assignee: optionalText(LIMITS.assignee),
  notes: optionalText(LIMITS.taskNotes),
  remarks: optionalText(LIMITS.remarks),
});

export const taskStatusSchema = z.object({ id: idSchema, status: z.enum(TASK_STATUSES) });

export const todoSchema = z.object({
  id: idSchema,
  title: requiredText(LIMITS.todoTitle, "Enter a to-do title"),
  status: z.enum(TODO_STATUSES),
  priority: z.enum(TODO_PRIORITIES),
  remarks: optionalText(LIMITS.remarks),
});

export const todoStatusSchema = z.object({ id: idSchema, status: z.enum(TODO_STATUSES) });

const assetFields = {
  name: requiredText(LIMITS.assetName, "Enter a name"),
  category: z.enum(ASSET_CATEGORIES),
  value: assetValue,
  notes: optionalText(LIMITS.assetNotes),
};

export const assetSchema = z.object({ id: idSchema, ...assetFields });

export const assetValuesSchema = z.array(z.object({ id: idSchema, value: assetValue })).max(5000);

export const importAssetsSchema = z.object({
  mode: z.enum(["merge", "replace"]),
  assets: z.array(z.object(assetFields)).min(1).max(5000),
});

export const backupMethodSchema = z.string().trim().min(1).max(LIMITS.backupMethod);

export type MoneyEntryInput = z.input<typeof moneyEntrySchema>;
export type EventInput = z.input<typeof eventSchema>;
export type TaskInput = z.input<typeof taskSchema>;
export type TodoInput = z.input<typeof todoSchema>;
export type AssetInput = z.input<typeof assetSchema>;
export type ImportAssetsInput = z.input<typeof importAssetsSchema>;
