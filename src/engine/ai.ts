import {
  BubbleEntity,
  ButterflyEntity,
  CatRuntime,
  CushionEntity,
  DesktopSnapshot,
  FeatherWandState,
  FocusState,
  GiftBoxEntity,
  KittenSaveState,
  LanternEntity,
  LavenderPlantEntity,
  MonitorRect,
  Particle,
  ShootingStarEntity,
  ToyEntity,
  WalkableLedge,
} from '../types/kitten';
import {
  clampXToVirtualDesktop,
  computeJumpVelocity,
  findAdjacentTaskbarLedge,
  findLandingLedge,
  findMonitorForPoint,
  getGroundYAt,
  GRAVITY,
} from './physics';
import { applyXpAndEvaluate, formatAppLabel, pushTimelineEntry } from './progression';
import { kittenAudio } from './sound';
import { getStageDimensions } from './sprites';

export interface StepResult {
  holdCursorTarget: { active: boolean; x: number; y: number } | null;
  evolvedLabel?: string;
  achievementBanner?: string;
  mementoBanner?: string;
}

function recordProgressionFeedback(
  ev: ReturnType<typeof applyXpAndEvaluate>,
  result: StepResult,
): void {
  if (ev.evolvedTo) result.evolvedLabel = ev.evolvedTo;
  if (ev.unlockedAchievements[0]) result.achievementBanner = ev.unlockedAchievements[0].title;
  if (ev.unlockedMementos[0]) result.mementoBanner = ev.unlockedMementos[0].title;
}

const MUSIC_GLYPHS = ['🎵', '🎶', '♪', '♫'];
const MUSIC_COLORS = ['#ff5c8a', '#a855f7', '#ec4899', '#3b82f6'];

function addParticle(
  particles: Particle[],
  p: Omit<Particle, 'id' | 'life' | 'alpha'>,
) {
  if (particles.length > 80) particles.shift();
  particles.push({
    ...p,
    id: `${p.kind}-${Math.random().toString(36).slice(2, 7)}`,
    life: 0,
    alpha: 1,
  });
}

function spawnLandingDust(particles: Particle[], x: number, y: number, width: number) {
  for (let i = -1; i <= 1; i += 2) {
    addParticle(particles, {
      kind: 'dust',
      x: x + width / 2 + i * 10,
      y: y - 4,
      vx: i * 28,
      vy: -14,
      maxLife: 0.4,
    });
  }
}

export function spawnYarnVanishParticles(particles: Particle[], x: number, y: number, color?: string) {
  for (let i = 0; i < 4; i++) {
    const angle = (Math.PI * 2 * i) / 4;
    addParticle(particles, {
      kind: i % 2 === 0 ? 'sparkle' : 'petal',
      x,
      y,
      vx: Math.cos(angle) * 32,
      vy: Math.sin(angle) * 24 - 16,
      maxLife: 0.75,
      color: color || '#ff85b3',
    });
  }
}

export function isLateNightHour(): boolean {
  const h = new Date().getHours();
  return h >= 23 || h < 5;
}

/**
 * Caps a single jump upward rise to half the height of the active monitor (no superjumps).
 */
function getMaxJumpRise(snapshot: DesktopSnapshot, x: number, y: number): number {
  const mon = findMonitorForPoint(snapshot.monitors, x, y) ?? snapshot.monitors[0];
  return Math.max(180, (mon?.height ?? 1080) * 0.5);
}

/**
 * Plays a warm startup greeting when the app opens, addressed to the configured user name.
 */
export function triggerGreeting(
  cat: CatRuntime,
  save: KittenSaveState,
  particles: Particle[],
): void {
  const name = (save.settings.userName ?? 'Jane').trim() || 'Jane';
  const dims = getStageDimensions(save.stage, save.settings.spriteScale);
  const cx = cat.x + dims.width / 2;

  cat.state = 'celebrate';
  cat.stateTimer = 1.6;
  cat.blushTimer = 3.2;
  cat.vx = 0;
  cat.statusBubble = `Hi ${name}! ♥`;
  cat.statusBubbleTimer = 4.2;

  kittenAudio.setStage(save.stage);
  kittenAudio.playMew();

  addParticle(particles, {
    kind: 'heart',
    x: cx,
    y: cat.y - 6,
    vx: 0,
    vy: -26,
    maxLife: 1.2,
  });
  addParticle(particles, {
    kind: 'petal',
    x: cx + 12,
    y: cat.y,
    vx: 16,
    vy: -22,
    maxLife: 1.2,
    color: '#c8a6f7',
  });
}

/**
 * Triggers a playful poke/boop reaction on the kitten.
 */
export function triggerPokeCat(
  cat: CatRuntime,
  save: KittenSaveState,
  particles: Particle[],
): { evolvedLabel?: string; achievementBanner?: string } {
  const now = Date.now();
  cat.pokeStreak = now - cat.lastPokeAt < 2400 ? Math.min(5, cat.pokeStreak + 1) : 1;
  cat.lastPokeAt = now;

  const dims = getStageDimensions(save.stage, save.settings.spriteScale);
  const cx = cat.x + dims.width / 2;

  cat.cuddledYarnColor = null;
  cat.state = 'poked';
  cat.stateTimer = 0.72;
  cat.blushTimer = 2.0;
  cat.vx = 0;
  if (cat.grounded) {
    cat.vy = -135;
    cat.grounded = false;
  }

  kittenAudio.setStage(save.stage);
  kittenAudio.playPoke(cat.pokeStreak);
  if (cat.pokeStreak === 1) {
    kittenAudio.playMew();
  }

  addParticle(particles, {
    kind: 'boop',
    x: cx + cat.facing * 12,
    y: cat.y - 6,
    vx: cat.facing * 14,
    vy: -32,
    maxLife: 0.7,
  });
  addParticle(particles, {
    kind: cat.pokeStreak >= 3 ? 'sparkle' : 'petal',
    x: cx - 10,
    y: cat.y + 4,
    vx: -18,
    vy: -24,
    maxLife: 0.85,
    color: '#ff85b3',
  });

  cat.statusBubble =
    cat.pokeStreak >= 3 ? 'Hey! >_<' : cat.pokeStreak === 2 ? 'Mep?!' : 'Meow!';
  cat.statusBubbleTimer = 1.1;

  save.stats.pokesCount += 1;
  save.bond = Math.min(100, save.bond + 2);
  save.energy = Math.min(100, save.energy + 3);
  const ev = applyXpAndEvaluate(save, 6);
  return {
    evolvedLabel: ev.evolvedTo,
    achievementBanner: ev.unlockedAchievements[0]?.title,
  };
}

function selectTargetToy(
  toys: ToyEntity[],
  catCenterX: number,
  catBottomY: number,
): ToyEntity | null {
  if (toys.length === 0) return null;
  const held = toys.filter((t) => t.heldBy != null);
  const pool = held.length > 0 ? held : toys;
  let best = pool[0];
  let bestDist = Math.hypot(best.x - catCenterX, best.y - catBottomY);
  for (let i = 1; i < pool.length; i++) {
    const d = Math.hypot(pool[i].x - catCenterX, pool[i].y - catBottomY);
    if (d < bestDist) {
      bestDist = d;
      best = pool[i];
    }
  }
  return best;
}

function jumpDownFromPerch(
  cat: CatRuntime,
  save: KittenSaveState,
  fromCenterX: number,
  fromBottomY: number,
  toX: number,
  toY: number,
) {
  cat.ignoreLedgeHwnd = cat.perchedHwnd;
  cat.ignoreLedgeUntilY = fromBottomY + 18;
  const { vx, vy } = computeJumpVelocity(fromCenterX, fromBottomY, toX, toY, 28);
  cat.state = 'jump';
  cat.vx = vx;
  cat.vy = vy;
  cat.facing = vx >= 0 ? 1 : -1;
  cat.grounded = false;
  cat.perchedHwnd = null;
  cat.perchedAppTitle = null;
  save.stats.jumpsCount += 1;
  kittenAudio.playJump();
}

function isMusicActiveOnDesktop(snapshot: DesktopSnapshot, currentLedge?: WalkableLedge): boolean {
  if (snapshot.isAudioPlaying) return true;
  if (currentLedge?.isMedia) return true;
  return snapshot.windows.some((w) => w.isMedia && w.isForeground);
}

export function stepCatAI(params: {
  dt: number;
  cat: CatRuntime;
  save: KittenSaveState;
  snapshot: DesktopSnapshot;
  ledges: WalkableLedge[];
  toys: ToyEntity[];
  particles: Particle[];
  focus: FocusState;
  isBusyUser: boolean;
  isDraggingCat: boolean;
  butterflies?: ButterflyEntity[];
  bubbles?: BubbleEntity[];
  cushion?: CushionEntity;
  featherWand?: FeatherWandState;
  plant?: LavenderPlantEntity;
  giftBox?: GiftBoxEntity;
  lantern?: LanternEntity;
  laserActive?: boolean;
  popComboRef?: { count: number };
}): StepResult {
  const {
    dt,
    cat,
    save,
    snapshot,
    ledges,
    toys,
    particles,
    focus,
    isBusyUser,
    isDraggingCat,
    butterflies = [],
    bubbles = [],
    cushion,
    featherWand,
    plant,
    giftBox,
    lantern,
    laserActive = false,
    popComboRef,
  } = params;
  const dims = getStageDimensions(save.stage, save.settings.spriteScale);
  const result: StepResult = { holdCursorTarget: null };

  kittenAudio.enabled = save.settings.soundEnabled;
  kittenAudio.volume = save.settings.volume;
  kittenAudio.setStage(save.stage);
  kittenAudio.style = save.settings.soundStyle ?? 'chiptune';

  cat.animTime += dt;
  cat.holdCooldown = Math.max(0, cat.holdCooldown - dt);
  cat.pawPrintCooldown = Math.max(0, cat.pawPrintCooldown - dt);
  cat.particleCooldown = Math.max(0, cat.particleCooldown - dt);
  cat.yarnReachHopCooldown = Math.max(0, cat.yarnReachHopCooldown - dt);
  cat.yarnCatchCooldown = Math.max(0, cat.yarnCatchCooldown - dt);
  cat.blushTimer = Math.max(0, cat.blushTimer - dt);
  cat.meowCooldown = Math.max(0, cat.meowCooldown - dt);

  if (cat.statusBubbleTimer > 0) {
    cat.statusBubbleTimer = Math.max(0, cat.statusBubbleTimer - dt);
    if (cat.statusBubbleTimer === 0) cat.statusBubble = null;
  }

  // Passive treat decay (very gentle, never punishes)
  save.treats = Math.max(10, save.treats - dt * 0.14);

  // Focus timer mode overrides wandering: perch on foreground/nearby window and nap!
  if (focus.active && !isDraggingCat) {
    if (cat.state !== 'sleep' && cat.state !== 'jump' && cat.state !== 'fall') {
      const fgLedge = ledges.find((l) => l.isForeground) ?? ledges[0];
      if (fgLedge && cat.perchedHwnd !== fgLedge.hwnd && Math.abs(cat.y + dims.height - fgLedge.y) > 12) {
        const destX = (fgLedge.startX + fgLedge.endX) / 2 - dims.width / 2;
        const { vx, vy } = computeJumpVelocity(cat.x, cat.y + dims.height, destX, fgLedge.y);
        cat.state = 'jump';
        cat.vx = vx;
        cat.vy = vy;
        cat.facing = vx >= 0 ? 1 : -1;
        cat.grounded = false;
        cat.targetLedge = fgLedge;
      } else {
        cat.state = 'sleep';
        cat.vx = 0;
        cat.stateTimer = 2;
      }
    }
  }

  // Carried by mouse drag
  if (isDraggingCat) {
    cat.cuddledYarnColor = null;
    cat.state = 'carried';
    cat.grounded = false;
    cat.perchedHwnd = null;
    cat.ignoreLedgeHwnd = null;
    cat.vx = 0;
    cat.vy = 0;
    return result;
  }

  // Keep perched cat riding smoothly on moved OS windows
  if (cat.grounded && cat.perchedHwnd != null) {
    const win = snapshot.windows.find((w) => w.hwnd === cat.perchedHwnd);
    const matchingLedge = ledges.find((l) => l.hwnd === cat.perchedHwnd);
    if (win && matchingLedge) {
      const dxWindow = matchingLedge.y - cat.perchedWindowY;
      cat.y += dxWindow;
      cat.perchedWindowY = matchingLedge.y;
      cat.x = Math.max(
        matchingLedge.startX - 4,
        Math.min(matchingLedge.endX - dims.width + 4, win.x + cat.perchedOffsetX),
      );
      cat.perchedOffsetX = cat.x - win.x;
    } else {
      // Window was closed, minimized, or covered: drop with gravity!
      cat.perchedHwnd = null;
      cat.perchedAppTitle = null;
      cat.grounded = false;
      cat.state = 'fall';
      cat.vy = 0;
    }
  }

  // Check if a toy (or held yarn!) is nearby and reachable
  const targetToy = selectTargetToy(toys, cat.x + dims.width / 2, cat.y + dims.height);
  if (targetToy && targetToy.kind === 'yarn' && !targetToy.heldBy) {
    targetToy.playTime = (targetToy.playTime ?? 0) + dt;
  }

  const canPursueInteractive =
    !focus.active &&
    cat.state !== 'eat' &&
    cat.state !== 'hold_cursor' &&
    cat.state !== 'petted' &&
    cat.state !== 'poked' &&
    cat.state !== 'cuddle_yarn' &&
    cat.state !== 'celebrate' &&
    cat.state !== 'jump' &&
    cat.state !== 'fall' &&
    cat.state !== 'trick_spin' &&
    cat.state !== 'trick_highfive' &&
    cat.state !== 'trick_flip' &&
    cat.state !== 'zoomies' &&
    cat.state !== 'roll_wiggle' &&
    cat.state !== 'box_hide' &&
    cat.state !== 'peek';

  // Violet Laser Pointer chase takes top interactive priority when toggled on!
  if (canPursueInteractive && laserActive) {
    const catCenterX = cat.x + dims.width / 2;
    const catBottomY = cat.y + dims.height;
    const dx = snapshot.cursorX - catCenterX;
    const dy = snapshot.cursorY - catBottomY;
    const dist = Math.hypot(dx, dy);

    if (dist < 38 && cat.yarnCatchCooldown <= 0) {
      cat.facing = dx >= 0 ? 1 : -1;
      cat.state = 'celebrate';
      cat.stateTimer = 0.75;
      cat.vx = 0;
      cat.blushTimer = 1.6;
      cat.yarnCatchCooldown = 1.5;
      cat.statusBubble = 'Got the dot! ✨';
      cat.statusBubbleTimer = 1.3;
      save.stats.laserPounces = (save.stats.laserPounces ?? 0) + 1;
      save.bond = Math.min(100, save.bond + 3);
      kittenAudio.playCatch();
      kittenAudio.playMew();
      addParticle(particles, {
        kind: 'sparkle',
        x: snapshot.cursorX,
        y: snapshot.cursorY,
        vx: 0,
        vy: -20,
        maxLife: 0.7,
        color: '#c8a6f7',
      });
      recordProgressionFeedback(applyXpAndEvaluate(save, 10), result);
    } else if (cat.perchedHwnd != null && dy > 36 && Math.abs(dx) < 420 && cat.grounded) {
      jumpDownFromPerch(cat, save, catCenterX, catBottomY, snapshot.cursorX, snapshot.cursorY);
    } else if (
      dy < -42 &&
      dy > -260 &&
      Math.abs(dx) < 160 &&
      cat.grounded &&
      cat.yarnReachHopCooldown <= 0
    ) {
      cat.grounded = false;
      cat.perchedHwnd = null;
      cat.state = 'jump';
      cat.vy = -Math.min(350, Math.max(230, Math.sqrt(2 * GRAVITY * Math.max(40, Math.abs(dy) + 24))));
      cat.vx = Math.max(-165, Math.min(165, dx * 1.4));
      cat.facing = dx >= 0 ? 1 : -1;
      cat.yarnReachHopCooldown = 1.0;
      save.stats.jumpsCount += 1;
      kittenAudio.playJump();
    } else if (cat.grounded && Math.abs(dx) > 22) {
      cat.state = 'run';
      cat.facing = dx >= 0 ? 1 : -1;
      cat.vx = cat.facing * 245;
      cat.stateTimer = 0.25;
    }
  } else if (canPursueInteractive && featherWand?.active && !(targetToy?.kind === 'yarn' && targetToy.heldBy)) {
    const catCenterX = cat.x + dims.width / 2;
    const catBottomY = cat.y + dims.height;
    const dx = featherWand.x - catCenterX;
    const dy = featherWand.y - catBottomY;
    if (featherWand.heldByCursor) {
      if (Math.abs(dx) <= 84 && dy < 28 && dy > -280) {
        if (cat.state !== 'reach_yarn') {
          cat.state = 'reach_yarn';
          cat.yarnReachHopCooldown = Math.max(cat.yarnReachHopCooldown, 0.4);
          kittenAudio.playBellJingle();
        }
        cat.stateTimer = 0.35;
        cat.vx = 0;
        cat.facing = dx >= 0 ? 1 : -1;
      } else if (cat.perchedHwnd != null && dy > 36 && Math.abs(dx) < 420 && cat.grounded) {
        jumpDownFromPerch(cat, save, catCenterX, catBottomY, featherWand.x, featherWand.y);
      } else if (cat.grounded && Math.abs(dx) > 40) {
        cat.state = 'run';
        cat.facing = dx >= 0 ? 1 : -1;
        cat.vx = cat.facing * 245;
        cat.stateTimer = 0.25;
      }
    } else if (Math.abs(dx) < 38 && Math.abs(dy) < 42 && cat.yarnCatchCooldown <= 0) {
      // Dropped feather wand sitting on desktop: playful pounce/bat with bell jingle!
      cat.facing = dx >= 0 ? 1 : -1;
      featherWand.vx = cat.facing * (180 + Math.random() * 60);
      featherWand.vy = -220;
      featherWand.grounded = false;
      cat.yarnCatchCooldown = 2.2;
      cat.blushTimer = 1.6;
      save.stats.yarnBats += 1;
      save.bond = Math.min(100, save.bond + 2);
      kittenAudio.playBellJingle();
      kittenAudio.playMew();
      addParticle(particles, { kind: 'sparkle', x: featherWand.x, y: featherWand.y, vx: 0, vy: -24, maxLife: 0.8 });
    } else if (cat.perchedHwnd != null && dy > 36 && Math.abs(dx) < 420 && cat.grounded) {
      jumpDownFromPerch(cat, save, catCenterX, catBottomY, featherWand.x, featherWand.y);
    } else if (cat.grounded && Math.abs(dx) > 26 && Math.abs(dy) < 200 && cat.yarnCatchCooldown <= 0) {
      cat.state = 'run';
      cat.facing = dx >= 0 ? 1 : -1;
      cat.vx = cat.facing * 205;
      cat.stateTimer = 0.25;
    }
  } else if (
    !focus.active &&
    cat.state !== 'eat' &&
    cat.state !== 'hold_cursor' &&
    cat.state !== 'petted' &&
    cat.state !== 'poked' &&
    cat.state !== 'cuddle_yarn' &&
    cat.state !== 'celebrate' &&
    !targetToy &&
    butterflies.length > 0
  ) {
    // Chase / boop nearest unbooped pastel butterfly or night firefly (including mid-jump catches!)
    const catCenterX = cat.x + dims.width / 2;
    const catCenterY = cat.y + dims.height / 2;
    const catBottomY = cat.y + dims.height;
    let nearestB: ButterflyEntity | null = null;
    let nearestDist = Infinity;
    for (const b of butterflies) {
      if (b.booped) continue;
      const d = Math.hypot(b.x - catCenterX, b.y - catCenterY);
      if (d < 460 && d < nearestDist) {
        nearestDist = d;
        nearestB = b;
      }
    }
    if (nearestB) {
      const dx = nearestB.x - catCenterX;
      const dy = nearestB.y - catCenterY;
      if (nearestDist < 42) {
        nearestB.booped = true;
        nearestB.vy = -140;
        nearestB.vx = (dx >= 0 ? 1 : -1) * Math.max(85, Math.abs(nearestB.vx) * 1.5);
        nearestB.maxLife = Math.min(nearestB.maxLife, nearestB.life + 1.2);
        save.stats.butterfliesCaught = (save.stats.butterfliesCaught ?? 0) + 1;
        save.starJarCount = (save.starJarCount ?? 0) + 1;
        save.bond = Math.min(100, save.bond + 5);
        cat.blushTimer = 2.4;
        cat.state = 'celebrate';
        cat.stateTimer = 0.85;
        cat.vx = 0;
        if (!cat.grounded) {
          cat.vy = Math.max(0, cat.vy);
        }
        cat.statusBubble = nearestB.kind === 'firefly' ? 'Sparkly! ✦' : 'Ooh! ✦';
        cat.statusBubbleTimer = 1.6;
        kittenAudio.playCatch();
        kittenAudio.playMew();
        addParticle(particles, { kind: 'sparkle', x: nearestB.x, y: nearestB.y, vx: 0, vy: -24, maxLife: 0.9 });
        addParticle(particles, {
          kind: 'petal',
          x: nearestB.x,
          y: nearestB.y,
          vx: (Math.random() - 0.5) * 32,
          vy: -18,
          maxLife: 1.0,
          color: nearestB.color,
        });
        recordProgressionFeedback(applyXpAndEvaluate(save, 14), result);
      } else if (
        cat.state !== 'jump' &&
        cat.state !== 'fall' &&
        cat.state !== 'pounce'
      ) {
        if (dy < -24 && dy > -260 && Math.abs(dx) < 130 && cat.grounded && cat.yarnReachHopCooldown <= 0) {
          cat.grounded = false;
          cat.perchedHwnd = null;
          cat.state = 'jump';
          cat.vy = -Math.min(350, Math.max(230, Math.sqrt(2 * GRAVITY * Math.max(40, Math.abs(dy) + 28))));
          cat.vx = Math.max(-145, Math.min(145, dx * 1.3));
          cat.facing = dx >= 0 ? 1 : -1;
          cat.yarnReachHopCooldown = 1.1;
          save.stats.jumpsCount += 1;
          kittenAudio.playJump();
          kittenAudio.playMew();
        } else if (cat.perchedHwnd != null && nearestB.y > catBottomY + 36 && Math.abs(dx) < 420 && cat.grounded) {
          jumpDownFromPerch(cat, save, catCenterX, catBottomY, nearestB.x, nearestB.y);
        } else if (cat.grounded && Math.abs(dx) > 22) {
          cat.state = 'run';
          cat.facing = dx >= 0 ? 1 : -1;
          cat.vx = cat.facing * 205;
          cat.stateTimer = 0.25;
        }
      }
    }
  }

  if (
    canPursueInteractive &&
    !laserActive &&
    targetToy &&
    (!featherWand?.active || (targetToy.kind === 'yarn' && targetToy.heldBy))
  ) {
    const catCenterX = cat.x + dims.width / 2;
    const catBottomY = cat.y + dims.height;
    const dx = targetToy.x - catCenterX;
    const dy = targetToy.y + targetToy.radius - catBottomY;

    if (targetToy.kind === 'yarn' && targetToy.heldBy) {
      // User is holding/dangling the yarn!
      if (Math.abs(dx) <= 74 && dy < 24 && dy > -280) {
        if (cat.state !== 'reach_yarn') {
          cat.state = 'reach_yarn';
          cat.yarnReachHopCooldown = Math.max(cat.yarnReachHopCooldown, 0.45);
          kittenAudio.playTrill(false);
        }
        cat.stateTimer = 0.35;
        cat.vx = 0;
        cat.facing = dx >= 0 ? 1 : -1;
      } else if (cat.perchedHwnd != null && dy > 36 && Math.abs(dx) < 420 && cat.grounded) {
        jumpDownFromPerch(cat, save, catCenterX, catBottomY, targetToy.x, targetToy.y + targetToy.radius);
      } else if (cat.grounded) {
        cat.state = 'run';
        cat.facing = dx >= 0 ? 1 : -1;
        cat.vx = cat.facing * 235;
        cat.stateTimer = 0.25;
      }
    } else if (Math.abs(dx) < 38 && Math.abs(dy) < 38) {
      if (targetToy.kind !== 'yarn') {
        const idx = toys.indexOf(targetToy);
        if (idx >= 0) toys.splice(idx, 1);
        const isFancy = targetToy.kind !== 'fish';
        cat.state = 'eat';
        cat.stateTimer = 1.4;
        cat.blushTimer = 2.4;
        cat.vx = 0;
        save.treats = Math.min(100, save.treats + (isFancy ? 34 : 28));
        save.bond = Math.min(100, save.bond + (isFancy ? 8 : 5));
        save.energy = Math.min(100, save.energy + 12);
        save.stats.treatsEaten += 1;
        kittenAudio.playChomp();
        kittenAudio.playMew();
        addParticle(particles, { kind: 'heart', x: catCenterX, y: cat.y - 4, vx: 0, vy: -26, maxLife: 1.0 });
        if (isFancy) {
          addParticle(particles, {
            kind: 'petal',
            x: catCenterX + 10,
            y: cat.y,
            vx: 14,
            vy: -20,
            maxLife: 1.1,
            color:
              targetToy.kind === 'boba' ||
              targetToy.kind === 'ube_icecream' ||
              targetToy.kind === 'star_kibble'
                ? '#c8a6f7'
                : '#ff85b3',
          });
          if (targetToy.kind === 'star_kibble' || targetToy.kind === 'ube_icecream') {
            addParticle(particles, { kind: 'sparkle', x: catCenterX - 8, y: cat.y, vx: -12, vy: -24, maxLife: 0.9 });
          }
        }
        recordProgressionFeedback(applyXpAndEvaluate(save, isFancy ? 20 : 18), result);
      } else {
        // After playing with yarn for a bit, kitten cuddles it & falls asleep before yarn disappears!
        const bats = (targetToy.batsCount ?? 0) + 1;
        targetToy.batsCount = bats;
        const playedEnough = bats >= 4 || (targetToy.playTime ?? 0) >= 16;

        if (playedEnough) {
          const idx = toys.indexOf(targetToy);
          if (idx >= 0) toys.splice(idx, 1);
          cat.cuddledYarnColor = targetToy.color ?? '#e85d75';
          cat.state = 'cuddle_yarn';
          cat.stateTimer = 4.8;
          cat.blushTimer = 4.8;
          cat.vx = 0;
          cat.statusBubble = 'Cozy yarn nap ♥';
          cat.statusBubbleTimer = 2.2;
          kittenAudio.playMew();
          kittenAudio.playPurr('soft');
          save.bond = Math.min(100, save.bond + 4);
          const ev = applyXpAndEvaluate(save, 12);
          if (ev.evolvedTo) result.evolvedLabel = ev.evolvedTo;
          if (ev.unlockedAchievements[0]) result.achievementBanner = ev.unlockedAchievements[0].title;
        } else {
          // Bat yarn ball!
          targetToy.vx = cat.facing * 260 + (Math.random() * 80 - 40);
          targetToy.vy = -280;
          targetToy.settled = false;
          targetToy.bounces = 0;
          save.stats.yarnBats += 1;
          save.bond = Math.min(100, save.bond + 2);
          kittenAudio.playToyBat();
          if (Math.random() < 0.55) kittenAudio.playMew();
          const ev = applyXpAndEvaluate(save, 9);
          if (ev.evolvedTo) result.evolvedLabel = ev.evolvedTo;
          if (ev.unlockedAchievements[0]) result.achievementBanner = ev.unlockedAchievements[0].title;
        }
      }
    } else if (
      dy < -44 &&
      -dy <= getMaxJumpRise(snapshot, catCenterX, catBottomY) &&
      Math.abs(dx) < 620 &&
      cat.grounded
    ) {
      // Jump up toward toy only within half-screen single-jump cap
      const maxJumpRise = getMaxJumpRise(snapshot, catCenterX, catBottomY);
      const { vx, vy } = computeJumpVelocity(
        catCenterX,
        catBottomY,
        targetToy.x,
        targetToy.y + targetToy.radius,
        58,
        maxJumpRise,
      );
      cat.state = 'jump';
      cat.vx = vx;
      cat.vy = vy;
      cat.facing = vx >= 0 ? 1 : -1;
      cat.grounded = false;
      cat.perchedHwnd = null;
      save.stats.jumpsCount += 1;
      kittenAudio.playJump();
      kittenAudio.playMew();
    } else if (cat.perchedHwnd != null && dy > 36 && Math.abs(dx) < 420 && cat.grounded) {
      // Kitten is perched on an upper titlebar and toy went below -> jump/drop down cleanly!
      jumpDownFromPerch(cat, save, catCenterX, catBottomY, targetToy.x, targetToy.y + targetToy.radius);
    } else if (cat.grounded) {
      cat.state = 'run';
      cat.facing = dx >= 0 ? 1 : -1;
      cat.vx = cat.facing * 225;
      cat.stateTimer = 0.25;
    }
  } else if (canPursueInteractive && bubbles.length > 0 && !(targetToy?.kind === 'yarn' && targetToy.heldBy)) {
    const catCenterX = cat.x + dims.width / 2;
    const catBottomY = cat.y + dims.height;
    let nearestBubble = bubbles[0];
    let bestDist = Infinity;
    for (const b of bubbles) {
      const d = Math.hypot(b.x - catCenterX, b.y - (cat.y + dims.height / 2));
      if (d < bestDist) {
        bestDist = d;
        nearestBubble = b;
      }
    }
    const dx = nearestBubble.x - catCenterX;
    const dy = nearestBubble.y - catBottomY;
    if (bestDist < 42 && cat.yarnCatchCooldown <= 0) {
      const combo = popComboRef ? popComboRef.count++ : 0;
      const { result: popRes } = popBubble(bubbles, nearestBubble.id, save, particles, combo, true);
      if (popRes.evolvedLabel) result.evolvedLabel = popRes.evolvedLabel;
      if (popRes.achievementBanner) result.achievementBanner = popRes.achievementBanner;
      if (popRes.mementoBanner) result.mementoBanner = popRes.mementoBanner;
      cat.facing = dx >= 0 ? 1 : -1;
      cat.state = 'celebrate';
      cat.stateTimer = 0.65;
      cat.vx = 0;
      cat.blushTimer = 1.4;
      cat.yarnCatchCooldown = 0.65;
      cat.statusBubble = 'Pop! 🫧';
      cat.statusBubbleTimer = 1.1;
    } else if (
      dy < -36 &&
      dy > -240 &&
      Math.abs(dx) < 160 &&
      cat.grounded &&
      cat.yarnReachHopCooldown <= 0
    ) {
      cat.grounded = false;
      cat.perchedHwnd = null;
      cat.state = 'jump';
      cat.vy = -Math.min(340, Math.max(220, Math.sqrt(2 * GRAVITY * Math.max(40, Math.abs(dy) + 18))));
      cat.vx = Math.max(-165, Math.min(165, dx * 1.3));
      cat.facing = dx >= 0 ? 1 : -1;
      cat.yarnReachHopCooldown = 0.85;
      save.stats.jumpsCount += 1;
      kittenAudio.playJump();
    } else if (cat.grounded && Math.abs(dx) > 26) {
      cat.state = 'run';
      cat.facing = dx >= 0 ? 1 : -1;
      cat.vx = cat.facing * 230;
      cat.stateTimer = 0.25;
    }
  }

  // Gravity & Airborne physics (jump / fall / pounce / poked hop)
  if (!cat.grounded) {
    const prevBottom = cat.y + dims.height;
    cat.vy += GRAVITY * dt;
    cat.x = clampXToVirtualDesktop(snapshot.monitors, cat.x + cat.vx * dt, dims.width);
    cat.y += cat.vy * dt;
    const nextBottom = cat.y + dims.height;

    if (cat.vy > 40 && cat.state === 'jump') {
      cat.state = 'fall';
    }

    if (cat.ignoreLedgeHwnd != null && nextBottom > cat.ignoreLedgeUntilY) {
      cat.ignoreLedgeHwnd = null;
    }

    const catCenterX = cat.x + dims.width / 2;
    if (cat.vy >= 0) {
      const landedLedge = findLandingLedge(
        ledges,
        catCenterX,
        prevBottom,
        nextBottom,
        cat.ignoreLedgeHwnd,
      );
      const groundY = getGroundYAt(snapshot.monitors, catCenterX, cat.y);

      if (landedLedge) {
        if (cat.vy > 180) kittenAudio.playSoftLand();
        cat.y = landedLedge.y - dims.height;
        cat.vy = 0;
        cat.vx = 0;
        cat.grounded = true;
        cat.ignoreLedgeHwnd = null;
        spawnLandingDust(particles, cat.x, landedLedge.y, dims.width);

        if (landedLedge.kind === 'window' && landedLedge.hwnd != null) {
          const win = snapshot.windows.find((w) => w.hwnd === landedLedge.hwnd);
          cat.perchedHwnd = landedLedge.hwnd;
          cat.perchedOffsetX = win ? cat.x - win.x : 0;
          cat.perchedWindowY = landedLedge.y;
          cat.perchedAppTitle = landedLedge.title ?? null;
          if (cat.perchedAppTitle) {
            const label = formatAppLabel(cat.perchedAppTitle);
            if (!save.stats.visitedApps.includes(label)) {
              save.stats.visitedApps.push(label);
            }
          }
        } else {
          cat.perchedHwnd = null;
          cat.perchedAppTitle = null;
        }

        if (cat.state === 'pounce') {
          const distCursor = Math.hypot(snapshot.cursorX - catCenterX, snapshot.cursorY - (cat.y + dims.height / 2));
          if (distCursor < 70 && save.settings.cursorHoldEnabled && !isBusyUser) {
            enterCursorHold(cat, save, particles, result);
          } else {
            cat.state = 'idle';
            cat.stateTimer = 1.2;
          }
        } else if (cat.state === 'poked') {
          cat.stateTimer = Math.max(0.25, cat.stateTimer);
        } else {
          const musicOn = isMusicActiveOnDesktop(snapshot, landedLedge);
          cat.state = musicOn ? 'head_bob' : 'idle';
          cat.stateTimer = musicOn ? 6.0 : 1.0;
        }
      } else if (nextBottom >= groundY) {
        if (cat.vy > 180) kittenAudio.playSoftLand();
        cat.y = groundY - dims.height;
        cat.vy = 0;
        cat.vx = 0;
        cat.grounded = true;
        cat.ignoreLedgeHwnd = null;
        cat.perchedHwnd = null;
        cat.perchedAppTitle = null;
        if (cat.state !== 'poked') {
          const musicOn = isMusicActiveOnDesktop(snapshot);
          cat.state = musicOn ? 'head_bob' : 'idle';
          cat.stateTimer = musicOn ? 6.0 : 1.0;
        }
        spawnLandingDust(particles, cat.x, groundY, dims.width);
      }
    }
    return result;
  }

  // Grounded state behaviors
  cat.stateTimer -= dt;
  const catCenterX = cat.x + dims.width / 2;
  const catCenterY = cat.y + dims.height / 2;

  const currentLedge = cat.perchedHwnd
    ? ledges.find((l) => l.hwnd === cat.perchedHwnd)
    : ledges.find(
        (l) =>
          l.kind === 'taskbar' &&
          catCenterX >= l.startX &&
          catCenterX <= l.endX &&
          Math.abs(l.y - (cat.y + dims.height)) < 14,
      );

  if (currentLedge && currentLedge.kind === 'taskbar' && Math.abs(currentLedge.y - (cat.y + dims.height)) > 0.5) {
    cat.y = currentLedge.y - dims.height;
  }

  const musicPlaying = isMusicActiveOnDesktop(snapshot, currentLedge);
  const lateNight = save.settings.lateNightEnabled && isLateNightHour();
  if (musicPlaying) {
    cat.activeAppReaction = 'music';
  } else if (lateNight) {
    cat.activeAppReaction = 'late_night';
  } else if (save.settings.studyBuddyEnabled && isBusyUser) {
    cat.activeAppReaction = 'study_buddy';
  } else {
    cat.activeAppReaction = 'none';
  }

  // If music is playing and cat is just idling/sitting without toys, start vibing!
  if (
    musicPlaying &&
    !focus.active &&
    !targetToy &&
    (cat.state === 'idle' || cat.state === 'sit')
  ) {
    cat.state = 'head_bob';
    cat.vx = 0;
    cat.stateTimer = 5.5;
  }

  switch (cat.state) {
    case 'walk':
    case 'run': {
      const nextX = cat.x + cat.vx * dt;
      const dist = Math.abs(cat.vx * dt);
      save.stats.distancePx += dist;
      save.energy = Math.max(5, save.energy - dt * (cat.state === 'run' ? 2.4 : 0.9));

      // Periodic meows while walking/exploring!
      if (cat.meowCooldown <= 0) {
        cat.meowCooldown = 4.2 + Math.random() * 4.5;
        kittenAudio.playMew();
      }

      if (cat.pawPrintCooldown <= 0) {
        cat.pawPrintCooldown = cat.state === 'run' ? 0.14 : 0.28;
        addParticle(particles, {
          kind: 'paw',
          x: catCenterX,
          y: cat.y + dims.height - 3,
          vx: 0,
          vy: 0,
          maxLife: 1.8,
          flip: cat.facing === -1,
        });
      }

      if (currentLedge) {
        const chasingLeft = targetToy != null && targetToy.x < catCenterX;
        const chasingRight = targetToy != null && targetToy.x > catCenterX;

        if (cat.vx < 0 && nextX < currentLedge.startX) {
          if (currentLedge.kind === 'taskbar') {
            const adj = findAdjacentTaskbarLedge(ledges, currentLedge, -1);
            if (adj) {
              if (Math.abs(adj.y - currentLedge.y) <= 12) {
                cat.x = clampXToVirtualDesktop(snapshot.monitors, nextX, dims.width);
              } else if (adj.y > currentLedge.y + 12) {
                if (nextX + dims.width * 0.5 < currentLedge.startX) {
                  cat.grounded = false;
                  cat.state = 'fall';
                  cat.vx = -120;
                  cat.vy = 0;
                  return result;
                }
                cat.x = nextX;
              } else {
                const targetX = Math.min(adj.endX - dims.width * 0.6, adj.endX - 24);
                const maxJumpRise = getMaxJumpRise(snapshot, catCenterX, cat.y + dims.height);
                const { vx, vy } = computeJumpVelocity(catCenterX, cat.y + dims.height, targetX, adj.y, 48, maxJumpRise);
                cat.state = 'jump';
                cat.vx = vx;
                cat.vy = vy;
                cat.facing = -1;
                cat.grounded = false;
                save.stats.jumpsCount += 1;
                kittenAudio.playJump();
                return result;
              }
            } else {
              cat.x = currentLedge.startX;
              cat.vx = Math.abs(cat.vx);
              cat.facing = 1;
            }
          } else if (chasingLeft || Math.random() < 0.65) {
            cat.ignoreLedgeHwnd = cat.perchedHwnd;
            cat.ignoreLedgeUntilY = cat.y + dims.height + 16;
            cat.grounded = false;
            cat.perchedHwnd = null;
            cat.perchedAppTitle = null;
            cat.state = 'fall';
            cat.vx = -85;
            cat.vy = -170;
            return result;
          } else {
            cat.x = currentLedge.startX;
            cat.vx = Math.abs(cat.vx);
            cat.facing = 1;
          }
        } else if (cat.vx > 0 && nextX + dims.width > currentLedge.endX) {
          if (currentLedge.kind === 'taskbar') {
            const adj = findAdjacentTaskbarLedge(ledges, currentLedge, 1);
            if (adj) {
              if (Math.abs(adj.y - currentLedge.y) <= 12) {
                cat.x = clampXToVirtualDesktop(snapshot.monitors, nextX, dims.width);
              } else if (adj.y > currentLedge.y + 12) {
                if (nextX + dims.width * 0.5 > currentLedge.endX) {
                  cat.grounded = false;
                  cat.state = 'fall';
                  cat.vx = 120;
                  cat.vy = 0;
                  return result;
                }
                cat.x = nextX;
              } else {
                const targetX = Math.max(adj.startX + dims.width * 0.6, adj.startX + 24);
                const maxJumpRise = getMaxJumpRise(snapshot, catCenterX, cat.y + dims.height);
                const { vx, vy } = computeJumpVelocity(catCenterX, cat.y + dims.height, targetX, adj.y, 48, maxJumpRise);
                cat.state = 'jump';
                cat.vx = vx;
                cat.vy = vy;
                cat.facing = 1;
                cat.grounded = false;
                save.stats.jumpsCount += 1;
                kittenAudio.playJump();
                return result;
              }
            } else {
              cat.x = currentLedge.endX - dims.width;
              cat.vx = -Math.abs(cat.vx);
              cat.facing = -1;
            }
          } else if (chasingRight || Math.random() < 0.65) {
            cat.ignoreLedgeHwnd = cat.perchedHwnd;
            cat.ignoreLedgeUntilY = cat.y + dims.height + 16;
            cat.grounded = false;
            cat.perchedHwnd = null;
            cat.perchedAppTitle = null;
            cat.state = 'fall';
            cat.vx = 85;
            cat.vy = -170;
            return result;
          } else {
            cat.x = currentLedge.endX - dims.width;
            cat.vx = -Math.abs(cat.vx);
            cat.facing = -1;
          }
        } else {
          cat.x = nextX;
        }

        // If an obstacle/window sits right over the walking path (within half-screen jump height), occasionally leap onto it
        if (
          !targetToy &&
          currentLedge.kind === 'taskbar' &&
          Math.random() < 0.008
        ) {
          const catBottomY = cat.y + dims.height;
          const maxJumpRise = getMaxJumpRise(snapshot, catCenterX, catBottomY);
          const overhead = ledges.find(
            (l) =>
              l.kind === 'window' &&
              l.y < catBottomY - 20 &&
              catBottomY - l.y <= maxJumpRise - 16 &&
              catCenterX >= l.startX - 180 &&
              catCenterX <= l.endX + 180,
          );
          if (overhead) {
            const landX = Math.max(overhead.startX + 20, Math.min(overhead.endX - 20, catCenterX));
            const { vx, vy } = computeJumpVelocity(
              catCenterX,
              catBottomY,
              landX,
              overhead.y,
              58,
              maxJumpRise,
            );
            cat.state = 'jump';
            cat.vx = vx;
            cat.vy = vy;
            cat.facing = vx >= 0 ? 1 : -1;
            cat.grounded = false;
            save.stats.jumpsCount += 1;
            kittenAudio.playJump();
            kittenAudio.playMew();
            return result;
          }
        }

        if (cat.perchedHwnd != null) {
          const win = snapshot.windows.find((w) => w.hwnd === cat.perchedHwnd);
          if (win) cat.perchedOffsetX = cat.x - win.x;
        }
      } else {
        cat.grounded = false;
        cat.state = 'fall';
      }

      const ev = applyXpAndEvaluate(save, dt * 0.2);
      recordProgressionFeedback(ev, result);

      // Brushing past placed Lavender Plant sways stems & releases fragrant petals!
      if (
        plant?.active &&
        plant.grounded &&
        plant.swayTimer <= 0 &&
        Math.abs(plant.x - catCenterX) < 28 &&
        Math.abs(plant.y - (cat.y + dims.height)) < 18
      ) {
        triggerPlantSniff(cat, save, plant, particles, result);
      }

      if (cat.stateTimer <= 0) {
        chooseNextGroundedState(cat, save, snapshot, ledges, lateNight, isBusyUser, focus, musicPlaying, cushion, plant, giftBox, lantern);
      }
      break;
    }

    case 'reach_yarn': {
      const heldYarn = targetToy && targetToy.kind === 'yarn' && targetToy.heldBy ? targetToy : null;
      const reachTarget = heldYarn
        ? { x: heldYarn.x, y: heldYarn.y, radius: heldYarn.radius, isWand: false }
        : featherWand?.active && featherWand.heldByCursor
          ? { x: featherWand.x, y: featherWand.y, radius: 10, isWand: true }
          : null;
      if (!reachTarget) {
        cat.state = 'idle';
        cat.stateTimer = 0.9;
        break;
      }

      const dx = reachTarget.x - catCenterX;
      const dy = reachTarget.y + reachTarget.radius - (cat.y + dims.height);
      cat.facing = dx >= 0 ? 1 : -1;

      if (Math.abs(dx) > 14 && Math.abs(dx) <= 95) {
        const step = Math.sign(dx) * Math.min(Math.abs(dx), 72 * dt);
        cat.x = clampXToVirtualDesktop(snapshot.monitors, cat.x + step, dims.width);
      }

      const pawX = cat.x + dims.width / 2 + cat.facing * (dims.width * 0.28);
      const pawY = cat.y + dims.height * 0.16;
      if (cat.yarnCatchCooldown <= 0 && Math.hypot(reachTarget.x - pawX, reachTarget.y - pawY) < 42) {
        save.stats.yarnCatches += 1;
        save.stats.yarnBats += 1;
        save.bond = Math.min(100, save.bond + 5);
        cat.blushTimer = 2.6;
        cat.yarnCatchCooldown = 1.0;
        if (reachTarget.isWand) {
          kittenAudio.playBellJingle();
          if (featherWand) featherWand.idleSeconds = 0;
        } else {
          kittenAudio.playCatch();
        }
        kittenAudio.playMew();
        addParticle(particles, { kind: 'sparkle', x: pawX, y: pawY, vx: 0, vy: -26, maxLife: 0.85 });
        addParticle(particles, { kind: 'heart', x: catCenterX, y: cat.y - 6, vx: 0, vy: -28, maxLife: 1.0 });
        addParticle(particles, { kind: 'petal', x: pawX + 8, y: pawY, vx: 22, vy: -18, maxLife: 0.95, color: reachTarget.isWand ? '#c8a6f7' : '#ff85b3' });

        if (heldYarn?.heldBy === 'drag') {
          heldYarn.heldBy = null;
          heldYarn.vx = cat.facing * 220;
          heldYarn.vy = -250;
          heldYarn.settled = false;
        }
        cat.state = 'celebrate';
        cat.stateTimer = 0.85;
        cat.statusBubble = reachTarget.isWand ? 'Got feather! ♥' : 'Got it! ♥';
        cat.statusBubbleTimer = 1.3;

        const ev = applyXpAndEvaluate(save, 14);
        if (ev.evolvedTo) result.evolvedLabel = ev.evolvedTo;
        if (ev.unlockedAchievements[0]) result.achievementBanner = ev.unlockedAchievements[0].title;
      } else if (dy < -dims.height * 0.9 && cat.yarnReachHopCooldown <= 0 && cat.grounded) {
        cat.grounded = false;
        cat.perchedHwnd = null;
        cat.state = 'jump';
        cat.vy = -235;
        cat.vx = Math.max(-110, Math.min(110, dx * 1.1));
        cat.yarnReachHopCooldown = 1.15;
        kittenAudio.playJump();
        kittenAudio.playMew();
      } else if (Math.abs(dx) > 95 || dy < -290 || dy > 32) {
        cat.state = 'idle';
        cat.stateTimer = 0.4;
      }
      break;
    }

    case 'cuddle_yarn': {
      save.energy = Math.min(100, save.energy + dt * 5.0);
      kittenAudio.playPurr('soft');
      if (cat.particleCooldown <= 0) {
        cat.particleCooldown = 1.15;
        addParticle(particles, {
          kind: Math.random() < 0.5 ? 'heart' : 'zzz',
          x: catCenterX + cat.facing * 10,
          y: cat.y - 4,
          vx: (Math.random() - 0.5) * 10,
          vy: -20,
          maxLife: 1.4,
        });
      }
      if (cat.stateTimer <= 0) {
        spawnYarnVanishParticles(
          particles,
          catCenterX + cat.facing * 14,
          cat.y + dims.height - 12,
          cat.cuddledYarnColor ?? undefined,
        );
        cat.cuddledYarnColor = null;
        chooseNextGroundedState(cat, save, snapshot, ledges, lateNight, isBusyUser, focus, musicPlaying, cushion, plant, giftBox, lantern);
      }
      break;
    }

    case 'head_bob': {
      save.stats.headBobSeconds += dt;
      if (cat.particleCooldown <= 0) {
        cat.particleCooldown = 0.58;
        const gIdx = Math.floor(Math.random() * MUSIC_GLYPHS.length);
        addParticle(particles, {
          kind: 'note',
          x: catCenterX + (Math.random() * 20 - 10),
          y: cat.y - 8,
          vx: (Math.random() - 0.5) * 18,
          vy: -28,
          maxLife: 1.25,
          glyph: MUSIC_GLYPHS[gIdx],
          color: MUSIC_COLORS[gIdx],
        });
      }
      const ev = applyXpAndEvaluate(save, dt * 0.25);
      if (ev.evolvedTo) result.evolvedLabel = ev.evolvedTo;
      if (ev.unlockedAchievements[0]) result.achievementBanner = ev.unlockedAchievements[0].title;
      if (cat.stateTimer <= 0 || !musicPlaying) {
        chooseNextGroundedState(cat, save, snapshot, ledges, lateNight, isBusyUser, focus, musicPlaying, cushion, plant, giftBox, lantern);
      }
      break;
    }

    case 'loaf':
    case 'sleep': {
      save.energy = Math.min(100, save.energy + dt * (cat.state === 'sleep' ? 5.0 : 2.6));
      if (cat.state === 'sleep') {
        kittenAudio.playPurr('soft');
      }
      if (cat.state === 'sleep' && cat.particleCooldown <= 0) {
        cat.particleCooldown = 1.6;
        addParticle(particles, {
          kind: lateNight && Math.random() < 0.25 ? 'moon' : 'zzz',
          x: catCenterX + cat.facing * 10,
          y: cat.y - 4,
          vx: 8,
          vy: -18,
          maxLife: 1.5,
        });
      }
      if (cat.stateTimer <= 0 && !focus.active) {
        if (cat.state === 'sleep' && Math.random() < 0.5) {
          cat.state = 'stretch';
          cat.stateTimer = 1.5;
          cat.vx = 0;
        } else {
          chooseNextGroundedState(cat, save, snapshot, ledges, lateNight, isBusyUser, focus, musicPlaying, cushion, plant, giftBox, lantern);
        }
      }
      break;
    }

    case 'stretch': {
      if (cat.stateTimer <= 0) {
        chooseNextGroundedState(cat, save, snapshot, ledges, lateNight, isBusyUser, focus, musicPlaying, cushion, plant, giftBox, lantern);
      }
      break;
    }

    case 'knead': {
      kittenAudio.playPurr('soft');
      save.bond = Math.min(100, save.bond + dt * 0.6);
      if (cat.particleCooldown <= 0) {
        cat.particleCooldown = 1.2;
        addParticle(particles, {
          kind: 'heart',
          x: catCenterX + (Math.random() * 14 - 7),
          y: cat.y - 4,
          vx: (Math.random() - 0.5) * 10,
          vy: -20,
          maxLife: 1.1,
        });
      }
      if (cat.stateTimer <= 0) {
        chooseNextGroundedState(cat, save, snapshot, ledges, lateNight, isBusyUser, focus, musicPlaying, cushion, plant, giftBox, lantern);
      }
      break;
    }

    case 'groom': {
      kittenAudio.playPurr('soft');
      if (cat.particleCooldown <= 0) {
        cat.particleCooldown = 1.1;
        addParticle(particles, {
          kind: 'petal',
          x: catCenterX + (Math.random() * 14 - 7),
          y: cat.y - 2,
          vx: (Math.random() - 0.5) * 14,
          vy: -18,
          maxLife: 1.1,
          color: '#ffd1e3',
        });
      }
      if (cat.stateTimer <= 0) {
        cat.state = 'sit';
        cat.stateTimer = 1.2;
      }
      break;
    }

    case 'petted': {
      cat.blushTimer = Math.max(cat.blushTimer, 0.8);
      kittenAudio.playPurr('happy');
      if (cat.meowCooldown <= 0) {
        cat.meowCooldown = 1.8;
        kittenAudio.playMew();
      }
      if (cat.particleCooldown <= 0) {
        cat.particleCooldown = 0.45;
        addParticle(particles, {
          kind: 'heart',
          x: catCenterX + (Math.random() * 16 - 8),
          y: cat.y - 4,
          vx: (Math.random() - 0.5) * 12,
          vy: -26,
          maxLife: 1.1,
        });
      }
      if (cat.stateTimer <= 0) {
        cat.state = 'sit';
        cat.stateTimer = 1.6;
      }
      break;
    }

    case 'poked': {
      if (cat.stateTimer <= 0) {
        cat.state = 'sit';
        cat.stateTimer = 1.1;
      }
      break;
    }

    case 'stalk': {
      const dx = snapshot.cursorX - catCenterX;
      cat.facing = dx >= 0 ? 1 : -1;
      if (cat.stateTimer <= 0) {
        const dy = snapshot.cursorY - catCenterY;
        if (Math.abs(dx) < 260 && Math.abs(dy) < 220 && !isBusyUser) {
          const maxJumpRise = getMaxJumpRise(snapshot, catCenterX, cat.y + dims.height);
          const { vx, vy } = computeJumpVelocity(
            catCenterX,
            cat.y + dims.height,
            snapshot.cursorX,
            Math.min(cat.y + dims.height, snapshot.cursorY + dims.height / 2),
            44,
            maxJumpRise,
          );
          cat.state = 'pounce';
          cat.vx = vx;
          cat.vy = vy;
          cat.grounded = false;
          cat.perchedHwnd = null;
          kittenAudio.playJump();
        } else {
          cat.state = 'idle';
          cat.stateTimer = 1.0;
        }
      }
      break;
    }

    case 'hold_cursor': {
      cat.holdDuration += dt;
      const pawX = Math.round(cat.x + (cat.facing === 1 ? dims.width - 4 : 4));
      const pawY = Math.round(cat.y + dims.height * 0.55);
      result.holdCursorTarget = { active: true, x: pawX, y: pawY };
      if (cat.particleCooldown <= 0) {
        cat.particleCooldown = 0.7;
        addParticle(particles, {
          kind: 'sparkle',
          x: pawX,
          y: pawY - 8,
          vx: (Math.random() - 0.5) * 20,
          vy: -18,
          maxLife: 0.7,
        });
      }
      if (cat.stateTimer <= 0 || isBusyUser) {
        cat.state = 'sit';
        cat.stateTimer = 1.5;
        cat.holdCooldown = 14;
        result.holdCursorTarget = { active: false, x: pawX, y: pawY };
      }
      break;
    }

    case 'trick_spin':
    case 'trick_highfive':
    case 'trick_flip': {
      cat.blushTimer = Math.max(cat.blushTimer, 0.8);
      if (cat.particleCooldown <= 0) {
        cat.particleCooldown = 0.25;
        addParticle(particles, {
          kind: 'sparkle',
          x: catCenterX + (Math.random() * 24 - 12),
          y: cat.y + Math.random() * 14 - 6,
          vx: (Math.random() - 0.5) * 26,
          vy: -22 - Math.random() * 14,
          maxLife: 0.75,
          color: Math.random() < 0.5 ? '#d9b5ff' : '#ffd86b',
        });
      }
      if (cat.stateTimer <= 0) {
        cat.state = 'sit';
        cat.stateTimer = 1.4;
      }
      break;
    }

    case 'roll_wiggle': {
      cat.blushTimer = Math.max(cat.blushTimer, 0.8);
      kittenAudio.playPurr('happy');
      if (cat.particleCooldown <= 0) {
        cat.particleCooldown = 0.4;
        addParticle(particles, {
          kind: Math.random() < 0.5 ? 'heart' : 'sparkle',
          x: catCenterX + (Math.random() * 18 - 9),
          y: cat.y - 2,
          vx: (Math.random() - 0.5) * 16,
          vy: -24,
          maxLife: 0.9,
          color: '#e5b8ff',
        });
      }
      if (cat.stateTimer <= 0) {
        cat.state = 'sit';
        cat.stateTimer = 1.2;
      }
      break;
    }

    case 'zoomies': {
      const speed = 430;
      cat.vx = cat.facing * speed;
      const mon = findMonitorForPoint(snapshot.monitors, catCenterX, catCenterY);
      const minX = mon ? mon.x + 8 : 0;
      const maxX = mon ? mon.x + mon.width - dims.width - 8 : 1200;
      const nextX = cat.x + cat.vx * dt;
      if (nextX <= minX) {
        cat.x = minX;
        cat.facing = 1;
        cat.vx = speed;
      } else if (nextX >= maxX) {
        cat.x = maxX;
        cat.facing = -1;
        cat.vx = -speed;
      } else {
        cat.x = nextX;
      }
      cat.y = getGroundYAt(snapshot.monitors, cat.x + dims.width / 2, dims.height);
      cat.grounded = true;
      cat.perchedHwnd = null;

      if (cat.particleCooldown <= 0) {
        cat.particleCooldown = 0.08;
        addParticle(particles, {
          kind: 'sparkle',
          x: catCenterX - cat.facing * 12,
          y: cat.y + dims.height - 4,
          vx: -cat.facing * 32,
          vy: -16 - Math.random() * 12,
          maxLife: 0.5,
          color: Math.random() < 0.5 ? '#cfa8ff' : '#ffffff',
        });
      }
      if (cat.stateTimer <= 0) {
        cat.state = 'celebrate';
        cat.vx = 0;
        cat.stateTimer = 1.0;
        cat.statusBubble = 'Wheee!! 💜';
        cat.statusBubbleTimer = 1.3;
      }
      break;
    }

    case 'box_hide': {
      if (!giftBox?.active) {
        cat.state = 'sit';
        cat.vx = 0;
        cat.stateTimer = 1.2;
        break;
      }
      giftBox.occupied = true;
      cat.x = giftBox.x - dims.width / 2;
      cat.y = giftBox.y - dims.height;
      cat.vx = 0;
      cat.vy = 0;
      cat.grounded = true;
      const cursorDist = Math.hypot(snapshot.cursorX - giftBox.x, snapshot.cursorY - (giftBox.y - 16));
      if (cat.stateTimer <= 0 || (cursorDist < 135 && cat.yarnCatchCooldown <= 0)) {
        const ambushRes = triggerGiftBoxAmbush(
          cat,
          save,
          giftBox,
          snapshot.cursorX,
          snapshot.cursorY,
          particles,
        );
        if (ambushRes.evolvedLabel) result.evolvedLabel = ambushRes.evolvedLabel;
        if (ambushRes.achievementBanner) result.achievementBanner = ambushRes.achievementBanner;
        if (ambushRes.mementoBanner) result.mementoBanner = ambushRes.mementoBanner;
      }
      break;
    }

    case 'peek': {
      cat.facing = snapshot.cursorX >= catCenterX ? 1 : -1;
      if (cat.stateTimer <= 0) {
        cat.state = 'sit';
        cat.stateTimer = 1.2;
      }
      break;
    }

    case 'eat':
    case 'celebrate':
    case 'sit':
    case 'idle':
    default: {
      save.energy = Math.min(100, save.energy + dt * 1.4);
      if (cat.stateTimer <= 0) {
        chooseNextGroundedState(cat, save, snapshot, ledges, lateNight, isBusyUser, focus, musicPlaying, cushion, plant, giftBox, lantern);
      }
      break;
    }
  }

  return result;
}

function triggerPlantSniff(
  cat: CatRuntime,
  save: KittenSaveState,
  plant: LavenderPlantEntity,
  particles: Particle[],
  result: StepResult,
): void {
  plant.swayTimer = 2.4;
  save.stats.plantSniffs = (save.stats.plantSniffs ?? 0) + 1;
  save.bond = Math.min(100, save.bond + 3);
  cat.blushTimer = 2.2;
  cat.statusBubble = 'Lavender bliss! 🪻';
  cat.statusBubbleTimer = 2.0;
  kittenAudio.playPurr('happy');
  for (let i = 0; i < 4; i++) {
    addParticle(particles, {
      kind: 'petal',
      x: plant.x + (Math.random() * 16 - 8),
      y: plant.y - 26,
      vx: (Math.random() - 0.5) * 28,
      vy: -22 - Math.random() * 14,
      maxLife: 1.2,
      color: i % 2 === 0 ? '#b88aff' : '#e8d6ff',
    });
  }
  recordProgressionFeedback(applyXpAndEvaluate(save, 10), result);
}

function enterCursorHold(
  cat: CatRuntime,
  save: KittenSaveState,
  particles: Particle[],
  result: StepResult,
) {
  cat.state = 'hold_cursor';
  cat.stateTimer = 2.6;
  cat.holdDuration = 0;
  cat.vx = 0;
  save.stats.cursorsCaught += 1;
  save.bond = Math.min(100, save.bond + 4);
  kittenAudio.playCatch();
  kittenAudio.playMew();

  if (save.stats.cursorsCaught === 1) {
    pushTimelineEntry(save, {
      kind: 'milestone',
      title: 'Caught your cursor for the first time!',
      detail: 'Pounced right onto the pointer (shake mouse or press Esc to release anytime).',
    });
  }

  const ev = applyXpAndEvaluate(save, 16);
  recordProgressionFeedback(ev, result);

  addParticle(particles, { kind: 'sparkle', x: cat.x + 24, y: cat.y, vx: 0, vy: -22, maxLife: 0.8 });
}

function chooseNextGroundedState(
  cat: CatRuntime,
  save: KittenSaveState,
  snapshot: DesktopSnapshot,
  ledges: WalkableLedge[],
  lateNight: boolean,
  isBusyUser: boolean,
  focus: FocusState,
  musicPlaying: boolean,
  cushion?: CushionEntity,
  plant?: LavenderPlantEntity,
  giftBox?: GiftBoxEntity,
  lantern?: LanternEntity,
) {
  if (focus.active) {
    cat.state = 'sleep';
    cat.vx = 0;
    cat.stateTimer = 5;
    return;
  }

  const dims = getStageDimensions(save.stage, save.settings.spriteScale);
  const catCenterX = cat.x + dims.width / 2;
  const catBottomY = cat.y + dims.height;

  // Busy user -> quiet Study Buddy loaf!
  if (save.settings.studyBuddyEnabled && isBusyUser) {
    cat.state = Math.random() < 0.7 ? 'loaf' : 'sit';
    cat.vx = 0;
    cat.stateTimer = 5 + Math.random() * 4;
    cat.statusBubble = 'Study buddy';
    cat.statusBubbleTimer = 2.5;
    return;
  }

  // If music is playing on desktop, vibe to it frequently!
  if (musicPlaying && Math.random() < 0.65) {
    cat.state = 'head_bob';
    cat.vx = 0;
    cat.stateTimer = 4.5 + Math.random() * 4;
    return;
  }

  // Placed Lavender Cat Cushion -> walk onto it or make biscuits ("knead") / cozy nap!
  if (cushion?.active && cushion.grounded && Math.abs(catBottomY - cushion.y) < 18) {
    const dxCushion = cushion.x - catCenterX;
    if (Math.abs(dxCushion) < 28 && Math.random() < 0.62) {
      const makeBiscuits = Math.random() < 0.72;
      cat.state = makeBiscuits ? 'knead' : 'sleep';
      cat.vx = 0;
      cat.stateTimer = makeBiscuits ? 3.2 : 5.5;
      if (makeBiscuits) {
        cat.statusBubble = 'Making biscuits ♥';
        cat.statusBubbleTimer = 2.4;
        kittenAudio.playPurr('happy');
      }
      return;
    } else if (Math.abs(dxCushion) < 360 && Math.random() < 0.45) {
      cat.state = 'walk';
      cat.facing = dxCushion >= 0 ? 1 : -1;
      cat.vx = cat.facing * 74;
      cat.stateTimer = Math.min(2.6, Math.abs(dxCushion) / 74);
      return;
    }
  }

  // Placed Potted Lavender -> occasionally trot over to sniff it!
  if (plant?.active && plant.grounded && Math.abs(catBottomY - plant.y) < 18) {
    const dxPlant = plant.x - catCenterX;
    if (Math.abs(dxPlant) >= 24 && Math.abs(dxPlant) < 300 && Math.random() < 0.3) {
      cat.state = 'walk';
      cat.facing = dxPlant >= 0 ? 1 : -1;
      cat.vx = cat.facing * 78;
      cat.stateTimer = Math.min(2.4, Math.abs(dxPlant) / 78);
      return;
    }
  }

  // Placed Moonlight Lantern (lit) -> curl up beside the warm amber glow!
  if (lantern?.active && lantern.lit && lantern.grounded && Math.abs(catBottomY - lantern.y) < 18) {
    const dxLantern = lantern.x - catCenterX;
    if (Math.abs(dxLantern) < 56 && Math.random() < (lateNight ? 0.65 : 0.45)) {
      cat.state = 'sleep';
      cat.vx = 0;
      cat.facing = dxLantern >= 0 ? 1 : -1;
      cat.stateTimer = 5.5 + Math.random() * 3.5;
      cat.statusBubble = 'Warm lantern glow 🏮';
      cat.statusBubbleTimer = 2.6;
      save.stats.lanternNaps = (save.stats.lanternNaps ?? 0) + 1;
      applyXpAndEvaluate(save, 6);
      kittenAudio.playPurr('soft');
      return;
    } else if (Math.abs(dxLantern) >= 56 && Math.abs(dxLantern) < 380 && Math.random() < (lateNight ? 0.5 : 0.32)) {
      cat.state = 'walk';
      cat.facing = dxLantern >= 0 ? 1 : -1;
      cat.vx = cat.facing * 72;
      cat.stateTimer = Math.min(2.8, (Math.abs(dxLantern) - 32) / 72);
      return;
    }
  }

  // Placed Purple Gift Box -> hop inside to hide & ambush!
  if (
    giftBox?.active &&
    !giftBox.occupied &&
    giftBox.grounded &&
    giftBox.cooldown <= 0 &&
    cat.yarnCatchCooldown <= 0 &&
    Math.abs(catBottomY - giftBox.y) < 18
  ) {
    const dxBox = giftBox.x - catCenterX;
    if (Math.abs(dxBox) < 34 && Math.random() < 0.55) {
      cat.state = 'box_hide';
      cat.stateTimer = 4.5 + Math.random() * 4.5;
      cat.yarnCatchCooldown = 0.85;
      cat.vx = 0;
      cat.x = giftBox.x - dims.width / 2;
      cat.y = giftBox.y - dims.height;
      giftBox.occupied = true;
      giftBox.wiggleTimer = 0.6;
      cat.statusBubble = 'Peekaboo? 🎁';
      cat.statusBubbleTimer = 1.4;
      kittenAudio.playMew();
      return;
    } else if (Math.abs(dxBox) < 360 && Math.random() < 0.38) {
      cat.state = 'run';
      cat.facing = dxBox >= 0 ? 1 : -1;
      cat.vx = cat.facing * 185;
      cat.stateTimer = Math.min(2.2, Math.abs(dxBox) / 185);
      return;
    }
  }

  // Perched on a foreground/window ledge -> occasional playful peek!
  if (cat.perchedHwnd != null && Math.random() < 0.14) {
    cat.state = 'peek';
    cat.vx = 0;
    cat.stateTimer = 2.6 + Math.random() * 1.4;
    return;
  }

  // Low energy or late night -> nap / loaf
  if (save.energy < 25 || (lateNight && Math.random() < 0.45)) {
    const nap = Math.random() < 0.65;
    cat.state = nap ? 'sleep' : 'loaf';
    cat.vx = 0;
    cat.stateTimer = 5 + Math.random() * 6;
    if (nap) {
      if (lateNight) kittenAudio.playYawn();
      if (cat.perchedAppTitle) {
        recordTitlebarNap(save, cat.perchedAppTitle);
      }
    }
    return;
  }

  // Cursor stalk & pounce
  const cursorDist = Math.hypot(snapshot.cursorX - catCenterX, snapshot.cursorY - catBottomY);
  if (
    save.settings.cursorHoldEnabled &&
    cat.holdCooldown <= 0 &&
    save.stage !== 'tiny_kitten' &&
    cursorDist < 260 &&
    cursorDist > 45 &&
    Math.random() < 0.28
  ) {
    cat.state = 'stalk';
    cat.vx = 0;
    cat.stateTimer = 0.85;
    kittenAudio.playTrill(false);
    return;
  }

  // Jump up onto a window titlebar within half-screen single-jump height, or jump down to a lower titlebar!
  const windowLedges = ledges.filter((l) => l.kind === 'window' && l.hwnd !== cat.perchedHwnd);
  if (windowLedges.length > 0 && Math.random() < 0.42) {
    const maxJumpRise = getMaxJumpRise(snapshot, catCenterX, catBottomY);
    const above = windowLedges.filter((l) => {
      const targetX = Math.max(l.startX + 20, Math.min(l.endX - 20, catCenterX));
      const dx = Math.abs(targetX - catCenterX);
      const dy = catBottomY - l.y;
      return dx < 760 && dy > 16 && dy <= maxJumpRise - 16;
    });
    const below = windowLedges.filter((l) => l.y > catBottomY + 20);

    // If perched high up and there are lower windows, prefer jumping down onto one!
    if (cat.perchedHwnd != null && below.length > 0 && Math.random() < 0.6) {
      const target = below[Math.floor(Math.random() * below.length)];
      const landX = target.startX + 24 + Math.random() * Math.max(10, target.endX - target.startX - 48);
      jumpDownFromPerch(cat, save, catCenterX, catBottomY, landX, target.y);
      return;
    }

    if (above.length > 0) {
      const fg = above.find((l) => l.isForeground);
      const target = fg && Math.random() < 0.6 ? fg : above[Math.floor(Math.random() * above.length)];
      const landX = target.startX + 24 + Math.random() * Math.max(10, target.endX - target.startX - 48);
      const { vx, vy } = computeJumpVelocity(catCenterX, catBottomY, landX, target.y, 58, maxJumpRise);
      cat.state = 'jump';
      cat.vx = vx;
      cat.vy = vy;
      cat.facing = vx >= 0 ? 1 : -1;
      cat.grounded = false;
      cat.perchedHwnd = null;
      save.stats.jumpsCount += 1;
      kittenAudio.playJump();
      kittenAudio.playMew();
      return;
    }
  }

  // Jump down from a window back toward taskbar (ignoring current window so it never gets stuck!)
  if (cat.perchedHwnd != null && Math.random() < 0.36) {
    const dir = Math.random() < 0.5 ? 1 : -1;
    const groundY = getGroundYAt(snapshot.monitors, catCenterX, cat.y);
    jumpDownFromPerch(cat, save, catCenterX, catBottomY, catCenterX + dir * 130, groundY);
    return;
  }

  // Normal walk, run, sit, groom, loaf, or nap
  if (cat.meowCooldown <= 0 && Math.random() < 0.38) {
    cat.meowCooldown = 3.5 + Math.random() * 4.0;
    kittenAudio.playMew();
  }

  const roll = Math.random();
  if (roll < 0.4) {
    cat.state = 'walk';
    cat.facing = Math.random() < 0.5 ? 1 : -1;
    const speed = save.stage === 'tiny_kitten' ? 68 : save.stage === 'junior_kitten' ? 92 : 108;
    cat.vx = cat.facing * speed;
    cat.stateTimer = 2.2 + Math.random() * 3.0;
  } else if (roll < 0.56) {
    cat.state = 'run';
    cat.facing = Math.random() < 0.5 ? 1 : -1;
    cat.vx = cat.facing * 190;
    cat.stateTimer = 1.4 + Math.random() * 1.4;
  } else if (roll < 0.72) {
    cat.state = 'sit';
    cat.vx = 0;
    cat.stateTimer = 2.0 + Math.random() * 2.5;
  } else if (roll < 0.82) {
    cat.state = 'groom';
    cat.vx = 0;
    cat.stateTimer = 2.4 + Math.random() * 1.2;
  } else if (roll < 0.93) {
    cat.state = 'loaf';
    cat.vx = 0;
    cat.stateTimer = 3.5 + Math.random() * 4.0;
  } else {
    cat.state = 'sleep';
    cat.vx = 0;
    cat.stateTimer = 5.0 + Math.random() * 5.0;
    if (cat.perchedAppTitle) {
      recordTitlebarNap(save, cat.perchedAppTitle);
    }
  }
}

function recordTitlebarNap(save: KittenSaveState, rawTitle: string) {
  const app = formatAppLabel(rawTitle);
  save.stats.titlebarNaps += 1;
  const prev = save.stats.appSleepCounts[app] ?? 0;
  save.stats.appSleepCounts[app] = prev + 1;
  if (prev === 0) {
    pushTimelineEntry(save, {
      kind: 'milestone',
      title: `First nap on ${app} titlebar`,
      detail: 'Found a cozy ledge right above the window.',
    });
  }
}

export function popBubble(
  bubbles: BubbleEntity[],
  bubbleId: string,
  save: KittenSaveState,
  particles: Particle[],
  combo = 0,
  playSound = true,
): { popped: boolean; result: StepResult } {
  const result: StepResult = { holdCursorTarget: null };
  const idx = bubbles.findIndex((b) => b.id === bubbleId);
  if (idx < 0) return { popped: false, result };

  const [bubble] = bubbles.splice(idx, 1);
  save.stats.bubblesPopped = (save.stats.bubblesPopped ?? 0) + 1;
  save.bond = Math.min(100, save.bond + 1);
  if (playSound) {
    kittenAudio.enabled = save.settings.soundEnabled;
    kittenAudio.volume = save.settings.volume;
    kittenAudio.playBubblePop(combo);
  }
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI * 2) / 6;
    addParticle(particles, {
      kind: i % 2 === 0 ? 'sparkle' : 'petal',
      x: bubble.x + Math.cos(angle) * (bubble.radius * 0.4),
      y: bubble.y + Math.sin(angle) * (bubble.radius * 0.4),
      vx: Math.cos(angle) * 55,
      vy: Math.sin(angle) * 55 - 15,
      maxLife: 0.65,
      color: i % 2 === 0 ? '#e8d0ff' : '#f7b2e0',
    });
  }
  recordProgressionFeedback(applyXpAndEvaluate(save, 4), result);
  return { popped: true, result };
}

export function triggerCatTrick(
  cat: CatRuntime,
  save: KittenSaveState,
  particles: Particle[],
  trick?: 'trick_spin' | 'trick_highfive' | 'trick_flip',
): StepResult {
  const result: StepResult = { holdCursorTarget: null };
  const options: Array<'trick_spin' | 'trick_highfive' | 'trick_flip'> = [
    'trick_spin',
    'trick_highfive',
    'trick_flip',
  ];
  const chosen = trick ?? options[Math.floor(Math.random() * options.length)];
  const dims = getStageDimensions(save.stage, save.settings.spriteScale);

  cat.state = chosen;
  cat.stateTimer = 1.65;
  cat.vx = 0;
  cat.vy = 0;
  cat.blushTimer = 2.0;
  cat.statusBubble =
    chosen === 'trick_spin'
      ? 'Pirouette! ✨'
      : chosen === 'trick_highfive'
        ? 'High five! 🐾'
        : 'Star flip! 🌟';
  cat.statusBubbleTimer = 1.6;

  save.stats.tricksPerformed = (save.stats.tricksPerformed ?? 0) + 1;
  save.bond = Math.min(100, save.bond + 2);
  kittenAudio.enabled = save.settings.soundEnabled;
  kittenAudio.volume = save.settings.volume;
  kittenAudio.playTrickChime();
  kittenAudio.playMew();

  for (let i = 0; i < 6; i++) {
    addParticle(particles, {
      kind: 'sparkle',
      x: cat.x + dims.width / 2 + (Math.random() * 28 - 14),
      y: cat.y + Math.random() * 20 - 8,
      vx: (Math.random() - 0.5) * 44,
      vy: -26 - Math.random() * 20,
      maxLife: 0.85,
      color: i % 2 === 0 ? '#d8b4ff' : '#ffd86b',
    });
  }

  recordProgressionFeedback(applyXpAndEvaluate(save, 14), result);
  return result;
}

export function triggerCatZoomies(
  cat: CatRuntime,
  save: KittenSaveState,
  particles: Particle[],
): StepResult {
  const result: StepResult = { holdCursorTarget: null };
  const dims = getStageDimensions(save.stage, save.settings.spriteScale);
  cat.state = 'zoomies';
  cat.stateTimer = 2.8;
  cat.vx = cat.facing * 430;
  cat.vy = 0;
  cat.blushTimer = 2.4;
  cat.statusBubble = 'ZOOMIES!! ⚡💜';
  cat.statusBubbleTimer = 1.8;

  save.bond = Math.min(100, save.bond + 2);
  kittenAudio.enabled = save.settings.soundEnabled;
  kittenAudio.volume = save.settings.volume;
  kittenAudio.playTrill(true);
  kittenAudio.playMew();

  for (let i = 0; i < 5; i++) {
    addParticle(particles, {
      kind: 'sparkle',
      x: cat.x + dims.width / 2,
      y: cat.y + dims.height - 6,
      vx: -cat.facing * (30 + Math.random() * 35),
      vy: -14 - Math.random() * 18,
      maxLife: 0.65,
      color: '#cfa8ff',
    });
  }

  recordProgressionFeedback(applyXpAndEvaluate(save, 8), result);
  return result;
}

export function triggerGiftBoxAmbush(
  cat: CatRuntime,
  save: KittenSaveState,
  giftBox: GiftBoxEntity,
  targetX: number,
  targetY: number,
  particles: Particle[],
): StepResult {
  const result: StepResult = { holdCursorTarget: null };
  const dims = getStageDimensions(save.stage, save.settings.spriteScale);
  const dx = targetX - giftBox.x;

  giftBox.occupied = false;
  giftBox.wiggleTimer = 0.65;
  giftBox.cooldown = 4.5;

  cat.facing = dx >= 0 ? 1 : -1;
  cat.x = giftBox.x - dims.width / 2;
  cat.y = giftBox.y - dims.height - 4;
  cat.vx = Math.max(-220, Math.min(220, dx * 1.4));
  cat.vy = targetY < giftBox.y - 45 ? -335 : -295;
  cat.grounded = false;
  cat.perchedHwnd = null;
  cat.state = 'pounce';
  cat.yarnCatchCooldown = 4.5;
  cat.blushTimer = 2.0;
  cat.statusBubble = 'BOOP! 🎁✨';
  cat.statusBubbleTimer = 1.6;

  save.stats.boxAmbushes = (save.stats.boxAmbushes ?? 0) + 1;
  save.bond = Math.min(100, save.bond + 3);
  kittenAudio.enabled = save.settings.soundEnabled;
  kittenAudio.volume = save.settings.volume;
  kittenAudio.playCatch();
  kittenAudio.playMew();

  for (let i = 0; i < 6; i++) {
    addParticle(particles, {
      kind: i % 2 === 0 ? 'sparkle' : 'petal',
      x: giftBox.x + (Math.random() * 24 - 12),
      y: giftBox.y - 24,
      vx: (Math.random() - 0.5) * 68,
      vy: -38 - Math.random() * 26,
      maxLife: 0.9,
      color: i % 2 === 0 ? '#ffd86b' : '#cba2ff',
    });
  }

  recordProgressionFeedback(applyXpAndEvaluate(save, 15), result);
  return result;
}

export function brushCat(
  cat: CatRuntime,
  save: KittenSaveState,
  particles: Particle[],
  zone: 'head' | 'belly',
): StepResult {
  const result: StepResult = { holdCursorTarget: null };
  const dims = getStageDimensions(save.stage, save.settings.spriteScale);

  cat.vx = 0;
  cat.blushTimer = Math.max(cat.blushTimer, 1.8);
  if (zone === 'belly') {
    cat.state = 'roll_wiggle';
    cat.stateTimer = Math.max(cat.stateTimer, 1.5);
    cat.statusBubble = 'Hehe ticklish! >w<';
    cat.statusBubbleTimer = 1.4;
  } else {
    cat.state = 'petted';
    cat.stateTimer = Math.max(cat.stateTimer, 1.3);
    cat.statusBubble = 'So glossy~ ✨';
    cat.statusBubbleTimer = 1.2;
  }

  save.bond = Math.min(100, save.bond + 0.4);
  kittenAudio.enabled = save.settings.soundEnabled;
  kittenAudio.volume = save.settings.volume;
  kittenAudio.playBrushStroke();
  kittenAudio.playPurr('happy');

  if (Math.random() < 0.7) {
    addParticle(particles, {
      kind: zone === 'belly' && Math.random() < 0.5 ? 'heart' : 'sparkle',
      x: cat.x + dims.width * (0.3 + Math.random() * 0.4),
      y: cat.y + dims.height * (zone === 'belly' ? 0.55 : 0.25),
      vx: (Math.random() - 0.5) * 24,
      vy: -24 - Math.random() * 14,
      maxLife: 0.85,
      color: zone === 'belly' ? '#f5b8ff' : '#d6b4ff',
    });
  }

  recordProgressionFeedback(applyXpAndEvaluate(save, 1), result);
  return result;
}

/**
 * Creates a shooting star streaking across the upper desktop sky.
 */
export function spawnShootingStar(monitors: MonitorRect[]): ShootingStarEntity | null {
  const mon = monitors.find((m) => m.isPrimary) ?? monitors[0];
  if (!mon) return null;
  const fromLeft = Math.random() < 0.5;
  const startX = fromLeft
    ? mon.workX + mon.workWidth * (0.06 + Math.random() * 0.28)
    : mon.workX + mon.workWidth * (0.66 + Math.random() * 0.28);
  const startY = mon.workY + mon.workHeight * (0.08 + Math.random() * 0.22);
  const speed = 220 + Math.random() * 70;
  const colors = ['#fef08a', '#e9d5ff', '#fbcfe8'];
  return {
    id: `star-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    x: startX,
    y: startY,
    vx: (fromLeft ? 1 : -1) * speed,
    vy: 52 + Math.random() * 38,
    life: 0,
    maxLife: 2.3 + Math.random() * 0.6,
    color: colors[Math.floor(Math.random() * colors.length)],
    wished: false,
  };
}

/**
 * Grants a wish when clicking a streaking shooting star.
 */
export function wishOnShootingStar(
  star: ShootingStarEntity,
  cat: CatRuntime,
  save: KittenSaveState,
  particles: Particle[],
): StepResult {
  const result: StepResult = { holdCursorTarget: null };
  star.wished = true;
  save.stats.wishesMade = (save.stats.wishesMade ?? 0) + 1;
  save.bond = Math.min(100, save.bond + 5);
  save.energy = Math.min(100, save.energy + 15);
  save.treats = Math.min(100, save.treats + 15);

  cat.blushTimer = 2.8;
  cat.statusBubble = 'Make a wish! 🌠';
  cat.statusBubbleTimer = 2.6;
  kittenAudio.playWishChime();

  const colors = ['#fef08a', '#d8b4fe', '#c084fc', '#ffffff'];
  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 * i) / 12;
    const speed = 42 + Math.random() * 68;
    addParticle(particles, {
      kind: i % 4 === 0 ? 'moon' : 'sparkle',
      x: star.x,
      y: star.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 18,
      maxLife: 1.05,
      color: colors[i % colors.length],
    });
  }

  recordProgressionFeedback(applyXpAndEvaluate(save, 18), result);
  return result;
}
