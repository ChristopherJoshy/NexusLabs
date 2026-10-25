import { useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  ChevronRight,
  CircleCheckBig,
  CloudUpload,
  RefreshCw,
} from 'lucide-react-native';

import {
  AnimatedNumber,
  AppText,
  AssignmentRow,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  ProgressRing,
  Reveal,
  Screen,
  ScreenHeader,
  Segmented,
  Skeleton,
} from '@/components/ui';
import { splitAssignments, useAssignments } from '@/hooks/use-etlab';
import { deadlineMeta, parseEtlabDate } from '@/lib/format';
import { useTheme } from '@/theme';

type Filter = 'pending' | 'submitted';

export default function AssignmentsScreen() {
  const theme = useTheme();
  const { data, isLoading, isError, error, refetch, isRefetching } = useAssignments();
  const [filter, setFilter] = useState<Filter>('pending');

  const { pending, submitted } = splitAssignments(data ?? []);
  const sortedPending = pending
    .slice()
    .sort(
      (a, b) =>
        (parseEtlabDate(a.lastDate)?.getTime() ?? Number.POSITIVE_INFINITY) -
        (parseEtlabDate(b.lastDate)?.getTime() ?? Number.POSITIVE_INFINITY),
    );
  const sortedSubmitted = submitted
    .slice()
    .sort(
      (a, b) =>
        (parseEtlabDate(b.lastDate)?.getTime() ?? 0) -
        (parseEtlabDate(a.lastDate)?.getTime() ?? 0),
    );
  const visible = filter === 'pending' ? sortedPending : sortedSubmitted;
  const nearest = sortedPending[0];
  const nearestDue = nearest ? deadlineMeta(nearest.lastDate) : null;
  const total = pending.length + submitted.length;
  const completion = total > 0 ? (submitted.length / total) * 100 : 0;

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
        right={
          <IconButton
            icon={RefreshCw}
            label="Refresh assignments"
            onPress={() => void refetch()}
            size={18}
          />
        }
        title="Assignments"
      />

      {isLoading ? (
        <View style={{ gap: theme.spacing.md }}>
          <Skeleton height={174} radius={theme.radii.lg} />
          <Skeleton height={92} radius={theme.radii.lg} />
          <Skeleton height={92} radius={theme.radii.lg} />
        </View>
      ) : isError && !data ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : (
        <View style={{ gap: theme.spacing.lg }}>
          <Reveal delay={40}>
            <Card
              accessibilityLabel={
                nearest
                  ? `${pending.length} pending assignments. Next ${nearest.title}, ${nearestDue?.label}`
                  : 'No pending assignments'
              }
              onPress={
                nearest
                  ? () =>
                      router.push({
                        pathname: '/assignment/[id]',
                        params: { id: nearest.id },
                      })
                  : undefined
              }
              padded={false}
              style={{ overflow: 'hidden' }}
              tone="ink">
              <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <AppText variant="label" color={theme.colors.heroMuted}>
                      Pending
                    </AppText>
                    <AnimatedNumber
                      color={theme.colors.heroText}
                      format={(value) => String(Math.round(value))}
                      value={pending.length}
                    />
                    <AppText variant="bodyMedium" color={theme.colors.heroMuted}>
                      {nearest
                        ? nearestDue?.label
                        : submitted.length > 0
                          ? 'Everything is submitted'
                          : 'All clear'}
                    </AppText>
                  </View>
                  <ProgressRing
                    color={theme.colors.heroAccent}
                    label={`${submitted.length} of ${total} assignments submitted`}
                    progress={completion}
                    size={76}
                    strokeWidth={6}
                    trackColor={theme.colors.heroBorder}>
                    <View style={{ alignItems: 'center' }}>
                      <AppText
                        style={{
                          fontSize: 18,
                          lineHeight: 21,
                          fontFamily: theme.fonts.extrabold,
                          fontVariant: ['tabular-nums'],
                        }}
                        color={theme.colors.heroText}>
                        {submitted.length}
                      </AppText>
                      <AppText variant="caption" color={theme.colors.heroMuted}>
                        done
                      </AppText>
                    </View>
                  </ProgressRing>
                </View>

                {nearest ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: theme.spacing.sm,
                      borderTopWidth: StyleSheet.hairlineWidth,
                      borderTopColor: theme.colors.heroBorder,
                      paddingTop: theme.spacing.lg,
                    }}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <AppText numberOfLines={1} variant="caption" color={theme.colors.heroMuted}>
                        {nearest.subject || 'Subject'}
                      </AppText>
                      <AppText numberOfLines={1} variant="bodySemibold" color={theme.colors.heroText}>
                        {nearest.title}
                      </AppText>
                    </View>
                    <ChevronRight color={theme.colors.heroMuted} size={18} strokeWidth={2} />
                  </View>
                ) : null}
              </View>
            </Card>
          </Reveal>

          <Segmented
            onChange={setFilter}
            options={[
              { value: 'pending', label: 'Pending', count: pending.length },
              { value: 'submitted', label: 'Submitted', count: submitted.length },
            ]}
            value={filter}
          />

          {visible.length === 0 ? (
            <Card>
              <EmptyState
                description={
                  filter === 'pending'
                    ? 'New work appears here as soon as your teachers publish it.'
                    : 'Assignments you submit will be listed here with their files.'
                }
                icon={filter === 'pending' ? CircleCheckBig : CloudUpload}
                title={filter === 'pending' ? 'Nothing pending' : 'No submissions yet'}
              />
            </Card>
          ) : (
            <Card padded={false} style={{ overflow: 'hidden' }}>
              {visible.map((assignment, index) => (
                <AssignmentRow
                  assignment={assignment}
                  isLast={index === visible.length - 1}
                  key={assignment.id}
                  onPress={() =>
                    router.push({
                      pathname: '/assignment/[id]',
                      params: { id: assignment.id },
                    })
                  }
                  submitted={filter === 'submitted'}
                />
              ))}
            </Card>
          )}
        </View>
      )}
    </Screen>
  );
}
