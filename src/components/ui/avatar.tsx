import { Image } from 'expo-image';
import { View } from 'react-native';

import { initials } from '@/lib/format';
import { useTheme } from '@/theme';
import { AppText } from './text';

type AvatarProps = {
  uri?: string | null;
  name?: string | null;
  size?: number;
  ringColor?: string;
};

export function Avatar({ uri, name, size = 44, ringColor }: AvatarProps) {
  const theme = useTheme();

  const frame = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    overflow: 'hidden' as const,
    borderWidth: 2,
    borderColor: ringColor ?? theme.colors.surface,
  };

  if (uri) {
    return (
      <View style={frame}>
        <Image
          accessibilityLabel={name ? `${name}'s profile photo` : 'Profile photo'}
          contentFit="cover"
          source={{ uri }}
          style={{ width: size, height: size, filter: [{ grayscale: 1 }] }}
          transition={180}
        />
      </View>
    );
  }

  return (
    <View accessibilityLabel={name ? `${name} profile` : 'Profile'} style={frame}>
      <AppText
        style={{ fontFamily: theme.fonts.bold, fontSize: size * 0.34 }}
        color={theme.colors.textSecondary}>
        {initials(name)}
      </AppText>
    </View>
  );
}
