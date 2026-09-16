"use server";

import type { TodoStatus } from "@/lib/cash-pro/constants";
import type { ActionResult, Todo } from "@/lib/cash-pro/types";
import { idSchema, todoSchema, todoStatusSchema, type TodoInput } from "@/lib/cash-pro/validation";
import { prisma } from "@/lib/prisma";
import { runAction } from "@/lib/server/action";
import { toTodo } from "@/lib/server/mappers";

export async function createTodo(input: TodoInput): Promise<ActionResult<Todo>> {
  return runAction(todoSchema, input, async (todo, userId) => {
    const row = await prisma.todo.create({ data: { ...todo, userId } });
    return toTodo(row);
  });
}

export async function deleteTodo(id: string): Promise<ActionResult<null>> {
  return runAction(idSchema, id, async (todoId, userId) => {
    await prisma.todo.deleteMany({ where: { userId, id: todoId } });
    return null;
  });
}

export async function updateTodoStatus(id: string, status: TodoStatus): Promise<ActionResult<null>> {
  return runAction(todoStatusSchema, { id, status }, async (input, userId) => {
    await prisma.todo.updateMany({ where: { userId, id: input.id }, data: { status: input.status } });
    return null;
  });
}
