"use client";

import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import Link from 'next/link';
import { Capacitor } from '@capacitor/core';
import { usePomodoro } from '../hooks/usePomodoro';
import MobileView from '../components/mobile/MobileView';
import DesktopView from '../components/desktop/DesktopView';

const HomePage: NextPage = () => {
    const pomodoroState = usePomodoro();
    const isNativeMobile = Capacitor.isNativePlatform();
    const [showApp, setShowApp] = useState(false);

    // Automatically launch App Mode on native mobile or if ?app=true is in URL
    useEffect(() => {
        if (isNativeMobile || window.location.search.includes('app=true')) {
            setShowApp(true);
        }
    }, [isNativeMobile]);

    // Render interactive application when Launched
    if (showApp || isNativeMobile) {
        return (
            <div className="relative">
                {!isNativeMobile && (
                    <div className="bg-slate-900 text-slate-400 text-xs px-4 py-1.5 flex justify-between items-center border-b border-slate-800">
                        <span className="flex items-center gap-1.5 font-medium">
                            <span>🍅</span> PomoSync Active Workspace
                        </span>
                        <button
                            onClick={() => setShowApp(false)}
                            className="text-slate-300 hover:text-white underline font-semibold transition"
                        >
                            ← Back to App Info
                        </button>
                    </div>
                )}

                {/* Mobile Viewport */}
                <div className={isNativeMobile ? "block" : "block md:hidden"}>
                    <MobileView {...pomodoroState} />
                </div>

                {/* Desktop Viewport */}
                <div className={isNativeMobile ? "hidden" : "hidden md:block"}>
                    <DesktopView {...pomodoroState} />
                </div>
            </div>
        );
    }

    // Web Landing Page
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
            {/* Top Navigation */}
            <header className="border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/icon.png" alt="PomoSync" className="w-8 h-8 rounded-xl object-cover border border-white/10 shadow-sm" />
                        <span className="font-extrabold text-xl tracking-tight text-white">PomoSync</span>
                    </div>

                    <nav className="flex items-center gap-6 text-sm text-slate-400 font-medium">
                        <a href="#features" className="hover:text-slate-200 transition hidden sm:inline">Features</a>
                        <a href="#screenshots" className="hover:text-slate-200 transition hidden sm:inline">App Screenshots</a>
                        <Link href="/privacy" className="hover:text-slate-200 transition">Privacy</Link>
                        <Link href="/terms" className="hover:text-slate-200 transition">Terms</Link>
                        
                        <button
                            onClick={() => setShowApp(true)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl transition shadow-lg shadow-indigo-600/25 active:scale-95 flex items-center gap-1.5"
                        >
                            <span>Launch App</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                            </svg>
                        </button>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <section className="py-20 px-6 text-center max-w-4xl mx-auto flex flex-col items-center">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6">
                    <span>🍅</span> Pomodoro Focus Timer + Direct Google Tasks Sync
                </div>

                <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight mb-6 leading-tight">
                    Supercharge Focus with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600">Google Tasks</span>
                </h1>

                <p className="text-lg text-slate-400 mb-8 max-w-2xl leading-relaxed">
                    PomoSync seamlessly pairs structured Pomodoro focus sessions with your Google Tasks. Import task lists, adjust target Pomodoro estimates, and auto-complete tasks as you finish timers.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    <button
                        onClick={() => setShowApp(true)}
                        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3.5 rounded-xl transition shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-95"
                    >
                        <span>Start Focus Session</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                        </svg>
                    </button>
                    <a
                        href="#screenshots"
                        className="w-full sm:w-auto bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold px-8 py-3.5 rounded-xl transition"
                    >
                        View App Screenshots
                    </a>
                </div>
            </section>

            {/* Phone Frames Screenshots Showcase */}
            <section id="screenshots" className="py-12 px-6 max-w-6xl mx-auto w-full">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-extrabold text-white mb-3">Designed for Effortless Workflow</h2>
                    <p className="text-slate-400 text-sm max-w-lg mx-auto">
                        Take a look at PomoSync in action across task list management, Pomodoro estimation, and focus timers.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Frame 1: Google Tasks Drawer */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-between shadow-xl">
                        <div className="w-full max-w-[260px] rounded-[2.2rem] border-[6px] border-slate-800 bg-slate-950 overflow-hidden shadow-2xl mb-6">
                            <img
                                src="/screenshots/drawer.png"
                                alt="Google Tasks Drawer"
                                className="w-full h-auto block"
                            />
                        </div>
                        <div className="text-left w-full">
                            <h3 className="text-base font-bold text-white mb-1">Direct Google Tasks Sync</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Connect your Google account to fetch all your task lists directly without manual entry[cite: 15].
                            </p>
                        </div>
                    </div>

                    {/* Frame 2: Interactive Task List */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-between shadow-xl">
                        <div className="w-full max-w-[260px] rounded-[2.2rem] border-[6px] border-slate-800 bg-slate-950 overflow-hidden shadow-2xl mb-6">
                            <img
                                src="/screenshots/tasks.png"
                                alt="Interactive Task List View"
                                className="w-full h-auto block"
                            />
                        </div>
                        <div className="text-left w-full">
                            <h3 className="text-base font-bold text-white mb-1">Pomodoro Task Estimation</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Track completed session counts per task (`🍅 2/1`) and launch timers with a single tap[cite: 16].
                            </p>
                        </div>
                    </div>

                    {/* Frame 3: 25-Min Timer */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-between shadow-xl">
                        <div className="w-full max-w-[260px] rounded-[2.2rem] border-[6px] border-slate-800 bg-slate-950 overflow-hidden shadow-2xl mb-6">
                            <img
                                src="/screenshots/timer.png"
                                alt="Focus Timer View"
                                className="w-full h-auto block"
                            />
                        </div>
                        <div className="text-left w-full">
                            <h3 className="text-base font-bold text-white mb-1">Focus Timer & Goal Tracker</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Run clean 25-minute Pomodoro sprints and hit your daily completion targets effortlessly[cite: 17, 18].
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-16 px-6 bg-slate-900/40 border-y border-slate-800">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl font-bold text-white mb-2">Designed for Daily Execution</h2>
                        <p className="text-slate-400 text-sm">Everything you need to stop procrastinating and manage your Google Tasks.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 text-left">
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                            <div className="text-2xl mb-3">🔄</div>
                            <h3 className="text-base font-bold text-white mb-2">Google Tasks Integration</h3>
                            <p className="text-slate-400 text-xs leading-relaxed">
                                Fetch your task lists directly into focus sessions and mark items complete automatically upon finishing timers[cite: 15, 16].
                            </p>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                            <div className="text-2xl mb-3">⏱️</div>
                            <h3 className="text-base font-bold text-white mb-2">Target Pomodoro Badges</h3>
                            <p className="text-slate-400 text-xs leading-relaxed">
                                Assign target session counts (`🍅 1/3`) to tasks and watch your progress update dynamically as you work[cite: 16].
                            </p>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                            <div className="text-2xl mb-3">☁️</div>
                            <h3 className="text-base font-bold text-white mb-2">Google Drive AppData Backup</h3>
                            <p className="text-slate-400 text-xs leading-relaxed">
                                Your timer history and task estimates sync privately across all devices via your isolated Google Drive AppData folder.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call to Action Footer */}
            <section className="py-16 px-6 bg-gradient-to-b from-slate-900 to-slate-950 text-center">
                <div className="max-w-2xl mx-auto space-y-6">
                    <h2 className="text-3xl font-black text-white">Ready to start your focus sprint?</h2>
                    <p className="text-slate-400 text-sm">Launch PomoSync directly in your browser or continue on your native mobile app[cite: 19].</p>
                    <button
                        onClick={() => setShowApp(true)}
                        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3.5 rounded-xl transition shadow-xl shadow-indigo-600/30 active:scale-95"
                    >
                        <span>Launch PomoSync</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                        </svg>
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-800/80 py-8 px-6 text-slate-500 text-xs">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <span>🍅</span>
                        <span className="font-semibold text-slate-300">PomoSync</span>
                        <span>— Focus Timer & Task Sync</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <Link href="/privacy" className="hover:text-slate-300 transition">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-slate-300 transition">Terms of Service</Link>
                        <a href="mailto:vinodh.balaji@gmail.com" className="hover:text-slate-300 transition">Support</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;