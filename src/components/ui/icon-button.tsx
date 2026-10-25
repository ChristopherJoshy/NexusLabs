import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type { LucideIcon } from 'lucide-react-native';

import { useTheme } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type IconButtonProps = {
  icon: LucideIcon;
  onPress: () => void;
  label: string;
  size?: number;
  tone?: 'default' | 'primary' | 'danger' | 'ghost';
  disabled?: boolean;
  background?: boolean;
};

export function IconButton({
  icon: Icon,
  onPress,
  label,
  size = 20,
  tone = 'ghost',
  disabled = false,
  background = false,
}: IconButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const tint =
    tone === 'primary'
      ? theme.colors.accent
      : tone === 'danger'
        ? theme.colors.danger
        : tone === 'ghost'
          ? theme.colors.textSecondary
          : theme.colors.text;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  return (
    <AnimatedPressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      onPressIn={() => {
        scale.set(
          withSpring(0.92, {
            duration: 140,
            dampingRatio: 1,
            reduceMotion: ReduceMotion.System,
          }),
        );
      }}
      onPressOut={() => {
        scale.set(
          withSpring(1, {
            duration: 200,
            dampingRatio: 1,
            reduceMotion: ReduceMotion.System,
          }),
        );
      }}
      style={[
        {
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: background ? theme.colors.surface : 'transparent',
          borderWidth: background ? StyleSheet.hairlineWidth : 0,
          borderColor: theme.colors.controlBorder,
          opacity: disabled ? 0.45 : 1,
        },
        animatedStyle,
      ]}>
      <Icon color={tint} size={size} strokeWidth={2} />
    </AnimatedPressable>
  );
}
