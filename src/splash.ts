import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

interface LoadingPayload {
  progress: number;
  status: string;
}

const statusEl = document.getElementById('splash-status');
const pctEl = document.getElementById('splash-pct');
const fillEl = document.getElementById('splash-fill');
const cardEl = document.querySelector('.splash-card');
const canvas = document.getElementById('kitten-loader-canvas') as HTMLCanvasElement | null;

let currentProgress = 12;

function applyProgress(progress: number, status: string) {
  const clamped = Math.max(currentProgress, Math.min(100, Math.round(progress)));
  currentProgress = clamped;
  if (fillEl) fillEl.style.width = `${clamped}%`;
  if (pctEl) pctEl.textContent = `${clamped}%`;
  if (statusEl && status) statusEl.textContent = status;
  if (cardEl) cardEl.setAttribute('aria-valuenow', String(clamped));
}

// Tiny 14x12 pixel kitten icon (2x scaled on 32x28 canvas)
const SPRITE: string[] = [
  '..oo......oo..',
  '.oeeo....oeeo.',
  '.oepo....opeo.',
  '.oeeeeeeeeeeo.',
  '.oeekeeeekeeo.',
  '.oopeeeeeeepo.',
  '..oeeeeeeeeo..',
  '..ooorrrrooo..',
  '..oeeeeeeeeo..',
  '..oeooooooeeo.',
  '..oo......oo..',
];

const PALETTE: Record<string, string> = {
  o: '#2e1f47',
  e: '#f2a44c',
  p: '#f48fa8',
  k: '#1e1714',
  r: '#d44b5a',
};

if (canvas) {
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = false;
    let frame = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bob = frame % 2 === 0 ? 0 : -2;
      const ox = 2;
      const oy = 4 + bob;
      for (let row = 0; row < SPRITE.length; row++) {
        const line = SPRITE[row];
        for (let col = 0; col < line.length; col++) {
          const ch = line[col];
          const color = PALETTE[ch];
          if (!color) continue;
          ctx.fillStyle = color;
          ctx.fillRect(ox + col * 2, oy + row * 2, 2, 2);
        }
      }
      frame++;
    };
    draw();
    window.setInterval(draw, 220);
  }
}

// Gentle baseline animation so the bar feels alive even before the first IPC message arrives
const baselineTimer = window.setInterval(() => {
  if (currentProgress < 28) {
    applyProgress(currentProgress + 4, statusEl?.textContent || 'Starting Kitten...');
  }
}, 140);

if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
  void listen<LoadingPayload>('kitten://loading-progress', (event) => {
    const { progress, status } = event.payload;
    if (progress >= 100) {
      window.clearInterval(baselineTimer);
    }
    applyProgress(progress, status);
  });

  void invoke<LoadingPayload>('get_loading_state')
    .then((state) => {
      if (state) {
        applyProgress(state.progress, state.status);
      }
    })
    .catch(() => {});
}
