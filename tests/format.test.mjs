import assert from 'node:assert/strict';
import test from 'node:test';

import {
  attendanceStats,
  initialTimetableDate,
  meaningfulAttendance,
  parseEtlabDate,
  relativeTime,
} from '../src/lib/format.ts';

test('attendanceStats reports zero for a subject without classes', () => {
  assert.deepEqual(attendanceStats(0, 0, 75), {
    percentage: 0,
    canBunk: 0,
    requiredToRecover: 0,
    isSafe: false,
  });
});

test('attendanceStats allows a skip while staying above target', () => {
  assert.deepEqual(attendanceStats(31, 40, 75), {
    percentage: 77.5,
    canBunk: 1,
    requiredToRecover: 0,
    isSafe: true,
  });
});

test('attendanceStats stays safe exactly on the target line', () => {
  assert.deepEqual(attendanceStats(30, 40, 75), {
    percentage: 75,
    canBunk: 0,
    requiredToRecover: 0,
    isSafe: true,
  });
});

test('attendanceStats calculates the classes needed to recover', () => {
  assert.deepEqual(attendanceStats(29, 40, 75), {
    percentage: 72.5,
    canBunk: 0,
    requiredToRecover: 4,
    isSafe: false,
  });
});

test('attendanceStats rejects non-finite input', () => {
  assert.deepEqual(attendanceStats(Number.NaN, 10, 75), {
    percentage: 0,
    canBunk: 0,
    requiredToRecover: 0,
    isSafe: false,
  });
});

test('parseEtlabDate accepts the portal date formats', () => {
  const slash = parseEtlabDate('21-10-2026');
  assert.ok(slash);
  assert.equal(slash.getFullYear(), 2026);
  assert.equal(slash.getMonth(), 9);
  assert.equal(slash.getDate(), 21);

  const iso = parseEtlabDate('2026-10-21 10:30:00');
  assert.ok(iso);
  assert.equal(iso.getFullYear(), 2026);
  assert.equal(iso.getMonth(), 9);
  assert.equal(iso.getDate(), 21);
});

test('parseEtlabDate rejects empty and malformed values', () => {
  assert.equal(parseEtlabDate(''), null);
  assert.equal(parseEtlabDate('not-a-date'), null);
  assert.equal(parseEtlabDate(null), null);
  assert.equal(parseEtlabDate(123), null);
});

test('meaningfulAttendance drops placeholder statuses', () => {
  assert.equal(meaningfulAttendance('N/A'), undefined);
  assert.equal(meaningfulAttendance(' n.a. '), undefined);
  assert.equal(meaningfulAttendance('Present'), 'Present');
  assert.equal(meaningfulAttendance(''), undefined);
  assert.equal(meaningfulAttendance(null), undefined);
});

test('relativeTime does not call a future date ago', () => {
  const future = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
  const past = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

  assert.match(relativeTime(future), /^in /);
  assert.match(relativeTime(past), /ago$/);
});

test('initialTimetableDate keeps the current day but skips a Sunday', () => {
  const wednesday = new Date(2026, 9, 21, 10, 0, 0);
  assert.equal(initialTimetableDate(wednesday).getTime(), wednesday.getTime());

  const sunday = new Date(2026, 9, 25, 10, 0, 0);
  const monday = initialTimetableDate(sunday);
  assert.equal(monday.getFullYear(), 2026);
  assert.equal(monday.getMonth(), 9);
  assert.equal(monday.getDate(), 26);
  assert.equal(monday.getDay(), 1);
});
