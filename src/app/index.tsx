import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/stores/auth';
import { useTheme } from '@/theme';

export default function IndexScreen() {
  const theme = useTheme();
  const hydrated = useAuth((state) => state.hydrated);
  const session = useAuth((state) => state.session);

  if (!hydrated) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.background,
        }}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return <Redirect href={session ? '/home' : '/login'} />;
}
