import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { addDays, format, isSameDay, startOfWeek } from 'date-fns';
import {
  Bell,
  CalendarClock,
  Clock3,
  Megaphone,
  Sparkles,
  TrendingUp,
} from 'lucide-react-native';

import {
  AnimatedNumber,
  AppText,
  AssignmentFeatureCard,
  Avatar,
  Badge,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  ProgressRing,
  Reveal,
  Screen,
  SectionHeader,
  Skeleton,
  TimelineRow,
  WeekStrip,
  type WeekStripDay,
} from '@/components/ui';
import {
  isSubmitted,
  useAssignments,
  useAttendance,
  useDashboard,
  useNotices,
  useTimetable,
} from '@/hooks/use-etlab';
import { getPhotoUrl, toNumberOrNull } from '@/lib/api/etlab';
import type { Assignment, TimetableDay, TimetablePeriod } from '@/lib/api/types';
import { syncAssignmentReminders } from '@/lib/notifications';
import {
  attendanceStats,
  formatPercent,
  greeting,
  initialTimetableDate,
  meaningfulAttendance,
  parseEtlabDate,
  relativeTime,
  weekdayShort,
} from '@/lib/format';
import { useSession } from '@/stores/auth';
import { useSettings, type HomeModule } from '@/stores/settings';
import { useTheme } from '@/theme';

function timeLabel(period: TimetablePeriod, index: number): string {
  return period.timeperiod?.split(/[–-]/)[0]?.trim() || (period.hour ? `P${period.hour}` : `P${index + 1}`);
}

function timeEndLabel(period: TimetablePeriod): string | undefined {
  const parts = period.timeperiod
    ?.split(/[–-]/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts && parts.length > 1 ? parts[1] : undefined;
}

function statusTone(value: string): 'success' | 'warning' | 'danger' | 'neutral' {
  const status = value.toLowerCase();
  if (status.includes('present')) return 'success';
  if (status.includes('duty') || status.includes('leave')) return 'warning';
  if (status.includes('absent')) return 'danger';
  return 'neutral';
}

function HeroStat({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <AppText variant="label" color={theme.colors.heroMuted}>
        {label}
      </AppText>
      <AppText
        style={{
          fontSize: 17,
          lineHeight: 21,
          fontFamily: theme.fonts.bold,
          fontVariant: ['tabular-nums'],
          letterSpacing: -0.3,
        }}
        color={theme.colors.heroText}>
        {value}
      </AppText>
    </View>
  );
}

function AttendanceModule({
  subjects,
  monthPercent,
  target,
  loading,
  error,
  onRetry,
}: {
  subjects: {
    subject: string;
    total_classes?: string;
    total_dutyleave?: string;
  }[];
  monthPercent?: string;
  target: number;
  loading: boolean;
  error?: unknown;
  onRetry: () => void;
}) {
  const theme = useTheme();
  const adjusted = subjects.map((subject) => ({
    adjusted: toNumberOrNull(subject.total_dutyleave),
    total: toNumberOrNull(subject.total_classes),
  }));
  const adjustedComplete =
    adjusted.length > 0 &&
    adjusted.every((entry) => entry.adjusted !== null && entry.total !== null) &&
    adjusted.some((entry) => (entry.total ?? 0) > 0);
  const totals = adjusted.reduce<{ adjusted: number; total: number }>(
    (sum, entry) => ({
      adjusted: sum.adjusted + (entry.adjusted ?? 0),
      total: sum.total + (entry.total ?? 0),
    }),
    { adjusted: 0, total: 0 },
  );
  const overall =
    adjustedComplete && totals.total > 0 ? (totals.adjusted / totals.total) * 100 : null;
  const projection =
    overall !== null ? attendanceStats(totals.adjusted, totals.total, target) : null;
  const month = toNumberOrNull(monthPercent);
  const safe = overall !== null && overall >= target;

  if (loading) return <Skeleton height={236} radius={theme.radii.lg} />;
  if (error) {
    return (
      <Card>
        <ErrorState compact error={error} onRetry={onRetry} />
      </Card>
    );
  }

  return (
    <Card
      accessibilityLabel="Adjusted attendance summary"
      onPress={() => router.push('/attendance')}
      padded={false}
      style={{ overflow: 'hidden' }}
      tone="ink">
      <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: safe ? theme.colors.heroAccent : 'transparent',
              borderWidth: safe ? 0 : 1,
              borderColor: overall === null ? theme.colors.heroMuted : theme.colors.heroAccent,
            }}
          />
          <AppText variant="label" color={theme.colors.heroMuted} style={{ flex: 1 }}>
            Adjusted attendance
          </AppText>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg }}>
          <View style={{ flex: 1, gap: 4 }}>
            {overall === null ? (
              <AppText variant="numeric" color={theme.colors.heroText}>
                —
              </AppText>
            ) : (
              <AnimatedNumber
                color={theme.colors.heroText}
                format={(value) => formatPercent(value, 1)}
                value={overall}
              />
            )}
            <AppText variant="bodyMedium" color={theme.colors.heroText}>
              {overall === null
                ? 'Adjusted attendance not reported'
                : safe
                  ? 'Above target'
                  : 'Below target'}
            </AppText>
            <AppText variant="caption" color={theme.colors.heroMuted}>
              {overall === null
                ? 'Adjusted counts are incomplete'
                : `${totals.adjusted} of ${totals.total} classes · ${subjects.length} subjects`}
            </AppText>
          </View>
          <ProgressRing
            color={theme.colors.heroAccent}
            label={overall === null ? 'Adjusted attendance unavailable' : 'Adjusted attendance'}
            progress={overall ?? 0}
            size={80}
            strokeWidth={6}
            trackColor={theme.colors.heroBorder}>
            <View style={{ alignItems: 'center' }}>
              <AppText
                style={{
                  fontSize: 16,
                  lineHeight: 19,
                  fontFamily: theme.fonts.extrabold,
                  fontVariant: ['tabular-nums'],
                }}
                color={theme.colors.heroText}>
                {target}%
              </AppText>
              <AppText variant="caption" color={theme.colors.heroMuted}>
                target
              </AppText>
            </View>
          </ProgressRing>
        </View>

        <View
          style={{
            flexDirection: 'row',
            gap: theme.spacing.md,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: theme.colors.heroBorder,
            paddingTop: theme.spacing.lg,
          }}>
          <HeroStat label="This month" value={month === null ? '—' : formatPercent(month, 0)} />
          <HeroStat
            label={projection?.isSafe ? 'Safe skips · local' : 'To recover · local'}
            value={
              projection
                ? projection.isSafe
                  ? String(projection.canBunk)
                  : String(projection.requiredToRecover)
                : '—'
            }
          />
        </View>
      </View>
    </Card>
  );
}

type ScheduleWeekDay = {
  date: Date;
  entry?: TimetableDay;
};

function scheduleWeek(days: TimetableDay[]): ScheduleWeekDay[] {
  const monday = startOfWeek(initialTimetableDate(), { weekStartsOn: 1 });
  return Array.from({ length: 6 }, (_, index) => {
    const date = addDays(monday, index);
    const entry = days.find((day) => {
      const parsed = parseEtlabDate(day.date);
      return parsed ? isSameDay(parsed, date) : false;
    });
    return { date, entry };
  });
}

function scheduleDays(week: ScheduleWeekDay[]): WeekStripDay[] {
  return week.map(({ date, entry }) => ({
    key: format(date, 'yyyy-MM-dd'),
    weekday: weekdayShort(format(date, 'EEEE')).toUpperCase(),
    day: format(date, 'd'),
    isToday: isSameDay(date, new Date()),
    hasItems: Boolean(
      entry?.periods.some((period) => period.type?.toLowerCase() !== 'holiday'),
    ),
  }));
}

function ScheduleModule({
  days,
  loading,
  error,
  onRetry,
}: {
  days: TimetableDay[];
  loading: boolean;
  error?: unknown;
  onRetry: () => void;
}) {
  const theme = useTheme();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const week = useMemo(() => scheduleWeek(days), [days]);
  const strip = useMemo(() => scheduleDays(week), [week]);
  const fallbackKey = strip.find((day) => day.isToday)?.key ?? strip[0]?.key ?? '';
  const activeKey = selectedKey && strip.some((day) => day.key === selectedKey) ? selectedKey : fallbackKey;
  const activeIndex = Math.max(
    0,
    strip.findIndex((day) => day.key === activeKey),
  );
  const selected = week[activeIndex];
  const periods = (selected?.entry?.periods ?? []).filter(
    (period) => period.type?.toLowerCase() !== 'holiday',
  );

  if (loading) return <Skeleton height={218} radius={theme.radii.lg} />;
  if (error) {
    return (
      <Card>
        <ErrorState compact error={error} onRetry={onRetry} />
      </Card>
    );
  }
  if (days.length === 0) {
    return (
      <Card>
        <EmptyState
          compact
          description="Refresh after SJCET publishes the timetable."
          icon={Clock3}
          title="No schedule returned"
        />
      </Card>
    );
  }

  return (
    <Card padded={false} style={{ overflow: 'hidden' }}>
      <View style={{ padding: theme.spacing.lg }}>
        <WeekStrip days={strip} onSelect={setSelectedKey} selectedKey={activeKey} />
      </View>
      <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border }} />
      {periods.length === 0 ? (
        <View style={{ paddingVertical: theme.spacing.xl, alignItems: 'center', gap: 4 }}>
          <AppText variant="bodySemibold">No periods</AppText>
          <AppText variant="caption" color={theme.colors.textMuted}>
            {format(selected.date, 'EEEE')} is clear.
          </AppText>
        </View>
      ) : (
        <View>
          {periods.slice(0, 4).map((period, index) => {
            const attendance = meaningfulAttendance(period.attendance_status);
            const tone = attendance ? statusTone(attendance) : 'neutral';
            return (
              <TimelineRow
                accent={
                  tone === 'success'
                    ? theme.colors.success
                    : tone === 'danger'
                      ? theme.colors.danger
                      : tone === 'warning'
                        ? theme.colors.warning
                        : theme.colors.accent
                }
                badge={attendance ? <Badge label={attendance} tone={tone} /> : undefined}
                isLast={index === Math.min(periods.length, 4) - 1}
                key={`${activeKey}-${period.hour}-${period.subject}-${index}`}
                meta={period.type || undefined}
                time={timeLabel(period, index)}
                timeEnd={timeEndLabel(period)}
                title={period.subject || 'Class'}
              />
            );
          })}
        </View>
      )}
    </Card>
  );
}

function AssignmentsModule({
  items,
  loading,
  error,
  onRetry,
}: {
  items: Assignment[];
  loading: boolean;
  error?: unknown;
  onRetry: () => void;
}) {
  const theme = useTheme();

  if (loading) {
    return (
      <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
        <Skeleton height={174} radius={theme.radii.lg} width={258} />
        <Skeleton height={174} radius={theme.radii.lg} width={258} />
      </View>
    );
  }
  if (error) {
    return (
      <Card>
        <ErrorState compact error={error} onRetry={onRetry} />
      </Card>
    );
  }
  if (items.length === 0) {
    return (
      <Card>
        <EmptyState
          compact
          description="New work will appear when it is published in Etlab."
          icon={Sparkles}
          title="Nothing pending"
        />
      </Card>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ gap: theme.spacing.md, paddingRight: theme.spacing.xl }}
      decelerationRate="fast"
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={258 + theme.spacing.md}>
      {items.slice(0, 5).map((assignment, index) => (
        <AssignmentFeatureCard
          assignment={assignment}
          featured={index === 0}
          key={assignment.id}
          onPress={() =>
            router.push({ pathname: '/assignment/[id]', params: { id: assignment.id } })
          }
        />
      ))}
    </ScrollView>
  );
}

function NoticesModule({
  items,
  loading,
  error,
  onRetry,
}: {
  items: { heading?: string; content: string; createdTime?: string }[];
  loading: boolean;
  error?: unknown;
  onRetry: () => void;
}) {
  const theme = useTheme();

  if (loading) return <Skeleton height={142} radius={theme.radii.lg} />;
  if (error) {
    return (
      <Card>
        <ErrorState compact error={error} onRetry={onRetry} />
      </Card>
    );
  }
  if (items.length === 0) {
    return (
      <Card>
        <EmptyState compact icon={Megaphone} title="No notices returned" />
      </Card>
    );
  }

  return (
    <Card padded={false}>
      {items.slice(0, 3).map((notice, index) => (
        <Pressable
          accessibilityLabel={notice.heading ?? 'Notice'}
          accessibilityRole="button"
          key={`${notice.heading}-${index}`}
          onPress={() => router.push('/notices')}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.md,
            padding: theme.spacing.lg,
            borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
            borderTopColor: theme.colors.border,
            opacity: pressed ? 0.6 : 1,
          })}>
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: theme.colors.accent,
            }}
          />
          <View style={{ flex: 1, gap: 2 }}>
            <AppText numberOfLines={1} variant="bodySemibold">
              {notice.heading ?? 'Notice'}
            </AppText>
            <AppText numberOfLines={1} variant="caption" color={theme.colors.textSecondary}>
              {notice.content}
            </AppText>
          </View>
          <AppText variant="caption" color={theme.colors.textMuted}>
            {relativeTime(notice.createdTime)}
          </AppText>
        </Pressable>
      ))}
    </Card>
  );
}

export default function HomeScreen() {
  const theme = useTheme();
  const session = useSession();
  const target = useSettings((state) => state.attendanceTarget);
  const homeModules = useSettings((state) => state.homeModules);
  const remindersEnabled = useSettings((state) => state.assignmentRemindersEnabled);
  const dashboard = useDashboard();
  const attendance = useAttendance();
  const assignments = useAssignments();
  const timetable = useTimetable();
  const notices = useNotices();
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([
      dashboard.refetch(),
      attendance.refetch(),
      assignments.refetch(),
      timetable.refetch(),
      notices.refetch(),
    ]);
    setRefreshing(false);
  };

  useEffect(() => {
    if (remindersEnabled && assignments.data) {
      void syncAssignmentReminders(assignments.data).catch(() => undefined);
    }
  }, [assignments.data, remindersEnabled]);

  const name = session.profile.profileName?.trim() || 'SJCET student';
  const firstName = name.split(/\s+/)[0];
  const pending = useMemo(
    () =>
      (assignments.data ?? [])
        .filter((assignment) => !isSubmitted(assignment))
        .slice()
        .sort(
          (a, b) =>
            (parseEtlabDate(a.lastDate)?.getTime() ?? Number.POSITIVE_INFINITY) -
            (parseEtlabDate(b.lastDate)?.getTime() ?? Number.POSITIVE_INFINITY),
        ),
    [assignments.data],
  );

  const sections: Record<HomeModule, ReactNode> = {
    attendance: (
      <AttendanceModule
        error={attendance.isError && !attendance.data ? attendance.error : undefined}
        loading={attendance.isLoading && !attendance.data}
        monthPercent={dashboard.data?.attendance_forthemonth}
        onRetry={() => void attendance.refetch()}
        subjects={attendance.data?.subjects ?? []}
        target={target}
      />
    ),
    schedule: (
      <>
        <SectionHeader
          actionLabel="Week"
          onAction={() => router.push('/timetable')}
          title="Schedule"
        />
        <ScheduleModule
          days={timetable.data ?? []}
          error={timetable.isError && !timetable.data ? timetable.error : undefined}
          loading={timetable.isLoading && !timetable.data}
          onRetry={() => void timetable.refetch()}
        />
      </>
    ),
    assignments: (
      <>
        <SectionHeader
          actionLabel="All"
          onAction={() => router.push('/assignments')}
          title="Due next"
        />
        <AssignmentsModule
          error={assignments.isError && !assignments.data ? assignments.error : undefined}
          items={pending}
          loading={assignments.isLoading && !assignments.data}
          onRetry={() => void assignments.refetch()}
        />
      </>
    ),
    notices: (
      <>
        <SectionHeader
          actionLabel="All"
          onAction={() => router.push('/notices')}
          title="Notices"
        />
        <NoticesModule
          error={notices.isError && !notices.data ? notices.error : undefined}
          items={notices.data ?? []}
          loading={notices.isLoading && !notices.data}
          onRetry={() => void notices.refetch()}
        />
      </>
    ),
  };

  return (
    <Screen
      refreshControl={
        <RefreshControl
          colors={[theme.colors.accent]}
          onRefresh={() => void refresh()}
          refreshing={refreshing}
          tintColor={theme.colors.accent}
        />
      }
      scroll>
      <Reveal>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: theme.spacing.md,
          }}>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <CalendarClock color={theme.colors.textMuted} size={13} strokeWidth={1.9} />
              <AppText variant="label" color={theme.colors.textMuted}>
                {format(new Date(), 'EEE · d MMM')}
              </AppText>
            </View>
            <AppText
              style={{ fontFamily: theme.fonts.serif, fontSize: 31, lineHeight: 33 }}
              color={theme.colors.textSecondary}>
              {greeting()},
            </AppText>
            <AppText numberOfLines={1} variant="h1" style={{ fontSize: 31, lineHeight: 35 }}>
              {firstName}
            </AppText>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
            <IconButton
              icon={Bell}
              label="Open notices"
              onPress={() => router.push('/notices')}
              size={19}
            />
            <Pressable
              accessibilityLabel="Open profile and settings"
              accessibilityRole="button"
              onPress={() => router.push('/more')}>
              <Avatar
                name={name}
                ringColor={theme.colors.accentSoft}
                size={46}
                uri={getPhotoUrl(session)}
              />
            </Pressable>
          </View>
        </View>
      </Reveal>

      <View style={{ marginTop: theme.spacing.xl, gap: 0 }}>
        {homeModules.map((module, index) => (
          <Reveal delay={70 + index * 55} key={module}>
            {sections[module]}
          </Reveal>
        ))}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: theme.spacing.xxl }}>
        <TrendingUp color={theme.colors.textMuted} size={12} strokeWidth={1.8} />
        <AppText variant="caption" color={theme.colors.textMuted}>
          {dashboard.dataUpdatedAt
            ? `Etlab checked ${relativeTime(new Date(dashboard.dataUpdatedAt).toISOString())}`
            : 'SJCET Etlab'}
        </AppText>
      </View>
    </Screen>
  );
}
