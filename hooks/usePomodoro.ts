"use client";

import { useState, useEffect } from 'react';
import { App } from '@capacitor/app';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { playCompletionChime, requestNotificationPermission, sendCompletionNotification } from '../lib/audio';
import {
    fetchAllGoogleDataDirectly,
    createDirectGoogleTask,
    completeDirectGoogleTask,
    readAppDataFromDrive,
    saveAppDataToDrive,
    LocalAppData,
} from '../lib/googleStorage';

export function usePomodoro() {
    const DEFAULT_WORK_MINUTES = 25;
    const [workDurationMinutes, setWorkDurationMinutes] = useState(DEFAULT_WORK_MINUTES);
    const [newTask, setNewTask] = useState('');
    const [estimatedPomos, setEstimatedPomos] = useState(1);
    const [selectedTaskId, setSelectedTaskId] = useState('');
    const [seconds, setSeconds] = useState(workDurationMinutes * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [newListTitle, setNewListTitle] = useState('');
    const [listTaskInputs, setListTaskInputs] = useState<Record<string, string>>({});
    const [activeTab, setActiveTab] = useState<'board' | 'dashboard' | 'analytics' | 'menu'>('board');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [pipWindowRef, setPipWindowRef] = useState<Window | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
    const [localLists, setLocalLists] = useState<any[]>([]);
    const [localTasks, setLocalTasks] = useState<any[]>([]);
    const [googleLists, setGoogleLists] = useState<any[]>([]);
    const [googleTasks, setGoogleTasks] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    // Local override store for estimated pomodoros (persists estimates for both local and Google tasks)
    const [taskEstimates, setTaskEstimates] = useState<Record<string, number>>({});
    const DAILY_GOAL = 8;

    // Social Login Init
    useEffect(() => {
        const initAuth = async () => {
            try {
                await SocialLogin.initialize({
                    google: {
                        webClientId: '765553589642-pih5m7le7dvgpetrqtqtffmmdroe31p2.apps.googleusercontent.com',
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
        const savedLists = localStorage.getItem('local_lists');
        const savedTasks = localStorage.getItem('local_tasks');
        const savedSessions = localStorage.getItem('local_sessions');
        const savedEstimates = localStorage.getItem('task_estimates');

        if (savedLists) {
            setLocalLists(JSON.parse(savedLists));
        } else {
            const defaultList = [{ _id: 'default-local', title: 'Personal Tasks', type: 'local', is_visible: true }];
            setLocalLists(defaultList);
            localStorage.setItem('local_lists', JSON.stringify(defaultList));
        }

        if (savedTasks) setLocalTasks(JSON.parse(savedTasks));
        if (savedSessions) setSessions(JSON.parse(savedSessions));
        if (savedEstimates) setTaskEstimates(JSON.parse(savedEstimates));
    }, []);

    // 2. Storage & Drive Sync Helpers
    const triggerDriveSync = (token: string | null, lLists: any[], lTasks: any[], sess: any[], ests?: Record<string, number>) => {
        if (!token) return;
        const payload: LocalAppData = {
            localLists: lLists,
            localTasks: lTasks,
            sessions: sess,
            taskEstimates: ests || taskEstimates,
            settings: {},
        };
        saveAppDataToDrive(token, payload).catch(() => null);
    };

    const saveLocalLists = (lists: any[]) => {
        setLocalLists(lists);
        localStorage.setItem('local_lists', JSON.stringify(lists));
        triggerDriveSync(accessToken, lists, localTasks, sessions);
    };

    const saveLocalTasks = (tasks: any[]) => {
        setLocalTasks(tasks);
        localStorage.setItem('local_tasks', JSON.stringify(tasks));
        triggerDriveSync(accessToken, localLists, tasks, sessions);
    };

    const saveSessions = (newSessions: any[]) => {
        setSessions(newSessions);
        localStorage.setItem('local_sessions', JSON.stringify(newSessions));
        triggerDriveSync(accessToken, localLists, localTasks, newSessions);
    };

    // Combined lists and tasks (Local + Google REST API)
    const lists = [...localLists, ...(accessToken ? googleLists : [])];
    const rawTasks = [...localTasks, ...(accessToken ? googleTasks : [])];

    // 1. Calculate completed pomodoros dynamically by counting logged sessions per task ID
    const sessionCounts = sessions.reduce((acc: Record<string, number>, s: any) => {
        if (s.task_id) acc[s.task_id] = (acc[s.task_id] || 0) + 1;
        return acc;
    }, {});

    // 2. Decorate tasks with real-time completed session counts and persisted estimated pomo overrides
    const tasks = rawTasks.map((t: any) => {
        const matchedEstimate = taskEstimates[t._id] ?? (t.gtask_id ? taskEstimates[t.gtask_id] : undefined);
        const finalEstimate = matchedEstimate ?? (typeof t.estimated_pomos === 'number' && t.estimated_pomos > 0 ? t.estimated_pomos : 1);
        
        console.log('[DECORATOR TASK READ]', {
            taskTitle: t.title,
            _id: t._id,
            gtask_id: t.gtask_id,
            matchedEstimateFromMap: matchedEstimate,
            finalCalculatedEstimate: finalEstimate,
            fullEstimatesMap: taskEstimates,
        });

        return {
            ...t,
            completed_pomos: sessionCounts[t._id] || (t.gtask_id ? sessionCounts[t.gtask_id] : 0) || 0,
            estimated_pomos: finalEstimate,
        };
    });


    const activeList = lists.find((l: any) => l.is_visible) || lists[0] || null;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todaySessions = sessions.filter((s: any) => new Date(s.completed_at).getTime() >= startOfDay.getTime());



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

    const handleAddTaskToList = async (list: any, overrideTitle?: string) => {
        const title = overrideTitle ?? listTaskInputs[list._id];
        if (!title?.trim()) return;

        if (list.type === 'google') {
            let currentToken = accessToken || await loginNative();
            if (!currentToken) return;
            try {
                const created = await createDirectGoogleTask(currentToken, list.gtask_list_id || list._id, title.trim());
                // Store initial target pomodoros estimate from form state
                const initialPomos = Math.max(1, estimatedPomos);
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
        } else {
            const initialPomos = Math.max(1, estimatedPomos);
            const newTask = {
                _id: 'local-' + Date.now(),
                list_id: list._id,
                title: title.trim(),
                status: 'needsAction',
                estimated_pomos: initialPomos,
                completed_pomos: 0,
            };
            saveLocalTasks([...localTasks, newTask]);
        }

        setListTaskInputs((prev) => ({ ...prev, [list._id]: '' }));
    };

    const handleSyncGoogleTasks = async (silent = false, overrideToken?: string, forceFullSync = false) => {
        let currentToken = overrideToken || accessToken;
        if (!currentToken) return;
        
        setIsSyncing(true);
        try {
            const syncMin = forceFullSync ? undefined : (lastSyncTime || undefined);
            const nowIso = new Date().toISOString();
            const { lists: gLists, tasks: fetchedTasks } = await fetchAllGoogleDataDirectly(currentToken, syncMin);
            setGoogleLists(gLists);

            if (forceFullSync || !lastSyncTime) {
                setGoogleTasks(fetchedTasks);
            } else if (fetchedTasks.length > 0) {
                setGoogleTasks((prev) => {
                    const updatedMap = new Map(fetchedTasks.map((t) => [t.gtask_id, t]));
                    const merged = prev.map((t) => updatedMap.get(t.gtask_id) || t);
                    const existingIds = new Set(prev.map((t) => t.gtask_id));
                    const newTasks = fetchedTasks.filter((t) => !existingIds.has(t.gtask_id));
                    return [...merged, ...newTasks];
                });
            }
            setLastSyncTime(nowIso);

            const driveData = await readAppDataFromDrive(currentToken);
            if (driveData) {
                if (driveData.localLists?.length) saveLocalLists(driveData.localLists);
                if (driveData.localTasks?.length) saveLocalTasks(driveData.localTasks);
                                
                // Non-destructive session merging: combine local and Drive sessions by ID to preserve heatmap history across all devices
                if (driveData.sessions?.length) {
                    setSessions((prevSessions: any[]) => {
                        const sessionMap = new Map();
                        prevSessions.forEach((s: any) => sessionMap.set(s._id, s));
                        driveData.sessions.forEach((s: any) => sessionMap.set(s._id, s));
                        const merged = Array.from(sessionMap.values());
                        localStorage.setItem('local_sessions', JSON.stringify(merged));
                        return merged;
                    });
                }
                // Restore and merge cross-device task estimates from Drive
                if (driveData.taskEstimates) {
                    setTaskEstimates((prev) => {
                        const merged = { ...driveData.taskEstimates, ...prev };
                        localStorage.setItem('task_estimates', JSON.stringify(merged));
                        return merged;
                    });
                }
            }
            if (!silent) alert("Tasks successfully synced from Google!");
        } catch (error) {
            localStorage.removeItem('google_access_token');
            localStorage.removeItem('google_token_expiry');
            setAccessToken(null);
            await loginNative();
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
        if (e) e.stopPropagation();
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
        } else {
            const updated = localTasks.filter((t) => t._id !== task._id);
            saveLocalTasks(updated);
        }
    };

    const handleSelectTask = (taskId: string) => setSelectedTaskId(taskId);
    
    const handleStart = () => {
        setIsRunning(true);
        setActiveTab('dashboard');
        requestNotificationPermission();
    };

    const handlePause = () => setIsRunning(false);

    const handleLogSession = async () => {
        if (!selectedTaskId) return;
        const newSession = {
            _id: 'sess-' + Date.now(),
            completed_at: new Date().toISOString(),
            duration_minutes: workDurationMinutes,
            task_id: selectedTaskId,
        };
        saveSessions([...sessions, newSession]);
        setSeconds(workDurationMinutes * 60);
        setIsRunning(false);
    };

    // Countdown Timer Effect
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isRunning && seconds > 0) {
            interval = setInterval(() => setSeconds((prev) => prev - 1), 1000);
        } else if (seconds === 0 && isRunning) {
            setIsRunning(false);
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
            setPipWindowRef(null);
            return;
        }

        const pipWin = await pipApi.requestWindow({ width: 280, height: 200 });
        setPipWindowRef(pipWin);

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
        pipWin.document.getElementById('pip-reset')!.onclick = () => { setIsRunning(false); setSeconds(workDurationMinutes * 60); };
        pipWin.addEventListener('pagehide', () => setPipWindowRef(null));
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

    const toggleListVisibility = (listId: string) => {
        const updated = localLists.map((l) =>
            l._id === listId ? { ...l, is_visible: !l.is_visible } : l
        );
        saveLocalLists(updated);
    };

    const createLocalList = (title: string) => {
        if (!title.trim()) return;
        const newList = {
            _id: 'list-' + Date.now(),
            title: title.trim(),
            type: 'local',
            is_visible: true,
        };
        saveLocalLists([...localLists, newList]);
    };

    // Normalizes input to accept either object payload ({ taskId, estimatedPomos }) or positional arguments (taskId, pomos)
    const updateEstimatedPomos = (
        targetInput: string | { taskId: string; estimatedPomos?: number; estimated_pomos?: number },
        pomos?: number,
        e?: React.MouseEvent
    ) => {
        let taskId: string;
        let targetPomos: number | undefined;

        if (typeof targetInput === 'object' && targetInput !== null) {
            taskId = targetInput.taskId;
            targetPomos = targetInput.estimatedPomos ?? targetInput.estimated_pomos;
        } else {
            taskId = targetInput;
            targetPomos = pomos;
        }

        if (!taskId) return;
        

        if (e && typeof e.stopPropagation === 'function') {
            e.stopPropagation();
        }
        
        // Persist estimate override to taskEstimates map so Google task updates aren't wiped on API sync
        const parsedPomos = typeof targetPomos === 'number' && !isNaN(targetPomos) ? targetPomos : 1;
        const validPomos = Math.max(1, parsedPomos);

        // Map estimate to both local _id and gtask_id so UI lookup never drops the target count
        const targetTask = tasks.find((t: any) => t._id === taskId || t.gtask_id === taskId);
        const updatedEstimates = {
            ...taskEstimates,
            [taskId]: validPomos,
            ...(targetTask?._id ? { [targetTask._id]: validPomos } : {}),
            ...(targetTask?.gtask_id ? { [targetTask.gtask_id]: validPomos } : {}),
        };

        console.log('[UPDATE POMOS MATCH]', { targetTaskFound: targetTask, previousMap: taskEstimates });
        console.log('[UPDATE POMOS NEW MAP]', updatedEstimates);
        setTaskEstimates(updatedEstimates);
        localStorage.setItem('task_estimates', JSON.stringify(updatedEstimates));

        // Also update localTasks array if the targeted task is a local task
        if (localTasks.some((t) => t._id === taskId)) {
            const updated = localTasks.map((t) =>
                t._id === taskId ? { ...t, estimated_pomos: validPomos } : t
            );
            saveLocalTasks(updated);
        }

        // Sync updated estimate dictionary to Google Drive
        triggerDriveSync(accessToken, localLists, localTasks, sessions, updatedEstimates);
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
        setSelectedTaskId('');
        alert("Logged out of Google account.");
    };
    const handlePullToRefresh = async () => {
        await handleSyncGoogleTasks(true, undefined, true);
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
        lists, tasks, todaySessions,
        handleSelectTask, handleStart, handlePause, handleLogSession,
        handleSyncGoogleTasks, handlePullToRefresh, handleAddTaskToList, handleCompleteTask,
        toggleListVisibility, createLocalList, updateEstimatedPomos,
        toggleFullscreen, toggleFloatingWidget, formatTime,
        handleLogout, loginNative, 
        workDurationMinutes, setWorkDurationMinutes,
        isSyncing
    };

    
}