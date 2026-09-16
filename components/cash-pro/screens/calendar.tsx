"use client";

import {
  Bell,
  CalendarDays,
  CalendarPlus,
  CalendarRange,
  CalendarX2,
  ChevronLeft,
  ChevronRight,
  NotebookText,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LIMITS } from "@/lib/cash-pro/constants";
import { MONTHS, prettyDate, toDateKey, todayKey, WEEKDAYS } from "@/lib/cash-pro/dates";
import type { CalendarEvent } from "@/lib/cash-pro/types";
import { cn } from "@/lib/utils";

import {
  DeleteButton,
  EmptyState,
  FormField,
  IconTile,
  ListItem,
  Note,
  Pill,
  SectionCard,
  ShowMore,
  SplitLayout,
  SubmitButton,
} from "../common";
import { useMinute } from "../hooks";
import { useCashPro, useCashProActions } from "../store";

const PAGE_SIZE = 24;

export function CalendarScreen() {
  const events = useCashPro((s) => s.events);
  const actions = useCashProActions();
  const minute = useMinute();
  const today = toDateKey(new Date(minute));

  const [view, setView] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selected, setSelected] = useState(() => todayKey());
  const [form, setForm] = useState(() => ({ title: "", date: todayKey(), time: "", notes: "" }));
  const [visible, setVisible] = useState(PAGE_SIZE);
  const update = (patch: Partial<typeof form>) => setForm((current) => ({ ...current, ...patch }));

  const eventDays = useMemo(() => new Set(events.map((e) => e.date)), [events]);
  const chronological = useMemo(
    () => [...events].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)),
    [events],
  );
  const selectedEvents = chronological.filter((e) => e.date === selected);

  const firstWeekday = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();

  function moveMonth(delta: number) {
    setView(({ year, month }) => {
      const first = new Date(year, month + delta, 1);
      return { year: first.getFullYear(), month: first.getMonth() };
    });
  }

  function selectDay(key: string) {
    setSelected(key);
    update({ date: key });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim() || !form.date || !form.time) {
      toast.error("Fill title, date & time");
      return;
    }
    update({ title: "", notes: "" });
    const saved = await actions.addEvent({ title: form.title, date: form.date, time: form.time, notes: form.notes });
    if (saved) toast.success("Event saved! 🔔 Reminder set 1h before.");
  }

  const month = (
    <Card className="gap-3 py-4 shadow-xs">
      <div className="flex items-center justify-between gap-2 px-4">
        <Button variant="outline" size="icon" className="rounded-xl" onClick={() => moveMonth(-1)} aria-label="Previous month">
          <ChevronLeft />
        </Button>
        <h2 className="text-base font-bold tracking-tight">
          {MONTHS[view.month]} {view.year}
        </h2>
        <Button variant="outline" size="icon" className="rounded-xl" onClick={() => moveMonth(1)} aria-label="Next month">
          <ChevronRight />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 px-3">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-1 text-center text-[10px] font-bold tracking-wide text-faint uppercase">
            {day}
          </div>
        ))}
        {Array.from({ length: firstWeekday }, (_, index) => (
          <div key={`blank-${index}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const key = toDateKey(new Date(view.year, view.month, index + 1));
          const isToday = key === today;
          const isSelected = key === selected;
          const hasEvents = eventDays.has(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => selectDay(key)}
              aria-pressed={isSelected}
              aria-label={`${prettyDate(key)}${hasEvents ? ", has events" : ""}`}
              className={cn(
                "relative flex h-10 items-center justify-center rounded-xl text-sm font-medium tabular-nums transition-colors outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50",
                isToday && "bg-primary font-bold text-primary-foreground shadow-md shadow-primary/30 hover:bg-primary",
                isSelected && !isToday && "bg-secondary font-bold text-primary hover:bg-secondary",
              )}
            >
              {index + 1}
              {hasEvents && (
                <span
                  className={cn(
                    "absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full",
                    isToday ? "bg-primary-foreground/80" : "bg-warning",
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );

  const dayEvents = (
    <SectionCard title={`Events — ${prettyDate(selected)}`} icon={CalendarDays}>
      {selectedEvents.length ? (
        <div className="flex flex-col gap-2">
          {selectedEvents.map((event) => (
            <EventItem
              key={event.id}
              event={event}
              icon={CalendarDays}
              meta={prettyDate(event.date)}
              onDelete={() => void actions.removeEvent(event.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState icon={CalendarX2}>No events for this day.</EmptyState>
      )}
    </SectionCard>
  );

  return (
    <SplitLayout
      aside={
        <>
          {month}
          {dayEvents}
        </>
      }
    >
      <SectionCard title="Add Event / Reminder" icon={CalendarPlus}>
        <form onSubmit={save} className="flex flex-col gap-3">
          <FormField label="Event Title" htmlFor="event-title">
            <Input
              id="event-title"
              value={form.title}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="Meeting, Deadline, Appointment…"
              maxLength={LIMITS.eventTitle}
              className="h-11"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-2.5">
            <FormField label="Date" htmlFor="event-date">
              <Input
                id="event-date"
                type="date"
                value={form.date}
                onChange={(e) => update({ date: e.target.value })}
                className="h-11"
              />
            </FormField>
            <FormField label="Time" htmlFor="event-time">
              <Input
                id="event-time"
                type="time"
                value={form.time}
                onChange={(e) => update({ time: e.target.value })}
                className="h-11"
              />
            </FormField>
          </div>
          <FormField label="Notes / Location" htmlFor="event-notes">
            <Textarea
              id="event-notes"
              value={form.notes}
              onChange={(e) => update({ notes: e.target.value })}
              placeholder="Agenda, location, meeting link…"
              maxLength={LIMITS.eventNotes}
              className="min-h-20"
            />
          </FormField>
          <SubmitButton className="@4xl/main:w-auto @4xl/main:self-end @4xl/main:px-8">Save Event</SubmitButton>
        </form>
      </SectionCard>

      <SectionCard
        title="All Events"
        icon={CalendarRange}
        action={<span className="font-mono text-[11px] text-faint">{events.length} total</span>}
      >
        {chronological.length ? (
          <div className="flex flex-col gap-2">
            <div className="grid gap-2 @6xl/main:grid-cols-2 @6xl/main:items-start">
              {chronological.slice(0, visible).map((event) => (
                <EventItem
                  key={event.id}
                  event={event}
                  icon={Bell}
                  meta={`${prettyDate(event.date)} at ${event.time}`}
                  onDelete={() => void actions.removeEvent(event.id)}
                />
              ))}
            </div>
            {chronological.length > visible && (
              <ShowMore remaining={chronological.length - visible} onClick={() => setVisible((count) => count + PAGE_SIZE)} />
            )}
          </div>
        ) : (
          <EmptyState icon={CalendarX2}>No events yet.</EmptyState>
        )}
      </SectionCard>
    </SplitLayout>
  );
}

function EventItem({
  event,
  icon,
  meta,
  onDelete,
}: {
  event: CalendarEvent;
  icon: LucideIcon;
  meta: string;
  onDelete: () => void;
}) {
  return (
    <ListItem>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <IconTile icon={icon} tone="warning" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{event.title}</p>
            <p className="font-mono text-[11px] text-faint">{meta}</p>
          </div>
        </div>
        <Pill tone="warning" className="font-mono">
          {event.time}
        </Pill>
      </div>
      {event.notes && <Note icon={NotebookText}>{event.notes}</Note>}
      <div className="mt-2.5 flex">
        <DeleteButton onClick={onDelete} />
      </div>
    </ListItem>
  );
}
