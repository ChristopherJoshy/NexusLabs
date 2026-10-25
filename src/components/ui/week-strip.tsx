import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useSettings } from '@/stores/settings';
import { useTheme } from '@/theme';
import { AppText } from './text';

export type WeekStripDay = {
  key: string;
  weekday: string;
  day: string;
  isToday?: boolean;
  hasItems?: boolean;
  disabled?: boolean;
};

type WeekStripProps = {
  days: WeekStripDay[];
  selectedKey: string;
  onSelect: (key: string) => void;
};

function DayCell({
  day,
  selected,
  onPress,
}: {
  day: WeekStripDay;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const fill = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    fill.set(
      withSpring(selected ? 1 : 0, {
        duration: reduced ? 0 : 300,
        dampingRatio: 0.8,
        reduceMotion: ReduceMotion.System,
      }),
    );
  }, [fill, reduced, selected]);

  const fillStyle = useAnimatedStyle(() => ({
    opacity: fill.get(),
    transform: [{ scale: 0.86 + fill.get() * 0.14 }],
  }));

  const marker = selected
    ? theme.colors.onAccent
    : day.isToday
      ? theme.colors.accent
      : day.hasItems
        ? theme.colors.borderStrong
        : 'transparent';

  return (
    <Pressable
      accessibilityLabel={`${day.weekday} ${day.day}${day.isToday ? ', today' : ''}`}
      accessibilityRole="tab"
      accessibilityState={{ selected, disabled: day.disabled }}
      disabled={day.disabled}
      onPress={onPress}
      style={{ flex: 1, alignItems: 'center' }}>
      <View
        style={{
          width: '100%',
          height: 66,
          borderRadius: theme.radii.md,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          opacity: day.disabled ? 0.4 : 1,
        }}>
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              borderRadius: theme.radii.md,
              backgroundColor: theme.colors.accent,
            },
            fillStyle,
          ]}
        />
        <AppText
          style={{
            fontSize: 9.5,
            lineHeight: 12,
            fontFamily: theme.fonts.bold,
            letterSpacing: 0.8,
          }}
          color={selected ? theme.colors.onAccent : theme.colors.textMuted}>
          {day.weekday}
        </AppText>
        <AppText
          style={{
            fontSize: 18,
            lineHeight: 21,
            fontFamily: theme.fonts.extrabold,
            fontVariant: ['tabular-nums'],
            letterSpacing: -0.5,
          }}
          color={selected ? theme.colors.onAccent : theme.colors.text}>
          {day.day}
        </AppText>
        <View
          style={{
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: marker,
            marginTop: 2,
          }}
        />
      </View>
    </Pressable>
  );
}

export function WeekStrip({ days, selectedKey, onSelect }: WeekStripProps) {
  const theme = useTheme();
  const hapticsEnabled = useSettings((state) => state.hapticsEnabled);

  return (
    <View
      accessibilityRole="tablist"
      style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
      {days.map((day) => (
        <DayCell
          day={day}
          key={day.key}
          onPress={() => {
            if (day.disabled || day.key === selectedKey) return;
            if (hapticsEnabled) {
              void Haptics.selectionAsync().catch(() => undefined);
            }
            onSelect(day.key);
          }}
          selected={day.key === selectedKey}
        />
      ))}
    </View>
  );
}
