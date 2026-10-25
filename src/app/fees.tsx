import { useMemo } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { ReceiptText } from 'lucide-react-native';

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
import { useFees } from '@/hooks/use-etlab';
import type { FeeRecord } from '@/lib/api/types';
import { formatDate } from '@/lib/format';
import { useTheme } from '@/theme';

type Tone = 'success' | 'warning' | 'danger' | 'neutral';

function statusTone(status?: string): Tone {
  const value = status?.toLowerCase() ?? '';
  if (value.includes('paid') || value.includes('complete')) return 'success';
  if (value.includes('due') || value.includes('pending')) return 'warning';
  if (value.includes('overdue') || value.includes('failed')) return 'danger';
  return 'neutral';
}

function FeeRow({ item, isLast }: { item: FeeRecord; isLast: boolean }) {
  const theme = useTheme();
  const tone = statusTone(item.status);

  return (
    <View
      accessibilityLabel={`${item.label ?? 'Fee item'}, ${
        item.amount ?? 'amount not reported'
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
          {item.label ?? 'Fee item'}
        </AppText>
        <AppText variant="caption" color={theme.colors.textMuted}>
          {item.dueDate ? `Due ${formatDate(item.dueDate, 'd MMM yyyy')}` : 'Due date not reported'}
        </AppText>
        {item.receipt ? (
          <AppText numberOfLines={1} variant="caption" color={theme.colors.textMuted}>
            Receipt {item.receipt}
          </AppText>
        ) : null}
      </View>

      <View style={{ alignItems: 'flex-end', gap: 6, maxWidth: '42%' }}>
        <AppText
          numberOfLines={2}
          style={{
            fontFamily: theme.fonts.extrabold,
            fontSize: 19,
            lineHeight: 22,
            letterSpacing: -0.5,
            fontVariant: ['tabular-nums'],
            textAlign: 'right',
          }}>
          {item.amount ?? '—'}
        </AppText>
        <Badge dot label={item.status ?? 'Status not reported'} tone={tone} />
      </View>
    </View>
  );
}

export default function FeesScreen() {
  const theme = useTheme();
  const query = useFees();
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
      <ScreenHeader back title="Fees" />

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
            description="Etlab returned no fee records for this account."
            icon={ReceiptText}
            title="No fee records"
          />
        </Card>
      ) : (
        <Card padded={false} style={{ overflow: 'hidden' }}>
          {records.map((item, index) => (
            <FeeRow isLast={index === records.length - 1} item={item} key={item.id} />
          ))}
        </Card>
      )}
    </Screen>
  );
}
