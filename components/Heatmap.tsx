"use client";

import React from 'react';
import { ActivityCalendar } from 'react-activity-calendar';

interface HeatmapProps {
    sessions?: any[];
}

const Heatmap = ({ sessions = [] }: HeatmapProps) => {
    // Group completed sessions by YYYY-MM-DD date string
    const countsByDate = sessions.reduce((acc: Record<string, number>, session: any) => {
        if (!session.completed_at) return acc;
        const dateStr = new Date(session.completed_at).toISOString().split('T')[0];
        acc[dateStr] = (acc[dateStr] || 0) + 1;
        return acc;
    }, {});

    // Generate activity data for react-activity-calendar
    const data = Object.entries(countsByDate).map(([date, count]) => ({
        date,
        count: count as number,
        level: Math.min(4, Math.max(1, Math.ceil((count as number) / 2))),
    }));

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