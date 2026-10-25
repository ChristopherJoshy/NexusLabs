import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { BookOpen, ExternalLink, FileSearch, Search } from 'lucide-react-native';

import {
  AppText,
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Screen,
  ScreenHeader,
  Skeleton,
  TextField,
} from '@/components/ui';
import { useStudyMaterials } from '@/hooks/use-etlab';
import type { StudyMaterial } from '@/lib/api/types';
import { formatDate } from '@/lib/format';
import { resolveHttpUrl } from '@/lib/url';
import { useSession } from '@/stores/auth';
import { useTheme } from '@/theme';

function MaterialRow({
  item,
  session,
  isLast,
}: {
  item: StudyMaterial;
  session: ReturnType<typeof useSession>;
  isLast: boolean;
}) {
  const theme = useTheme();
  const url = resolveHttpUrl(session.baseUrl, item.url);
  const meta = [item.subject, item.date ? formatDate(item.date, 'd MMM yyyy') : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      accessibilityHint={url ? 'Opens in your browser' : undefined}
      accessibilityLabel={`${item.title ?? 'Study material'}${
        item.subject ? `, ${item.subject}` : ''
      }${url ? '' : ', link unavailable'}`}
      accessibilityRole={url ? 'button' : undefined}
      disabled={!url}
      onPress={url ? () => void WebBrowser.openBrowserAsync(url) : undefined}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border,
        opacity: pressed ? 0.55 : 1,
      })}>
      <View style={{ flex: 1, gap: 3 }}>
        <AppText numberOfLines={2} variant="bodySemibold">
          {item.title ?? 'Material title not reported'}
        </AppText>
        <AppText numberOfLines={1} variant="caption" color={theme.colors.textMuted}>
          {meta || 'Course material'}
        </AppText>
      </View>

      {url ? (
        <ExternalLink color={theme.colors.textMuted} size={16} strokeWidth={1.9} />
      ) : (
        <Badge label="No link" />
      )}
    </Pressable>
  );
}

export default function MaterialsScreen() {
  const theme = useTheme();
  const session = useSession();
  const query = useStudyMaterials();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const materials = query.data ?? [];
    return needle
      ? materials.filter((item) =>
          `${item.title ?? ''} ${item.subject ?? ''}`.toLowerCase().includes(needle),
        )
      : materials;
  }, [query.data, search]);

  return (
    <Screen
      refreshControl={
        <RefreshControl
          colors={[theme.colors.accent]}
          onRefresh={() => void query.refetch()}
          refreshing={query.isRefetching}
          tintColor={theme.colors.accent}
        />
      }
      scroll>
      <ScreenHeader
        back
        right={
          query.data ? (
            <Badge label={`${filtered.length} files`} tone="neutral" />
          ) : undefined
        }
        title="Materials"
      />

      {!query.isError || query.data ? (
        <TextField
          accessibilityLabel="Search study materials"
          autoCapitalize="none"
          autoCorrect={false}
          icon={Search}
          onChangeText={setSearch}
          placeholder="Search title or subject"
          returnKeyType="search"
          value={search}
        />
      ) : null}

      <View style={{ marginTop: theme.spacing.xl }}>
        {query.isLoading ? (
          <View style={{ gap: theme.spacing.sm }}>
            <Skeleton height={72} radius={theme.radii.md} />
            <Skeleton height={72} radius={theme.radii.md} />
            <Skeleton height={72} radius={theme.radii.md} />
            <Skeleton height={72} radius={theme.radii.md} />
          </View>
        ) : query.isError && !query.data ? (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        ) : filtered.length === 0 ? (
          <Card>
            <EmptyState
              description={
                search.trim()
                  ? 'Try a different title or subject.'
                  : 'Etlab returned no study materials for this semester.'
              }
              icon={search.trim() ? FileSearch : BookOpen}
              title={search.trim() ? 'No matching materials' : 'No materials returned'}
            />
          </Card>
        ) : (
          <Card padded={false} style={{ overflow: 'hidden' }}>
            {filtered.map((item, index) => (
              <MaterialRow
                isLast={index === filtered.length - 1}
                item={item}
                key={item.id}
                session={session}
              />
            ))}
          </Card>
        )}
      </View>
    </Screen>
  );
}
