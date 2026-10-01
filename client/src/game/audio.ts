/** Tiny WebAudio chiptune: no audio files to download. */
const MUTE_KEY = "lff-gym-muted";
let ctx: AudioContext | null = null;
let musicTimer: ReturnType<typeof setInterval> | null = null;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMuted(m: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, m ? "1" : "0");
  } catch {
    /* ignore */
  }
  if (m) stopMusic();
}

function beep(freq: number, start: number, dur: number, type: OscillatorType = "square", vol = 0.06) {
  const a = ac();
  if (!a || isMuted()) return;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, a.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + start + dur);
  osc.connect(gain).connect(a.destination);
  osc.start(a.currentTime + start);
  osc.stop(a.currentTime + start + dur + 0.02);
}

export function sfx(kind: "perfect" | "good" | "miss" | "tut" | "start" | "done") {
  switch (kind) {
    case "perfect":
      beep(880, 0, 0.08); beep(1320, 0.08, 0.12);
      break;
    case "good":
      beep(660, 0, 0.1);
      break;
    case "miss":
      beep(220, 0, 0.18, "sawtooth");
      break;
    case "tut":
      beep(330, 0, 0.12, "sawtooth"); beep(247, 0.14, 0.2, "sawtooth");
      break;
    case "start":
      beep(523, 0, 0.1); beep(659, 0.1, 0.1); beep(784, 0.2, 0.18);
      break;
    case "done":
      [523, 659, 784, 1047].forEach((f, i) => beep(f, i * 0.12, 0.14));
      break;
  }
}

/** Looping 8-bar bassline + lead. */
const BASS = [110, 110, 131, 110, 147, 131, 110, 98];
const LEAD = [440, 0, 523, 440, 587, 523, 0, 392];

export function startMusic() {
  if (musicTimer || isMuted() || !ac()) return;
  let step = 0;
  musicTimer = setInterval(() => {
    const i = step % 8;
    beep(BASS[i], 0, 0.2, "triangle", 0.05);
    if (LEAD[i]) beep(LEAD[i], 0, 0.12, "square", 0.025);
    step++;
  }, 240);
}

export function stopMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
}
