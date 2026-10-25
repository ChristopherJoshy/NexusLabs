import { useMemo } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { CalendarOff } from 'lucide-react-native';

import {
  AppText,
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Screen,
  ScreenHeader,
  Skeleton,
} from '@/components/ui';
import { useLeaveHistory } from '@/hooks/use-etlab';
import type { LeaveRecord } from '@/lib/api/types';
import { formatDate } from '@/lib/format';
import { useTheme } from '@/theme';

type Tone = 'success' | 'warning' | 'danger' | 'neutral';

function toneFor(status?: string): Tone {
  const value = status?.toLowerCase() ?? '';
  if (value.includes('approved') || value.includes('accept')) return 'success';
  if (value.includes('pending') || value.includes('review')) return 'warning';
  if (value.includes('reject') || value.includes('decline')) return 'danger';
  return 'neutral';
}

function LeaveRow({ item, isLast }: { item: LeaveRecord; isLast: boolean }) {
  const theme = useTheme();
  const tone = toneFor(item.status);
  const dateRange = [
    item.startDate && formatDate(item.startDate, 'd MMM'),
    item.endDate && formatDate(item.endDate, 'd MMM yyyy'),
  ]
    .filter(Boolean)
    .join(' – ');

  return (
    <View
      accessibilityLabel={`${item.type ?? 'Leave record'}, ${
        dateRange || 'dates not reported'
      }, ${item.status ?? 'status not reported'}`}
      accessible
      style={{
        gap: 4,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md }}>
        <View style={{ flex: 1, gap: 3 }}>
          <AppText numberOfLines={2} variant="bodySemibold">
            {item.type ?? 'Leave record'}
          </AppText>
          <AppText variant="caption" color={theme.colors.textMuted}>
            {dateRange || 'Dates not reported'}
          </AppText>
        </View>
        <Badge dot label={item.status ?? 'Status not reported'} tone={tone} />
      </View>

      {item.reason ? (
        <AppText numberOfLines={2} variant="caption" color={theme.colors.textSecondary}>
          {item.reason}
        </AppText>
      ) : null}
    </View>
  );
}

export default function LeaveScreen() {
  const theme = useTheme();
  const query = useLeaveHistory();
  const records = useMemo(() => query.data ?? [], [query.data]);

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
      <ScreenHeader back title="Leave" />

      {query.isLoading ? (
        <View style={{ gap: theme.spacing.sm }}>
          <Skeleton height={76} radius={theme.radii.md} />
          <Skeleton height={76} radius={theme.radii.md} />
          <Skeleton height={76} radius={theme.radii.md} />
          <Skeleton height={76} radius={theme.radii.md} />
        </View>
      ) : query.isError && !query.data ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : records.length === 0 ? (
        <Card>
          <EmptyState
            description="Etlab returned no leave records for this account."
            icon={CalendarOff}
            title="No leave records"
          />
        </Card>
      ) : (
        <Card padded={false} style={{ overflow: 'hidden' }}>
          {records.map((item, index) => (
            <LeaveRow isLast={index === records.length - 1} item={item} key={item.id} />
          ))}
        </Card>
      )}
    </Screen>
  );
}
