import {
  BubbleEntity,
  ButterflyEntity,
  CushionEntity,
  DesktopSnapshot,
  FeatherWandState,
  GiftBoxEntity,
  LavenderPlantEntity,
  MonitorRect,
  ToyEntity,
  WalkableLedge,
  WindowPlatform,
} from '../types/kitten';

export const GRAVITY = 1520; // px / s^2

interface Interval {
  start: number;
  end: number;
}

function subtractIntervals(base: Interval, blockers: Interval[]): Interval[] {
  let intervals: Interval[] = [base];
  for (const b of blockers) {
    if (b.end <= b.start) continue;
    const next: Interval[] = [];
    for (const seg of intervals) {
      if (b.end <= seg.start || b.start >= seg.end) {
        next.push(seg);
      } else {
        if (b.start > seg.start) {
          next.push({ start: seg.start, end: b.start });
        }
        if (b.end < seg.end) {
          next.push({ start: b.end, end: seg.end });
        }
      }
    }
    intervals = next;
  }
  return intervals.filter((i) => i.end - i.start >= 56);
}

/**
 * Builds all walkable horizontal ledges across monitors:
 * - Taskbar / work-area floor of every monitor is ALWAYS the ground floor.
 * - Exposed (unoccluded) top edges of visible OS windows act as jumpable titlebar ledges.
 */
export function buildWalkableLedges(snapshot: DesktopSnapshot): WalkableLedge[] {
  const ledges: WalkableLedge[] = [];

  for (let i = 0; i < snapshot.monitors.length; i++) {
    const m = snapshot.monitors[i];
    const groundY = m.workY + m.workHeight;
    ledges.push({
      id: `taskbar-${i}`,
      kind: 'taskbar',
      startX: m.workX,
      endX: m.workX + m.workWidth,
      y: groundY,
    });
  }

  // Z-ordered front-to-back window titlebar discovery
  const wins = snapshot.windows;
  for (let i = 0; i < wins.length; i++) {
    const w = wins[i];
    if (w.y < -16 || w.width < 120 || w.height < 60) continue;

    // Collect higher Z-order windows covering this window's top edge y
    const blockers: Interval[] = [];
    for (let j = 0; j < i; j++) {
      const upper = wins[j];
      if (upper.y <= w.y && upper.y + upper.height >= w.y - 4) {
        blockers.push({ start: upper.x, end: upper.x + upper.width });
      }
    }

    const visibleSegs = subtractIntervals(
      { start: w.x + 14, end: w.x + w.width - 14 },
      blockers,
    );

    for (let k = 0; k < visibleSegs.length; k++) {
      const seg = visibleSegs[k];
      // Skip ledges below the taskbar ground of the monitor containing them
      const mon = findMonitorForPoint(snapshot.monitors, (seg.start + seg.end) / 2, w.y);
      if (mon && w.y >= mon.workY + mon.workHeight - 10) continue;

      // For maximized / top-snapped windows (y near top of screen), keep the walkable
      // ledge slightly lower on the titlebar so the kitten remains visible on-screen.
      const ledgeY =
        mon && w.y < mon.workY + 28 && w.height >= 72
          ? Math.min(mon.workY + 28, w.y + 28)
          : w.y;

      ledges.push({
        id: `win-${w.hwnd}-${k}`,
        kind: 'window',
        hwnd: w.hwnd,
        title: w.title,
        isMedia: w.isMedia,
        isForeground: w.isForeground,
        startX: seg.start,
        endX: seg.end,
        y: ledgeY,
      });
    }
  }

  return ledges;
}

export function findMonitorForPoint(
  monitors: MonitorRect[],
  x: number,
  y: number,
): MonitorRect | null {
  for (const m of monitors) {
    if (x >= m.x && x <= m.x + m.width && y >= m.y && y <= m.y + m.height) {
      return m;
    }
  }
  // Nearest monitor horizontally fallback
  let best: MonitorRect | null = null;
  let bestDist = Infinity;
  for (const m of monitors) {
    const cx = m.x + m.width / 2;
    const d = Math.abs(cx - x);
    if (d < bestDist) {
      bestDist = d;
      best = m;
    }
  }
  return best;
}

export function getGroundYAt(monitors: MonitorRect[], x: number, yHint: number): number {
  const m = findMonitorForPoint(monitors, x, yHint);
  if (!m) return 700;
  return m.workY + m.workHeight;
}

export function clampXToVirtualDesktop(
  monitors: MonitorRect[],
  x: number,
  spriteWidth: number,
): number {
  if (monitors.length === 0) return x;
  let minX = Infinity;
  let maxX = -Infinity;
  for (const m of monitors) {
    minX = Math.min(minX, m.x);
    maxX = Math.max(maxX, m.x + m.width);
  }
  return Math.max(minX, Math.min(maxX - spriteWidth, x));
}

/**
 * Finds an adjacent monitor's taskbar ledge when crossing past the edge of `fromLedge`.
 * Supports monitors that touch seamlessly or have small bezel/work-area gaps.
 */
export function findAdjacentTaskbarLedge(
  ledges: WalkableLedge[],
  fromLedge: WalkableLedge,
  dir: 1 | -1,
): WalkableLedge | null {
  if (fromLedge.kind !== 'taskbar') return null;
  let best: WalkableLedge | null = null;
  let bestGap = Infinity;

  for (const l of ledges) {
    if (l.kind !== 'taskbar' || l.id === fromLedge.id) continue;
    if (dir === 1) {
      const gap = l.startX - fromLedge.endX;
      if (gap >= -32 && gap <= 80 && Math.abs(gap) < bestGap) {
        bestGap = Math.abs(gap);
        best = l;
      }
    } else {
      const gap = fromLedge.startX - l.endX;
      if (gap >= -32 && gap <= 80 && Math.abs(gap) < bestGap) {
        bestGap = Math.abs(gap);
        best = l;
      }
    }
  }
  return best;
}

export function findLandingLedge(
  ledges: WalkableLedge[],
  centerX: number,
  prevBottomY: number,
  nextBottomY: number,
  ignoreHwnd?: number | null,
): WalkableLedge | null {
  if (nextBottomY < prevBottomY) return null;
  let best: WalkableLedge | null = null;
  let bestY = Infinity;
  for (const ledge of ledges) {
    if (ignoreHwnd != null && ledge.hwnd === ignoreHwnd) continue;
    if (centerX >= ledge.startX && centerX <= ledge.endX) {
      if (ledge.y >= prevBottomY - 6 && ledge.y <= nextBottomY + 4) {
        if (ledge.y < bestY) {
          bestY = ledge.y;
          best = ledge;
        }
      }
    }
  }
  return best;
}

export function computeJumpVelocity(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  extraArc = 58,
  maxRisePx?: number,
): { vx: number; vy: number } {
  const apexY = Math.min(fromY, toY) - extraArc;
  const rawRise = Math.max(24, fromY - apexY);
  const rise = maxRisePx !== undefined ? Math.min(rawRise, Math.max(24, maxRisePx)) : rawRise;
  const effectiveApexY = fromY - rise;
  const fall = Math.max(12, toY - effectiveApexY);
  const vy = -Math.sqrt(2 * GRAVITY * rise);
  const tUp = Math.abs(vy) / GRAVITY;
  const tDown = Math.sqrt((2 * fall) / GRAVITY);
  const totalTime = Math.max(0.22, tUp + tDown);
  const vx = (toX - fromX) / totalTime;
  return { vx, vy };
}

export function stepToysPhysics(
  toys: ToyEntity[],
  ledges: WalkableLedge[],
  windows: WindowPlatform[],
  monitors: MonitorRect[],
  dt: number,
): void {
  for (const toy of toys) {
    if (toy.heldBy) {
      toy.settled = false;
      continue;
    }
    if (toy.settled) {
      // Check if ledge underneath disappeared
      const under = findLandingLedge(ledges, toy.x, toy.y + toy.radius - 2, toy.y + toy.radius + 4);
      if (!under) {
        toy.settled = false;
      } else {
        continue;
      }
    }

    const prevBottom = toy.y + toy.radius;
    toy.vy += GRAVITY * dt;
    toy.x += toy.vx * dt;
    toy.y += toy.vy * dt;
    toy.rotation += (toy.vx * dt) / Math.max(8, toy.radius);

    // Bounce off window side walls gently
    for (const w of windows) {
      if (toy.y > w.y + 8 && toy.y < w.y + w.height - 8) {
        if (toy.x - toy.radius < w.x && toy.x > w.x - 18 && toy.vx < 0) {
          toy.x = w.x + toy.radius;
          toy.vx = Math.abs(toy.vx) * 0.7;
        } else if (toy.x + toy.radius > w.x + w.width && toy.x < w.x + w.width + 18 && toy.vx > 0) {
          toy.x = w.x + w.width - toy.radius;
          toy.vx = -Math.abs(toy.vx) * 0.7;
        }
      }
    }

    // Bounce off virtual monitor edges
    let minX = Infinity;
    let maxX = -Infinity;
    for (const m of monitors) {
      minX = Math.min(minX, m.x);
      maxX = Math.max(maxX, m.x + m.width);
    }
    if (toy.x - toy.radius < minX) {
      toy.x = minX + toy.radius;
      toy.vx = Math.abs(toy.vx) * 0.8;
    } else if (toy.x + toy.radius > maxX) {
      toy.x = maxX - toy.radius;
      toy.vx = -Math.abs(toy.vx) * 0.8;
    }

    // Ledge / Taskbar ground collision
    const nextBottom = toy.y + toy.radius;
    const hit = findLandingLedge(ledges, toy.x, prevBottom, nextBottom);
    const groundY = getGroundYAt(monitors, toy.x, toy.y);

    if (hit && toy.vy >= 0) {
      toy.y = hit.y - toy.radius;
      if (Math.abs(toy.vy) > 130 && toy.bounces < 6) {
        toy.vy = -Math.abs(toy.vy) * (toy.kind === 'yarn' ? 0.62 : 0.35);
        toy.vx *= 0.84;
        toy.bounces += 1;
      } else {
        toy.vy = 0;
        toy.vx *= 0.9;
        if (Math.abs(toy.vx) < 8) {
          toy.vx = 0;
          toy.settled = true;
        }
      }
    } else if (nextBottom >= groundY) {
      toy.y = groundY - toy.radius;
      if (Math.abs(toy.vy) > 130 && toy.bounces < 6) {
        toy.vy = -Math.abs(toy.vy) * (toy.kind === 'yarn' ? 0.62 : 0.35);
        toy.vx *= 0.84;
        toy.bounces += 1;
      } else {
        toy.vy = 0;
        toy.vx *= 0.9;
        if (Math.abs(toy.vx) < 8) {
          toy.vx = 0;
          toy.settled = true;
        }
      }
    }
  }
}

export function stepButterflies(
  butterflies: ButterflyEntity[],
  monitors: MonitorRect[],
  dt: number,
): void {
  for (let i = butterflies.length - 1; i >= 0; i--) {
    const b = butterflies[i];
    b.life += dt;
    b.phase += dt;
    if (b.life >= b.maxLife) {
      butterflies.splice(i, 1);
      continue;
    }

    b.x += b.vx * dt;
    if (b.booped) {
      b.y += b.vy * dt;
      continue;
    }

    if (typeof b.baseY !== 'number') {
      b.baseY = b.y;
    }
    // Flutter gently around 1.5x kitten height (baseY) instead of drifting out of reach
    const targetY = b.baseY + Math.sin(b.phase * 4.2) * 12;
    b.y += (targetY - b.y) * Math.min(1, dt * 6);

    const mon = findMonitorForPoint(monitors, b.x, b.y) ?? monitors[0];
    if (mon) {
      const leftBound = mon.workX + 20;
      const rightBound = mon.workX + mon.workWidth - 20;
      if (b.x < leftBound) {
        b.x = leftBound;
        b.vx = Math.abs(b.vx);
      } else if (b.x > rightBound) {
        b.x = rightBound;
        b.vx = -Math.abs(b.vx);
      }
      const floorY = mon.workY + mon.workHeight - 24;
      const ceilY = mon.workY + 24;
      b.baseY = Math.max(ceilY, Math.min(floorY, b.baseY));
    }
  }
}

interface SurfacePropLike {
  active: boolean;
  x: number;
  y: number;
  vx?: number;
  vy: number;
  grounded: boolean;
}

function stepSurfacePropPhysics(
  prop: SurfacePropLike,
  ledges: WalkableLedge[],
  monitors: MonitorRect[],
  dt: number,
  halfWidth: number,
  isDragging = false,
): void {
  if (!prop.active || isDragging) return;

  prop.vx = prop.vx ?? 0;

  if (prop.grounded && Math.abs(prop.vx) < 2) {
    const under = findLandingLedge(ledges, prop.x, prop.y - 4, prop.y + 8);
    const groundY = getGroundYAt(monitors, prop.x, prop.y - 20);
    if (under) {
      prop.y = under.y;
      return;
    }
    if (Math.abs(prop.y - groundY) <= 6) {
      prop.y = groundY;
      return;
    }
    prop.grounded = false;
  }

  const prevY = prop.y;
  prop.x =
    clampXToVirtualDesktop(monitors, prop.x + prop.vx * dt - halfWidth, halfWidth * 2) +
    halfWidth;
  const mon = findMonitorForPoint(monitors, prop.x, prop.y) ?? monitors[0];
  if (mon) {
    const margin = halfWidth + 4;
    if (prop.x <= mon.workX + margin && prop.vx < 0) prop.vx = Math.abs(prop.vx) * 0.55;
    if (prop.x >= mon.workX + mon.workWidth - margin && prop.vx > 0) {
      prop.vx = -Math.abs(prop.vx) * 0.55;
    }
  }

  prop.vy += GRAVITY * dt;
  prop.y += prop.vy * dt;

  const hit = findLandingLedge(ledges, prop.x, prevY, prop.y);
  const groundY = getGroundYAt(monitors, prop.x, prop.y);
  if (hit && prop.vy >= 0) {
    prop.y = hit.y;
    prop.vy = 0;
    prop.vx *= 0.72;
    if (Math.abs(prop.vx) < 8) {
      prop.vx = 0;
      prop.grounded = true;
    }
  } else if (prop.y >= groundY) {
    prop.y = groundY;
    prop.vy = 0;
    prop.vx *= 0.72;
    if (Math.abs(prop.vx) < 8) {
      prop.vx = 0;
      prop.grounded = true;
    }
  }
}

export function stepCushionPhysics(
  cushion: CushionEntity,
  ledges: WalkableLedge[],
  monitors: MonitorRect[],
  dt: number,
  isDragging = false,
): void {
  stepSurfacePropPhysics(cushion, ledges, monitors, dt, 36, isDragging);
}

export function stepPlantPhysics(
  plant: LavenderPlantEntity,
  ledges: WalkableLedge[],
  monitors: MonitorRect[],
  dt: number,
  isDragging = false,
): void {
  if (plant.swayTimer > 0) {
    plant.swayTimer = Math.max(0, plant.swayTimer - dt);
  }
  stepSurfacePropPhysics(plant, ledges, monitors, dt, 22, isDragging);
}

export function stepGiftBoxPhysics(
  box: GiftBoxEntity,
  ledges: WalkableLedge[],
  monitors: MonitorRect[],
  dt: number,
  isDragging = false,
): void {
  if (box.wiggleTimer > 0) {
    box.wiggleTimer = Math.max(0, box.wiggleTimer - dt);
  }
  if (box.cooldown > 0) {
    box.cooldown = Math.max(0, box.cooldown - dt);
  }
  stepSurfacePropPhysics(box, ledges, monitors, dt, 26, isDragging);
}

export function stepBubbles(
  bubbles: BubbleEntity[],
  monitors: MonitorRect[],
  dt: number,
): void {
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i];
    b.life += dt;
    b.phase += dt;
    if (b.popped || b.life >= b.maxLife) {
      bubbles.splice(i, 1);
      continue;
    }

    b.x += (b.vx + Math.sin(b.phase * 2.6) * 18) * dt;
    b.y += b.vy * dt;

    const mon = findMonitorForPoint(monitors, b.x, b.y) ?? monitors[0];
    if (mon) {
      const minX = mon.workX + b.radius + 8;
      const maxX = mon.workX + mon.workWidth - b.radius - 8;
      const minY = mon.workY + b.radius + 16;
      const maxY = mon.workY + mon.workHeight - b.radius - 12;
      if (b.x < minX) {
        b.x = minX;
        b.vx = Math.abs(b.vx);
      } else if (b.x > maxX) {
        b.x = maxX;
        b.vx = -Math.abs(b.vx);
      }
      if (b.y < minY) {
        b.y = minY;
        b.vy = Math.abs(b.vy) * 0.65;
      } else if (b.y > maxY) {
        b.y = maxY;
        b.vy = -Math.abs(b.vy) - 18;
      }
    }
  }
}

export function stepFeatherWandPhysics(
  wand: FeatherWandState,
  ledges: WalkableLedge[],
  monitors: MonitorRect[],
  dt: number,
): void {
  if (!wand.active || wand.heldByCursor) return;

  if (wand.grounded && Math.abs(wand.vx) < 2) {
    const under = findLandingLedge(ledges, wand.x, wand.y + 8, wand.y + 22);
    const groundY = getGroundYAt(monitors, wand.x, wand.y);
    if (under) {
      wand.y = under.y - 14;
      return;
    }
    if (Math.abs(wand.y + 14 - groundY) <= 6) {
      wand.y = groundY - 14;
      return;
    }
    wand.grounded = false;
  }

  const prevBottom = wand.y + 14;
  wand.x = clampXToVirtualDesktop(monitors, wand.x + wand.vx * dt - 18, 36) + 18;
  wand.vy += GRAVITY * dt;
  wand.y += wand.vy * dt;
  const nextBottom = wand.y + 14;

  const mon = findMonitorForPoint(monitors, wand.x, wand.y) ?? monitors[0];
  if (mon) {
    if (wand.x <= mon.workX + 20 && wand.vx < 0) wand.vx = Math.abs(wand.vx) * 0.6;
    if (wand.x >= mon.workX + mon.workWidth - 20 && wand.vx > 0) wand.vx = -Math.abs(wand.vx) * 0.6;
  }

  const hit = findLandingLedge(ledges, wand.x, prevBottom, nextBottom);
  const groundY = getGroundYAt(monitors, wand.x, wand.y);
  if (hit && wand.vy >= 0) {
    wand.y = hit.y - 14;
    if (Math.abs(wand.vy) > 130) {
      wand.vy = -Math.abs(wand.vy) * 0.42;
      wand.vx *= 0.8;
    } else {
      wand.vy = 0;
      wand.vx *= 0.8;
      if (Math.abs(wand.vx) < 8) {
        wand.vx = 0;
        wand.grounded = true;
      }
    }
  } else if (nextBottom >= groundY) {
    wand.y = groundY - 14;
    if (Math.abs(wand.vy) > 130) {
      wand.vy = -Math.abs(wand.vy) * 0.42;
      wand.vx *= 0.8;
    } else {
      wand.vy = 0;
      wand.vx *= 0.8;
      if (Math.abs(wand.vx) < 8) {
        wand.vx = 0;
        wand.grounded = true;
      }
    }
  }
}

export function createBrowserFallbackSnapshot(): DesktopSnapshot {
  const w = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const h = typeof window !== 'undefined' ? window.innerHeight : 720;
  return {
    virtualX: 0,
    virtualY: 0,
    virtualWidth: w,
    virtualHeight: h,
    cursorX: w / 2,
    cursorY: h / 2,
    idleMs: 0,
    isAudioPlaying: false,
    monitors: [
      {
        x: 0,
        y: 0,
        width: w,
        height: h,
        workX: 0,
        workY: 0,
        workWidth: w,
        workHeight: Math.max(200, h - 48),
        isPrimary: true,
      },
    ],
    windows: [
      {
        hwnd: 1001,
        x: Math.round(w * 0.14),
        y: Math.round(h * 0.32),
        width: Math.round(w * 0.44),
        height: Math.round(h * 0.42),
        title: 'VS Code - Kitten Preview',
        zIndex: 0,
        isForeground: true,
        isMedia: false,
      },
    ],
  };
}
