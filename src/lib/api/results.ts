import type {
  AcademicRecord,
  ResultCategory,
  Semester,
  SeriesExam,
  UniversityExam,
  UniversityExamSubject,
  UniversityResult,
  UniversitySubject,
  UniversitySummary,
} from './types.ts';
import { ENDPOINTS } from './endpoints.ts';
import { firstText, isJsonRecord, rowsFrom, type JsonRecord } from './parse.ts';

export type ResultRequest = {
  path: string;
  body?: Record<string, string>;
  form?: Record<string, string>;
  allowArray?: boolean;
};

/** Request contracts recovered from the shipped Android client. */
export function resultRequest(category: ResultCategory, semesterId: string): ResultRequest {
  const semesterBody = { semId: semesterId };
  switch (category) {
    case 'internal':
      return { path: ENDPOINTS.internalMarks, body: semesterBody, allowArray: true };
    case 'assignment':
      return { path: ENDPOINTS.assignmentResults, body: semesterBody, allowArray: true };
    case 'moduleTest':
      return { path: ENDPOINTS.moduleTestResults, body: semesterBody };
    case 'seasonal':
      return {
        path: ENDPOINTS.seasonalResults,
        body: { sem_id: semesterId, session: '1' },
        allowArray: true,
      };
    case 'selfStudy':
      return { path: ENDPOINTS.selfStudyResults, body: semesterBody, allowArray: true };
    case 'tutorial':
      return { path: ENDPOINTS.tutorialResults, form: { sem_id: semesterId } };
    case 'series':
      return { path: ENDPOINTS.seriesExam, body: semesterBody };
    case 'university':
      return { path: ENDPOINTS.universityResults, body: semesterBody };
  }
}

function normalizeMarkRows(
  payload: JsonRecord | JsonRecord[],
  idPrefix: string,
  rowKeys: string[],
): AcademicRecord[] {
  return rowsFrom(payload, rowKeys).map((row, index) => {
    const subject = firstText(row, ['subject', 'subjectName', 'subject_name', 'subName']);
    const title = firstText(row, ['title', 'name']);

    return {
      id: firstText(row, ['id', 'resultId', 'subjectId', 'subject_id']) ?? `${idPrefix}-${index}`,
      subject,
      ...(title && title !== subject ? { title } : {}),
      score: firstText(row, ['obtainMark', 'obtainedMark', 'mark', 'marks', 'score', 'obtained']),
      maximum: firstText(row, [
        'maxMark',
        'maximumMark',
        'max_marks',
        'totalMark',
        'maximum',
        'outOf',
      ]),
    };
  });
}

/** The internal endpoint returns a bare array of subject marks. */
export function normalizeInternalMarks(payload: JsonRecord | JsonRecord[]): AcademicRecord[] {
  return normalizeMarkRows(payload, 'internal', [
    'result',
    'results',
    'marks',
    'internal',
    'internalMarks',
  ]);
}

export function normalizeAssignmentResults(
  payload: JsonRecord | JsonRecord[],
): AcademicRecord[] {
  return normalizeMarkRows(payload, 'assignment-result', [
    'result',
    'results',
    'assignments',
    'assignment',
    'marks',
  ]);
}

export function normalizeModuleTestResults(
  payload: JsonRecord | JsonRecord[],
): AcademicRecord[] {
  return normalizeMarkRows(payload, 'module-test', [
    'moduleTest',
    'moduleTests',
    'result',
    'results',
  ]);
}

export function normalizeSeasonalResults(
  payload: JsonRecord | JsonRecord[],
): AcademicRecord[] {
  return normalizeMarkRows(payload, 'seasonal', [
    'result',
    'results',
    'seasonal',
    'sessional',
    'marks',
  ]);
}

export function normalizeSelfStudyResults(
  payload: JsonRecord | JsonRecord[],
): AcademicRecord[] {
  return normalizeMarkRows(payload, 'self-study', [
    'result',
    'results',
    'selfStudy',
    'selfstudy',
    'marks',
  ]);
}

export function normalizeTutorialResults(
  payload: JsonRecord | JsonRecord[],
): AcademicRecord[] {
  return normalizeMarkRows(payload, 'tutorial', [
    'tutorials',
    'tutorial',
    'result',
    'results',
    'marks',
  ]);
}

export function normalizeSemesters(payload: JsonRecord | JsonRecord[]): Semester[] {
  const unique = new Map<string, Semester>();
  for (const row of rowsFrom(payload, ['semesters', 'semesterList', 'semestersList', 'items'])) {
    const id = firstText(row, ['id', 'semId', 'sem_id']);
    if (!id || unique.has(id)) continue;
    unique.set(id, {
      id,
      name: firstText(row, ['name', 'semName', 'sem_name', 'semester']),
    });
  }
  return [...unique.values()];
}

function normalizeUniversitySummary(value: unknown): UniversitySummary | undefined {
  if (!isJsonRecord(value)) return undefined;
  const summary: UniversitySummary = {
    cgpa: firstText(value, ['cgpa']),
    credit: firstText(value, ['credit', 'credits']),
    passStatus: firstText(value, ['passStatus', 'pass_status', 'passStatusText']),
    sgpa: firstText(value, ['sgpa']),
    totalInternal: firstText(value, ['totalInternal', 'total_internal']),
  };
  return Object.values(summary).some(Boolean) ? summary : undefined;
}

function normalizeUniversitySubjects(value: unknown): UniversitySubject[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isJsonRecord).map((row, index) => ({
    id: firstText(row, ['id', 'subjectId', 'subject_id']) ?? `university-subject-${index}`,
    subject: firstText(row, ['subject', 'subjectName', 'name']),
    status: firstText(row, ['status', 'passStatus', 'pass_status']),
  }));
}

function normalizeUniversityExamSubject(
  row: JsonRecord,
  examIndex: number,
  subjectIndex: number,
): UniversityExamSubject {
  return {
    id:
      firstText(row, ['id', 'subjectId', 'subject_id']) ??
      `university-exam-${examIndex}-subject-${subjectIndex}`,
    attendance: firstText(row, ['attendance']),
    credits: firstText(row, ['credits', 'credit']),
    internalMark: firstText(row, ['internalMark', 'internal_mark']),
    status: firstText(row, ['status', 'passStatus', 'pass_status']),
    subject: firstText(row, ['subject', 'subjectName', 'name']),
    universityMark: firstText(row, ['univMark', 'universityMark', 'univ_mark']),
  };
}

function normalizeUniversityExams(value: unknown): UniversityExam[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isJsonRecord).map((row, index) => ({
    id: firstText(row, ['id', 'examId', 'exam_id']) ?? `university-exam-${index}`,
    name: firstText(row, ['examName', 'exam_name', 'name']),
    subjects: Array.isArray(row.subjects)
      ? row.subjects.filter(isJsonRecord).map((subject, subjectIndex) =>
          normalizeUniversityExamSubject(subject, index, subjectIndex),
        )
      : [],
  }));
}

/** University results contain a summary, overall subjects, and exam-wise rows. */
export function normalizeUniversityResult(payload: JsonRecord): UniversityResult {
  return {
    summary: normalizeUniversitySummary(payload.details),
    subjects: normalizeUniversitySubjects(payload.subjects),
    exams: normalizeUniversityExams(payload.univExams),
  };
}

/** Series entries are scheduled/completed exams, not mark records. */
export function normalizeSeriesExams(payload: JsonRecord | JsonRecord[]): SeriesExam[] {
  return rowsFrom(payload, ['seriesExams', 'seriesExam', 'exams', 'result', 'results']).map(
    (row, index) => ({
      id: firstText(row, ['id', 'examId']) ?? `series-${index}`,
      subject: firstText(row, ['subject', 'subjectName', 'subject_name', 'subName']),
      title: firstText(row, ['title', 'exam', 'examName', 'exam_name', 'name']),
      semester: firstText(row, ['semester', 'semName', 'sem']),
      startTime: firstText(row, ['startTime', 'start_time', 'start', 'date']),
      finishTime: firstText(row, ['finishTime', 'finish_time', 'finish', 'endTime']),
      status: firstText(row, ['status', 'examStatus', 'exam_status']),
      canDownload: row.canDownload === true,
      canSubmit: row.canSubmit === true,
      uploadedFile: firstText(row, ['uploadedFile', 'uploaded_file']),
      files: Array.isArray(row.files)
        ? row.files.filter(isJsonRecord).map((file) => ({
            doc: firstText(file, ['doc', 'name', 'title']),
            path: firstText(file, ['path', 'url', 'file']),
          }))
        : undefined,
    }),
  );
}
