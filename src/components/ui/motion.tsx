import { useEffect, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { AppText, type AppTextProps } from './text';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type RevealProps = {
  children: ReactNode;
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
};

/** A quiet entrance used to give each section a deliberate arrival. */
export function Reveal({ children, delay = 0, distance = 16, style }: RevealProps) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(
      withTiming(1, {
        duration: reduced ? 0 : 520,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
        reduceMotion: ReduceMotion.System,
      }),
    );
  }, [progress, reduced]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ translateY: reduced ? 0 : (1 - progress.get()) * distance }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

type PressableScaleProps = PressableProps & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  pressedScale?: number;
};

/** Press feedback on the UI thread; full-width rows should keep the default 1. */
export function PressableScale({
  children,
  style,
  pressedScale = 0.975,
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      <Pressable
        disabled={disabled}
        onPressIn={(event) => {
          scale.set(
            withSpring(disabled ? 1 : pressedScale, {
              duration: 180,
              dampingRatio: 1,
              reduceMotion: ReduceMotion.System,
            }),
          );
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          scale.set(
            withSpring(1, {
              duration: 220,
              dampingRatio: 1,
              reduceMotion: ReduceMotion.System,
            }),
          );
          onPressOut?.(event);
        }}
        {...rest}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

type AnimatedNumberProps = {
  value: number;
  format?: (value: number) => string;
  variant?: AppTextProps['variant'];
  color?: string;
  duration?: number;
  style?: AppTextProps['style'];
};

/**
 * Settles the final value into place with a native-driven fade and lift.
 * The old implementation counted every frame on the JavaScript thread; this
 * keeps the value readable immediately and the motion on the UI thread.
 */
export function AnimatedNumber({
  value,
  format = (next) => String(Math.round(next)),
  variant = 'numeric',
  color,
  duration = 420,
  style,
}: AnimatedNumberProps) {
  const reduced = useReducedMotion();
  const settle = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      settle.set(1);
      return;
    }
    settle.set(0);
    settle.set(
      withTiming(1, {
        duration,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
        reduceMotion: ReduceMotion.System,
      }),
    );
  }, [duration, reduced, settle, value]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + settle.get() * 0.45,
    transform: [{ translateY: (1 - settle.get()) * 4 }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <AppText color={color} style={style} variant={variant}>
        {format(value)}
      </AppText>
    </Animated.View>
  );
}

type AnimatedBarProps = {
  progress: number;
  color: string;
  trackColor: string;
  height?: number;
  delay?: number;
  label?: string;
};

/** A percentage bar that fills from zero with a measured, non-layout animation. */
export function AnimatedBar({
  progress,
  color,
  trackColor,
  height = 6,
  delay = 0,
  label,
}: AnimatedBarProps) {
  const reduced = useReducedMotion();
  const fill = useSharedValue(0);
  const clamped = Math.min(100, Math.max(0, Number.isFinite(progress) ? progress : 0));

  useEffect(() => {
    fill.set(
      withDelay(
        reduced ? 0 : delay,
        withTiming(clamped, {
          duration: reduced ? 0 : 720,
          easing: Easing.bezier(0.23, 1, 0.32, 1),
          reduceMotion: ReduceMotion.System,
        }),
      ),
    );
  }, [clamped, delay, fill, reduced]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: fill.get() / 100 }],
  }));

  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped) }}
      style={{ height, borderRadius: height / 2, backgroundColor: trackColor, overflow: 'hidden' }}>
      <Animated.View
        style={[
          {
            width: '100%',
            height,
            borderRadius: height / 2,
            backgroundColor: color,
            transformOrigin: 'left center',
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

type AnimatedRingProps = {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  trackColor: string;
  children?: ReactNode;
  label?: string;
};

export function AnimatedRing({
  progress,
  size = 112,
  strokeWidth = 9,
  color,
  trackColor,
  children,
  label,
}: AnimatedRingProps) {
  const reduced = useReducedMotion();
  const clamped = Math.min(100, Math.max(0, Number.isFinite(progress) ? progress : 0));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const value = useSharedValue(reduced ? clamped : 0);

  useEffect(() => {
    value.set(
      withTiming(clamped, {
        duration: reduced ? 0 : 900,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
        reduceMotion: ReduceMotion.System,
      }),
    );
  }, [clamped, reduced, value]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - value.get() / 100),
  }));

  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped) }}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg height={size} style={StyleSheet.absoluteFill} width={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <AnimatedCircle
          animatedProps={animatedProps}
          cx={size / 2}
          cy={size / 2}
          fill="none"
          origin={`${size / 2}, ${size / 2}`}
          r={radius}
          rotation={-90}
          stroke={color}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
        />
      </Svg>
      {children}
    </View>
  );
}

type ShimmerProps = {
  width: number;
  height: number;
  radius: number;
  baseColor: string;
  highlightColor: string;
};

/** A light sweep for skeletons, driven by Reanimated rather than JS timers. */
export function Shimmer({ width, height, radius, baseColor, highlightColor }: ShimmerProps) {
  const reduced = useReducedMotion();
  const sweep = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    sweep.set(
      withRepeat(
        withTiming(1, {
          duration: 1300,
          easing: Easing.linear,
          reduceMotion: ReduceMotion.System,
        }),
        -1,
        false,
      ),
    );
  }, [reduced, sweep]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(sweep.get(), [0, 1], [-width, width]) }],
  }));

  return (
    <View
      style={{
        width,
        height,
        borderRadius: radius,
        backgroundColor: baseColor,
        overflow: 'hidden',
      }}>
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <View
          style={{
            width: width * 0.55,
            height,
            backgroundColor: highlightColor,
            opacity: 0.9,
            transform: [{ skewX: '-18deg' }],
          }}
        />
      </Animated.View>
    </View>
  );
}
