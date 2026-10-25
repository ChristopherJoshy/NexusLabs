import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import * as Haptics from 'expo-haptics';
import {
  CalendarDays,
  ChartPie,
  Circle,
  ClipboardList,
  House,
  LayoutGrid,
  type LucideIcon,
} from 'lucide-react-native';

import { useSettings } from '@/stores/settings';
import { useTheme } from '@/theme';
import { AppText } from './text';

type TabMeta = {
  label: string;
  icon: LucideIcon;
};

const TAB_META: Record<string, TabMeta> = {
  home: { label: 'Home', icon: House },
  attendance: { label: 'Attendance', icon: ChartPie },
  timetable: { label: 'Timetable', icon: CalendarDays },
  assignments: { label: 'Assignments', icon: ClipboardList },
  more: { label: 'More', icon: LayoutGrid },
};

function TabItem({
  meta,
  focused,
  onPress,
  onLongPress,
  activeIconColor,
}: {
  meta: TabMeta;
  focused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  activeIconColor: string;
}) {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const scale = useSharedValue(focused ? 1 : 0.92);

  useEffect(() => {
    scale.set(
      withSpring(focused ? 1.06 : 0.92, {
        duration: reduced ? 0 : 320,
        dampingRatio: 0.7,
        reduceMotion: ReduceMotion.System,
      }),
    );
  }, [focused, reduced, scale]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  const Icon = meta.icon;

  return (
    <Pressable
      accessibilityLabel={meta.label}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      onLongPress={onLongPress}
      onPress={onPress}
      style={styles.item}>
      <Animated.View style={iconStyle}>
        <Icon
          color={focused ? activeIconColor : theme.colors.textMuted}
          size={21}
          strokeWidth={focused ? 2.25 : 1.9}
        />
      </Animated.View>
      <AppText
        numberOfLines={1}
        style={{
          fontSize: 9.5,
          lineHeight: 12,
          fontFamily: focused ? theme.fonts.bold : theme.fonts.medium,
          letterSpacing: 0.1,
        }}
        color={focused ? theme.colors.textInverse : theme.colors.textMuted}>
        {meta.label}
      </AppText>
    </Pressable>
  );
}

export function TabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const hapticsEnabled = useSettings((state) => state.hapticsEnabled);
  const [barWidth, setBarWidth] = useState(0);
  const itemWidth = barWidth > 0 ? (barWidth - 12) / state.routes.length : 0;
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.set(
      withSpring(state.index * itemWidth, {
        duration: reduced ? 0 : 380,
        dampingRatio: 0.84,
        reduceMotion: ReduceMotion.System,
      }),
    );
  }, [itemWidth, reduced, state.index, translateX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.get() }],
  }));

  const activeIconColor = theme.colors.textInverse;

  return (
    <View
      style={{
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.sm,
        paddingBottom: Math.max(insets.bottom, theme.spacing.md),
        backgroundColor: theme.colors.background,
      }}>
      <View
        onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}
        style={[
          styles.bar,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.xl,
          },
        ]}>
        {itemWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                top: 6,
                bottom: 6,
                left: 6,
                width: itemWidth,
                borderRadius: theme.radii.lg,
                backgroundColor: theme.colors.primary,
              },
              indicatorStyle,
            ]}
          />
        ) : null}
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const meta = TAB_META[route.name] ?? {
            label: descriptors[route.key]?.options.title ?? route.name,
            icon: Circle,
          };

          return (
            <TabItem
              activeIconColor={activeIconColor}
              focused={focused}
              key={route.key}
              meta={meta}
              onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
              onPress={() => {
                const event = emitter.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  if (hapticsEnabled) {
                    void Haptics.selectionAsync().catch(() => undefined);
                  }
                  navigateToTab(route.key);
                }
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    padding: 6,
    position: 'relative',
  },
  item: {
    flex: 1,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    zIndex: 1,
  },
});
