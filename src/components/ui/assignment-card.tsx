import { Pressable, StyleSheet, View } from 'react-native';
import { ArrowUpRight, CalendarClock, ChevronRight } from 'lucide-react-native';

import type { Assignment } from '@/lib/api/types';
import { deadlineMeta, formatDate, parseEtlabDate } from '@/lib/format';
import { useTheme } from '@/theme';
import { AppText } from './text';
import { Badge, type BadgeTone } from './badge';
import { Card } from './card';

function toneFor(tone: 'danger' | 'warning' | 'muted' | 'success'): BadgeTone {
  return tone === 'danger' ? 'danger' : tone === 'warning' ? 'warning' : tone === 'success' ? 'success' : 'neutral';
}

type AssignmentFeatureCardProps = {
  assignment: Assignment;
  onPress: () => void;
  featured?: boolean;
};

export function AssignmentFeatureCard({
  assignment,
  onPress,
  featured = false,
}: AssignmentFeatureCardProps) {
  const theme = useTheme();
  const due = deadlineMeta(assignment.lastDate);
  const foreground = featured ? theme.colors.heroText : theme.colors.text;
  const muted = featured ? theme.colors.heroMuted : theme.colors.textSecondary;

  return (
    <Card
      accessibilityLabel={`${assignment.title}, ${assignment.subject}, ${due.label}`}
      onPress={onPress}
      style={{ width: 258, minHeight: 174, justifyContent: 'space-between' }}
      tone={featured ? 'ink' : 'default'}>
      <View style={{ gap: theme.spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          <AppText
            numberOfLines={1}
            style={{ flex: 1 }}
            variant="label"
            color={featured ? theme.colors.heroAccent : theme.colors.textMuted}>
            {assignment.subject || 'Subject'}
          </AppText>
          <Badge dot label={due.label} tone={toneFor(due.tone)} />
        </View>
        <AppText
          numberOfLines={3}
          style={{ fontSize: 19, lineHeight: 25, fontFamily: theme.fonts.bold, letterSpacing: -0.4 }}
          color={foreground}>
          {assignment.title}
        </AppText>
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: theme.spacing.lg,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <CalendarClock color={muted} size={14} strokeWidth={1.9} />
          <AppText variant="caption" color={muted}>
            {assignment.lastDate ? formatDate(assignment.lastDate, 'd MMM') : 'No deadline'}
          </AppText>
        </View>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: featured ? theme.colors.heroRaised : theme.colors.surfaceSunken,
          }}>
          <ArrowUpRight
            color={featured ? theme.colors.heroAccent : theme.colors.text}
            size={16}
            strokeWidth={2.2}
          />
        </View>
      </View>
    </Card>
  );
}

type AssignmentRowProps = {
  assignment: Assignment;
  onPress: () => void;
  submitted?: boolean;
  isLast?: boolean;
};

export function AssignmentRow({
  assignment,
  onPress,
  submitted = false,
  isLast = false,
}: AssignmentRowProps) {
  const theme = useTheme();
  const due = deadlineMeta(assignment.lastDate);
  const date = parseEtlabDate(assignment.lastDate);

  return (
    <Pressable
      accessibilityLabel={`${assignment.title}, ${assignment.subject}, ${
        submitted ? 'Submitted' : due.label
      }`}
      accessibilityRole="button"
      onPress={onPress}
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
      <View style={{ width: 40 }}>
        <AppText
          style={{
            fontSize: 21,
            lineHeight: 23,
            fontFamily: theme.fonts.extrabold,
            fontVariant: ['tabular-nums'],
            letterSpacing: -0.6,
          }}
          color={submitted ? theme.colors.textMuted : theme.colors.text}>
          {date ? formatDate(assignment.lastDate, 'd') : '—'}
        </AppText>
        <AppText
          style={{ fontSize: 9.5, fontFamily: theme.fonts.bold, letterSpacing: 0.7 }}
          color={theme.colors.textMuted}>
          {date ? formatDate(assignment.lastDate, 'MMM').toUpperCase() : 'DUE'}
        </AppText>
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <AppText numberOfLines={1} variant="label" color={theme.colors.textMuted}>
          {assignment.subject || 'Subject'}
        </AppText>
        <AppText numberOfLines={2} variant="bodySemibold">
          {assignment.title}
        </AppText>
        <Badge
          dot
          label={submitted ? 'Submitted' : due.label}
          tone={submitted ? 'success' : toneFor(due.tone)}
        />
      </View>
      <ChevronRight color={theme.colors.textMuted} size={18} strokeWidth={1.8} />
    </Pressable>
  );
}
