import { useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ChevronDown, ChevronUp, Megaphone, Paperclip, RefreshCw, UserRound } from 'lucide-react-native';

import {
  AppText,
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  Screen,
  ScreenHeader,
  Skeleton,
} from '@/components/ui';
import { useNotices } from '@/hooks/use-etlab';
import type { Notice, Session } from '@/lib/api/types';
import { formatDate, relativeTime } from '@/lib/format';
import { resolveHttpUrl } from '@/lib/url';
import { useAuth, useSession } from '@/stores/auth';
import { useTheme } from '@/theme';

function NoticeCard({
  notice,
  session,
  expanded,
  onToggle,
}: {
  notice: Notice;
  session: Session;
  expanded: boolean;
  onToggle: () => void;
}) {
  const theme = useTheme();
  const attachment = resolveHttpUrl(session.baseUrl, notice.document);
  const content = notice.content?.trim() ?? '';
  const long = content.length > 280;

  return (
    <Card style={{ gap: theme.spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: theme.colors.accent,
          }}
        />
        <AppText variant="caption" color={theme.colors.textMuted}>
          {notice.createdTime
            ? `${relativeTime(notice.createdTime)} · ${formatDate(notice.createdTime, 'd MMM yyyy')}`
            : 'College notice'}
        </AppText>
      </View>

      <AppText variant="h3">{notice.heading ?? 'Notice'}</AppText>

      <AppText
        numberOfLines={expanded ? undefined : 6}
        variant="body"
        color={theme.colors.textSecondary}>
        {content || 'No details were included with this notice.'}
      </AppText>

      {long ? (
        <Pressable
          accessibilityLabel={expanded ? 'Show less of this notice' : 'Read full notice'}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          hitSlop={8}
          onPress={onToggle}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' }}>
          <AppText variant="smallMedium" color={theme.colors.accent}>
            {expanded ? 'Less' : 'More'}
          </AppText>
          {expanded ? (
            <ChevronUp color={theme.colors.accent} size={15} strokeWidth={2.2} />
          ) : (
            <ChevronDown color={theme.colors.accent} size={15} strokeWidth={2.2} />
          )}
        </Pressable>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.sm,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.border,
          paddingTop: theme.spacing.md,
        }}>
        <UserRound color={theme.colors.textMuted} size={14} strokeWidth={1.9} />
        <AppText numberOfLines={1} style={{ flex: 1 }} variant="caption" color={theme.colors.textMuted}>
          {notice.createBy ?? 'College office'}
        </AppText>
        {attachment ? (
          <Button
            fullWidth={false}
            icon={Paperclip}
            label="Attachment"
            onPress={() => void WebBrowser.openBrowserAsync(attachment)}
            size="sm"
            variant="secondary"
          />
        ) : null}
      </View>
    </Card>
  );
}

function NoticesContent() {
  const theme = useTheme();
  const session = useSession();
  const { data, isLoading, isError, error, refetch, isRefetching } = useNotices();
  const [expanded, setExpanded] = useState<number[]>([]);

  const toggle = (index: number) =>
    setExpanded((current) =>
      current.includes(index) ? current.filter((value) => value !== index) : [...current, index],
    );

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
        back
        right={
          <IconButton
            icon={RefreshCw}
            label="Refresh notices"
            onPress={() => void refetch()}
            size={18}
          />
        }
        title="Notices"
      />

      {isLoading ? (
        <View style={{ gap: theme.spacing.md }}>
          <Skeleton height={184} radius={theme.radii.lg} />
          <Skeleton height={184} radius={theme.radii.lg} />
          <Skeleton height={184} radius={theme.radii.lg} />
        </View>
      ) : isError && !data ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : !data || data.length === 0 ? (
        <Card>
          <EmptyState
            description="Announcements from your college office will appear here."
            icon={Megaphone}
            title="No notices yet"
          />
        </Card>
      ) : (
        <View style={{ gap: theme.spacing.md }}>
          {data.map((notice, index) => (
            <NoticeCard
              expanded={expanded.includes(index)}
              key={`${notice.heading}-${notice.createdTime}-${index}`}
              notice={notice}
              onToggle={() => toggle(index)}
              session={session}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

export default function NoticesScreen() {
  const session = useAuth((state) => state.session);
  if (!session) {
    return <Redirect href="/login" />;
  }
  return <NoticesContent />;
}
