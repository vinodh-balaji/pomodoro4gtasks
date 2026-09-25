// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePomodoro } from '../hooks/usePomodoro';

// Mock Capacitor Plugins & Audio with Promises to support .catch() chains
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

describe('usePomodoro Hook - Regression Safety Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  it('1. Initial state should load default starter tasks and 25-minute duration', () => {
    const { result } = renderHook(() => usePomodoro());
    expect(result.current.seconds).toBe(25 * 60);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.tasks.length).toBeGreaterThan(0);
  });

  it('2. Starting timer should update isRunning state and switch tab to dashboard', async () => {
    const { result } = renderHook(() => usePomodoro());
    localStorage.setItem('has_prompted_notifications', 'true');

    await act(async () => {
      await result.current.handleStart();
    });

    expect(result.current.isRunning).toBe(true);
    expect(result.current.activeTab).toBe('dashboard');
  });

  it('3. Pausing timer should halt countdown and preserve remaining seconds', async () => {
    const { result } = renderHook(() => usePomodoro());
    localStorage.setItem('has_prompted_notifications', 'true');

    await act(async () => {
      await result.current.handleStart();
    });

    act(() => {
      vi.advanceTimersByTime(5000); // 5 seconds pass
    });

    await act(async () => {
      await result.current.handlePause();
    });

    expect(result.current.isRunning).toBe(false);
    expect(result.current.seconds).toBe(25 * 60 - 5);
  });

  it('4. Logging a session manually should record session and reset timer', async () => {
    const { result } = renderHook(() => usePomodoro());
    
    act(() => {
      result.current.handleSelectTask('loc-start-1');
    });

    await act(async () => {
      await result.current.handleLogSession();
    });

    expect(result.current.sessions.length).toBe(1);
    expect(result.current.sessions[0].task_id).toBe('loc-start-1');
    expect(result.current.seconds).toBe(25 * 60);
    expect(result.current.isRunning).toBe(false);
  });

  it('5. Dynamic Pomodoro Count should increment when a session is logged for a task', async () => {
    const { result } = renderHook(() => usePomodoro());
    const targetTaskId = 'loc-start-1';

    const initialTask = result.current.tasks.find((t) => t._id === targetTaskId);
    const initialCompleted = initialTask?.completed_pomos || 0;

    act(() => {
      result.current.handleSelectTask(targetTaskId);
    });

    await act(async () => {
      await result.current.handleLogSession();
    });

    const updatedTask = result.current.tasks.find((t) => t._id === targetTaskId);
    expect(updatedTask?.completed_pomos).toBe(initialCompleted + 1);
  });

  it('6. Updating estimated pomodoros override should persist across renders', () => {
    const { result } = renderHook(() => usePomodoro());
    const targetTaskId = 'loc-start-1';

    act(() => {
      result.current.updateEstimatedPomos(targetTaskId, 4);
    });

    const updatedTask = result.current.tasks.find((t) => t._id === targetTaskId);
    expect(updatedTask?.estimated_pomos).toBe(4);
    expect(localStorage.getItem('task_estimates')).toContain('4');
  });
});