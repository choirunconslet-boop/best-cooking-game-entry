// Game state and rules for Sizzle & Serve — Warung Rush.
// One file, one job: the shift timer, orders, stations, processing and scoring.
import {
  CHEF_SPEED, FLOOR, MAX_MISSED, MAX_ORDERS, ORDER_PATIENCE, PROCESS_TIME,
  SHIFT_SECONDS, STATIONS, TIP_MAX, VIEW, WIN_COINS,
} from './config.js';
import { INGREDIENTS, RECIPES, matchingOrder, recipeById } from './recipes.js';
import * as sfx from './audio.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

export const EVENT_NONE = 0;
export const EVENT_SERVED = 1;
export const EVENT_MISSED = 2;
export const EVENT_OVER = 4;

let orderSeq = 1;

export function makeOrder(difficulty, now) {
  const pool = difficulty < 2 ? RECIPES.slice(0, 3) : RECIPES;
  const recipe = pool[Math.floor(Math.random() * pool.length)];
  return {
    id: orderSeq++, recipeId: recipe.id, patience: ORDER_PATIENCE,
    maxPatience: ORDER_PATIENCE, bornAt: now, served: false,
  };
}

export function createWorld() {
  return {
    screen: SCREEN_TITLE,
    time: 0, timeLeft: SHIFT_SECONDS,
    coins: 0, served: 0, missed: 0, streak: 0, bestStreak: 0,
    chef: { x: VIEW.width / 2, y: 430, carry: null, facing: 1 },
    orders: [],
    plate: [],
    stations: STATIONS.map((s) => ({ ...s, busyUntil: 0, busyItem: null, progress: 0, doneItem: null })),
    orderTimer: 0, orderGap: 7,
    message: '', messageUntil: 0,
    overReason: '', won: false,
    sizzleUntil: 0,
  };
}

export function stationById(world, id) {
  return world.stations.find((s) => s.id === id);
}

function nearStation(world) {
  const c = world.chef;
  let best = null; let bestD = 110;
  for (const s of world.stations) {
    const cx = Math.max(s.x, Math.min(c.x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(c.y, s.y + s.h));
    const d = Math.hypot(c.x - cx, c.y - cy);
    if (d < bestD) { bestD = d; best = s; }
  }
  return best;
}
export function nearestStation(world) { return nearStation(world); }

function flash(world, text) {
  world.message = text;
  world.messageUntil = world.time + 1.6;
}

/** The chef uses the station they are standing next to. Returns an event mask. */
export function interact(world) {
  if (world.screen !== SCREEN_PLAY) return EVENT_NONE;
  const s = nearStation(world);
  if (!s) { flash(world, 'Walk up to a counter first!'); return EVENT_NONE; }
  const chef = world.chef;

  if (s.kind === 'pantry') {
    if (chef.carry) { flash(world, 'Hands full — serve or bin it first'); sfx.sfxBad(); return EVENT_NONE; }
    chef.carry = s.gives;
    sfx.sfxPickup();
    flash(world, `Picked up ${INGREDIENTS[s.gives].name}`);
    return EVENT_NONE;
  }
  if (s.kind === 'process') {
    if (s.doneItem) {
      if (chef.carry) { flash(world, 'Hands full!'); return EVENT_NONE; }
      chef.carry = s.doneItem; s.doneItem = null; sfx.sfxPickup();
      flash(world, `Picked up ${INGREDIENTS[chef.carry].name}`);
      return EVENT_NONE;
    }
    if (s.busyItem) { flash(world, `${s.label} is busy…`); return EVENT_NONE; }
    if (!chef.carry || !s.accepts.includes(chef.carry)) {
      flash(world, `${s.label} takes ${s.accepts.map((a) => INGREDIENTS[a].name).join(' / ')}`);
      sfx.sfxBad();
      return EVENT_NONE;
    }
    s.busyItem = chef.carry; chef.carry = null;
    s.busyUntil = world.time + PROCESS_TIME[s.process];
    s.progress = 0;
    if (s.process === 'grill' || s.process === 'fry') { sfx.sfxSizzle(); world.sizzleUntil = world.time + 0.6; }
    else sfx.sfxChop();
    return EVENT_NONE;
  }
  if (s.kind === 'plate') {
    if (!chef.carry) { flash(world, 'Bring an ingredient to the plate'); return EVENT_NONE; }
    if (INGREDIENTS[chef.carry].raw) {
      flash(world, `${INGREDIENTS[chef.carry].name} is raw — cook it first!`);
      sfx.sfxBad();
      return EVENT_NONE;
    }
    world.plate.push(chef.carry);
    sfx.sfxPlace();
    chef.carry = null;
    const match = matchingOrder(world.plate, world.orders);
    if (match) flash(world, `✅ ${recipeById(match.recipeId).name} ready — SERVE IT!`);
    else flash(world, 'Added to the plate');
    return EVENT_NONE;
  }
  if (s.kind === 'serve') {
    const match = matchingOrder(world.plate, world.orders);
    if (!match) {
      if (world.plate.length === 0) { flash(world, 'Plate is empty!'); return EVENT_NONE; }
      flash(world, 'No order wants this dish — check the board!');
      sfx.sfxBad();
      return EVENT_NONE;
    }
    const recipe = recipeById(match.recipeId);
    const tip = Math.round((match.patience / match.maxPatience) * TIP_MAX);
    world.coins += recipe.coins + tip;
    world.served += 1;
    world.streak += 1;
    world.bestStreak = Math.max(world.bestStreak, world.streak);
    world.orders = world.orders.filter((o) => o.id !== match.id);
    world.plate = [];
    sfx.sfxServe();
    flash(world, `Served ${recipe.name}! +${recipe.coins} coins +${tip} tip`);
    return EVENT_SERVED;
  }
  if (s.kind === 'bin') {
    if (chef.carry) { chef.carry = null; flash(world, 'Tossed it'); sfx.sfxPlace(); }
    else if (world.plate.length) { world.plate = []; flash(world, 'Plate cleared'); sfx.sfxPlace(); }
    else flash(world, 'Nothing to toss');
    return EVENT_NONE;
  }
  return EVENT_NONE;
}

function updateOrders(world, dt) {
  world.orderTimer -= dt;
  const difficulty = world.served + world.missed;
  if (world.orderTimer <= 0 && world.orders.length < MAX_ORDERS) {
    world.orders.push(makeOrder(difficulty, world.time));
    world.orderTimer = Math.max(4, world.orderGap - difficulty * 0.25);
    sfx.sfxNewOrder();
  }
  let missed = 0;
  for (const o of world.orders) o.patience -= dt;
  const alive = [];
  for (const o of world.orders) {
    if (o.patience <= 0) { missed += 1; } else alive.push(o);
  }
  if (missed > 0) {
    world.orders = alive;
    world.missed += missed;
    world.streak = 0;
    sfx.sfxBad();
    flash(world, missed === 1 ? 'An order walked out! 😠' : `${missed} orders walked out! 😠`);
  }
  return missed > 0 ? EVENT_MISSED : EVENT_NONE;
}

function updateStations(world) {
  for (const s of world.stations) {
    if (!s.busyItem) { s.progress = 0; continue; }
    const total = PROCESS_TIME[s.process];
    s.progress = Math.min(1, 1 - (s.busyUntil - world.time) / total);
    if (world.time >= s.busyUntil) {
      s.doneItem = INGREDIENTS[s.busyItem].cooked;
      s.busyItem = null;
      s.progress = 1;
      sfx.sfxPlace();
    }
  }
}

/** Advance the world by dt seconds. moveX/moveY are -1..1. Returns an event mask. */
export function step(world, dt, moveX, moveY) {
  if (world.screen !== SCREEN_PLAY) return EVENT_NONE;
  world.time += dt;
  world.timeLeft = Math.max(0, SHIFT_SECONDS - world.time);
  if (world.timeLeft <= 0) {
    world.screen = SCREEN_OVER;
    world.won = world.coins >= WIN_COINS;
    world.overReason = world.won
      ? `Shift complete! You earned ${world.coins} coins — target was ${WIN_COINS}.`
      : `Shift over — ${world.coins} coins, target was ${WIN_COINS}.`;
    if (world.won) sfx.sfxWin(); else sfx.sfxBad();
    return EVENT_OVER;
  }
  if (world.missed >= MAX_MISSED) {
    world.screen = SCREEN_OVER;
    world.won = false;
    world.overReason = 'Too many customers walked out! The warung emptied.';
    sfx.sfxBad();
    return EVENT_OVER;
  }
  const c = world.chef;
  const len = Math.hypot(moveX, moveY) || 1;
  c.x = Math.max(FLOOR.x + 14, Math.min(FLOOR.x + FLOOR.w - 14, c.x + (moveX / len) * CHEF_SPEED * dt * (moveX || moveY ? 1 : 0)));
  c.y = Math.max(FLOOR.y + 14, Math.min(FLOOR.y + FLOOR.h - 14, c.y + (moveY / len) * CHEF_SPEED * dt * (moveX || moveY ? 1 : 0)));
  if (moveX !== 0) c.facing = moveX > 0 ? 1 : -1;

  updateStations(world);
  let events = updateOrders(world, dt);
  if (world.missed >= MAX_MISSED) {
    world.screen = SCREEN_OVER;
    world.won = false;
    world.overReason = 'Too many customers walked out! The warung emptied.';
    return events | EVENT_OVER;
  }
  return events;
}

export function startShift(world) {
  const fresh = createWorld();
  Object.assign(world, fresh);
  world.screen = SCREEN_PLAY;
  world.orders.push(makeOrder(0, 0), makeOrder(0, 0));
  world.orderTimer = 8;
}

export { WIN_COINS, MAX_MISSED, SHIFT_SECONDS };
