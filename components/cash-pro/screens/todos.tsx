"use client";

import { Check, CircleCheckBig, CircleDashed, Clock3, ListPlus, MessageSquare } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  LIMITS,
  PRIORITY_LABEL,
  STATUS_LABEL,
  TODO_PRIORITIES,
  TODO_STATUSES,
  type TodoPriority,
  type TodoStatus,
} from "@/lib/cash-pro/constants";
import type { Todo } from "@/lib/cash-pro/types";
import { cn } from "@/lib/utils";

import { DeleteButton, EmptyState, FormField, ListItem, Pill, SectionCard, SubmitButton, type Tone } from "../common";
import { useCashPro, useCashProActions } from "../store";

const GROUPS = [
  { status: "PENDING", title: "Pending", tone: "expense", empty: "Nothing pending.", icon: CircleDashed },
  { status: "IN_PROGRESS", title: "In Progress", tone: "info", empty: "Nothing in progress.", icon: Clock3 },
  { status: "DONE", title: "Done", tone: "income", empty: "None done yet.", icon: CircleCheckBig },
] as const satisfies readonly { status: TodoStatus; title: string; tone: Tone; empty: string; icon: unknown }[];

const PRIORITY_TONE: Record<TodoPriority, Tone> = { HIGH: "expense", MEDIUM: "info", LOW: "primary" };

export function TodosScreen() {
  const todos = useCashPro((s) => s.todos);
  const actions = useCashProActions();

  return (
    <>
      <TodoForm />
      {/* A board with one column per status on wide layouts. */}
      <div className="grid gap-3 @4xl/main:grid-cols-3 @4xl/main:items-start @4xl/main:gap-5">
        {GROUPS.map((group) => {
          const items = todos.filter((todo) => todo.status === group.status);
          return (
            <SectionCard
              key={group.status}
              title={group.title}
              icon={group.icon}
              action={
                <Pill tone={group.tone} className="font-mono">
                  {items.length}
                </Pill>
              }
            >
              {items.length ? (
                <div className="flex flex-col gap-2">
                  {items.map((todo) => (
                    <TodoItem
                      key={todo.id}
                      todo={todo}
                      onStatusChange={(status) => void actions.setTodoStatus(todo.id, status)}
                      onDelete={() => void actions.removeTodo(todo.id)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState icon={group.icon}>{group.empty}</EmptyState>
              )}
            </SectionCard>
          );
        })}
      </div>
    </>
  );
}

function TodoForm() {
  const actions = useCashProActions();
  const [form, setForm] = useState({
    title: "",
    status: "PENDING" as TodoStatus,
    priority: "MEDIUM" as TodoPriority,
    remarks: "",
  });
  const update = (patch: Partial<typeof form>) => setForm((current) => ({ ...current, ...patch }));

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim()) {
      toast.error("Enter a to-do title");
      return;
    }
    update({ title: "", remarks: "" });
    if (await actions.addTodo(form)) toast.success("To-do added!");
  }

  return (
    <SectionCard title="Add To-Do Item" icon={ListPlus}>
      {/* Stacked on phones; a compact two-row form on wide layouts. */}
      <form
        onSubmit={save}
        className="grid gap-3 @4xl/main:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] @4xl/main:items-end @4xl/main:gap-x-4"
      >
        <FormField label="Title" htmlFor="todo-title">
          <Input
            id="todo-title"
            value={form.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="Quick to-do…"
            maxLength={LIMITS.todoTitle}
            className="h-11"
          />
        </FormField>
        <div className="grid grid-cols-2 gap-2.5 @4xl/main:contents">
          <FormField label="Status" htmlFor="todo-status">
            <NativeSelect
              id="todo-status"
              value={form.status}
              onChange={(e) => update({ status: e.target.value as TodoStatus })}
              className="[&_select]:h-11"
            >
              {TODO_STATUSES.map((status) => (
                <NativeSelectOption key={status} value={status}>
                  {STATUS_LABEL[status]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </FormField>
          <FormField label="Priority" htmlFor="todo-priority">
            <NativeSelect
              id="todo-priority"
              value={form.priority}
              onChange={(e) => update({ priority: e.target.value as TodoPriority })}
              className="[&_select]:h-11"
            >
              {TODO_PRIORITIES.map((priority) => (
                <NativeSelectOption key={priority} value={priority}>
                  {PRIORITY_LABEL[priority]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </FormField>
        </div>
        <FormField label="Remarks / Notes" htmlFor="todo-remarks" className="@4xl/main:col-span-2">
          <Textarea
            id="todo-remarks"
            value={form.remarks}
            onChange={(e) => update({ remarks: e.target.value })}
            placeholder="Context, outcome, next step…"
            maxLength={LIMITS.remarks}
            className="min-h-20 @4xl/main:min-h-11"
          />
        </FormField>
        <SubmitButton>Add To-Do</SubmitButton>
      </form>
    </SectionCard>
  );
}

function TodoItem({
  todo,
  onStatusChange,
  onDelete,
}: {
  todo: Todo;
  onStatusChange: (status: TodoStatus) => void;
  onDelete: () => void;
}) {
  const done = todo.status === "DONE";

  return (
    <ListItem>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <button
            type="button"
            onClick={() => onStatusChange(done ? "PENDING" : "DONE")}
            aria-label={done ? "Mark as pending" : "Mark as done"}
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
              done && "border-income bg-income text-card",
              todo.status === "IN_PROGRESS" && "border-info",
              todo.status === "PENDING" && "border-border hover:border-income",
            )}
          >
            {done && <Check className="size-3" strokeWidth={3} />}
          </button>
          <p className={cn("min-w-0 text-sm font-semibold break-words", done && "text-faint line-through")}>
            {todo.title}
          </p>
        </div>
        <Pill tone={PRIORITY_TONE[todo.priority]}>{PRIORITY_LABEL[todo.priority]}</Pill>
      </div>
      {todo.remarks && (
        <p className="mt-2 flex gap-1.5 pl-7 text-xs break-words text-muted-foreground">
          <MessageSquare className="mt-0.5 size-3 shrink-0" />
          {todo.remarks}
        </p>
      )}
      <div className="mt-2.5 flex items-center gap-2">
        <NativeSelect
          size="sm"
          value={todo.status}
          onChange={(e) => onStatusChange(e.target.value as TodoStatus)}
          aria-label="To-do status"
          className="w-full flex-1"
        >
          {TODO_STATUSES.map((status) => (
            <NativeSelectOption key={status} value={status}>
              {STATUS_LABEL[status]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <DeleteButton iconOnly label="Delete to-do" onClick={onDelete} />
      </div>
    </ListItem>
  );
}
