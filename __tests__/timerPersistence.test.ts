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

describe('Timer State Persistence & Tab Forefront Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  it('1. Serializes timer state to localStorage when starting a timer', async () => {
    const { result } = renderHook(() => usePomodoro());
    localStorage.setItem('has_prompted_notifications', 'true');

    await act(async () => {
      await result.current.handleStart();
    });

    const savedState = JSON.parse(localStorage.getItem('pomo_timer_state') || '{}');
    expect(savedState.status).toBe('RUNNING');
    expect(savedState.seconds).toBe(25 * 60);
    expect(savedState.targetEndTime).toBeGreaterThan(Date.now());
  });

  it('2. Hydrates running timer state and calculates remaining seconds after browser reload', () => {
    const tenMinutesInFuture = Date.now() + 600 * 1000;
    const preExistingState = {
      status: 'RUNNING',
      seconds: 600,
      selectedTaskId: 'task-123',
      targetEndTime: tenMinutesInFuture,
      workDurationMinutes: 25,
    };

    localStorage.setItem('pomo_timer_state', JSON.stringify(preExistingState));

    const { result } = renderHook(() => usePomodoro());

    expect(result.current.isRunning).toBe(true);
    expect(result.current.selectedTaskId).toBe('task-123');
    expect(result.current.seconds).toBeLessThanOrEqual(600);
  });

  it('3. Updates active task mid-session, persists to localStorage, and restores Task B on relaunch', async () => {
    const { result, unmount } = renderHook(() => usePomodoro());
    localStorage.setItem('has_prompted_notifications', 'true');

    act(() => {
      result.current.handleSelectTask('loc-start-1'); // Task A
    });

    await act(async () => {
      await result.current.handleStart();
    });

    expect(result.current.selectedTaskId).toBe('loc-start-1');

    // Switch to Task B mid-session
    act(() => {
      result.current.handleSelectTask('loc-start-2'); // Task B
    });

    expect(result.current.selectedTaskId).toBe('loc-start-2');

    // Verify localStorage was updated automatically
    const savedState = JSON.parse(localStorage.getItem('pomo_timer_state') || '{}');
    expect(savedState.selectedTaskId).toBe('loc-start-2');

    // Simulate closing the app
    unmount();

    // Relaunch the app
    const { result: relaunchedResult } = renderHook(() => usePomodoro());

    expect(relaunchedResult.current.selectedTaskId).toBe('loc-start-2');
    expect(relaunchedResult.current.isRunning).toBe(true);
  });

  it('4. Automatically focuses the Timer tab (dashboard) when restoring an active running session', () => {
    const tenMinutesInFuture = Date.now() + 600 * 1000;
    const runningTimerState = {
      status: 'RUNNING',
      seconds: 600,
      selectedTaskId: 'task-123',
      targetEndTime: tenMinutesInFuture,
      workDurationMinutes: 25,
    };

    localStorage.setItem('pomo_timer_state', JSON.stringify(runningTimerState));

    const { result } = renderHook(() => usePomodoro());

    expect(result.current.isRunning).toBe(true);
    expect(result.current.activeTab).toBe('dashboard');
  });
});