// @vitest-environment jsdom

import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { usePomodoro } from '../hooks/usePomodoro';
import { App } from '@capacitor/app';
import { fetchAllGoogleDataDirectly, readAppDataFromDrive } from '../lib/googleStorage';

let appStateCallback: ((state: { isActive: boolean }) => void) | null = null;

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: vi.fn((event, callback) => {
      appStateCallback = callback;
      return Promise.resolve({ remove: vi.fn() });
    }),
  },
}));

vi.mock('@capgo/capacitor-social-login', () => ({
  SocialLogin: {
    initialize: vi.fn().mockResolvedValue(true),
    login: vi.fn().mockResolvedValue({ result: { accessToken: { token: 'valid-token-123' } } }),
    logout: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('../lib/googleStorage', () => ({
  fetchAllGoogleDataDirectly: vi.fn().mockResolvedValue({ lists: [], tasks: [] }),
  createDirectGoogleTask: vi.fn().mockResolvedValue({ id: '123' }),
  readAppDataFromDrive: vi.fn().mockResolvedValue(null),
  saveAppDataToDrive: vi.fn().mockResolvedValue(true),
}));

vi.mock('../lib/audio', () => ({
  playCompletionChime: vi.fn(),
  requestNotificationPermission: vi.fn(),
  sendCompletionNotification: vi.fn(),
}));

describe('Automated Hybrid Sync Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('triggers a silent background sync when native app comes to foreground', async () => {
    localStorage.setItem('google_access_token', 'valid-token-123');
    localStorage.setItem('google_token_expiry', (Date.now() + 3600000).toString());

    renderHook(() => usePomodoro());

    expect(App.addListener).toHaveBeenCalledWith('appStateChange', expect.any(Function));

    await act(async () => {
      if (appStateCallback) {
        await appStateCallback({ isActive: true });
      }
    });

    expect(fetchAllGoogleDataDirectly).toHaveBeenCalledWith('valid-token-123', undefined);
    expect(readAppDataFromDrive).toHaveBeenCalledWith('valid-token-123');
  });

  it('polls for Google Task updates every 120 seconds while on the tasks tab', async () => {
    vi.useFakeTimers();
    localStorage.setItem('google_access_token', 'valid-token-123');
    localStorage.setItem('google_token_expiry', (Date.now() + 3600000).toString());

    const { result } = renderHook(() => usePomodoro());

    act(() => {
      result.current.setActiveTab('board');
    });

    await act(async () => {
      vi.advanceTimersByTime(120000);
    });

    expect(fetchAllGoogleDataDirectly).toHaveBeenCalledWith('valid-token-123', undefined);
  });


  it('merges drive sessions with local sessions without overwriting historical heatmap data', async () => {
    const localSession = { _id: 'sess-local-1', completed_at: '2026-09-13T10:00:00.000Z', duration_minutes: 25, task_id: 't1' };
    const remoteSession = { _id: 'sess-remote-2', completed_at: '2026-09-13T11:00:00.000Z', duration_minutes: 25, task_id: 't2' };

    localStorage.setItem('local_sessions', JSON.stringify([localSession]));
    vi.mocked(readAppDataFromDrive).mockResolvedValueOnce({
      localLists: [],
      localTasks: [],
      sessions: [remoteSession],
      settings: {},
    });

    const { result } = renderHook(() => usePomodoro());

    await act(async () => {
      await result.current.handleSyncGoogleTasks(true, 'valid-token-123', true);
    });

    expect(result.current.todaySessions).toHaveLength(2);
    const storedSessions = JSON.parse(localStorage.getItem('local_sessions') || '[]');
    expect(storedSessions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ _id: 'sess-local-1' }),
        expect.objectContaining({ _id: 'sess-remote-2' }),
      ])
    );
  });
});