import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDays, format, subDays } from 'date-fns';

type ProgressState = {
  studyDates: string[];
  logToday: () => void;
  clear: () => void;
};

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      studyDates: [],
      logToday: () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        set((state) => state.studyDates.includes(today)
          ? state
          : { studyDates: [...state.studyDates, today].sort() });
      },
      clear: () => set({ studyDates: [] }),
    }),
    {
      name: 'nexuslabs.progress.v1',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: (state) => ({ studyDates: state.studyDates }),
    },
  ),
);

export function studyProgress(studyDates: string[], now = new Date()): {
  loggedToday: boolean;
  sessionsThisWeek: number;
  currentStreak: number;
} {
  const dates = new Set(studyDates);
  const today = format(now, 'yyyy-MM-dd');
  const startOfWeek = subDays(now, 6);
  const sessionsThisWeek = studyDates.filter((date) => {
    const parsed = new Date(`${date}T00:00:00`);
    return parsed >= new Date(`${format(startOfWeek, 'yyyy-MM-dd')}T00:00:00`) && date <= today;
  }).length;

  let cursor = dates.has(today) ? now : subDays(now, 1);
  let currentStreak = 0;
  while (dates.has(format(cursor, 'yyyy-MM-dd'))) {
    currentStreak += 1;
    cursor = addDays(cursor, -1);
  }

  return { loggedToday: dates.has(today), sessionsThisWeek, currentStreak };
}
