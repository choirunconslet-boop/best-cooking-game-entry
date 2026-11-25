// Keyboard + mouse input for Sizzle & Serve.
// One file, one job: turn keys and clicks into movement and "use" actions.
export function createInput(canvas, onUse, onStart, onMute) {
  const keys = new Set();
  const input = { moveX: 0, moveY: 0, useQueued: false };

  function recompute() {
    input.moveX = (keys.has('ArrowRight') || keys.has('KeyD') ? 1 : 0)
      - (keys.has('ArrowLeft') || keys.has('KeyA') ? 1 : 0);
    input.moveY = (keys.has('ArrowDown') || keys.has('KeyS') ? 1 : 0)
      - (keys.has('ArrowUp') || keys.has('KeyW') ? 1 : 0);
  }

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    keys.add(e.code);
    if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') {
      input.useQueued = true;
      onUse();
    }
    if (e.code === 'KeyM') onMute();
    if (e.code === 'Enter') onStart();
    recompute();
  });
  window.addEventListener('keyup', (e) => { keys.delete(e.code); recompute(); });
  window.addEventListener('blur', () => { keys.clear(); recompute(); });

  // Click = use the station under the cursor (or start on the title screen).
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    onUse(x, y);
  });

  return input;
}
