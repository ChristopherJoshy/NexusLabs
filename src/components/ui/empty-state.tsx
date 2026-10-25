import { View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Sparkles } from 'lucide-react-native';

import { useTheme } from '@/theme';
import { Button } from './button';
import { AppText } from './text';
import { Reveal } from './motion';

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
};

export function EmptyState({
  icon: Icon = Sparkles,
  title,
  description,
  actionLabel,
  onAction,
  compact = false,
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <Reveal>
      <View
        style={{
          alignItems: 'center',
          paddingVertical: compact ? theme.spacing.xxl : theme.spacing.huge,
          paddingHorizontal: theme.spacing.xl,
          gap: theme.spacing.md,
        }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: theme.colors.accentSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Icon color={theme.colors.accent} size={24} strokeWidth={1.8} />
        </View>
        <View style={{ alignItems: 'center', gap: 4 }}>
          <AppText align="center" variant="h3">
            {title}
          </AppText>
          {description ? (
            <AppText align="center" color={theme.colors.textSecondary} variant="small">
              {description}
            </AppText>
          ) : null}
        </View>
        {actionLabel && onAction ? (
          <Button
            fullWidth={false}
            label={actionLabel}
            onPress={onAction}
            size="sm"
            style={{ alignSelf: 'center' }}
            variant="secondary"
          />
        ) : null}
      </View>
    </Reveal>
  );
}
