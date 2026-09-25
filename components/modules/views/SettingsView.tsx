// components/modules/views/SettingsView.tsx
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
} from '@/lib/audio';
import { THEMES } from '@/lib/themes';

interface SettingsViewProps {
  currentThemeId: string;
  setTheme: (id: string) => void;
  accessToken: string | null;
  loginNative: () => void;
  handleLogout: () => void;
  handleReplayOnboarding?: () => void;
  handleResetStarterTasks?: () => void;
  theme: any;
}

export default function SettingsView({
  currentThemeId,
  setTheme,
  accessToken,
  loginNative,
  handleLogout,
  handleReplayOnboarding,
  handleResetStarterTasks,
  theme,
}: SettingsViewProps) {
  const [ambientType, setAmbientType] = useState(getCurrentAmbientType());

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-24 animate-fadeIn">
      {/* Page Header */}
      <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-3xl p-6 shadow-lg backdrop-blur-md flex items-center justify-between`}>
        <div>
          <h2 className={`text-xl font-bold ${theme.textPrimary}`}>Settings & Preferences</h2>
          <p className={`text-xs mt-0.5 ${theme.textSecondary}`}>Customize your focus workspace, sounds, and account sync</p>
        </div>
        <span className="text-2xl">⚙️</span>
      </div>

      {/* 1. Appearance & Themes */}
      <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-3xl p-6 shadow-lg backdrop-blur-md space-y-3`}>
        <span className={`text-[11px] font-bold uppercase tracking-wider block ${theme.textSecondary}`}>Appearance & Themes</span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.values(THEMES).map((th) => {
            const isCurrent = th.id === currentThemeId;
            return (
              <button
                key={th.id}
                onClick={() => { playPop(); setTheme(th.id); }}
                className={`relative h-20 rounded-2xl overflow-hidden border-2 text-left p-3 flex flex-col justify-end active:scale-95 transition-all bg-cover bg-center ${
                  isCurrent ? 'border-rose-500 ring-2 ring-rose-500/30 shadow-md' : 'border-slate-200 dark:border-slate-800 opacity-85 hover:opacity-100'
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
                {isCurrent && (
                  <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Timer & Audio Preferences */}
      <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-3xl p-6 shadow-lg backdrop-blur-md space-y-4`}>
        <span className={`text-[11px] font-bold uppercase tracking-wider block ${theme.textSecondary}`}>Audio & Timer Preferences</span>
        
        <div className="p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 space-y-4">
          {/* Global Mute */}
          <div className="flex items-center justify-between">
            <div>
              <span className={`text-xs font-bold block ${theme.textPrimary}`}>🔇 Mute All Audio</span>
              <span className={`text-[10px] block mt-0.5 ${theme.textSecondary}`}>Silence chimes, clicks, and background audio</span>
            </div>
            <input
              type="checkbox"
              defaultChecked={getSoundMuted()}
              onChange={(e) => { setSoundMuted(e.target.checked); playPop(); }}
              className="w-5 h-5 rounded-md border-slate-300 text-rose-500 focus:ring-0 cursor-pointer"
            />
          </div>

          {/* Audible Timer Ticking */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
            <div>
              <span className={`text-xs font-bold block ${theme.textPrimary}`}>⏱️ Audible Timer Ticking</span>
              <span className={`text-[10px] block mt-0.5 ${theme.textSecondary}`}>Subtle tick sound every second during active focus</span>
            </div>
            <input
              type="checkbox"
              defaultChecked={getTickEnabled()}
              onChange={(e) => { setTickEnabled(e.target.checked); playPop(); }}
              className="w-5 h-5 rounded-md border-slate-300 text-rose-500 focus:ring-0 cursor-pointer"
            />
          </div>

          {/* Ambient Soundscape */}
          <div className="space-y-2.5 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold block ${theme.textPrimary}`}>🎧 Ambient Focus Soundscape</span>
              <span className={`text-[10px] font-mono ${theme.textSecondary}`}>Web Audio Synthesizer</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'none', label: 'Off', emoji: '🚫' },
                { id: 'rain', label: 'Rain', emoji: '🌧️' },
                { id: 'waves', label: 'Waves', emoji: '🌊' },
                { id: 'deep', label: 'Deep', emoji: '🧠' }
              ].map((amb) => {
                const isActive = ambientType === amb.id;
                return (
                  <button
                    key={amb.id}
                    onClick={() => {
                      playPop();
                      const nextType = amb.id as 'rain' | 'waves' | 'deep' | 'none';
                      setAmbientType(nextType);
                      if (nextType === 'none') stopAmbientSound();
                      else startAmbientSound(nextType, getAmbientVolume());
                    }}
                    className={`py-2.5 px-2 rounded-xl text-center text-xs font-bold transition-all border ${
                      isActive 
                        ? 'bg-rose-500 text-white border-rose-500 shadow-sm' 
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="block text-base mb-0.5">{amb.emoji}</span>
                    {amb.label}
                  </button>
                );
              })}
            </div>

            {ambientType !== 'none' && (
              <div className="flex items-center gap-3 pt-2">
                <span className={`text-[10px] font-bold ${theme.textSecondary}`}>Volume:</span>
                <input
                  type="range"
                  min="0.02"
                  max="0.4"
                  step="0.02"
                  defaultValue={getAmbientVolume()}
                  onChange={(e) => updateAmbientVolume(parseFloat(e.target.value))}
                  className="flex-1 accent-rose-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Integrations & Accounts */}
      <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-3xl p-6 shadow-lg backdrop-blur-md space-y-3`}>
        <span className={`text-[11px] font-bold uppercase tracking-wider block ${theme.textSecondary}`}>Integrations & Account Sync</span>
        <div className="p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔵</span>
            <div>
              <span className={`text-xs font-bold block ${theme.textPrimary}`}>Google Tasks & Drive</span>
              <span className={`text-[10px] block mt-0.5 ${accessToken ? 'text-emerald-600 font-semibold' : theme.textSecondary}`}>
                {accessToken ? 'Connected & Syncing' : 'Sign in to sync tasks and settings'}
              </span>
            </div>
          </div>
          {accessToken ? (
            <button onClick={handleLogout} className="py-2 px-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs active:scale-95 transition">
              Logout
            </button>
          ) : (
            <button onClick={loginNative} className="py-2 px-3.5 rounded-xl bg-indigo-600 text-white font-bold text-xs active:scale-95 transition shadow-xs">
              Connect Google
            </button>
          )}
        </div>
      </div>

      {/* 4. Guides & Quick Actions */}
      <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-3xl p-6 shadow-lg backdrop-blur-md space-y-3`}>
        <span className={`text-[11px] font-bold uppercase tracking-wider block ${theme.textSecondary}`}>Guides & Quick Actions</span>
        <div className="flex gap-3">
          <button
            onClick={() => handleReplayOnboarding?.()}
            className="flex-1 py-3 px-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs active:scale-95 transition flex items-center justify-center gap-2 shadow-2xs"
          >
            <span>🚀</span> Replay Welcome Tour
          </button>
          <button
            onClick={() => handleResetStarterTasks?.()}
            className="flex-1 py-3 px-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs active:scale-95 transition flex items-center justify-center gap-2 shadow-2xs"
          >
            <span>📋</span> Restore Starter Tasks
          </button>
          <button
              onClick={() => {
                localStorage.removeItem('pomo_timer_state');
                localStorage.removeItem('pomo_target_end_time');
                alert("Stale timer keys cleared!");
              }}
              className="w-full py-2 bg-rose-500 text-white rounded-xl font-bold text-xs"
            >
              🧹 Clear Stale Storage Keys
            </button>
        </div>
      </div>
    </div>
  );
}