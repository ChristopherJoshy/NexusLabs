import { StyleSheet, View } from 'react-native';
import {
  Database,
  EyeOff,
  KeyRound,
  LogOut,
  MousePointerClick,
  ShieldCheck,
  Smartphone,
  type LucideIcon,
} from 'lucide-react-native';

import { AppText, Card, Reveal, Screen, ScreenHeader } from '@/components/ui';
import { useTheme } from '@/theme';

type Section = {
  title: string;
  body: string;
  icon: LucideIcon;
};

const SECTIONS: Section[] = [
  {
    title: 'Sign-in details',
    body: 'Your Etlab username and password are sent over HTTPS to sjcetpalai.etlab.in to authenticate you. NexusLabs does not save your password. The sign-in token is kept in device secure storage; session and profile details are stored locally without the token.',
    icon: KeyRound,
  },
  {
    title: 'Etlab records',
    body: 'Attendance, timetable, assignment, result, fee, notice, and other records are requested from SJCET Etlab. The app keeps a local academic cache for up to 24 hours to make screens load faster. Signing out or changing accounts clears that cache.',
    icon: Database,
  },
  {
    title: 'On-device information',
    body: 'Theme, home layout, attendance target, haptic preference, reminder preference, and study-session history are stored on your device. Assignment reminders are scheduled locally by Android.',
    icon: Smartphone,
  },
  {
    title: 'Sharing and tracking',
    body: 'NexusLabs has no app server, analytics, or advertising configured. Requests for Etlab records go to the SJCET portal; they do not pass through a NexusLabs-operated service.',
    icon: EyeOff,
  },
  {
    title: 'Actions in the app',
    body: 'The current version reads Etlab records. It does not submit assignments, apply for leave, initiate payments, or change attendance or registration records.',
    icon: MousePointerClick,
  },
  {
    title: 'Sign out and local data',
    body: 'Signing out removes the Etlab session and token, cached academic records, study-session history, and scheduled NexusLabs reminders. App preferences such as theme and home layout remain on this device.',
    icon: LogOut,
  },
];

export default function PrivacyScreen() {
  const theme = useTheme();

  return (
    <Screen scroll>
      <ScreenHeader back title="Privacy" />

      <Reveal delay={40}>
        <Card style={{ gap: theme.spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
            <ShieldCheck color={theme.colors.textSecondary} size={18} strokeWidth={1.9} />
            <AppText style={{ flex: 1 }} variant="h2">
              Between you and SJCET Etlab
            </AppText>
          </View>
          <AppText variant="body" color={theme.colors.textSecondary}>
            NexusLabs reads your academic records directly from the SJCET Etlab portal. There is no
            NexusLabs app server, analytics, or advertising in the request path.
          </AppText>
          <AppText variant="caption" color={theme.colors.textMuted}>
            Updated 25 October 2026
          </AppText>
        </Card>
      </Reveal>

      <View style={{ marginTop: theme.spacing.xxl }}>
        {SECTIONS.map((section, index) => {
          const Icon = section.icon;
          return (
            <View
              key={section.title}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: theme.spacing.md,
                paddingVertical: theme.spacing.lg,
                borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
                borderTopColor: theme.colors.border,
              }}>
              <Icon color={theme.colors.textMuted} size={17} strokeWidth={1.9} />
              <View style={{ flex: 1, gap: 4 }}>
                <AppText variant="bodySemibold">{section.title}</AppText>
                <AppText variant="small" color={theme.colors.textSecondary}>
                  {section.body}
                </AppText>
              </View>
            </View>
          );
        })}
      </View>
    </Screen>
  );
}
