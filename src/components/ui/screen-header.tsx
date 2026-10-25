import type { ReactNode } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

import { useTheme } from '@/theme';
import { AppText } from './text';
import { IconButton } from './icon-button';
import { Reveal } from './motion';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  back?: boolean;
  right?: ReactNode;
};

export function ScreenHeader({ title, subtitle, eyebrow, back = false, right }: ScreenHeaderProps) {
  const theme = useTheme();

  return (
    <Reveal>
      <View style={{ paddingTop: theme.spacing.xs, paddingBottom: theme.spacing.xl }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.md,
            minHeight: 44,
          }}>
          {back ? (
            <IconButton
              icon={ArrowLeft}
              label="Go back"
              onPress={() => router.back()}
              size={19}
            />
          ) : null}
          <View style={{ flex: 1, gap: 3 }}>
            {eyebrow ? (
              <AppText variant="label" color={theme.colors.accent}>
                {eyebrow}
              </AppText>
            ) : null}
            <AppText variant="h1">{title}</AppText>
            {subtitle ? (
              <AppText variant="small" color={theme.colors.textSecondary}>
                {subtitle}
              </AppText>
            ) : null}
          </View>
          {right ? <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>{right}</View> : null}
        </View>
      </View>
    </Reveal>
  );
}
