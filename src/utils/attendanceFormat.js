/**
 * Formatting helpers for attendance rows.
 *
 * Real contract (see memberController.getMemberAttendance):
 *   GET /api/members/:id/attendance
 *   -> { data: { attendance: [{ id, check_in_time, check_out_time,
 *                              location, duration_minutes }],
 *               pagination: { currentPage, totalPages, totalRecords, limit } } }
 *
 * `duration_minutes` is a generated column: NULL while the visit is still open.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export function parseVisitDate(value) {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** "Today", "Yesterday", a weekday for the last week, then a short date. */
export function formatVisitDay(value, now = Date.now()) {
  const date = parseVisitDate(value);
  if (!date) return '—';

  const today = startOfDay(new Date(now));
  const day = startOfDay(date);
  const diffDays = Math.round((today.getTime() - day.getTime()) / DAY_MS);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays > 1 && diffDays < 7) {
    return date.toLocaleDateString(undefined, { weekday: 'long' });
  }

  const sameYear = date.getFullYear() === today.getFullYear();

  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

export function formatVisitTime(value) {
  const date = parseVisitDate(value);
  if (!date) return '—';

  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function isVisitOpen(visit) {
  return Boolean(visit?.check_in_time) && !visit?.check_out_time;
}

/** Stored generated value first, computed from the timestamps as a fallback. */
export function getVisitDurationMinutes(visit) {
  const start = parseVisitDate(visit?.check_in_time);
  const end = parseVisitDate(visit?.check_out_time);

  if (start && end && end.getTime() >= start.getTime()) {
    return Math.round((end.getTime() - start.getTime()) / 60000);
  }

  const stored = Number(visit?.duration_minutes);
  return Number.isFinite(stored) && stored >= 0 ? stored : null;
}

export function formatDuration(minutes) {
  if (!Number.isFinite(minutes) || minutes < 0) return '—';
  if (minutes === 0) return 'Under a minute';
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return rest > 0 ? `${hours} h ${rest} min` : `${hours} h`;
}

/** Local calendar month start as an ISO date (`YYYY-MM-01`) for ?startDate=. */
export function getMonthStartDate(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  return `${year}-${month}-01`;
}

export function getMonthLabel(now = new Date()) {
  return now.toLocaleDateString(undefined, { month: 'long' });
}
