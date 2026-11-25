// Canvas renderer for Sizzle & Serve — Warung Rush.
// One file, one job: draw the kitchen, the order board, the chef and the HUD.
import { FLOOR, VIEW } from './config.js';
import { INGREDIENTS, recipeById } from './recipes.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, nearestStation } from './world.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawIngredient(ctx, id, x, y, size) {
  const ing = INGREDIENTS[id];
  ctx.font = `${size}px "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ing.emoji, x, y + 2);
}

function drawStation(ctx, s, world, highlight) {
  const busy = !!s.busyItem;
  const done = !!s.doneItem;
  ctx.save();
  if (highlight) {
    ctx.shadowColor = '#ffd54a';
    ctx.shadowBlur = 18;
  }
  roundRect(ctx, s.x, s.y, s.w, s.h, 10);
  ctx.fillStyle = s.color;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 3;
  ctx.strokeStyle = highlight ? '#ffd54a' : 'rgba(0,0,0,0.35)';
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s.label, s.x + s.w / 2, s.y + 22);
  ctx.restore();

  if (s.kind === 'pantry') {
    drawIngredient(ctx, s.gives, s.x + s.w / 2, s.y + s.h / 2 + 12, 40);
  } else if (s.kind === 'process') {
    if (busy) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      roundRect(ctx, s.x + 12, s.y + s.h - 26, s.w - 24, 12, 6);
      ctx.fill();
      ctx.fillStyle = '#ffd54a';
      roundRect(ctx, s.x + 12, s.y + s.h - 26, (s.w - 24) * s.progress, 12, 6);
      ctx.fill();
      drawIngredient(ctx, s.busyItem, s.x + s.w / 2, s.y + s.h / 2 + 10, 36);
      if (s.process === 'grill' && world.time < world.sizzleUntil) {
        ctx.font = '20px sans-serif';
        ctx.fillText('💨', s.x + s.w / 2, s.y - 6);
      }
    } else if (done) {
      const bob = Math.sin(world.time * 6) * 4;
      drawIngredient(ctx, s.doneItem, s.x + s.w / 2, s.y + s.h / 2 + 8 + bob, 42);
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText('READY!', s.x + s.w / 2, s.y + s.h - 8);
    } else {
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(s.process === 'grill' ? '🔥' : s.process === 'fry' ? '🫧' : '🔪', s.x + s.w / 2, s.y + s.h / 2 + 22);
    }
  } else if (s.kind === 'plate') {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(s.x + s.w / 2, s.y + s.h / 2 + 14, 62, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c9c2b2';
    ctx.lineWidth = 2;
    ctx.stroke();
    world.plate.forEach((id, i) => {
      drawIngredient(ctx, id, s.x + s.w / 2 - 44 + i * 30, s.y + s.h / 2 + 4, 30);
    });
    if (!world.plate.length) {
      ctx.fillStyle = '#8a8474';
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillText('empty plate', s.x + s.w / 2, s.y + s.h / 2 + 18);
    }
  } else if (s.kind === 'serve') {
    ctx.font = '34px sans-serif';
    ctx.fillText('🛎️', s.x + s.w / 2, s.y + s.h / 2 + 24);
  } else if (s.kind === 'bin') {
    ctx.font = '34px sans-serif';
    ctx.fillText('🗑️', s.x + s.w / 2, s.y + s.h / 2 + 24);
  }
}

function drawOrderTicket(ctx, order, x, y, w, h) {
  const recipe = recipeById(order.recipeId);
  const frac = Math.max(0, order.patience / order.maxPatience);
  const urgent = frac < 0.35;
  ctx.save();
  if (urgent && Math.floor(order.patience * 2) % 2 === 0) ctx.translate(0, 2);
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = urgent ? '#ffe1de' : '#fff8e6';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = urgent ? '#d14a3e' : '#c9a86a';
  ctx.stroke();
  ctx.fillStyle = '#333';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(recipe.name, x + 10, y + 24);
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillStyle = '#8a6d1f';
  ctx.fillText(`🪙 ${recipe.coins}`, x + 10, y + 42);
  recipe.needs.forEach((id, i) => {
    drawIngredient(ctx, id, x + w - 18 - i * 30, y + 26, 24);
  });
  // Patience bar, kept clear of the coin line above it.
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  roundRect(ctx, x + 10, y + h - 12, w - 20, 8, 4);
  ctx.fill();
  ctx.fillStyle = frac > 0.5 ? '#4caf50' : frac > 0.25 ? '#ff9800' : '#e53935';
  roundRect(ctx, x + 10, y + h - 12, (w - 20) * frac, 8, 4);
  ctx.fill();
  ctx.restore();
}

function drawChef(ctx, world) {
  const c = world.chef;
  ctx.save();
  ctx.translate(c.x, c.y);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 18, 20, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body (apron) + head + chef hat.
  ctx.fillStyle = '#f5f5f5';
  roundRect(ctx, -15, -6, 30, 26, 10);
  ctx.fill();
  ctx.fillStyle = '#2f6fb2';
  roundRect(ctx, -15, 2, 30, 8, 4);
  ctx.fill();
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath();
  ctx.arc(0, -16, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-8, -26, 8, 0, Math.PI * 2);
  ctx.arc(0, -30, 9, 0, Math.PI * 2);
  ctx.arc(8, -26, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-11, -26, 22, 6);
  // Eyes look the way the chef faces.
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(-4 + c.facing * 2, -16, 1.8, 0, Math.PI * 2);
  ctx.arc(5 + c.facing * 2, -16, 1.8, 0, Math.PI * 2);
  ctx.fill();
  if (c.carry) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(0, -48, 16, 0, Math.PI * 2);
    ctx.fill();
    drawIngredient(ctx, c.carry, 0, -48, 26);
  }
  ctx.restore();
}

function drawHud(ctx, world) {
  const urgent = world.timeLeft <= 30 && world.screen === SCREEN_PLAY;
  ctx.fillStyle = '#23202a';
  ctx.fillRect(0, 0, VIEW.width, 52);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('🍳 SIZZLE & SERVE — Warung Rush', 16, 27);
  // Timer.
  const mm = Math.floor(world.timeLeft / 60);
  const ss = Math.floor(world.timeLeft % 60).toString().padStart(2, '0');
  ctx.textAlign = 'center';
  ctx.font = `bold ${urgent ? 32 : 26}px system-ui, sans-serif`;
  ctx.fillStyle = urgent ? '#ff5252' : '#ffd54a';
  ctx.fillText(`⏱ ${mm}:${ss}`, VIEW.width / 2, 27);
  // Coins / goal / missed.
  ctx.textAlign = 'right';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillStyle = '#ffd54a';
  ctx.fillText(`🪙 ${world.coins} / ${120}`, VIEW.width - 16, 18);
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillStyle = world.missed === 0 ? '#9be29b' : '#ff9a9a';
  ctx.fillText(`walk-outs ${'😠'.repeat(world.missed)}${'·'.repeat(3 - world.missed)}  streak ${world.streak}🔥`, VIEW.width - 16, 41);
}

export function render(ctx, world) {
  // Wall + floor.
  ctx.fillStyle = '#7fb069';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#f7ead7';
  ctx.fillRect(0, 52, VIEW.width, 100);
  ctx.fillStyle = '#e8d5b5';
  for (let x = 0; x < VIEW.width; x += 64) ctx.fillRect(x, 148, 60, 4);
  // Floor tiles.
  ctx.fillStyle = '#c98f5f';
  ctx.fillRect(FLOOR.x, FLOOR.y, FLOOR.w, FLOOR.h);
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 2;
  for (let x = FLOOR.x; x <= FLOOR.x + FLOOR.w; x += 62) {
    ctx.beginPath(); ctx.moveTo(x, FLOOR.y); ctx.lineTo(x, FLOOR.y + FLOOR.h); ctx.stroke();
  }
  for (let y = FLOOR.y; y <= FLOOR.y + FLOOR.h; y += 56) {
    ctx.beginPath(); ctx.moveTo(FLOOR.x, y); ctx.lineTo(FLOOR.x + FLOOR.w, y); ctx.stroke();
  }
  // Decor: hanging menu sign + plant.
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#5b3a1e';
  ctx.fillText('— WARUNG RUSH · TODAY\'S MENU —', VIEW.width / 2, 66);
  ctx.font = '28px sans-serif';
  ctx.fillText('🪴', 1230, 190);

  drawHud(ctx, world);

  // Order board tickets.
  const tw = 250; const gap = 14;
  const totalW = world.orders.length * tw + (world.orders.length - 1) * gap;
  let ox = (VIEW.width - Math.max(totalW, tw)) / 2;
  if (world.orders.length === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No orders yet — the lunch rush is coming…', VIEW.width / 2, 118);
  }
  world.orders.forEach((o) => {
    drawOrderTicket(ctx, o, ox, 76, tw, 66);
    ox += tw + gap;
  });

  const near = world.screen === SCREEN_PLAY ? nearestStation(world) : null;
  for (const s of world.stations) drawStation(ctx, s, world, near === s);
  if (near) {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    roundRect(ctx, near.x + near.w / 2 - 90, near.y - 30, 180, 22, 8);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText('Press E / click to use', near.x + near.w / 2, near.y - 15);
  }

  drawChef(ctx, world);

  // Controls hint.
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.font = '14px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Move: WASD / arrows · Use: E or Space or click · M: mute · R: restart', 16, VIEW.height - 12);
  ctx.textAlign = 'right';
  ctx.fillText('Goal: earn 120 coins before the shift ends!', VIEW.width - 16, VIEW.height - 12);

  // Toast message.
  if (world.message && world.time < world.messageUntil) {
    ctx.font = 'bold 20px system-ui, sans-serif';
    const w = ctx.measureText(world.message).width + 32;
    ctx.fillStyle = 'rgba(20,20,30,0.85)';
    roundRect(ctx, (VIEW.width - w) / 2, 480, w, 40, 12);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(world.message, VIEW.width / 2, 500);
  }

  if (world.screen === SCREEN_TITLE) {
    ctx.fillStyle = 'rgba(20,16,10,0.72)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd54a';
    ctx.font = 'bold 64px system-ui, sans-serif';
    ctx.fillText('🍳 SIZZLE & SERVE', VIEW.width / 2, 200);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillText('— Warung Rush —', VIEW.width / 2, 248);
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText('Run the lunch rush: grab ingredients, grill, chop and fry,', VIEW.width / 2, 310);
    ctx.fillText('stack each dish on the plate and serve it before the customer walks out.', VIEW.width / 2, 340);
    ctx.fillText('Earn 120 coins before the 2½-minute shift ends. 3 walk-outs and the warung empties!', VIEW.width / 2, 370);
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillStyle = '#ffd54a';
    ctx.fillText('WASD / arrows to move · E / Space / click to use a counter', VIEW.width / 2, 430);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText('Press ENTER or click to start the shift', VIEW.width / 2, 490);
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillStyle = '#ccc';
    ctx.fillText('Recipes: Warung Burger · Cheese Burger · Garden Stack · Burger Combo · Double Trouble', VIEW.width / 2, 540);
  }

  if (world.screen === SCREEN_OVER) {
    ctx.fillStyle = 'rgba(20,16,10,0.78)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = world.won ? '#7ee787' : '#ff8a80';
    ctx.font = 'bold 56px system-ui, sans-serif';
    ctx.fillText(world.won ? '🎉 SHIFT COMPLETE!' : '😖 SHIFT OVER', VIEW.width / 2, 230);
    ctx.fillStyle = '#fff';
    ctx.font = '22px system-ui, sans-serif';
    ctx.fillText(world.overReason, VIEW.width / 2, 290);
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText(`Coins: ${world.coins}   ·   Served: ${world.served}   ·   Best streak: ${world.bestStreak}🔥`, VIEW.width / 2, 350);
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillStyle = '#ffd54a';
    ctx.fillText('Press R or ENTER to play again', VIEW.width / 2, 420);
  }
}
