export const toISODate = (date = new Date()) => date.toISOString().slice(0, 10);

export const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toISODate(date);
};

export const daysFromNow = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toISODate(date);
};

export const isSameDay = (date: string, comparison = toISODate()) =>
  date.slice(0, 10) === comparison.slice(0, 10);

export const isWithinLastDays = (date: string, days: number) => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  return diffMs >= 0 && diffMs <= days * 24 * 60 * 60 * 1000;
};

export const formatShortDate = (date: string) =>
  new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(date));

export const weekdayLabel = (date = new Date()) =>
  new Intl.DateTimeFormat('en', { weekday: 'long' }).format(date);
