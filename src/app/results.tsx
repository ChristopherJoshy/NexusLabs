import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { format } from 'date-fns';
import { CalendarClock, ChevronDown, GraduationCap } from 'lucide-react-native';

import {
  AppText,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Screen,
  ScreenHeader,
  Skeleton,
} from '@/components/ui';
import { useResultCategory, useResultSemesters } from '@/hooks/use-etlab';
import type {
  AcademicRecord,
  ResultCategory,
  ResultData,
  Semester,
  SeriesExam,
  UniversityExamSubject,
  UniversityResult,
  UniversitySubject,
} from '@/lib/api/types';
import { parseEtlabDate } from '@/lib/format';
import { useSession } from '@/stores/auth';
import { useTheme } from '@/theme';

type Tone = 'success' | 'warning' | 'danger' | 'neutral';

const RESULT_CATEGORIES: { value: ResultCategory; label: string }[] = [
  { value: 'internal', label: 'Internal' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'moduleTest', label: 'Module test' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'selfStudy', label: 'Self study' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'series', label: 'Series' },
  { value: 'university', label: 'University' },
];

const EMPTY_COPY: Record<ResultCategory, { title: string; description: string }> = {
  internal: { title: 'No internal marks', description: 'No internal marks for this semester.' },
  assignment: {
    title: 'No assignment results',
    description: 'No assignment results for this semester.',
  },
  moduleTest: {
    title: 'No module test results',
    description: 'No module test results for this semester.',
  },
  seasonal: { title: 'No seasonal results', description: 'No seasonal results for this semester.' },
  selfStudy: { title: 'No self study results', description: 'No self study results for this semester.' },
  tutorial: { title: 'No tutorial results', description: 'No tutorial results for this semester.' },
  series: { title: 'No series exams', description: 'No series exams for this semester.' },
  university: {
    title: 'No university results',
    description: 'No university results for this semester.',
  },
};

function statusTone(status?: string): Tone {
  const value = status?.toLowerCase() ?? '';
  if (value.includes('complete') || value.includes('finish') || value.includes('evaluat')) {
    return 'success';
  }
  if (value.includes('pending') || value.includes('upcoming') || value.includes('schedul')) {
    return 'warning';
  }
  if (value.includes('cancel') || value.includes('miss') || value.includes('expire')) {
    return 'danger';
  }
  return 'neutral';
}

function examWindow(start?: string, finish?: string): string | undefined {
  const startDate = parseEtlabDate(start);
  const finishDate = parseEtlabDate(finish);
  if (!startDate && !finishDate) return undefined;

  if (startDate && finishDate) {
    if (format(startDate, 'yyyy-MM-dd') === format(finishDate, 'yyyy-MM-dd')) {
      return (
        format(startDate, 'd MMM') +
        ' · ' +
        format(startDate, 'h:mm a') +
        ' – ' +
        format(finishDate, 'h:mm a')
      );
    }
    return format(startDate, 'd MMM') + ' – ' + format(finishDate, 'd MMM');
  }

  const date = startDate ?? finishDate;
  return format(date!, 'd MMM') + ' · ' + format(date!, 'h:mm a');
}

function CategoryTabs({
  value,
  onChange,
}: {
  value: ResultCategory;
  onChange: (value: ResultCategory) => void;
}) {
  const theme = useTheme();

  return (
    <ScrollView
      accessibilityRole="tablist"
      contentContainerStyle={{ gap: theme.spacing.sm }}
      horizontal
      showsHorizontalScrollIndicator={false}>
      {RESULT_CATEGORIES.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={{
              minHeight: 42,
              borderRadius: theme.radii.pill,
              paddingHorizontal: theme.spacing.lg,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: selected ? theme.colors.primary : 'transparent',
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: selected ? theme.colors.primary : theme.colors.controlBorder,
            }}>
            <AppText
              variant="smallMedium"
              color={selected ? theme.colors.textInverse : theme.colors.textSecondary}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function SemesterPicker({
  semesters,
  selectedId,
  selectedName,
  loading,
  error,
  onSelect,
  onRetry,
}: {
  semesters: Semester[];
  selectedId: string;
  selectedName?: string;
  loading: boolean;
  error: boolean;
  onSelect: (id: string) => void;
  onRetry: () => void;
}) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Pressable
        accessibilityLabel={'Semester: ' + (selectedName ?? 'choose semester')}
        accessibilityRole="button"
        onPress={() => setVisible(true)}
        style={{
          minHeight: 44,
          maxWidth: 168,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: theme.spacing.xs,
        }}>
        <AppText
          numberOfLines={1}
          variant="smallMedium"
          color={theme.colors.textSecondary}
          style={{ flexShrink: 1, textAlign: 'right' }}>
          {selectedName ?? 'Choose semester'}
        </AppText>
        <ChevronDown color={theme.colors.textMuted} size={16} />
      </Pressable>

      <Modal
        animationType="slide"
        onRequestClose={() => setVisible(false)}
        transparent
        visible={visible}>
        <View
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: theme.colors.overlay,
          }}>
          <Pressable
            accessibilityLabel="Close semester selector"
            accessibilityRole="button"
            onPress={() => setVisible(false)}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={{
              maxHeight: '78%',
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderWidth: StyleSheet.hairlineWidth,
              borderTopLeftRadius: theme.radii.lg,
              borderTopRightRadius: theme.radii.lg,
              paddingHorizontal: theme.spacing.lg,
              paddingTop: theme.spacing.xl,
              paddingBottom: theme.spacing.xl,
            }}>
            <AppText variant="h3" style={{ marginBottom: theme.spacing.md }}>
              Semester
            </AppText>
            {loading && semesters.length === 0 ? (
              <AppText variant="small" color={theme.colors.textMuted}>
                Loading semesters…
              </AppText>
            ) : semesters.length === 0 ? (
              <View style={{ gap: theme.spacing.md }}>
                <AppText variant="small" color={theme.colors.textSecondary}>
                  {error ? 'Semester list unavailable.' : 'No semesters available.'}
                </AppText>
                {error ? (
                  <Button
                    fullWidth={false}
                    label="Try again"
                    onPress={onRetry}
                    size="sm"
                    variant="secondary"
                  />
                ) : null}
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {semesters.map((semester, index) => {
                  const selected = semester.id === selectedId;
                  return (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      key={semester.id}
                      onPress={() => {
                        onSelect(semester.id);
                        setVisible(false);
                      }}
                      style={{
                        minHeight: 52,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottomWidth:
                          index === semesters.length - 1 ? 0 : StyleSheet.hairlineWidth,
                        borderBottomColor: theme.colors.border,
                      }}>
                      <AppText
                        variant={selected ? 'bodySemibold' : 'body'}
                        color={selected ? theme.colors.text : theme.colors.textSecondary}>
                        {semester.name ?? 'Semester ' + semester.id}
                      </AppText>
                      {selected ? (
                        <AppText variant="caption" color={theme.colors.textMuted}>
                          Selected
                        </AppText>
                      ) : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

function MarkRow({ item, isLast }: { item: AcademicRecord; isLast: boolean }) {
  const theme = useTheme();
  const score = item.score?.trim();
  const maximum = item.maximum?.trim();
  const title = item.title ?? item.subject ?? 'Subject not reported';
  const subtitle = item.subject && item.subject !== title ? item.subject : undefined;

  return (
    <View
      accessibilityLabel={
        title +
        (subtitle ? ', ' + subtitle : '') +
        ', ' +
        (score
          ? 'reported mark ' + score + (maximum ? ' out of ' + maximum : '')
          : 'mark not reported')
      }
      accessible
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border,
      }}>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText numberOfLines={2} variant="bodySemibold">
          {title}
        </AppText>
        {subtitle ? (
          <AppText numberOfLines={1} variant="caption" color={theme.colors.textSecondary}>
            {subtitle}
          </AppText>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
        <AppText
          style={{
            fontSize: 24,
            lineHeight: 26,
            fontFamily: theme.fonts.extrabold,
            letterSpacing: -0.8,
            fontVariant: ['tabular-nums'],
          }}>
          {score || '—'}
        </AppText>
        {maximum ? (
          <AppText variant="caption" color={theme.colors.textMuted}>
            /{maximum}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

function SeriesExamRow({ item, isLast }: { item: SeriesExam; isLast: boolean }) {
  const theme = useTheme();
  const title = item.title ?? item.subject ?? 'Exam not reported';
  const window = examWindow(item.startTime, item.finishTime);
  const subject = item.subject && item.subject !== title ? item.subject : undefined;

  return (
    <View
      accessibilityLabel={
        title +
        ', ' +
        (subject ?? 'subject not reported') +
        ', ' +
        (window ?? 'time not reported') +
        ', ' +
        (item.status ?? 'status not reported')
      }
      accessible
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border,
      }}>
      <View style={{ flex: 1, gap: 3 }}>
        <AppText numberOfLines={2} variant="bodySemibold">
          {title}
        </AppText>
        {subject ? (
          <AppText numberOfLines={1} variant="caption" color={theme.colors.textSecondary}>
            {subject}
          </AppText>
        ) : null}
        <AppText numberOfLines={1} variant="caption" color={theme.colors.textMuted}>
          {window ?? 'Time not reported'}
        </AppText>
      </View>
      {item.status ? <Badge dot label={item.status} tone={statusTone(item.status)} /> : null}
    </View>
  );
}

function UniversitySubjectRow({
  item,
  isLast,
}: {
  item: UniversitySubject;
  isLast: boolean;
}) {
  const theme = useTheme();

  return (
    <View
      accessible
      accessibilityLabel={
        (item.subject ?? 'Subject not reported') + ', ' + (item.status ?? 'status not reported')
      }
      style={{
        minHeight: 52,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border,
      }}>
      <AppText numberOfLines={2} style={{ flex: 1 }} variant="bodySemibold">
        {item.subject ?? 'Subject not reported'}
      </AppText>
      {item.status ? <Badge dot label={item.status} tone={statusTone(item.status)} /> : null}
    </View>
  );
}

function UniversityExamSubjectRow({
  item,
  isLast,
}: {
  item: UniversityExamSubject;
  isLast: boolean;
}) {
  const theme = useTheme();
  const details = [
    item.internalMark ? 'Internal ' + item.internalMark : undefined,
    item.universityMark ? 'University ' + item.universityMark : undefined,
    item.attendance ? 'Attendance ' + item.attendance : undefined,
    item.credits ? 'Credits ' + item.credits : undefined,
  ].filter(Boolean);

  return (
    <View
      accessible
      accessibilityLabel={
        (item.subject ?? 'Subject not reported') +
        (details.length ? ', ' + details.join(', ') : '') +
        (item.status ? ', ' + item.status : '')
      }
      style={{
        minHeight: 58,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border,
      }}>
      <View style={{ flex: 1, gap: 3 }}>
        <AppText numberOfLines={2} variant="bodySemibold">
          {item.subject ?? 'Subject not reported'}
        </AppText>
        {details.length ? (
          <AppText numberOfLines={2} variant="caption" color={theme.colors.textMuted}>
            {details.join(' · ')}
          </AppText>
        ) : null}
      </View>
      {item.status ? <Badge dot label={item.status} tone={statusTone(item.status)} /> : null}
    </View>
  );
}

function UniversityResultContent({ result }: { result: UniversityResult }) {
  const theme = useTheme();
  const summaryFields = [
    { label: 'CGPA', value: result.summary?.cgpa },
    { label: 'SGPA', value: result.summary?.sgpa },
    { label: 'Credits', value: result.summary?.credit },
    { label: 'Internal', value: result.summary?.totalInternal },
    { label: 'Result', value: result.summary?.passStatus },
  ].filter((field): field is { label: string; value: string } => Boolean(field.value));
  const lead = summaryFields.find((field) => field.label === 'CGPA' || field.label === 'SGPA');
  const otherSummaryFields = summaryFields.filter((field) => field !== lead);
  const hasData = summaryFields.length > 0 || result.subjects.length > 0 || result.exams.length > 0;

  if (!hasData) {
    return <ResultEmptyState category="university" />;
  }

  return (
    <Card padded={false} style={{ overflow: 'hidden' }}>
      {summaryFields.length > 0 ? (
        <View
          style={{
            padding: theme.spacing.lg,
            borderBottomWidth:
              result.subjects.length || result.exams.length ? StyleSheet.hairlineWidth : 0,
            borderBottomColor: theme.colors.border,
          }}>
          {lead ? (
            <>
              <AppText variant="label" color={theme.colors.textMuted}>
                {lead.label}
              </AppText>
              <AppText
                style={{
                  fontSize: 36,
                  lineHeight: 40,
                  fontFamily: theme.fonts.extrabold,
                  letterSpacing: -1.2,
                  fontVariant: ['tabular-nums'],
                  marginTop: theme.spacing.xs,
                }}>
                {lead.value}
              </AppText>
            </>
          ) : null}
          {otherSummaryFields.length ? (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                columnGap: theme.spacing.xl,
                rowGap: theme.spacing.sm,
                marginTop: lead ? theme.spacing.md : 0,
              }}>
              {otherSummaryFields.map((field) => (
                <View key={field.label} style={{ gap: 2 }}>
                  <AppText variant="caption" color={theme.colors.textMuted}>
                    {field.label}
                  </AppText>
                  <AppText variant="bodySemibold">{field.value}</AppText>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {result.subjects.length ? (
        <View
          style={{
            borderBottomWidth: result.exams.length ? StyleSheet.hairlineWidth : 0,
            borderBottomColor: theme.colors.border,
          }}>
          <AppText
            variant="bodySemibold"
            style={{
              paddingHorizontal: theme.spacing.lg,
              paddingTop: theme.spacing.lg,
              paddingBottom: theme.spacing.sm,
            }}>
            Subjects
          </AppText>
          {result.subjects.map((item, index) => (
            <UniversitySubjectRow
              isLast={index === result.subjects.length - 1}
              item={item}
              key={item.id}
            />
          ))}
        </View>
      ) : null}

      {result.exams.length ? (
        <View>
          <AppText
            variant="bodySemibold"
            style={{
              paddingHorizontal: theme.spacing.lg,
              paddingTop: theme.spacing.lg,
              paddingBottom: theme.spacing.sm,
            }}>
            University exams
          </AppText>
          {result.exams.map((exam, examIndex) => (
            <View
              key={exam.id}
              style={{
                borderTopWidth: examIndex === 0 ? 0 : StyleSheet.hairlineWidth,
                borderTopColor: theme.colors.border,
              }}>
              {exam.name ? (
                <AppText
                  variant="caption"
                  color={theme.colors.textMuted}
                  style={{ paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm }}>
                  {exam.name}
                </AppText>
              ) : null}
              {exam.subjects.map((item, subjectIndex) => (
                <UniversityExamSubjectRow
                  isLast={
                    examIndex === result.exams.length - 1 &&
                    subjectIndex === exam.subjects.length - 1
                  }
                  item={item}
                  key={exam.id + '-' + item.id}
                />
              ))}
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

function ResultEmptyState({ category }: { category: ResultCategory }) {
  const copy = EMPTY_COPY[category];
  const Icon = category === 'series' ? CalendarClock : GraduationCap;

  return (
    <Card>
      <EmptyState description={copy.description} icon={Icon} title={copy.title} />
    </Card>
  );
}

function ResultContent({ category, data }: { category: ResultCategory; data: ResultData }) {
  if (data.kind === 'university') {
    return <UniversityResultContent result={data.result} />;
  }
  if (data.kind === 'series') {
    return data.items.length === 0 ? (
      <ResultEmptyState category={category} />
    ) : (
      <Card padded={false} style={{ overflow: 'hidden' }}>
        {data.items.map((item, index) => (
          <SeriesExamRow
            isLast={index === data.items.length - 1}
            item={item}
            key={item.id}
          />
        ))}
      </Card>
    );
  }
  return data.items.length === 0 ? (
    <ResultEmptyState category={category} />
  ) : (
    <Card padded={false} style={{ overflow: 'hidden' }}>
      {data.items.map((item, index) => (
        <MarkRow isLast={index === data.items.length - 1} item={item} key={item.id} />
      ))}
    </Card>
  );
}

export default function ResultsScreen() {
  const theme = useTheme();
  const session = useSession();
  const [category, setCategory] = useState<ResultCategory>('internal');
  const accountScope = [
    session.baseUrl,
    session.profile.profileName?.trim() ?? '',
    session.profile.semId ?? '',
  ].join('|');
  const [semesterSelection, setSemesterSelection] = useState<{
    accountScope: string;
    semesterId: string;
  } | null>(null);
  const chosenSemesterId =
    semesterSelection?.accountScope === accountScope ? semesterSelection.semesterId : null;
  const semestersQuery = useResultSemesters();
  const semesters = useMemo(() => {
    const available = semestersQuery.data ?? [];
    const currentId = session.profile.semId;
    if (!currentId || available.some((semester) => semester.id === currentId)) return available;
    return [{ id: currentId, name: session.profile.semName }, ...available];
  }, [semestersQuery.data, session.profile.semId, session.profile.semName]);
  const semesterId = chosenSemesterId ?? session.profile.semId ?? '';
  const selectedSemester = semesters.find((semester) => semester.id === semesterId);
  const resultQuery = useResultCategory(category, semesterId);

  const refresh = () => {
    void Promise.all([
      semestersQuery.refetch(),
      semesterId ? resultQuery.refetch() : Promise.resolve(undefined),
    ]);
  };

  return (
    <Screen
      refreshControl={
        <RefreshControl
          colors={[theme.colors.accent]}
          onRefresh={refresh}
          refreshing={semestersQuery.isRefetching || resultQuery.isRefetching}
          tintColor={theme.colors.accent}
        />
      }
      scroll>
      <ScreenHeader
        back
        right={
          <SemesterPicker
            error={semestersQuery.isError}
            loading={semestersQuery.isLoading}
            onRetry={() => void semestersQuery.refetch()}
            onSelect={(id) => setSemesterSelection({ accountScope, semesterId: id })}
            selectedId={semesterId}
            selectedName={
              selectedSemester?.name ??
              (semesterId ? 'Semester ' + semesterId : undefined)
            }
            semesters={semesters}
          />
        }
        title="Results"
      />

      <CategoryTabs onChange={setCategory} value={category} />

      <View style={{ marginTop: theme.spacing.xl }}>
        {!semesterId ? (
          <Card>
            <EmptyState
              description="Choose a semester to view results."
              icon={GraduationCap}
              title="Select a semester"
            />
          </Card>
        ) : resultQuery.isLoading ? (
          <View style={{ gap: theme.spacing.sm }}>
            <Skeleton height={76} radius={theme.radii.md} />
            <Skeleton height={76} radius={theme.radii.md} />
            <Skeleton height={76} radius={theme.radii.md} />
            <Skeleton height={76} radius={theme.radii.md} />
          </View>
        ) : resultQuery.isError && !resultQuery.data ? (
          <ErrorState error={resultQuery.error} onRetry={() => void resultQuery.refetch()} />
        ) : resultQuery.data ? (
          <>
            {resultQuery.isError ? (
              <AppText
                variant="caption"
                color={theme.colors.textMuted}
                style={{ marginBottom: theme.spacing.sm }}>
                Saved result · refresh failed
              </AppText>
            ) : null}
            <ResultContent category={category} data={resultQuery.data} />
          </>
        ) : null}
      </View>
    </Screen>
  );
}
