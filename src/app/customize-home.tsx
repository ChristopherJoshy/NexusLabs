import { Pressable, StyleSheet, Switch, View } from 'react-native';
import {
  CalendarClock,
  ChartPie,
  ClipboardList,
  Megaphone,
  MoveDown,
  MoveUp,
  type LucideIcon,
} from 'lucide-react-native';

import { AppText, Card, Screen, ScreenHeader } from '@/components/ui';
import type { HomeModule } from '@/stores/settings';
import { useSettings } from '@/stores/settings';
import { useTheme } from '@/theme';

type ModuleDefinition = {
  id: HomeModule;
  title: string;
  icon: LucideIcon;
};

const MODULES: ModuleDefinition[] = [
  { id: 'attendance', title: 'Attendance', icon: ChartPie },
  { id: 'schedule', title: 'Today’s schedule', icon: CalendarClock },
  { id: 'assignments', title: 'Assignments', icon: ClipboardList },
  { id: 'notices', title: 'Notices', icon: Megaphone },
];

function MoveButton({
  label,
  icon: Icon,
  disabled,
  onPress,
}: {
  label: string;
  icon: LucideIcon;
  disabled: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 34,
        height: 34,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.28 : pressed ? 0.6 : 1,
      })}>
      <Icon color={theme.colors.textSecondary} size={17} strokeWidth={2.2} />
    </Pressable>
  );
}

export default function CustomizeHomeScreen() {
  const theme = useTheme();
  const homeModules = useSettings((state) => state.homeModules);
  const toggleHomeModule = useSettings((state) => state.toggleHomeModule);
  const moveHomeModule = useSettings((state) => state.moveHomeModule);
  const enabled = new Set(homeModules);
  const orderedModules = MODULES.filter((item) => enabled.has(item.id)).sort(
    (a, b) => homeModules.indexOf(a.id) - homeModules.indexOf(b.id),
  );
  const hiddenModules = MODULES.filter((item) => !enabled.has(item.id));
  const onlyOne = orderedModules.length === 1;

  return (
    <Screen scroll>
      <ScreenHeader back title="Home layout" />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: theme.spacing.lg,
        }}>
        <AppText variant="h3">Visible</AppText>
        <AppText variant="caption" color={theme.colors.textMuted}>
          {orderedModules.length} of {MODULES.length}
        </AppText>
      </View>

      <Card padded={false}>
        {orderedModules.map((module, index) => {
          const Icon = module.icon;
          return (
            <View
              key={module.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing.md,
                paddingHorizontal: theme.spacing.lg,
                paddingVertical: theme.spacing.lg,
                borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
                borderTopColor: theme.colors.border,
              }}>
              <Icon color={theme.colors.textSecondary} size={19} strokeWidth={1.9} />
              <AppText style={{ flex: 1 }} variant="bodyMedium">
                {module.title}
              </AppText>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <MoveButton
                  disabled={index === 0}
                  icon={MoveUp}
                  label={`Move ${module.title} up`}
                  onPress={() => moveHomeModule(module.id, -1)}
                />
                <MoveButton
                  disabled={index === orderedModules.length - 1}
                  icon={MoveDown}
                  label={`Move ${module.title} down`}
                  onPress={() => moveHomeModule(module.id, 1)}
                />
              </View>
              <Switch
                accessibilityLabel={`Show ${module.title} on home`}
                disabled={onlyOne}
                onValueChange={() => toggleHomeModule(module.id)}
                thumbColor={theme.colors.textInverse}
                trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
                value
              />
            </View>
          );
        })}
      </Card>

      {hiddenModules.length > 0 ? (
        <>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: theme.spacing.xxl,
              marginBottom: theme.spacing.lg,
            }}>
            <AppText variant="h3">Hidden</AppText>
            <AppText variant="caption" color={theme.colors.textMuted}>
              {hiddenModules.length}
            </AppText>
          </View>

          <Card padded={false}>
            {hiddenModules.map((module, index) => {
              const Icon = module.icon;
              return (
                <View
                  key={module.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.spacing.md,
                    paddingHorizontal: theme.spacing.lg,
                    paddingVertical: theme.spacing.lg,
                    borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
                    borderTopColor: theme.colors.border,
                  }}>
                  <Icon color={theme.colors.textMuted} size={19} strokeWidth={1.9} />
                  <AppText style={{ flex: 1 }} variant="bodyMedium">
                    {module.title}
                  </AppText>
                  <Switch
                    accessibilityLabel={`Show ${module.title} on home`}
                    onValueChange={() => toggleHomeModule(module.id)}
                    thumbColor={theme.colors.textMuted}
                    trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
                    value={false}
                  />
                </View>
              );
            })}
          </Card>
        </>
      ) : null}

      {onlyOne ? (
        <AppText
          align="center"
          color={theme.colors.textMuted}
          style={{ marginTop: theme.spacing.xl }}
          variant="caption">
          At least one module stays on Home.
        </AppText>
      ) : null}
    </Screen>
  );
}
