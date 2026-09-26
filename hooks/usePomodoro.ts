"use client";

import { useState, useEffect, useReducer } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { 
    playCompletionChime, 
    playPop, 
    playTick, 
    requestNotificationPermission, 
    sendCompletionNotification,
    setSoundMuted,
    getSoundMuted,
} from '../lib/audio';

import { THEMES, DEFAULT_THEME_ID, ThemeConfig } from '../lib/themes';
import {
    fetchAllGoogleDataDirectly,
    createDirectGoogleTask,
    completeDirectGoogleTask,
    updateDirectGoogleTask,
    createDirectGoogleList,
    readAppDataFromDrive,
    saveAppDataToDrive,
    LocalAppData,
} from '../lib/googleStorage';
import { timerReducer, initialTimerState } from '../lib/timerReducer';
export function usePomodoro() {
    
    const DEFAULT_LOCAL_LIST = { _id: 'local-default', title: 'My Tasks', type: 'local', is_visible: true };
    const STARTER_TASKS = [
        { _id: 'loc-start-1', list_id: 'local-default', title: 'Tap me to view task details & set target pomodoros 🍅', status: 'needsAction', estimated_pomos: 2, completed_pomos: 0 },
        { _id: 'loc-start-2', list_id: 'local-default', title: 'Press ▶ to start a 25-minute focus sprint ⏱️', status: 'needsAction', estimated_pomos: 1, completed_pomos: 0 },
        { _id: 'loc-start-3', list_id: 'local-default', title: 'Check off this task when completed! ✓', status: 'needsAction', estimated_pomos: 1, completed_pomos: 0 },
        { _id: 'loc-start-4', list_id: 'local-default', title: 'Optional: Connect Google Tasks in Settings ⚙️', status: 'needsAction', estimated_pomos: 1, completed_pomos: 0 }
    ];
    // Centralized Atomic Timer Reducer
    const [timerState, dispatch] = useReducer(timerReducer, initialTimerState);

    // Derived timer values for backward compatibility with UI components
    const seconds = timerState.seconds;
    const isRunning = timerState.status === 'RUNNING';
    const selectedTaskId = timerState.selectedTaskId;
    const workDurationMinutes = timerState.workDurationMinutes;

    const setWorkDurationMinutes = (minutes: number) => dispatch({ type: 'SET_DURATION', minutes });
    const setSelectedTaskId = (taskId: string) => handleSelectTask(taskId);
    const setSeconds = (secs: number | ((prev: number) => number)) => {
        if (typeof secs === 'function') {
            dispatch({ type: 'TICK', remainingSeconds: secs(timerState.seconds) });
        } else {
            dispatch({ type: 'TICK', remainingSeconds: secs });
        }
    };
    const setIsRunning = (running: boolean | ((prev: boolean) => boolean)) => {
        const nextRunning = typeof running === 'function' ? running(isRunning) : running;
        if (nextRunning) {
            dispatch({ type: 'START_TIMER' });
        } else {
            dispatch({ type: 'PAUSE_TIMER' });
        }
    };
    const [newTask, setNewTask] = useState('');
    const [estimatedPomos, setEstimatedPomos] = useState(1);
    const [newListTitle, setNewListTitle] = useState('');
    const [listTaskInputs, setListTaskInputs] = useState<Record<string, string>>({});
    const [activeTab, setActiveTab] = useState<'board' | 'dashboard' | 'analytics' | 'settings' | 'menu'>('board');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
    // Google Tasks State
    const [googleLists, setGoogleLists] = useState<any[]>([]);
    const [googleTasks, setGoogleTasks] = useState<any[]>([]);
    // Local / Guest Fallback State
    const [localLists, setLocalLists] = useState<any[]>([DEFAULT_LOCAL_LIST]);
    const [localTasks, setLocalTasks] = useState<any[]>(STARTER_TASKS);
    const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
    const [showNotificationPrompt, setShowNotificationPrompt] = useState<boolean>(false);
    // Add state and hydration for global duration and estimation mode
    const [globalDuration, setGlobalDurationState] = useState<number>(25);
    const [estimationMode, setEstimationModeState] = useState<'pomos' | 'hours'>('pomos');

    const [sessions, setSessions] = useState<any[]>([]);
    // Local override store for estimated pomodoros (persists estimates for both local and Google tasks)
    const [taskEstimates, setTaskEstimates] = useState<Record<string, any>>({});
    const [currentThemeId, setCurrentThemeId] = useState<string>(DEFAULT_THEME_ID);

    // Load saved theme preference
    useEffect(() => {
        const savedTheme = localStorage.getItem('pomo_theme');
        if (savedTheme && THEMES[savedTheme]) {
            setCurrentThemeId(savedTheme);
        }
    }, []);

    const setTheme = (themeId: string) => {
        if (THEMES[themeId]) {
            setCurrentThemeId(themeId);
            localStorage.setItem('pomo_theme', themeId);
        }
    };
    const DAILY_GOAL = 8;

    // 1. Hydrate timer state from localStorage on initial mount
    useEffect(() => {
        const savedTimer = localStorage.getItem('pomo_timer_state');
        if (!savedTimer) return;

        try {
            const parsed = JSON.parse(savedTimer);
            if (parsed.status === 'RUNNING' && parsed.targetEndTime) {
                const remaining = Math.max(0, Math.round((parsed.targetEndTime - Date.now()) / 1000));
                if (remaining > 0) {
                    dispatch({
                        type: 'RESTORE_STATE',
                        payload: { ...parsed, seconds: remaining, status: 'RUNNING' },
                    });
                    setActiveTab('dashboard'); // Switch to Timer tab on launch
                } else {
                    dispatch({
                        type: 'RESTORE_STATE',
                        payload: {
                            ...parsed,
                            seconds: (parsed.workDurationMinutes || 25) * 60,
                            status: 'IDLE',
                            targetEndTime: null,
                        },
                    });
                }
            } else if (parsed) {
                dispatch({ type: 'RESTORE_STATE', payload: parsed });
            }
        } catch (err) {
            console.error('Failed to restore saved timer state:', err);
        }
    }, []);

    // 2. Automatically sync complete timer state to localStorage whenever it transitions
    useEffect(() => {
        localStorage.setItem('pomo_timer_state', JSON.stringify(timerState));
    }, [timerState]);
 

    // 2. Recalculate remaining seconds when phone unlocks / app resumes
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isRunning) {
                setActiveTab('dashboard'); // Switch to Timer tab on resume
                const savedEndTime = localStorage.getItem('pomo_target_end_time');
                if (savedEndTime) {
                    const remaining = Math.max(0, Math.round((parseInt(savedEndTime, 10) - Date.now()) / 1000));
                    dispatch({ type: 'TICK', remainingSeconds: remaining });
                    if (remaining === 0) {
                        handleLogSession();
                    }
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isRunning]);
    // Social Login Init
    useEffect(() => {
        const initAuth = async () => {
            try {
                await SocialLogin.initialize({
                    google: {
                        webClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '765553589642-pih5m7le7dvgpetrqtqtffmmdroe31p2.apps.googleusercontent.com',
                    },
                });
            } catch (error) {
                console.error("Failed to initialize SocialLogin:", error);
            }
        };
        initAuth();
    }, []);

    // Token Restoration
    useEffect(() => {
        const savedToken = localStorage.getItem('google_access_token');
        const expiry = localStorage.getItem('google_token_expiry');
        if (savedToken && expiry && Date.now() < Number(expiry)) {
            setAccessToken(savedToken);
        } else {
            localStorage.removeItem('google_access_token');
            localStorage.removeItem('google_token_expiry');
        }
    }, []);
    // 1. Initial Local Storage Data Load
    useEffect(() => {
        const cachedLists = localStorage.getItem('cached_google_lists');
        const cachedTasks = localStorage.getItem('cached_google_tasks');
        const savedLocalLists = localStorage.getItem('local_lists');
        const savedLocalTasks = localStorage.getItem('local_tasks');
        const hasSeenTour = localStorage.getItem('has_seen_onboarding');
        const savedSessions = localStorage.getItem('local_sessions');
        const savedEstimates = localStorage.getItem('task_estimates');
        // In useEffect (Initial Load):
        const savedGlobalDuration = localStorage.getItem('pomo_global_duration');
        if (savedGlobalDuration) setGlobalDurationState(Number(savedGlobalDuration));

        const savedEstimationMode = localStorage.getItem('pomo_estimation_mode');
        if (savedEstimationMode === 'pomos' || savedEstimationMode === 'hours') {
            setEstimationModeState(savedEstimationMode as 'pomos' | 'hours');
        }

        // Parse & purge orphaned Google tasks mistakenly saved into local_tasks
        const loadedLocalTasks: any[] = savedLocalTasks ? JSON.parse(savedLocalTasks) : STARTER_TASKS;
        const cleanedLocalTasks = loadedLocalTasks.filter((t: any) => {
            const isOrphanedGoogleTask = t.gtask_id || (t.list_id && t.list_id !== 'local-default' && !t.list_id.startsWith('loclist-'));
            return !isOrphanedGoogleTask;
        });
        if (savedLocalTasks && cleanedLocalTasks.length !== loadedLocalTasks.length) {
            localStorage.setItem('local_tasks', JSON.stringify(cleanedLocalTasks));
        }

        if (!hasSeenTour) {
            setShowOnboarding(true);
        }

        if (savedLocalLists) setLocalLists(JSON.parse(savedLocalLists));
        setLocalTasks(cleanedLocalTasks);
        if (cachedLists) setGoogleLists(JSON.parse(cachedLists));
        if (cachedTasks) setGoogleTasks(JSON.parse(cachedTasks));
        if (savedSessions) setSessions(JSON.parse(savedSessions));
        if (savedEstimates) setTaskEstimates(JSON.parse(savedEstimates));
    }, []);

    
   
    const handleCompleteOnboarding = () => {
        localStorage.setItem('has_seen_onboarding', 'true');
        setShowOnboarding(false);
    };

    const handleReplayOnboarding = () => {
        setShowOnboarding(true);
    };

    const handleResetStarterTasks = () => {
        setLocalTasks((prev) => {
            const merged = [...STARTER_TASKS, ...prev.filter((t) => !t._id.startsWith('loc-start-'))];
            localStorage.setItem('local_tasks', JSON.stringify(merged));
            return merged;
        });
    };
    // 2. Storage & Drive Sync Helpers
    const triggerDriveSync = (token: string | null, sess: any[], ests?: Record<string, any>, extraSettings?: Record<string, any>) => {
        if (!token) return;
        const payload: LocalAppData = {
            sessions: sess,
            taskEstimates: ests || taskEstimates,
            settings: {
                globalDuration,
                estimationMode,
                ...extraSettings,
            },
        };
        saveAppDataToDrive(token, payload).catch(() => null);
    };

    const setGlobalDuration = (mins: number) => {
        const valid = Math.max(1, mins);
        setGlobalDurationState(valid);
        localStorage.setItem('pomo_global_duration', valid.toString());
        if (timerState.status === 'IDLE' && !selectedTaskId) {
            dispatch({ type: 'SET_DURATION', minutes: valid });
        }
        triggerDriveSync(accessToken, sessions, taskEstimates, { globalDuration: valid, estimationMode });
    };

    const setEstimationMode = (mode: 'pomos' | 'hours') => {
        setEstimationModeState(mode);
        localStorage.setItem('pomo_estimation_mode', mode);
        triggerDriveSync(accessToken, sessions, taskEstimates, { globalDuration, estimationMode: mode });
    };

    const saveSessions = (newSessions: any[]) => {
        setSessions(newSessions);
        localStorage.setItem('local_sessions', JSON.stringify(newSessions));
        triggerDriveSync(accessToken, newSessions);
    };

    // Hybrid Local-First & Google Tasks Model
    const lists = accessToken ? [...localLists, ...googleLists] : localLists;
    const rawTasks = accessToken ? [...googleTasks, ...localTasks] : localTasks;


    // 1. Calculate completed pomodoros dynamically by counting logged sessions per task ID
    const sessionCounts = sessions.reduce((acc: Record<string, number>, s: any) => {
        if (s.task_id) acc[s.task_id] = (acc[s.task_id] || 0) + 1;
        return acc;
    }, {});

    const taskActualSeconds = sessions.reduce((acc: Record<string, number>, s: any) => {
        if (s.task_id) {
            const secs = s.actual_seconds ? s.actual_seconds : (s.duration_minutes || 25) * 60;
            acc[s.task_id] = (acc[s.task_id] || 0) + secs;
        }
        return acc;
    }, {});

    const tasks = rawTasks.map((t: any) => {
        const rawEst = taskEstimates[t._id] ?? (t.gtask_id ? taskEstimates[t.gtask_id] : undefined);
        
        let target_minutes = 25;
        let preferred_pomo_duration: number | undefined = undefined;

        if (typeof rawEst === 'number') {
            target_minutes = rawEst <= 12 ? rawEst * 25 : rawEst;
        } else if (rawEst && typeof rawEst === 'object') {
            target_minutes = (rawEst as any).target_minutes || 25;
            preferred_pomo_duration = (rawEst as any).preferred_pomo_duration;
        } else if (typeof t.estimated_pomos === 'number' && t.estimated_pomos > 0) {
            target_minutes = t.estimated_pomos * 25;
        }

        const actual_seconds = (taskActualSeconds[t._id] || 0) + (t.gtask_id ? (taskActualSeconds[t.gtask_id] || 0) : 0);

        return {
            ...t,
            target_minutes,
            preferred_pomo_duration,
            actual_seconds_spent: actual_seconds,
            completed_pomos: sessionCounts[t._id] || (t.gtask_id ? sessionCounts[t.gtask_id] : 0) || 0,
            estimated_pomos: Math.max(1, Math.round(target_minutes / (preferred_pomo_duration || globalDuration || 25))),
        };
    });

    const activeList = lists.find((l: any) => l.is_visible) || lists[0] || null;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todaySessions = sessions.filter((s: any) => {
        const dateVal = s.completed_at || s.completedAt || s.date || s.timestamp || s._id?.replace('sess-', '');
        if (!dateVal) return false;
        const time = new Date(dateVal).getTime();
        return !isNaN(time) && time >= startOfDay.getTime();
    });

    const handleDeleteSession = (sessionId: string) => {
        playPop();
        const updated = sessions.filter((s: any) => (s._id || s.id) !== sessionId);
        saveSessions(updated);
    };

    const loginNative = async () => {
        try {
            const res = await SocialLogin.login({
                provider: 'google',
                options: {
                    scopes: [
                        'https://www.googleapis.com/auth/tasks',
                        'https://www.googleapis.com/auth/drive.appdata',
                    ],
                },
            });
            const result = res.result;
            if ('accessToken' in result && result.accessToken) {
                const token = result.accessToken.token;
                const expiryTime = Date.now() + 3600 * 1000;
                setAccessToken(token);
                localStorage.setItem('google_access_token', token);
                localStorage.setItem('google_token_expiry', expiryTime.toString());
                await handleSyncGoogleTasks(true, token, true);
                return token;
            }
            return null;
        } catch (error) {
            console.error("Native Google Sign-In Failed:", error);
            return null;
        }
    };

    const toggleListVisibility = ({ id, is_visible }: { id: string; is_visible: boolean }) => {
        setLocalLists((prev) => {
            const updated = prev.map((l) => (l._id === id ? { ...l, is_visible } : l));
            localStorage.setItem('local_lists', JSON.stringify(updated));
            return updated;
        });
        setGoogleLists((prev) => {
            const updated = prev.map((l) => (l._id === id ? { ...l, is_visible } : l));
            localStorage.setItem('cached_google_lists', JSON.stringify(updated));
            return updated;
        });
    };

    const handleAddTaskToList = async (list: any, overrideTitle?: string) => {
        playPop();
        const title = overrideTitle ?? listTaskInputs[list._id];
        if (!title?.trim()) return;

        const initialPomos = Math.max(1, estimatedPomos);

        // Offline / Local List Task Creation
        if (!accessToken || list.type === 'local') {
            const newLocalTask = {
                _id: 'loc-' + Date.now(),
                list_id: list._id,
                title: title.trim(),
                status: 'needsAction',
                estimated_pomos: initialPomos,
                completed_pomos: 0,
            };
            const updated = [...localTasks, newLocalTask];
            setLocalTasks(updated);
            localStorage.setItem('local_tasks', JSON.stringify(updated));
            setListTaskInputs((prev) => ({ ...prev, [list._id]: '' }));
            return;
        }
        let currentToken = accessToken || await loginNative();
        if (!currentToken) return;
        try {
            const created = await createDirectGoogleTask(currentToken, list.gtask_list_id || list._id, title.trim());
            // Store initial target pomodoros estimate from form state
            const newTask = {
                _id: created.id,
                gtask_id: created.id,
                list_id: list.gtask_list_id || list._id,
                title: title.trim(),
                status: 'needsAction',
                estimated_pomos: initialPomos,
                completed_pomos: 0,
            };
            setTaskEstimates((prev) => ({ ...prev, [created.id]: initialPomos }));
            setGoogleTasks((prev) => [...prev, newTask]);
        } catch (error) {
            localStorage.removeItem('google_access_token');
            localStorage.removeItem('google_token_expiry');
            setAccessToken(null);
            await loginNative();
            return;
        }
     

        setListTaskInputs((prev) => ({ ...prev, [list._id]: '' }));
    };
    const handleCreateGoogleList = async (titleOverride?: string) => {
        playPop();
        const title = titleOverride || newListTitle;
        if (!title.trim()) return;
        // Offline / Local List Creation
        if (!accessToken) {
            const newLocList = {
                _id: 'loclist-' + Date.now(),
                title: title.trim(),
                type: 'local',
                is_visible: true,
            };
            const updated = [...localLists, newLocList];
            setLocalLists(updated);
            localStorage.setItem('local_lists', JSON.stringify(updated));
            setNewListTitle('');
            return;
        }
        let currentToken = accessToken || (await loginNative());
        if (!currentToken) return;

        try {
            const created = await createDirectGoogleList(currentToken, title.trim());
            const newList = {
                _id: created.id,
                gtask_list_id: created.id,
                title: created.title,
                type: 'google',
                is_visible: true,
            };
            setGoogleLists((prev) => {
                const updated = [...prev, newList];
                localStorage.setItem('cached_google_lists', JSON.stringify(updated));
                return updated;
            });
            setNewListTitle('');
        } catch (error) {
            console.error("Failed to create Google list:", error);
        }
    };
    const handleSyncGoogleTasks = async (silent = false, overrideToken?: string, forceFullSync = false) => {
        let currentToken = overrideToken || accessToken;
        if (!currentToken) return;
        
        setIsSyncing(true);
        try {
            const syncMin = forceFullSync ? undefined : (lastSyncTime || undefined);
            const nowIso = new Date().toISOString();
            const { lists: gLists, tasks: fetchedTasks } = await fetchAllGoogleDataDirectly(currentToken, syncMin);


            if (gLists && gLists.length > 0) {
                setGoogleLists(gLists);
                localStorage.setItem('cached_google_lists', JSON.stringify(gLists));

                if (forceFullSync || !lastSyncTime) {
                    // Full Sync: Replace cache cleanly to purge deleted/ghost tasks
                    setGoogleTasks(fetchedTasks);
                    localStorage.setItem('cached_google_tasks', JSON.stringify(fetchedTasks));
                } else if (fetchedTasks.length > 0) {
                    // Incremental Sync: Merge updated tasks into current state so unchanged tasks aren't wiped
                    setGoogleTasks((prev) => {
                        const updatedMap = new Map(fetchedTasks.map((t) => [t.gtask_id, t]));
                        const merged = prev.map((t) => updatedMap.get(t.gtask_id) || t);
                        const existingIds = new Set(prev.map((t) => t.gtask_id));
                        const newTasks = fetchedTasks.filter((t) => !existingIds.has(t.gtask_id));
                        const finalTasks = [...merged, ...newTasks];
                        localStorage.setItem('cached_google_tasks', JSON.stringify(finalTasks));
                        return finalTasks;
                    });
                }
                
                setLastSyncTime(nowIso);
            }
            // Background Drive Sync: Only run on full syncs / launch and don't block task UI spinner
            if (forceFullSync || !lastSyncTime) {
                readAppDataFromDrive(currentToken).then((driveData) => {
                    if (!driveData) return;
                    // 🔍 INSPECT APPDATA STRUCTURE
                    const allDriveSessions = driveData.sessions || (driveData as any).localSessions || [];
                    const latestSessions = [...allDriveSessions].sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()).slice(0, 25);
                    
                    console.log(`☁️ [DRIVE TOTAL SESSIONS COUNT]: ${allDriveSessions.length}`);
                    console.log('☁️ [LATEST 25 SESSIONS IN DRIVE]:\n', JSON.stringify(latestSessions, null, 2));
                    const rawDriveData = driveData as any;
                    const driveSessions = driveData.sessions || rawDriveData.localSessions;

                    if (driveSessions?.length) {
                        setSessions((prevSessions: any[]) => {
                            const sessionMap = new Map();
                            prevSessions.forEach((s: any) => {
                                const key = s._id || s.id;
                                if (key) sessionMap.set(key, { ...s, _id: key });
                            });
                            driveSessions.forEach((s: any) => {
                                const key = s._id || s.id;
                                if (key) sessionMap.set(key, { ...s, _id: key });
                            });
                            const merged = Array.from(sessionMap.values());
                            localStorage.setItem('local_sessions', JSON.stringify(merged));
                            return merged;
                        });
                    }
                    if (driveData.taskEstimates) {
                        setTaskEstimates((prev) => {
                            const merged = { ...driveData.taskEstimates, ...prev };
                            localStorage.setItem('task_estimates', JSON.stringify(merged));
                            return merged;
                        });
                    }
                }).catch(() => null);            
                


            }
            if (!silent) alert("Tasks successfully synced from Google!");
        } catch (error) {
            const err = error as any;
            console.warn("Google sync error:", error);
            // Only invalidate auth token if explicitly an authentication failure (401)
            if (err?.status === 401 || err?.message?.includes('401')) {
                localStorage.removeItem('google_access_token');
                localStorage.removeItem('google_token_expiry');
                setAccessToken(null);
                await loginNative();
            }
        } finally {
            setIsSyncing(false);
        }
    };
    // Intent-Driven Hybrid Sync Effect
    useEffect(() => {
        if (!accessToken) return;

        // 1. Sync immediately when native iOS app comes to foreground
        const sub = App.addListener('appStateChange', ({ isActive }) => {
            if (isActive) {
                handleSyncGoogleTasks(true);
            }
        });

        // // 2. Adaptive Ambient Polling: 60s during active timer, 120s when viewing Tasks tab
        let interval: NodeJS.Timeout | null = null;
        if (isRunning || activeTab === 'board') {
            const pollMs = isRunning ? 60000 : 120000;
            interval = setInterval(() => {
                handleSyncGoogleTasks(true);
            }, pollMs);
        }

        return () => {
            sub.then((l) => l.remove());
            if (interval) clearInterval(interval);
        };
     }, [accessToken, isRunning, activeTab]);

    const handleCompleteTask = async (task: any, e?: React.MouseEvent) => {
        playPop();
        if (e) e.stopPropagation();
        // Local Task Completion
        if (!task.gtask_id) {
            const updated = localTasks.filter((t) => t._id !== task._id);
            setLocalTasks(updated);
            localStorage.setItem('local_tasks', JSON.stringify(updated));
            return;
        }
        if (task.gtask_id) {
            // Optimistic update
            setGoogleTasks((prev) => prev.filter((t) => t._id !== task._id));
            let currentToken = accessToken || (await loginNative());
            if (!currentToken) return;

            try {
                const listId = task.list_id || activeList?.gtask_list_id || activeList?._id;
                await completeDirectGoogleTask(currentToken, listId, task.gtask_id);
            } catch (error) {
                console.error("Failed to complete task in Google:", error);
                setGoogleTasks((prev) => [...prev, task]);
            }
        }
    };

    const handleEditTask = async (taskId: string, newTitle: string) => {
        if (!newTitle.trim()) return;
        const trimmed = newTitle.trim();

        // Check if Local Task
        const isLocal = localTasks.some((t) => t._id === taskId);
        if (isLocal) {
            const updated = localTasks.map((t) => (t._id === taskId ? { ...t, title: trimmed } : t));
            setLocalTasks(updated);
            localStorage.setItem('local_tasks', JSON.stringify(updated));
            return;
        }

        setGoogleTasks((prev) =>
            prev.map((t) => (t._id === taskId || t.gtask_id === taskId ? { ...t, title: trimmed } : t))
        );

        const targetTask = googleTasks.find((t) => t._id === taskId || t.gtask_id === taskId);
        if (targetTask?.gtask_id) {
            let currentToken = accessToken || (await loginNative());
            if (!currentToken) return;
            try {
                const listId = targetTask.list_id || activeList?.gtask_list_id || activeList?._id;
                await updateDirectGoogleTask(currentToken, listId, targetTask.gtask_id, trimmed);
            } catch (error) {
                console.error("Failed to update task title in Google:", error);
            }
        }
    };

    const handleSelectTask = (taskId: string) => {
        if (!taskId) {
            dispatch({ type: 'CLEAR_TASK' });
            return;
        }
        const targetTask = tasks.find((t: any) => t._id === taskId || t.gtask_id === taskId);
        const launchDuration = targetTask?.preferred_pomo_duration || globalDuration;
        dispatch({ type: 'SELECT_TASK', taskId, preferredDuration: launchDuration });
    };
    
    const handleStart = async () => {
        playPop();
        const hasPrompted = localStorage.getItem('has_prompted_notifications');
        if (!hasPrompted) {
            setShowNotificationPrompt(true);
            return;
        }
        dispatch({ type: 'START_TIMER' });
        const targetEndTime = Date.now() + seconds * 1000;
        localStorage.setItem('pomo_target_end_time', targetEndTime.toString());

        await LocalNotifications.schedule({
            notifications: [
                {
                    title: 'Pomodoro Completed! 🍅',
                    body: selectedTaskId ? 'Focus session finished! Time for a break.' : 'Great job! Your focus session is complete.',
                    id: 101,
                    schedule: { at: new Date(targetEndTime) },
                    sound: 'default',
                },
            ],
        }).catch((err) => console.error('Failed to schedule notification:', err));
        setActiveTab('dashboard');
        };

    const handleConfirmNotificationPermission = async (allow: boolean) => {
        localStorage.setItem('has_prompted_notifications', 'true');
        setShowNotificationPrompt(false);
        if (allow) {
            await requestNotificationPermission();
            await LocalNotifications.requestPermissions().catch((err) =>
                console.error('Notification permission error:', err)
            );
        }
        handleStart();requestNotificationPermission();
    };

    const handlePause = async () => {
        playPop();
        localStorage.removeItem('pomo_target_end_time');
        await LocalNotifications.cancel({ notifications: [{ id: 101 }] }).catch(() => {});
        dispatch({ type: 'PAUSE_TIMER' });
    };

    const handleLogSession = async () => {
        playPop();
        localStorage.removeItem('pomo_target_end_time');
        await LocalNotifications.cancel({ notifications: [{ id: 101 }] }).catch(() => {});
        // Snapshot task and list details before logging
        const activeTask = tasks.find((t: any) => t._id === selectedTaskId || (t.gtask_id && t.gtask_id === selectedTaskId));
        const activeList = activeTask ? lists.find((l: any) => l._id === activeTask.list_id || l.gtask_list_id === activeTask.list_id) : null;
        const presetSeconds = workDurationMinutes * 60;
        const elapsedSeconds = seconds === 0 ? presetSeconds : Math.max(0, presetSeconds - seconds);
        const actualMinutes = Number((elapsedSeconds / 60).toFixed(2));
        const now = new Date();
        const startTime = new Date(now.getTime() - elapsedSeconds * 1000);
        const newSession = {
            _id: 'sess-' + Date.now(),
            started_at: startTime.toISOString(),
            completed_at: now.toISOString(),
            duration_minutes: actualMinutes > 0 ? actualMinutes : workDurationMinutes,
            actual_seconds: elapsedSeconds,
            task_id: selectedTaskId || 'unassigned',
            task_title: activeTask?.title || 'Focus Session',
            list_title: activeList?.title || 'General',
        };
        saveSessions([...sessions, newSession]);
        dispatch({ type: 'LOG_SESSION' });
    };

    // Countdown Timer Effect
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isRunning && seconds > 0) {
            interval = setInterval(() => {
                dispatch({ type: 'TICK' });
                playTick();
            }, 1000);
            
        } else if (seconds === 0 && isRunning) {
            dispatch({ type: 'PAUSE_TIMER' });
            playCompletionChime();
            const currentTask = tasks?.find((t: any) => t._id === selectedTaskId);
            sendCompletionNotification(currentTask?.title);
            if (selectedTaskId) handleLogSession();
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRunning, seconds, selectedTaskId]);

    const formatTime = (totalSeconds: number) => {
        const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const secs = (totalSeconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    // Floating Widget (Document PiP API)
    const toggleFloatingWidget = async () => {
        if (!('documentPictureInPicture' in window)) {
            alert("Floating desktop widget is supported in Chrome, Edge, and Chromium browsers.");
            return;
        }

        const pipApi = (window as any).documentPictureInPicture;
        if (pipApi.window) {
            pipApi.window.close();
            return;
        }

        const pipWin = await pipApi.requestWindow({ width: 280, height: 200 });

        const taskTitle = selectedTaskId 
            ? tasks?.find((t: any) => t._id === selectedTaskId)?.title || 'Active Session'
            : 'No task selected';

        pipWin.document.head.innerHTML = `
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { background-color: #141414; color: #e4e4e7; font-family: system-ui, -apple-system, sans-serif; height: 100vh; display: flex; flex-direction: column; justify-content: space-between; padding: 16px; user-select: none; }
                .task-badge { font-size: 11px; color: #34d399; background: rgba(6, 78, 59, 0.4); border: 1px solid rgba(4, 120, 87, 0.4); padding: 3px 10px; border-radius: 20px; text-align: center; }
                .timer-display { font-size: 44px; font-family: monospace; font-weight: 700; color: #ffffff; text-align: center; margin: 4px 0; }
                .control-bar { display: flex; align-items: center; justify-content: center; gap: 12px; background: #1e1e1e; padding: 8px; border-radius: 24px; border: 1px solid #27272a; }
                .btn { background: #27272a; color: #ffffff; border: none; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }
                .btn-primary { background: #059669; }
                .btn-reset { background: #d97706; }
            </style>
        `;

        pipWin.document.body.innerHTML = `
            <div class="task-badge">${taskTitle}</div>
            <div id="pip-timer" class="timer-display">${formatTime(seconds)}</div>
            <div class="control-bar">
                <button id="pip-play-pause" class="btn btn-primary">${isRunning ? '⏸' : '▶'}</button>
                <button id="pip-reset" class="btn btn-reset">🔄</button>
            </div>
        `;

        pipWin.document.getElementById('pip-play-pause')!.onclick = () => setIsRunning((prev) => !prev);
        pipWin.document.getElementById('pip-reset')!.onclick = () => { dispatch({ type: 'PAUSE_TIMER' }); dispatch({ type: 'TICK', remainingSeconds: workDurationMinutes * 60 }); };
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Normalizes input to accept either object payload ({ taskId, estimatedPomos }) or positional arguments (taskId, pomos)
    const updateEstimatedPomos = (
        targetInput: string | { taskId: string; targetMinutes?: number; preferredPomoDuration?: number; estimatedPomos?: number; estimated_pomos?: number },
        pomos?: number,
        e?: React.MouseEvent
    ) => {
        let taskId: string;
        let estimateVal: any;

        if (typeof targetInput === 'object' && targetInput !== null) {
            taskId = targetInput.taskId;
            if (targetInput.targetMinutes !== undefined) {
                estimateVal = {
                    target_minutes: Math.max(1, targetInput.targetMinutes),
                    preferred_pomo_duration: targetInput.preferredPomoDuration,
                };
            } else {
                const count = targetInput.estimatedPomos ?? targetInput.estimated_pomos ?? 1;
                estimateVal = Math.max(1, count);
            }
        } else {
            taskId = targetInput;
            const count = pomos ?? 1;
            estimateVal = Math.max(1, count);
        }

        if (!taskId) return;
        

        if (e && typeof e.stopPropagation === 'function') {
            e.stopPropagation();
        }
        
        

        // Map estimate to both local _id and gtask_id so UI lookup never drops the target count
        const targetTask = tasks.find((t: any) => t._id === taskId || t.gtask_id === taskId);
        const updatedEstimates = {
            ...taskEstimates,
            [taskId]: estimateVal,
            ...(targetTask?._id ? { [targetTask._id]: estimateVal } : {}),
            ...(targetTask?.gtask_id ? { [targetTask.gtask_id]: estimateVal } : {}),
        };

        console.log('[UPDATE POMOS MATCH]', { targetTaskFound: targetTask, previousMap: taskEstimates });
        console.log('[UPDATE POMOS NEW MAP]', updatedEstimates);
        setTaskEstimates(updatedEstimates);
        localStorage.setItem('task_estimates', JSON.stringify(updatedEstimates));

        // Sync updated estimate dictionary to Google Drive
        triggerDriveSync(accessToken, sessions, updatedEstimates);
    };

    const handleLogout = async () => {
        try {
            await SocialLogin.logout({ provider: 'google' });
        } catch (error) {
            console.log("Native logout info:", error);
        }
        setAccessToken(null);
        setGoogleLists([]);
        setGoogleTasks([]);
        setLastSyncTime(null);
        localStorage.removeItem('google_access_token');
        localStorage.removeItem('google_token_expiry');
        dispatch({ type: 'CLEAR_TASK' });
        alert("Logged out of Google account.");
    };
    const handlePullToRefresh = async () => {
        await handleSyncGoogleTasks(true);
    };

    return {
        newTask, setNewTask,
        estimatedPomos, setEstimatedPomos,
        selectedTaskId, setSelectedTaskId,
        seconds, setSeconds,
        isRunning, setIsRunning,
        newListTitle, setNewListTitle,
        listTaskInputs, setListTaskInputs,
        activeTab, setActiveTab,
        isFullscreen,
        accessToken,
        DAILY_GOAL,
        lists, tasks, todaySessions, sessions,
        handleSelectTask, handleStart, handlePause, handleLogSession, handleDeleteSession,
        handleSyncGoogleTasks, handlePullToRefresh, handleAddTaskToList, handleCompleteTask, handleCreateGoogleList,
        handleEditTask, updateEstimatedPomos, toggleListVisibility,
        currentTheme: THEMES[currentThemeId] || THEMES[DEFAULT_THEME_ID],
        currentThemeId, setTheme,
        toggleFullscreen, toggleFloatingWidget, formatTime,
        handleLogout, loginNative, 
        workDurationMinutes, setWorkDurationMinutes,
        globalDuration, setGlobalDuration,
        estimationMode, setEstimationMode,
        isSyncing,
        showOnboarding,
        setShowOnboarding, handleCompleteOnboarding,
        showNotificationPrompt, handleConfirmNotificationPermission,
        handleReplayOnboarding, handleResetStarterTasks
    };

    
}