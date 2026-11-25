// Tiny WebAudio synth for Sizzle & Serve: all sounds are generated, no files.
// One file, one job: beeps, sizzles and jingles, created on first user gesture.
let ctx = null;
let muted = false;

export function ensureAudio() {
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    } catch {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}
export function isMuted() { return muted; }

function tone(freq, dur, type = 'sine', gain = 0.12, when = 0) {
  if (muted || !ctx) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export function sfxPickup() { tone(520, 0.08, 'triangle', 0.1); tone(780, 0.07, 'triangle', 0.08, 0.05); }
export function sfxPlace() { tone(330, 0.09, 'triangle', 0.1); }
export function sfxChop() { tone(180, 0.06, 'square', 0.08); }
export function sfxSizzle() { tone(1200, 0.25, 'sawtooth', 0.03); tone(900, 0.3, 'sawtooth', 0.03, 0.05); }
export function sfxServe() { tone(523, 0.12, 'sine', 0.12); tone(659, 0.12, 'sine', 0.12, 0.1); tone(784, 0.2, 'sine', 0.12, 0.2); }
export function sfxBad() { tone(220, 0.18, 'sawtooth', 0.08); tone(160, 0.25, 'sawtooth', 0.08, 0.12); }
export function sfxTick() { tone(880, 0.05, 'square', 0.05); }
export function sfxNewOrder() { tone(440, 0.1, 'triangle', 0.1); tone(587, 0.14, 'triangle', 0.1, 0.09); }
export function sfxWin() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'sine', 0.12, i * 0.13)); }
