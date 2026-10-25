import { useMutation, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

import {
  getAssignments,
  getAttendance,
  getDashboard,
  getFees,
  getInternalResults,
  getLeaveHistory,
  getNotices,
  getSeriesExams,
  getStudyMaterials,
  getTimetable,
  login,
  type LoginCredentials,
} from '@/lib/api/etlab';
import { ApiError } from '@/lib/api/types';
import type { Assignment, Session } from '@/lib/api/types';
import { useSession } from '@/stores/auth';

const MINUTE = 60_000;

function isAuthFailure(error: unknown): boolean {
  return error instanceof ApiError && error.kind === 'auth';
}

/**
 * Cache by student identity as well as semester so another SJCET account on
 * the same device cannot be served the previous student's persisted data.
 */
function scope(session: Session) {
  return [
    session.baseUrl,
    session.profile.profileName?.trim() || '',
    session.profile.semId ?? '',
  ] as const;
}

export const queryKeys = {
  dashboard: (session: Session) => ['dashboard', ...scope(session)] as const,
  attendance: (session: Session) => ['attendance', ...scope(session)] as const,
  assignments: (session: Session) => ['assignments', ...scope(session)] as const,
  timetable: (session: Session, month: string) => ['timetable', ...scope(session), month] as const,
  notices: (session: Session) => ['notices', ...scope(session)] as const,
  internalResults: (session: Session) => ['internal-results', ...scope(session)] as const,
  seriesExams: (session: Session) => ['series-exams', ...scope(session)] as const,
  fees: (session: Session) => ['fees', ...scope(session)] as const,
  leave: (session: Session) => ['leave', ...scope(session)] as const,
  materials: (session: Session) => ['materials', ...scope(session)] as const,
};

export function useLogin() {
  return useMutation({
    mutationFn: ({ credentials }: { credentials: LoginCredentials }) => login(credentials),
  });
}

export function useDashboard() {
  const session = useSession();
  return useQuery({
    queryKey: queryKeys.dashboard(session),
    queryFn: () => getDashboard(session),
    staleTime: MINUTE,
    retry: (count, error) => !isAuthFailure(error) && count < 1,
  });
}

export function useAttendance() {
  const session = useSession();
  return useQuery({
    queryKey: queryKeys.attendance(session),
    queryFn: () => getAttendance(session),
    staleTime: 2 * MINUTE,
    retry: (count, error) => !isAuthFailure(error) && count < 1,
  });
}

export function useAssignments() {
  const session = useSession();
  return useQuery({
    queryKey: queryKeys.assignments(session),
    queryFn: () => getAssignments(session),
    staleTime: MINUTE,
    retry: (count, error) => !isAuthFailure(error) && count < 1,
  });
}

export function useTimetable(
  month = format(new Date(), 'yyyy-MM'),
  options: { enabled?: boolean } = {},
) {
  const session = useSession();
  return useQuery({
    queryKey: queryKeys.timetable(session, month),
    queryFn: () => getTimetable(session, month),
    enabled: options.enabled ?? true,
    staleTime: 10 * MINUTE,
    retry: (count, error) => !isAuthFailure(error) && count < 1,
  });
}

export function useNotices() {
  const session = useSession();
  return useQuery({
    queryKey: queryKeys.notices(session),
    queryFn: () => getNotices(session),
    staleTime: 5 * MINUTE,
    retry: (count, error) => !isAuthFailure(error) && count < 1,
  });
}

export function useInternalResults() {
  const session = useSession();
  return useQuery({
    queryKey: queryKeys.internalResults(session),
    queryFn: () => getInternalResults(session),
    staleTime: 10 * MINUTE,
    retry: (count, error) => !isAuthFailure(error) && count < 1,
  });
}

export function useSeriesExams() {
  const session = useSession();
  return useQuery({
    queryKey: queryKeys.seriesExams(session),
    queryFn: () => getSeriesExams(session),
    staleTime: 10 * MINUTE,
    retry: (count, error) => !isAuthFailure(error) && count < 1,
  });
}

export function useFees() {
  const session = useSession();
  return useQuery({
    queryKey: queryKeys.fees(session),
    queryFn: () => getFees(session),
    staleTime: 30 * MINUTE,
    retry: (count, error) => !isAuthFailure(error) && count < 1,
  });
}

export function useLeaveHistory() {
  const session = useSession();
  return useQuery({
    queryKey: queryKeys.leave(session),
    queryFn: () => getLeaveHistory(session),
    staleTime: 10 * MINUTE,
    retry: (count, error) => !isAuthFailure(error) && count < 1,
  });
}

export function useStudyMaterials() {
  const session = useSession();
  return useQuery({
    queryKey: queryKeys.materials(session),
    queryFn: () => getStudyMaterials(session),
    staleTime: 30 * MINUTE,
    retry: (count, error) => !isAuthFailure(error) && count < 1,
  });
}

export function isSubmitted(assignment: Pick<Assignment, 'status' | 'uploadedFile'>): boolean {
  return (
    assignment.status?.trim().toLowerCase() === 'submitted' ||
    Boolean(assignment.uploadedFile?.trim())
  );
}

export function splitAssignments(assignments: Assignment[]): {
  pending: Assignment[];
  submitted: Assignment[];
} {
  return {
    pending: assignments.filter((assignment) => !isSubmitted(assignment)),
    submitted: assignments.filter(isSubmitted),
  };
}
