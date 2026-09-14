"use client";

import React from 'react';
import { ActivityCalendar } from 'react-activity-calendar';

interface HeatmapProps {
    sessions?: any[];
}

const Heatmap = ({ sessions = [] }: HeatmapProps) => {
    const getLocalDateStr = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

 
    // 1. Group session counts by local YYYY-MM-DD
    const countsByDate: Record<string, number> = {};
    sessions.forEach((s: any) => {
        const dateVal = s.completed_at || s.completedAt || s.date || s.timestamp || s._id?.replace('sess-', '');
        if (!dateVal) return;
        const time = typeof dateVal === 'number' ? dateVal : new Date(dateVal).getTime();
        if (isNaN(time)) return;
        const dateStr = getLocalDateStr(new Date(time));
        countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1;
    });

    // 2. Fill continuous 9-month (270 days) date matrix ending today
    const today = new Date();
    const DAYS_TO_SHOW = 120;
    const data = [];

    for (let i = DAYS_TO_SHOW - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = getLocalDateStr(d);
        const count = countsByDate[dateStr] || 0;
        const level = count === 0 ? 0 : Math.min(4, Math.max(1, Math.ceil(count / 2)));

        data.push({
            date: dateStr,
            count,
            level,
        });
    }

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-200/70 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-3 self-start">Activity Heatmap</h3>
            {data.length > 0 ? (
                <ActivityCalendar
                    data={data}
                    theme={{
                        light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
                    }}
                    labels={{
                        totalCount: '{{count}} focus sessions logged',
                    }}
                />
            ) : (
                <p className="text-xs text-slate-400 py-6">No completed sessions recorded yet today.</p>
            )}
        </div>
    );
};

export default Heatmap;