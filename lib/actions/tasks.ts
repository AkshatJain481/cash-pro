"use server";

import type { TaskStatus } from "@/lib/cash-pro/constants";
import type { ActionResult, Task } from "@/lib/cash-pro/types";
import { idSchema, taskSchema, taskStatusSchema, type TaskInput } from "@/lib/cash-pro/validation";
import { prisma } from "@/lib/prisma";
import { runAction } from "@/lib/server/action";
import { dayToDb, toTask } from "@/lib/server/mappers";

export async function createTask(input: TaskInput): Promise<ActionResult<Task>> {
  return runAction(taskSchema, input, async (task, userId) => {
    const row = await prisma.task.create({
      data: { ...task, userId, dueDate: task.dueDate ? dayToDb(task.dueDate) : null },
    });
    return toTask(row);
  });
}

export async function deleteTask(id: string): Promise<ActionResult<null>> {
  return runAction(idSchema, id, async (taskId, userId) => {
    await prisma.task.deleteMany({ where: { userId, id: taskId } });
    return null;
  });
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<ActionResult<null>> {
  return runAction(taskStatusSchema, { id, status }, async (input, userId) => {
    await prisma.task.updateMany({ where: { userId, id: input.id }, data: { status: input.status } });
    return null;
  });
}

/** Records that the "due soon" reminder was shown so it isn't repeated. */
export async function markTaskAlerted(id: string): Promise<ActionResult<null>> {
  return runAction(idSchema, id, async (taskId, userId) => {
    await prisma.task.updateMany({ where: { userId, id: taskId }, data: { alerted: true } });
    return null;
  });
}
