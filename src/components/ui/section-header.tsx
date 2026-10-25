import { Pressable, View } from 'react-native';
import { ArrowUpRight } from 'lucide-react-native';

import { useTheme } from '@/theme';
import { AppText } from './text';

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  eyebrow?: string;
};

export function SectionHeader({ title, actionLabel, onAction, eyebrow }: SectionHeaderProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.lg,
        gap: theme.spacing.md,
      }}>
      <View style={{ flex: 1, gap: 2 }}>
        {eyebrow ? (
          <AppText variant="label" color={theme.colors.textMuted}>
            {eyebrow}
          </AppText>
        ) : null}
        <AppText variant="h3">{title}</AppText>
      </View>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityLabel={actionLabel}
          accessibilityRole="button"
          hitSlop={10}
          onPress={onAction}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <AppText variant="smallMedium" color={theme.colors.accent}>
            {actionLabel}
          </AppText>
          <ArrowUpRight color={theme.colors.accent} size={15} strokeWidth={2.4} />
        </Pressable>
      ) : null}
    </View>
  );
}
