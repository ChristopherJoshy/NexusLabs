import { useMemo, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { format } from 'date-fns';
import { CalendarClock, GraduationCap } from 'lucide-react-native';

import {
  AppText,
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Screen,
  ScreenHeader,
  Segmented,
  Skeleton,
} from '@/components/ui';
import { useInternalResults, useSeriesExams } from '@/hooks/use-etlab';
import type { AcademicRecord, SeriesExam } from '@/lib/api/types';
import { parseEtlabDate } from '@/lib/format';
import { useTheme } from '@/theme';

type ResultType = 'internal' | 'series';
type Tone = 'success' | 'warning' | 'danger' | 'neutral';

function statusTone(status?: string): Tone {
  const value = status?.toLowerCase() ?? '';
  if (value.includes('complete') || value.includes('finish') || value.includes('evaluat')) {
    return 'success';
  }
  if (value.includes('pending') || value.includes('upcoming') || value.includes('schedul')) {
    return 'warning';
  }
  if (value.includes('cancel') || value.includes('miss') || value.includes('expire')) {
    return 'danger';
  }
  return 'neutral';
}

function examWindow(start?: string, finish?: string): string | undefined {
  const startDate = parseEtlabDate(start);
  const finishDate = parseEtlabDate(finish);
  if (!startDate && !finishDate) return undefined;

  if (startDate && finishDate) {
    if (format(startDate, 'yyyy-MM-dd') === format(finishDate, 'yyyy-MM-dd')) {
      return `${format(startDate, 'd MMM')} · ${format(startDate, 'h:mm a')} – ${format(
        finishDate,
        'h:mm a',
      )}`;
    }
    return `${format(startDate, 'd MMM')} – ${format(finishDate, 'd MMM')}`;
  }

  const date = startDate ?? finishDate;
  return `${format(date!, 'd MMM')} · ${format(date!, 'h:mm a')}`;
}

function InternalMarkRow({ item, isLast }: { item: AcademicRecord; isLast: boolean }) {
  const theme = useTheme();
  const score = item.score?.trim();
  const maximum = item.maximum?.trim();

  return (
    <View
      accessibilityLabel={`${item.subject ?? 'Subject not reported'}, ${
        score
          ? `reported mark ${score}${maximum ? ` out of ${maximum}` : ''}`
          : 'mark not reported'
      }`}
      accessible
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border,
      }}>
      <AppText numberOfLines={2} style={{ flex: 1 }} variant="bodySemibold">
        {item.subject ?? 'Subject not reported'}
      </AppText>

      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
        <AppText
          style={{
            fontSize: 24,
            lineHeight: 26,
            fontFamily: theme.fonts.extrabold,
            letterSpacing: -0.8,
            fontVariant: ['tabular-nums'],
          }}>
          {score || '—'}
        </AppText>
        {maximum ? (
          <AppText variant="caption" color={theme.colors.textMuted}>
            /{maximum}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

function SeriesExamRow({ item, isLast }: { item: SeriesExam; isLast: boolean }) {
  const theme = useTheme();
  const title = item.title ?? item.subject ?? 'Exam not reported';
  const window = examWindow(item.startTime, item.finishTime);
  const subject = item.subject && item.subject !== title ? item.subject : undefined;

  return (
    <View
      accessibilityLabel={`${title}, ${subject ?? 'subject not reported'}, ${
        window ?? 'time not reported'
      }, ${item.status ?? 'status not reported'}`}
      accessible
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border,
      }}>
      <View style={{ flex: 1, gap: 3 }}>
        <AppText numberOfLines={2} variant="bodySemibold">
          {title}
        </AppText>
        {subject ? (
          <AppText numberOfLines={1} variant="caption" color={theme.colors.textSecondary}>
            {subject}
          </AppText>
        ) : null}
        <AppText numberOfLines={1} variant="caption" color={theme.colors.textMuted}>
          {window ?? 'Time not reported'}
        </AppText>
      </View>

      {item.status ? <Badge dot label={item.status} tone={statusTone(item.status)} /> : null}
    </View>
  );
}

export default function ResultsScreen() {
  const theme = useTheme();
  const [type, setType] = useState<ResultType>('internal');
  const internal = useInternalResults();
  const series = useSeriesExams();
  const isInternal = type === 'internal';
  const query = isInternal ? internal : series;
  const internalRecords = useMemo(() => internal.data ?? [], [internal.data]);
  const seriesRecords = useMemo(() => series.data ?? [], [series.data]);

  return (
    <Screen
      refreshControl={
        <RefreshControl
          colors={[theme.colors.accent]}
          onRefresh={() => void query.refetch()}
          refreshing={query.isRefetching}
          tintColor={theme.colors.accent}
        />
      }
      scroll>
      <ScreenHeader back title="Results" />

      <Segmented
        onChange={setType}
        options={[
          { value: 'internal', label: 'Internal', count: internal.data?.length },
          { value: 'series', label: 'Series', count: series.data?.length },
        ]}
        value={type}
      />

      <View style={{ marginTop: theme.spacing.xl }}>
        {query.isLoading ? (
          <View style={{ gap: theme.spacing.sm }}>
            <Skeleton height={76} radius={theme.radii.md} />
            <Skeleton height={76} radius={theme.radii.md} />
            <Skeleton height={76} radius={theme.radii.md} />
            <Skeleton height={76} radius={theme.radii.md} />
          </View>
        ) : query.isError && !query.data ? (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        ) : isInternal ? (
          internalRecords.length === 0 ? (
            <Card>
              <EmptyState
                description="Etlab returned no internal marks for this semester."
                icon={GraduationCap}
                title="No internal marks"
              />
            </Card>
          ) : (
            <Card padded={false} style={{ overflow: 'hidden' }}>
              {internalRecords.map((item, index) => (
                <InternalMarkRow
                  isLast={index === internalRecords.length - 1}
                  item={item}
                  key={item.id}
                />
              ))}
            </Card>
          )
        ) : seriesRecords.length === 0 ? (
          <Card>
            <EmptyState
              description="Etlab returned no series exams for this semester."
              icon={CalendarClock}
              title="No series exams"
            />
          </Card>
        ) : (
          <Card padded={false} style={{ overflow: 'hidden' }}>
            {seriesRecords.map((item, index) => (
              <SeriesExamRow
                isLast={index === seriesRecords.length - 1}
                item={item}
                key={item.id}
              />
            ))}
          </Card>
        )}
      </View>
    </Screen>
  );
}
