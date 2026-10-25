import {
  addDays,
  differenceInCalendarDays,
  format,
  formatDistanceToNowStrict,
  isValid,
  parse,
  parseISO,
  startOfWeek,
} from 'date-fns';

const DATE_PATTERNS = [
  'dd-MM-yyyy',
  'dd/MM/yyyy',
  'yyyy/MM/dd',
  'dd MMM yyyy',
  'dd-MMM-yyyy',
  'MMM d, yyyy',
  'd MMMM yyyy',
];

export function parseEtlabDate(raw?: string | null): Date | null {
  if (typeof raw !== 'string') {
    return null;
  }
  const value = raw.trim();
  if (!value) {
    return null;
  }

  const iso = parseISO(value);
  if (isValid(iso)) {
    return iso;
  }

  for (const pattern of DATE_PATTERNS) {
    const parsed = parse(value, pattern, new Date());
    if (isValid(parsed)) {
      return parsed;
    }
  }
  return null;
}

export type DeadlineTone = 'danger' | 'warning' | 'muted' | 'success';

export function deadlineMeta(raw?: string | null): { label: string; tone: DeadlineTone } {
  const date = parseEtlabDate(raw);
  if (!date) {
    return { label: 'No deadline', tone: 'muted' };
  }

  const days = differenceInCalendarDays(date, new Date());
  if (days < -1) {
    return { label: `${Math.abs(days)} days overdue`, tone: 'danger' };
  }
  if (days === -1) {
    return { label: 'Overdue by a day', tone: 'danger' };
  }
  if (days === 0) {
    return { label: 'Due today', tone: 'danger' };
  }
  if (days === 1) {
    return { label: 'Due tomorrow', tone: 'warning' };
  }
  if (days <= 3) {
    return { label: `Due in ${days} days`, tone: 'warning' };
  }
  return { label: format(date, 'd MMM'), tone: 'muted' };
}

export function formatDate(raw?: string | null, pattern = 'd MMM yyyy'): string {
  const date = parseEtlabDate(raw);
  return date ? format(date, pattern) : '—';
}

export function relativeTime(raw?: string | null): string {
  const date = parseEtlabDate(raw);
  if (!date) {
    return '';
  }
  const distance = formatDistanceToNowStrict(date);
  return date.getTime() > Date.now() ? `in ${distance}` : `${distance} ago`;
}

export function greeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 17) {
    return 'Good afternoon';
  }
  return 'Good evening';
}

export function initials(name?: string | null): string {
  if (!name?.trim()) {
    return '?';
  }
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || '?';
}

export function formatPercent(value: number, digits = 1): string {
  if (!Number.isFinite(value)) {
    return '—';
  }
  const rounded = value.toFixed(digits);
  return `${rounded.replace(/\.0+$/, '')}%`;
}

export function formatClock(date: Date): string {
  return format(date, 'h:mm a');
}

export type AttendanceStats = {
  percentage: number;
  canBunk: number;
  requiredToRecover: number;
  isSafe: boolean;
};

/**
 * Bunk math used by the attendance screen.
 *
 * canBunk      how many consecutive absences keep you at or above target
 * required     how many consecutive classes you must attend to reach target
 */
export function attendanceStats(attended: number, total: number, target = 75): AttendanceStats {
  if (!Number.isFinite(attended) || !Number.isFinite(total) || total <= 0) {
    return { percentage: 0, canBunk: 0, requiredToRecover: 0, isSafe: false };
  }

  const safeTarget = Math.min(99, Math.max(1, target)) / 100;
  const percentage = (attended / total) * 100;
  const isSafe = percentage >= safeTarget * 100;

  if (isSafe) {
    const canBunk = Math.max(
      0,
      Math.floor((attended - safeTarget * total) / safeTarget),
    );
    return { percentage, canBunk, requiredToRecover: 0, isSafe };
  }

  const requiredToRecover = Math.max(
    1,
    Math.ceil((safeTarget * total - attended) / (1 - safeTarget)),
  );
  return { percentage, canBunk: 0, requiredToRecover, isSafe };
}

export function weekdayShort(day: string): string {
  return day.slice(0, 3);
}

/**
 * The timetable returns placeholder attendance values for periods that have no
 * attendance record. They are not statuses and should not become badges.
 */
export function meaningfulAttendance(value?: string | null): string | undefined {
  const status = value?.trim();
  if (!status) {
    return undefined;
  }
  const normalized = status.toLowerCase();
  if (
    normalized === 'n/a' ||
    normalized === 'na' ||
    normalized === 'n.a.' ||
    normalized === 'not applicable' ||
    normalized === 'nil' ||
    normalized === 'none' ||
    normalized === '-' ||
    normalized === '—'
  ) {
    return undefined;
  }
  return status;
}

/**
 * Timetable weeks run Monday to Saturday. On a Sunday the useful week is the
 * one that starts tomorrow, not the one that just ended.
 */
export function initialTimetableDate(now = new Date()): Date {
  if (now.getDay() === 0) {
    return addDays(startOfWeek(now, { weekStartsOn: 1 }), 7);
  }
  return now;
}
