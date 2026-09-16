"use server";

import type { ActionResult, CalendarEvent } from "@/lib/cash-pro/types";
import { eventSchema, idSchema, type EventInput } from "@/lib/cash-pro/validation";
import { prisma } from "@/lib/prisma";
import { runAction } from "@/lib/server/action";
import { dayToDb, timeToDb, toCalendarEvent } from "@/lib/server/mappers";

export async function createEvent(input: EventInput): Promise<ActionResult<CalendarEvent>> {
  return runAction(eventSchema, input, async (event, userId) => {
    const row = await prisma.event.create({
      data: { ...event, userId, date: dayToDb(event.date), time: timeToDb(event.time) },
    });
    return toCalendarEvent(row);
  });
}

export async function deleteEvent(id: string): Promise<ActionResult<null>> {
  return runAction(idSchema, id, async (eventId, userId) => {
    await prisma.event.deleteMany({ where: { userId, id: eventId } });
    return null;
  });
}

/** Records that the 1-hour reminder was shown so it isn't repeated. */
export async function markEventAlerted(id: string): Promise<ActionResult<null>> {
  return runAction(idSchema, id, async (eventId, userId) => {
    await prisma.event.updateMany({ where: { userId, id: eventId }, data: { alerted: true } });
    return null;
  });
}
