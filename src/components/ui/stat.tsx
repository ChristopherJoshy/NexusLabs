import { View } from 'react-native';

import { useTheme } from '@/theme';
import { AppText } from './text';

type StatProps = {
  label: string;
  value: string;
  hint?: string;
  color?: string;
  labelColor?: string;
  align?: 'left' | 'center';
  flex?: number;
};

export function Stat({
  label,
  value,
  hint,
  color,
  labelColor,
  align = 'left',
  flex = 1,
}: StatProps) {
  const theme = useTheme();

  return (
    <View style={{ flex, gap: 3, alignItems: align === 'center' ? 'center' : 'flex-start' }}>
      <AppText variant="label" color={labelColor ?? theme.colors.textMuted}>
        {label}
      </AppText>
      <AppText
        style={{
          fontSize: 24,
          lineHeight: 28,
          fontFamily: theme.fonts.extrabold,
          letterSpacing: -0.9,
          fontVariant: ['tabular-nums'],
        }}
        color={color ?? theme.colors.text}>
        {value}
      </AppText>
      {hint ? (
        <AppText variant="caption" color={labelColor ?? theme.colors.textMuted}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}
