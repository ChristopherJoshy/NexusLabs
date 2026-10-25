import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';
import { AppText } from './text';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'accent';

type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  icon?: ReactNode;
  dot?: boolean;
};

export function Badge({ label, tone = 'neutral', icon, dot = false }: BadgeProps) {
  const theme = useTheme();

  const palette = {
    neutral: {
      background: theme.colors.surfaceSunken,
      text: theme.colors.textSecondary,
      border: theme.colors.border,
    },
    primary: {
      background: theme.colors.primary,
      text: theme.colors.textInverse,
      border: theme.colors.primary,
    },
    success: {
      background: theme.colors.successSoft,
      text: theme.colors.success,
      border: theme.colors.borderStrong,
    },
    warning: {
      background: theme.colors.warningSoft,
      text: theme.colors.warning,
      border: theme.colors.borderStrong,
    },
    danger: {
      background: theme.colors.dangerSoft,
      text: theme.colors.danger,
      border: theme.colors.danger,
    },
    accent: {
      background: theme.colors.accent,
      text: theme.colors.onAccent,
      border: theme.colors.accent,
    },
  }[tone];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 5,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 5,
        borderRadius: theme.radii.pill,
        backgroundColor: palette.background,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: palette.border,
      }}>
      {dot ? (
        <View
          style={{
            width: 5,
            height: 5,
            borderRadius: 2.5,
            backgroundColor: palette.text,
          }}
        />
      ) : null}
      {icon}
      <AppText
        numberOfLines={1}
        style={{ fontSize: 11.5, fontFamily: theme.fonts.semibold, letterSpacing: 0.05 }}
        color={palette.text}>
        {label}
      </AppText>
    </View>
  );
}
