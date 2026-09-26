"use client";

import React from "react";
import Heatmap from "./Heatmap";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface AnalyticsViewProps {
    sessions?: any[];
    tasks?: any[];
    DAILY_GOAL?: number;
}

export default function AnalyticsView({ sessions = [], tasks = [], DAILY_GOAL = 8 }: AnalyticsViewProps) {
    const getLocalDateStr = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const now = new Date();

    // 1. Time Boundaries
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 2. Helper to filter and calculate total minutes & hours
    const getStatsForRange = (startDate: Date) => {
        const filtered = sessions.filter((s: any) => {
            const dateVal = s.completed_at || s.completedAt || s.date || s.timestamp || s._id?.replace('sess-', '');
            if (!dateVal) return false;
            const time = typeof dateVal === 'number' ? dateVal : new Date(dateVal).getTime();
            return !isNaN(time) && time >= startDate.getTime();
        });

        const totalMinutes = filtered.reduce((acc: number, s: any) => {
            const mins = s.actual_seconds ? s.actual_seconds / 60 : (s.duration_minutes || 25);
            return acc + mins;
        }, 0);

        return {
            count: filtered.length,
            hours: (totalMinutes / 60).toFixed(1),
            minutes: Math.round(totalMinutes),
        };
    };

    const todayStats = getStatsForRange(startOfToday);
    const weekStats = getStatsForRange(startOfWeek);
    const monthStats = getStatsForRange(startOfMonth);

    const progressPercent = Math.min(100, Math.round((todayStats.count / DAILY_GOAL) * 100));
    return (
        <div className="space-y-6 max-w-2xl mx-auto pb-12">
            {/* 1. Analytics Metric Cards (Today, Week, Month) */}
            <div className="grid grid-cols-3 gap-3">
                <div className="p-4 bg-white rounded-2xl border border-slate-200/70 shadow-sm flex flex-col justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Today</span>
                    <div className="my-1">
                        <span className="text-xl font-black text-slate-900 block">{todayStats.hours} <span className="text-xs font-semibold text-slate-500">hrs</span></span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">{todayStats.count} sessions</span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200/70 shadow-sm flex flex-col justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">This Week</span>
                    <div className="my-1">
                        <span className="text-xl font-black text-slate-900 block">{weekStats.hours} <span className="text-xs font-semibold text-slate-500">hrs</span></span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">{weekStats.count} sessions</span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200/70 shadow-sm flex flex-col justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">This Month</span>
                    <div className="my-1">
                        <span className="text-xl font-black text-slate-900 block">{monthStats.hours} <span className="text-xs font-semibold text-slate-500">hrs</span></span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">{monthStats.count} sessions</span>
                </div>
            </div>
            
            {/* Daily Goal Card */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200/70 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-slate-900">Daily Target</h2>
                        <p className="text-xs text-slate-500 font-medium">
                            {todayStats.count} of {DAILY_GOAL} Pomodoros completed
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
                <Heatmap sessions={sessions} />
            </div>
        </div>
    );
}