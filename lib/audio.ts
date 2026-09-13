// Web Audio API synthesizer for a crisp completion chime
export const playCompletionChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Two-tone bell note (D5 -> A5)
    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

      gain.gain.setValueAtTime(0.3, ctx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };

    playNote(587.33, 0, 0.4);    // D5
    playNote(880.00, 0.15, 0.8);  // A5
  } catch (e) {
    console.error("Audio playback failed:", e);
  }
};

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