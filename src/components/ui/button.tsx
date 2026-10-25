import {
  ActivityIndicator,
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
import * as Haptics from 'expo-haptics';
import type { LucideIcon } from 'lucide-react-native';

import { useSettings } from '@/stores/settings';
import { useTheme } from '@/theme';
import { AppText } from './text';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Variant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'sm';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  iconPosition?: 'leading' | 'trailing';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  haptic?: boolean;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'leading',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  haptic = true,
}: ButtonProps) {
  const theme = useTheme();
  const hapticsEnabled = useSettings((state) => state.hapticsEnabled);
  const scale = useSharedValue(1);
  const isDisabled = disabled || loading;

  const palette = {
    primary: {
      background: theme.colors.primary,
      pressed: theme.colors.primaryPressed,
      text: theme.colors.textInverse,
      border: theme.colors.primary,
    },
    accent: {
      background: theme.colors.accent,
      pressed: theme.colors.accentPressed,
      text: theme.colors.onAccent,
      border: theme.colors.accent,
    },
    secondary: {
      background: theme.colors.surfaceSunken,
      pressed: theme.colors.backgroundAlt,
      text: theme.colors.text,
      border: theme.colors.controlBorder,
    },
    ghost: {
      background: 'transparent',
      pressed: theme.colors.surfaceSunken,
      text: theme.colors.text,
      border: 'transparent',
    },
    danger: {
      background: theme.colors.dangerSoft,
      pressed: theme.colors.dangerSoft,
      text: theme.colors.danger,
      border: theme.colors.dangerSoft,
    },
  }[variant];

  const height = size === 'md' ? 54 : 42;
  const horizontal = size === 'md' ? theme.spacing.xl : theme.spacing.lg;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  const Icon = icon;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={() => {
        if (hapticsEnabled && haptic) {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
        }
        onPress();
      }}
      onPressIn={() => {
        scale.set(
          withSpring(0.975, {
            duration: 160,
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
      style={[
        {
          height,
          borderRadius: theme.radii.pill,
          paddingHorizontal: horizontal,
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          backgroundColor: palette.background,
          borderWidth: variant === 'ghost' ? 0 : StyleSheet.hairlineWidth,
          borderColor: palette.border,
          opacity: isDisabled ? 0.5 : 1,
        },
        animatedStyle,
        style,
      ]}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.spacing.sm,
        }}>
        {loading ? (
          <ActivityIndicator color={palette.text} size="small" />
        ) : Icon && iconPosition === 'leading' ? (
          <Icon color={palette.text} size={18} strokeWidth={2.2} />
        ) : null}
        <AppText
          numberOfLines={1}
          style={{
            fontSize: size === 'md' ? 15 : 13.5,
            fontFamily: theme.fonts.semibold,
            letterSpacing: -0.1,
          }}
          color={palette.text}>
          {label}
        </AppText>
        {!loading && Icon && iconPosition === 'trailing' ? (
          <Icon color={palette.text} size={18} strokeWidth={2.2} />
        ) : null}
      </View>
    </AnimatedPressable>
  );
}
