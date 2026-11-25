// Sizzle & Serve — Warung Rush: tuning constants for the kitchen.
// One file, one job: every number the rules and the renderer share lives here.
export const VIEW = { width: 1280, height: 720 };
export const SHIFT_SECONDS = 150;
export const WIN_COINS = 120;
export const MAX_MISSED = 3;
export const ORDER_PATIENCE = 45;
export const MAX_ORDERS = 3;
export const CHEF_SPEED = 300;
export const CHEF_RADIUS = 22;

// Processing times (seconds) at each station.
export const PROCESS_TIME = { grill: 3.0, chop: 2.0, fry: 4.0 };
export const TIP_MAX = 8;

// Kitchen floor plan. Stations are rectangles the chef walks up to and uses
// with E / Space / click. Counters hold finished items waiting to be picked up.
export const STATIONS = [
  { id: 'pantry-bun', label: 'BUNS', kind: 'pantry', gives: 'bun', x: 40, y: 150, w: 110, h: 90, color: '#e8b04b' },
  { id: 'pantry-patty', label: 'PATTY', kind: 'pantry', gives: 'patty', x: 160, y: 150, w: 110, h: 90, color: '#c96a4a' },
  { id: 'pantry-lettuce', label: 'LETTUCE', kind: 'pantry', gives: 'lettuce', x: 280, y: 150, w: 110, h: 90, color: '#7bc96a' },
  { id: 'pantry-tomato', label: 'TOMATO', kind: 'pantry', gives: 'tomato', x: 400, y: 150, w: 110, h: 90, color: '#e05a4e' },
  { id: 'pantry-cheese', label: 'CHEESE', kind: 'pantry', gives: 'cheese', x: 520, y: 150, w: 110, h: 90, color: '#f2d24b' },
  { id: 'pantry-fries', label: 'FRIES', kind: 'pantry', gives: 'friesRaw', x: 640, y: 150, w: 110, h: 90, color: '#f2c14e' },
  { id: 'grill', label: 'GRILL', kind: 'process', process: 'grill', accepts: ['patty'], x: 820, y: 150, w: 150, h: 90, color: '#5a5f6b' },
  { id: 'chopper', label: 'CHOP BOARD', kind: 'process', process: 'chop', accepts: ['lettuce', 'tomato'], x: 980, y: 150, w: 150, h: 90, color: '#a9805a' },
  { id: 'fryer', label: 'FRYER', kind: 'process', process: 'fry', accepts: ['friesRaw'], x: 1140, y: 150, w: 100, h: 90, color: '#4a6b8a' },
  { id: 'plate', label: 'PLATING', kind: 'plate', x: 820, y: 560, w: 180, h: 100, color: '#e8e2d4' },
  { id: 'serve', label: 'SERVE!', kind: 'serve', x: 1050, y: 560, w: 190, h: 100, color: '#3f9e5f' },
  { id: 'bin', label: 'BIN', kind: 'bin', x: 40, y: 560, w: 110, h: 100, color: '#7a7f88' },
];
export const FLOOR = { x: 20, y: 260, w: 1240, h: 280 };
