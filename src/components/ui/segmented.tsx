import { useEffect, useState } from 'react';
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

type Option<T extends string> = {
  value: T;
  label: string;
  count?: number;
};

type SegmentedProps<T extends string> = {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const hapticsEnabled = useSettings((state) => state.hapticsEnabled);
  const [width, setWidth] = useState(0);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const itemWidth = width > 0 ? (width - 8) / options.length : 0;
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.set(
      withSpring(selectedIndex * itemWidth, {
        duration: reduced ? 0 : 320,
        dampingRatio: 0.86,
        reduceMotion: ReduceMotion.System,
      }),
    );
  }, [itemWidth, reduced, selectedIndex, translateX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.get() }],
  }));

  return (
    <View
      accessibilityRole="tablist"
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{
        flexDirection: 'row',
        backgroundColor: theme.colors.surfaceSunken,
        borderRadius: theme.radii.pill,
        padding: 4,
        position: 'relative',
      }}>
      {itemWidth > 0 ? (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 4,
              bottom: 4,
              left: 4,
              width: itemWidth,
              borderRadius: theme.radii.pill,
              backgroundColor: theme.colors.primary,
            },
            indicatorStyle,
          ]}
        />
      ) : null}
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            accessibilityLabel={
              typeof option.count === 'number'
                ? `${option.label}, ${option.count}`
                : option.label
            }
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            key={option.value}
            onPress={() => {
              if (selected) return;
              if (hapticsEnabled) {
                void Haptics.selectionAsync().catch(() => undefined);
              }
              onChange(option.value);
            }}
            style={{
              flex: 1,
              height: 38,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 5,
              zIndex: 1,
            }}>
            <AppText
              numberOfLines={1}
              style={{ fontFamily: selected ? theme.fonts.semibold : theme.fonts.medium, fontSize: 13 }}
              color={selected ? theme.colors.textInverse : theme.colors.textMuted}>
              {option.label}
            </AppText>
            {typeof option.count === 'number' ? (
              <View
                style={{
                  minWidth: 18,
                  height: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <AppText
                  style={{
                    fontSize: 10,
                    fontFamily: theme.fonts.bold,
                    fontVariant: ['tabular-nums'],
                    opacity: selected ? 0.65 : 1,
                  }}
                  color={selected ? theme.colors.textInverse : theme.colors.textMuted}>
                  {option.count}
                </AppText>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
