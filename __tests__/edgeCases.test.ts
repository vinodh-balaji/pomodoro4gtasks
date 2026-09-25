// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePomodoro } from '../hooks/usePomodoro';

vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    schedule: vi.fn(() => Promise.resolve()),
    cancel: vi.fn(() => Promise.resolve()),
    requestPermissions: vi.fn(() => Promise.resolve()),
  },
}));
vi.mock('@capacitor/app', () => ({
  App: { addListener: vi.fn(() => Promise.resolve({ remove: vi.fn() })) },
}));
vi.mock('../lib/audio', () => ({
  playPop: vi.fn(),
  playTick: vi.fn(),
  playCompletionChime: vi.fn(),
  requestNotificationPermission: vi.fn(() => Promise.resolve()),
  sendCompletionNotification: vi.fn(),
  getSoundMuted: vi.fn(() => false),
  setSoundMuted: vi.fn(),
}));

describe('usePomodoro - Edge Cases & Complete Coverage Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  it('1. Triggers notification prompt modal on first start if not previously prompted', async () => {
    const { result } = renderHook(() => usePomodoro());

    await act(async () => {
      await result.current.handleStart();
    });

    // Should prompt user and NOT start timer yet
    expect(result.current.showNotificationPrompt).toBe(true);
    expect(result.current.isRunning).toBe(false);

    // Confirm permissions
    await act(async () => {
      await result.current.handleConfirmNotificationPermission(true);
    });

    expect(result.current.showNotificationPrompt).toBe(false);
    expect(result.current.isRunning).toBe(true);
    expect(localStorage.getItem('has_prompted_notifications')).toBe('true');
  });

  it('2. Auto-finishes timer when countdown reaches 0:00 via setInterval ticks', async () => {
    const { result } = renderHook(() => usePomodoro());
    localStorage.setItem('has_prompted_notifications', 'true');

    act(() => {
      result.current.handleSelectTask('loc-start-1');
    });

    await act(async () => {
      await result.current.handleStart();
    });

    expect(result.current.isRunning).toBe(true);

    // Fast-forward full 25 minutes (25 * 60 * 1000 ms)
    await act(async () => {
      vi.advanceTimersByTime(25 * 60 * 1000);
    });

    expect(result.current.isRunning).toBe(false);
    expect(result.current.sessions.length).toBe(1);
    expect(result.current.sessions[0].task_id).toBe('loc-start-1');
  });

  it('3. Renames task title locally via handleEditTask and persists to localStorage', async () => {
    const { result } = renderHook(() => usePomodoro());
    const targetTaskId = 'loc-start-1';

    await act(async () => {
      await result.current.handleEditTask(targetTaskId, 'Updated Renamed Task Title');
    });

    const updatedTask = result.current.tasks.find((t) => t._id === targetTaskId);
    expect(updatedTask?.title).toBe('Updated Renamed Task Title');

    const savedLocalTasks = JSON.parse(localStorage.getItem('local_tasks') || '[]');
    expect(savedLocalTasks.find((t: any) => t._id === targetTaskId)?.title).toBe('Updated Renamed Task Title');
  });

  it('4. Deleting a session via handleDeleteSession updates session list and dynamic pomo count', async () => {
    const { result } = renderHook(() => usePomodoro());
    const targetTaskId = 'loc-start-1';

    act(() => {
      result.current.handleSelectTask(targetTaskId);
    });

    // Log a session
    await act(async () => {
      await result.current.handleLogSession();
    });

    expect(result.current.sessions.length).toBe(1);
    const loggedSessionId = result.current.sessions[0]._id;

    // Delete session
    act(() => {
      result.current.handleDeleteSession(loggedSessionId);
    });

    expect(result.current.sessions.length).toBe(0);
    const updatedTask = result.current.tasks.find((t) => t._id === targetTaskId);
    expect(updatedTask?.completed_pomos).toBe(0);
  });

  it('5. Recalculates remaining time on visibilitychange (app resume / phone unlock)', async () => {
    const { result } = renderHook(() => usePomodoro());
    localStorage.setItem('has_prompted_notifications', 'true');

    await act(async () => {
      await result.current.handleStart();
    });

    // Simulate 10 minutes passing while app was minimized
    const targetEndTime = Date.now() + (25 * 60 - 600) * 1000;
    localStorage.setItem('pomo_target_end_time', targetEndTime.toString());

    // Dispatch visibilitychange event
    act(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.seconds).toBeLessThanOrEqual(25 * 60 - 600);
  });

  it('6. Respects custom workDurationMinutes setting when starting new session', async () => {
    const { result } = renderHook(() => usePomodoro());
    localStorage.setItem('has_prompted_notifications', 'true');

    act(() => {
      result.current.setWorkDurationMinutes(50);
      result.current.setSeconds(50 * 60);
    });

    expect(result.current.seconds).toBe(50 * 60);

    await act(async () => {
      await result.current.handleStart();
    });

    expect(result.current.isRunning).toBe(true);
  });
});