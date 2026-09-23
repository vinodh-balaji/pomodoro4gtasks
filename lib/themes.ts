// lib/themes.ts

export interface ThemeConfig {
    id: string;
    name: string;
    emoji: string;
    bgUrl: string;
    cardBg: string;
    cardBorder: string;
    headerBg: string;
    textPrimary: string;
    textSecondary: string;
    accentBg: string;
    accentText: string;
    accentBorder: string;
    navBg: string;
    isDark?: boolean;
}

export const THEMES: Record<string, ThemeConfig> = {
        light: {
        id: 'light',
        name: 'Default Light',
        emoji: '☀️',
        bgUrl: '',
        cardBg: 'bg-white',
        cardBorder: 'border-slate-200',
        headerBg: 'bg-white/90 backdrop-blur-md border-slate-200/80',
        textPrimary: 'text-slate-900',
        textSecondary: 'text-slate-500',
        accentBg: 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800',
        accentText: 'text-indigo-600',
        accentBorder: 'border-indigo-200',
        navBg: 'bg-white/95 backdrop-blur-xl border-slate-200/80',
    },
    dark: {
        id: 'dark',
        name: 'Pure Dark',
        emoji: '🌙',
        bgUrl: '',
        cardBg: 'bg-slate-900',
        cardBorder: 'border-slate-800',
        headerBg: 'bg-slate-900/90 backdrop-blur-md border-slate-800',
        textPrimary: 'text-slate-100',
        textSecondary: 'text-slate-400',
        accentBg: 'bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700',
        accentText: 'text-indigo-400',
        accentBorder: 'border-indigo-500/30',
        navBg: 'bg-slate-900/95 backdrop-blur-xl border-slate-800',
        isDark: true,
    },
    sakura: {
        id: 'sakura',
        name: 'Sakura Bloom',
        emoji: '🌸',
        bgUrl: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=1200&q=80',
        cardBg: 'bg-white/80 backdrop-blur-md',
        cardBorder: 'border-pink-200/80',
        headerBg: 'bg-white/85 backdrop-blur-md border-pink-200/60',
        textPrimary: 'text-slate-900',
        textSecondary: 'text-rose-600/90',
        accentBg: 'bg-rose-500 hover:bg-rose-600 active:bg-rose-700',
        accentText: 'text-rose-600',
        accentBorder: 'border-rose-200',
        navBg: 'bg-white/90 backdrop-blur-xl border-pink-200/60',
    },
    cafe: {
        id: 'cafe',
        name: 'Cozy Cafe',
        emoji: '☕',
        bgUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
        cardBg: 'bg-amber-50/92 backdrop-blur-md',
        cardBorder: 'border-amber-200/80',
        headerBg: 'bg-amber-50/90 backdrop-blur-md border-amber-200/60',
        textPrimary: 'text-amber-950',
        textSecondary: 'text-amber-700',
        accentBg: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800',
        accentText: 'text-amber-700',
        accentBorder: 'border-amber-200',
        navBg: 'bg-amber-50/95 backdrop-blur-xl border-amber-200/60',
    },
    botanical: {
        id: 'botanical',
        name: 'Botanical Haven',
        emoji: '🌿',
        bgUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1200&q=80',
        cardBg: 'bg-emerald-50/85 backdrop-blur-md',
        cardBorder: 'border-emerald-200/80',
        headerBg: 'bg-emerald-50/90 backdrop-blur-md border-emerald-200/60',
        textPrimary: 'text-emerald-950',
        textSecondary: 'text-emerald-700',
        accentBg: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800',
        accentText: 'text-emerald-700',
        accentBorder: 'border-emerald-200',
        navBg: 'bg-emerald-50/95 backdrop-blur-xl border-emerald-200/60',
    },
    sunset: {
        id: 'sunset',
        name: 'Lo-Fi Sunset',
        emoji: '🌌',
        bgUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        cardBg: 'bg-purple-50/85 backdrop-blur-md',
        cardBorder: 'border-purple-200/80',
        headerBg: 'bg-purple-50/90 backdrop-blur-md border-purple-200/60',
        textPrimary: 'text-indigo-950',
        textSecondary: 'text-purple-700',
        accentBg: 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800',
        accentText: 'text-indigo-600',
        accentBorder: 'border-indigo-200',
        navBg: 'bg-purple-50/95 backdrop-blur-xl border-purple-200/60',
    },
    midnight: {
        id: 'midnight',
        name: 'Midnight Berry',
        emoji: '🌙',
        bgUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
        cardBg: 'bg-slate-900/85 backdrop-blur-md',
        cardBorder: 'border-pink-500/30',
        headerBg: 'bg-slate-900/90 backdrop-blur-md border-pink-500/20',
        textPrimary: 'text-pink-50',
        textSecondary: 'text-pink-300',
        accentBg: 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700',
        accentText: 'text-rose-400',
        accentBorder: 'border-pink-500/30',
        navBg: 'bg-slate-900/95 backdrop-blur-xl border-pink-500/30',
        isDark: true,
    },
};

export const DEFAULT_THEME_ID = 'light';