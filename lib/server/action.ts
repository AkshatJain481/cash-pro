import "server-only";

import type { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import type { ActionErrorCode, ActionResult } from "@/lib/cash-pro/types";
import { getSession } from "@/lib/session";

/** Throw inside an action handler to send a specific error to the client. */
export class ActionError extends Error {
  readonly code: ActionErrorCode;

  constructor(code: ActionErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

const MAX_ATTEMPTS = 3;

// CockroachDB runs transactions as SERIALIZABLE and can ask the client to
// retry them (SQLSTATE 40001, which Prisma reports as P2034).
async function withRetry<T>(run: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await run();
    } catch (error) {
      const retryable = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
      if (!retryable || attempt === MAX_ATTEMPTS) throw error;
      await new Promise((resolve) => setTimeout(resolve, 25 * 2 ** attempt));
    }
  }
}

/** Runs `handler` for the signed-in user and turns failures into an ActionResult. */
export async function runAuthed<T>(handler: (userId: string) => Promise<T>): Promise<ActionResult<T>> {
  const session = await getSession();
  if (!session) {
    return { ok: false, code: "UNAUTHORIZED", error: "Your session has expired. Please sign in again." };
  }

  try {
    return { ok: true, data: await withRetry(() => handler(session.user.id)) };
  } catch (error) {
    if (error instanceof ActionError) return { ok: false, code: error.code, error: error.message };
    console.error("Server action failed:", error);
    return { ok: false, code: "SERVER", error: "Something went wrong. Please try again." };
  }
}

/** Like `runAuthed`, validating the untrusted `input` with `schema` first. */
export async function runAction<S extends z.ZodType, T>(
  schema: S,
  input: unknown,
  handler: (data: z.output<S>, userId: string) => Promise<T>,
): Promise<ActionResult<T>> {
  return runAuthed((userId) => {
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError("INVALID", parsed.error.issues[0]?.message ?? "Invalid input");
    }
    return handler(parsed.data, userId);
  });
}
