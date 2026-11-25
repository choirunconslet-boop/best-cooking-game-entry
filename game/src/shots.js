// Screenshot scenes for Sizzle & Serve, driven by ?shot=<name>.
// One file, one job: pose the real world into each named scene so a screenshot
// is a genuine render of the game's own code, not a mock-up.
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, createWorld, startShift } from './world.js';
import { makeOrder } from './world.js';

function seedOrders(world, recipeIds, patienceFrac) {
  world.orders = recipeIds.map((id) => {
    const o = makeOrder(2, world.time);
    o.recipeId = id;
    o.patience = 45 * patienceFrac;
    o.maxPatience = 45;
    return o;
  });
}

/** Pose `world` for the named shot and return the screen to draw. */
export function stageShot(name, world) {
  if (name === 'play' || name === 'serve' || name === 'end') {
    startShift(world);
    world.time = 42;
    world.timeLeft = 108;
    world.coins = 54;
    world.served = 3;
    world.streak = 2;
    world.bestStreak = 3;
    seedOrders(world, ['warung-burger', 'cheese-burger', 'combo'], 0.62);
    // Ingredients waiting on the counters: a grilled patty ready on the grill,
    // chopped lettuce ready on the board, fries frying.
    const grill = world.stations.find((s) => s.id === 'grill');
    grill.doneItem = 'pattyCooked';
    const chopper = world.stations.find((s) => s.id === 'chopper');
    chopper.doneItem = 'lettuceChopped';
    const fryer = world.stations.find((s) => s.id === 'fryer');
    fryer.busyItem = 'friesRaw';
    fryer.busyUntil = world.time + 2.0;
    fryer.progress = 0.5;
    world.chef.x = 900;
    world.chef.y = 400;
    if (name === 'serve') {
      // Dish mid-assembly finished: a full Warung Burger on the plate, chef
      // carrying nothing, standing at the serve window.
      world.plate = ['bun', 'pattyCooked', 'lettuceChopped'];
      world.chef.x = 1120;
      world.chef.y = 500;
      world.message = '✅ Warung Burger ready — SERVE IT!';
      world.messageUntil = world.time + 10;
      return { screen: SCREEN_PLAY };
    }
    if (name === 'end') {
      world.time = 150;
      world.timeLeft = 0;
      world.coins = 132;
      world.served = 7;
      world.screen = SCREEN_OVER;
      world.won = true;
      world.overReason = 'Shift complete! You earned 132 coins — target was 120.';
      return { screen: SCREEN_OVER };
    }
    // 'play': one dish mid-assembly on the plate, chef carrying a bun.
    world.plate = ['pattyCooked', 'lettuceChopped'];
    world.chef.carry = 'bun';
    world.chef.x = 860;
    world.chef.y = 480;
    world.message = 'Added to the plate';
    world.messageUntil = world.time + 10;
    return { screen: SCREEN_PLAY };
  }
  // Default: title screen over a fresh kitchen.
  const fresh = createWorld();
  Object.assign(world, fresh);
  world.screen = SCREEN_TITLE;
  return { screen: SCREEN_TITLE };
}
