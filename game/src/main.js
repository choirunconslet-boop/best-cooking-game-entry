// Sizzle & Serve — Warung Rush: entry point.
// One file, one job: wire the canvas, the loop, input and the ?shot= scenes.
import { VIEW } from './config.js';
import { createInput } from './input.js';
import { render } from './render.js';
import { stageShot } from './shots.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, createWorld, interact, startShift, step } from './world.js';
import { ensureAudio, isMuted, toggleMute } from './audio.js';

const canvas = document.getElementById('game');
canvas.width = VIEW.width;
canvas.height = VIEW.height;
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');

const world = createWorld();
let screen = SCREEN_TITLE;
let last = performance.now();
let lastTickSecond = -1;

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
let shotMode = false;
if (shot) {
  shotMode = true;
  const staged = stageShot(shot, world);
  screen = staged.screen;
  world.screen = staged.screen;
  render(ctx, world);
}

function announce(text) {
  if (status) status.textContent = text;
}

function beginShift() {
  ensureAudio();
  startShift(world);
  screen = SCREEN_PLAY;
  world.screen = SCREEN_PLAY;
  lastTickSecond = -1;
  announce('Shift started. Serve orders before customers walk out.');
}

const input = createInput(canvas, (clickX, clickY) => {
  ensureAudio();
  if (shotMode) return;
  if (screen === SCREEN_TITLE) { beginShift(); return; }
  if (screen === SCREEN_OVER) { beginShift(); return; }
  if (typeof clickX === 'number') {
    // Click a station: walk the chef next to it, then use it.
    const s = world.stations.find((st) => clickX >= st.x && clickX <= st.x + st.w && clickY >= st.y && clickY <= st.y + st.h);
    if (s) {
      world.chef.x = Math.max(60, Math.min(VIEW.width - 60, s.x + s.w / 2));
      world.chef.y = s.y + s.h < 300 ? s.y + s.h + 40 : s.y - 40;
    }
  }
  interact(world);
}, () => {
  if (screen === SCREEN_TITLE || screen === SCREEN_OVER) beginShift();
}, () => {
  const m = toggleMute();
  announce(m ? 'Sound muted.' : 'Sound on.');
});

window.addEventListener('keydown', (e) => {
  if (shotMode) return;
  if (e.code === 'KeyR' && (screen === SCREEN_OVER || screen === SCREEN_PLAY)) beginShift();
});

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!shotMode && screen === SCREEN_PLAY) {
    step(world, dt, input.moveX, input.moveY);
    screen = world.screen;
    const sec = Math.ceil(world.timeLeft);
    if (sec !== lastTickSecond) {
      lastTickSecond = sec;
      if (sec <= 10 && sec > 0) announce(`${sec} seconds left.`);
    }
  }
  render(ctx, world);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
