import {
  BubbleEntity,
  ButterflyEntity,
  CatRuntime,
  CushionEntity,
  FocusState,
  GiftBoxEntity,
  KittenSaveState,
  LanternEntity,
  LavenderPlantEntity,
  LoveNoteEntity,
  MonitorRect,
  OnboardingPhase,
  Particle,
  QuickWheelState,
  ShootingStarEntity,
  ToyEntity,
} from '../types/kitten';
import {
  drawDragonEggScene,
  drawLetterpadNote,
  getEggSceneLayout,
  getLetterpadRect,
} from './onboardingSprites';
import {
  drawFakeCursorProp,
  drawGiftBox,
  drawLavenderCushion,
  drawLavenderPlant,
  drawLoveNoteOverlay,
  drawMoonlightLantern,
  drawPixelButterfly,
  drawPixelCat,
  drawPixelSoapBubble,
  drawPixelToy,
  drawQuickWheel,
  drawShootingStar,
  drawStarBrushCursor,
  drawVioletLaserDot,
  getStageDimensions,
} from './sprites';

export interface OnboardingRenderState {
  phase: OnboardingPhase;
  animTime: number;
  hatchElapsed: number;
  hovered: boolean;
  primaryMonitor?: MonitorRect;
}

interface DirtyRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const prevDirtyByCtx = new WeakMap<
  CanvasRenderingContext2D,
  { width: number; height: number; rects: DirtyRect[] }
>();

function computeActiveDirtyRects(
  params: {
    width: number;
    height: number;
    scaleX: number;
    scaleY: number;
    cat: CatRuntime;
    dims: { width: number; height: number };
    toys: ToyEntity[];
    butterflies: ButterflyEntity[];
    bubbles: BubbleEntity[];
    cushion?: CushionEntity;
    plant?: LavenderPlantEntity;
    giftBox?: GiftBoxEntity;
    lantern?: LanternEntity;
    shootingStars: ShootingStarEntity[];
    loveNote?: LoveNoteEntity;
    particles: Particle[];
    focus: FocusState;
  },
): DirtyRect[] {
  const { width, height, scaleX, scaleY, cat, dims } = params;
  const rects: DirtyRect[] = [];
  const pushLogical = (lx: number, ly: number, lw: number, lh: number) => {
    const px = Math.max(0, Math.floor(lx * scaleX) - 4);
    const py = Math.max(0, Math.floor(ly * scaleY) - 4);
    const pw = Math.min(width - px, Math.ceil(lw * scaleX) + 8);
    const ph = Math.min(height - py, Math.ceil(lh * scaleY) + 8);
    if (pw > 0 && ph > 0) rects.push({ x: px, y: py, w: pw, h: ph });
  };

  // Generous box covering kitten, tall hats/wings, hold cursor prop, focus ring, and wide speech bubble
  const catPadX = params.focus.active || (cat.statusBubble && cat.statusBubbleTimer > 0) ? 140 : 64;
  const catPadTop = 90;
  pushLogical(cat.x - catPadX, cat.y - catPadTop, dims.width + catPadX * 2, dims.height + catPadTop + 28);

  for (const t of params.toys) {
    const r = t.radius + 20;
    pushLogical(t.x - r, t.y - r, r * 2, r * 2);
  }
  for (const b of params.butterflies) {
    pushLogical(b.x - 24, b.y - 24, 48, 48);
  }
  for (const b of params.bubbles) {
    const r = b.radius + 10;
    pushLogical(b.x - r, b.y - r, r * 2, r * 2);
  }
  for (const s of params.shootingStars) {
    pushLogical(s.x - 84, s.y - 84, 168, 168);
  }
  if (params.cushion?.active) pushLogical(params.cushion.x - 48, params.cushion.y - 32, 96, 40);
  if (params.plant?.active) pushLogical(params.plant.x - 28, params.plant.y - 44, 56, 50);
  if (params.giftBox?.active) pushLogical(params.giftBox.x - 32, params.giftBox.y - 42, 64, 50);
  if (params.lantern?.active) pushLogical(params.lantern.x - 80, params.lantern.y - 96, 160, 120);
  if (params.loveNote?.active) pushLogical(params.loveNote.x - 125, params.loveNote.y - 115, 250, 130);
  for (const p of params.particles) {
    const r = (p.size ?? 14) + 18;
    pushLogical(p.x - r, p.y - r, r * 2, r * 2);
  }
  return rects;
}

export function stepAndDrawOverlay(params: {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  dt: number;
  cat: CatRuntime;
  save: KittenSaveState;
  toys: ToyEntity[];
  butterflies?: ButterflyEntity[];
  bubbles?: BubbleEntity[];
  cushion?: CushionEntity;
  plant?: LavenderPlantEntity;
  giftBox?: GiftBoxEntity;
  lantern?: LanternEntity;
  shootingStars?: ShootingStarEntity[];
  laserActive?: boolean;
  brushActive?: boolean;
  quickWheel?: QuickWheelState;
  wheelBounds?: { x: number; y: number; width: number; height: number };
  loveNote?: LoveNoteEntity;
  particles: Particle[];
  focus: FocusState;
  isHudOpen: boolean;
  cursorX?: number;
  cursorY?: number;
  onboarding?: OnboardingRenderState;
}) {
  const {
    ctx,
    width,
    height,
    scaleX,
    scaleY,
    dt,
    cat,
    save,
    toys,
    butterflies = [],
    bubbles = [],
    cushion,
    plant,
    giftBox,
    lantern,
    shootingStars = [],
    laserActive = false,
    brushActive = false,
    quickWheel,
    wheelBounds,
    loveNote,
    particles,
    focus,
    cursorX,
    cursorY,
    onboarding,
  } = params;
  const phase = onboarding?.phase ?? 'done';
  const dims = getStageDimensions(save.stage, save.settings.spriteScale);
  const canDirtyClear =
    phase === 'done' &&
    !laserActive &&
    !brushActive &&
    !quickWheel?.active &&
    !toys.some((t) => t.heldBy === 'tease');

  const prevDirty = prevDirtyByCtx.get(ctx);
  const currRects = canDirtyClear
    ? computeActiveDirtyRects({
        width,
        height,
        scaleX,
        scaleY,
        cat,
        dims,
        toys,
        butterflies,
        bubbles,
        cushion,
        plant,
        giftBox,
        lantern,
        shootingStars,
        loveNote,
        particles,
        focus,
      })
    : null;

  if (
    currRects &&
    prevDirty &&
    prevDirty.width === width &&
    prevDirty.height === height &&
    prevDirty.rects.length <= 48 &&
    currRects.length <= 48
  ) {
    for (const r of prevDirty.rects) {
      ctx.clearRect(r.x, r.y, r.w, r.h);
    }
    for (const r of currRects) {
      ctx.clearRect(r.x, r.y, r.w, r.h);
    }
    prevDirtyByCtx.set(ctx, { width, height, rects: currRects });
  } else {
    ctx.clearRect(0, 0, width, height);
    if (currRects && currRects.length <= 48) {
      prevDirtyByCtx.set(ctx, { width, height, rects: currRects });
    } else {
      prevDirtyByCtx.delete(ctx);
    }
  }

  ctx.save();
  ctx.scale(scaleX, scaleY);
  ctx.imageSmoothingEnabled = false;

  if (phase === 'loading') {
    ctx.restore();
    return;
  }

  // Render active onboarding prop before foreground particles
  if (phase === 'letterpad') {
    const rect = getLetterpadRect(onboarding?.primaryMonitor);
    const userName = (save.settings.userName ?? 'Jane').trim() || 'Jane';
    drawLetterpadNote(ctx, rect, {
      userName,
      animTime: onboarding?.animTime ?? 0,
      hovered: Boolean(onboarding?.hovered),
    });
  } else if (phase === 'egg_basket' || phase === 'egg_hatching') {
    const layout = getEggSceneLayout(onboarding?.primaryMonitor);
    drawDragonEggScene(ctx, layout, {
      animTime: onboarding?.animTime ?? 0,
      hovered: Boolean(onboarding?.hovered),
      showBasket: phase === 'egg_basket',
      hatchElapsed: onboarding?.hatchElapsed ?? 0,
    });
  }

  // Update and render particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life += dt;
    if (p.life >= p.maxLife) {
      particles.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.kind === 'shell') {
      p.vy += 420 * dt;
      if (typeof p.rotation === 'number' && typeof p.vRot === 'number') {
        p.rotation += p.vRot * dt;
      }
    } else if (p.kind === 'smoke') {
      p.vx *= 1 - Math.min(0.9, dt * 2.2);
      p.vy *= 1 - Math.min(0.9, dt * 1.4);
    }
    p.alpha = Math.max(0, 1 - p.life / p.maxLife);
    drawParticle(ctx, p);
  }

  if (phase !== 'done' && phase !== 'naming') {
    ctx.restore();
    return;
  }

  // Render tossed & held toys (yarn, fish, macaron, boba, cake)
  for (const toy of toys) {
    if (toy.heldBy === 'tease' && typeof cursorX === 'number' && typeof cursorY === 'number') {
      ctx.save();
      ctx.strokeStyle = toy.color || '#a682e8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(Math.round(cursorX), Math.round(cursorY));
      ctx.lineTo(Math.round(toy.x), Math.round(toy.y));
      ctx.stroke();
      ctx.restore();
    }
    drawPixelToy(ctx, toy.kind, toy.x, toy.y, toy.rotation, toy.color);
  }

  // Render shooting stars across upper desktop sky
  for (const star of shootingStars) {
    drawShootingStar(ctx, star);
  }

  // Render placeable Lavender Cushion, Potted Lavender, Moonlight Lantern & Purple Gift Box
  if (cushion?.active) {
    drawLavenderCushion(ctx, cushion.x, cushion.y);
  }
  if (plant?.active) {
    drawLavenderPlant(ctx, plant.x, plant.y, cat.animTime, plant.swayTimer);
  }
  if (lantern?.active) {
    drawMoonlightLantern(ctx, lantern, cat.animTime);
  }
  if (giftBox?.active) {
    drawGiftBox(ctx, giftBox, save.coat, cat.animTime);
  }

  // Render floating Lavender Soap Bubbles
  for (const bubble of bubbles) {
    drawPixelSoapBubble(ctx, bubble);
  }

  // Render fluttering desktop butterflies / fireflies
  for (const b of butterflies) {
    drawPixelButterfly(ctx, b);
  }

  // Render Violet Laser Dot or Star Brush at cursor
  if (laserActive && typeof cursorX === 'number' && typeof cursorY === 'number') {
    drawVioletLaserDot(ctx, cursorX, cursorY, cat.animTime);
  }
  if (brushActive && typeof cursorX === 'number' && typeof cursorY === 'number') {
    drawStarBrushCursor(ctx, cursorX, cursorY, cat.animTime);
  }

  // Subtle Focus / Pomodoro progress ring behind/around sleeping cat
  if (focus.active && focus.totalSeconds > 0) {
    const cx = Math.round(cat.x + dims.width / 2);
    const cy = Math.round(cat.y + dims.height / 2);
    const r = Math.max(dims.width, dims.height) * 0.62;
    const progress = 1 - focus.remainingSeconds / focus.totalSeconds;

    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(46, 31, 71, 0.24)';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#8d63d9';
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
    ctx.stroke();
    ctx.restore();
  }

  // Soft pixel shadow + sprite (skip when hidden inside gift box!)
  const hiddenInBox = cat.state === 'box_hide' && Boolean(giftBox?.active && giftBox.occupied);
  if (!hiddenInBox) {
    if (cat.grounded) {
      ctx.fillStyle = 'rgba(20, 15, 12, 0.22)';
      ctx.fillRect(
        Math.round(cat.x + 6),
        Math.round(cat.y + dims.height - 2),
        Math.round(dims.width - 12),
        4,
      );
    }

    // Draw the pixel cat!
    drawPixelCat(ctx, {
      x: cat.x,
      y: cat.y,
      facing: cat.facing,
      stage: save.stage,
      coat: save.coat,
      accessory: save.equippedAccessory,
      state: cat.state,
      animTime: cat.animTime,
      pixelScale: save.settings.spriteScale,
      blush: cat.blushTimer > 0,
      slowBlink: (cat.slowBlinkTimer ?? 0) > 0,
      pokeStreak: cat.pokeStreak,
      cuddledYarnColor: cat.cuddledYarnColor,
    });
  }

  // Visual-only cursor hold prop
  if (cat.state === 'hold_cursor' && save.settings.cursorHoldMode === 'visual_only') {
    const px = cat.x + (cat.facing === 1 ? dims.width - 2 : -14);
    const py = cat.y + dims.height * 0.45;
    drawFakeCursorProp(ctx, px, py);
  }

  // Tiny pixel speech / status bubble (evolution, achievement, study buddy, focus!)
  if (cat.statusBubble && cat.statusBubbleTimer > 0) {
    drawPixelBubble(ctx, cat.x + dims.width / 2, cat.y - 10, cat.statusBubble);
  } else if (focus.active) {
    const mins = Math.floor(focus.remainingSeconds / 60);
    const secs = Math.floor(focus.remainingSeconds % 60);
    const label = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    drawPixelBubble(ctx, cat.x + dims.width / 2, cat.y - 10, label);
  }

  if (quickWheel?.active) {
    drawQuickWheel(
      ctx,
      quickWheel,
      wheelBounds ?? {
        x: 0,
        y: 0,
        width: width / Math.max(0.1, scaleX),
        height: height / Math.max(0.1, scaleY),
      },
    );
  }

  if (loveNote?.active) {
    drawLoveNoteOverlay(ctx, loveNote, cat.animTime);
  }

  ctx.restore();
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.save();
  ctx.globalAlpha = p.alpha;
  const x = Math.round(p.x);
  const y = Math.round(p.y);

  switch (p.kind) {
    case 'paw': {
      ctx.fillStyle = 'rgba(42, 30, 26, 0.45)';
      ctx.fillRect(x - 2, y, 4, 3);
      ctx.fillRect(x - 3, y - 2, 2, 2);
      ctx.fillRect(x + 1, y - 2, 2, 2);
      break;
    }
    case 'dust': {
      ctx.fillStyle = '#e7dfd0';
      ctx.fillRect(x - 3, y - 2, 6, 4);
      ctx.fillStyle = '#c5b8a3';
      ctx.fillRect(x - 1, y - 4, 3, 2);
      break;
    }
    case 'heart': {
      const s = 2;
      const c = '#d94862';
      ctx.fillStyle = c;
      ctx.fillRect(x - 3 * s, y - 2 * s, 2 * s, 2 * s);
      ctx.fillRect(x + 1 * s, y - 2 * s, 2 * s, 2 * s);
      ctx.fillRect(x - 3 * s, y - 1 * s, 6 * s, 2 * s);
      ctx.fillRect(x - 2 * s, y + 1 * s, 4 * s, 1 * s);
      ctx.fillRect(x - 1 * s, y + 2 * s, 2 * s, 1 * s);
      break;
    }
    case 'sparkle': {
      ctx.fillStyle = p.color || '#f6c844';
      ctx.fillRect(x - 1, y - 5, 2, 10);
      ctx.fillRect(x - 5, y - 1, 10, 2);
      ctx.fillStyle = '#fff9f0';
      ctx.fillRect(x - 1, y - 1, 2, 2);
      break;
    }
    case 'note': {
      const glyph = p.glyph || '🎵';
      ctx.font = 'bold 16px "Segoe UI Emoji", "Segoe UI Symbol", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = p.color || '#ff5c8a';
      ctx.fillText(glyph, x, y);
      break;
    }
    case 'moon': {
      ctx.fillStyle = '#f5cb5c';
      ctx.fillRect(x - 3, y - 4, 5, 8);
      ctx.clearRect(x - 1, y - 2, 4, 4);
      break;
    }
    case 'zzz': {
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = '#1e1714';
      ctx.fillText('Z', x + 1, y + 1);
      ctx.fillStyle = '#faf3e4';
      ctx.fillText('Z', x, y);
      break;
    }
    case 'petal': {
      ctx.fillStyle = p.color || '#ff9ebb';
      ctx.fillRect(x - 2, y - 1, 4, 3);
      ctx.fillStyle = '#fff5f8';
      ctx.fillRect(x - 1, y - 1, 2, 1);
      break;
    }
    case 'boop': {
      ctx.fillStyle = '#ff4d88';
      ctx.fillRect(x - 1, y - 6, 3, 6);
      ctx.fillRect(x - 1, y + 2, 3, 3);
      ctx.fillStyle = '#fff0f5';
      ctx.fillRect(x, y - 5, 1, 4);
      break;
    }
    case 'smoke': {
      const grow = 1 + (p.life / Math.max(0.01, p.maxLife)) * 0.45;
      const r = Math.max(6, Math.round((p.size ?? 14) * grow));
      ctx.fillStyle = p.color || '#efe7fb';
      ctx.fillRect(x - r, y - Math.round(r * 0.65), r * 2, Math.round(r * 1.3));
      ctx.fillRect(x - Math.round(r * 0.65), y - r, Math.round(r * 1.3), r * 2);
      ctx.fillStyle = '#fffdf9';
      ctx.fillRect(x - Math.round(r * 0.45), y - Math.round(r * 0.5), Math.round(r * 0.8), Math.round(r * 0.6));
      break;
    }
    case 'shell': {
      const s = p.size ?? 6;
      ctx.translate(x, y);
      if (typeof p.rotation === 'number') {
        ctx.rotate(p.rotation);
      }
      ctx.fillStyle = '#2e1f47';
      ctx.fillRect(-s - 1, -s - 1, s * 2 + 2, s * 2 + 2);
      ctx.fillStyle = p.color || '#e5d4fa';
      ctx.fillRect(-s, -s, s * 2, s * 2);
      ctx.fillStyle = '#fffdf9';
      ctx.fillRect(-s, -s, s, Math.max(2, Math.floor(s * 0.6)));
      break;
    }
  }
  ctx.restore();
}

function drawPixelBubble(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  bottomY: number,
  text: string,
) {
  ctx.save();
  ctx.font = 'bold 11px "Cascadia Mono", Consolas, monospace';
  const padX = 8;
  const textW = Math.ceil(ctx.measureText(text).width);
  const w = textW + padX * 2;
  const h = 22;
  const bx = Math.round(centerX - w / 2);
  const by = Math.round(bottomY - h);

  ctx.fillStyle = '#2e1f47';
  ctx.fillRect(bx - 2, by, w + 4, h);
  ctx.fillRect(bx, by - 2, w, h + 4);
  ctx.fillStyle = '#fbf8ff';
  ctx.fillRect(bx, by, w, h);

  // Little pointer triangle
  ctx.fillStyle = '#2e1f47';
  ctx.fillRect(Math.round(centerX - 3), by + h + 2, 6, 2);
  ctx.fillRect(Math.round(centerX - 1), by + h + 4, 2, 2);
  ctx.fillStyle = '#fbf8ff';
  ctx.fillRect(Math.round(centerX - 2), by + h, 4, 2);

  ctx.fillStyle = '#2e1f47';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, bx + padX, by + h / 2 + 0.5);
  ctx.restore();
}
