import type { AcademicRecord, SeriesExam } from './types.ts';
import { firstText, isJsonRecord, rowsFrom, type JsonRecord } from './parse.ts';

/**
 * `app/resultinternal` returns a bare array of `{ subject, obtainMark, maxMark }`.
 * Older object envelopes are still tolerated, but no mark is invented.
 */
export function normalizeInternalMarks(
  payload: JsonRecord | JsonRecord[],
): AcademicRecord[] {
  return rowsFrom(payload, ['result', 'results', 'marks', 'internal', 'internalMarks']).map(
    (row, index) => ({
      id: firstText(row, ['id', 'resultId', 'subjectId']) ?? `internal-${index}`,
      subject: firstText(row, ['subject', 'subjectName', 'subject_name', 'subName', 'name']),
      score: firstText(row, ['obtainMark', 'obtainedMark', 'mark', 'marks', 'score', 'obtained']),
      maximum: firstText(row, [
        'maxMark',
        'maximumMark',
        'max_marks',
        'totalMark',
        'maximum',
        'outOf',
      ]),
    }),
  );
}

/**
 * `app/seriesexam` returns `{ login, seriesExams: Exam[], error }`. An Exam is
 * a scheduled or completed series exam, not a mark, so no score is mapped.
 */
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
