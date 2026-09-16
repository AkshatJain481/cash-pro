"use client";

import { ClipboardList, ListChecks, ListFilter, MessageSquare, SquareCheckBig, User } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  LIMITS,
  PRIORITY_LABEL,
  STATUS_LABEL,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/cash-pro/constants";
import { prettyDate, todayKey } from "@/lib/cash-pro/dates";
import type { Task } from "@/lib/cash-pro/types";
import { cn } from "@/lib/utils";

import {
  DeleteButton,
  EmptyState,
  FormField,
  ListItem,
  Note,
  PriorityLabel,
  SectionCard,
  SplitLayout,
  StatusBadge,
  SubmitButton,
} from "../common";
import { useCashPro, useCashProActions } from "../store";

type Filter = "ALL" | TaskStatus;

const FILTERS: { value: Filter; label: string; className: string }[] = [
  { value: "ALL", label: "All", className: "data-[state=on]:bg-secondary data-[state=on]:text-primary" },
  { value: "PENDING", label: "Pending", className: "text-warning data-[state=on]:bg-warning/15" },
  { value: "IN_PROGRESS", label: "In Progress", className: "text-info data-[state=on]:bg-info/15" },
  { value: "DONE", label: "Done", className: "text-income data-[state=on]:bg-income/15" },
  { value: "BLOCKED", label: "Blocked", className: "text-expense data-[state=on]:bg-expense/15" },
];

const STATUS_BORDER: Record<TaskStatus, string> = {
  PENDING: "border-l-border",
  IN_PROGRESS: "border-l-info",
  DONE: "border-l-income",
  BLOCKED: "border-l-expense",
};

export function TasksScreen() {
  const tasks = useCashPro((s) => s.tasks);
  const actions = useCashProActions();
  const [filter, setFilter] = useState<Filter>("ALL");

  const shown = useMemo(
    () =>
      (filter === "ALL" ? [...tasks] : tasks.filter((task) => task.status === filter)).sort((a, b) =>
        (a.dueDate ?? "").localeCompare(b.dueDate ?? ""),
      ),
    [tasks, filter],
  );

  return (
    <SplitLayout sticky aside={<TaskForm />}>
      <SectionCard className="py-2.5" contentClassName="px-3">
        <div className="flex items-center gap-2">
          <ListFilter className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <ToggleGroup
            type="single"
            size="sm"
            spacing={1}
            value={filter}
            onValueChange={(value) => value && setFilter(value as Filter)}
            aria-label="Filter tasks by status"
            className="no-scrollbar w-full min-w-0 overflow-x-auto p-0.5"
          >
            {FILTERS.map((option) => (
              <ToggleGroupItem key={option.value} value={option.value} className={cn("font-semibold", option.className)}>
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </SectionCard>

      <SectionCard
        title="Tasks"
        icon={ListChecks}
        action={
          <span className="font-mono text-[11px] text-faint">
            {shown.length} / {tasks.length}
          </span>
        }
      >
        {shown.length ? (
          <div className="grid gap-2 @6xl/main:grid-cols-2 @6xl/main:items-start">
            {shown.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onStatusChange={(status) => void actions.setTaskStatus(task.id, status)}
                onDelete={() => void actions.removeTask(task.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState icon={SquareCheckBig}>No tasks match this filter.</EmptyState>
        )}
      </SectionCard>
    </SplitLayout>
  );
}

function TaskForm() {
  const actions = useCashProActions();
  const [form, setForm] = useState(() => ({
    title: "",
    dueDate: todayKey(),
    priority: "MEDIUM" as TaskPriority,
    status: "PENDING" as TaskStatus,
    assignee: "",
    notes: "",
    remarks: "",
  }));
  const update = (patch: Partial<typeof form>) => setForm((current) => ({ ...current, ...patch }));

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim()) {
      toast.error("Enter task title");
      return;
    }
    update({ title: "", assignee: "", notes: "", remarks: "" });
    const saved = await actions.addTask({ ...form, dueDate: form.dueDate || null });
    if (saved) toast.success("Task saved!");
  }

  return (
    <SectionCard title="Add Task" icon={SquareCheckBig}>
      <form onSubmit={save} className="flex flex-col gap-3">
        <FormField label="Task Title" htmlFor="task-title">
          <Input
            id="task-title"
            value={form.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="Task name…"
            maxLength={LIMITS.taskTitle}
            className="h-11"
          />
        </FormField>
        <div className="grid grid-cols-2 gap-2.5">
          <FormField label="Due Date" htmlFor="task-due">
            <Input
              id="task-due"
              type="date"
              value={form.dueDate}
              onChange={(e) => update({ dueDate: e.target.value })}
              className="h-11"
            />
          </FormField>
          <FormField label="Priority" htmlFor="task-priority">
            <NativeSelect
              id="task-priority"
              value={form.priority}
              onChange={(e) => update({ priority: e.target.value as TaskPriority })}
              className="[&_select]:h-11"
            >
              {TASK_PRIORITIES.map((priority) => (
                <NativeSelectOption key={priority} value={priority}>
                  {PRIORITY_LABEL[priority]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <FormField label="Status" htmlFor="task-status">
            <NativeSelect
              id="task-status"
              value={form.status}
              onChange={(e) => update({ status: e.target.value as TaskStatus })}
              className="[&_select]:h-11"
            >
              {TASK_STATUSES.map((status) => (
                <NativeSelectOption key={status} value={status}>
                  {STATUS_LABEL[status]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </FormField>
          <FormField label="Assignee" htmlFor="task-assignee">
            <Input
              id="task-assignee"
              value={form.assignee}
              onChange={(e) => update({ assignee: e.target.value })}
              placeholder="Name (optional)"
              maxLength={LIMITS.assignee}
              className="h-11"
            />
          </FormField>
        </div>
        <FormField label="Description / Narration" htmlFor="task-notes">
          <Textarea
            id="task-notes"
            value={form.notes}
            onChange={(e) => update({ notes: e.target.value })}
            placeholder="Details, steps, context…"
            maxLength={LIMITS.taskNotes}
            className="min-h-20"
          />
        </FormField>
        <FormField label="Remarks" htmlFor="task-remarks">
          <Input
            id="task-remarks"
            value={form.remarks}
            onChange={(e) => update({ remarks: e.target.value })}
            placeholder="Outcome, blockers, next action…"
            maxLength={LIMITS.remarks}
            className="h-11"
          />
        </FormField>
        <SubmitButton>Save Task</SubmitButton>
      </form>
    </SectionCard>
  );
}

function TaskItem({
  task,
  onStatusChange,
  onDelete,
}: {
  task: Task;
  onStatusChange: (status: TaskStatus) => void;
  onDelete: () => void;
}) {
  return (
    <ListItem className={cn("border-l-[3px]", STATUS_BORDER[task.status])}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold break-words">{task.title}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <StatusBadge status={task.status} />
            <PriorityLabel priority={task.priority} />
          </div>
        </div>
        <div className="shrink-0 text-right font-mono text-[11px] text-faint">
          <p>{task.dueDate ? prettyDate(task.dueDate) : "No due date"}</p>
          {task.assignee && (
            <p className="mt-0.5 flex items-center justify-end gap-1">
              <User className="size-3" />
              {task.assignee}
            </p>
          )}
        </div>
      </div>
      {task.notes && <Note icon={ClipboardList}>{task.notes}</Note>}
      {task.remarks && (
        <Note icon={MessageSquare} tone="warning">
          {task.remarks}
        </Note>
      )}
      <div className="mt-2.5 flex items-center gap-2">
        <NativeSelect
          size="sm"
          value={task.status}
          onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
          aria-label="Task status"
          className="w-full flex-1"
        >
          {TASK_STATUSES.map((status) => (
            <NativeSelectOption key={status} value={status}>
              {STATUS_LABEL[status]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <DeleteButton iconOnly label="Delete task" onClick={onDelete} />
      </div>
    </ListItem>
  );
}
