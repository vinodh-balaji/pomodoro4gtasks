"use client";

import React from 'react';
import AnalyticsView from '../AnalyticsView';

export default function DesktopView(props: any) {
    const {
        lists,
        tasks,
        seconds,
        isRunning,
        activeTab,
        selectedTaskId,
        newListTitle,
        listTaskInputs,
        isFullscreen,
        DAILY_GOAL,
        todaySessions,
        sessions,
        accessToken,
        handleLogout,
        loginNative,
        setActiveTab,
        setNewListTitle,
        setListTaskInputs,
        handleSelectTask,
        handleStart,
        handlePause,
        handleLogSession,
        handleSyncGoogleTasks,
        handleAddTaskToList,
        handleCompleteTask,
        toggleListVisibility,
        createLocalList,
        updateEstimatedPomos,
        toggleFullscreen,
        toggleFloatingWidget,
        formatTime,
    } = props;

    const localLists = lists.filter((l: any) => l.type === 'local');
    const googleLists = lists.filter((l: any) => l.type === 'google');
    const visibleLists = lists.filter((l: any) => l.is_visible);
    const totalDuration = 1500;
    const strokeDashoffset = 283 - (seconds / totalDuration) * 283;

    return (
        <div className="flex flex-col md:flex-row h-screen bg-[#141414] text-gray-200 overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
            {/* Mobile Top Header */}
            <header className="md:hidden h-14 px-4 flex items-center justify-between border-b border-zinc-800 shrink-0 bg-[#1e1e1e]">
                <span className="font-bold text-base text-blue-400">✓ Tasks Pomodoro</span>
                <button
                    onClick={handleSyncGoogleTasks}
                    className="bg-green-700 hover:bg-green-600 text-xs text-white px-3 py-1.5 rounded"
                >
                    Sync
                </button>
            </header>

            {/* Sidebar Menu */}
            <aside className={`w-full md:w-64 bg-[#1e1e1e] md:border-r border-zinc-800 p-4 flex-col gap-6 shrink-0 select-none overflow-y-auto ${activeTab === 'menu' ? 'flex flex-1' : 'hidden md:flex'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <img src="/icon.png" alt="PomoSync" className="w-7 h-7 rounded-lg object-cover" />
                        <span className="font-bold text-lg text-white tracking-tight">PomoSync</span>
                    </div>
                    <button
                        onClick={handleSyncGoogleTasks}
                        className="bg-emerald-700 hover:bg-emerald-600 text-xs text-white px-2.5 py-1 rounded-lg font-bold"
                    >
                        Sync
                    </button>
                </div>

                {/* View Switcher Tabs */}
                <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                    <button
                        onClick={() => setActiveTab('board')}
                        className={`flex-1 text-xs py-1 rounded font-medium transition ${activeTab === 'board' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Board 
                    </button>
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`flex-1 text-xs py-1 rounded font-medium transition ${activeTab === 'dashboard' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`flex-1 text-xs py-1 rounded font-medium transition ${activeTab === 'analytics' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Analytics
                    </button>
                </div>  

                {/* Local Lists Section */}
                <div>
                    <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Local Lists</div>
                    <div className="flex flex-col gap-1">
                        {localLists.map((list: any) => (
                            <label key={list._id} className="flex items-center gap-2 text-sm p-1.5 hover:bg-zinc-800 rounded cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={list.is_visible}
                                    onChange={(e) => toggleListVisibility({ id: list._id, is_visible: e.target.checked })}
                                    className="rounded border-zinc-700 bg-zinc-900 text-blue-600"
                                />
                                <span>{list.title}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Google Lists Section */}
                <div>
                    <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Google Tasks Lists</div>
                    <div className="flex flex-col gap-1">
                        {googleLists.map((list: any) => (
                            <label key={list._id} className="flex items-center gap-2 text-sm p-1.5 hover:bg-zinc-800 rounded cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={list.is_visible}
                                    onChange={(e) => toggleListVisibility({ id: list._id, is_visible: e.target.checked })}
                                    className="rounded border-zinc-700 bg-zinc-900 text-blue-600"
                                />
                                <span>{list.title}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Google Auth Status & Account Card */}
                <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-zinc-400 uppercase tracking-wider text-[10px]">Google Auth</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${accessToken ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}`}>
                            {accessToken ? 'Connected' : 'Logged Out'}
                        </span>
                    </div>
                    {accessToken ? (
                        <button
                            onClick={handleLogout}
                            className="w-full py-1.5 px-2.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 font-semibold text-xs transition"
                        >
                            🚪 Logout Account
                        </button>
                    ) : (
                        <button
                            onClick={loginNative}
                            className="w-full py-1.5 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-xs"
                        >
                            🔑 Sign in with Google
                        </button>
                    )}
                </div>


                {/* Quick Local List Creator */}
                <div className="mt-auto flex gap-2">
                    <input
                        type="text"
                        placeholder="New list..."
                        value={newListTitle}
                        onChange={(e) => setNewListTitle(e.target.value)}
                        className="w-full text-xs bg-zinc-900 border border-zinc-700 rounded p-1.5 text-white placeholder-zinc-500"
                    />
                    <button
                        onClick={() => {
                            if (newListTitle) {
                                createLocalList({ title: newListTitle });
                                setNewListTitle('');
                            }
                        }}
                        className="bg-blue-600 text-white text-xs px-2.5 py-1.5 rounded"
                    >
                        +
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className={`flex-1 p-4 md:p-6 overflow-y-auto flex-col gap-6 pb-20 md:pb-6 ${activeTab === 'menu' ? 'hidden md:flex' : 'flex'}`}>
                {activeTab === 'dashboard' ? (
                    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
                        <div className="bg-[#1e1e1e] border border-zinc-800 rounded-xl p-5 flex justify-between items-center shadow-lg">
                            <div>
                                <h2 className="text-lg font-bold text-white">Daily Work Dashboard</h2>
                                <p className="text-xs text-zinc-400 mt-0.5">Target: <span className="text-zinc-200 font-semibold">{DAILY_GOAL} Pomodoros</span></p>
                            </div>
                            <div className="bg-emerald-950/40 border border-emerald-800/50 px-4 py-2 rounded-xl text-right">
                                <span className="text-xs text-emerald-400 font-medium uppercase tracking-wider block">Achieved Goal</span>
                                <span className="text-xl font-bold text-emerald-300 font-mono">{todaySessions.length} / {DAILY_GOAL} <span className="text-xs font-normal">Sessions</span></span>
                            </div>
                        </div>

                        <div className="bg-[#1e1e1e] border border-zinc-800 rounded-xl p-8 flex flex-col items-center justify-center gap-6 shadow-xl relative overflow-hidden">
                            <span className="text-xs font-medium text-emerald-400 uppercase tracking-widest bg-emerald-950/60 border border-emerald-800/40 px-3 py-1 rounded-full">
                                {selectedTaskId ? tasks?.find((t: any) => t._id === selectedTaskId)?.title : 'No task selected'}
                            </span>

                            <div className="relative w-64 h-64 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="45" className="text-zinc-800 stroke-current" strokeWidth="6" fill="transparent" />
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="45"
                                        className="text-emerald-500 stroke-current transition-all duration-1000 ease-linear"
                                        strokeWidth="6"
                                        strokeDasharray="283"
                                        strokeDashoffset={strokeDashoffset}
                                        strokeLinecap="round"
                                        fill="transparent"
                                    />
                                </svg>
                                <span className="absolute text-5xl font-mono font-bold text-white tracking-wider">
                                    {formatTime(seconds)}
                                </span>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={handleStart} disabled={isRunning} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 text-sm rounded-lg font-medium disabled:bg-zinc-800 transition">Start</button>
                                <button onClick={handlePause} disabled={!isRunning} className="bg-zinc-700 hover:bg-zinc-600 text-white px-5 py-2 text-sm rounded-lg font-medium disabled:bg-zinc-800 transition">Pause</button>
                                <button onClick={handleLogSession} disabled={!selectedTaskId} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 text-sm rounded-lg font-medium disabled:bg-zinc-800 transition">Log Session</button>
                            </div>

                            <div className="flex gap-4 border-t border-zinc-800/80 pt-4 mt-2">
                                <button onClick={toggleFullscreen} className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition">
                                    <span>{isFullscreen ? 'Exit Fullscreen' : '⛶ Fullscreen Focus'}</span>
                                </button>
                                <button onClick={toggleFloatingWidget} className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition">
                                    <span>🗗 Floating Desktop Widget</span>
                                </button>
                            </div>
                        </div>

                        <div className="bg-[#1e1e1e] border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
                            <h3 className="text-sm font-semibold text-zinc-300 border-b border-zinc-800 pb-2">Today's Completed Log</h3>
                            {todaySessions.length === 0 ? (
                                <p className="text-xs text-zinc-500 italic py-2">No completed sessions logged today.</p>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {todaySessions.map((session: any, index: number) => {
                                        const endTime = new Date(session.completed_at);
                                        const startTime = new Date(session.completed_at - (session.duration_minutes || 25) * 60 * 1000);
                                        const formatTimeStr = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                        return (
                                            <div key={session._id} className="flex justify-between items-center bg-zinc-900/80 border border-zinc-800/80 px-4 py-2.5 rounded-lg text-xs">
                                                <span className="font-mono text-zinc-300">
                                                    <strong className="text-emerald-400 font-semibold">Session {index + 1}:</strong> From {formatTimeStr(startTime)} to {formatTimeStr(endTime)} - did <span className="text-white font-medium">"{session.task_title}"</span>
                                                </span>
                                                <span className="text-sm">{"🍅".repeat(session.session_number ?? 1)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                ) : activeTab === 'analytics' ? ( 
                    <AnalyticsView sessions={sessions} tasks={tasks} DAILY_GOAL={DAILY_GOAL} />
                ) : ( 
                    <>
                        <div className={`border rounded-xl p-4 flex justify-between items-center transition-all duration-300 ${
                            selectedTaskId 
                                ? 'bg-gradient-to-r from-emerald-950/40 via-[#1e1e1e] to-[#1e1e1e] border-emerald-500/30 shadow-lg shadow-emerald-950/20' 
                                : 'bg-[#1e1e1e] border-zinc-800'
                        }`}>
                            <div className="flex items-center gap-4">
                                <span className="text-3xl font-mono font-bold text-white tracking-wider">{formatTime(seconds)}</span>
                                {selectedTaskId ? (
                                    <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 px-3 py-1 rounded-full text-xs font-medium shadow-inner">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                        <span className="truncate max-w-xs">{tasks?.find((t: any) => t._id === selectedTaskId)?.title}</span>
                                    </div>
                                ) : (
                                    <span className="text-xs font-medium text-zinc-500 italic bg-zinc-900/50 px-3 py-1 rounded-full border border-zinc-800">
                                        Select a task to begin
                                    </span>
                                )}                        
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleStart} disabled={isRunning} className="bg-blue-600 text-white px-3 py-1.5 text-sm rounded disabled:bg-zinc-700">Start</button>
                                <button onClick={handlePause} disabled={!isRunning} className="bg-zinc-700 text-white px-3 py-1.5 text-sm rounded disabled:bg-zinc-800">Pause</button>
                                <button onClick={handleLogSession} disabled={!selectedTaskId} className="bg-green-600 text-white px-3 py-1.5 text-sm rounded disabled:bg-zinc-700">Log Session</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            {visibleLists.map((list: any) => {
                                const listTasks = tasks?.filter((t: any) => t.list_id === list._id && t.status !== "completed") || [];

                                return (
                                    <div key={list._id} className="bg-[#1e1e1e] border border-zinc-800 rounded-xl p-4 flex flex-col min-h-[350px] shadow-lg resize-x overflow-auto max-w-full">
                                        <div className="flex justify-between items-center mb-3">
                                            <h3 className="font-semibold text-white">{list.title}</h3>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase">{list.type}</span>
                                        </div>
                                        <div className="flex gap-1.5 mb-3">
                                            <input
                                                type="text"
                                                placeholder="+ Add a task"
                                                value={listTaskInputs[list._id] || ''}
                                                onChange={(e) =>
                                                    setListTaskInputs((prev: any) => ({ ...prev, [list._id]: e.target.value }))
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleAddTaskToList(list);
                                                }}
                                                className="w-full text-xs bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                                            />
                                            <button
                                                onClick={() => handleAddTaskToList(list)}
                                                disabled={!listTaskInputs[list._id]?.trim()}
                                                className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white text-xs px-2.5 py-1.5 rounded transition"
                                            >
                                                Add
                                            </button>
                                        </div>

                                        <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
                                            {listTasks.map((task: any) => (
                                                <div
                                                    key={task._id}
                                                    onClick={() => handleSelectTask(task._id)}
                                                    className={`flex justify-between items-center p-2.5 rounded-lg border transition cursor-pointer select-none ${
                                                        selectedTaskId === task._id
                                                            ? 'border-emerald-500 bg-emerald-950/20 shadow-emerald-900/30 shadow-md'
                                                            : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <input
                                                            type="checkbox"
                                                            onChange={(e) => {
                                                                e.stopPropagation();
                                                                handleCompleteTask(task, e);
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-0 cursor-pointer"
                                                        />
                                                        <span className="text-sm font-medium text-zinc-200">{task.title}</span>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="flex items-center gap-1 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700/50"
                                                        >
                                                            <span className="text-xs text-zinc-400 font-mono">🍅 {task.completed_pomos}/</span>
                                                            <button
                                                                onClick={() => updateEstimatedPomos({ taskId: task._id, estimatedPomos: Math.max(1, (task.estimated_pomos ?? 1) - 1) })}
                                                                className="text-zinc-400 hover:text-white text-xs px-0.5 font-bold"
                                                            >-</button>
                                                            <span className="text-xs text-zinc-200 font-mono font-semibold">{task.estimated_pomos}</span>
                                                            <button
                                                                onClick={() => updateEstimatedPomos({ taskId: task._id, estimatedPomos: (task.estimated_pomos ?? 1) + 1 })}
                                                                className="text-zinc-400 hover:text-white text-xs px-0.5 font-bold"
                                                            >+</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </main>

            {/* Mobile Bottom Navigation Bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#1e1e1e]/95 backdrop-blur-md border-t border-zinc-800 flex items-center justify-around pb-[env(safe-area-inset-bottom)] z-50">
                <button
                    onClick={() => setActiveTab('board')}
                    className={`flex flex-col items-center gap-1 text-xs ${activeTab === 'board' ? 'text-blue-400 font-bold' : 'text-zinc-400'}`}
                >
                    <span className="text-base">📋</span>
                    Board
                </button>
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex flex-col items-center gap-1 text-xs ${activeTab === 'dashboard' ? 'text-emerald-400 font-bold' : 'text-zinc-400'}`}
                >
                    <span className="text-base">⏱️</span>
                    Timer
                </button>
                <button
                    onClick={() => setActiveTab('analytics')}
                    className={`flex flex-col items-center gap-1 text-xs ${activeTab === 'analytics' ? 'text-purple-400 font-bold' : 'text-zinc-400'}`}
                >
                    <span className="text-base">📊</span>
                    Analytics
                </button>
                <button
                    onClick={() => setActiveTab('menu')}
                    className={`flex flex-col items-center gap-1 text-xs ${activeTab === 'menu' ? 'text-blue-400 font-bold' : 'text-zinc-400'}`}
                >
                    <span className="text-base">⚙️</span>
                    Lists
                </button>
            </nav>
        </div>
    );
}