import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme';
import { AnimatedRing } from './motion';

type ProgressRingProps = {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  children?: ReactNode;
  label?: string;
};

export function ProgressRing({
  progress,
  size = 92,
  strokeWidth = 9,
  color,
  trackColor,
  children,
  label,
}: ProgressRingProps) {
  const theme = useTheme();

  return (
    <View>
      <AnimatedRing
        color={color ?? theme.colors.accent}
        label={label}
        progress={progress}
        size={size}
        strokeWidth={strokeWidth}
        trackColor={trackColor ?? theme.colors.border}
      />
      {children ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {children}
        </View>
      ) : null}
    </View>
  );
}
