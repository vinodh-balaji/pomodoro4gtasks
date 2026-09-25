import { describe, it, expect } from 'vitest';
import { timerReducer, initialTimerState, TimerState } from '../lib/timerReducer';

describe('timerReducer - Pure State Unit Tests', () => {
  it('1. START_TIMER updates status to RUNNING and sets targetEndTime atomically', () => {
    const nextState = timerReducer(initialTimerState, { type: 'START_TIMER', taskId: 'task-999' });
    
    expect(nextState.status).toBe('RUNNING');
    expect(nextState.selectedTaskId).toBe('task-999');
    expect(nextState.targetEndTime).toBeGreaterThan(Date.now());
  });

  it('2. PAUSE_TIMER updates status to PAUSED and clears targetEndTime', () => {
    const runningState: TimerState = {
      ...initialTimerState,
      status: 'RUNNING',
      targetEndTime: Date.now() + 100000,
    };

    const nextState = timerReducer(runningState, { type: 'PAUSE_TIMER' });
    expect(nextState.status).toBe('PAUSED');
    expect(nextState.targetEndTime).toBeNull();
  });

  it('3. TICK decrements seconds', () => {
    const stateAt1: TimerState = {
      ...initialTimerState,
      status: 'RUNNING',
      seconds: 1,
    };

    const nextState = timerReducer(stateAt1, { type: 'TICK' });
    expect(nextState.seconds).toBe(0);
    expect(nextState.status).toBe('RUNNING');
  });

  it('4. LOG_SESSION resets seconds to workDurationMinutes * 60', () => {
    const stateInMiddle: TimerState = {
      ...initialTimerState,
      status: 'RUNNING',
      seconds: 300,
      selectedTaskId: 'task-1',
    };

    const nextState = timerReducer(stateInMiddle, { type: 'LOG_SESSION' });
    expect(nextState.status).toBe('IDLE');
    expect(nextState.seconds).toBe(25 * 60);
    expect(nextState.selectedTaskId).toBe('task-1'); // Preserves task selection context
  });
});