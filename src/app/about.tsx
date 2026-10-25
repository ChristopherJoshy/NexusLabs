import { useState } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import { ExternalLink, Globe2, Info } from 'lucide-react-native';

import { AppText, Avatar, Card, Reveal, Screen, ScreenHeader } from '@/components/ui';
import { useTheme } from '@/theme';

const PORTAL_URL = 'https://sjcetpalai.etlab.in';

export default function AboutScreen() {
  const theme = useTheme();
  const [openingPortal, setOpeningPortal] = useState(false);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const openPortal = async () => {
    if (openingPortal) return;
    setOpeningPortal(true);
    try {
      await Linking.openURL(PORTAL_URL);
    } catch {
      Alert.alert('Could not open Etlab', 'Try opening sjcetpalai.etlab.in in your browser.');
    } finally {
      setOpeningPortal(false);
    }
  };

  return (
    <Screen scroll>
      <ScreenHeader back title="NexusLabs" />

      <Reveal delay={40}>
        <View style={{ gap: theme.spacing.lg }}>
          <AppText
            style={{
              fontFamily: theme.fonts.serif,
              fontSize: 44,
              lineHeight: 45,
              letterSpacing: -1.2,
            }}>
            Academic life,{'\n'}in one place.
          </AppText>
          <AppText variant="body" color={theme.colors.textSecondary}>
            NexusLabs brings attendance, schedules, assignments, results, fees, and campus updates
            into one focused place for SJCET Palai students.
          </AppText>
        </View>
      </Reveal>

      <Reveal delay={100}>
        <Card style={{ marginTop: theme.spacing.xxl, gap: theme.spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
            <Avatar name="Christopher Joshy" size={48} />
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="label" color={theme.colors.textMuted}>
                Creator
              </AppText>
              <AppText variant="h3">Christopher Joshy</AppText>
            </View>
          </View>
          <AppText
            style={{
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: theme.colors.border,
              paddingTop: theme.spacing.md,
            }}
            variant="small"
            color={theme.colors.textSecondary}>
            Built after experiencing how scattered academic information and unreliable updates can
            make student life harder to manage.
          </AppText>
        </Card>
      </Reveal>

      <Reveal delay={150}>
        <AppText
          style={{
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: theme.colors.border,
            marginTop: theme.spacing.xl,
            paddingTop: theme.spacing.lg,
          }}
          variant="small"
          color={theme.colors.textSecondary}>
          NexusLabs is an independent student project and is not affiliated with Etlab or SJCET.
        </AppText>
      </Reveal>

      <Reveal delay={200}>
        <Card
          accessibilityHint="Opens in your browser"
          accessibilityLabel="Open the SJCET Etlab portal"
          onPress={() => void openPortal()}
          style={{ marginTop: theme.spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
            <Globe2 color={theme.colors.textSecondary} size={19} strokeWidth={1.9} />
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="bodyMedium">SJCET Etlab portal</AppText>
              <AppText variant="caption" color={theme.colors.textMuted}>
                sjcetpalai.etlab.in
              </AppText>
            </View>
            <ExternalLink color={theme.colors.textMuted} size={17} strokeWidth={1.9} />
          </View>
        </Card>
      </Reveal>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.spacing.sm,
          marginTop: theme.spacing.xxl,
        }}>
        <Info color={theme.colors.textMuted} size={14} strokeWidth={1.9} />
        <AppText variant="caption" color={theme.colors.textMuted}>
          NexusLabs {version}
        </AppText>
      </View>
    </Screen>
  );
}
