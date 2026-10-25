import { View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileQuestion,
  FileText,
  Globe2,
} from 'lucide-react-native';

import {
  AppText,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Reveal,
  Screen,
  ScreenHeader,
  Skeleton,
} from '@/components/ui';
import { isSubmitted, useAssignments } from '@/hooks/use-etlab';
import { deadlineMeta, formatDate } from '@/lib/format';
import { resolveHttpUrl, siteRoot } from '@/lib/url';
import { useAuth, useSession } from '@/stores/auth';
import { useTheme } from '@/theme';

function fileNameFor(url: string | null): string | null {
  if (!url) return null;
  try {
    const last = new URL(url).pathname.split('/').filter(Boolean).pop();
    return last ? decodeURIComponent(last) : 'Submitted file';
  } catch {
    return 'Submitted file';
  }
}

function Detail({ label, value }: { label: string; value: string }) {
  const theme = useTheme();

  return (
    <View style={{ flex: 1, gap: 3 }}>
      <AppText variant="label" color={theme.colors.textMuted}>
        {label}
      </AppText>
      <AppText variant="smallMedium">{value}</AppText>
    </View>
  );
}

function AssignmentDetail({ id }: { id: string }) {
  const theme = useTheme();
  const session = useSession();
  const { data, isLoading, isError, error, refetch } = useAssignments();
  const assignment = (data ?? []).find((item) => item.id === id);

  if (isLoading && !data) {
    return (
      <Screen scroll>
        <ScreenHeader back title="Assignment" />
        <View style={{ gap: theme.spacing.md }}>
          <Skeleton height={280} radius={theme.radii.lg} />
          <Skeleton height={140} radius={theme.radii.lg} />
        </View>
      </Screen>
    );
  }

  if (isError && !data) {
    return (
      <Screen scroll>
        <ScreenHeader back title="Assignment" />
        <ErrorState error={error} onRetry={() => void refetch()} />
      </Screen>
    );
  }

  if (!assignment) {
    return (
      <Screen scroll>
        <ScreenHeader back title="Assignment" />
        <Card>
          <EmptyState
            actionLabel="Go back"
            description="It may have been removed, or it belongs to a different semester."
            icon={FileQuestion}
            onAction={() => router.back()}
            title="Assignment not found"
          />
        </Card>
      </Screen>
    );
  }

  const submitted = isSubmitted(assignment);
  const deadline = deadlineMeta(assignment.lastDate);
  const submissionLink = resolveHttpUrl(session.baseUrl, assignment.link ?? assignment.url);
  const portal = siteRoot(session.baseUrl);
  const fileLink = resolveHttpUrl(session.baseUrl, assignment.uploadedFile);
  const fileName = fileNameFor(fileLink);
  const tone = deadline.tone === 'muted' ? 'neutral' : deadline.tone;
  const statusColor = submitted
    ? theme.colors.success
    : deadline.tone === 'danger'
      ? theme.colors.danger
      : deadline.tone === 'warning'
        ? theme.colors.warning
        : theme.colors.textMuted;

  const openExternalPage = (url: string) => {
    void WebBrowser.openBrowserAsync(url);
  };

  return (
    <Screen scroll>
      <ScreenHeader back title="Assignment" />

      <Reveal delay={40}>
        <Card style={{ gap: theme.spacing.lg }}>
          <View
            style={{
              height: 4,
              width: 56,
              borderRadius: 2,
              backgroundColor: statusColor,
            }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
            <AppText
              numberOfLines={1}
              style={{ flex: 1 }}
              variant="label"
              color={theme.colors.accent}>
              {assignment.subject || 'ASSIGNMENT'}
            </AppText>
            <Badge
              dot
              label={submitted ? 'Submitted' : deadline.label}
              tone={submitted ? 'success' : tone}
            />
          </View>

          <AppText
            style={{
              fontFamily: theme.fonts.serif,
              fontSize: 36,
              lineHeight: 37,
              letterSpacing: -0.9,
            }}>
            {assignment.title}
          </AppText>

          <AppText variant="body" color={theme.colors.textSecondary}>
            {assignment.details?.trim() ||
              'No additional instructions were included with this task.'}
          </AppText>

          <View
            style={{
              flexDirection: 'row',
              gap: theme.spacing.lg,
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
              paddingTop: theme.spacing.lg,
            }}>
            <Detail label="Published" value={formatDate(assignment.issueDate, 'd MMM yyyy')} />
            <Detail label="Due" value={formatDate(assignment.lastDate, 'd MMM yyyy')} />
          </View>

          {assignment.semester || assignment.upload || (submitted && fileName) ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {assignment.semester ? <Badge label={assignment.semester} /> : null}
              {assignment.upload ? <Badge label="File upload" tone="warning" /> : null}
              {submitted && fileName ? <Badge label={fileName} tone="success" /> : null}
            </View>
          ) : null}
        </Card>
      </Reveal>

      <Reveal delay={100}>
        <Card style={{ marginTop: theme.spacing.md, gap: theme.spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: submitted ? theme.colors.successSoft : theme.colors.warningSoft,
              }}>
              {submitted ? (
                <CheckCircle2 color={theme.colors.success} size={21} strokeWidth={1.9} />
              ) : (
                <Clock3 color={theme.colors.warning} size={21} strokeWidth={1.9} />
              )}
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="bodySemibold">
                {submitted ? 'Submitted to your college' : deadline.label}
              </AppText>
              <AppText variant="caption" color={theme.colors.textMuted}>
                {submitted
                  ? `Recorded for ${assignment.subject || 'this subject'}.`
                  : `Due ${formatDate(assignment.lastDate, 'EEEE, d MMMM')}.`}
              </AppText>
            </View>
          </View>

          {submitted && fileLink ? (
            <Button
              icon={FileText}
              label="View submitted file"
              onPress={() => openExternalPage(fileLink)}
              variant="secondary"
            />
          ) : null}

          {submitted && !fileLink ? (
            <AppText variant="caption" color={theme.colors.textMuted}>
              Etlab did not return a submitted file for this assignment.
            </AppText>
          ) : null}

          {!submitted ? (
            <Button
              icon={ExternalLink}
              label={submissionLink ? 'Open submission link' : 'Open college portal'}
              onPress={() => openExternalPage(submissionLink ?? portal)}
            />
          ) : null}

          {!submitted && submissionLink ? (
            <Button
              icon={Globe2}
              label="Open college portal"
              onPress={() => openExternalPage(portal)}
              variant="ghost"
            />
          ) : null}
        </Card>
      </Reveal>
    </Screen>
  );
}

export default function AssignmentDetailScreen() {
  const session = useAuth((state) => state.session);
  const params = useLocalSearchParams<{ id: string }>();

  if (!session) return <Redirect href="/login" />;
  return <AssignmentDetail id={String(params.id ?? '')} />;
}
