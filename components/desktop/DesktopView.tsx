"use client";

import React, { useState } from 'react';
import { 
  playPop, 
  getTickEnabled, 
  setTickEnabled,
  getSoundMuted,
  setSoundMuted,
  startAmbientSound,
  stopAmbientSound,
  getCurrentAmbientType,
  getAmbientVolume,
  updateAmbientVolume
} from '../../lib/audio';
import AnalyticsView from '../AnalyticsView';
import SettingsView from '../modules/views/SettingsView';
import { THEMES, ThemeConfig } from '../../lib/themes';

export default function DesktopView(props: any) {
    const {
        lists = [],
        tasks = [],
        seconds,
        isRunning,
        activeTab,
        selectedTaskId,
        newListTitle,
        listTaskInputs,
        isFullscreen,
        DAILY_GOAL = 8,
        todaySessions = [],
        sessions = [],
        accessToken,
        handleLogout,
        loginNative,
        setActiveTab,
        setSelectedTaskId,
        setNewListTitle,
        setListTaskInputs,
        handleSelectTask,
        handleStart,
        handlePause,
        handleLogSession,
        handleSyncGoogleTasks,
        handleAddTaskToList,
        handleCompleteTask,
        handleCreateGoogleList,
        handleEditTask,
        toggleListVisibility,
        updateEstimatedPomos,
        estimationMode = 'pomos',
        toggleFullscreen,
        toggleFloatingWidget,
        formatTime,
        workDurationMinutes = 25,
        isSyncing,
        currentTheme,
        currentThemeId,
        setTheme,
        handleReplayOnboarding,
        handleResetStarterTasks,
        globalDuration = 25,
    } = props;

    const theme: ThemeConfig = currentTheme || THEMES.light;
    const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

    const localLists = lists.filter((l: any) => l.type === 'local');
    const googleLists = lists.filter((l: any) => l.type === 'google');
    const visibleLists = lists.filter((l: any) => l.is_visible);
    const expandedTask = tasks?.find((t: any) => t._id === expandedTaskId);
    const [ambientType, setAmbientType] = useState<'rain' | 'waves' | 'deep' | 'none'>(getCurrentAmbientType());
    const activeTask = tasks?.find((t: any) => t._id === selectedTaskId);

    const totalDurationSeconds = workDurationMinutes * 60;
    const strokeDashoffset = 283 - (seconds / totalDurationSeconds) * 283;

    const handleQuickStartTimer = (taskId: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (setSelectedTaskId) setSelectedTaskId(taskId);
        setActiveTab('dashboard');
        if (!isRunning && handleStart) handleStart();
    };

    return (
        <div 
            className="flex flex-col md:flex-row h-screen select-none overflow-hidden font-sans antialiased transition-all duration-500 bg-cover bg-center relative pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
            style={theme.bgUrl ? { backgroundImage: `url(${theme.bgUrl})` } : {}}
        >
            {/* Ambient Background Overlay */}
            <div className={`absolute inset-0 ${theme.bgUrl ? (theme.isDark ? 'bg-slate-950/60' : 'bg-slate-900/20') : (theme.isDark ? 'bg-slate-950' : 'bg-slate-100')} backdrop-blur-[1px] pointer-events-none z-0`} />

            {/* ================= 1. DESKTOP SIDEBAR MENU ================= */}
            <aside className={`w-full md:w-72 ${theme.cardBg} md:border-r ${theme.cardBorder} p-5 flex-col justify-between shrink-0 select-none overflow-y-auto z-10 ${activeTab === 'menu' ? 'flex flex-1' : 'hidden md:flex'}`}>
                <div className="space-y-6">
                    {/* Brand Header & Quick Actions */}
                    <div className="flex items-center justify-between border-b border-slate-200/40 pb-3">
                        <div className="flex items-center gap-2.5">
                            <img src="/icon.png" alt="PomoSync" className="w-8 h-8 rounded-xl object-cover border border-white/20 shadow-xs" />
                            <div>
                                <span className={`font-extrabold text-lg tracking-tight block leading-none ${theme.textPrimary}`}>Tasks 'n Timers</span>
                                <span className={`text-[10px] font-semibold uppercase tracking-wider block mt-1 ${theme.textSecondary}`}>Desktop Focus</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => handleSyncGoogleTasks(true)}
                                disabled={isSyncing}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/15 active:bg-emerald-500/25 text-emerald-700 font-bold text-xs border border-emerald-300/50 transition active:scale-95 disabled:opacity-50"
                                title="Sync with Google Tasks"
                            >
                                {isSyncing ? 'Syncing...' : 'Sync'}
                            </button>
                        </div>
                    </div>

                    {/* Navigation View Switcher */}
                    <div className="grid grid-cols-4 gap-0.5 bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-300/40 dark:border-slate-700/40">
                        <button
                            onClick={() => { playPop(); setActiveTab('board'); }}
                            className={`text-[10px] py-1.5 px-0.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1 whitespace-nowrap ${activeTab === 'board' ? `${theme.accentBg} text-white shadow-xs` : `${theme.textSecondary} hover:${theme.textPrimary}`}`}
                        >
                            📋 Board
                        </button>
                        <button
                            onClick={() => { playPop(); setActiveTab('dashboard'); }}
                            className={`text-[10px] py-1.5 px-0.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1 whitespace-nowrap ${activeTab === 'dashboard' ? `${theme.accentBg} text-white shadow-xs` : `${theme.textSecondary} hover:${theme.textPrimary}`}`}
                        >
                            ⏱️ Timer
                        </button>
                        <button
                            onClick={() => { playPop(); setActiveTab('analytics'); }}
                            className={`text-[10px] py-1.5 px-0.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1 whitespace-nowrap ${activeTab === 'analytics' ? `${theme.accentBg} text-white shadow-xs` : `${theme.textSecondary} hover:${theme.textPrimary}`}`}
                        >
                            📊 Stats
                        </button>
                        <button
                            onClick={() => { playPop(); setActiveTab('settings'); }}
                            className={`text-[10px] py-1.5 px-0.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1 whitespace-nowrap ${activeTab === 'settings' ? `${theme.accentBg} text-white shadow-xs` : `${theme.textSecondary} hover:${theme.textPrimary}`}`}
                        >
                            ⚙️ Settings
                        </button>
                    </div>

                    {/* Local Lists Section */}
                    <div>
                        <div className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${theme.textSecondary}`}>Local Lists</div>
                        <div className="space-y-1">
                            {localLists.map((list: any) => (
                                <label key={list._id} className={`flex items-center justify-between text-xs font-semibold p-2 rounded-xl hover:bg-white/40 dark:hover:bg-slate-800/40 cursor-pointer transition ${theme.textPrimary}`}>
                                    <div className="flex items-center gap-2 truncate">
                                        <input
                                            type="checkbox"
                                            checked={list.is_visible}
                                            onChange={(e) => toggleListVisibility?.({ id: list._id, is_visible: e.target.checked })}
                                            className="rounded border-slate-300 text-rose-500 focus:ring-0 cursor-pointer"
                                        />
                                        <span className="truncate">📋 {list.title}</span>
                                    </div>
                                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-800/60 text-slate-500 font-mono">
                                        {tasks?.filter((t: any) => t.list_id === list._id && t.status !== 'completed').length || 0}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Google Tasks Section */}
                    {accessToken && (
                        <div>
                            <div className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${theme.textSecondary}`}>Google Tasks</div>
                            <div className="space-y-1">
                                {googleLists.map((list: any) => (
                                    <label key={list._id} className={`flex items-center justify-between text-xs font-semibold p-2 rounded-xl hover:bg-white/40 dark:hover:bg-slate-800/40 cursor-pointer transition ${theme.textPrimary}`}>
                                        <div className="flex items-center gap-2 truncate">
                                            <input
                                                type="checkbox"
                                                checked={list.is_visible}
                                                onChange={(e) => toggleListVisibility?.({ id: list._id, is_visible: e.target.checked })}
                                                className="rounded border-slate-300 text-rose-500 focus:ring-0 cursor-pointer"
                                            />
                                            <span className="truncate">🔵 {list.title}</span>
                                        </div>
                                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-800/60 text-slate-500 font-mono">
                                            {tasks?.filter((t: any) => t.list_id === list._id && t.status !== 'completed').length || 0}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Footer: Add New List Input */}
                <div className="pt-4 border-t border-slate-200/40 space-y-2">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder={accessToken ? "+ New List..." : "+ New Local List..."}
                            value={newListTitle}
                            onChange={(e) => setNewListTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateGoogleList();
                            }}
                            className={`flex-1 text-xs bg-white/70 dark:bg-slate-900/70 border ${theme.cardBorder} rounded-xl px-3 py-2 ${theme.textPrimary} placeholder-slate-400 focus:outline-none focus:border-rose-400`}
                        />
                        <button
                            onClick={() => handleCreateGoogleList()}
                            disabled={!newListTitle.trim()}
                            className={`${theme.accentBg} disabled:bg-slate-300 text-white text-xs px-3 py-2 rounded-xl font-bold transition active:scale-90 shadow-xs`}
                        >
                            +
                        </button>
                    </div>
                </div>
            </aside>


            {/* ================= 3. EXPANDED INTERACTIVE TASK CARD MODAL ================= */}
            {expandedTask && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className={`${theme.cardBg} rounded-3xl p-6 shadow-2xl space-y-6 border ${theme.cardBorder} max-w-lg w-full max-h-[90vh] overflow-y-auto`}>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 px-3 py-1 rounded-full">
                                {expandedTask.gtask_id ? 'Google Task' : 'Local Task'}
                            </span>
                            <button
                                onClick={() => setExpandedTaskId(null)}
                                className="w-8 h-8 rounded-full bg-slate-200/60 active:bg-slate-300 text-slate-600 font-bold flex items-center justify-center text-sm transition"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Full Task Title Editing */}
                        <div className="space-y-1">
                            <label className={`text-[10px] font-bold uppercase tracking-wider block ${theme.textSecondary}`}>
                                Task Title
                            </label>
                            <input
                                type="text"
                                defaultValue={expandedTask.title}
                                onBlur={(e) => handleEditTask(expandedTask._id, e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleEditTask(expandedTask._id, e.currentTarget.value);
                                        e.currentTarget.blur();
                                    }
                                }}
                                className={`w-full text-lg font-bold ${theme.textPrimary} bg-white/70 dark:bg-slate-900/70 border ${theme.cardBorder} rounded-xl px-3 py-2 focus:outline-none focus:border-rose-400`}
                            />
                        </div>

                        <div className={`bg-white/60 dark:bg-slate-900/60 border ${theme.cardBorder} rounded-2xl p-4 space-y-4`}>
                            <div className="flex justify-between items-center">
                                <span className={`text-xs font-bold uppercase tracking-wider ${theme.textSecondary}`}>
                                    Task Estimation ({estimationMode === 'hours' ? 'Hours Mode' : 'Pomodoro Mode'})
                                </span>
                                <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 px-2.5 py-1 rounded-xl">
                                    {estimationMode === 'hours'
                                        ? `Target: ${Math.floor((expandedTask.target_minutes || 25) / 60)}h ${(expandedTask.target_minutes || 25) % 60}m`
                                        : `Target: ${Math.max(1, Math.round((expandedTask.target_minutes || 25) / globalDuration))} sessions`}
                                </span>
                            </div>

                           {estimationMode === 'hours' ? (
                                /* MODE A: HOURS & MINUTES INPUT CONTROLS */
                                <div className="space-y-3">
                                    {/* Hours Control */}
                                    <div className="flex items-center justify-between">
                                        <span className={`text-xs font-semibold ${theme.textPrimary}`}>Hours:</span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    playPop();
                                                    const current = expandedTask.target_minutes || 60;
                                                    const newMins = Math.max(15, current - 60);
                                                    updateEstimatedPomos({ taskId: expandedTask._id, targetMinutes: newMins });
                                                }}
                                                className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 text-slate-700 dark:text-slate-200 font-bold text-base shadow-xs active:scale-90"
                                            >-</button>
                                            <span className={`text-sm font-bold font-mono px-2 min-w-[50px] text-center ${theme.textPrimary}`}>
                                                {Math.floor((expandedTask.target_minutes || 0) / 60)} hrs
                                            </span>
                                            <button
                                                onClick={() => {
                                                    playPop();
                                                    const current = expandedTask.target_minutes || 0;
                                                    updateEstimatedPomos({ taskId: expandedTask._id, targetMinutes: current + 60 });
                                                }}
                                                className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 text-slate-700 dark:text-slate-200 font-bold text-base shadow-xs active:scale-90"
                                            >+</button>
                                        </div>
                                    </div>

                                    {/* Minutes Control */}
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                                        <span className={`text-xs font-semibold ${theme.textPrimary}`}>Minutes:</span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    playPop();
                                                    const current = expandedTask.target_minutes || 0;
                                                    const newMins = Math.max(15, current - 15);
                                                    updateEstimatedPomos({ taskId: expandedTask._id, targetMinutes: newMins });
                                                }}
                                                className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 text-slate-700 dark:text-slate-200 font-bold text-base shadow-xs active:scale-90"
                                            >-</button>
                                            <span className={`text-sm font-bold font-mono px-2 min-w-[50px] text-center ${theme.textPrimary}`}>
                                                {(expandedTask.target_minutes || 0) % 60} mins
                                            </span>
                                            <button
                                                onClick={() => {
                                                    playPop();
                                                    const current = expandedTask.target_minutes || 0;
                                                    updateEstimatedPomos({ taskId: expandedTask._id, targetMinutes: current + 15 });
                                                }}
                                                className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 text-slate-700 dark:text-slate-200 font-bold text-base shadow-xs active:scale-90"
                                            >+</button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* MODE B: POMODORO SPRINT BLOCK + SESSIONS STEPPER */
                                <div className="space-y-4">
                                    {/* Target Sessions Stepper */}
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                                       <span className={`text-xs font-semibold ${theme.textPrimary}`}>Target Sessions:</span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    playPop();
                                                    const blockMins = expandedTask.preferred_pomo_duration || globalDuration || 25;
                                                    const currentPomos = Math.max(1, Math.round((expandedTask.target_minutes || 25) / blockMins));
                                                    const newPomos = Math.max(1, currentPomos - 1);
                                                    updateEstimatedPomos({
                                                        taskId: expandedTask._id,
                                                        targetMinutes: newPomos * blockMins,
                                                        preferredPomoDuration: blockMins,
                                                    });
                                                }}
                                                className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 text-slate-700 dark:text-slate-200 font-bold text-base shadow-xs active:scale-90"
                                            >-</button>
                                            <span className={`text-sm font-bold font-mono px-2 ${theme.textPrimary}`}>
                                                {Math.max(1, Math.round((expandedTask.target_minutes || 25) / globalDuration))}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    playPop();
                                                    const currentPomos = Math.max(1, Math.round((expandedTask.target_minutes || 25) / globalDuration));
                                                    const newPomos = currentPomos + 1;
                                                    updateEstimatedPomos({
                                                        taskId: expandedTask._id,
                                                        targetMinutes: newPomos * globalDuration,
                                                    });
                                                }}
                                                className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 text-slate-700 dark:text-slate-200 font-bold text-base shadow-xs active:scale-90"
                                            >+</button>
                                        </div>
                                    </div>

                                    {/* Equation Calculation Display */}
                                    {(() => {
                                        const count = Math.max(1, Math.round((expandedTask.target_minutes || 25) / globalDuration));
                                        const totalMins = count * globalDuration;
                                        const totalHrs = (totalMins / 60).toFixed(1);
                                        return (
                                            <div className="text-xs font-mono text-center text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/30 py-1.5 rounded-xl border border-rose-200/50 dark:border-rose-900/50">
                                                {count} sessions × {globalDuration}m = {totalHrs} hrs ({totalMins} mins)
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2.5 pt-1">
                            <button
                                onClick={() => {
                                    handleQuickStartTimer(expandedTask._id);
                                    setExpandedTaskId(null);
                                }}
                                className={`w-full py-3.5 ${theme.accentBg} text-white rounded-2xl font-bold text-sm shadow-lg active:scale-[0.97] transition flex items-center justify-center gap-2`}
                            >
                                <span>▶</span> Start {expandedTask.preferred_pomo_duration || globalDuration || 25}m Pomodoro
                            </button>
                            <button
                                onClick={(e) => {
                                    handleCompleteTask(expandedTask, e);
                                    setExpandedTaskId(null);
                                }}
                                className="w-full py-3 bg-emerald-500/10 active:bg-emerald-500/20 text-emerald-700 border border-emerald-300/50 rounded-2xl font-bold text-sm transition"
                            >
                                ✓ Mark Task Completed
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= 4. MAIN DESKTOP CONTENT AREA ================= */}
            <main className={`flex-1 p-6 overflow-y-auto flex flex-col gap-6 pb-20 md:pb-6 z-10 ${activeTab === 'menu' ? 'hidden md:flex' : 'flex'}`}>
                {activeTab === 'dashboard' ? (
                    /* DEDICATED TIMER FOCUS VIEW */
                    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
                        <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-3xl p-6 flex justify-between items-center shadow-lg backdrop-blur-md`}>
                            <div>
                                <h2 className={`text-xl font-bold ${theme.textPrimary}`}>Focus Work Dashboard</h2>
                                <p className={`text-xs mt-0.5 ${theme.textSecondary}`}>Daily Goal: <span className={`font-semibold ${theme.textPrimary}`}>{DAILY_GOAL} Pomodoros</span></p>
                            </div>
                            <div className="bg-emerald-500/15 border border-emerald-300/50 px-4 py-2 rounded-2xl text-right">
                                <span className="text-xs text-emerald-700 font-medium uppercase tracking-wider block">Today's Sessions</span>
                                <span className="text-2xl font-bold text-emerald-700 font-mono">{todaySessions.length} / {DAILY_GOAL}</span>
                            </div>
                        </div>

                        <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-3xl p-8 flex flex-col items-center justify-center gap-6 shadow-xl backdrop-blur-md relative`}>
                            <span className={`text-xs font-semibold uppercase tracking-wider px-3.5 py-1 rounded-full border ${theme.cardBorder} ${theme.textPrimary}`}>
                                {activeTask ? activeTask.title : '🎯 Unassigned Focus Session'}
                            </span>

                            {/* Circular Depleting Timer */}
                            <div className="relative w-64 h-64 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="45" className="text-slate-300/40 dark:text-slate-700/40 stroke-current" strokeWidth="6" fill="transparent" />
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="45"
                                        className={`${theme.accentText} stroke-current transition-all duration-1000 ease-linear`}
                                        strokeWidth="6"
                                        strokeDasharray="283"
                                        strokeDashoffset={strokeDashoffset}
                                        strokeLinecap="round"
                                        fill="transparent"
                                    />
                                </svg>
                                <span className={`absolute text-5xl font-mono font-bold tracking-wider ${theme.textPrimary}`}>
                                    {formatTime(seconds)}
                                </span>
                            </div>

                            {/* Controls */}
                            <div className="flex gap-3">
                                {!isRunning ? (
                                    <button onClick={handleStart} className={`${theme.accentBg} text-white px-6 py-2.5 text-sm rounded-2xl font-bold shadow-md active:scale-95 transition`}>Start Focus</button>
                                ) : (
                                    <button onClick={handlePause} className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 text-sm rounded-2xl font-bold shadow-md active:scale-95 transition">Pause</button>
                                )}
                                <button onClick={handleLogSession} className="bg-slate-200/80 hover:bg-slate-200 text-slate-800 px-5 py-2.5 text-sm rounded-2xl font-semibold active:scale-95 transition">Log Session</button>
                            </div>

                            <div className="flex gap-6 border-t border-slate-200/40 pt-4 mt-2">
                                <button onClick={toggleFullscreen} className={`text-xs ${theme.textSecondary} hover:${theme.textPrimary} transition`}>
                                    {isFullscreen ? 'Exit Fullscreen' : '⛶ Fullscreen Focus'}
                                </button>
                                <button onClick={toggleFloatingWidget} className={`text-xs ${theme.textSecondary} hover:${theme.textPrimary} transition`}>
                                    🗗 Floating Desktop Widget
                                </button>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'analytics' ? ( 
                    <div className={`${theme.cardBg} p-6 rounded-3xl border ${theme.cardBorder} shadow-lg backdrop-blur-md`}>
                        <AnalyticsView sessions={sessions} tasks={tasks} DAILY_GOAL={DAILY_GOAL} />
                    </div>
                    ) : activeTab === 'settings' ? (
                    <SettingsView {...props} theme={theme} />
                ) : ( 
                    /* KANBAN BOARD VIEW */
                    <>
                        {/* Top Mini Timer Bar */}
                        <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-4 flex justify-between items-center shadow-md backdrop-blur-md`}>
                            <div className="flex items-center gap-4">
                                <span className={`text-3xl font-mono font-bold tracking-wider ${theme.textPrimary}`}>{formatTime(seconds)}</span>
                                {activeTask ? (
                                    <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-300/40 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="truncate max-w-xs">{activeTask.title}</span>
                                    </div>
                                ) : (
                                    <span className={`text-xs font-medium italic px-3 py-1 rounded-full border ${theme.cardBorder} ${theme.textSecondary}`}>
                                        Select a task to focus
                                    </span>
                                )}                        
                            </div>
                            <div className="flex gap-2">
                                {!isRunning ? (
                                    <button onClick={handleStart} className={`${theme.accentBg} text-white px-4 py-2 text-xs rounded-xl font-bold shadow-xs active:scale-95 transition`}>Start</button>
                                ) : (
                                    <button onClick={handlePause} className="bg-amber-500 text-white px-4 py-2 text-xs rounded-xl font-bold shadow-xs active:scale-95 transition">Pause</button>
                                )}
                                <button onClick={handleLogSession} className="bg-slate-200/80 text-slate-800 px-4 py-2 text-xs rounded-xl font-bold active:scale-95 transition">Done</button>
                            </div>
                        </div>

                        {/* Task List Columns Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            {visibleLists.map((list: any) => {
                                const listTasks = tasks?.filter((t: any) => t.list_id === list._id && t.status !== "completed") || [];

                                return (
                                    <div key={list._id} className={`${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-4 flex flex-col min-h-[380px] shadow-lg backdrop-blur-md`}>
                                        <div className="flex justify-between items-center mb-3">
                                            <h3 className={`font-bold text-sm ${theme.textPrimary}`}>{list.title}</h3>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${theme.cardBorder} ${theme.textSecondary}`}>
                                                {list.type}
                                            </span>
                                        </div>

                                        {/* Task Creation Input */}
                                        <div className="flex gap-2 mb-3">
                                            <input
                                                type="text"
                                                placeholder="+ Add task..."
                                                value={listTaskInputs[list._id] || ''}
                                                onChange={(e) =>
                                                    setListTaskInputs((prev: any) => ({ ...prev, [list._id]: e.target.value }))
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleAddTaskToList(list);
                                                }}
                                                className={`w-full text-xs bg-white/70 dark:bg-slate-900/70 border ${theme.cardBorder} rounded-xl px-3 py-2 ${theme.textPrimary} placeholder-slate-400 focus:outline-none focus:border-rose-400`}
                                            />
                                            <button
                                                onClick={() => handleAddTaskToList(list)}
                                                disabled={!listTaskInputs[list._id]?.trim()}
                                                className={`${theme.accentBg} disabled:bg-slate-300 text-white text-xs px-3 py-2 rounded-xl font-bold transition active:scale-90`}
                                            >
                                                Add
                                            </button>
                                        </div>

                                        {/* Column Task Cards */}
                                        <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
                                            {listTasks.map((task: any) => {
                                                const isSelected = selectedTaskId === task._id;
                                                return (
                                                    <div
                                                        key={task._id}
                                                        onClick={() => setExpandedTaskId(task._id)}
                                                        className={`p-3 rounded-xl border flex items-center justify-between shadow-2xs active:scale-[0.98] transition cursor-pointer ${
                                                            isSelected ? 'border-rose-500 ring-2 ring-rose-500/20 bg-white/90 dark:bg-slate-800' : `${theme.cardBorder} bg-white/50 dark:bg-slate-900/50 hover:bg-white/80`
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={task.completed}
                                                                onChange={(e) => {
                                                                    e.stopPropagation();
                                                                    handleCompleteTask(task, e);
                                                                }}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="w-4 h-4 rounded border-slate-300 text-rose-500 focus:ring-0 cursor-pointer"
                                                            />
                                                            <span className={`text-xs font-semibold truncate ${isSelected ? 'font-bold' : ''} ${theme.textPrimary}`}>
                                                                {task.title}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            <span className={`text-[10px] font-bold bg-white/60 dark:bg-slate-800 px-2 py-0.5 rounded-lg border ${theme.cardBorder} ${theme.textPrimary}`}>
                                                                🍅 {task.completed_pomos || 0}/{task.estimated_pomos || 1}
                                                            </span>
                                                            <button
                                                                onClick={(e) => handleQuickStartTimer(task._id, e)}
                                                                className={`w-7 h-7 rounded-lg ${theme.accentBg} text-white font-bold flex items-center justify-center text-[10px] active:scale-90 transition`}
                                                                title="Start Focus Sprint"
                                                            >
                                                                ▶
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}