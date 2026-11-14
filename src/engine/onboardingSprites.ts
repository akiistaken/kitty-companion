import { MonitorRect } from '../types/kitten';

export interface LetterpadRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EggSceneLayout {
  anchorX: number;
  anchorY: number;
  eggCenterX: number;
  eggCenterY: number;
  hitRect: { x: number; y: number; width: number; height: number };
}

export function getLetterpadRect(monitor?: MonitorRect): LetterpadRect {
  const workX = monitor?.workX ?? 0;
  const workY = monitor?.workY ?? 0;
  const workW = monitor?.workWidth ?? 1280;
  const workH = monitor?.workHeight ?? 720;
  const width = 320;
  const height = 216;
  return {
    x: Math.round(workX + (workW - width) / 2),
    y: Math.round(workY + (workH - height) / 2 - 18),
    width,
    height,
  };
}

export function getEggSceneLayout(monitor?: MonitorRect): EggSceneLayout {
  const workX = monitor?.workX ?? 0;
  const workY = monitor?.workY ?? 0;
  const workW = monitor?.workWidth ?? 1280;
  const workH = monitor?.workHeight ?? 720;
  const anchorX = Math.round(workX + workW * 0.5);
  const anchorY = Math.round(workY + workH * 0.5 + 104);
  const hitWidth = 236;
  const hitHeight = 220;
  return {
    anchorX,
    anchorY,
    eggCenterX: anchorX,
    eggCenterY: anchorY - 102,
    hitRect: {
      x: Math.round(anchorX - hitWidth / 2),
      y: Math.round(anchorY - hitHeight),
      width: hitWidth,
      height: hitHeight,
    },
  };
}

function drawPixelHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, fill: string, shine?: string) {
  ctx.fillStyle = fill;
  ctx.fillRect(cx - 3 * s, cy - 2 * s, 2 * s, 2 * s);
  ctx.fillRect(cx + 1 * s, cy - 2 * s, 2 * s, 2 * s);
  ctx.fillRect(cx - 3 * s, cy - 1 * s, 6 * s, 2 * s);
  ctx.fillRect(cx - 2 * s, cy + 1 * s, 4 * s, 1 * s);
  ctx.fillRect(cx - 1 * s, cy + 2 * s, 2 * s, 1 * s);
  if (shine) {
    ctx.fillStyle = shine;
    ctx.fillRect(cx - 2 * s, cy - 1 * s, s, s);
  }
}

function drawPixelSparkle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(cx - 1, cy - r, 2, r * 2);
  ctx.fillRect(cx - r, cy - 1, r * 2, 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx - 1, cy - 1, 2, 2);
}

function drawPixelGiftBox(ctx: CanvasRenderingContext2D, cx: number, cy: number, p: number) {
  const x = Math.round(cx - 5 * p);
  const y = Math.round(cy - 5 * p);
  // Outline
  ctx.fillStyle = '#2e1f47';
  ctx.fillRect(x - p, y + 2 * p, 12 * p, 9 * p);
  // Box body (cream-lilac)
  ctx.fillStyle = '#e7d9fb';
  ctx.fillRect(x, y + 4 * p, 10 * p, 6 * p);
  // Lid
  ctx.fillStyle = '#fffdf9';
  ctx.fillRect(x - p, y + 3 * p, 12 * p, 2 * p);
  // Vertical & horizontal amethyst ribbon
  ctx.fillStyle = '#8d63d9';
  ctx.fillRect(x + 4 * p, y + 3 * p, 2 * p, 7 * p);
  ctx.fillRect(x, y + 6 * p, 10 * p, 1 * p);
  // Bow loops on top
  ctx.fillStyle = '#a985ea';
  ctx.fillRect(x + 2 * p, y + p, 2 * p, 2 * p);
  ctx.fillRect(x + 6 * p, y + p, 2 * p, 2 * p);
  ctx.fillStyle = '#f7f2ff';
  ctx.fillRect(x + 4 * p, y + 2 * p, 2 * p, p);
}

function drawPixelBow(ctx: CanvasRenderingContext2D, cx: number, cy: number, p: number) {
  ctx.fillStyle = '#2e1f47';
  ctx.fillRect(cx - 5 * p, cy - 2 * p, 4 * p, 4 * p);
  ctx.fillRect(cx + 1 * p, cy - 2 * p, 4 * p, 4 * p);
  ctx.fillRect(cx - 2 * p, cy - 1 * p, 4 * p, 3 * p);

  ctx.fillStyle = '#b492ee';
  ctx.fillRect(cx - 4 * p, cy - 1 * p, 3 * p, 2 * p);
  ctx.fillRect(cx + 1 * p, cy - 1 * p, 3 * p, 2 * p);

  ctx.fillStyle = '#f3ebff';
  ctx.fillRect(cx - 3 * p, cy - 1 * p, p, p);
  ctx.fillRect(cx + 2 * p, cy - 1 * p, p, p);

  ctx.fillStyle = '#8d63d9';
  ctx.fillRect(cx - 1 * p, cy - 1 * p, 2 * p, 2 * p);
  // Ribbon tails
  ctx.fillRect(cx - 2 * p, cy + 1 * p, p, 2 * p);
  ctx.fillRect(cx + 1 * p, cy + 1 * p, p, 2 * p);
}

export function drawLetterpadNote(
  ctx: CanvasRenderingContext2D,
  rect: LetterpadRect,
  opts: { userName: string; animTime: number; hovered: boolean },
) {
  const { userName, animTime, hovered } = opts;
  const floatY = Math.round(Math.sin(animTime * 2.4) * 3 + (hovered ? -3 : 0));
  const x = rect.x;
  const y = rect.y + floatY;
  const w = rect.width;
  const h = rect.height;

  ctx.save();

  // Ambient twinkling sparkles around the letterpad
  const pulse = (Math.sin(animTime * 4) + 1) * 0.5;
  drawPixelSparkle(ctx, x - 16, y + 28, Math.round(3 + pulse * 2), '#e8c468');
  drawPixelSparkle(ctx, x + w + 14, y + 46, Math.round(4 - pulse * 1.5), '#b894f2');
  drawPixelSparkle(ctx, x + w - 18, y - 14, Math.round(3 + pulse * 2), '#f3ebff');

  // Soft pixel drop shadow
  ctx.fillStyle = 'rgba(46, 31, 71, 0.24)';
  ctx.fillRect(x + 6, y + 8, w, h);

  // Outer pixel border & stepped corners
  ctx.fillStyle = '#2e1f47';
  ctx.fillRect(x - 3, y, w + 6, h);
  ctx.fillRect(x, y - 3, w, h + 6);

  // Pastel lavender stationery mat border
  ctx.fillStyle = hovered ? '#dfd0f7' : '#efe7fb';
  ctx.fillRect(x, y, w, h);

  // Inner vanilla-cream parchment sheet
  const pad = 10;
  ctx.fillStyle = '#2e1f47';
  ctx.fillRect(x + pad - 2, y + pad - 2, w - pad * 2 + 4, h - pad * 2 + 4);
  ctx.fillStyle = '#fffdf8';
  ctx.fillRect(x + pad, y + pad, w - pad * 2, h - pad * 2);

  // Header strip on the note
  ctx.fillStyle = '#f5effd';
  ctx.fillRect(x + pad, y + pad, w - pad * 2, 34);
  ctx.fillStyle = '#d8c5f3';
  ctx.fillRect(x + pad, y + pad + 34, w - pad * 2, 2);

  // Subtle lavender stationery ruled lines
  ctx.fillStyle = '#eee4fb';
  for (let ly = y + pad + 64; ly <= y + h - pad - 44; ly += 22) {
    ctx.fillRect(x + pad + 14, ly, w - pad * 2 - 28, 1);
  }

  // Top center bow & wax heart seals
  drawPixelBow(ctx, Math.round(x + w / 2), y + 2, 3);
  drawPixelHeart(ctx, Math.round(x + pad + 20), y + pad + 17, 2, '#9a70e0', '#e8dbff');
  drawPixelHeart(ctx, Math.round(x + w - pad - 20), y + pad + 17, 2, '#9a70e0', '#e8dbff');

  // Cute pixel gift icon next to title
  drawPixelGiftBox(ctx, Math.round(x + w / 2), y + pad + 18, 2);

  // Stationery greeting text
  const cx = Math.round(x + w / 2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = 'bold 16px "Cascadia Mono", Consolas, monospace';
  ctx.fillStyle = '#2e1f47';
  ctx.fillText(`Meow ${userName},`, cx, y + 72);

  ctx.font = 'bold 14px "Segoe UI", "Segoe UI Emoji", system-ui, sans-serif';
  ctx.fillStyle = '#60458c';
  ctx.fillText('You got a gift from Akii 💜', cx, y + 104);

  // Little divider dots
  ctx.fillStyle = '#d3bff0';
  for (let dx = -36; dx <= 36; dx += 12) {
    ctx.fillRect(cx + dx - 1, y + 128, 3, 3);
  }

  // Interactive "Tap to reveal" pixel button
  const btnW = 166;
  const btnH = 34;
  const btnX = Math.round(cx - btnW / 2);
  const btnY = y + h - pad - 48;
  const blink = Math.sin(animTime * 4.5) > 0;

  ctx.fillStyle = '#2e1f47';
  ctx.fillRect(btnX - 2, btnY, btnW + 4, btnH);
  ctx.fillRect(btnX, btnY - 2, btnW, btnH + 4);
  ctx.fillStyle = hovered ? '#7349c2' : '#8d63d9';
  ctx.fillRect(btnX, btnY, btnW, btnH);
  ctx.fillStyle = '#b999f2';
  ctx.fillRect(btnX, btnY, btnW, 3);

  ctx.font = 'bold 12px "Cascadia Mono", Consolas, monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(blink || hovered ? '✦ Tap to reveal ✦' : '  Tap to reveal  ', cx, btnY + btnH / 2 + 1);

  ctx.restore();
}

// 23 columns x 29 rows pixel silhouette for the big iridescent dragon egg
const EGG_SILHOUETTE: string[] = [
  '.........ooooo.........',
  '.......ooLLLLLoo.......',
  '......oLLHHHHHLLo......',
  '.....oLHHHHHHHHHLo.....',
  '....oLHHSSSSSSSHHLo....',
  '....oLHSSSSSSSSSHLo....',
  '...oLHSSDDDDDDDDSSHoo..',
  '...oLHSDDDDDDDDDDSHLo..',
  '..oLHSDDDDDDDDDDDDSHLo.',
  '..oLHSDDDDDDDDDDDDSHLo.',
  '..oLHDDDDDDDDDDDDDDHLo.',
  '.oLHDDDDMMMMMMMMDDDDHLo',
  '.oLHDDDMMMMMMMMMMDDDHLo',
  '.oLHDDMMMMMMMMMMMMDDHLo',
  '.oLHDDMMMMMMMMMMMMDDHLo',
  '.oLHDDMMMMMMMMMMMMDDHLo',
  '.oLHDDDMMMMMMMMMMDDDHLo',
  '.oLDDDDMMMMMMMMMMDDDDLo',
  '.oLDDDDDDDDDDDDDDDDDDLo',
  '.oLDDDDDDDDDDDDDDDDDDLo',
  '..oLDDDDDDDDDDDDDDDDLo.',
  '..oLDDDDSSSSSSSSDDDDLo.',
  '..oLDDDSSSSSSSSSSDDDLo.',
  '...oLDSSSSSSSSSSSSSDLo.',
  '...oLSSSSSSSSSSSSSSLo..',
  '....oLSSSSSSSSSSSSLo...',
  '.....ooLSSSSSSSSLoo....',
  '.......ooLLLLLLoo......',
  '.........ooooooo.......',
];

function drawDragonEggSprite(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  bottomY: number,
  p: number,
  opts: { animTime: number; crackStage: 0 | 1 | 2 | 3 | 4; glowRatio: number },
) {
  const cols = EGG_SILHOUETTE[0].length;
  const rows = EGG_SILHOUETTE.length;
  const startX = Math.round(centerX - (cols * p) / 2);
  const startY = Math.round(bottomY - rows * p);

  // Subtle glow behind egg during hatching
  if (opts.glowRatio > 0) {
    ctx.save();
    const r = Math.round(52 + opts.glowRatio * 34);
    ctx.fillStyle = `rgba(232, 196, 104, ${0.18 + opts.glowRatio * 0.35})`;
    ctx.beginPath();
    ctx.arc(centerX, Math.round(bottomY - (rows * p) / 2), r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(180, 146, 238, ${0.18 + opts.glowRatio * 0.28})`;
    ctx.beginPath();
    ctx.arc(centerX, Math.round(bottomY - (rows * p) / 2), Math.round(r * 0.72), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  for (let row = 0; row < rows; row++) {
    const line = EGG_SILHOUETTE[row];
    for (let col = 0; col < line.length; col++) {
      const ch = line[col];
      if (ch === '.') continue;
      let color = '#2e1f47';
      if (ch === 'L') color = '#dfd0f7';
      else if (ch === 'H') color = '#fffdf9';
      else if (ch === 'S') color = '#efe7fb';
      else if (ch === 'D') color = '#d2baf6';
      else if (ch === 'M') color = '#ad8ae8';

      // Dragon-scale scalloped pixel shimmer pattern
      if ((ch === 'D' || ch === 'M') && (row + col) % 4 === 0 && row > 5 && row < 24) {
        color = ch === 'M' ? '#c8aef5' : '#e9dcff';
      }
      // Glossy highlight strip on top-left
      if (ch !== 'o' && col >= 6 && col <= 8 && row >= 4 && row <= 11) {
        color = '#ffffff';
      }
      // Little lavender-amethyst heart speckle on center
      if (col >= 10 && col <= 12 && (row === 13 || row === 14)) {
        color = '#9368d8';
      }

      ctx.fillStyle = color;
      ctx.fillRect(startX + col * p, startY + row * p, p, p);
    }
  }

  // Progressive egg crack overlays over the 5-second hatch!
  if (opts.crackStage >= 1) {
    const glow = opts.crackStage >= 2 ? '#fff4b8' : '#56293d';
    const seam = '#2e1522';

    const drawCrackSegment = (pts: Array<[number, number]>, withGlow: boolean) => {
      for (const [cx, cy] of pts) {
        ctx.fillStyle = seam;
        ctx.fillRect(startX + cx * p, startY + cy * p, p, p);
        if (withGlow) {
          ctx.fillStyle = glow;
          ctx.fillRect(startX + cx * p, startY + cy * p + 1, Math.max(2, p - 1), Math.max(2, p - 1));
        }
      }
    };

    // Stage 1: Upper-left hairline crack
    drawCrackSegment(
      [
        [7, 7],
        [8, 8],
        [8, 9],
        [9, 10],
        [10, 10],
      ],
      opts.crackStage >= 2,
    );

    if (opts.crackStage >= 2) {
      // Stage 2: Center jagged split
      drawCrackSegment(
        [
          [10, 11],
          [11, 12],
          [12, 12],
          [13, 13],
          [12, 14],
          [11, 15],
        ],
        true,
      );
    }

    if (opts.crackStage >= 3) {
      // Stage 3: Right fissure & upper split
      drawCrackSegment(
        [
          [14, 9],
          [15, 10],
          [14, 11],
          [13, 12],
          [14, 14],
          [15, 15],
          [16, 16],
        ],
        true,
      );
    }

    if (opts.crackStage >= 4) {
      // Stage 4: Full web + bright white-gold light leaks
      drawCrackSegment(
        [
          [6, 13],
          [7, 14],
          [8, 15],
          [9, 16],
          [10, 16],
          [11, 17],
          [12, 18],
          [13, 17],
          [14, 18],
          [15, 19],
          [11, 6],
          [11, 7],
          [12, 8],
        ],
        true,
      );
      // Light rays shooting from cracks
      const rayPulse = Math.sin(opts.animTime * 16) * 0.5 + 0.5;
      ctx.save();
      ctx.fillStyle = `rgba(255, 248, 200, ${0.45 + rayPulse * 0.4})`;
      ctx.fillRect(startX + 11 * p, startY + 12 * p, p * 2, p * 2);
      ctx.fillRect(startX + 9 * p, startY + 10 * p, p, p);
      ctx.fillRect(startX + 14 * p, startY + 14 * p, p, p);
      ctx.restore();
    }
  }
}

export function drawDragonEggScene(
  ctx: CanvasRenderingContext2D,
  layout: EggSceneLayout,
  opts: {
    animTime: number;
    hovered: boolean;
    showBasket: boolean;
    hatchElapsed: number;
  },
) {
  const { animTime, hovered, showBasket, hatchElapsed } = opts;
  const p = 5; // 5x crisp pixel grid for a big centerpiece dragon egg

  // Determine shake & crack stage
  let crackStage: 0 | 1 | 2 | 3 | 4 = 0;
  let shakeX = 0;
  let shakeY = 0;
  let glowRatio = 0;

  if (!showBasket) {
    // 5.0-second egg-breaking timeline
    glowRatio = Math.min(1, hatchElapsed / 5.0);
    if (hatchElapsed >= 3.8) {
      crackStage = 4;
      shakeX = Math.round(Math.sin(animTime * 46) * 5);
      shakeY = Math.round(Math.cos(animTime * 38) * 2);
    } else if (hatchElapsed >= 2.5) {
      crackStage = 3;
      shakeX = Math.round(Math.sin(animTime * 34) * 3.5);
      shakeY = Math.round(Math.abs(Math.sin(animTime * 17)) * -2);
    } else if (hatchElapsed >= 1.2) {
      crackStage = 2;
      shakeX = Math.round(Math.sin(animTime * 22) * 2.5);
    } else {
      crackStage = 1;
      shakeX = Math.round(Math.sin(animTime * 14) * 1.5);
    }
  } else {
    // Cozy idle wobble inside the basket
    const wave = Math.sin(animTime * 2.8);
    if (wave > 0.72) {
      shakeX = Math.round(Math.sin(animTime * 24) * 2);
    }
    if (hovered) {
      shakeY = -3;
    }
  }

  ctx.save();

  const basketW = 196;
  const basketH = 74;
  const basketX = Math.round(layout.anchorX - basketW / 2);
  const basketY = Math.round(layout.anchorY - basketH);

  // Soft ground shadow under basket/egg
  ctx.fillStyle = 'rgba(46, 31, 71, 0.24)';
  ctx.fillRect(
    layout.anchorX - (showBasket ? 86 : 56),
    layout.anchorY - 5,
    showBasket ? 172 : 112,
    7,
  );

  // Back rim & pastel cream-lilac cloth lining when basket is visible
  if (showBasket) {
    ctx.fillStyle = '#2e1f47';
    ctx.fillRect(basketX + 5, basketY - 10, basketW - 10, 22);
    ctx.fillStyle = '#b49778';
    ctx.fillRect(basketX + 10, basketY - 5, basketW - 20, 18);
    // Soft white-cream & lavender blanket lining peeking over the back
    ctx.fillStyle = '#fffdf9';
    ctx.fillRect(basketX + 18, basketY - 13, basketW - 36, 15);
    ctx.fillStyle = '#e5d6fa';
    ctx.fillRect(basketX + 24, basketY - 8, basketW - 48, 8);
  }

  // Draw the big dragon egg!
  const eggBottomY = showBasket ? layout.anchorY - 26 + shakeY : layout.anchorY - 6 + shakeY;
  drawDragonEggSprite(ctx, layout.anchorX + shakeX, eggBottomY, p, {
    animTime,
    crackStage,
    glowRatio,
  });

  // Front cream-oat woven wicker basket overlapping bottom of egg
  if (showBasket) {
    // Outer outline
    ctx.fillStyle = '#2e1f47';
    ctx.fillRect(basketX, basketY + 8, basketW, basketH - 16);
    ctx.fillRect(basketX + 10, basketY + basketH - 8, basketW - 20, 8);
    ctx.fillRect(basketX - 5, basketY + 3, basketW + 10, 17);

    // Wicker rim (warm oat-cream)
    ctx.fillStyle = '#ebd7bc';
    ctx.fillRect(basketX, basketY + 6, basketW, 11);
    ctx.fillStyle = '#fbf4e8';
    ctx.fillRect(basketX + 5, basketY + 6, basketW - 10, 4);

    // Scalloped cream-lavender blanket edge tucked over rim
    for (let sx = basketX + 18; sx < basketX + basketW - 22; sx += 20) {
      ctx.fillStyle = '#fffdf9';
      ctx.fillRect(sx, basketY + 15, 15, 7);
      ctx.fillStyle = '#e2d0fa';
      ctx.fillRect(sx + 3, basketY + 20, 10, 4);
    }

    // Woven basket body
    ctx.fillStyle = '#d9be9c';
    ctx.fillRect(basketX + 5, basketY + 20, basketW - 10, basketH - 28);
    ctx.fillStyle = '#bfa07a';
    for (let wy = basketY + 23; wy < basketY + basketH - 10; wy += 10) {
      const offset = Math.floor((wy - basketY) / 10) % 2 === 0 ? 0 : 10;
      for (let wx = basketX + 10 + offset; wx < basketX + basketW - 18; wx += 20) {
        ctx.fillRect(wx, wy, 10, 6);
      }
    }

    // Cute lavender bow tied on front of basket
    drawPixelBow(ctx, layout.anchorX, basketY + 36, 4);
  }

  // Ambient sparkles & prompt bubble
  const pulse = (Math.sin(animTime * 4) + 1) * 0.5;
  if (showBasket) {
    drawPixelSparkle(ctx, layout.anchorX - 84, eggBottomY - 104, Math.round(4 + pulse * 2), '#e8c468');
    drawPixelSparkle(ctx, layout.anchorX + 82, eggBottomY - 82, Math.round(5 - pulse), '#b492ee');

    const promptText = hovered ? 'Crack the egg! ✦' : 'Tap the egg!';
    drawOnboardingBubble(ctx, layout.anchorX, eggBottomY - 158, promptText);
  } else {
    // 5-second hatch progress pips above egg
    const totalPips = 5;
    const filled = Math.min(totalPips, Math.floor((hatchElapsed / 5.0) * totalPips) + 1);
    const barW = 90;
    const barX = Math.round(layout.anchorX - barW / 2);
    const barY = Math.round(eggBottomY - 166);
    ctx.fillStyle = '#2e1f47';
    ctx.fillRect(barX - 2, barY - 2, barW + 4, 14);
    ctx.fillStyle = '#fbf8ff';
    ctx.fillRect(barX, barY, barW, 10);
    for (let i = 0; i < totalPips; i++) {
      ctx.fillStyle = i < filled ? '#8d63d9' : '#e4d7f7';
      ctx.fillRect(barX + 4 + i * 17, barY + 2, 13, 6);
    }
  }

  ctx.restore();
}

function drawOnboardingBubble(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  bottomY: number,
  text: string,
) {
  ctx.save();
  ctx.font = 'bold 11px "Cascadia Mono", Consolas, monospace';
  const padX = 10;
  const textW = Math.ceil(ctx.measureText(text).width);
  const w = textW + padX * 2;
  const h = 24;
  const bx = Math.round(centerX - w / 2);
  const by = Math.round(bottomY - h);

  ctx.fillStyle = '#2e1f47';
  ctx.fillRect(bx - 2, by, w + 4, h);
  ctx.fillRect(bx, by - 2, w, h + 4);
  ctx.fillStyle = '#fdfbff';
  ctx.fillRect(bx, by, w, h);

  ctx.fillStyle = '#2e1f47';
  ctx.fillRect(Math.round(centerX - 3), by + h + 2, 6, 2);
  ctx.fillRect(Math.round(centerX - 1), by + h + 4, 2, 2);
  ctx.fillStyle = '#fdfbff';
  ctx.fillRect(Math.round(centerX - 2), by + h, 4, 2);

  ctx.fillStyle = '#2e1f47';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, centerX, by + h / 2 + 1);
  ctx.restore();
}
