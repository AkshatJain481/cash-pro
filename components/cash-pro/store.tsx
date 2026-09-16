"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useStore } from "zustand";
import { createStore, type StoreApi } from "zustand/vanilla";

import { deleteAsset, importAssets, saveAsset, updateAssetValues } from "@/lib/actions/assets";
import { clearBackupLog, fetchSnapshot, logBackup, restoreBackup } from "@/lib/actions/backup";
import { createEvent, deleteEvent, markEventAlerted } from "@/lib/actions/events";
import { createMoneyEntry, deleteMoneyEntry } from "@/lib/actions/money";
import { createTask, deleteTask, markTaskAlerted, updateTaskStatus } from "@/lib/actions/tasks";
import { createTodo, deleteTodo, updateTodoStatus } from "@/lib/actions/todos";
import { assetKey } from "@/lib/cash-pro/assets";
import type { TaskStatus, TodoStatus } from "@/lib/cash-pro/constants";
import { roundMoney } from "@/lib/cash-pro/format";
import { newId } from "@/lib/cash-pro/id";
import type {
  ActionResult,
  AppUser,
  Asset,
  CalendarEvent,
  MoneyEntry,
  Snapshot,
  Task,
  Todo,
} from "@/lib/cash-pro/types";
import type { ImportAssetsInput } from "@/lib/cash-pro/validation";

export type CashProState = Snapshot & {
  user: AppUser;
  /** Server actions currently in flight. */
  pending: number;
  /** When the data was last loaded from the server. */
  syncedAt: number;
};

export type MoneyDraft = Pick<MoneyEntry, "date" | "type" | "category" | "amount" | "mode" | "narration">;
export type EventDraft = Pick<CalendarEvent, "title" | "date" | "time" | "notes">;
export type TaskDraft = Pick<Task, "title" | "dueDate" | "priority" | "status" | "assignee" | "notes" | "remarks">;
export type TodoDraft = Pick<Todo, "title" | "status" | "priority" | "remarks">;
export type AssetDraft = Pick<Asset, "name" | "category" | "value" | "notes">;

type CashProStore = StoreApi<CashProState>;
export type CashProActions = ReturnType<typeof createActions>;

const CashProContext = createContext<{ store: CashProStore; actions: CashProActions } | null>(null);

export function CashProProvider({
  user,
  snapshot,
  children,
}: {
  user: AppUser;
  snapshot: Snapshot;
  children: ReactNode;
}) {
  const [value] = useState(() => {
    const store = createStore<CashProState>()(() => ({ ...snapshot, user, pending: 0, syncedAt: Date.now() }));
    return { store, actions: createActions(store) };
  });
  return <CashProContext.Provider value={value}>{children}</CashProContext.Provider>;
}

function useCashProContext() {
  const context = useContext(CashProContext);
  if (!context) throw new Error("Cash Pro hooks must be used inside <CashProProvider>");
  return context;
}

export const useCashProStore = () => useCashProContext().store;
export const useCashProActions = () => useCashProContext().actions;

/** Subscribes to a slice of the app state. */
export function useCashPro<T>(selector: (state: CashProState) => T): T {
  return useStore(useCashProContext().store, selector);
}

// ─── Actions ────────────────────────────────────────────────────────────────
// Every change is applied optimistically (ids are generated here), then saved
// with a server action. If saving fails, the data is reloaded from the server.

const timestamp = () => new Date().toISOString();

const replaceById = <T extends { id: string }>(items: T[], id: string, next: T) =>
  items.map((item) => (item.id === id ? next : item));

const removeById = <T extends { id: string }>(items: T[], id: string) =>
  items.filter((item) => item.id !== id);

type RunOptions = { silent?: boolean; resyncOnError?: boolean };

function createActions(store: CashProStore) {
  const { getState, setState } = store;
  let resyncWanted = false;

  async function run<T>(
    action: () => Promise<ActionResult<T>>,
    { silent = false, resyncOnError = true }: RunOptions = {},
  ): Promise<ActionResult<T>> {
    setState((state) => ({ pending: state.pending + 1 }));
    let result: ActionResult<T>;
    try {
      result = await action();
    } catch {
      result = { ok: false, code: "SERVER", error: "Couldn't reach the server. Check your connection and try again." };
    }
    setState((state) => ({ pending: state.pending - 1 }));

    if (!result.ok) {
      if (result.code === "UNAUTHORIZED") {
        // A full page load (not a client-side route change) drops all in-memory data.
        window.location.replace("/login");
        return result;
      }
      if (!silent) toast.error(result.error);
      if (resyncOnError) resyncWanted = true;
    }
    if (resyncWanted && getState().pending === 0) void resync({ silent: true });
    return result;
  }

  /** Reloads all data from the server. Returns whether the fetch succeeded. */
  async function resync({ silent = false } = {}): Promise<boolean> {
    resyncWanted = false;
    const result = await run(fetchSnapshot, { silent, resyncOnError: false });
    if (!result.ok) return false;
    if (getState().pending > 0) {
      resyncWanted = true; // newer changes are still saving; reload after them
    } else {
      setState({ ...result.data, syncedAt: Date.now() });
    }
    return true;
  }

  return {
    resync,

    async addMoneyEntry(draft: MoneyDraft) {
      const entry: MoneyEntry = {
        ...draft,
        id: newId(),
        category: draft.category.trim(),
        amount: roundMoney(draft.amount),
        narration: draft.narration.trim(),
        createdAt: timestamp(),
      };
      setState((state) => ({ money: [...state.money, entry] }));
      const result = await run(() =>
        createMoneyEntry({
          id: entry.id,
          date: entry.date,
          type: entry.type,
          category: entry.category,
          amount: entry.amount,
          mode: entry.mode,
          narration: entry.narration,
        }),
      );
      if (result.ok) setState((state) => ({ money: replaceById(state.money, entry.id, result.data) }));
      return result.ok;
    },

    removeMoneyEntry(id: string) {
      setState((state) => ({ money: removeById(state.money, id) }));
      return run(() => deleteMoneyEntry(id));
    },

    async addEvent(draft: EventDraft) {
      const event: CalendarEvent = {
        ...draft,
        id: newId(),
        title: draft.title.trim(),
        notes: draft.notes.trim(),
        alerted: false,
        createdAt: timestamp(),
      };
      setState((state) => ({ events: [...state.events, event] }));
      const result = await run(() =>
        createEvent({ id: event.id, title: event.title, date: event.date, time: event.time, notes: event.notes }),
      );
      if (result.ok) setState((state) => ({ events: replaceById(state.events, event.id, result.data) }));
      return result.ok;
    },

    removeEvent(id: string) {
      setState((state) => ({ events: removeById(state.events, id) }));
      return run(() => deleteEvent(id));
    },

    setEventAlerted(id: string) {
      setState((state) => ({ events: state.events.map((e) => (e.id === id ? { ...e, alerted: true } : e)) }));
      return run(() => markEventAlerted(id), { silent: true });
    },

    async addTask(draft: TaskDraft) {
      const task: Task = {
        ...draft,
        id: newId(),
        title: draft.title.trim(),
        assignee: draft.assignee.trim(),
        notes: draft.notes.trim(),
        remarks: draft.remarks.trim(),
        alerted: false,
        createdAt: timestamp(),
      };
      setState((state) => ({ tasks: [...state.tasks, task] }));
      const result = await run(() =>
        createTask({
          id: task.id,
          title: task.title,
          dueDate: task.dueDate,
          priority: task.priority,
          status: task.status,
          assignee: task.assignee,
          notes: task.notes,
          remarks: task.remarks,
        }),
      );
      if (result.ok) setState((state) => ({ tasks: replaceById(state.tasks, task.id, result.data) }));
      return result.ok;
    },

    removeTask(id: string) {
      setState((state) => ({ tasks: removeById(state.tasks, id) }));
      return run(() => deleteTask(id));
    },

    setTaskStatus(id: string, status: TaskStatus) {
      setState((state) => ({ tasks: state.tasks.map((t) => (t.id === id ? { ...t, status } : t)) }));
      return run(() => updateTaskStatus(id, status));
    },

    setTaskAlerted(id: string) {
      setState((state) => ({ tasks: state.tasks.map((t) => (t.id === id ? { ...t, alerted: true } : t)) }));
      return run(() => markTaskAlerted(id), { silent: true });
    },

    async addTodo(draft: TodoDraft) {
      const todo: Todo = {
        ...draft,
        id: newId(),
        title: draft.title.trim(),
        remarks: draft.remarks.trim(),
        createdAt: timestamp(),
      };
      setState((state) => ({ todos: [...state.todos, todo] }));
      const result = await run(() =>
        createTodo({ id: todo.id, title: todo.title, status: todo.status, priority: todo.priority, remarks: todo.remarks }),
      );
      if (result.ok) setState((state) => ({ todos: replaceById(state.todos, todo.id, result.data) }));
      return result.ok;
    },

    removeTodo(id: string) {
      setState((state) => ({ todos: removeById(state.todos, id) }));
      return run(() => deleteTodo(id));
    },

    setTodoStatus(id: string, status: TodoStatus) {
      setState((state) => ({ todos: state.todos.map((t) => (t.id === id ? { ...t, status } : t)) }));
      return run(() => updateTodoStatus(id, status));
    },

    /** Saves an asset; an existing asset with the same name is updated instead. */
    async upsertAsset(draft: AssetDraft) {
      const key = assetKey(draft.name);
      const existing = getState().assets.find((asset) => assetKey(asset.name) === key);
      const asset: Asset = existing
        ? { ...existing, category: draft.category, value: roundMoney(draft.value), notes: draft.notes.trim() }
        : {
            id: newId(),
            name: draft.name.trim(),
            category: draft.category,
            value: roundMoney(draft.value),
            notes: draft.notes.trim(),
            createdAt: timestamp(),
          };
      setState((state) => ({
        assets: existing ? replaceById(state.assets, asset.id, asset) : [...state.assets, asset],
      }));
      const result = await run(() =>
        saveAsset({ id: asset.id, name: asset.name, category: asset.category, value: asset.value, notes: asset.notes }),
      );
      if (result.ok) setState((state) => ({ assets: replaceById(state.assets, asset.id, result.data) }));
      return result.ok;
    },

    removeAsset(id: string) {
      setState((state) => ({ assets: removeById(state.assets, id) }));
      return run(() => deleteAsset(id));
    },

    async setAssetValues(values: { id: string; value: number }[]) {
      const next = new Map(values.map(({ id, value }) => [id, roundMoney(value)]));
      setState((state) => ({
        assets: state.assets.map((asset) => {
          const value = next.get(asset.id);
          return value === undefined ? asset : { ...asset, value };
        }),
      }));
      return (await run(() => updateAssetValues(values))).ok;
    },

    async importAssetRows(input: ImportAssetsInput) {
      const result = await run(() => importAssets(input));
      if (result.ok) setState({ assets: result.data });
      return result.ok;
    },

    /** Replaces everything with a backup file's contents. */
    async restoreFromBackup(backup: unknown) {
      const result = await run(() => restoreBackup(backup), { resyncOnError: false });
      if (!result.ok) return null;
      setState({ ...result.data.snapshot, syncedAt: Date.now() });
      return { skipped: result.data.skipped };
    },

    /** Adds an entry to the backup history and updates "last backup". */
    recordBackup(method: string) {
      const entry = { id: newId(), method, createdAt: timestamp() };
      setState((state) => ({ backupLog: [entry, ...state.backupLog].slice(0, 30), lastBackupAt: entry.createdAt }));
      void run(() => logBackup(method), { silent: true }).then((result) => {
        if (!result.ok) return;
        setState((state) => ({
          backupLog: replaceById(state.backupLog, entry.id, result.data.entry),
          lastBackupAt: result.data.lastBackupAt,
        }));
      });
    },

    clearBackupHistory() {
      setState({ backupLog: [] });
      return run(clearBackupLog);
    },
  };
}
