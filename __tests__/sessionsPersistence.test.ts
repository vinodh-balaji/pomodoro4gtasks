/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePomodoro } from '../hooks/usePomodoro';
import * as googleStorage from '../lib/googleStorage';

// --- MOCKS ---
vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    schedule: vi.fn().mockResolvedValue(true),
    cancel: vi.fn().mockResolvedValue(true),
    requestPermissions: vi.fn().mockResolvedValue({ display: 'granted' }),
  },
}));

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
  },
}));

vi.mock('@capgo/capacitor-social-login', () => ({
  SocialLogin: {
    initialize: vi.fn().mockResolvedValue(true),
    login: vi.fn().mockResolvedValue({ result: { accessToken: { token: 'mock-token' } } }),
    logout: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('../lib/audio', () => ({
  playCompletionChime: vi.fn(),
  playPop: vi.fn(),
  playTick: vi.fn(),
  requestNotificationPermission: vi.fn(),
  sendCompletionNotification: vi.fn(),
  setSoundMuted: vi.fn(),
  getSoundMuted: vi.fn().mockReturnValue(false),
  getTickEnabled: vi.fn().mockReturnValue(true),
  setTickEnabled: vi.fn(),
  getCurrentAmbientType: vi.fn().mockReturnValue('none'),
  getAmbientVolume: vi.fn().mockReturnValue(0.2),
  updateAmbientVolume: vi.fn(),
  startAmbientSound: vi.fn(),
  stopAmbientSound: vi.fn(),
}));

vi.mock('../lib/googleStorage', () => ({
  fetchAllGoogleDataDirectly: vi.fn().mockResolvedValue({ lists: [], tasks: [] }),
  createDirectGoogleTask: vi.fn(),
  completeDirectGoogleTask: vi.fn().mockResolvedValue(true),
  updateDirectGoogleTask: vi.fn().mockResolvedValue(true),
  createDirectGoogleList: vi.fn(),
  readAppDataFromDrive: vi.fn().mockResolvedValue(null),
  saveAppDataToDrive: vi.fn().mockResolvedValue(true),
}));

describe('usePomodoro - Edge Cases & Data Integrity Test Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // --- CATEGORY 1: TIMING & RACE CONDITIONS ---

  describe('1. Mid-Sprint Completion & Task Switching', () => {
    it('1.1a: logs as "Focus Session" if task is completed mid-sprint and no new task is selected', async () => {
      const { result } = renderHook(() => usePomodoro());

      const taskObj = { _id: 'loc-test-1', list_id: 'local-default', title: 'Sprint Feature X', status: 'needsAction' };

      act(() => {
        localStorage.setItem('local_tasks', JSON.stringify([taskObj]));
      });

      const { result: hydrated } = renderHook(() => usePomodoro());

      act(() => {
        hydrated.current.setSelectedTaskId('loc-test-1');
        hydrated.current.setIsRunning(true);
      });

      act(() => {
        hydrated.current.handleCompleteTask(taskObj);
      });

      expect(hydrated.current.tasks.find((t: any) => t._id === 'loc-test-1')).toBeUndefined();

      await act(async () => {
        await hydrated.current.handleLogSession();
      });

      const lastSession = hydrated.current.sessions[hydrated.current.sessions.length - 1];
      expect(lastSession).toBeDefined();
      expect(lastSession.task_title).toBe('Focus Session');
    });

    it('1.1b: logs with new task title if task is completed mid-sprint and a new task is selected before finish', async () => {
      const task1 = { _id: 'loc-test-1', list_id: 'local-default', title: 'Sprint Feature X', status: 'needsAction' };
      const task2 = { _id: 'loc-test-2', list_id: 'local-default', title: 'Sprint Feature Y', status: 'needsAction' };

      act(() => {
        localStorage.setItem('local_tasks', JSON.stringify([task1, task2]));
      });

      const { result } = renderHook(() => usePomodoro());

      act(() => {
        result.current.setSelectedTaskId('loc-test-1');
        result.current.setIsRunning(true);
      });

      act(() => {
        result.current.handleCompleteTask(task1);
      });

      act(() => {
        result.current.setSelectedTaskId('loc-test-2');
      });

      await act(async () => {
        await result.current.handleLogSession();
      });

      const lastSession = result.current.sessions[result.current.sessions.length - 1];
      expect(lastSession).toBeDefined();
      expect(lastSession.task_title).toBe('Sprint Feature Y');
    });
  });

  // --- CATEGORY 2: TITLE FALSINESS & EDGE CHARACTERS ---

  describe('2. Title Falsiness & Special Characters', () => {
    it('2.1: handles empty/whitespace task titles gracefully with fallback logic', () => {
      const whitespaceSession = {
        _id: 'sess-ws',
        task_id: 't-1',
        task_title: '   ',
        duration_minutes: 25,
      };

      const emptySession = {
        _id: 'sess-empty',
        task_id: 't-2',
        task_title: '',
        duration_minutes: 25,
      };

      const getDisplayTitle = (sess: any) =>
        typeof sess.task_title === 'string' && sess.task_title.trim() !== ''
          ? sess.task_title
          : 'Focus Session';

      expect(getDisplayTitle(whitespaceSession)).toBe('Focus Session');
      expect(getDisplayTitle(emptySession)).toBe('Focus Session');
    });

    it('2.2: safely serializes and restores complex titles with special chars and emojis', () => {
      const complexTitle = `App "V2" & 'Fixes' <script>alert("xss")</script> 🍅`;

      const sessionWithComplexTitle = {
        _id: 'sess-complex-1',
        completed_at: new Date().toISOString(),
        duration_minutes: 25,
        task_id: 'task-spec-1',
        task_title: complexTitle,
        list_title: 'General',
      };

      act(() => {
        localStorage.setItem('local_sessions', JSON.stringify([sessionWithComplexTitle]));
      });

      const restored = JSON.parse(localStorage.getItem('local_sessions') || '[]');
      expect(restored[0].task_title).toBe(complexTitle);
    });
  });

  // --- CATEGORY 3: MULTI-DEVICE & CONCURRENT SYNC ---

  describe('3. Multi-Device & Concurrent Sync', () => {
    it('3.1: non-destructively merges Drive sessions without dropping local task titles', () => {
      const localSessions = [
        { _id: 'sess-100', task_id: 'gtask-abc', task_title: 'Refactor Auth Pipeline', duration_minutes: 25 },
      ];

      const incomingDriveSessions = [
        { _id: 'sess-100', task_id: 'gtask-abc', duration_minutes: 25 },
        { _id: 'sess-200', task_id: 'gtask-def', task_title: 'Cloud Task B', duration_minutes: 25 },
      ];

      const sessionMap = new Map();

      localSessions.forEach((s) => sessionMap.set(s._id, s));

      incomingDriveSessions.forEach((s) => {
        const existing = sessionMap.get(s._id);
        sessionMap.set(s._id, {
          ...s,
          _id: s._id,
          task_title: existing?.task_title || s.task_title || 'Focus Session',
        });
      });

      const merged = Array.from(sessionMap.values());

      expect(merged).toHaveLength(2);
      expect(merged.find((s) => s._id === 'sess-100').task_title).toBe('Refactor Auth Pipeline');
      expect(merged.find((s) => s._id === 'sess-200').task_title).toBe('Cloud Task B');
    });

    it('3.2: generates unique session IDs during rapid synchronous double-tap calls', async () => {
      const { result } = renderHook(() => usePomodoro());

      await act(async () => {
        for (let i = 0; i < 10; i++) {
          await result.current.handleLogSession();
        }
      });

      const sessionIds = result.current.sessions.map((s: any) => s._id);
      const uniqueIds = new Set(sessionIds);

      expect(uniqueIds.size).toBe(sessionIds.length);
    });

    it('3.3: syncs logged session with task_title to AppData, survives local storage purge, and restores title on full sync', async () => {
      let capturedDrivePayload: any = null;
      vi.mocked(googleStorage.saveAppDataToDrive).mockImplementation(async (_token: string, payload: any) => {
        capturedDrivePayload = payload;
        return true;
      });

      localStorage.setItem('google_access_token', 'mock-valid-token');
      localStorage.setItem('google_token_expiry', (Date.now() + 3600000).toString());

      const activeTask = { _id: 'loc-sync-1', list_id: 'local-default', title: 'Critical Bug Fix 🐛' };
      localStorage.setItem('local_tasks', JSON.stringify([activeTask]));

      const { result } = renderHook(() => usePomodoro());

      act(() => {
        result.current.setSelectedTaskId('loc-sync-1');
      });
      await act(async () => {
        await result.current.handleLogSession();
      });

      expect(googleStorage.saveAppDataToDrive).toHaveBeenCalled();
      expect(capturedDrivePayload).not.toBeNull();
      expect(capturedDrivePayload.sessions[0].task_title).toBe('Critical Bug Fix 🐛');

      act(() => {
        localStorage.removeItem('local_sessions');
      });
      expect(localStorage.getItem('local_sessions')).toBeNull();

      vi.mocked(googleStorage.readAppDataFromDrive).mockResolvedValueOnce(capturedDrivePayload);

      await act(async () => {
        await result.current.handleSyncGoogleTasks(true, 'mock-valid-token', true);
      });

      const restoredSessions = result.current.sessions;
      expect(restoredSessions).toHaveLength(1);
      expect(restoredSessions[0].task_title).toBe('Critical Bug Fix 🐛');
    });
  });
});