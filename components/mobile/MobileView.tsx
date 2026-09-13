"use client";

import React, { useState, useRef } from 'react';
import AnalyticsView from '../AnalyticsView';

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
        createLocalList,
        updateEstimatedPomos,
        handleLogout,
        loginNative,
        formatTime,
        workDurationMinutes = 25,
        isSyncing, 
    } = props;

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
    const [selectedListId, setSelectedListId] = useState<string | null>(null);
    const [quickTaskTitle, setQuickTaskTitle] = useState('');
    const [pullY, setPullY] = useState(0);
    const touchStartY = useRef(0);

    // Swipe-to-refresh gesture handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.currentTarget.scrollTop === 0) {
            touchStartY.current = e.touches[0].clientY;
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (touchStartY.current > 0 && e.currentTarget.scrollTop === 0) {
            const dist = e.touches[0].clientY - touchStartY.current;
            if (dist > 0 && dist < 100) setPullY(dist);
        }
    };

    const handleTouchEnd = async () => {
        if (pullY > 50) await handleSyncGoogleTasks(true);
        setPullY(0);
        touchStartY.current = 0;
    };

    const visibleLists = lists?.filter((l: any) => l.is_visible) || [];
    const activeList = lists?.find((l: any) => l._id === (selectedListId || visibleLists[0]?._id)) || visibleLists[0];
    const currentListTasks = tasks?.filter((t: any) => t.list_id === activeList?._id && t.status !== "completed") || [];
    const expandedTask = tasks?.find((t: any) => t._id === expandedTaskId);
    const activeTask = tasks?.find((t: any) => t._id === selectedTaskId);

    // 1 & 2. Optimistic & Instant Task Creation
    const handleQuickAddTask = () => {
        const titleToSubmit = quickTaskTitle.trim();
        if (!titleToSubmit || !activeList) return;
        
        // Instantly clear text input for snappy feel
        setQuickTaskTitle('');

        // Trigger task creation in background
      handleAddTaskToList(activeList, titleToSubmit).catch((err: any) => 
            console.error("Background task addition failed:", err)
        );
    };

    const handleQuickStartTimer = (taskId: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setSelectedTaskId(taskId);
        setActiveTab('dashboard');
        handleStart();
    };

    return (
        <div className="flex flex-col h-screen bg-slate-100 text-slate-800 select-none pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] relative overflow-hidden font-sans antialiased">

            {/* ================= 1. LEFT MENU DRAWER & SETTINGS ================= */}
            {isDrawerOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex transition-opacity duration-150">
                    <div className="w-[85%] max-w-[320px] bg-white h-full shadow-2xl flex flex-col justify-between p-5 border-r border-slate-200">
                        <div className="space-y-6 overflow-y-auto">
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-indigo-600"></span>
                                    <h2 className="text-lg font-bold text-slate-900">Task Lists</h2>
                                </div>
                                <button
                                    onClick={() => setIsDrawerOpen(false)}
                                    className="w-8 h-8 rounded-full bg-slate-100 active:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-xs active:scale-90 transition-transform"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Local Lists */}
                            <div>
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Local Lists</span>
                                <div className="space-y-1">
                                    {lists?.filter((l: any) => l.type === 'local').map((list: any) => {
                                        const count = tasks?.filter((t: any) => t.list_id === list._id && t.status !== 'completed').length || 0;
                                        const isSelected = activeList?._id === list._id;
                                        return (
                                            <button
                                                key={list._id}
                                                onClick={() => {
                                                    setSelectedListId(list._id);
                                                    setIsDrawerOpen(false);
                                                }}
                                                className={`w-full p-3 rounded-xl text-left text-sm font-semibold flex items-center justify-between active:scale-[0.97] transition-transform ${
                                                    isSelected ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold' : 'text-slate-700 active:bg-slate-100'
                                                }`}
                                            >
                                                <span className="truncate">📁 {list.title}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-lg ${isSelected ? 'bg-indigo-100 text-indigo-700 font-bold' : 'bg-slate-100 text-slate-500'}`}>
                                                    {count}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Google Lists */}
                            <div>
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Google Tasks</span>
                                <div className="space-y-1">
                                    {lists?.filter((l: any) => l.type === 'google').map((list: any) => {
                                        const count = tasks?.filter((t: any) => t.list_id === list._id && t.status !== 'completed').length || 0;
                                        const isSelected = activeList?._id === list._id;
                                        return (
                                            <button
                                                key={list._id}
                                                onClick={() => {
                                                    setSelectedListId(list._id);
                                                    setIsDrawerOpen(false);
                                                }}
                                                className={`w-full p-3 rounded-xl text-left text-sm font-semibold flex items-center justify-between active:scale-[0.97] transition-transform ${
                                                    isSelected ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold' : 'text-slate-700 active:bg-slate-100'
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
                        </div>

                        {/* 3. Account Management & Logout Switcher */}
                        <div className="space-y-3 pt-4 border-t border-slate-100">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="+ New list name"
                                    value={newListTitle}
                                    onChange={(e) => setNewListTitle(e.target.value)}
                                    className="flex-1 text-xs bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400"
                                />
                                <button
                                    onClick={() => {
                                        if (newListTitle.trim()) {
                                            createLocalList({ title: newListTitle });
                                            setNewListTitle('');
                                        }
                                    }}
                                    className="bg-indigo-600 active:bg-indigo-700 text-white text-xs px-3 py-2 rounded-xl font-bold active:scale-90 transition-transform shadow-xs"
                                >
                                    +
                                </button>
                            </div>

                            {/* Account Control Card */}
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Google Auth</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${accessToken ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {accessToken ? 'Connected' : 'Logged Out'}
                                    </span>
                                </div>
                                {accessToken ? (
                                    <button
                                        onClick={handleLogout}
                                        className="w-full py-2 px-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs active:scale-95 transition-transform flex items-center justify-center gap-1.5"
                                    >
                                        <span>🚪</span> Logout & Switch Account
                                    </button>
                                ) : (
                                    <button
                                        onClick={loginNative}
                                        className="w-full py-2 px-3 rounded-xl bg-indigo-600 text-white font-bold text-xs active:scale-95 transition-transform shadow-xs flex items-center justify-center gap-1.5"
                                    >
                                        <span>🔑</span> Login with Google
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div onClick={() => setIsDrawerOpen(false)} className="flex-1 h-full" />
                </div>
            )}

            {/* ================= 2. EXPANDED INTERACTIVE TASK CARD ================= */}
            {expandedTask && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex flex-col justify-end animate-fadeIn">
                    <div className="bg-white rounded-t-3xl p-6 shadow-2xl space-y-6 border-t border-slate-200 max-h-[90%] overflow-y-auto">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                                {expandedTask.gtask_id ? 'Google Task' : 'Local Task'}
                            </span>
                            <button
                                onClick={() => setExpandedTaskId(null)}
                                className="w-8 h-8 rounded-full bg-slate-100 active:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-sm active:scale-90 transition-transform"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Full Task Title */}
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 leading-snug">
                                {expandedTask.title}
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">List: {activeList?.title || 'Default List'}</p>
                        </div>

                        {/* 5. Interactive Red Tomato Progress Display */}
                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pomodoro Progress</span>
                                <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-xl">
                                    {expandedTask.completed_pomos || 0} / {expandedTask.estimated_pomos || 1} Pomodoros
                                </span>
                            </div>

                            {/* Visual Red Tomatoes Grid */}
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

                            {/* Interactive Target Stepper Controls */}
                            <div className="flex items-center justify-between pt-1">
                                <span className="text-xs font-semibold text-slate-600">Adjust Target Pomodoros:</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            console.log('[MOBILE VIEW CLICK -]', {
                                                sendingObject: { taskId: expandedTask._id, estimatedPomos: Math.max(1, (expandedTask.estimated_pomos ?? 1) - 1) }
                                            });
                                            updateEstimatedPomos({ taskId: expandedTask._id, estimatedPomos: Math.max(1, (expandedTask.estimated_pomos ?? 1) - 1) });
                                        }}
                                        className="w-9 h-9 rounded-xl bg-white border border-slate-200 active:bg-slate-100 text-slate-700 font-bold text-lg shadow-xs active:scale-90 transition-transform flex items-center justify-center"
                                    >
                                        -
                                    </button>
                                    <span className="text-base font-bold font-mono text-slate-800 px-2">{expandedTask.estimated_pomos || 1}</span>
                                    <button
                                        onClick={() => {
                                            console.log('[MOBILE VIEW CLICK +]', {
                                                sendingObject: { taskId: expandedTask._id, estimatedPomos: (expandedTask.estimated_pomos ?? 1) + 1 }
                                            });
                                            updateEstimatedPomos({ taskId: expandedTask._id, estimatedPomos: (expandedTask.estimated_pomos ?? 1) + 1 });
                                        }}
                                        className="w-9 h-9 rounded-xl bg-white border border-slate-200 active:bg-slate-100 text-slate-700 font-bold text-lg shadow-xs active:scale-90 transition-transform flex items-center justify-center"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Tactile Action Buttons */}
                        <div className="space-y-2.5 pt-1">
                            <button
                                onClick={() => {
                                    handleQuickStartTimer(expandedTask._id);
                                    setExpandedTaskId(null);
                                }}
                                className="w-full py-4 bg-indigo-600 active:bg-indigo-700 text-white rounded-2xl font-bold text-base shadow-lg shadow-indigo-600/25 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
                            >
                                <span>▶</span> Start 25m Pomodoro
                            </button>
                            <button
                                onClick={(e) => {
                                    handleCompleteTask(expandedTask, e);
                                    setExpandedTaskId(null);
                                }}
                                className="w-full py-3.5 bg-emerald-50 active:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-2xl font-bold text-sm active:scale-[0.97] transition-all"
                            >
                                ✓ Mark Task Completed
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= 3. TOP NAVIGATION HEADER ================= */}
            <header className="px-4 py-3 bg-white/90 backdrop-blur-md border-b border-slate-200/70 flex items-center justify-between shrink-0 z-40">
                <button
                    onClick={() => {
                        setIsDrawerOpen(true);
                        // Pushes network/auth work to the next event loop tick after DOM paint
                        setTimeout(() => {
                            if (accessToken) {
                                handleSyncGoogleTasks(true);
                            }
                        }, 0);
                    }}
                    className="flex items-center gap-1.5 text-indigo-600 font-bold text-sm bg-indigo-50 active:bg-indigo-100 px-3.5 py-1.5 rounded-xl border border-indigo-100 active:scale-95 transition-transform"
                >
                    <span>‹</span>
                    <span>Lists</span>
                </button>
                <div className="text-center">
                    <h1 className="text-base font-bold text-slate-900 leading-none">{activeList?.title || 'Tasks'}</h1>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{activeList?.type || 'Local'}</span>
                </div>
                <button
                    onClick={handleSyncGoogleTasks}
                    className="px-3.5 py-1.5 rounded-full bg-emerald-50 active:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200/60 active:scale-95 transition-transform"
                >
                    {isSyncing ? (
                        <>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            <span>Syncing...</span>
                        </>
                    ) : (
                        <span>Sync</span>
                    )}
                </button>
            </header>

            {/* ================= 4. BODY CONTENT VIEWS ================= */}
            <main 
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-24 transition-transform duration-75"
                style={{ transform: pullY > 0 ? `translateY(${pullY * 0.4}px)` : 'none' }}
            >
                {pullY > 20 && (
                    <div className="text-center text-xs font-bold text-slate-400 py-1 animate-pulse">
                        {pullY > 50 ? 'Release to refresh Google Tasks...' : 'Pull down to refresh'}
                    </div>
                )}
                {activeTab === 'analytics' ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Performance Analytics</h2>
                        </div>
                        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs overflow-x-auto">
                            <AnalyticsView />
                        </div>
                    </div>
                ) : activeTab === 'dashboard' ? (
                    /* TIMER VIEW */
                    <div className="flex flex-col items-center justify-center space-y-6 pt-4">
                        <div className="px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold max-w-[90%] truncate">
                            🎯 {activeTask ? activeTask.title : 'No active task selected'}
                        </div>

                        {/* Circular Depleting Timer */}
                        <div className="relative w-60 h-60 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="42" className="text-slate-200 stroke-current" strokeWidth="7" fill="transparent" />
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="42"
                                    className="text-indigo-600 stroke-current transition-all duration-1000 ease-linear"
                                    strokeWidth="7"
                                    strokeDasharray="264"
                                    strokeDashoffset={264 - (seconds / (workDurationMinutes * 60)) * 264}
                                    strokeLinecap="round"
                                    fill="transparent"
                                />
                            </svg>
                            <span className="absolute text-5xl font-mono font-bold tracking-tight text-slate-900">
                                {formatTime(seconds)}
                            </span>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-center gap-3 w-full max-w-xs pt-2">
                            {!isRunning ? (
                                <button
                                    onClick={handleStart}
                                    className="flex-1 py-4 bg-indigo-600 active:bg-indigo-700 text-white rounded-2xl font-bold text-base shadow-lg shadow-indigo-600/20 active:scale-95 transition-transform"
                                >
                                    Start Focus
                                </button>
                            ) : (
                                <button
                                    onClick={handlePause}
                                    className="flex-1 py-4 bg-amber-500 active:bg-amber-600 text-white rounded-2xl font-bold text-base shadow-lg shadow-amber-500/20 active:scale-95 transition-transform"
                                >
                                    Pause
                                </button>
                            )}
                            <button
                                onClick={handleLogSession}
                                disabled={!selectedTaskId}
                                className="px-5 py-4 bg-slate-200 active:bg-slate-300 text-slate-700 rounded-2xl font-semibold text-sm disabled:opacity-50 active:scale-95 transition-transform"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                ) : (
                    /* TASK LIST VIEW */
                    <div className="space-y-3">
                        {/* 1 & 2. Quick Task Input Bar */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder={`+ Add task to ${activeList?.title || 'list'}...`}
                                value={quickTaskTitle}
                                onChange={(e) => setQuickTaskTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleQuickAddTask();
                                }}
                                className="w-full text-xs bg-white border border-slate-200/90 rounded-2xl px-3.5 py-3 text-slate-800 placeholder-slate-400 shadow-2xs focus:outline-none focus:border-indigo-400"
                            />
                            <button
                                onClick={handleQuickAddTask}
                                disabled={!quickTaskTitle.trim()}
                                className="bg-indigo-600 active:bg-indigo-700 disabled:bg-slate-300 text-white text-xs px-4 py-3 rounded-2xl font-bold shadow-xs active:scale-95 transition-all"
                            >
                                Add
                            </button>
                        </div>

                        <div className="flex items-center justify-between px-1 pt-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tasks</span>
                            <span className="text-xs font-semibold text-slate-400">{currentListTasks.length} items</span>
                        </div>

                        {/* Task Cards */}
                        {currentListTasks.length === 0 ? (
                            <div className="text-center py-10 bg-white rounded-3xl border border-slate-200/60 p-6">
                                <span className="text-2xl block mb-2">🎉</span>
                                <p className="text-xs font-semibold text-slate-500">No active tasks in this list.</p>
                            </div>
                        ) : (
                            currentListTasks.map((task: any) => {
                                const isSelected = selectedTaskId === task._id;
                                return (
                                    <div
                                        key={task._id}
                                        onClick={() => setExpandedTaskId(task._id)}
                                        className={`p-3.5 rounded-2xl bg-white border flex items-center justify-between shadow-2xs active:scale-[0.98] transition-all cursor-pointer ${
                                            isSelected ? 'border-indigo-600 ring-2 ring-indigo-600/10' : 'border-slate-200/80'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0 pr-2">
                                            <input
                                                type="checkbox"
                                                onClick={(e) => handleCompleteTask(task, e)}
                                                className="w-5 h-5 rounded-md border-2 border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer"
                                            />
                                            <span className={`text-sm font-semibold truncate ${isSelected ? 'text-indigo-950 font-bold' : 'text-slate-800'}`}>
                                                {task.title}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {/* 5. Tomato Summary Badge */}
                                            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200/60 px-2.5 py-1 rounded-xl">
                                                🍅 {task.completed_pomos || 0}/{task.estimated_pomos || 1}
                                            </span>
                                            {/* 4. Quick Start Tactile Button */}
                                            <button
                                                onClick={(e) => handleQuickStartTimer(task._id, e)}
                                                className="w-8 h-8 rounded-xl bg-indigo-600 active:bg-indigo-700 text-white font-bold flex items-center justify-center text-xs shadow-xs shadow-indigo-500/30 active:scale-90 transition-transform"
                                            >
                                                ▶
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </main>

            {/* ================= 5. FLOATING NATIVE TAB BAR ================= */}
            <nav className="fixed bottom-0 inset-x-0 h-20 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 px-6 flex items-center justify-around z-40">
                <button
                    onClick={() => setActiveTab('board')}
                    className={`flex flex-col items-center gap-0.5 text-[10px] font-bold active:scale-95 transition-transform ${activeTab === 'board' ? 'text-indigo-600' : 'text-slate-400'}`}
                >
                    <span className="text-lg">📋</span>
                    Tasks
                </button>
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex flex-col items-center gap-0.5 text-[10px] font-bold active:scale-95 transition-transform ${activeTab === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}`}
                >
                    <span className="text-lg">⏱️</span>
                    Timer
                </button>
                <button
                    onClick={() => setActiveTab('analytics')}
                    className={`flex flex-col items-center gap-0.5 text-[10px] font-bold active:scale-95 transition-transform ${activeTab === 'analytics' ? 'text-indigo-600' : 'text-slate-400'}`}
                >
                    <span className="text-lg">📊</span>
                    Stats
                </button>
            </nav>
        </div>
    );
}