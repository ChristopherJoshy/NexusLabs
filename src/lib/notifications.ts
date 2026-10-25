import {
  AndroidImportance,
  IosAuthorizationStatus,
  SchedulableTriggerInputTypes,
  cancelScheduledNotificationAsync,
  getAllScheduledNotificationsAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
  type NotificationRequest,
} from 'expo-notifications';
import { Platform } from 'react-native';

import type { Assignment } from './api/types';
import { formatDate, parseEtlabDate } from './format';

const OWNER = 'nexuslabs';
const REMINDER_KIND = 'assignment-reminder';
const CHANNEL_ID = 'assignment-reminders';
const MAX_SCHEDULED_REMINDERS = 50;
async function prepareChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Assignment reminders',
      description: 'On-device reminders for upcoming assignment deadlines.',
      importance: AndroidImportance.DEFAULT,
      vibrationPattern: [0, 120],
      lightColor: '#111111',
    });
  }
}

export async function requestAssignmentReminderPermission(): Promise<boolean> {
  await prepareChannel();
  const current = await getPermissionsAsync();
  if (current.granted || current.ios?.status === IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }
  const requested = await requestPermissionsAsync();
  return requested.granted || requested.ios?.status === IosAuthorizationStatus.PROVISIONAL;
}

function reminderDate(assignment: Assignment, now: Date): Date | null {
  const deadline = parseEtlabDate(assignment.lastDate);
  if (!deadline) return null;

  const reminder = new Date(deadline);
  reminder.setHours(9, 0, 0, 0);
  reminder.setDate(reminder.getDate() - 1);
  if (reminder <= now) {
    reminder.setTime(deadline.getTime());
    reminder.setHours(8, 0, 0, 0);
  }
  return reminder > now ? reminder : null;
}

function existingReminderKey(request: NotificationRequest): string | null {
  const data = request.content.data;
  return data?.owner === OWNER && typeof data.reminderKey === 'string' ? data.reminderKey : null;
}

/** Keep one future, local-only reminder per pending assignment. */
export async function syncAssignmentReminders(assignments: Assignment[]): Promise<number> {
  const permissions = await getPermissionsAsync();
  if (!permissions.granted && permissions.ios?.status !== IosAuthorizationStatus.PROVISIONAL) {
    return 0;
  }
  await prepareChannel();

  const now = new Date();
  const desired = assignments
    .filter((assignment) => {
      const state = assignment.status?.trim().toLowerCase();
      return state !== 'submitted' && !assignment.uploadedFile?.trim();
    })
    .map((assignment) => {
      const date = reminderDate(assignment, now);
      return date ? { assignment, date, key: `${assignment.id}:${date.toISOString()}` } : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, MAX_SCHEDULED_REMINDERS);

  const scheduled = await getAllScheduledNotificationsAsync();
  const owned = scheduled.filter((request) => request.content.data?.owner === OWNER);
  const desiredKeys = new Set(desired.map((item) => item.key));
  const existingKeys = new Set<string>();

  for (const request of owned) {
    const key = existingReminderKey(request);
    if (key && desiredKeys.has(key) && !existingKeys.has(key)) {
      existingKeys.add(key);
    } else {
      await cancelScheduledNotificationAsync(request.identifier);
    }
  }

  for (const item of desired) {
    if (existingKeys.has(item.key)) continue;
    const dueLabel = formatDate(item.assignment.lastDate, 'EEE d MMM');
    await scheduleNotificationAsync({
      content: {
        title: 'Assignment due soon',
        body: `${item.assignment.title} is due ${dueLabel}.`,
        sound: false,
        data: {
          owner: OWNER,
          kind: REMINDER_KIND,
          assignmentId: item.assignment.id,
          reminderKey: item.key,
        },
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: item.date,
        channelId: CHANNEL_ID,
      },
    });
  }

  return desired.length;
}

export async function clearAssignmentReminders(): Promise<void> {
  try {
    const scheduled = await getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((request) => request.content.data?.owner === OWNER)
        .map((request) => cancelScheduledNotificationAsync(request.identifier)),
    );
  } catch {
    // Notification APIs may be unavailable in a web preview or restricted device profile.
  }
}
