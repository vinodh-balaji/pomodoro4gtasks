// @vitest-environment jsdom

import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { usePomodoro } from '../hooks/usePomodoro';

vi.mock('@capgo/capacitor-social-login', () => ({
  SocialLogin: {
    initialize: vi.fn().mockResolvedValue(true),
    login: vi.fn().mockResolvedValue({ result: { accessToken: { token: 'mock-token-123' } } }),
    logout: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('../lib/googleStorage', () => ({
  fetchAllGoogleDataDirectly: vi.fn().mockResolvedValue({
    lists: [{ _id: 'g-list-1', gtask_list_id: 'g-list-1', title: 'Google Tasks', type: 'google', is_visible: true }],
    tasks: [{ _id: 'g-task-1', gtask_id: 'g-task-1', list_id: 'g-list-1', title: 'Sync mobile code', status: 'needsAction', estimated_pomos: 1, completed_pomos: 0 }],
  }),
  createDirectGoogleTask: vi.fn().mockResolvedValue({ id: 'g-task-2', title: 'New Task' }),
  readAppDataFromDrive: vi.fn().mockResolvedValue(null),
  saveAppDataToDrive: vi.fn().mockResolvedValue(true),
}));

vi.mock('../lib/audio', () => ({
  playCompletionChime: vi.fn(),
  requestNotificationPermission: vi.fn(),
  sendCompletionNotification: vi.fn(),
}));

describe('Automated Auth Suite: Login & Logout Flows', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('automates native Google login, updates state, and persists token to localStorage', async () => {
    const { result } = renderHook(() => usePomodoro());

    await act(async () => {
      await result.current.loginNative();
    });

    expect(result.current.accessToken).toBe('mock-token-123');
    expect(localStorage.getItem('google_access_token')).toBe('mock-token-123');
  });

  it('automates account logout, clears native session, purges storage, and resets task selection', async () => {
    localStorage.setItem('google_access_token', 'mock-token-123');
    localStorage.setItem('google_token_expiry', (Date.now() + 3600000).toString());

    const { result } = renderHook(() => usePomodoro());

    act(() => {
      result.current.setSelectedTaskId('task-456');
    });
    expect(result.current.selectedTaskId).toBe('task-456');

    await act(async () => {
      await result.current.handleLogout();
    });

    expect(result.current.accessToken).toBeNull();
    expect(result.current.selectedTaskId).toBe('');
    expect(localStorage.getItem('google_access_token')).toBeNull();
  });

  it('automatically filters out Google tasks and lists when logged out', async () => {
    const { result } = renderHook(() => usePomodoro());

   expect(result.current.lists).toEqual([
      {
        _id: 'local-default',
        title: 'My Tasks',
        type: 'local',
        is_visible: true,
      },
    ]);
    expect(result.current.tasks).toEqual([]);
  });
});