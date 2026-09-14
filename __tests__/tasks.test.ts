// @vitest-environment jsdom

import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { usePomodoro } from '../hooks/usePomodoro';
import { createDirectGoogleTask, completeDirectGoogleTask } from '../lib/googleStorage';

vi.mock('@capgo/capacitor-social-login', () => ({
  SocialLogin: {
    initialize: vi.fn().mockResolvedValue(true),
    login: vi.fn().mockResolvedValue({ result: { accessToken: { token: 'mock-google-token' } } }),
    logout: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('../lib/googleStorage', () => ({
  fetchAllGoogleDataDirectly: vi.fn().mockResolvedValue({ lists: [], tasks: [] }),
  createDirectGoogleTask: vi.fn().mockResolvedValue({ id: 'gtask-123', title: 'Sync mobile code' }),
  completeDirectGoogleTask: vi.fn().mockResolvedValue({ id: 'gtask-123', status: 'completed' }),
  readAppDataFromDrive: vi.fn().mockResolvedValue(null),
  saveAppDataToDrive: vi.fn().mockResolvedValue(true),
}));

vi.mock('../lib/audio', () => ({
  playCompletionChime: vi.fn(),
  requestNotificationPermission: vi.fn(),
  sendCompletionNotification: vi.fn(),
}));

describe('Automated Task Creation Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  
  it('triggers direct Google Tasks API request when adding to a Google list', async () => {
    localStorage.setItem('google_access_token', 'mock-google-token');
    localStorage.setItem('google_token_expiry', (Date.now() + 3600000).toString());

    const { result } = renderHook(() => usePomodoro());
    const googleList = { _id: 'list-google-1', gtask_list_id: 'list-google-1', type: 'google' };

    await act(async () => {
      await result.current.handleAddTaskToList(googleList, 'Sync mobile code');
    });

    expect(createDirectGoogleTask).toHaveBeenCalledWith('mock-google-token', 'list-google-1', 'Sync mobile code');
  });

  it('triggers direct Google Tasks API completion request when completing a Google task', async () => {
    localStorage.setItem('google_access_token', 'mock-google-token');
    localStorage.setItem('google_token_expiry', (Date.now() + 3600000).toString());

    const { result } = renderHook(() => usePomodoro());
    const googleTask = { _id: 'gtask-123', gtask_id: 'gtask-123', list_id: 'list-google-1', title: 'Complete code' };

    await act(async () => {
      await result.current.handleCompleteTask(googleTask);
    });

    expect(completeDirectGoogleTask).toHaveBeenCalledWith('mock-google-token', 'list-google-1', 'gtask-123');
  });
  it('updates estimated pomos for local and Google tasks and persists in localStorage', async () => {
    const { result } = renderHook(() => usePomodoro());
    const localList = { _id: 'default-local', type: 'local' };

    await act(async () => {
      await result.current.handleAddTaskToList(localList, 'Task for Estimation');
    });

    const taskId = result.current.tasks[0]._id;

    act(() => {
      result.current.updateEstimatedPomos(taskId, 4);
    });

    expect(result.current.tasks[0].estimated_pomos).toBe(4);
    const savedEstimates = JSON.parse(localStorage.getItem('task_estimates') || '{}');
    expect(savedEstimates[taskId]).toBe(4);
  });

  it('dynamically increments completed_pomos when a session is logged for a task', async () => {
    const { result } = renderHook(() => usePomodoro());
    const localList = { _id: 'default-local', type: 'local' };

    await act(async () => {
      await result.current.handleAddTaskToList(localList, 'Pomo Target Task');
    });

    const taskId = result.current.tasks[0]._id;

    act(() => {
      result.current.setSelectedTaskId(taskId);
    });

    await act(async () => {
      await result.current.handleLogSession();
    });

    const updatedTask = result.current.tasks.find((t: any) => t._id === taskId);
    expect(updatedTask.completed_pomos).toBe(1);
  });

  it('supports updating estimated pomos using object payload format', async () => {
    const { result } = renderHook(() => usePomodoro());
    const localList = { _id: 'default-local', type: 'local' };

    await act(async () => {
      await result.current.handleAddTaskToList(localList, 'Object Payload Test Task');
    });

    const task = result.current.tasks[0];

    act(() => {
      // Test object parameter signature as called in MobileView.tsx
      result.current.updateEstimatedPomos({ taskId: task._id, estimatedPomos: 3 });
    });

    expect(result.current.tasks[0].estimated_pomos).toBe(3);
  });
});