import assert from 'node:assert/strict';
import test from 'node:test';

import { apiRequest } from '../src/lib/api/client.ts';
import {
  normalizeAssignmentResults,
  normalizeInternalMarks,
  normalizeModuleTestResults,
  normalizeSeasonalResults,
  normalizeSelfStudyResults,
  normalizeSemesters,
  normalizeSeriesExams,
  normalizeTutorialResults,
  normalizeUniversityResult,
  resultRequest,
} from '../src/lib/api/results.ts';
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

test('semester rows normalize IDs and remove duplicate entries', () => {
  assert.deepEqual(
    normalizeSemesters([
      { id: 5, name: 'Semester 5' },
      { sem_id: '4', sem_name: 'Semester 4' },
      { id: '5', name: 'Duplicate' },
      { name: 'Missing ID' },
    ]),
    [
      { id: '5', name: 'Semester 5' },
      { id: '4', name: 'Semester 4' },
    ],
  );
});

test('assignment and module test results retain their own mark fields', () => {
  assert.deepEqual(
    normalizeAssignmentResults([
      { subject: 'Wire subject', name: 'Wire assignment', obtainMark: '8', maxMark: '10' },
    ]),
    [
      {
        id: 'assignment-result-0',
        subject: 'Wire subject',
        title: 'Wire assignment',
        score: '8',
        maximum: '10',
      },
    ],
  );
  assert.deepEqual(
    normalizeModuleTestResults({ login: true, moduleTest: [{ subject: 'Wire subject', mark: 7 }] }),
    [
      {
        id: 'module-test-0',
        subject: 'Wire subject',
        score: '7',
        maximum: undefined,
      },
    ],
  );
});

test('seasonal, self study, and tutorial marks use their response models', () => {
  assert.deepEqual(
    normalizeSeasonalResults([{ subject: 'Wire subject', obtainMark: 12, maxMark: 20 }]),
    [
      {
        id: 'seasonal-0',
        subject: 'Wire subject',
        score: '12',
        maximum: '20',
      },
    ],
  );
  assert.deepEqual(
    normalizeSelfStudyResults([{ subject: 'Wire subject', name: 'Wire activity', obtainMark: '4' }]),
    [
      {
        id: 'self-study-0',
        subject: 'Wire subject',
        title: 'Wire activity',
        score: '4',
        maximum: undefined,
      },
    ],
  );
  assert.deepEqual(
    normalizeTutorialResults({
      login: true,
      tutorials: [{ subject: 'Wire subject', title: 'Wire tutorial', mark: '3' }],
    }),
    [
      {
        id: 'tutorial-0',
        subject: 'Wire subject',
        title: 'Wire tutorial',
        score: '3',
        maximum: undefined,
      },
    ],
  );
});

test('university results retain summary, subjects, and exam-wise subject details', () => {
  assert.deepEqual(
    normalizeUniversityResult({
      details: { cgpa: '8.2', sgpa: '8.4', credit: '20', passStatus: 'Passed' },
      subjects: [{ subject: 'Wire subject', status: 'Passed' }],
      univExams: [
        {
          examName: 'Wire examination',
          subjects: [
            {
              subject: 'Wire subject',
              attendance: '92',
              credits: '4',
              internalMark: '18',
              status: 'Passed',
              univMark: '62',
            },
          ],
        },
      ],
    }),
    {
      summary: {
        cgpa: '8.2',
        sgpa: '8.4',
        credit: '20',
        passStatus: 'Passed',
        totalInternal: undefined,
      },
      subjects: [{ id: 'university-subject-0', subject: 'Wire subject', status: 'Passed' }],
      exams: [
        {
          id: 'university-exam-0',
          name: 'Wire examination',
          subjects: [
            {
              id: 'university-exam-0-subject-0',
              attendance: '92',
              credits: '4',
              internalMark: '18',
              status: 'Passed',
              subject: 'Wire subject',
              universityMark: '62',
            },
          ],
        },
      ],
    },
  );
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

test('result categories keep their semester-scoped request contracts', () => {
  const semesterId = 'selected-semester';
  assert.deepEqual(
    [
      'internal',
      'assignment',
      'moduleTest',
      'seasonal',
      'selfStudy',
      'tutorial',
      'series',
      'university',
    ].map((category) => resultRequest(category, semesterId)),
    [
      { path: 'app/resultinternal', body: { semId: semesterId }, allowArray: true },
      { path: 'app/resultassignment', body: { semId: semesterId }, allowArray: true },
      { path: 'app/resultmoduletest', body: { semId: semesterId } },
      {
        path: 'app/resultsessional',
        body: { sem_id: semesterId, session: '1' },
        allowArray: true,
      },
      { path: 'app/resultselfstudy', body: { semId: semesterId }, allowArray: true },
      { path: 'app/resulttutorials', form: { sem_id: semesterId } },
      { path: 'app/seriesexam', body: { semId: semesterId } },
      { path: 'app/resultsuniversity', body: { semId: semesterId } },
    ],
  );
});
