import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';
import { AppText } from './text';
import { PressableScale } from './motion';

type TimelineRowProps = {
  time: string;
  timeEnd?: string;
  title: string;
  meta?: string;
  badge?: ReactNode;
  accent?: string;
  isLast?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * A flat ledger row for schedules and chronological records.
 * The parent surface owns the card; rows own the hairline between them.
 */
export function TimelineRow({
  time,
  timeEnd,
  title,
  meta,
  badge,
  accent,
  isLast = false,
  onPress,
  style,
}: TimelineRowProps) {
  const theme = useTheme();
  const marker = accent ?? theme.colors.accent;

  const row: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  };

  const content = (
    <>
      <View style={{ width: 58, paddingTop: 1 }}>
        <AppText
          style={{
            fontSize: 11,
            lineHeight: 15,
            fontFamily: theme.fonts.semibold,
            fontVariant: ['tabular-nums'],
          }}
          color={theme.colors.textSecondary}>
          {time}
        </AppText>
        {timeEnd ? (
          <AppText
            style={{
              fontSize: 10,
              lineHeight: 14,
              fontVariant: ['tabular-nums'],
              marginTop: 1,
            }}
            color={theme.colors.textMuted}>
            {timeEnd}
          </AppText>
        ) : null}
      </View>
      <View style={{ width: 8, alignItems: 'center', paddingTop: 6 }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: marker }} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          <AppText style={{ flex: 1 }} variant="bodySemibold">
            {title}
          </AppText>
          {badge}
        </View>
        {meta ? (
          <AppText variant="caption" color={theme.colors.textSecondary}>
            {meta}
          </AppText>
        ) : null}
      </View>
    </>
  );

  if (onPress) {
    return (
      <PressableScale onPress={onPress} style={[row, style]}>
        {content}
      </PressableScale>
    );
  }

  return <View style={[row, style]}>{content}</View>;
}
