import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertCircle, ArrowRight, LockKeyhole, UserRound } from 'lucide-react-native';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { AppText, Button, Reveal, TextField } from '@/components/ui';
import { useLogin } from '@/hooks/use-etlab';
import { SJCET_HOST } from '@/lib/api/endpoints';
import { useAuth } from '@/stores/auth';
import { useTheme } from '@/theme';

function OrbitArt() {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const spin = useSharedValue(0);
  const counterSpin = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    spin.set(
      withRepeat(
        withTiming(360, {
          duration: 42000,
          easing: Easing.linear,
          reduceMotion: ReduceMotion.System,
        }),
        -1,
        false,
      ),
    );
    counterSpin.set(
      withRepeat(
        withTiming(-360, {
          duration: 30000,
          easing: Easing.linear,
          reduceMotion: ReduceMotion.System,
        }),
        -1,
        false,
      ),
    );
  }, [counterSpin, reduced, spin]);

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.get()}deg` }],
  }));
  const innerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${counterSpin.get()}deg` }],
  }));

  return (
    <View pointerEvents="none" style={styles.orbitFrame}>
      <View
        style={[
          styles.orbitGlow,
          { backgroundColor: theme.colors.accent, opacity: theme.dark ? 0.16 : 0.1 },
        ]}
      />
      <Animated.View
        style={[
          styles.orbit,
          styles.orbitOuter,
          { borderColor: theme.colors.accent, opacity: 0.42 },
          outerStyle,
        ]}>
        <View style={[styles.orbitDot, { backgroundColor: theme.colors.accent }]} />
      </Animated.View>
      <Animated.View
        style={[
          styles.orbit,
          styles.orbitInner,
          { borderColor: theme.colors.borderStrong, opacity: 0.7 },
          innerStyle,
        ]}>
        <View
          style={[
            styles.orbitDot,
            styles.orbitDotSmall,
            { backgroundColor: theme.colors.text },
          ]}
        />
      </Animated.View>
    </View>
  );
}

export default function LoginScreen() {
  const theme = useTheme();
  const session = useAuth((state) => state.session);
  const signIn = useAuth((state) => state.signIn);
  const loginMutation = useLogin();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  if (session) {
    return <Redirect href="/home" />;
  }

  const busy = loginMutation.isPending;

  const handleSignIn = async () => {
    if (busy) return;
    setFormError(null);
    if (!username.trim() || !password) {
      setFormError('Enter your SJCET Etlab username and password.');
      return;
    }

    try {
      const nextSession = await loginMutation.mutateAsync({
        credentials: { username: username.trim(), password },
      });
      await signIn(nextSession);
      setPassword('');
      loginMutation.reset();
      router.replace('/home');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Sign in failed. Try again.');
    }
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right', 'bottom']}
      style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: theme.spacing.xl,
            paddingTop: theme.spacing.md,
            paddingBottom: theme.spacing.xl,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Reveal>
            <View style={styles.brandRow}>
              <View
                style={[
                  styles.brandMark,
                  { backgroundColor: theme.colors.primary, borderRadius: theme.radii.sm },
                ]}>
                <AppText
                  style={{ fontSize: 22, lineHeight: 24, fontFamily: theme.fonts.serif }}
                  color={theme.colors.textInverse}>
                  N
                </AppText>
              </View>
              <View style={{ flex: 1, gap: 1 }}>
                <AppText variant="label" color={theme.colors.text}>
                  NexusLabs
                </AppText>
                <AppText variant="caption" color={theme.colors.textMuted}>
                  SJCET Palai
                </AppText>
              </View>
              <View
                style={[
                  styles.hostPill,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}>
                <View
                  style={[styles.hostDot, { backgroundColor: theme.colors.success }]}
                />
                <AppText variant="caption" color={theme.colors.textSecondary}>
                  Etlab
                </AppText>
              </View>
            </View>
          </Reveal>

          <View style={styles.hero}>
            <OrbitArt />
            <Reveal delay={60}>
              <View style={{ gap: theme.spacing.md }}>
                <AppText variant="label" color={theme.colors.accent}>
                  SJCET Palai
                </AppText>
                <AppText
                  style={{
                    fontSize: 58,
                    lineHeight: 56,
                    fontFamily: theme.fonts.serif,
                    letterSpacing: -1.8,
                  }}>
                  Welcome{'\n'}back.
                </AppText>
                <AppText
                  variant="small"
                  color={theme.colors.textSecondary}
                  style={{ maxWidth: 250 }}>
                  Sign in with your Etlab account.
                </AppText>
              </View>
            </Reveal>
          </View>

          <Reveal delay={140} distance={24}>
            <View
              style={[
                styles.formCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radii.xl,
                },
              ]}>
              <View style={{ gap: theme.spacing.md }}>
                <TextField
                  autoCapitalize="none"
                  autoComplete="username"
                  icon={UserRound}
                  label="Username"
                  onChangeText={(value) => {
                    setUsername(value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="Your Etlab username"
                  returnKeyType="next"
                  textContentType="username"
                  value={username}
                />
                <TextField
                  autoCapitalize="none"
                  autoComplete="current-password"
                  icon={LockKeyhole}
                  label="Password"
                  onChangeText={(value) => {
                    setPassword(value);
                    if (formError) setFormError(null);
                  }}
                  onSubmitEditing={() => void handleSignIn()}
                  placeholder="Your password"
                  returnKeyType="go"
                  secureTextEntry
                  textContentType="password"
                  value={password}
                />

                {formError ? (
                  <View
                    accessibilityLiveRegion="polite"
                    accessibilityRole="alert"
                    style={[
                      styles.errorBox,
                      {
                        backgroundColor: theme.colors.dangerSoft,
                        borderRadius: theme.radii.sm,
                        padding: theme.spacing.md,
                      },
                    ]}>
                    <AlertCircle color={theme.colors.danger} size={17} strokeWidth={2.1} />
                    <AppText
                      variant="small"
                      color={theme.colors.danger}
                      style={styles.flex}>
                      {formError}
                    </AppText>
                  </View>
                ) : null}

                <Button
                  disabled={busy}
                  icon={ArrowRight}
                  iconPosition="trailing"
                  label="Sign in"
                  loading={loginMutation.isPending}
                  onPress={() => void handleSignIn()}
                  style={{ marginTop: theme.spacing.xs }}
                  variant="accent"
                />
              </View>

              <View style={styles.formFooter}>
                <AppText variant="caption" color={theme.colors.textMuted}>
                  {SJCET_HOST}
                </AppText>
                <Pressable
                  accessibilityRole="link"
                  hitSlop={8}
                  onPress={() => router.push('/privacy')}
                  style={{ minHeight: 44, justifyContent: 'center' }}>
                  <AppText variant="caption" color={theme.colors.textSecondary}>
                    Privacy
                  </AppText>
                </Pressable>
              </View>
            </View>
          </Reveal>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4 },
  brandMark: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  hostPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  hostDot: { width: 5, height: 5, borderRadius: 2.5 },
  hero: { minHeight: 310, justifyContent: 'flex-end', paddingBottom: 28, paddingTop: 28 },
  orbitFrame: { position: 'absolute', width: 240, height: 240, right: -46, top: 6 },
  orbitGlow: { position: 'absolute', top: 50, left: 50, width: 140, height: 140, borderRadius: 70 },
  orbit: { position: 'absolute', borderWidth: 1, alignItems: 'center' },
  orbitOuter: { top: 0, left: 0, width: 240, height: 240, borderRadius: 120 },
  orbitInner: { top: 48, left: 48, width: 144, height: 144, borderRadius: 72 },
  orbitDot: { position: 'absolute', top: -4, width: 8, height: 8, borderRadius: 4 },
  orbitDotSmall: { width: 6, height: 6, borderRadius: 3, top: -3 },
  formCard: { padding: 20, borderWidth: StyleSheet.hairlineWidth, gap: 4 },
  errorBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  formFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 12,
  },
});
