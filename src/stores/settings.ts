import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'system' | 'light' | 'dark';
export type HomeModule = 'attendance' | 'schedule' | 'assignments' | 'notices';

type SettingsState = {
  themeMode: ThemeMode;
  attendanceTarget: number;
  hapticsEnabled: boolean;
  assignmentRemindersEnabled: boolean;
  homeModules: HomeModule[];
  setThemeMode: (mode: ThemeMode) => void;
  setAttendanceTarget: (target: number) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setAssignmentRemindersEnabled: (enabled: boolean) => void;
  toggleHomeModule: (module: HomeModule) => void;
  moveHomeModule: (module: HomeModule, direction: -1 | 1) => void;
};

const DEFAULT_HOME_MODULES: HomeModule[] = ['attendance', 'schedule', 'assignments', 'notices'];

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      themeMode: 'system',
      attendanceTarget: 75,
      hapticsEnabled: false,
      assignmentRemindersEnabled: false,
      homeModules: DEFAULT_HOME_MODULES,
      setThemeMode: (themeMode) => set({ themeMode }),
      setAttendanceTarget: (attendanceTarget) =>
        set({ attendanceTarget: Math.min(99, Math.max(1, attendanceTarget)) }),
      setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
      setAssignmentRemindersEnabled: (assignmentRemindersEnabled) => set({ assignmentRemindersEnabled }),
      toggleHomeModule: (module) =>
        set((state) => {
          const exists = state.homeModules.includes(module);
          if (exists && state.homeModules.length === 1) return state;
          return {
            homeModules: exists
              ? state.homeModules.filter((item) => item !== module)
              : [...state.homeModules, module],
          };
        }),
      moveHomeModule: (module, direction) =>
        set((state) => {
          const index = state.homeModules.indexOf(module);
          const nextIndex = index + direction;
          if (index < 0 || nextIndex < 0 || nextIndex >= state.homeModules.length) return state;
          const homeModules = state.homeModules.slice();
          [homeModules[index], homeModules[nextIndex]] = [homeModules[nextIndex], homeModules[index]];
          return { homeModules };
        }),
    }),
    {
      name: 'nexuslabs.settings.v2',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      partialize: (state) => ({
        themeMode: state.themeMode,
        attendanceTarget: state.attendanceTarget,
        hapticsEnabled: state.hapticsEnabled,
        assignmentRemindersEnabled: state.assignmentRemindersEnabled,
        homeModules: state.homeModules,
      }),
    },
  ),
);
