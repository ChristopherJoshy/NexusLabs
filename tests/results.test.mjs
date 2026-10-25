import assert from 'node:assert/strict';
import test from 'node:test';

import { apiRequest } from '../src/lib/api/client.ts';
import { normalizeInternalMarks, normalizeSeriesExams } from '../src/lib/api/results.ts';
import { ApiError } from '../src/lib/api/types.ts';

const SJCET_BASE = 'https://sjcetpalai.etlab.in/androidapp/';

test('normalizeInternalMarks reads the bare resultinternal array', () => {
  const records = normalizeInternalMarks([
    { subject: 'Mathematics', obtainMark: '42', maxMark: '50' },
    { subject: 'Physics', obtainMark: '0', maxMark: '25' },
  ]);

  assert.deepEqual(records, [
    { id: 'internal-0', subject: 'Mathematics', score: '42', maximum: '50' },
    { id: 'internal-1', subject: 'Physics', score: '0', maximum: '25' },
  ]);
});

test('normalizeInternalMarks tolerates a data array without inventing marks', () => {
  const records = normalizeInternalMarks({
    data: [{ subject: 'Chemistry', maxMark: '20' }],
  });

  assert.deepEqual(records, [
    { id: 'internal-0', subject: 'Chemistry', score: undefined, maximum: '20' },
  ]);
});

test('normalizeSeriesExams reads seriesExams and keeps exams separate from marks', () => {
  const records = normalizeSeriesExams({
    login: true,
    seriesExams: [
      {
        id: '12',
        subject: 'Data Structures',
        title: 'Series Exam 1',
        startTime: '2026-03-12 09:00:00',
        finishTime: '2026-03-12 11:00:00',
        status: 'Completed',
        canDownload: true,
        files: [{ doc: 'Question paper', path: 'uploads/q.pdf' }],
      },
    ],
  });

  assert.equal(records.length, 1);
  assert.equal(records[0].id, '12');
  assert.equal(records[0].subject, 'Data Structures');
  assert.equal(records[0].title, 'Series Exam 1');
  assert.equal(records[0].status, 'Completed');
  assert.equal(records[0].canDownload, true);
  assert.equal('score' in records[0], false);
  assert.deepEqual(records[0].files, [{ doc: 'Question paper', path: 'uploads/q.pdf' }]);
});

test('result normalizers keep unknown shapes empty', () => {
  assert.deepEqual(normalizeInternalMarks({ login: true }), []);
  assert.deepEqual(normalizeSeriesExams({ login: true, seriesExams: 'none' }), []);
});

test('apiRequest accepts a bare array only when allowArray is set', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify([{ subject: 'Mathematics' }]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  try {
    const payload = await apiRequest({
      baseUrl: SJCET_BASE,
      path: 'app/resultinternal',
      token: 'test-token',
      allowArray: true,
    });
    assert.deepEqual(payload, [{ subject: 'Mathematics' }]);

    await assert.rejects(
      apiRequest({
        baseUrl: SJCET_BASE,
        path: 'app/resultinternal',
        token: 'test-token',
      }),
      (error) => error instanceof ApiError && error.kind === 'parse',
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
