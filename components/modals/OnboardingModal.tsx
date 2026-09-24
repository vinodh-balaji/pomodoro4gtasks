"use client";

import React, { useState } from 'react';
import { THEMES, ThemeConfig } from '../../lib/themes';

interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentThemeId: string;
    setTheme: (themeId: string) => void;
    loginNative?: () => Promise<string | null>;
}

export default function OnboardingModal({
    isOpen,
    onClose,
    currentThemeId,
    setTheme,
    loginNative,
}: OnboardingModalProps) {
    const [step, setStep] = useState(0);

    if (!isOpen) return null;

    const currentTheme: ThemeConfig = THEMES[currentThemeId] || THEMES.light;

    const totalSteps = 4;

    const handleNext = () => {
        if (step < totalSteps - 1) {
            setStep((prev) => prev + 1);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (step > 0) {
            setStep((prev) => prev - 1);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-lg w-full flex flex-col justify-between min-h-[520px] transition-all duration-300 relative overflow-hidden">
                
                {/* Step Indicators */}
                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-4 mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Step {step + 1} of {totalSteps}
                    </span>
                    <div className="flex gap-1.5">
                        {Array.from({ length: totalSteps }).map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                    idx === step ? 'w-6 bg-rose-500' : 'w-2 bg-slate-300 dark:bg-slate-700'
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Slide 1: Welcome Hero */}
                {step === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-4 animate-fadeIn">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-500 to-amber-400 p-0.5 shadow-xl flex items-center justify-center">
                            <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center text-4xl">
                                🍅
                            </div>
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            Welcome to Tasks 'n Timers
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xs leading-relaxed">
                            Aesthetic Pomodoro focus sprints paired with effortless local & Google task management.
                        </p>
                    </div>
                )}

                {/* Slide 2: Interactive Theme Picker */}
                {step === 1 && (
                    <div className="flex-1 flex flex-col justify-center space-y-4 py-2 animate-fadeIn">
                        <div className="text-center space-y-1">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                Pick Your Vibe 🎨
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Tap a theme below to live preview your workspace background.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 max-h-[260px] overflow-y-auto p-1">
                            {Object.values(THEMES).map((th) => {
                                const isSelected = th.id === currentThemeId;
                                return (
                                    <button
                                        key={th.id}
                                        onClick={() => setTheme(th.id)}
                                        className={`relative h-20 rounded-2xl overflow-hidden border-2 text-left p-2.5 flex flex-col justify-end transition-all bg-cover bg-center ${
                                            isSelected
                                                ? 'border-rose-500 ring-2 ring-rose-500/30 scale-[1.02] shadow-md'
                                                : 'border-slate-200 dark:border-slate-800 opacity-75 hover:opacity-100'
                                        }`}
                                        style={th.bgUrl ? { backgroundImage: `url(${th.bgUrl})` } : {}}
                                    >
                                        {th.bgUrl && <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />}
                                        <div className="relative z-10 flex items-center gap-1.5 text-white">
                                            <span className="text-sm">{th.emoji}</span>
                                            <span className={`text-xs font-bold truncate ${!th.bgUrl && !th.isDark ? 'text-slate-900' : 'text-white'}`}>
                                                {th.name}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Slide 3: Target Pomodoros & Sprints */}
                {step === 2 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-4 animate-fadeIn">
                        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-3 shadow-inner">
                            <span className="text-2xl">🍅</span>
                            <div className="text-left">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">Effort Estimation</span>
                                <span className="text-[11px] text-slate-500 font-mono">Completed: 1 / 3 Target Pomodoros</span>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                            Plan Effort in Pomodoro Blocks ⏱️
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xs leading-relaxed">
                            Set target Pomodoro blocks per task. As you finish 25-minute focus sessions, your completed count updates automatically.
                        </p>
                    </div>
                )}

                {/* Slide 4: Local-First & Google Sync */}
                {step === 3 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-4 animate-fadeIn">
                        <div className="flex gap-2">
                            <span className="px-3 py-1 rounded-xl bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 text-xs font-bold border border-indigo-300/50">
                                🔵 Google Tasks Powered
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                            Sync Your Google Tasks
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xs leading-relaxed">
                            Connect your Google account to automatically import task lists and back up timer history across all devices.
                        </p>
                        <div className="w-full max-w-xs space-y-2 pt-2">
                            <button
                                onClick={async () => {
                                    if (loginNative) {
                                        const token = await loginNative();
                                        if (token) onClose();
                                    } else {
                                        onClose();
                                    }
                                }}
                                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg active:scale-95 transition flex items-center justify-center gap-2"
                            >
                                <span>🔑</span> Connect Google Tasks Now
                            </button>
                        </div>
                    </div>
                )}

                {/* Footer Controls */}
                <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-slate-800/60 pt-4 mt-4">
                    <button
                        onClick={handlePrev}
                        disabled={step === 0}
                        className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-0 transition"
                    >
                        Back
                    </button>
                    {step === totalSteps - 1 ? (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
                        >
                            Skip & Use Local Mode →
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="px-6 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-lg active:scale-95 transition"
                        >
                            Continue →
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}