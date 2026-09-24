// audio.ts
let isTickEnabledState = false; // Default: OFF

export const setTickEnabled = (enabled: boolean) => {
  isTickEnabledState = enabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem('pomo_tick_enabled', String(enabled));
  }
};

export const getTickEnabled = (): boolean => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('pomo_tick_enabled');
    if (saved !== null) return saved === 'true';
  }
  return isTickEnabledState;
};

let sharedCtx: AudioContext | null = null;
let isMutedState = false;

// Ambient Loop Audio Nodes
let ambientSource: AudioBufferSourceNode | null = null;
let ambientGain: GainNode | null = null;
let ambientLfo: OscillatorNode | null = null;
let currentAmbientType: 'rain' | 'waves' | 'deep' | 'none' = 'none';
let currentAmbientVolume = 0.15;

export const getAmbientVolume = (): number => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('pomo_ambient_volume');
    if (saved !== null) return parseFloat(saved);
  }
  return currentAmbientVolume;
};

export const updateAmbientVolume = (vol: number) => {
  currentAmbientVolume = vol;
  if (typeof window !== 'undefined') {
    localStorage.setItem('pomo_ambient_volume', String(vol));
  }
  setAmbientVolume(vol);
};

// Get or initialize singleton AudioContext
const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!sharedCtx) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      sharedCtx = new AudioCtx();
    }
  }
  if (sharedCtx && sharedCtx.state === 'suspended') {
    sharedCtx.resume().catch(() => {});
  }
  return sharedCtx;
};

// Global Mute Controls
export const setSoundMuted = (muted: boolean) => {
  isMutedState = muted;
  if (muted && ambientGain) {
    ambientGain.gain.setValueAtTime(0, sharedCtx?.currentTime || 0);
  }
};

export const getSoundMuted = (): boolean => isMutedState;

export const toggleMute = (): boolean => {
  setSoundMuted(!isMutedState);
  return isMutedState;
};

// ================= 1. UI SOUND EFFECTS =================

// Crisp two-tone completion bell (D5 -> A5)
export const playCompletionChime = () => {
  if (isMutedState) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

      gain.gain.setValueAtTime(0.25, ctx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };

    playNote(587.33, 0, 0.4);    // D5
    playNote(880.00, 0.15, 1.2);  // A5
  } catch (e) {
    console.error("Audio completion chime playback failed:", e);
  }
};

// Tactile UI pop (for task check-off or button clicks)
export const playPop = () => {
  if (isMutedState) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch (e) {
    console.error("Pop sound failed:", e);
  }
};

// Soft timer tick sound
export const playTick = () => {
  if (isMutedState || !getTickEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);

    gain.gain.setValueAtTime(0.02, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.015);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.015);
  } catch (e) {
    console.error("Tick sound failed:", e);
  }
};

// ================= 2. PROCEDURAL AMBIENT NOISE GENERATOR =================

// Cached noise buffer instance to prevent blocking the UI thread
let cachedNoiseBuffer: AudioBuffer | null = null;

const getNoiseBuffer = (ctx: AudioContext): AudioBuffer => {
  if (cachedNoiseBuffer && cachedNoiseBuffer.sampleRate === ctx.sampleRate) {
    return cachedNoiseBuffer;
  }
  // 2 seconds of noise is plenty for seamless ambient loops
  const bufferSize = ctx.sampleRate * 2;  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  cachedNoiseBuffer = buffer;
  return buffer;
};

// Start ambient background sounds ('rain' | 'waves' | 'deep')
export const startAmbientSound = (type: 'rain' | 'waves' | 'deep', volume: number = 0.15) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    stopAmbientSound(); // Stop existing ambient loop if running

    if (isMutedState) return;

    const buffer = getNoiseBuffer(ctx);
    ambientSource = ctx.createBufferSource();
    ambientSource.buffer = buffer;
    ambientSource.loop = true;

    ambientGain = ctx.createGain();
    ambientGain.gain.setValueAtTime(volume, ctx.currentTime);

    const filter = ctx.createBiquadFilter();

    if (type === 'rain') {
      // Soft gentle rainfall filter
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);
      ambientSource.connect(filter);
      filter.connect(ambientGain);
    } else if (type === 'waves') {
      // Modulated Ocean Waves (Filter + LFO Gain Modulation)
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, ctx.currentTime);

      ambientLfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      ambientLfo.frequency.setValueAtTime(0.12, ctx.currentTime); // 8-second wave rhythm
      lfoGain.gain.setValueAtTime(0.08, ctx.currentTime);

      ambientLfo.connect(lfoGain);
      lfoGain.connect(ambientGain.gain);
      ambientLfo.start();

      ambientSource.connect(filter);
      filter.connect(ambientGain);
    } else if (type === 'deep') {
      // Brown noise warmth (Deep focus)
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, ctx.currentTime);
      ambientSource.connect(filter);
      filter.connect(ambientGain);
    }

    ambientGain.connect(ctx.destination);
    ambientSource.start();
    currentAmbientType = type;
  } catch (e) {
    console.error("Failed to start ambient audio loop:", e);
  }
};

// Stop ambient audio loops
export const stopAmbientSound = () => {
  try {
    if (ambientSource) {
      ambientSource.stop();
      ambientSource.disconnect();
      ambientSource = null;
    }
    if (ambientLfo) {
      ambientLfo.stop();
      ambientLfo.disconnect();
      ambientLfo = null;
    }
    if (ambientGain) {
      ambientGain.disconnect();
      ambientGain = null;
    }
    currentAmbientType = 'none';
  } catch (e) {
    console.error("Failed to stop ambient sound:", e);
  }
};

export const getCurrentAmbientType = () => currentAmbientType;

// Set Ambient Volume
export const setAmbientVolume = (volume: number) => {
  if (ambientGain && sharedCtx && !isMutedState) {
    ambientGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), sharedCtx.currentTime);
  }
};

// ================= 3. BROWSER NOTIFICATIONS =================

// Request desktop notification permissions
export const requestNotificationPermission = async () => {
  if ("Notification" in window && Notification.permission === "default") {
    await Notification.requestPermission();
  }
};

// Fire native browser push notification
export const sendCompletionNotification = (taskTitle?: string) => {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("🍅 Pomodoro Complete!", {
      body: taskTitle ? `Great job finishing your session on: "${taskTitle}"` : "25 minutes completed! Time for a short break.",
      icon: "/favicon.ico",
    });
  }
};