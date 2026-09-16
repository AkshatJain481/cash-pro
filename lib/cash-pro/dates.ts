// Local calendar helpers. Days are `YYYY-MM-DD` strings in the user's own
// time zone, so "today" never jumps a day around midnight UTC.

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const pad = (n: number) => String(n).padStart(2, "0");

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export const todayKey = () => toDateKey(new Date());

/** Local midnight of a `YYYY-MM-DD` day. */
export function fromDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(key: string, days: number): string {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/** `13 Sep 2026` */
export function prettyDate(key: string | null | undefined): string {
  if (!key) return "";
  const [year, month, day] = key.split("-");
  return `${day} ${MONTHS[Number(month) - 1].slice(0, 3)} ${year}`;
}

export const weekdayOf = (key: string) => WEEKDAYS[fromDateKey(key).getDay()];

/** Local `Date` for a day at an `HH:MM` wall-clock time. */
export function atLocalTime(key: string, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const date = fromDateKey(key);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/** `Sun, 13 September 2026` */
export function longDate(date: Date): string {
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** `09:05:30`, or `09:05` without seconds. */
export function clockTime(date: Date, withSeconds = true): string {
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return withSeconds ? `${time}:${pad(date.getSeconds())}` : time;
}

/** The next Sunday after `from` (a Sunday gives the following week's). */
export function nextSundayKey(from = new Date()): string {
  const date = new Date(from);
  date.setDate(date.getDate() + ((7 - date.getDay()) % 7 || 7));
  return toDateKey(date);
}
