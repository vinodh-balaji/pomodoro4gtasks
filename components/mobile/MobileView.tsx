"use client";

import React, { useState, useRef } from 'react';
import AnalyticsView from '../AnalyticsView';
import { THEMES, ThemeConfig } from '../../lib/themes';

export default function MobileView(props: any) {
    const {
        lists,
        tasks,
        seconds,
        isRunning,
        activeTab,
        selectedTaskId,
        newListTitle,
        accessToken,
        setActiveTab,
        setSelectedTaskId,
        setNewListTitle,
        handleStart,
        handlePause,
        handleLogSession,
        handleSyncGoogleTasks,
        handleAddTaskToList,
        handleCompleteTask,
        handleCreateGoogleList,
        handleDeleteSession,
        handleEditTask,
        updateEstimatedPomos,
        handleLogout,
        loginNative,
        formatTime,
        workDurationMinutes = 25,
        isSyncing, 
        currentTheme,
        currentThemeId,
        setTheme,
    } = props;

    const theme: ThemeConfig = currentTheme || THEMES.sakura;
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [showSplash, setShowSplash] = useState(true);
    React.useEffect(() => {
        const timer = setTimeout(() => setShowSplash(false), 1800);
        return () => clearTimeout(timer);
    }, []);
    const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
    const [selectedListId, setSelectedListId] = useState<string | null>(null);
    const [quickTaskTitle, setQuickTaskTitle] = useState('');
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const { todaySessions = [], sessions = [], DAILY_GOAL = 8 } = props;
    const [pullY, setPullY] = useState(0);
    const [swipeX, setSwipeX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const touchStartY = useRef(0);
    const touchStartX = useRef(0);
    const touchDirection = useRef<'x' | 'y' | null>(null);

    const visibleLists = lists?.filter((l: any) => l.is_visible) || [];
    const activeList = lists?.find((l: any) => l._id === (selectedListId || visibleLists[0]?._id)) || visibleLists[0];
    const expandedTask = tasks?.find((t: any) => t._id === expandedTaskId);
    const activeTask = tasks?.find((t: any) => t._id === selectedTaskId);

    // 1. Build continuous slide track array
    const slides: Array<{ type: 'list' | 'dashboard' | 'analytics'; id: string; list?: any }> = [
        ...visibleLists.map((l: any) => ({ type: 'list' as const, id: l._id, list: l })),
        { type: 'dashboard' as const, id: 'dashboard' },
        { type: 'analytics' as const, id: 'analytics' }
    ];

    // 2. Derive active slide index
    let currentSlideIndex = 0;
    if (activeTab === 'dashboard') {
        currentSlideIndex = visibleLists.length;
    } else if (activeTab === 'analytics') {
        currentSlideIndex = visibleLists.length + 1;
    } else {
        const listIdx = visibleLists.findIndex((l: any) => String(l._id) === String(activeList?._id));
        currentSlideIndex = listIdx >= 0 ? listIdx : 0;
    }

    const goToSlide = (index: number) => {
        if (index < 0) {
            setIsDrawerOpen(true);
            return;
        }
        if (index < visibleLists.length) {
            setActiveTab('board');
            setSelectedListId(visibleLists[index]._id);
        } else if (index === visibleLists.length) {
            setActiveTab('dashboard');
        } else if (index === visibleLists.length + 1) {
            setActiveTab('analytics');
        }
    };

    // Swipe-to-refresh & Carousel gesture handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
        touchDirection.current = null;
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const deltaX = e.touches[0].clientX - touchStartX.current;
        const deltaY = e.touches[0].clientY - touchStartY.current;

        // Lock swipe direction on initial movement
        if (!touchDirection.current) {
            if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
                touchDirection.current = Math.abs(deltaX) > Math.abs(deltaY) ? 'x' : 'y';
            }
        }

        if (touchDirection.current === 'x') {
            setSwipeX(deltaX);
        } else if (touchDirection.current === 'y' && e.currentTarget.scrollTop === 0 && deltaY > 0) {
            if (deltaY < 180) setPullY(deltaY);
        }
    };

    const handleTouchEnd = async () => {
        setIsDragging(false);

        if (touchDirection.current === 'x' && Math.abs(swipeX) > 45) {
            if (swipeX < 0) {
                if (currentSlideIndex < slides.length - 1) {
                    goToSlide(currentSlideIndex + 1);
                }
            } else {
                goToSlide(currentSlideIndex - 1);
            }
        }
        if (touchDirection.current === 'y' && pullY > 60) {
            await handleSyncGoogleTasks(true);
        }

        setPullY(0);
        setSwipeX(0);
        touchStartY.current = 0;
        touchDirection.current = null;
    };

    const handleQuickAddTask = (targetList: any) => {
        const titleToSubmit = quickTaskTitle.trim();
        if (!titleToSubmit || !targetList) return;
        
        setQuickTaskTitle('');
        handleAddTaskToList(targetList, titleToSubmit).catch((err: any) =>
            console.error("Background task addition failed:", err)
        );
    };

    const handleQuickStartTimer = (taskId: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setSelectedTaskId(taskId);
        setActiveTab('dashboard');
        if (!isRunning) handleStart();
    };

    return (
        <div 
            className="flex flex-col h-screen select-none pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] relative overflow-hidden font-sans antialiased transition-all duration-500 bg-cover bg-center"
            style={{ backgroundImage: `url(${theme.bgUrl})` }}
        >
            {/* Ambient Overlay for Legibility */}
            <div className={`absolute inset-0 ${theme.isDark ? 'bg-slate-950/50' : 'bg-slate-900/15'} backdrop-blur-[1px] pointer-events-none z-0`} />

            {/* Animated Splash Screen Overlay */}
            {showSplash && (
                <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col items-center justify-center transition-opacity duration-500">
                    <div className="flex flex-col items-center gap-3 animate-pulse">
                        <img src="/icon.png" alt="PomoSync" className="w-20 h-20 rounded-2xl shadow-2xl border border-white/10 object-cover" />
                        <span className="text-2xl font-extrabold text-white tracking-tight">Tasks 'n Timers</span>
                    </div>
                </div>
            )}

            {/* ================= 1. LEFT MENU DRAWER & SETTINGS ================= */}
            {isDrawerOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex transition-opacity duration-150">
                    <div className="w-[85%] max-w-[320px] bg-white/95 backdrop-blur-xl h-full shadow-2xl flex flex-col justify-between p-5 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-[calc(env(safe-area-inset-bottom)+1.25rem)] border-r border-slate-200/80">
                        <div className="space-y-6 overflow-y-auto">
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                                <div className="flex items-center gap-2.5 shrink-0">
                                    <img src="/icon.png" alt="PomoSync" className="w-8 h-8 rounded-xl object-cover border border-slate-100 shadow-xs" />
                                    <div>
                                        <h2 className="text-base font-bold text-slate-900 leading-none">Tasks 'n Timers</h2>
                                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mt-1">Task Lists & Themes</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsDrawerOpen(false)}
                                    className="w-8 h-8 rounded-full bg-slate-100 active:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-xs active:scale-90 transition-transform shrink-0"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Local Task Lists Section */}
                            <div>
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                                    Local Lists
                                </span>
                                <div className="space-y-1">
                                   {lists?.filter((l: any) => l.type === 'local')?.map((list: any) => {
                                        const count = tasks?.filter((t: any) => t.list_id === list._id && t.status !== 'completed').length || 0;
                                        const isSelected = activeList?._id === list._id;
                                        return (
                                            <button
                                                key={list._id}
                                                onClick={() => {
                                                    setSelectedListId(list._id);
                                                    setActiveTab('board');
                                                    setIsDrawerOpen(false);
                                                }}
                                                className={`w-full p-3 rounded-xl text-left text-sm font-semibold flex items-center justify-between active:scale-[0.97] transition-transform ${
                                                    isSelected ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold' : 'text-slate-700 active:bg-slate-100/70'
                                                }`}
                                            >
                                                <span className="truncate">📋 {list.title}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-lg ${isSelected ? 'bg-indigo-100 text-indigo-700 font-bold' : 'bg-slate-100 text-slate-500'}`}>
                                                    {count}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        {/* Google Tasks Section (Shown when connected) */}
                            {accessToken && (
                                <div>
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                                        Google Tasks
                                    </span>
                                    <div className="space-y-1">
                                        {lists?.filter((l: any) => l.type === 'google')?.map((list: any) => {
                                            const count = tasks?.filter((t: any) => t.list_id === list._id && t.status !== 'completed').length || 0;
                                            const isSelected = activeList?._id === list._id;
                                            return (
                                                <button
                                                    key={list._id}
                                                    onClick={() => {
                                                        setSelectedListId(list._id);
                                                        setActiveTab('board');
                                                        setIsDrawerOpen(false);
                                                    }}
                                                    className={`w-full p-3 rounded-xl text-left text-sm font-semibold flex items-center justify-between active:scale-[0.97] transition-transform ${
                                                        isSelected ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold' : 'text-slate-700 active:bg-slate-100/70'
                                                    }`}
                                                >
                                                    <span className="truncate">🔵 {list.title}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-lg ${isSelected ? 'bg-indigo-100 text-indigo-700 font-bold' : 'bg-slate-100 text-slate-500'}`}>
                                                        {count}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* List Creation Footer */}
                        <div className="space-y-3 pt-4 border-t border-slate-200/80">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder={accessToken ? "+ New Google List..." : "+ New Local List..."}
                                    value={newListTitle}
                                    onChange={(e) => setNewListTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleCreateGoogleList();
                                    }}
                                    className="flex-1 text-xs bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400"
                                />
                                <button
                                    onClick={() => handleCreateGoogleList()}
                                    disabled={!newListTitle.trim()}
                                    className="bg-indigo-600 active:bg-indigo-700 text-white text-xs px-3 py-2 rounded-xl font-bold active:scale-90 transition-transform shadow-xs"
                                >
                                    +
                                </button>
                            </div>

                        </div>
                    </div>
                    <div onClick={() => setIsDrawerOpen(false)} className="flex-1 h-full" />
                </div>
            )}

            {/* ================= 2. EXPANDED INTERACTIVE TASK CARD ================= */}
            {expandedTask && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex flex-col justify-end animate-fadeIn">
                    <div className={`${theme.cardBg} rounded-t-3xl p-6 shadow-2xl space-y-6 border-t${theme.cardBorder} max-h-[90%] overflow-y-auto z-10`}>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50/80 border border-indigo-100 px-3 py-1 rounded-full">
                                {expandedTask.gtask_id ? 'Google Task' : 'Local Task'}
                            </span>
                            <button
                                onClick={() => setExpandedTaskId(null)}
                                className="w-8 h-8 rounded-full bg-slate-200/60 active:bg-slate-300 text-slate-600 font-bold flex items-center justify-center text-sm active:scale-90 transition-transform"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-1">
                            <label className={`text-[10px] font-bold uppercase tracking-wider block ${theme.textSecondary}`}>
                                Task Title
                            </label>
                            <input
                                type="text"
                                defaultValue={expandedTask.title}
                                onBlur={(e) => {
                                    handleEditTask(expandedTask._id, e.target.value);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleEditTask(expandedTask._id, e.currentTarget.value);
                                        e.currentTarget.blur();
                                    }
                                }}
                                className={`w-full text-lg font-bold ${theme.textPrimary} bg-white/70 border${theme.cardBorder} rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400`}
                            />
                            <p className="text-xs text-slate-400 mt-1">List: {activeList?.title || 'Default List'}</p>
                        </div>

                        <div className={`bg-white/60 border ${theme.cardBorder} rounded-2xl p-4 space-y-3`}>
                            <div className="flex justify-between items-center">
                                <span className={`text-xs font-bold uppercase tracking-wider ${theme.textSecondary}`}>Pomodoro Progress</span>
                                <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-xl">
                                    {expandedTask.completed_pomos || 0} / {expandedTask.estimated_pomos || 1} Pomodoros
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 py-2 border-y border-slate-200/60 min-h-[48px]">
                                {Array.from({ length: expandedTask.estimated_pomos || 1 }).map((_, idx) => {
                                    const isCompleted = idx < (expandedTask.completed_pomos || 0);
                                    return (
                                        <span
                                            key={idx}
                                            className={`text-2xl transition-all transform duration-150 ${
                                                isCompleted ? 'scale-110 filter drop-shadow-xs' : 'opacity-25 grayscale scale-95'
                                            }`}
                                        >
                                            🍅
                                        </span>
                                    );
                                })}
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <span className={`text-xs font-semibold ${theme.textPrimary}`}>Adjust Target Pomodoros:</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            updateEstimatedPomos({ taskId: expandedTask._id, estimatedPomos: Math.max(1, (expandedTask.estimated_pomos ?? 1) - 1) });
                                        }}
                                        className="w-9 h-9 rounded-xl bg-white/90 border border-slate-200 active:bg-slate-100 text-slate-700 font-bold text-lg shadow-xs active:scale-90 transition-transform flex items-center justify-center"
                                    >
                                        -
                                    </button>
                                    <span className={`text-base font-bold font-mono px-2 ${theme.textPrimary}`}>{expandedTask.estimated_pomos || 1}</span>
                                    <button
                                        onClick={() => {
                                            updateEstimatedPomos({ taskId: expandedTask._id, estimatedPomos: (expandedTask.estimated_pomos ?? 1) + 1 });
                                        }}
                                        className="w-9 h-9 rounded-xl bg-white/90 border border-slate-200 active:bg-slate-100 text-slate-700 font-bold text-lg shadow-xs active:scale-90 transition-transform flex items-center justify-center"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2.5 pt-1">
                            <button
                                onClick={() => {
                                    handleQuickStartTimer(expandedTask._id);
                                    setExpandedTaskId(null);
                                }}
                                className={`w-full py-4 ${theme.accentBg} text-white rounded-2xl font-bold text-base shadow-lg active:scale-[0.97] transition-all flex items-center justify-center gap-2`}
                            >
                                <span>▶</span> Start 25m Pomodoro
                            </button>
                            <button
                                onClick={(e) => {
                                    handleCompleteTask(expandedTask, e);
                                    setExpandedTaskId(null);
                                }}
                                className="w-full py-3.5 bg-emerald-500/10 active:bg-emerald-500/20 text-emerald-700 border border-emerald-300/50 rounded-2xl font-bold text-sm active:scale-[0.97] transition-all"
                            >
                                ✓ Mark Task Completed
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= SETTINGS & THEME GALLERY MODAL ================= */}
            {isSettingsOpen && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex flex-col justify-end animate-fadeIn">
                    <div className="bg-white rounded-t-3xl p-6 shadow-2xl space-y-6 border-t border-slate-200 max-h-[85%] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">⚙️</span>
                                <h2 className="text-lg font-bold text-slate-900">App Settings</h2>
                            </div>
                            <button
                                onClick={() => setIsSettingsOpen(false)}
                                className="w-8 h-8 rounded-full bg-slate-100 active:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-xs active:scale-90 transition-transform"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Section 1: Themes & Aesthetics */}
                        <div className="space-y-3">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Appearance & Themes</span>
                            <div className="grid grid-cols-2 gap-2.5">
                                {Object.values(THEMES).map((th) => {
                                    const isCurrent = th.id === currentThemeId;
                                    return (
                                        <button
                                            key={th.id}
                                            onClick={() => setTheme(th.id)}
                                            className={`relative h-20 rounded-2xl overflow-hidden border-2 text-left p-2.5 flex flex-col justify-end active:scale-95 transition-all bg-cover bg-center ${
                                                isCurrent ? 'border-indigo-600 ring-2 ring-indigo-500/30 shadow-md' : 'border-slate-200 opacity-85 hover:opacity-100'
                                            } ${!th.bgUrl ? (th.isDark ? 'bg-slate-950' : 'bg-slate-100') : ''}`}
                                            style={th.bgUrl ? { backgroundImage: `url(${th.bgUrl})` } : {}}
                                        >
                                            {th.bgUrl && <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />}
                                            <div className="relative z-10 flex items-center gap-1.5 text-white">
                                                <span className="text-sm">{th.emoji}</span>
                                                <span className={`text-xs font-bold truncate ${!th.bgUrl && !th.isDark ? 'text-slate-900' : 'text-white'}`}>
                                                    {th.name}
                                                </span>
                                            </div>
                                            {isCurrent && (
                                                <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                                                    ✓
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Section 2: Timer Configuration (Future Scaffolding) */}
                        <div className="space-y-3 pt-2 border-t border-slate-100">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Timer Preferences</span>
                            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-semibold text-slate-700">Focus Duration</span>
                                    <span className="font-bold text-indigo-600 font-mono">25 Minutes</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-semibold text-slate-700">Short Break Duration</span>
                                    <span className="font-bold text-indigo-600 font-mono">5 Minutes</span>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: App Integrations */}
                        <div className="space-y-3 pt-2 border-t border-slate-100">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Integrations & Accounts</span>
                            <div className="space-y-2">
                                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                            <span>🔵</span> Google Tasks & Drive
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${accessToken ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {accessToken ? 'Connected' : 'Disconnected'}
                                        </span>
                                    </div>
                                    {accessToken ? (
                                        <button
                                            onClick={handleLogout}
                                            className="w-full py-2 px-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs active:scale-95 transition-transform flex items-center justify-center gap-1.5"
                                        >
                                            <span>🚪</span> Logout & Disconnect
                                        </button>
                                    ) : (
                                        <button
                                            onClick={loginNative}
                                            className="w-full py-2 px-3 rounded-xl bg-indigo-600 text-white font-bold text-xs active:scale-95 transition-transform shadow-xs flex items-center justify-center gap-1.5"
                                        >
                                            <span>🔑</span> Connect Google Account
                                        </button>
                                    )}


                                </div>
                                <div className="p-3 rounded-2xl bg-slate-50/50 border border-slate-200/60 flex justify-between items-center text-xs opacity-60">
                                    <span className="font-bold text-slate-700">🎯 ClickUp</span>
                                    <span className="text-[10px] font-bold text-slate-400">Coming Soon</span>
                                </div>
                                <div className="p-3 rounded-2xl bg-slate-50/50 border border-slate-200/60 flex justify-between items-center text-xs opacity-60">
                                    <span className="font-bold text-slate-700">🔴 Todoist</span>
                                    <span className="text-[10px] font-bold text-slate-400">Coming Soon</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* ================= 3. TOP NAVIGATION HEADER ================= */}
            <header className={`px-4 py-3 ${theme.headerBg} border-b flex items-center justify-between shrink-0 z-40 relative`}>
                <div className="flex items-center gap-2.5">
                    <img 
                        src="/icon.png" 
                        alt="PomoSync" 
                        className="w-8 h-8 rounded-xl shadow-xs object-cover border border-slate-100/30"
                    />
                    <button
                        onClick={() => {
                            setIsDrawerOpen(true);
                            if (accessToken) handleSyncGoogleTasks(true);
                        }}
                        className={`flex items-center gap-1.5 ${theme.accentText} font-bold text-sm bg-white/50 active:bg-white/80 px-3 py-1.5 rounded-xl border${theme.cardBorder} active:scale-95 transition-transform`}
                    >
                        <span>‹</span>
                        <span>Lists</span>
                    </button>
                </div>

                <div className="text-center">
                    <h1 className={`text-base font-bold leading-none ${theme.textPrimary}`}>
                        {activeTab === 'dashboard'
                            ? 'Tasks \'n Timers'
                            : activeTab === 'analytics'
                            ? 'Tasks \'n Timers Stats'
                            : activeList?.title || 'Tasks'}
                    </h1>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider block mt-0.5 ${theme.textSecondary}`}>
                        {activeTab === 'dashboard'
                            ? 'Focus'
                            : activeTab === 'analytics'
                            ? 'Analytics'
                            : activeList?.type || 'Local'}
                    </span>
                </div>

               

               <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleSyncGoogleTasks(true)}
                        disabled={isSyncing}
                        className="px-3 py-1.5 rounded-full bg-emerald-500/15 active:bg-emerald-500/25 text-emerald-700 font-bold text-xs border border-emerald-300/50 active:scale-95 transition-transform disabled:opacity-50"
                    >
                        {isSyncing ? (
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                <span>Syncing...</span>
                            </span>
                        ) : (
                            <span>Sync</span>
                        )}
                    </button>
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className={`w-8 h-8 rounded-xl bg-white/50 active:bg-white/80 border ${theme.cardBorder} flex items-center justify-center text-sm active:scale-90 transition-transform`}
                    >
                        ⚙️
                    </button>
                </div>
            </header>

            {/* ================= 4. CAROUSEL MULTI-VIEW TRACK ================= */}
            <main 
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="flex-1 overflow-hidden relative z-10"
            >
                {pullY > 20 && (
                    <div className="absolute top-2 left-0 right-0 z-30 text-center text-xs font-bold text-slate-500 py-1 animate-pulse bg-white/80 backdrop-blur-xs">
                        {pullY > 50 ? 'Release to refresh Google Tasks...' : 'Pull down to refresh'}
                    </div>
                )}

                <div 
                    className="flex h-full w-full"
                    style={{
                        transform: `translate3d(calc(-${currentSlideIndex * 100}% + ${swipeX}px), ${pullY > 0 ? pullY * 0.4 : 0}px, 0)`,
                        transition: isDragging ? 'none' : 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
                        willChange: 'transform',
                    }}
                >
                    {slides.map((slide) => {
                        if (slide.type === 'analytics') {
                            return (
                                <div key="analytics" className="w-full min-w-full flex-shrink-0 h-full overflow-y-auto px-4 py-4 space-y-4 pb-24">
                                    <div className="flex items-center justify-between px-1">
                                        <h2 className={`text-xs font-bold uppercase tracking-wider ${theme.textSecondary}`}>Performance Analytics</h2>
                                    </div>
                                    <div className={`${theme.cardBg} p-4 rounded-3xl border${theme.cardBorder} shadow-xs overflow-x-auto`}>
                                        <AnalyticsView sessions={sessions} tasks={tasks} DAILY_GOAL={DAILY_GOAL} />
                                    </div>
                                </div>
                            );
                        }

                        if (slide.type === 'dashboard') {
                            return (
                                <div key="dashboard" className="w-full min-w-full flex-shrink-0 h-full overflow-y-auto px-4 py-4 space-y-6 pb-24 pt-4 flex flex-col items-center">
                                    <div className={`w-full max-w-xs ${theme.cardBg} p-4 rounded-2xl border${theme.cardBorder} shadow-2xs flex flex-col items-center gap-2`}>
                                        {activeTask ? (
                                            <>
                                                <div className="flex items-center justify-between w-full">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded-md border border-indigo-100">
                                                        Active Task
                                                    </span>
                                                    <button
                                                        onClick={() => setSelectedTaskId('')}
                                                        className="text-xs text-slate-400 hover:text-slate-600 font-bold px-1.5 py-0.5 rounded-md hover:bg-slate-100/50 transition-colors"
                                                    >
                                                        ✕ Clear
                                                    </button>
                                                </div>
                                                <h3 className={`text-lg font-bold ${theme.textPrimary} text-center line-clamp-2 px-1 leading-snug`}>
                                                    {activeTask.title}
                                                </h3>
                                                <div className="flex items-center gap-1.5 pt-1">
                                                    {Array.from({ length: Math.max(activeTask.estimated_pomos || 1, activeTask.completed_pomos || 0) }).map((_, idx) => {
                                                        const isCompleted = idx < (activeTask.completed_pomos || 0);
                                                        return (
                                                            <span
                                                                key={idx}
                                                                className={`text-xl transition-all ${
                                                                    isCompleted ? 'filter drop-shadow-xs' : 'opacity-25 grayscale'
                                                                }`}
                                                            >
                                                                🍅
                                                            </span>
                                                        );
                                                    })}
                                                    <span className={`text-xs font-mono font-bold ml-1 ${theme.textSecondary}`}>
                                                        ({activeTask.completed_pomos || 0}/{activeTask.estimated_pomos || 1})
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center py-1">
                                                <span className={`text-xs font-bold uppercase tracking-wider block ${theme.textSecondary}`}>Current Focus</span>
                                                <span className={`text-sm font-bold ${theme.accentText}`}>🎯 Unassigned Focus Session</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className={`relative w-64 h-64 ${theme.cardBg} border ${theme.cardBorder} rounded-3xl p-4 shadow-sm backdrop-blur-md flex items-center justify-center`}>
                                        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="42" className="text-slate-300/40 dark:text-white/20 stroke-current" strokeWidth="7" fill="transparent" />
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r="42"
                                                className={`${theme.accentText} stroke-current transition-all duration-1000 ease-linear`}
                                                strokeWidth="7"
                                                strokeDasharray="264"
                                                strokeDashoffset={264 - (seconds / (workDurationMinutes * 60)) * 264}
                                                strokeLinecap="round"
                                                fill="transparent"
                                            />
                                        </svg>
                                        <span className={`absolute text-5xl font-mono font-bold tracking-tight ${theme.textPrimary}`}>
                                            {formatTime(seconds)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-center gap-3 w-full max-w-xs pt-2">
                                        {!isRunning ? (
                                            <button
                                                onClick={handleStart}
                                                className={`flex-1 py-4 ${theme.accentBg} text-white rounded-2xl font-bold text-base shadow-lg active:scale-95 transition-transform`}
                                            >
                                                Start Focus
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handlePause}
                                                className="flex-1 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-base shadow-lg active:scale-95 transition-transform"
                                            >
                                                Pause
                                            </button>
                                        )}
                                        <button
                                            onClick={handleLogSession}
                                            className="px-5 py-4 bg-white/70 active:bg-white text-slate-800 rounded-2xl font-semibold text-sm disabled:opacity-50 active:scale-95 transition-transform"
                                        >
                                            Done
                                        </button>
                                    </div>

                                    <div className="w-full max-w-xs space-y-2 pt-2">
                                        <button
                                            onClick={() => setIsHistoryOpen((prev) => !prev)}
                                            className={`w-full ${theme.cardBg} p-3.5 rounded-2xl border${theme.cardBorder} space-y-2 shadow-2xs text-left active:scale-[0.99] transition-transform`}
                                        >
                                            <div className={`flex justify-between items-center text-xs font-bold ${theme.textPrimary}`}>
                                                <span className="flex items-center gap-1.5">
                                                    <span>Today's Progress</span>
                                                    <span className="text-[10px] text-slate-400">{isHistoryOpen ? '▲' : '▼'}</span>
                                                </span>
                                                <span className={`font-mono ${theme.accentText}`}>{todaySessions.length} / {DAILY_GOAL} Pomodoros</span>
                                            </div>
                                            <div className="w-full bg-slate-200/50 h-2 rounded-full overflow-hidden">
                                                <div className="bg-rose-500 h-full transition-all duration-300" style={{ width: `${Math.min(100, (todaySessions.length / DAILY_GOAL) * 100)}%` }} />
                                            </div>
                                        </button>

                                        {isHistoryOpen && (
                                            <div className={`${theme.cardBg} rounded-2xl border${theme.cardBorder} p-3 shadow-2xs space-y-2 animate-fadeIn`}>
                                                <div className="flex justify-between items-center pb-1 border-b border-slate-200/50">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.textSecondary}`}>Logged Today</span>
                                                    <span className={`text-[10px] font-semibold ${theme.textSecondary}`}>{todaySessions.length} sessions</span>
                                                </div>
                                                {todaySessions.length === 0 ? (
                                                    <p className="text-xs text-slate-400 text-center py-2 italic">No sessions logged today yet.</p>
                                                ) : (
                                                    todaySessions.map((sess: any) => {
                                                        const matchedTask = tasks?.find((t: any) => t._id === sess.task_id || t.gtask_id === sess.task_id);
                                                        const sessionTime = sess.completed_at || sess.timestamp ? new Date(sess.completed_at || sess.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today';
                                                        return (
                                                            <div key={sess._id || sess.id} className="flex items-center justify-between text-xs py-1.5 px-2 bg-white/50 rounded-xl border border-slate-200/40">
                                                                <div className="min-w-0 pr-2">
                                                                   <span className={`font-semibold truncate block ${theme.textPrimary}`}>
                                                                        {matchedTask?.title || 'Unassigned Focus Session'}
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-400 font-mono">{sessionTime} • {sess.duration_minutes || 25}m</span>
                                                                </div>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteSession(sess._id || sess.id);
                                                                    }}
                                                                    className="text-slate-400 hover:text-rose-600 p-1 text-xs font-bold active:scale-90 transition-transform"
                                                                    title="Delete session"
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        }

                        // Task List slide
                        const list = slide.list;
                        const listTasks = tasks?.filter((t: any) => t.list_id === list?._id && t.status !== "completed") || [];

                        return (
                            <div key={list?._id || 'list'} className="w-full min-w-full flex-shrink-0 h-full overflow-y-auto px-4 py-4 space-y-3 pb-24">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder={`+ Add task to ${list?.title || 'list'}...`}
                                        value={quickTaskTitle}
                                        onChange={(e) => setQuickTaskTitle(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleQuickAddTask(list);
                                        }}
                                        className={`w-full text-xs ${theme.cardBg} border ${theme.cardBorder} rounded-2xl px-3.5 py-3${theme.textPrimary} placeholder-slate-400 shadow-2xs focus:outline-none focus:border-rose-400`}
                                    />
                                    <button
                                        onClick={() => handleQuickAddTask(list)}
                                        disabled={!quickTaskTitle.trim()}
                                        className={`${theme.accentBg} disabled:bg-slate-300 text-white text-xs px-4 py-3 rounded-2xl font-bold shadow-xs active:scale-95 transition-all`}
                                    >
                                        Add
                                    </button>
                                </div>

                                <div className="flex items-center justify-between px-1 pt-2">
                                    <span className={`text-xs font-bold uppercase tracking-wider ${theme.textSecondary}`}>Tasks</span>
                                    <span className={`text-xs font-semibold ${theme.textSecondary}`}>{listTasks.length} items</span>
                                </div>

                                {listTasks.length === 0 ? (
                                    <div className={`text-center py-10 ${theme.cardBg} rounded-3xl border${theme.cardBorder} p-6`}>
                                        <span className="text-2xl block mb-2">🎉</span>
                                        <p className={`text-xs font-semibold ${theme.textPrimary}`}>No active tasks in this list.</p>
                                    </div>
                                ) : (
                                    listTasks.map((task: any) => {
                                        const isSelected = selectedTaskId === task._id;
                                        return (
                                            <div
                                                key={task._id}
                                                onClick={() => setExpandedTaskId(task._id)}
                                                className={`p-3.5 rounded-2xl ${theme.cardBg} border flex items-center justify-between shadow-2xs active:scale-[0.98] transition-all cursor-pointer ${
                                                    isSelected ? 'border-rose-500 ring-2 ring-rose-500/20' : theme.cardBorder
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0 pr-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={task.completed}
                                                        onChange={(e) => {
                                                            e.stopPropagation();
                                                            handleCompleteTask(task, e);
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="w-5 h-5 rounded-md border-2 border-slate-300 text-rose-500 focus:ring-0 cursor-pointer"
                                                    />
                                                    <span className={`text-sm font-semibold truncate ${isSelected ? 'font-bold' : ''} ${theme.textPrimary}`}>
                                                        {task.title}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                   <span className={`text-[11px] font-bold bg-white/60 border ${theme.cardBorder} px-2.5 py-1 rounded-xl ${theme.textPrimary}`}>
                                                        🍅 {task.completed_pomos || 0}/{task.estimated_pomos || 1}
                                                    </span>
                                                    <button
                                                        onClick={(e) => handleQuickStartTimer(task._id, e)}
                                                        className={`w-8 h-8 rounded-xl ${theme.accentBg} text-white font-bold flex items-center justify-center text-xs shadow-xs active:scale-90 transition-transform`}
                                                    >
                                                        ▶
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        );
                    })}
                </div>
            </main>

            {/* ================= 5. FLOATING NATIVE TAB BAR ================= */}
            <nav className={`fixed bottom-0 inset-x-0 h-20 ${theme.navBg} border-t px-6 flex items-center justify-around z-40 relative`}>
                <button
                    onClick={() => {
                        setActiveTab('board');
                        if (visibleLists.length > 0) setSelectedListId(visibleLists[0]._id);
                    }}
                    className={`flex flex-col items-center gap-0.5 text-[10px] font-bold active:scale-95 transition-transform ${activeTab === 'board' ? theme.accentText : 'text-slate-400'}`}
                >
                    <span className="text-lg">📋</span>
                    Tasks
                </button>
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex flex-col items-center gap-0.5 text-[10px] font-bold active:scale-95 transition-transform ${activeTab === 'dashboard' ? theme.accentText : 'text-slate-400'}`}
                >
                    <span className="text-lg">⏱️</span>
                    Timer
                </button>
                <button
                    onClick={() => setActiveTab('analytics')}
                    className={`flex flex-col items-center gap-0.5 text-[10px] font-bold active:scale-95 transition-transform ${activeTab === 'analytics' ? theme.accentText : 'text-slate-400'}`}
                >
                    <span className="text-lg">📊</span>
                    Stats
                </button>
            </nav>
        </div>
    );
}