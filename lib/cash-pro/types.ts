import type {
  AssetCategory,
  EntryType,
  PaymentMode,
  TaskPriority,
  TaskStatus,
  TodoPriority,
  TodoStatus,
} from "./constants";

// Plain, serializable shapes sent between the server and the client.
// Dates are `YYYY-MM-DD`, times are `HH:MM`, timestamps are ISO strings.

export type MoneyEntry = {
  id: string;
  date: string;
  type: EntryType;
  category: string;
  amount: number;
  mode: PaymentMode;
  narration: string;
  createdAt: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  notes: string;
  alerted: boolean;
  createdAt: string;
};

export type Task = {
  id: string;
  title: string;
  dueDate: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  assignee: string;
  notes: string;
  remarks: string;
  alerted: boolean;
  createdAt: string;
};

export type Todo = {
  id: string;
  title: string;
  status: TodoStatus;
  priority: TodoPriority;
  remarks: string;
  createdAt: string;
};

export type Asset = {
  id: string;
  name: string;
  category: AssetCategory;
  value: number;
  notes: string;
  createdAt: string;
  /** The derived cash balance — not stored, not editable. */
  autoLinked?: true;
};

export type BackupLogEntry = {
  id: string;
  method: string;
  createdAt: string;
};

export type Snapshot = {
  money: MoneyEntry[];
  events: CalendarEvent[];
  tasks: Task[];
  todos: Todo[];
  /** Stored assets only; see `withCashAsset`. */
  assets: Asset[];
  backupLog: BackupLogEntry[];
  lastBackupAt: string | null;
};

export type AppUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};

export type ActionErrorCode = "UNAUTHORIZED" | "INVALID" | "NOT_FOUND" | "SERVER";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: ActionErrorCode; error: string };
