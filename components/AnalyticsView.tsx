"use client";

import React from "react";
import Heatmap from "./Heatmap";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface AnalyticsViewProps {
    sessions?: any[];
    DAILY_GOAL?: number;
}

export default function AnalyticsView({ sessions = [], DAILY_GOAL = 8 }: AnalyticsViewProps) {
    const todayStr = new Date().toISOString().split('T')[0];
    const todaySessionsCount = sessions.filter((s: any) => {
        if (!s.completed_at) return false;
        return new Date(s.completed_at).toISOString().split('T')[0] === todayStr;
    }).length;

    const progressPercent = Math.min(100, Math.round((todaySessionsCount / DAILY_GOAL) * 100));

    return (
        <div className="space-y-6 max-w-2xl mx-auto pb-12">
            {/* Daily Goal Card */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200/70 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-slate-900">Daily Target</h2>
                        <p className="text-xs text-slate-500 font-medium">
                            {todaySessionsCount} of {DAILY_GOAL} Pomodoros completed
                        </p>
                    </div>
                    <span className="text-2xl font-black text-indigo-600">{progressPercent}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500 rounded-full"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Heatmap Activity Section */}
            <div className="w-full overflow-x-auto min-h-[160px] scrollbar-thin">
+                <Heatmap sessions={sessions} />
+            </div>
        </div>
    );
}