import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, View } from 'react-native';
import { addDays, format, isSameDay, parseISO, startOfWeek } from 'date-fns';
import { CalendarDays, CalendarX2, ChevronLeft, ChevronRight } from 'lucide-react-native';

import {
  AppText,
  Badge,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  Reveal,
  Screen,
  ScreenHeader,
  Skeleton,
  TimelineRow,
  WeekStrip,
  type WeekStripDay,
} from '@/components/ui';
import { useTimetable } from '@/hooks/use-etlab';
import type { TimetableDay, TimetablePeriod } from '@/lib/api/types';
import {
  initialTimetableDate,
  meaningfulAttendance,
  parseEtlabDate,
  weekdayShort,
} from '@/lib/format';
import { useSession } from '@/stores/auth';
import { useTheme } from '@/theme';

function dayFor(days: TimetableDay[], date: Date): TimetableDay | undefined {
  const exact = days.find((day) => {
    const parsed = parseEtlabDate(day.date);
    return parsed ? isSameDay(parsed, date) : false;
  });
  if (exact) return exact;
  if (days.length <= 7) {
    return days.find((day) => day.day?.toLowerCase() === format(date, 'EEEE').toLowerCase());
  }
  return undefined;
}

function mergeDays(...collections: (TimetableDay[] | undefined)[]): TimetableDay[] {
  const seen = new Set<string>();
  const merged: TimetableDay[] = [];
  for (const day of collections.flatMap((collection) => collection ?? [])) {
    const key = day.date?.trim() || day.day?.trim();
    if (key) {
      if (seen.has(key)) continue;
      seen.add(key);
    }
    merged.push(day);
  }
  return merged;
}

function startTime(period: TimetablePeriod): string {
  const start = period.timeperiod?.split(/[–-]/)[0]?.trim();
  if (start) return start;
  return period.hour ? `P${period.hour}` : '—';
}

function endTime(period: TimetablePeriod): string | undefined {
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

export default function TimetableScreen() {
  const theme = useTheme();
  const session = useSession();
  const [selectedDate, setSelectedDate] = useState(() => initialTimetableDate());
  const today = new Date();
  const monday = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const week = Array.from({ length: 6 }, (_, index) => addDays(monday, index));
  const month = format(selectedDate, 'yyyy-MM');
  const weekEndMonth = format(week[5], 'yyyy-MM');
  const adjacentMonth = weekEndMonth === month ? format(monday, 'yyyy-MM') : weekEndMonth;
  const primary = useTimetable(month);
  const adjacent = useTimetable(adjacentMonth, { enabled: adjacentMonth !== month });
  const days = useMemo(
    () => mergeDays(primary.data, adjacent.data),
    [primary.data, adjacent.data],
  );
  const { isLoading, isError, error } = primary;
  const isRefetching = primary.isRefetching || adjacent.isRefetching;
  const refresh = () =>
    Promise.all([
      primary.refetch(),
      adjacentMonth !== month ? adjacent.refetch() : Promise.resolve(),
    ]);

  const selectedDay = dayFor(days, selectedDate);
  const periods = (selectedDay?.periods ?? [])
    .filter((period) => period.type?.toLowerCase() !== 'holiday')
    .slice()
    .sort((a, b) => (a.hour ?? 0) - (b.hour ?? 0));
  const selectedKey = format(selectedDate, 'yyyy-MM-dd');
  const strip: WeekStripDay[] = week.map((date) => {
    const day = dayFor(days, date);
    return {
      key: format(date, 'yyyy-MM-dd'),
      weekday: weekdayShort(format(date, 'EEEE')).toUpperCase(),
      day: format(date, 'd'),
      isToday: isSameDay(date, today),
      hasItems: Boolean(
        day?.periods.some((period) => period.type?.toLowerCase() !== 'holiday'),
      ),
    };
  });
  const isThisWeek = isSameDay(monday, startOfWeek(today, { weekStartsOn: 1 }));

  return (
    <Screen
      refreshControl={
        <RefreshControl
          colors={[theme.colors.accent]}
          onRefresh={() => void refresh()}
          refreshing={isRefetching}
          tintColor={theme.colors.accent}
        />
      }
      scroll>
      <ScreenHeader
        right={
          <>
            <IconButton
              icon={ChevronLeft}
              label="Previous week"
              onPress={() => setSelectedDate((date) => addDays(date, -7))}
              size={19}
            />
            <IconButton
              icon={ChevronRight}
              label="Next week"
              onPress={() => setSelectedDate((date) => addDays(date, 7))}
              size={19}
            />
          </>
        }
        title="Timetable"
      />

      <Reveal delay={40}>
        <Card style={{ gap: theme.spacing.lg }}>
          <WeekStrip
            days={strip}
            onSelect={(key) => setSelectedDate(parseISO(key))}
            selectedKey={selectedKey}
          />
          <View style={{ height: 1, backgroundColor: theme.colors.border }} />
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: theme.spacing.md }}>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="label" color={theme.colors.textMuted}>
                {isSameDay(selectedDate, today) ? 'Today' : format(selectedDate, 'EEEE')}
              </AppText>
              <AppText variant="h3">{format(selectedDate, 'd MMMM')}</AppText>
            </View>
            {!isThisWeek || !isSameDay(selectedDate, today) ? (
              <Pressable
                accessibilityLabel="Jump to today"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => setSelectedDate(new Date())}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingVertical: 4,
                }}>
                <CalendarDays color={theme.colors.accent} size={14} strokeWidth={1.9} />
                <AppText variant="smallMedium" color={theme.colors.accent}>
                  Today
                </AppText>
              </Pressable>
            ) : null}
            {periods.length > 0 ? (
              <AppText variant="caption" color={theme.colors.textMuted}>
                {periods.length} {periods.length === 1 ? 'period' : 'periods'}
              </AppText>
            ) : null}
          </View>
        </Card>
      </Reveal>

      <View style={{ marginTop: theme.spacing.xl }}>
        {isLoading ? (
          <View style={{ gap: theme.spacing.sm }}>
            <Skeleton height={64} radius={theme.radii.md} />
            <Skeleton height={64} radius={theme.radii.md} />
            <Skeleton height={64} radius={theme.radii.md} />
            <Skeleton height={64} radius={theme.radii.md} />
          </View>
        ) : isError && !primary.data ? (
          <ErrorState error={error} onRetry={() => void refresh()} />
        ) : periods.length === 0 ? (
          <Card>
            <EmptyState
              compact
              description={
                selectedDate.getDay() === 0
                  ? 'It is Sunday. The timetable does not schedule classes today.'
                  : 'No periods are published for this day. Check another day or pull to refresh.'
              }
              icon={CalendarX2}
              title="No classes scheduled"
            />
          </Card>
        ) : (
          <Card padded={false} style={{ overflow: 'hidden' }}>
            {periods.map((period, index) => {
              const attendance = meaningfulAttendance(period.attendance_status);
              const tone = attendance ? statusTone(attendance) : 'neutral';
              const type = period.type?.trim();
              const genericType = !type || type.toLowerCase() === 'class';
              return (
                <TimelineRow
                  accent={
                    tone === 'success'
                      ? theme.colors.success
                      : tone === 'warning'
                        ? theme.colors.warning
                        : tone === 'danger'
                          ? theme.colors.danger
                          : theme.colors.accent
                  }
                  badge={attendance ? <Badge dot label={attendance} tone={tone} /> : undefined}
                  isLast={index === periods.length - 1}
                  key={`${selectedKey}-${period.hour}-${period.subject}-${index}`}
                  meta={!genericType ? type : undefined}
                  time={startTime(period)}
                  timeEnd={endTime(period)}
                  title={period.subject?.trim() || 'Free period'}
                />
              );
            })}
          </Card>
        )}

        {selectedDay?.day ? (
          <AppText
            align="center"
            color={theme.colors.textMuted}
            style={{ marginTop: theme.spacing.xl }}
            variant="caption">
            Published by {session.college.clgName}
          </AppText>
        ) : null}
      </View>
    </Screen>
  );
}
