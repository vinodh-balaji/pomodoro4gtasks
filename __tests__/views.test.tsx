// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MobileView from '../components/mobile/MobileView';
import DesktopView from '../components/desktop/DesktopView';

// Mock matchMedia required by react-activity-calendar
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

const createMockProps = (overrides = {}) => ({
  lists: [{ _id: 'local-default', title: 'My Tasks', type: 'local', is_visible: true }],
  tasks: [
    { _id: 'task-1', list_id: 'local-default', title: 'Refactor Reducer Code', status: 'needsAction', estimated_pomos: 2, completed_pomos: 0 },
  ],
  seconds: 1500,
  isRunning: false,
  activeTab: 'board',
  selectedTaskId: 'task-1',
  newListTitle: '',
  listTaskInputs: {},
  DAILY_GOAL: 8,
  todaySessions: [],
  sessions: [],
  workDurationMinutes: 25,
  isSyncing: false,
  accessToken: null,
  currentTheme: { bgUrl: '', isDark: false, cardBg: 'bg-white', cardBorder: 'border-slate-200', textPrimary: 'text-slate-900', textSecondary: 'text-slate-500', accentBg: 'bg-rose-500', accentText: 'text-rose-500', headerBg: 'bg-white', navBg: 'bg-white' },
  setActiveTab: vi.fn(),
  setSelectedTaskId: vi.fn(),
  handleStart: vi.fn(),
  handlePause: vi.fn(),
  handleLogSession: vi.fn(),
  handleAddTaskToList: vi.fn(() => Promise.resolve()),
  handleCompleteTask: vi.fn(),
  handleEditTask: vi.fn(),
  updateEstimatedPomos: vi.fn(),
  handleLogout: vi.fn(),
  loginNative: vi.fn(),
  formatTime: (sec: number) => `${Math.floor(sec / 60)}:00`,
  ...overrides,
});

describe('1. DesktopView Comprehensive Coverage', () => {
  it('renders Kanban board, sidebar tabs, and handles tab switching', () => {
    const props = createMockProps();
    render(<DesktopView {...props} />);

    // Verify task rendering (multiple instances exist: header + card)
    const taskElements = screen.getAllByText('Refactor Reducer Code');
    expect(taskElements.length).toBeGreaterThan(0);

    // Verify Tab Switcher Click
    const timerTab = screen.getByText('⏱️ Timer');
    fireEvent.click(timerTab);
    expect(props.setActiveTab).toHaveBeenCalledWith('dashboard');
  });

  it('opens task detail modal when a card is clicked and supports pomo adjustments', () => {
    const props = createMockProps();
    render(<DesktopView {...props} />);

    // Select the card on the board specifically
    const taskCards = screen.getAllByText('Refactor Reducer Code');
    fireEvent.click(taskCards[taskCards.length - 1]);

    // Verify Modal Opened
    expect(screen.getByText('Target Sessions:')).toBeTruthy();

    // Click "+" button inside modal (specifically the second '+' button rendered on screen)
    const plusButtons = screen.getAllByText('+');
    fireEvent.click(plusButtons[plusButtons.length - 1]);
    expect(props.updateEstimatedPomos).toHaveBeenCalledWith({ taskId: 'task-1', targetMinutes: 50 });
  });

  it('triggers task completion when checkbox is checked in board view', () => {
    const props = createMockProps();
    render(<DesktopView {...props} />);

    const checkboxes = screen.getAllByRole('checkbox');
    // Click the task item checkbox (the second checkbox in DOM)
    fireEvent.click(checkboxes[checkboxes.length - 1]);
    expect(props.handleCompleteTask).toHaveBeenCalled();
  });
});

describe('2. MobileView Comprehensive Coverage', () => {
  it('renders mobile dashboard and handles Start / Pause / Clear actions', () => {
    const props = createMockProps({ activeTab: 'dashboard' });
    render(<MobileView {...props} />);

    // Multiple instances exist (carousel task list item + dashboard header)
    const taskTitles = screen.getAllByText('Refactor Reducer Code');
    expect(taskTitles.length).toBeGreaterThan(0);
    expect(screen.getByText('25:00')).toBeTruthy();

    // Test Clear Button
    const clearBtn = screen.getByText('✕ Clear');
    fireEvent.click(clearBtn);
    expect(props.setSelectedTaskId).toHaveBeenCalledWith('');

    // Test Start Focus Button
    const startBtn = screen.getByText('Start Focus');
    fireEvent.click(startBtn);
    expect(props.handleStart).toHaveBeenCalled();
  });

  it('navigates via bottom tab bar', () => {
    const props = createMockProps();
    render(<MobileView {...props} />);

    const statsTab = screen.getByText('Stats');
    fireEvent.click(statsTab);
    expect(props.setActiveTab).toHaveBeenCalledWith('analytics');
  });

  it('opens mobile drawer menu when Lists header button is tapped', () => {
    const props = createMockProps();
    render(<MobileView {...props} />);

    const listsBtn = screen.getByText('Lists');
    fireEvent.click(listsBtn);

    expect(screen.getByText('Task Lists & Themes')).toBeTruthy();
  });
});

describe('3. Settings & Analytics View Embeds', () => {
  it('renders SettingsView cleanly when activeTab is settings', () => {
    const props = createMockProps({ activeTab: 'settings' });
    render(<DesktopView {...props} />);
    
    expect(screen.getByText('Settings & Preferences')).toBeTruthy();
  });

  it('renders AnalyticsView cleanly when activeTab is analytics', () => {
    const props = createMockProps({ activeTab: 'analytics' });
    render(<MobileView {...props} />);

    expect(screen.getByText('Performance Analytics')).toBeTruthy();
  });
});