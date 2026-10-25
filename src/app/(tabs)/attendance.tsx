import { useMemo, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { ChartPie, CircleCheck, CircleDashed, TriangleAlert } from 'lucide-react-native';

import {
  AppText,
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Reveal,
  Screen,
  ScreenHeader,
  Segmented,
  Skeleton,
} from '@/components/ui';
import { useAttendance } from '@/hooks/use-etlab';
import { toNumberOrNull } from '@/lib/api/etlab';
import type { SubjectAttendance } from '@/lib/api/types';
import { formatPercent } from '@/lib/format';
import { useSettings } from '@/stores/settings';
import { useTheme } from '@/theme';

type Filter = 'all' | 'below' | 'above';

function subjectState(subject: SubjectAttendance, target: number) {
  const percentage = toNumberOrNull(subject.percentage_dutyleave);
  const tone =
    percentage === null
      ? 'neutral'
      : percentage >= target
        ? 'success'
        : percentage >= target - 5
          ? 'warning'
          : 'danger';
  const label =
    percentage === null
      ? 'Not reported'
      : percentage >= target
        ? 'On track'
        : percentage >= target - 5
          ? 'Watch'
          : 'Low';
  return { percentage, tone, label } as const;
}

function SubjectRow({
  subject,
  target,
  isLast,
}: {
  subject: SubjectAttendance;
  target: number;
  isLast: boolean;
}) {
  const theme = useTheme();
  const state = subjectState(subject, target);
  const dutyLeave = toNumberOrNull(subject.total_dutyleave);

  return (
    <View
      accessibilityLabel={`${subject.subject || 'Subject'}, ${state.label}, ${
        state.percentage === null
          ? 'duty-leave adjusted attendance unavailable'
          : `${formatPercent(state.percentage)} duty-leave adjusted attendance`
      }${dutyLeave === null ? '' : `, ${dutyLeave} duty leave`}`}
      accessible
      style={{
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        gap: 7,
        borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: theme.spacing.sm }}>
        <AppText numberOfLines={1} style={{ flex: 1 }} variant="bodySemibold">
          {subject.subject || 'Subject'}
        </AppText>
        <AppText
          style={{
            fontSize: 22,
            lineHeight: 24,
            fontFamily: theme.fonts.extrabold,
            letterSpacing: -0.8,
            fontVariant: ['tabular-nums'],
          }}>
          {state.percentage === null ? '—' : formatPercent(state.percentage)}
        </AppText>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
        {dutyLeave !== null ? (
          <AppText style={{ flex: 1 }} variant="caption" color={theme.colors.textMuted}>
            {dutyLeave} duty leave
          </AppText>
        ) : null}
        <Badge dot label={state.label} tone={state.tone} />
      </View>
    </View>
  );
}

export default function AttendanceScreen() {
  const theme = useTheme();
  const target = useSettings((state) => state.attendanceTarget);
  const { data, isLoading, isError, error, refetch, isRefetching } = useAttendance();
  const subjects = useMemo(() => data?.subjects ?? [], [data?.subjects]);
  const [filter, setFilter] = useState<Filter>('all');

  const summary = useMemo(() => {
    let below = 0;
    let above = 0;
    for (const subject of subjects) {
      const state = subjectState(subject, target);
      if (state.percentage !== null && state.percentage < target) below += 1;
      if (state.percentage !== null && state.percentage >= target) above += 1;
    }
    return { below, above };
  }, [subjects, target]);

  const visible = useMemo(() => {
    if (filter === 'below') {
      return subjects.filter((subject) => {
        const state = subjectState(subject, target);
        return state.percentage !== null && state.percentage < target;
      });
    }
    if (filter === 'above') {
      return subjects.filter((subject) => {
        const state = subjectState(subject, target);
        return state.percentage !== null && state.percentage >= target;
      });
    }
    return subjects;
  }, [filter, subjects, target]);

  return (
    <Screen
      refreshControl={
        <RefreshControl
          colors={[theme.colors.accent]}
          onRefresh={() => void refetch()}
          refreshing={isRefetching}
          tintColor={theme.colors.accent}
        />
      }
      scroll>
      <ScreenHeader
        right={<Badge dot label={`${target}% target`} tone="accent" />}
        title="Attendance"
      />

      {isLoading ? (
        <View style={{ gap: theme.spacing.lg }}>
          <Skeleton height={42} radius={theme.radii.sm} />
          <Skeleton height={320} radius={theme.radii.md} />
        </View>
      ) : isError && !data ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : subjects.length === 0 ? (
        <EmptyState
          description={
            data?.subjects === undefined
              ? 'Subject attendance is unavailable for this semester.'
              : 'Subject attendance will appear here when Etlab reports it.'
          }
          icon={ChartPie}
          title="No attendance to show"
        />
      ) : (
        <View style={{ gap: theme.spacing.lg }}>
          <Reveal>
            <View style={{ gap: theme.spacing.md }}>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {subjects.map((subject, index) => {
                  const state = subjectState(subject, target);
                  return (
                    <View
                      key={`${subject.subject}-${index}`}
                      style={{
                        flex: 1,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor:
                          state.tone === 'success'
                            ? theme.colors.success
                            : state.tone === 'warning'
                              ? theme.colors.warning
                              : state.tone === 'danger'
                                ? theme.colors.danger
                                : theme.colors.border,
                        opacity: state.tone === 'neutral' ? 0.55 : 1,
                      }}
                    />
                  );
                })}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                {summary.below === 0 ? (
                  <CircleCheck color={theme.colors.success} size={15} strokeWidth={2} />
                ) : (
                  <TriangleAlert color={theme.colors.warning} size={15} strokeWidth={2} />
                )}
                <AppText style={{ flex: 1 }} variant="caption" color={theme.colors.textSecondary}>
                  {summary.below} below target
                </AppText>
              </View>
            </View>
          </Reveal>

          <Segmented
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All', count: subjects.length },
              { value: 'below', label: 'Below', count: summary.below },
              { value: 'above', label: 'On track', count: summary.above },
            ]}
            value={filter}
          />

          <Reveal delay={60}>
            {visible.length === 0 ? (
              <EmptyState
                compact
                description={
                  filter === 'below'
                    ? 'No subject is below your personal target.'
                    : 'No subject has reached your target yet.'
                }
                icon={CircleDashed}
                title="Nothing in this view"
              />
            ) : (
              <Card padded={false} style={{ overflow: 'hidden' }}>
                {visible.map((subject, index) => (
                  <SubjectRow
                    isLast={index === visible.length - 1}
                    key={`${subject.subject}-${index}`}
                    subject={subject}
                    target={target}
                  />
                ))}
              </Card>
            )}
          </Reveal>
        </View>
      )}
    </Screen>
  );
}
