export const ORDER_REPORT_PERIODS = ['today', 'yesterday', 'weekly', 'monthly', 'yearly'] as const;
export type OrderReportPeriod = typeof ORDER_REPORT_PERIODS[number];

function indiaDateParts(date: Date) {
  const values = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => values.find((value) => value.type === type)?.value || '';
  return {
    year: Number(part('year')),
    month: Number(part('month')),
    day: Number(part('day')),
    weekday: part('weekday'),
  };
}

function indiaMidnightUtc(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day) - 330 * 60 * 1000);
}

export function getOrderReportRange(period: OrderReportPeriod, now = new Date()) {
  const { year, month, day, weekday } = indiaDateParts(now);
  const todayUtc = Date.UTC(year, month - 1, day);

  if (period === 'today') {
    return { start: indiaMidnightUtc(year, month, day), end: indiaMidnightUtc(year, month, day + 1) };
  }
  if (period === 'yesterday') {
    const yesterday = new Date(todayUtc - 86400000);
    return {
      start: indiaMidnightUtc(yesterday.getUTCFullYear(), yesterday.getUTCMonth() + 1, yesterday.getUTCDate()),
      end: indiaMidnightUtc(year, month, day),
    };
  }
  if (period === 'weekly') {
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const daysSinceMonday = (weekdays.indexOf(weekday) + 6) % 7;
    const monday = new Date(todayUtc - daysSinceMonday * 86400000);
    const nextMonday = new Date(monday.getTime() + 7 * 86400000);
    return {
      start: indiaMidnightUtc(monday.getUTCFullYear(), monday.getUTCMonth() + 1, monday.getUTCDate()),
      end: indiaMidnightUtc(nextMonday.getUTCFullYear(), nextMonday.getUTCMonth() + 1, nextMonday.getUTCDate()),
    };
  }
  if (period === 'monthly') {
    const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
    return { start: indiaMidnightUtc(year, month, 1), end: indiaMidnightUtc(nextMonth.year, nextMonth.month, 1) };
  }
  return { start: indiaMidnightUtc(year, 1, 1), end: indiaMidnightUtc(year + 1, 1, 1) };
}
