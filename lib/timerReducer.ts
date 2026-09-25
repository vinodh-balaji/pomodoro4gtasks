export type TimerStatus = 'IDLE' | 'RUNNING' | 'PAUSED';

export type TimerState = {
  status: TimerStatus;
  seconds: number;
  selectedTaskId: string;
  targetEndTime: number | null;
  workDurationMinutes: number;
};

export type TimerAction =
  | { type: 'START_TIMER'; taskId?: string }
  | { type: 'PAUSE_TIMER' }
  | { type: 'RESUME_TIMER' }
  | { type: 'TICK'; remainingSeconds?: number }
  | { type: 'SELECT_TASK'; taskId: string }
  | { type: 'CLEAR_TASK' }
  | { type: 'LOG_SESSION' }
  | { type: 'SET_DURATION'; minutes: number }
  | { type: 'RESTORE_STATE'; payload: Partial<TimerState> };

export const DEFAULT_WORK_MINUTES = 25;

export const initialTimerState: TimerState = {
  status: 'IDLE',
  seconds: DEFAULT_WORK_MINUTES * 60,
  selectedTaskId: '',
  targetEndTime: null,
  workDurationMinutes: DEFAULT_WORK_MINUTES,
};

export function timerReducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case 'START_TIMER': {
      const activeTaskId = action.taskId !== undefined ? action.taskId : state.selectedTaskId;
      const durationSeconds = state.seconds > 0 ? state.seconds : state.workDurationMinutes * 60;
      const now = Date.now();

      return {
        ...state,
        status: 'RUNNING',
        selectedTaskId: activeTaskId,
        seconds: durationSeconds,
        targetEndTime: now + durationSeconds * 1000,
      };
    }

    case 'PAUSE_TIMER': {
      return {
        ...state,
        status: 'PAUSED',
        targetEndTime: null,
      };
    }

    case 'RESUME_TIMER': {
      const now = Date.now();
      return {
        ...state,
        status: 'RUNNING',
        targetEndTime: now + state.seconds * 1000,
      };
    }

    case 'TICK': {
      if (action.remainingSeconds !== undefined) {
        const nextSeconds = Math.max(0, action.remainingSeconds);
        return {
          ...state,
          seconds: nextSeconds,
        };
      }

      const nextSeconds = Math.max(0, state.seconds - 1);
      return {
        ...state,
        seconds: nextSeconds,
      };
    }

    case 'SELECT_TASK': {
      return {
        ...state,
        selectedTaskId: action.taskId,
      };
    }

    case 'CLEAR_TASK': {
      return {
        ...state,
        selectedTaskId: '',
      };
    }

    case 'LOG_SESSION': {
      return {
        ...state,
        status: 'IDLE',
        seconds: state.workDurationMinutes * 60,
        targetEndTime: null,
      };
    }

    case 'SET_DURATION': {
      const newMinutes = Math.max(1, action.minutes);
      return {
        ...state,
        workDurationMinutes: newMinutes,
        seconds: state.status === 'IDLE' ? newMinutes * 60 : state.seconds,
      };
    }

    case 'RESTORE_STATE': {
      return {
        ...state,
        ...action.payload,
      };
    }

    default:
      return state;
  }
}