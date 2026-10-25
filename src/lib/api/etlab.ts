import { format } from 'date-fns';

import { resolveHttpUrl } from '@/lib/url';
import { apiRequest, normalizeBaseUrl } from './client';
import { ENDPOINTS, SJCET_BASE_URL, SJCET_COLLEGE } from './endpoints';
import { asText, firstText, rowsFrom, type JsonRecord } from './parse.ts';
import { normalizeInternalMarks, normalizeSeriesExams } from './results.ts';
import type {
  Assignment,
  AssignmentResponse,
  AcademicRecord,
  AttendanceResponse,
  Dashboard,
  FeeRecord,
  LoginResponse,
  LeaveRecord,
  Notice,
  NoticeResponse,
  SeriesExam,
  Session,
  SubjectAttendance,
  TimetableDay,
  TimetablePeriod,
  TimetableResponse,
  StudyMaterial,
} from './types';
import { ApiError } from './types';

export type LoginCredentials = {
  username: string;
  password: string;
};

type AuthenticatedLoginResponse = LoginResponse & { login: true; accessToken: string };

function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (value === 1 || value === '1' || (typeof value === 'string' && value.trim().toLowerCase() === 'true')) return true;
  if (value === 0 || value === '0' || (typeof value === 'string' && value.trim().toLowerCase() === 'false')) return false;
  return undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

/** Map the APK's Gson wire names to the app profile before validation/storage. */
function normalizeLoginResponse(wire: Record<string, unknown>): LoginResponse {
  return {
    login: asBoolean(wire.login) ?? false,
    error: asText(wire.error),
    accessToken: asText(wire.access_token) ?? asText(wire.accessToken),
    userType: asText(wire.user_type) ?? asText(wire.userType),
    hostel: asNumber(wire.hostel),
    hostelStatus: asText(wire.hostel_status) ?? asText(wire.hostelStatus),
    profileName: asText(wire.profile_name) ?? asText(wire.profileName),
    academicYear: asText(wire.academic_year) ?? asText(wire.academicYear),
    univ: asText(wire.univ),
    photoUrl: asText(wire.url) ?? asText(wire.photoUrl),
    semName: asText(wire.sem_name) ?? asText(wire.semName),
    semId: asText(wire.sem_id) ?? asText(wire.semId),
    course: asText(wire.course),
    username: asText(wire.uname) ?? asText(wire.username),
    password: asText(wire.password),
    startYear: asNumber(wire.start_year) ?? asNumber(wire.startYear),
    endYear: asNumber(wire.end_year) ?? asNumber(wire.endYear),
    batchId: asText(wire.batch_id) ?? asText(wire.batchId),
    isktu: asBoolean(wire.isktu),
    logoutStatus: asText(wire.logout_status) ?? asText(wire.logoutStatus),
  };
}

export async function login(credentials: LoginCredentials): Promise<Session> {
  const baseUrl = normalizeBaseUrl(SJCET_BASE_URL);
  const requestWithMode = async (hostel: '0' | '1'): Promise<AuthenticatedLoginResponse> => {
    const wire = await apiRequest<Record<string, unknown>>({
      baseUrl,
      path: ENDPOINTS.login,
      method: 'POST',
      anonymous: true,
      body: {
        username: credentials.username.trim(),
        password: credentials.password,
        // The legacy mobile endpoint requires this even though the current portal
        // sign-in has no selector. Keep it internal and detect the account mode.
        hostel,
      },
    });

    const response = normalizeLoginResponse(wire);
    const token = response.accessToken;
    if (response.login !== true || !token) {
      throw new ApiError(
        'auth',
        response.error || 'Those credentials did not work. Check your username and password.',
      );
    }
    return { ...response, login: true, accessToken: token };
  };

  let payload: AuthenticatedLoginResponse;
  try {
    payload = await requestWithMode('0');
  } catch (error) {
    // Only retry an explicit authentication rejection. Network and server errors
    // are not sign-in feedback and must not trigger a second credentials request.
    if (!(error instanceof ApiError) || error.kind !== 'auth') throw error;
    payload = await requestWithMode('1');
  }

  // Keep the token in exactly one place in memory. Some college servers echo
  // the password back in the profile payload; it must not travel further.
  const token = payload.accessToken;
  const profile: LoginResponse = { ...payload };
  delete profile.accessToken;
  delete profile.password;

  return {
    baseUrl,
    token,
    college: SJCET_COLLEGE,
    profile,
  };
}

export async function getDashboard(session: Session): Promise<Dashboard> {
  const payload = await apiRequest<Dashboard>({
    baseUrl: session.baseUrl,
    path: ENDPOINTS.dashboard,
    method: 'POST',
    token: session.token,
    etag: true,
    retries: 1,
  });
  return {
    ...payload,
    notices: Array.isArray(payload?.notices) ? payload.notices : undefined,
    timetable: Array.isArray(payload?.timetable) ? payload.timetable : undefined,
  };
}

export async function getAttendance(session: Session): Promise<AttendanceResponse> {
  const semId = session.profile.semId ?? '';
  const payload = await apiRequest<AttendanceResponse>({
    baseUrl: session.baseUrl,
    path: ENDPOINTS.attendanceBySubject,
    method: 'POST',
    token: session.token,
    body: { semId },
    etag: true,
    retries: 1,
  });
  const subjects = Array.isArray(payload?.subjects) ? payload.subjects : undefined;
  return {
    ...payload,
    subjects: subjects
      ?.filter(
        (subject): subject is SubjectAttendance =>
          Boolean(subject) && typeof subject === 'object' && !Array.isArray(subject),
      )
      .map((subject) => ({
        ...subject,
        subject: typeof subject.subject === 'string' ? subject.subject : '',
      })),
  };
}

export async function getAssignments(
  session: Session,
  filter: 'all' | 'pending' | 'submitted' = 'all',
): Promise<Assignment[]> {
  const response = await apiRequest<AssignmentResponse>({
    baseUrl: session.baseUrl,
    path: ENDPOINTS.assignments,
    method: 'POST',
    token: session.token,
    body: {
      filter,
      sem_id: session.profile.semId ?? '',
      sort: 'desc',
    },
    retries: 1,
  });
  const assignments = Array.isArray(response?.assignments) ? response.assignments : [];
  return assignments
    .filter(
      (assignment): assignment is Assignment =>
        Boolean(assignment) && typeof assignment === 'object' && !Array.isArray(assignment),
    )
    .map((assignment, index) => ({
      ...assignment,
      id:
        assignment.id === undefined || assignment.id === null
          ? `assignment-${index}`
          : String(assignment.id),
      title:
        typeof assignment.title === 'string' && assignment.title.trim()
          ? assignment.title
          : 'Untitled assignment',
      subject: typeof assignment.subject === 'string' ? assignment.subject : '',
      details: typeof assignment.details === 'string' ? assignment.details : undefined,
      issueDate: typeof assignment.issueDate === 'string' ? assignment.issueDate : undefined,
      lastDate: typeof assignment.lastDate === 'string' ? assignment.lastDate : undefined,
      status: typeof assignment.status === 'string' ? assignment.status : undefined,
      uploadedFile:
        typeof assignment.uploadedFile === 'string' ? assignment.uploadedFile : undefined,
      link: typeof assignment.link === 'string' ? assignment.link : undefined,
      url: typeof assignment.url === 'string' ? assignment.url : undefined,
      semester: typeof assignment.semester === 'string' ? assignment.semester : undefined,
    }));
}

export async function getTimetable(session: Session, month = format(new Date(), 'yyyy-MM')): Promise<TimetableDay[]> {
  const response = await apiRequest<TimetableResponse>({
    baseUrl: session.baseUrl,
    path: ENDPOINTS.timetable,
    method: 'POST',
    token: session.token,
    form: { month },
    etag: true,
    retries: 1,
  });

  const days = Array.isArray(response?.timetable) ? response.timetable : [];
  return days
    .filter((day) => Boolean(day) && typeof day === 'object' && !Array.isArray(day))
    .map((day) => ({
      date: typeof day.date === 'string' ? day.date : '',
      day: typeof day.day === 'string' ? day.day : '',
      periods: Array.isArray(day.sub)
        ? day.sub
            .filter(
              (period): period is TimetablePeriod =>
                Boolean(period) && typeof period === 'object' && !Array.isArray(period),
            )
            .map((period) => ({
              ...period,
              subject: typeof period.subject === 'string' ? period.subject : '',
              type: typeof period.type === 'string' ? period.type : undefined,
              timeperiod: typeof period.timeperiod === 'string' ? period.timeperiod : undefined,
              attendance_status:
                typeof period.attendance_status === 'string' ? period.attendance_status : '',
              dutyleave_status:
                typeof period.dutyleave_status === 'string' ? period.dutyleave_status : '',
            }))
        : [],
    }))
    .filter((day) => day.date || day.day)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getNotices(session: Session): Promise<Notice[]> {
  const response = await apiRequest<NoticeResponse>({
    baseUrl: session.baseUrl,
    path: ENDPOINTS.notices,
    method: 'POST',
    token: session.token,
    etag: true,
    retries: 1,
  });
  const notices = Array.isArray(response?.notice) ? response.notice : [];
  return notices
    .filter(
      (notice): notice is Notice =>
        Boolean(notice) && typeof notice === 'object' && !Array.isArray(notice),
    )
    .map((notice) => ({
      heading:
        typeof notice.heading === 'string' && notice.heading.trim()
          ? notice.heading
          : undefined,
      content: typeof notice.content === 'string' ? notice.content : '',
      createBy: typeof notice.createBy === 'string' ? notice.createBy : undefined,
      createdTime: typeof notice.createdTime === 'string' ? notice.createdTime : undefined,
      document: typeof notice.document === 'string' ? notice.document : undefined,
    }));
}

async function featurePayload(
  session: Session,
  path: string,
  body: unknown = {},
  allowArray = false,
): Promise<JsonRecord | JsonRecord[]> {
  const payload = await apiRequest<JsonRecord | JsonRecord[]>({
    baseUrl: session.baseUrl,
    path,
    method: 'POST',
    token: session.token,
    body,
    etag: true,
    allowArray,
    retries: 1,
  });
  return payload;
}

export async function getInternalResults(session: Session): Promise<AcademicRecord[]> {
  const payload = await featurePayload(
    session,
    ENDPOINTS.internalMarks,
    { semId: session.profile.semId ?? '' },
    true,
  );
  return normalizeInternalMarks(payload);
}

export async function getSeriesExams(session: Session): Promise<SeriesExam[]> {
  const payload = await featurePayload(session, ENDPOINTS.seriesExam, {
    semId: session.profile.semId ?? '',
  });
  return normalizeSeriesExams(payload);
}

export async function getFees(session: Session): Promise<FeeRecord[]> {
  const payload = await featurePayload(session, ENDPOINTS.fees);
  return rowsFrom(payload, ['fees', 'fee', 'academicfees', 'feeDetails', 'fee_details', 'dues', 'items']).map((row, index) => ({
    id: firstText(row, ['id', 'feeId', 'headId']) ?? `fee-${index}`,
    label: firstText(row, ['feeType', 'feeName', 'name', 'description', 'particular', 'title', 'head']),
    amount: firstText(row, ['amount', 'feeAmount', 'total', 'value', 'dueAmount', 'balance', 'pendingAmount']),
    dueDate: firstText(row, ['dueDate', 'lastDate', 'due_date', 'payBy']),
    status: firstText(row, ['status', 'feeStatus', 'paymentStatus']),
    receipt: firstText(row, ['receipt', 'receiptNo', 'receiptNumber']),
  }));
}

export async function getLeaveHistory(session: Session): Promise<LeaveRecord[]> {
  const payload = await featurePayload(session, ENDPOINTS.leaveList, { semId: session.profile.semId ?? '' });
  return rowsFrom(payload, ['leave', 'leaves', 'leaveList', 'leaveData', 'records', 'applications']).map((row, index) => ({
    id: firstText(row, ['id', 'leaveId', 'applicationId']) ?? `leave-${index}`,
    type: firstText(row, ['type', 'leaveType', 'name']),
    startDate: firstText(row, ['startDate', 'fromDate', 'dateFrom', 'start_date', 'from']),
    endDate: firstText(row, ['endDate', 'toDate', 'dateTo', 'end_date', 'to']),
    status: firstText(row, ['status', 'approvalStatus', 'leaveStatus']),
    reason: firstText(row, ['reason', 'description', 'remarks']),
  }));
}

export async function getStudyMaterials(session: Session): Promise<StudyMaterial[]> {
  const payload = await featurePayload(session, ENDPOINTS.studyMaterials, { semId: session.profile.semId ?? '' });
  return rowsFrom(payload, ['materials', 'material', 'studymaterials', 'studyMaterials', 'data', 'files']).map((row, index) => ({
    id: firstText(row, ['id', 'materialId', 'fileId']) ?? `material-${index}`,
    title: firstText(row, ['title', 'name', 'materialName', 'document', 'fileName', 'filename', 'topic']),
    subject: firstText(row, ['subject', 'subjectName', 'subName']),
    date: firstText(row, ['date', 'uploadDate', 'createdAt', 'createdTime']),
    url: firstText(row, ['url', 'file', 'link', 'path', 'documentUrl', 'downloadUrl']),
  }));
}

/** Normalise values the college server sometimes sends as numbers. */
export function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

export function toNumberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseFloat(value.replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function getPhotoUrl(session: Session): string | null {
  return resolveHttpUrl(session.baseUrl, session.profile.photoUrl);
}
