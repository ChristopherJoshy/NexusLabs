/**
 * Wire types for the Etlab mobile API.
 *
 * Field names mirror the server payloads exactly (they are not normalised
 * here) so that a malformed response is easy to spot against the original
 * app's behaviour. Normalisation happens in `etlab.ts`.
 */

export type College = {
  clgId: number;
  base_url: string;
  regUrl: string;
  clgName: string;
};

export type LoginResponse = {
  login: boolean;
  error?: string;
  accessToken?: string;
  userType?: string;
  hostel?: number;
  hostelStatus?: string;
  profileName?: string;
  academicYear?: string;
  univ?: string;
  photoUrl?: string;
  semName?: string;
  semId?: string;
  course?: string;
  username?: string;
  password?: string;
  startYear?: number;
  endYear?: number;
  batchId?: string;
  isktu?: boolean;
  logoutStatus?: string;
};

export type Session = {
  baseUrl: string;
  token: string | null;
  college: College;
  profile: LoginResponse;
};

export type Notice = {
  heading?: string;
  content: string;
  createBy?: string;
  createdTime?: string;
  document?: string;
};

export type TimetablePeriod = {
  date?: string;
  day?: string;
  hour?: number;
  subject?: string;
  timeperiod?: string;
  type?: string;
  attendance_status?: string;
  dutyleave_status?: string;
  sub_id?: string;
  batch?: string;
  batch_id?: string;
  link?: string;
  status?: boolean;
  covered_topics?: string[];
};

export type TimetableDay = {
  date: string;
  day: string;
  periods: TimetablePeriod[];
};

/** The dashboard returns weekly timetable buckets: timetable[week][day]. */
export type TimetableWeek = TimetableDay[];

export type Dashboard = {
  login: boolean;
  error?: string;
  _etag?: string;
  notices?: Notice[];
  timetable?: TimetableWeek[];
  attendance_forthemonth?: string;
  attendance_forthesem?: string;
  course?: string;
  curnt_sem?: string;
  rollNo?: string;
  semId?: string;
  batchId?: string;
  studentId?: string;
  usertype?: string;
  dueNew?: string;
  due_pending?: boolean;
  feeStatus?: boolean;
  feeEngnrStatus?: boolean;
  hostel?: number;
  hostelStatus?: string;
  hostel_partial?: boolean;
  transport_partial?: boolean;
  academic_partial?: boolean;
  semReg?: boolean;
  isStudentLeave?: boolean;
  infoMsg?: string;
  passwordChanged?: boolean;
  surveyStatus?: boolean;
  surveyMessage?: string;
  clgVision?: string;
  clgMission?: string;
  deptVision?: string;
  deptMission?: string;
  liveTvLink?: string;
  liveTvType?: string;
};

export type SubjectAttendance = {
  subject: string;
  class_attended?: string;
  total_classes?: string;
  percentage?: string;
  percentage_subject?: string;
  percentage_dutyleave?: string;
  total_dutyleave?: string;
  total_subject?: string;
  credit_percent?: string;
  credit_total?: string;
};

export type AttendanceResponse = {
  login: boolean;
  error?: string;
  _etag?: string;
  subjects?: SubjectAttendance[];
  total_credit?: string;
  total_percent?: string;
};

export type Assignment = {
  id: string;
  title: string;
  subject: string;
  details?: string;
  issueDate?: string;
  lastDate?: string;
  status?: string;
  upload: boolean;
  uploadedFile?: string;
  link?: string;
  url?: string;
  semester?: string;
  canDownload?: boolean;
  canSubmit?: boolean;
};

export type AssignmentResponse = {
  login: boolean;
  error?: string;
  assignments?: Assignment[];
  submit_by_link?: boolean;
};

export type NoticeResponse = {
  login: boolean;
  error?: string;
  _etag?: string;
  notice?: Notice[];
};

export type TimetableResponse = {
  login: boolean;
  error?: string;
  _etag?: string;
  timetable?: {
    date: string;
    day: string;
    sub: TimetablePeriod[];
  }[];
  semester_start_date?: string;
  semester_end_date?: string;
};

export type InternalMark = {
  subject: string;
  maxMark: string;
  obtainMark: string;
};

/** `app/resultinternal` returns a bare JSON array, not an envelope. */
export type InternalMarkResponse = InternalMark[];

export type SeriesExamFile = {
  doc?: string;
  path?: string;
};

/** One exam in the `seriesExams` list; the portal does not attach marks here. */
export type SeriesExam = {
  id?: string;
  subject?: string;
  title?: string;
  semester?: string;
  startTime?: string;
  finishTime?: string;
  status?: string;
  canDownload?: boolean;
  canSubmit?: boolean;
  files?: SeriesExamFile[];
  uploadedFile?: string;
};

export type SeriesExamResponse = {
  login: boolean;
  error?: string;
  seriesExams?: SeriesExam[];
};

/** Normalized internal-mark record; values remain as returned by the portal. */
export type AcademicRecord = {
  id: string;
  subject?: string;
  title?: string;
  score?: string;
  maximum?: string;
};

export type Semester = {
  id: string;
  name?: string;
};

export type UniversitySummary = {
  cgpa?: string;
  credit?: string;
  passStatus?: string;
  sgpa?: string;
  totalInternal?: string;
};

export type UniversitySubject = {
  id: string;
  subject?: string;
  status?: string;
};

export type UniversityExamSubject = {
  id: string;
  attendance?: string;
  credits?: string;
  internalMark?: string;
  status?: string;
  subject?: string;
  universityMark?: string;
};

export type UniversityExam = {
  id: string;
  name?: string;
  subjects: UniversityExamSubject[];
};

export type UniversityResult = {
  summary?: UniversitySummary;
  subjects: UniversitySubject[];
  exams: UniversityExam[];
};

export type ResultCategory =
  | 'internal'
  | 'assignment'
  | 'moduleTest'
  | 'seasonal'
  | 'selfStudy'
  | 'tutorial'
  | 'series'
  | 'university';

export type ResultData =
  | { kind: 'marks'; items: AcademicRecord[] }
  | { kind: 'series'; items: SeriesExam[] }
  | { kind: 'university'; result: UniversityResult };

export type FeeRecord = {
  id: string;
  label?: string;
  amount?: string;
  dueDate?: string;
  status?: string;
  receipt?: string;
};

export type LeaveRecord = {
  id: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  reason?: string;
};

export type StudyMaterial = {
  id: string;
  title?: string;
  subject?: string;
  date?: string;
  url?: string;
};

export type ApiErrorKind =
  | 'network'
  | 'timeout'
  | 'http'
  | 'auth'
  | 'server'
  | 'parse'
  | 'unknown';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly cause?: unknown;

  constructor(kind: ApiErrorKind, message: string, status?: number, cause?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.cause = cause;
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}
