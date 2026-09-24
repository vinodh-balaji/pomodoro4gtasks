"use client";

import React from 'react';

interface NotificationPromptModalProps {
    isOpen: boolean;
    onAllow: () => void;
    onSkip: () => void;
}

export default function NotificationPromptModal({
    isOpen,
    onAllow,
    onSkip,
}: NotificationPromptModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-sm w-full text-center space-y-5 animate-scaleUp">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-3xl flex items-center justify-center mx-auto">
                    🔔
                </div>

                <div className="space-y-1.5">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        Enable Finish Alerts?
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Tasks 'n Timers will alert you when your 25-minute Pomodoro session finishes, even when the app is in the background.
                    </p>
                </div>

                <div className="space-y-2 pt-2">
                    <button
                        onClick={onAllow}
                        className="w-full py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg active:scale-95 transition"
                    >
                        Enable Notifications
                    </button>
                    <button
                        onClick={onSkip}
                        className="w-full py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-bold text-xs active:scale-95 transition"
                    >
                        Skip for Now
                    </button>
                </div>
            </div>
        </div>
    );
}