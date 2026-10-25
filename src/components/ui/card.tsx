import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useTheme } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type CardProps = {
  children: ReactNode;
  padded?: boolean;
  tone?: 'default' | 'sunken' | 'primary' | 'ink' | 'accent';
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

type PressableCardProps = Pick<
  CardProps,
  'children' | 'style' | 'accessibilityLabel' | 'accessibilityHint' | 'onPress'
> & {
  base: ViewStyle;
};

function PressableCard({
  children,
  style,
  accessibilityLabel,
  accessibilityHint,
  onPress,
  base,
}: PressableCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  return (
    <AnimatedPressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={() => {
        scale.set(
          withSpring(0.985, {
            duration: 180,
            dampingRatio: 1,
            reduceMotion: ReduceMotion.System,
          }),
        );
      }}
      onPressOut={() => {
        scale.set(
          withSpring(1, {
            duration: 220,
            dampingRatio: 1,
            reduceMotion: ReduceMotion.System,
          }),
        );
      }}
      style={[base, style, animatedStyle]}>
      {children}
    </AnimatedPressable>
  );
}

export function Card({
  children,
  padded = true,
  tone = 'default',
  onPress,
  style,
  accessibilityLabel,
  accessibilityHint,
}: CardProps) {
  const theme = useTheme();

  const background =
    tone === 'ink'
      ? theme.colors.hero
      : tone === 'accent'
        ? theme.colors.accentSoft
        : tone === 'primary'
          ? theme.colors.primarySoft
          : tone === 'sunken'
            ? theme.colors.surfaceSunken
            : theme.colors.surface;

  const base: ViewStyle = {
    backgroundColor: background,
    borderRadius: tone === 'ink' ? theme.radii.lg : theme.radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor:
      tone === 'ink'
        ? theme.colors.heroBorder
        : onPress
          ? theme.colors.controlBorder
          : tone === 'accent'
            ? theme.colors.accentSoft
            : theme.colors.border,
    padding: padded ? (tone === 'ink' ? theme.spacing.xl : theme.spacing.lg) : 0,
  };

  if (!onPress) {
    return <View style={[base, style]}>{children}</View>;
  }

  return (
    <PressableCard
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      base={base}
      onPress={onPress}
      style={style}>
      {children}
    </PressableCard>
  );
}
