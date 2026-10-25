import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, View } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import {
  Bell,
  BookOpen,
  CalendarRange,
  ChevronRight,
  Clock3,
  Globe2,
  GraduationCap,
  Heart,
  Info,
  LayoutDashboard,
  LogOut,
  Megaphone,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Vibrate,
  type LucideIcon,
} from 'lucide-react-native';

import {
  AppText,
  Avatar,
  Badge,
  Button,
  Card,
  Reveal,
  Screen,
  ScreenHeader,
  Segmented,
  Stat,
} from '@/components/ui';
import { isSubmitted, useAssignments, useAttendance, useDashboard } from '@/hooks/use-etlab';
import { getPhotoUrl, toNumberOrNull } from '@/lib/api/etlab';
import {
  clearAssignmentReminders,
  requestAssignmentReminderPermission,
  syncAssignmentReminders,
} from '@/lib/notifications';
import { studyProgress, useProgress } from '@/stores/progress';
import { useAuth, useSession } from '@/stores/auth';
import { useSettings, type ThemeMode } from '@/stores/settings';
import { useTheme } from '@/theme';

const TARGETS = [70, 75, 80, 85, 90] as const;
const THEME_OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const;

type Tool = {
  icon: LucideIcon;
  label: string;
  route: '/results' | '/fees' | '/leave' | '/materials' | '/notices';
};

const TOOLS: Tool[] = [
  { icon: GraduationCap, label: 'Results', route: '/results' },
  { icon: ReceiptText, label: 'Fees', route: '/fees' },
  { icon: CalendarRange, label: 'Leave', route: '/leave' },
  { icon: BookOpen, label: 'Materials', route: '/materials' },
  { icon: Megaphone, label: 'Notices', route: '/notices' },
];

function ToolRow({
  tool,
  last,
  onPress,
}: {
  tool: Tool;
  last: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const Icon = tool.icon;

  return (
    <Pressable
      accessibilityLabel={tool.label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.lg,
        borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border,
        opacity: pressed ? 0.62 : 1,
      })}>
      <Icon color={theme.colors.textSecondary} size={19} strokeWidth={1.9} />
      <AppText style={{ flex: 1 }} variant="bodyMedium">
        {tool.label}
      </AppText>
      <ChevronRight color={theme.colors.textMuted} size={17} strokeWidth={1.8} />
    </Pressable>
  );
}

function SwitchRow({
  icon: Icon,
  label,
  value,
  onValueChange,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  const theme = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
      <Icon color={theme.colors.textSecondary} size={19} strokeWidth={1.9} />
      <AppText style={{ flex: 1 }} variant="bodyMedium">
        {label}
      </AppText>
      <Switch
        accessibilityLabel={label}
        disabled={disabled}
        onValueChange={onValueChange}
        thumbColor={value ? theme.colors.textInverse : theme.colors.textMuted}
        trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
        value={value}
      />
    </View>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  onPress,
  last = false,
}: {
  icon: LucideIcon;
  label: string;
  value?: string;
  onPress?: () => void;
  last?: boolean;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityLabel={value ? `${label}, ${value}` : label}
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.lg,
        borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border,
        opacity: pressed ? 0.62 : 1,
      })}>
      <Icon color={theme.colors.textSecondary} size={19} strokeWidth={1.9} />
      <AppText style={{ flex: 1 }} variant="bodyMedium">
        {label}
      </AppText>
      {value ? (
        <AppText numberOfLines={1} style={{ maxWidth: '48%' }} variant="caption" color={theme.colors.textMuted}>
          {value}
        </AppText>
      ) : null}
      {onPress ? <ChevronRight color={theme.colors.textMuted} size={17} strokeWidth={1.8} /> : null}
    </Pressable>
  );
}

export default function MoreScreen() {
  const theme = useTheme();
  const session = useSession();
  const signOut = useAuth((state) => state.signOut);
  const dashboard = useDashboard();
  const attendance = useAttendance();
  const assignments = useAssignments();
  const themeMode = useSettings((state) => state.themeMode);
  const setThemeMode = useSettings((state) => state.setThemeMode);
  const target = useSettings((state) => state.attendanceTarget);
  const setAttendanceTarget = useSettings((state) => state.setAttendanceTarget);
  const hapticsEnabled = useSettings((state) => state.hapticsEnabled);
  const setHapticsEnabled = useSettings((state) => state.setHapticsEnabled);
  const remindersEnabled = useSettings((state) => state.assignmentRemindersEnabled);
  const setRemindersEnabled = useSettings((state) => state.setAssignmentRemindersEnabled);
  const studyDates = useProgress((state) => state.studyDates);
  const logToday = useProgress((state) => state.logToday);
  const [remindersBusy, setRemindersBusy] = useState(false);

  const profile = session.profile;
  const name = profile.profileName?.trim() || 'SJCET student';
  const photo = getPhotoUrl(session);
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const progress = studyProgress(studyDates);
  const attendanceRows = attendance.data?.subjects ?? [];
  const parsedAttendance = attendanceRows.map((subject) => ({
    attended: toNumberOrNull(subject.class_attended),
    total: toNumberOrNull(subject.total_classes),
  }));
  const hasAttendanceCounts =
    parsedAttendance.length > 0 &&
    parsedAttendance.every((item) => item.attended !== null && item.total !== null);
  const attendedClasses = hasAttendanceCounts
    ? parsedAttendance.reduce((sum, item) => sum + (item.attended ?? 0), 0)
    : null;
  const submittedCount = assignments.data?.filter(isSubmitted).length ?? null;

  const setAssignmentReminders = async (enabled: boolean) => {
    if (remindersBusy) return;
    setRemindersBusy(true);
    try {
      if (!enabled) {
        setRemindersEnabled(false);
        await clearAssignmentReminders();
        return;
      }
      const granted = await requestAssignmentReminderPermission();
      if (!granted) {
        Alert.alert(
          'Notifications are off',
          'Allow notifications in Android settings to receive on-device assignment reminders.',
        );
        return;
      }
      setRemindersEnabled(true);
      await syncAssignmentReminders(assignments.data ?? []);
    } catch {
      Alert.alert(
        'Could not update reminders',
        'Check notification permission in Android settings and try again.',
      );
    } finally {
      setRemindersBusy(false);
    }
  };

  const confirmSignOut = () => {
    Alert.alert(
      'Sign out?',
      'Your session, cached academic data, local study progress, and scheduled reminders will be removed from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: () => {
            void signOut().then(() => router.replace('/login'));
          },
        },
      ],
    );
  };

  const profileBadges = [
    profile.semName,
    profile.academicYear,
    dashboard.data?.rollNo ? `Roll ${dashboard.data.rollNo}` : null,
  ].filter((value): value is string => Boolean(value));

  return (
    <Screen scroll>
      <ScreenHeader title="More" />

      <Reveal delay={40}>
        <Card padded={false} style={{ overflow: 'hidden' }} tone="ink">
          <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg }}>
              <Avatar
                name={name}
                ringColor={theme.colors.heroBorder}
                size={66}
                uri={photo}
              />
              <View style={{ flex: 1, gap: 3 }}>
                <AppText
                  numberOfLines={2}
                  style={{ fontFamily: theme.fonts.serif, fontSize: 30, lineHeight: 31 }}
                  color={theme.colors.heroText}>
                  {name}
                </AppText>
                <AppText numberOfLines={2} variant="caption" color={theme.colors.heroMuted}>
                  {profile.course ?? 'SJCET Palai'}
                </AppText>
              </View>
            </View>

            {profileBadges.length > 0 ? (
              <AppText numberOfLines={1} variant="caption" color={theme.colors.heroMuted}>
                {profileBadges.join(' · ')}
              </AppText>
            ) : null}
          </View>
        </Card>
      </Reveal>

      <Reveal delay={90}>
        <View style={{ marginTop: theme.spacing.xxl }}>
          <AppText style={{ marginBottom: theme.spacing.lg }} variant="h3">
            Progress
          </AppText>
          <Card style={{ gap: theme.spacing.lg }}>
            <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
              <Stat
                hint="Etlab"
                label="Attended"
                value={attendedClasses === null ? '—' : String(attendedClasses)}
              />
              <View style={{ width: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border }} />
              <Stat
                hint="Etlab"
                label="Submitted"
                value={submittedCount === null ? '—' : String(submittedCount)}
              />
              <View style={{ width: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border }} />
              <Stat hint="Local" label="Streak" value={`${progress.currentStreak}d`} />
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing.md,
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: theme.colors.border,
                paddingTop: theme.spacing.lg,
              }}>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="bodyMedium">
                  {progress.loggedToday ? 'Today’s session logged' : 'Log a study session'}
                </AppText>
                <AppText variant="caption" color={theme.colors.textMuted}>
                  {progress.sessionsThisWeek} local{' '}
                  {progress.sessionsThisWeek === 1 ? 'session' : 'sessions'} this week
                </AppText>
              </View>
              <Button
                disabled={progress.loggedToday}
                fullWidth={false}
                label={progress.loggedToday ? 'Logged' : 'Log today'}
                onPress={logToday}
                size="sm"
                variant="secondary"
              />
            </View>

            {progress.currentStreak >= 3 ? (
              <View style={{ alignSelf: 'flex-start' }}>
                <Badge
                  icon={<Sparkles color={theme.colors.success} size={12} strokeWidth={2} />}
                  label={`${progress.currentStreak}-day study streak`}
                  tone="success"
                />
              </View>
            ) : null}
          </Card>
        </View>
      </Reveal>

      <Reveal delay={140}>
        <View style={{ marginTop: theme.spacing.xxl }}>
          <AppText style={{ marginBottom: theme.spacing.lg }} variant="h3">
            Records
          </AppText>
          <Card padded={false}>
            {TOOLS.map((tool, index) => (
              <ToolRow
                key={tool.route}
                last={index === TOOLS.length - 1}
                onPress={() => router.push(tool.route)}
                tool={tool}
              />
            ))}
          </Card>
        </View>
      </Reveal>

      <Reveal delay={190}>
        <View style={{ marginTop: theme.spacing.xxl }}>
          <AppText style={{ marginBottom: theme.spacing.lg }} variant="h3">
            Preferences
          </AppText>
          <Card style={{ gap: theme.spacing.lg }}>
            <View style={{ gap: theme.spacing.sm }}>
              <AppText variant="bodyMedium">Appearance</AppText>
              <Segmented
                onChange={(value) => setThemeMode(value as ThemeMode)}
                options={THEME_OPTIONS}
                value={themeMode}
              />
            </View>

            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border }} />

            <View style={{ gap: theme.spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                <AppText style={{ flex: 1 }} variant="bodyMedium">
                  Attendance target
                </AppText>
                <AppText variant="smallMedium" color={theme.colors.accent}>
                  {target}%
                </AppText>
              </View>
              <Segmented
                onChange={(value) => setAttendanceTarget(Number(value))}
                options={TARGETS.map((value) => ({ value: String(value), label: String(value) }))}
                value={String(target)}
              />
            </View>

            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border }} />

            <SwitchRow
              disabled={remindersBusy}
              icon={Bell}
              label="Assignment reminders"
              onValueChange={(value) => void setAssignmentReminders(value)}
              value={remindersEnabled}
            />

            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border }} />

            <SwitchRow
              icon={Vibrate}
              label="Haptic feedback"
              onValueChange={(value) => {
                setHapticsEnabled(value);
                if (value) void Haptics.selectionAsync().catch(() => undefined);
              }}
              value={hapticsEnabled}
            />

            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border }} />

            <Pressable
              accessibilityLabel="Customize home"
              accessibilityRole="button"
              onPress={() => router.push('/customize-home')}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing.md,
                opacity: pressed ? 0.62 : 1,
              })}>
              <LayoutDashboard color={theme.colors.textSecondary} size={19} strokeWidth={1.9} />
              <AppText style={{ flex: 1 }} variant="bodyMedium">
                Customize home
              </AppText>
              <ChevronRight color={theme.colors.textMuted} size={17} strokeWidth={1.8} />
            </Pressable>
          </Card>
        </View>
      </Reveal>

      <Reveal delay={240}>
        <View style={{ marginTop: theme.spacing.xxl }}>
          <AppText style={{ marginBottom: theme.spacing.lg }} variant="h3">
            About
          </AppText>
          <Card padded={false}>
            <InfoRow icon={Globe2} label="SJCET Etlab" value="sjcetpalai.etlab.in" />
            <InfoRow
              icon={Clock3}
              label="Last dashboard update"
              value={
                dashboard.dataUpdatedAt
                  ? new Date(dashboard.dataUpdatedAt).toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit',
                    })
                  : 'Not checked'
              }
            />
            <InfoRow icon={Info} label="Version" value={version} />
            <InfoRow
              icon={ShieldCheck}
              label="Privacy and data"
              onPress={() => router.push('/privacy')}
            />
            <InfoRow
              icon={Heart}
              label="About NexusLabs"
              last
              onPress={() => router.push('/about')}
            />
          </Card>
        </View>
      </Reveal>

      <Button
        icon={LogOut}
        label="Sign out"
        onPress={confirmSignOut}
        style={{ marginTop: theme.spacing.xxl }}
        variant="danger"
      />
    </Screen>
  );
}
