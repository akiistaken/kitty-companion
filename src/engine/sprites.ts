import {
  AccessoryId,
  BubbleEntity,
  ButterflyEntity,
  CatBehaviorState,
  CoatId,
  GiftBoxEntity,
  LanternEntity,
  LifeStage,
  LoveNoteEntity,
  QuickWheelActionId,
  QuickWheelState,
  ShootingStarEntity,
  ToyKind,
} from '../types/kitten';

export interface CoatPalette {
  id: CoatId;
  name: string;
  outline: string;
  body: string;
  shade: string;
  belly: string;
  stripe: string;
  earInner: string;
  eye: string;
  eyeShine: string;
  blush: string;
}

export const COAT_PALETTES: Record<CoatId, CoatPalette> = {
  ginger: {
    id: 'ginger',
    name: 'Ginger Tabby',
    outline: '#2b1c17',
    body: '#f29f4b',
    shade: '#d6782a',
    belly: '#fce5c2',
    stripe: '#b85314',
    earInner: '#f49ca8',
    eye: '#2f5b38',
    eyeShine: '#fffaf0',
    blush: '#f28b9a',
  },
  tuxedo: {
    id: 'tuxedo',
    name: 'Tuxedo',
    outline: '#14131a',
    body: '#2c2c38',
    shade: '#1c1c26',
    belly: '#f7f5f0',
    stripe: '#3c3c4c',
    earInner: '#ee9aa6',
    eye: '#d6a128',
    eyeShine: '#ffffff',
    blush: '#f28ca0',
  },
  calico: {
    id: 'calico',
    name: 'Calico',
    outline: '#241b1a',
    body: '#faf4ea',
    shade: '#dfd3c3',
    belly: '#fffdf9',
    stripe: '#e57b33',
    earInner: '#f398a3',
    eye: '#4b7b4b',
    eyeShine: '#ffffff',
    blush: '#f49aa8',
  },
  void: {
    id: 'void',
    name: 'Void Black',
    outline: '#0d0c12',
    body: '#252330',
    shade: '#171520',
    belly: '#343144',
    stripe: '#14121b',
    earInner: '#8a5d6d',
    eye: '#f0b83a',
    eyeShine: '#fff8dc',
    blush: '#b5677b',
  },
  siamese: {
    id: 'siamese',
    name: 'Siamese',
    outline: '#291e1a',
    body: '#efe1cb',
    shade: '#cbb597',
    belly: '#faf3e8',
    stripe: '#5b4338',
    earInner: '#d89a9e',
    eye: '#4f9be8',
    eyeShine: '#ffffff',
    blush: '#f0949d',
  },
  gray_tabby: {
    id: 'gray_tabby',
    name: 'Gray Striped',
    outline: '#1e2129',
    body: '#98a2b3',
    shade: '#727c8e',
    belly: '#e4e8ef',
    stripe: '#4f5766',
    earInner: '#eda0ab',
    eye: '#6ea854',
    eyeShine: '#ffffff',
    blush: '#f094a3',
  },
  sakura: {
    id: 'sakura',
    name: 'Sakura Milk',
    outline: '#3b1e29',
    body: '#f9c5d5',
    shade: '#eba3ba',
    belly: '#fff5f8',
    stripe: '#e07a9b',
    earInner: '#ff8da8',
    eye: '#3c8d89',
    eyeShine: '#ffffff',
    blush: '#ff7096',
  },
  lavender: {
    id: 'lavender',
    name: 'Lavender Dream',
    outline: '#291f3d',
    body: '#cbb8f0',
    shade: '#ab94da',
    belly: '#f8f5ff',
    stripe: '#8a72be',
    earInner: '#f4a5c7',
    eye: '#5a3d99',
    eyeShine: '#ffffff',
    blush: '#f28eb6',
  },
  vanilla: {
    id: 'vanilla',
    name: 'Vanilla Cream',
    outline: '#36241b',
    body: '#f7ebd2',
    shade: '#e3cfa9',
    belly: '#fffdf7',
    stripe: '#c99b6b',
    earInner: '#f29ea9',
    eye: '#6d4c3d',
    eyeShine: '#ffffff',
    blush: '#f598a4',
  },
  lilac_ragdoll: {
    id: 'lilac_ragdoll',
    name: 'Lilac Ragdoll',
    outline: '#2b2042',
    body: '#f7f2fc',
    shade: '#dfd3f2',
    belly: '#ffffff',
    stripe: '#9b82cf',
    earInner: '#f4a5c7',
    eye: '#7456c4',
    eyeShine: '#ffffff',
    blush: '#f29bc0',
  },
  starlight_plum: {
    id: 'starlight_plum',
    name: 'Starlight Plum',
    outline: '#1a102b',
    body: '#52347d',
    shade: '#3b235e',
    belly: '#e7d7ff',
    stripe: '#8a66c9',
    earInner: '#f29bc4',
    eye: '#ffd966',
    eyeShine: '#fffdf5',
    blush: '#e37ab5',
  },
  wisteria_calico: {
    id: 'wisteria_calico',
    name: 'Wisteria Calico',
    outline: '#2e1f47',
    body: '#fcf8ff',
    shade: '#e8dcf7',
    belly: '#ffffff',
    stripe: '#b58be8',
    earInner: '#f4a5c7',
    eye: '#8757c9',
    eyeShine: '#ffffff',
    blush: '#f499bf',
  },
};

export const DEFAULT_SPRITE_SCALE = 6;

export interface StageGeometry {
  label: string;
  pixelScale: number;
  gridWidth: number;
  gridHeight: number;
  widthPx: number;
  heightPx: number;
  headWidth: number;
  headHeight: number;
  bodyWidth: number;
  bodyHeight: number;
  legHeight: number;
  tailLen: number;
  earHeight: number;
  hasWhiskers: boolean;
  hasRuff: boolean;
  hasEarTufts: boolean;
}

export const STAGE_GEOMETRY: Record<LifeStage, StageGeometry> = {
  tiny_kitten: {
    label: 'Tiny Kitten',
    pixelScale: DEFAULT_SPRITE_SCALE,
    gridWidth: 16,
    gridHeight: 14,
    widthPx: 96,
    heightPx: 84,
    headWidth: 10,
    headHeight: 7,
    bodyWidth: 7,
    bodyHeight: 4,
    legHeight: 2,
    tailLen: 2,
    earHeight: 2,
    hasWhiskers: false,
    hasRuff: false,
    hasEarTufts: false,
  },
  junior_kitten: {
    label: 'Junior Kitten',
    pixelScale: DEFAULT_SPRITE_SCALE,
    gridWidth: 18,
    gridHeight: 16,
    widthPx: 108,
    heightPx: 96,
    headWidth: 9,
    headHeight: 7,
    bodyWidth: 10,
    bodyHeight: 5,
    legHeight: 3,
    tailLen: 5,
    earHeight: 3,
    hasWhiskers: false,
    hasRuff: false,
    hasEarTufts: false,
  },
  young_cat: {
    label: 'Young Cat',
    pixelScale: DEFAULT_SPRITE_SCALE,
    gridWidth: 20,
    gridHeight: 18,
    widthPx: 120,
    heightPx: 108,
    headWidth: 10,
    headHeight: 8,
    bodyWidth: 12,
    bodyHeight: 6,
    legHeight: 4,
    tailLen: 6,
    earHeight: 3,
    hasWhiskers: true,
    hasRuff: false,
    hasEarTufts: false,
  },
  grown_cat: {
    label: 'Grown Cat',
    pixelScale: DEFAULT_SPRITE_SCALE,
    gridWidth: 22,
    gridHeight: 20,
    widthPx: 132,
    heightPx: 120,
    headWidth: 11,
    headHeight: 9,
    bodyWidth: 14,
    bodyHeight: 8,
    legHeight: 4,
    tailLen: 7,
    earHeight: 4,
    hasWhiskers: true,
    hasRuff: true,
    hasEarTufts: true,
  },
};

export function clampSpriteScale(scale?: number): number {
  const n = typeof scale === 'number' && Number.isFinite(scale) ? Math.round(scale) : DEFAULT_SPRITE_SCALE;
  return Math.max(2, Math.min(9, n));
}

export function getStageDimensions(
  stage: LifeStage,
  spriteScale?: number,
): { width: number; height: number } {
  const g = STAGE_GEOMETRY[stage];
  const s = clampSpriteScale(spriteScale);
  return { width: g.gridWidth * s, height: g.gridHeight * s };
}

function drawFairyWings(
  px: (gx: number, gy: number, color: string, w?: number, h?: number) => void,
  wx: number,
  wy: number,
  animTime: number,
) {
  const flap = Math.floor(animTime * 6) % 2;
  const lift = flap === 0 ? 0 : -1;
  px(wx - 2, wy - 3 + lift, '#2e1f47', 4, 4);
  px(wx - 1, wy - 2 + lift, '#d9c4ff', 3, 2);
  px(wx - 1, wy - 2 + lift, '#fff8ff', 1, 1);
  px(wx - 1, wy + 1 + lift, '#2e1f47', 3, 2);
  px(wx, wy + 1 + lift, '#c8a6f7', 2, 1);
}

function drawBodyCoatDetails(
  px: (gx: number, gy: number, color: string, w?: number, h?: number) => void,
  coat: CoatId,
  bx: number,
  by: number,
  bw: number,
  animTime: number,
) {
  if (coat === 'calico') {
    px(bx + 1, by + 1, '#262129', 3, 2);
  } else if (coat === 'wisteria_calico') {
    px(bx + 1, by + 1, '#8d63d9', 3, 2);
    if (bw > 7) px(bx + 5, by + 1, '#e89cd0', 2, 2);
  } else if (coat === 'starlight_plum') {
    const twinkle = Math.floor(animTime * 3) % 2 === 0;
    px(bx + 2, by + 1, twinkle ? '#ffe787' : '#d8c2f8', 1, 1);
    if (bw > 7) px(bx + 6, by + 2, twinkle ? '#d8c2f8' : '#ffe787', 1, 1);
  }
}

export interface PixelCatDrawOpts {
  x: number;
  y: number;
  facing: 1 | -1;
  stage: LifeStage;
  coat: CoatId;
  accessory: AccessoryId;
  state: CatBehaviorState;
  animTime: number;
  pixelScale?: number;
  blush?: boolean;
  slowBlink?: boolean;
  pokeStreak?: number;
  cuddledYarnColor?: string | null;
}

const CAT_CACHE_PAD = 8;
const MAX_CAT_FRAME_CACHE = 96;
const catFrameCache = new Map<string, HTMLCanvasElement>();

export function clearSpriteCache(): void {
  catFrameCache.clear();
}

export function getSpriteCacheSize(): number {
  return catFrameCache.size;
}

function getCatSpriteSubFrame(opts: PixelCatDrawOpts): string {
  const { state, animTime, coat, accessory, pokeStreak, cuddledYarnColor } = opts;
  const starTwinkle = coat === 'starlight_plum' ? Math.floor(animTime * 3) % 2 : 0;
  const wingFlap = accessory === 'fairy_wings' ? Math.floor(animTime * 6) % 2 : 0;
  const suffix = `${starTwinkle}:${wingFlap}`;

  if (state === 'trick_spin' || state === 'trick_flip') {
    return `base:${suffix}`;
  }
  if (state === 'stretch') {
    return `st:${Math.floor(animTime * 4) % 6}:${suffix}`;
  }
  if (state === 'roll_wiggle') {
    return `rw:${Math.floor(animTime * 8) % 4}:${suffix}`;
  }
  if (state === 'peek') {
    return `pk:${Math.floor(animTime * 2.5) % 2}:${Math.floor(animTime * 6) % 4}:${suffix}`;
  }
  if (state === 'sleep' || state === 'loaf' || state === 'cuddle_yarn') {
    return `sl:${Math.floor(animTime * 2) % 2}:${state === 'cuddle_yarn' ? cuddledYarnColor ?? '' : ''}:${suffix}`;
  }
  if (state === 'head_bob') {
    return `hb:${Math.floor(animTime * 4.5) % 4}:${suffix}`;
  }
  if (state === 'trick_highfive' || state === 'reach_yarn' || state === 'hold_cursor' || state === 'eat') {
    return `ff:${Math.floor(animTime * 11) % 2}:${suffix}`;
  }
  if (state === 'run' || state === 'zoomies') {
    return `rn:${Math.floor(animTime * 6) % 2}:${Math.floor(animTime * 11) % 3}:${suffix}`;
  }
  if (state === 'poked') {
    return `po:${(pokeStreak ?? 1) >= 3 ? 3 : 1}:${suffix}`;
  }
  if (state === 'sit' || state === 'petted' || state === 'celebrate') {
    const wagRate = state === 'petted' || state === 'celebrate' ? 8 : 3;
    return `si:${Math.floor(animTime * wagRate) % 2}:${Math.floor(animTime * 11) % 2}:${suffix}`;
  }
  return `f:${Math.floor(animTime * 6) % 2}:${suffix}`;
}

/**
 * Procedural-pixel crisp sprite composer (integer grid cells -> zero blur).
 * Draws a distinct pixel-art cat for every life stage, pose, coat, and accessory.
 */
export function drawPixelCat(
  ctx: CanvasRenderingContext2D,
  opts: PixelCatDrawOpts,
) {
  const geo = STAGE_GEOMETRY[opts.stage];
  const s = clampSpriteScale(opts.pixelScale);

  const gw = geo.gridWidth;
  const gh = geo.gridHeight;
  const widthPx = gw * s;
  const heightPx = gh * s;

  const isSpin = opts.state === 'trick_spin';
  const isFlip = opts.state === 'trick_flip';
  const isSlowBlink = Boolean(opts.slowBlink);
  const blink = isSlowBlink || Math.floor(opts.animTime * 2) % 9 === 0;
  const showBlush =
    Boolean(opts.blush) ||
    isSlowBlink ||
    opts.stage === 'tiny_kitten' ||
    opts.state === 'petted' ||
    opts.state === 'celebrate' ||
    opts.state === 'eat' ||
    opts.state === 'cuddle_yarn' ||
    opts.state === 'knead' ||
    opts.state === 'stretch' ||
    opts.state === 'head_bob' ||
    opts.state === 'trick_highfive' ||
    isSpin ||
    opts.state === 'roll_wiggle' ||
    opts.state === 'zoomies' ||
    opts.state === 'peek';

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const drawX = Math.round(opts.x);
  const drawY = Math.round(opts.y);

  ctx.translate(drawX + (opts.facing === -1 ? widthPx : 0), drawY);
  ctx.scale(opts.facing, 1);

  if (isSpin) {
    const spinCos = Math.cos(opts.animTime * 15);
    const scaleX = Math.abs(spinCos) < 0.18 ? (spinCos >= 0 ? 0.18 : -0.18) : spinCos;
    ctx.translate(widthPx / 2, 0);
    ctx.scale(scaleX, 1);
    ctx.translate(-widthPx / 2, 0);
  } else if (isFlip) {
    ctx.translate(widthPx / 2, heightPx * 0.55);
    ctx.rotate(opts.animTime * Math.PI * 5.2);
    ctx.translate(-widthPx / 2, -heightPx * 0.55);
  }

  if (typeof document !== 'undefined') {
    const subFrame = getCatSpriteSubFrame(opts);
    const cacheKey = `${opts.stage}|${opts.coat}|${opts.accessory}|${opts.state}|${s}|${blink ? 1 : 0}|${showBlush ? 1 : 0}|${subFrame}`;
    let cached = catFrameCache.get(cacheKey);
    if (cached) {
      // Refresh LRU ordering
      catFrameCache.delete(cacheKey);
      catFrameCache.set(cacheKey, cached);
    } else {
      const offW = (gw + CAT_CACHE_PAD * 2) * s;
      const offH = (gh + CAT_CACHE_PAD * 2) * s;
      const offscreen = document.createElement('canvas');
      offscreen.width = offW;
      offscreen.height = offH;
      const offCtx = offscreen.getContext('2d');
      if (offCtx) {
        offCtx.imageSmoothingEnabled = false;
        offCtx.translate(CAT_CACHE_PAD * s, CAT_CACHE_PAD * s);
        renderPixelCatPose(offCtx, opts, blink, showBlush);
        if (catFrameCache.size >= MAX_CAT_FRAME_CACHE) {
          const oldestKey = catFrameCache.keys().next().value;
          if (oldestKey !== undefined) {
            catFrameCache.delete(oldestKey);
          }
        }
        catFrameCache.set(cacheKey, offscreen);
        cached = offscreen;
      }
    }
    if (cached) {
      ctx.drawImage(cached, -CAT_CACHE_PAD * s, -CAT_CACHE_PAD * s);
      ctx.restore();
      return;
    }
  }

  renderPixelCatPose(ctx, opts, blink, showBlush);
  ctx.restore();
}

function renderPixelCatPose(
  ctx: CanvasRenderingContext2D,
  opts: PixelCatDrawOpts,
  blink: boolean,
  showBlush: boolean,
) {
  const pal = COAT_PALETTES[opts.coat] ?? COAT_PALETTES.ginger;
  const geo = STAGE_GEOMETRY[opts.stage];
  const s = clampSpriteScale(opts.pixelScale);

  const gw = geo.gridWidth;
  const gh = geo.gridHeight;

  const frame = Math.floor(opts.animTime * 6);
  const fastFrame = Math.floor(opts.animTime * 11);

  const isSpin = opts.state === 'trick_spin';
  const isHighFive = opts.state === 'trick_highfive';
  const isFlip = opts.state === 'trick_flip';
  const isZoomies = opts.state === 'zoomies';
  const isRollWiggle = opts.state === 'roll_wiggle';
  const isPeek = opts.state === 'peek';

  const px = (gx: number, gy: number, color: string, w = 1, h = 1) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(gx) * s, Math.round(gy) * s, Math.round(w) * s, Math.round(h) * s);
  };

  const box = (gx: number, gy: number, w: number, h: number, fill: string) => {
    px(gx - 1, gy, pal.outline, 1, h);
    px(gx + w, gy, pal.outline, 1, h);
    px(gx, gy - 1, pal.outline, w, 1);
    px(gx, gy + h, pal.outline, w, 1);
    px(gx, gy, fill, w, h);
  };

  const isSleep = opts.state === 'sleep';
  const isCuddleYarn = opts.state === 'cuddle_yarn';
  const isLoaf = opts.state === 'loaf';
  const isReach = opts.state === 'reach_yarn';
  const isPoked = opts.state === 'poked';
  const isGroom = opts.state === 'groom';
  const isKnead = opts.state === 'knead';
  const isStretch = opts.state === 'stretch';
  const isSit =
    opts.state === 'sit' ||
    opts.state === 'petted' ||
    opts.state === 'celebrate' ||
    isGroom ||
    isKnead ||
    isHighFive ||
    isSpin;
  const isWalk = opts.state === 'walk' || opts.state === 'run' || isZoomies;
  const isJump = opts.state === 'jump' || opts.state === 'pounce' || isFlip;
  const isFall = opts.state === 'fall' || opts.state === 'carried';
  const isStalk = opts.state === 'stalk';
  const isHold = opts.state === 'hold_cursor';
  const isBob = opts.state === 'head_bob';

  const baseBottom = gh - 1;
  const bobOffset = isWalk ? (frame % 2 === 0 ? 0 : -1) : 0;
  const breathe = isSleep || isLoaf || isCuddleYarn ? (Math.floor(opts.animTime * 2) % 2 === 0 ? 0 : 1) : 0;

  if (isSleep || isLoaf || isCuddleYarn) {
    // Cozy loaf / curled sleep ball resting right on the surface
    const bw = geo.bodyWidth + 1;
    const bh = Math.max(4, geo.bodyHeight - 1);
    const bx = Math.floor((gw - bw) / 2);
    const by = baseBottom - bh;

    // Tail tucked neatly
    const tailW = opts.stage === 'tiny_kitten' ? 2 : 3;
    px(bx - tailW, by + bh - 2, pal.outline, tailW, 2);
    px(bx - tailW + 1, by + bh - 2, pal.stripe, tailW - 1, 1);

    // Loaf body
    box(bx, by, bw, bh, pal.body);
    px(bx, by + bh - 1, pal.shade, bw, 1);
    if (opts.stage !== 'tiny_kitten') {
      px(bx + 2, by, pal.stripe, 2, 2);
      if (bw > 8) px(bx + 6, by, pal.stripe, 2, 2);
    }
    drawBodyCoatDetails(px, opts.coat, bx, by, bw, opts.animTime);
    if (opts.accessory === 'fairy_wings') {
      drawFairyWings(px, bx + 1, by - 2, opts.animTime);
    }

    // Head nestled forward
    const hx = bx + bw - Math.floor(geo.headWidth * 0.65);
    const hy = by - Math.floor(geo.headHeight * 0.45) + (isSleep || isCuddleYarn ? 1 : 0) + breathe;
    drawHead(px, box, pal, geo, opts.stage, hx, hy, {
      closedEyes: isSleep || isCuddleYarn || blink,
      happyEyes: false,
      relaxedEyes: isLoaf && opts.stage === 'grown_cat',
      surprisedEyes: false,
      squintEyes: false,
      blush: showBlush,
      accessory: opts.accessory,
      coat: opts.coat,
      earsTucked: isSleep || isCuddleYarn,
    });
    drawCollarOrScarf(px, pal, opts.accessory, hx + 1, hy + geo.headHeight - 1, geo.headWidth - 3);

    if (isCuddleYarn) {
      // Cozy little yarn ball tucked right in the sleeping kitten's front paws!
      const yx = bx + bw;
      const yy = baseBottom - 3;
      const yarnCol = opts.cuddledYarnColor || '#e85d75';
      px(yx - 1, yy - 1, '#3c1522', 4, 4);
      px(yx, yy, yarnCol, 2, 2);
      px(yx, yy, '#fff0f5', 1, 1);
      // Little paw hugging over the yarn
      px(bx + bw - 1, yy, pal.outline, 2, 2);
      px(bx + bw - 1, yy, pal.belly, 1, 1);
    }
  } else if (isReach) {
    // Standing upright on two hind legs reaching up with both front paws ("hands") to catch yarn!
    const bw = Math.max(6, geo.headWidth - 3);
    const bh = Math.max(5, geo.bodyHeight + 1);
    const legH = Math.max(2, geo.legHeight);
    const bx = Math.floor((gw - bw) / 2);
    const by = baseBottom - legH - bh;

    // Excited wagging tail behind for balance
    const wag = fastFrame % 2 === 0 ? 0 : -1;
    for (let i = 0; i < Math.min(4, geo.tailLen); i++) {
      const tx = bx - 1 - i;
      const ty = by + bh - 2 - i + wag;
      px(tx, ty - 1, pal.outline, 1, 3);
      px(tx, ty, i % 2 === 0 ? pal.body : pal.stripe, 1, 1);
    }

    // Two hind legs standing firmly on the ground
    const hindLeftX = bx + 1;
    const hindRightX = bx + bw - 3;
    px(hindLeftX, by + bh, pal.outline, 2, legH);
    px(hindLeftX, by + bh, pal.shade, 1, legH - 1);
    px(hindLeftX, baseBottom, pal.belly, 2, 1);

    px(hindRightX, by + bh, pal.outline, 2, legH);
    px(hindRightX, by + bh, pal.body, 1, legH - 1);
    px(hindRightX, baseBottom, pal.belly, 2, 1);

    // Upright torso + soft tummy
    box(bx, by, bw, bh, pal.body);
    px(bx + 2, by + 1, pal.belly, bw - 3, bh - 1);
    if (geo.hasRuff) {
      px(bx + 2, by, pal.belly, bw - 2, 2);
    }
    if (opts.accessory === 'fairy_wings') {
      drawFairyWings(px, bx - 2, by + 1, opts.animTime);
    }

    // Head tilted upward looking at the yarn
    const hx = bx - 1;
    const hy = by - geo.headHeight + 1;
    drawHead(px, box, pal, geo, opts.stage, hx, hy, {
      closedEyes: false,
      happyEyes: false,
      relaxedEyes: false,
      surprisedEyes: true,
      squintEyes: false,
      blush: true,
      accessory: opts.accessory,
      coat: opts.coat,
      earsTucked: false,
    });
    drawCollarOrScarf(px, pal, opts.accessory, hx + 1, hy + geo.headHeight, bw - 1);

    // Both front paws ("hands") raised high, alternating upward swatting motions!
    const leftLift = fastFrame % 2 === 0 ? 3 : 1;
    const rightLift = fastFrame % 2 === 0 ? 1 : 3;

    // Back-side raised paw (slightly left/up)
    const paw1X = bx + bw - 1;
    const paw1Y = by - leftLift;
    px(paw1X, paw1Y, pal.outline, 3, 4);
    px(paw1X + 1, paw1Y + 1, pal.belly, 1, 2);
    px(paw1X + 1, paw1Y, pal.belly, 1, 1);

    // Front-side raised paw (reaching forward/up)
    const paw2X = bx + bw + 1;
    const paw2Y = by + 1 - rightLift;
    px(paw2X, paw2Y, pal.outline, 3, 4);
    px(paw2X + 1, paw2Y + 1, pal.body, 1, 2);
    px(paw2X + 1, paw2Y, pal.belly, 1, 1);
  } else if (isSit) {
    // Upright sitting pose (also petted, celebrate, and paw-grooming)
    const bw = Math.max(6, geo.bodyWidth - 2);
    const bh = geo.bodyHeight + 2;
    const bx = Math.floor((gw - bw) / 2) - 1;
    const by = baseBottom - bh;

    // Curled / happy wagging tail beside feet
    const wagRate = opts.state === 'petted' || opts.state === 'celebrate' ? 8 : 3;
    const tailWag = Math.floor(opts.animTime * wagRate) % 2;
    const tLen = Math.min(4, Math.max(2, geo.tailLen - 1));
    px(bx - tLen, baseBottom - 2 - tailWag, pal.outline, tLen, 2);
    px(bx - tLen + 1, baseBottom - 2 - tailWag, pal.stripe, tLen - 1, 1);

    // Body
    box(bx, by, bw, bh, pal.body);
    px(bx + bw - 3, by + 1, pal.belly, 3, bh - 1);
    if (geo.hasRuff) {
      px(bx + bw - 4, by, pal.belly, 4, 2);
    }
    drawBodyCoatDetails(px, opts.coat, bx, by, bw, opts.animTime);
    if (opts.accessory === 'fairy_wings') {
      drawFairyWings(px, bx - 2, by + 1, opts.animTime);
    }
    // Front paws (alternating biscuit-kneading when isKnead!)
    if (isKnead) {
      const leftPad = fastFrame % 2 === 0 ? 1 : 0;
      const rightPad = fastFrame % 2 === 0 ? 0 : 1;
      px(bx + bw - 4, baseBottom - 1 - leftPad, pal.belly, 2, 2);
      px(bx + bw - 4, baseBottom - leftPad, pal.outline, 2, 1);
      px(bx + bw - 1, baseBottom - 1 - rightPad, pal.belly, 2, 2);
      px(bx + bw - 1, baseBottom - rightPad, pal.outline, 2, 1);
    } else {
      px(bx + bw - 3, baseBottom - 1, pal.belly, 2, 2);
      px(bx + bw - 3, baseBottom, pal.outline, 2, 1);
    }

    // Head
    const hx = bx + 1;
    const hy =
      by -
      geo.headHeight +
      1 +
      (opts.state === 'celebrate' || isHighFive || isSpin
        ? fastFrame % 2 === 0
          ? -1
          : 0
        : isGroom || isKnead
          ? frame % 2 === 0
            ? 1
            : 0
          : 0);
    drawHead(px, box, pal, geo, opts.stage, hx, hy, {
      closedEyes: blink || isGroom || isKnead,
      happyEyes: opts.state === 'petted' || opts.state === 'celebrate' || isHighFive || isSpin,
      relaxedEyes: opts.stage === 'grown_cat' && opts.state === 'sit',
      surprisedEyes: false,
      squintEyes: false,
      blush: showBlush,
      accessory: opts.accessory,
      coat: opts.coat,
      earsTucked: false,
    });
    drawCollarOrScarf(px, pal, opts.accessory, hx + 1, hy + geo.headHeight, bw - 1);

    if (isHighFive) {
      // Enthusiastic high-five raised paw + twinkle pixel
      const pawLift = fastFrame % 2;
      px(bx + bw, by - 2 - pawLift, pal.outline, 3, 4);
      px(bx + bw + 1, by - 1 - pawLift, pal.belly, 1, 2);
      px(bx + bw + 1, by - 2 - pawLift, pal.earInner, 1, 1);
      px(bx + bw + 3, by - 4 - pawLift, '#ffd86b', 1, 1);
    } else if (opts.state === 'celebrate') {
      px(bx + bw, by + 1, pal.outline, 2, 2);
      px(bx + bw, by + 1, pal.belly, 1, 2);
    } else if (isGroom) {
      // Raised paw washing cheek!
      const washY = hy + geo.headHeight - 2 + (frame % 2);
      px(hx + geo.headWidth - 2, washY, pal.outline, 2, 3);
      px(hx + geo.headWidth - 2, washY, pal.belly, 1, 2);
    }
  } else if (isRollWiggle) {
    // Playful side-to-side roll & belly-up bunny-kick wiggle!
    const rollPhase = Math.floor(opts.animTime * 8) % 4;
    const rollShiftX = rollPhase === 0 ? -1 : rollPhase === 2 ? 1 : 0;
    const rollBounceY = rollPhase === 3 ? -1 : 0;
    const kickSide = rollPhase % 2;
    const bw = geo.bodyWidth + 1;
    const bh = Math.max(4, geo.bodyHeight);
    const bx = Math.floor((gw - bw) / 2) - 1 + rollShiftX;
    const by = baseBottom - bh + rollBounceY;

    // Curling tail sweeping side-to-side underneath
    const tailSweep = rollPhase <= 1 ? 0 : 1;
    px(bx - 3, by + bh - 2 - tailSweep, pal.outline, 3, 2);
    px(bx - 2, by + bh - 2 - tailSweep, pal.stripe, 2, 1);

    // Rolled torso + pale tummy shifting subtly as kitten rocks left/right
    box(bx, by, bw, bh, pal.body);
    const tummyOffset = rollPhase === 0 ? 1 : rollPhase === 2 ? 3 : 2;
    px(bx + tummyOffset, by, pal.belly, Math.max(3, bw - 4), Math.max(2, bh - 1));
    drawBodyCoatDetails(px, opts.coat, bx, by, bw, opts.animTime);
    if (opts.accessory === 'fairy_wings') {
      drawFairyWings(px, bx, by + 1, opts.animTime);
    }

    // Four little paws kicking playfully in the air
    const kickA = kickSide === 0 ? 2 : 0;
    const kickB = kickSide === 0 ? 0 : 2;
    px(bx + 1, by - 2 - kickA, pal.outline, 2, 2);
    px(bx + 1, by - 2 - kickA, pal.belly, 1, 1);
    px(bx + bw - 3, by - 2 - kickB, pal.outline, 2, 2);
    px(bx + bw - 3, by - 2 - kickB, pal.belly, 1, 1);
    // Tiny back hind toe-bean kick peek
    px(bx + 3 + (kickSide === 0 ? 0 : 1), by - 1, pal.earInner, 1, 1);

    // Tilted happy head rocking with roll
    const hx = bx + bw - Math.floor(geo.headWidth * 0.45);
    const hy = baseBottom - geo.headHeight + (rollPhase % 2);
    drawHead(px, box, pal, geo, opts.stage, hx, hy, {
      closedEyes: rollPhase === 3,
      happyEyes: rollPhase !== 3,
      relaxedEyes: false,
      surprisedEyes: false,
      squintEyes: false,
      blush: true,
      accessory: opts.accessory,
      coat: opts.coat,
      earsTucked: true,
    });
    drawCollarOrScarf(px, pal, opts.accessory, hx + 1, hy + geo.headHeight - 1, geo.headWidth - 4);
  } else if (isPeek) {
    // Titlebar/ledge Peek-a-Boo: wiggling ears, curious eyes, and alternating tapping paws!
    const bobPeek = Math.floor(opts.animTime * 2.5) % 2;
    const pawTap = Math.floor(opts.animTime * 6) % 4;
    const earWiggle = pawTap === 1;
    const hx = Math.floor((gw - geo.headWidth) / 2);
    const hy = baseBottom - geo.headHeight + 3 + bobPeek;
    drawHead(px, box, pal, geo, opts.stage, hx, hy, {
      closedEyes: blink,
      happyEyes: false,
      relaxedEyes: false,
      surprisedEyes: false,
      squintEyes: false,
      blush: true,
      accessory: opts.accessory,
      coat: opts.coat,
      earsTucked: false,
      earWiggle,
    });
    // Two little front paws tapping alternatingly on the edge
    const leftLift = pawTap === 1 ? -1 : 0;
    const rightLift = pawTap === 3 ? -1 : 0;
    px(hx - 1, baseBottom - 1 + leftLift, pal.outline, 2, 2);
    px(hx - 1, baseBottom - 1 + leftLift, pal.belly, 1, 1);
    px(hx + geo.headWidth - 1, baseBottom - 1 + rightLift, pal.outline, 2, 2);
    px(hx + geo.headWidth, baseBottom - 1 + rightLift, pal.belly, 1, 1);
  } else if (isStretch) {
    // Multi-phase cozy big stretch: lean & dip -> peak quiver -> big yawn -> settle!
    const stretchPhase = Math.floor(opts.animTime * 4) % 6;
    const stretchReach = stretchPhase <= 1 ? 1 : stretchPhase <= 3 ? 3 : 2;
    const stretchDip = stretchPhase >= 2 && stretchPhase <= 4 ? 1 : 0;
    const stretchQuiver = stretchPhase === 3 ? 1 : 0;
    const isYawn = stretchPhase === 4;

    const bw = geo.bodyWidth + 1;
    const bh = Math.max(3, geo.bodyHeight - 1);
    const legH = Math.max(2, geo.legHeight);
    const bx = Math.floor((gw - bw) / 2) - 2;
    const by = baseBottom - legH - bh + 1 + stretchDip;

    // High curved tail rising and curling smoothly with stretch phase
    const tailCount = Math.min(3, geo.tailLen);
    const tailWag = stretchPhase % 2 === 0 ? 0 : -1;
    for (let i = 0; i < tailCount; i++) {
      const tx = bx - 1 - i;
      const ty = by - 1 - i - (i === tailCount - 1 ? -tailWag : 0);
      px(tx, ty - 1, pal.outline, 1, 3);
      px(tx, ty, i % 2 === 0 ? pal.body : pal.stripe, 1, 1);
    }

    // Back legs tall & braced
    px(bx + 1, by + bh - 1, pal.outline, 2, legH + 1 - stretchDip);
    px(bx + 1, by + bh - 1, pal.shade, 1, Math.max(1, legH - stretchDip));
    px(bx + 1, baseBottom, pal.belly, 2, 1);

    // Dipped elongated torso + sliding outstretched front paws
    box(bx, by + stretchQuiver, bw, bh, pal.body);
    px(bx + 3, by + 1 + stretchQuiver, pal.body, bw - 2, bh - 1);
    drawBodyCoatDetails(px, opts.coat, bx, by + stretchQuiver, bw, opts.animTime);
    if (opts.accessory === 'fairy_wings') {
      drawFairyWings(px, bx + 1, by - 2 + stretchQuiver, opts.animTime);
    }

    px(bx + bw - 1, baseBottom - 1, pal.outline, 2 + stretchReach, 2);
    px(bx + bw, baseBottom - 1, pal.belly, 1 + stretchReach, 1);

    // Head lowered happily during reach, lifting slightly for a tiny yawn at phase 4
    const hx = bx + bw - Math.floor(geo.headWidth * 0.5) + (stretchPhase >= 2 && stretchPhase <= 3 ? 1 : 0);
    const hy = by - geo.headHeight + 4 - (isYawn ? 1 : 0);
    drawHead(px, box, pal, geo, opts.stage, hx, hy, {
      closedEyes: true,
      happyEyes: false,
      relaxedEyes: false,
      surprisedEyes: false,
      squintEyes: false,
      blush: showBlush,
      accessory: opts.accessory,
      coat: opts.coat,
      earsTucked: stretchPhase === 2 || stretchPhase === 3,
      yawnMouth: isYawn,
    });
    drawCollarOrScarf(px, pal, opts.accessory, hx + 1, hy + geo.headHeight - 1, geo.headWidth - 4);
  } else {
    // Standing / Walking / Running / Jumping / Falling / Stalking / Poked / Holding Cursor
    const squash = isPoked ? 1 : 0;
    const bw = geo.bodyWidth + squash;
    const bh = Math.max(3, geo.bodyHeight - (isStalk || isPoked ? 1 : 0));
    const legH = isJump || isFall ? Math.max(1, geo.legHeight - 1) : isStalk ? 1 : geo.legHeight;
    const bx = Math.floor((gw - bw) / 2) - 1;
    const by = baseBottom - legH - bh + bobOffset + (isJump ? -1 : 0) + squash;

    // Tail (stage-distinct length & shape)
    const tailAngle = isPoked
      ? -3
      : isJump
        ? 1
        : isFall
          ? -2
          : opts.stage === 'tiny_kitten'
            ? -1
            : opts.stage === 'junior_kitten'
              ? (frame % 2 === 0 ? -2 : -3)
              : frame % 2 === 0
                ? -1
                : -2;
    for (let i = 0; i < geo.tailLen; i++) {
      const tx = bx - 1 - i;
      const ty = by + 1 + Math.round((tailAngle * i) / Math.max(1, geo.tailLen));
      px(tx, ty - 1, pal.outline, 1, 3);
      const isTip =
        i >= geo.tailLen - 2 &&
        (opts.coat === 'siamese' ||
          opts.coat === 'lilac_ragdoll' ||
          opts.stage === 'young_cat' ||
          opts.stage === 'grown_cat');
      px(tx, ty, isTip ? pal.stripe : i % 2 === 0 ? pal.body : pal.stripe, 1, 1);
    }
    px(bx - geo.tailLen - 1, by + 1 + tailAngle, pal.outline, 1, 1);

    // Body
    box(bx, by, bw, bh, pal.body);
    px(bx + 2, by + bh - 2, pal.belly, Math.max(2, bw - 3), 2);
    if (opts.stage !== 'tiny_kitten') {
      px(bx + 3, by, pal.stripe, 2, 2);
      if (bw >= 10) px(bx + 7, by, pal.stripe, 2, 2);
    } else {
      px(bx + 3, by, pal.shade, 2, 1);
    }
    if (geo.hasRuff) {
      px(bx + bw - 2, by + 1, pal.belly, 2, Math.max(2, bh - 2));
    }
    drawBodyCoatDetails(px, opts.coat, bx, by, bw, opts.animTime);
    if (opts.accessory === 'fairy_wings') {
      drawFairyWings(px, bx + 1, by - 2, opts.animTime);
    }

    // Legs (animated stride)
    const stride = isWalk ? (opts.state === 'run' || isZoomies ? fastFrame % 3 : frame % 2) : 0;
    const frontLegX = bx + bw - 3 + (stride === 1 ? 1 : stride === 2 ? -1 : 0);
    const backLegX = bx + 1 + (stride === 1 ? -1 : stride === 2 ? 1 : 0);
    const legY = by + bh;
    const pawW = opts.stage === 'grown_cat' ? 3 : 2;

    if (isFall) {
      px(backLegX, legY, pal.outline, 2, legH + 2);
      px(backLegX, legY, pal.belly, 1, legH + 1);
      px(frontLegX, legY, pal.outline, 2, legH + 2);
      px(frontLegX, legY, pal.belly, 1, legH + 1);
    } else if (isJump) {
      px(backLegX - 1, legY, pal.outline, 2, legH);
      px(backLegX - 1, legY, pal.belly, 1, legH);
      px(frontLegX + 1, legY - 1, pal.outline, 2, legH);
      px(frontLegX + 1, legY - 1, pal.belly, 1, legH);
    } else {
      px(backLegX, legY, pal.outline, pawW, legH);
      px(backLegX, legY, pal.shade, pawW - 1, Math.max(1, legH - 1));
      px(backLegX, legY + legH - 1, pal.belly, pawW, 1);

      px(frontLegX, legY, pal.outline, pawW, legH);
      px(frontLegX, legY, pal.body, pawW - 1, Math.max(1, legH - 1));
      px(frontLegX, legY + legH - 1, pal.belly, pawW, 1);
    }

    // Head
    const bobBeat = Math.floor(opts.animTime * 4.5) % 4;
    const headDrop =
      isStalk
        ? 2
        : isHold || isPoked
          ? 1
          : isBob
            ? (bobBeat % 2 === 1 ? 1 : 0)
            : opts.state === 'eat'
              ? (fastFrame % 2 === 0 ? 2 : 1)
              : 0;
    const headSwayX = isBob ? (bobBeat === 1 ? 1 : bobBeat === 3 ? -1 : 0) : 0;
    const hxBase = bx + bw - Math.floor(geo.headWidth * 0.55);
    const hx = hxBase + headSwayX;
    const hy = by - geo.headHeight + 2 + headDrop;
    drawHead(px, box, pal, geo, opts.stage, hx, hy, {
      closedEyes: blink && !isPoked,
      happyEyes: opts.state === 'eat' || isBob || isFlip || isZoomies,
      relaxedEyes: false,
      surprisedEyes: isPoked && (opts.pokeStreak ?? 1) < 3,
      squintEyes: isPoked && (opts.pokeStreak ?? 1) >= 3,
      blush: showBlush,
      accessory: opts.accessory,
      coat: opts.coat,
      earsTucked: isPoked,
    });
    drawCollarOrScarf(px, pal, opts.accessory, hxBase + 1, by + 2, geo.headWidth - 4);

    if (isHold) {
      const pawBob = fastFrame % 2;
      px(bx + bw, by + 1 - pawBob, pal.outline, 3, 2);
      px(bx + bw, by + 1 - pawBob, pal.belly, 2, 1);
    }
  }

  ctx.restore();
}

export function drawLavenderCushion(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  bottomY: number,
) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const x = Math.round(centerX - 42);
  const y = Math.round(bottomY - 24);
  const p = 3;

  // Ground shadow
  ctx.fillStyle = 'rgba(46, 31, 71, 0.2)';
  ctx.fillRect(x + 4, bottomY - 2, 76, 4);

  // Dark plum outline
  ctx.fillStyle = '#2e1f47';
  ctx.fillRect(x + p, y, 26 * p, 7 * p);
  ctx.fillRect(x, y + p, 28 * p, 5 * p);

  // Cream ruffled outer trim
  ctx.fillStyle = '#fffdf9';
  ctx.fillRect(x + p, y + p, 26 * p, 5 * p);

  // Plush lavender pillow center
  ctx.fillStyle = '#d8c2f8';
  ctx.fillRect(x + 2 * p, y + p, 24 * p, 4 * p);
  ctx.fillStyle = '#efe7fb';
  ctx.fillRect(x + 4 * p, y + p, 20 * p, 2 * p);
  // Bottom cushion shade
  ctx.fillStyle = '#b492ee';
  ctx.fillRect(x + 2 * p, y + 4 * p, 24 * p, p);

  // Cute embroidered cream-plum heart on the front
  ctx.fillStyle = '#8d63d9';
  ctx.fillRect(x + 12 * p, y + 4 * p, p, p);
  ctx.fillRect(x + 14 * p, y + 4 * p, p, p);
  ctx.fillRect(x + 13 * p, y + 5 * p, p, p);

  ctx.restore();
}

export function drawPixelButterfly(ctx: CanvasRenderingContext2D, b: ButterflyEntity) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const x = Math.round(b.x);
  const y = Math.round(b.y);
  const flap = Math.sin(b.phase * 14);

  if (b.kind === 'firefly') {
    const glow = 0.45 + 0.35 * Math.sin(b.phase * 7);
    ctx.fillStyle = `rgba(255, 224, 112, ${glow * 0.45})`;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2e1f47';
    ctx.fillRect(x - 3, y - 2, 6, 4);
    ctx.fillStyle = '#ffe680';
    ctx.fillRect(x - 2, y - 1, 4, 2);
    ctx.fillStyle = '#fffdf5';
    ctx.fillRect(x - 1, y - 3, 2, 1);
  } else {
    const wingW = flap > 0 ? 6 : 3;
    const wingH = 5;
    // Outline + wings
    ctx.fillStyle = '#2e1f47';
    ctx.fillRect(x - wingW - 1, y - wingH, wingW * 2 + 2, wingH * 2);
    ctx.fillStyle = b.color || '#c8a6f7';
    ctx.fillRect(x - wingW, y - wingH + 1, wingW - 1, wingH);
    ctx.fillRect(x + 2, y - wingH + 1, wingW - 1, wingH);
    ctx.fillStyle = '#fffdf9';
    ctx.fillRect(x - wingW + 1, y + 1, Math.max(1, wingW - 2), 3);
    ctx.fillRect(x + 2, y + 1, Math.max(1, wingW - 2), 3);
    // Body
    ctx.fillStyle = '#2e1f47';
    ctx.fillRect(x, y - 3, 2, 7);
  }
  ctx.restore();
}

function drawHead(
  px: (gx: number, gy: number, color: string, w?: number, h?: number) => void,
  box: (gx: number, gy: number, w: number, h: number, fill: string) => void,
  pal: CoatPalette,
  geo: StageGeometry,
  stage: LifeStage,
  hx: number,
  hy: number,
  opts: {
    closedEyes: boolean;
    happyEyes: boolean;
    relaxedEyes: boolean;
    surprisedEyes: boolean;
    squintEyes: boolean;
    blush: boolean;
    accessory: AccessoryId;
    coat: CoatId;
    earsTucked: boolean;
    earWiggle?: boolean;
    yawnMouth?: boolean;
  },
) {
  const hw = geo.headWidth;
  const hh = geo.headHeight;
  const earH = opts.earsTucked ? Math.max(2, geo.earHeight - 1) : geo.earHeight;
  const rightEarShift = opts.earWiggle ? -1 : 0;

  // Left & Right Ears (distinct height & tufts per stage!)
  px(hx, hy - earH, pal.outline, 3, earH);
  px(hx + 1, hy - earH + 1, pal.body, 1, earH - 1);
  px(hx + 1, hy - 1, pal.earInner, 1, 1);

  px(hx + hw - 3, hy - earH + rightEarShift, pal.outline, 3, earH);
  px(hx + hw - 2, hy - earH + 1 + rightEarShift, pal.body, 1, earH - 1);
  px(hx + hw - 2, hy - 1 + rightEarShift, pal.earInner, 1, 1);

  if (geo.hasEarTufts && !opts.earsTucked) {
    px(hx + 1, hy - earH - 1, pal.outline, 1, 1);
    px(hx + hw - 2, hy - earH - 1, pal.outline, 1, 1);
  }

  // Siamese & Lilac Ragdoll dark/lilac point ears
  if (opts.coat === 'siamese' || opts.coat === 'lilac_ragdoll') {
    px(hx + 1, hy - earH + 1, pal.stripe, 1, earH - 1);
    px(hx + hw - 2, hy - earH + 1, pal.stripe, 1, earH - 1);
  }

  // Head box
  box(hx, hy, hw, hh, pal.body);

  // Forehead markings (stronger on older stages, subtle on tiny kitten)
  if (stage === 'tiny_kitten') {
    px(hx + Math.floor(hw / 2), hy, pal.shade, 1, 1);
  } else {
    px(hx + Math.floor(hw / 2) - 1, hy, pal.stripe, 1, 2);
    px(hx + Math.floor(hw / 2) + 1, hy, pal.stripe, 1, 2);
  }

  // Muzzle / cheeks
  px(hx + 2, hy + hh - 3, pal.belly, hw - 3, 3);
  if (opts.coat === 'siamese' || opts.coat === 'lilac_ragdoll') {
    px(hx + 3, hy + 2, pal.stripe, hw - 4, hh - 3);
  }

  // Whiskers on Young Cat & Grown Cat
  if (geo.hasWhiskers) {
    px(hx - 1, hy + hh - 3, pal.outline, 1, 1);
    px(hx + hw, hy + hh - 3, pal.outline, 1, 1);
  }

  // Eyes (facing right by default)
  const ey = hy + Math.floor(hh / 2) - 1;
  const ex1 = hx + 2 + (stage === 'tiny_kitten' ? 0 : 1);
  const ex2 = hx + hw - 3;

  if (opts.accessory === 'sunglasses' || opts.accessory === 'heart_shades') {
    const isHeart = opts.accessory === 'heart_shades';
    const frameCol = isHeart ? '#e83878' : '#111118';
    const glintCol = isHeart ? '#ffd6e7' : '#88d0ff';
    px(ex1 - 1, ey, frameCol, 4, 2);
    px(ex2 - 1, ey, frameCol, 3, 2);
    if (isHeart) {
      px(ex1, ey + 2, frameCol, 2, 1);
      px(ex2, ey + 2, frameCol, 1, 1);
    }
    px(ex1 + 2, ey, isHeart ? '#ff85b3' : '#3c4055', 2, 1);
    px(ex1, ey, glintCol, 1, 1);
    px(ex2, ey, glintCol, 1, 1);
  } else if (opts.squintEyes) {
    // Cute `>_<` poked reaction!
    px(ex1, ey, pal.outline, 1, 1);
    px(ex1 + 1, ey + 1, pal.outline, 1, 1);
    px(ex2 + 1, ey, pal.outline, 1, 1);
    px(ex2, ey + 1, pal.outline, 1, 1);
  } else if (opts.closedEyes) {
    px(ex1, ey + 1, pal.outline, 2, 1);
    px(ex2, ey + 1, pal.outline, 2, 1);
  } else if (opts.happyEyes) {
    px(ex1, ey, pal.outline, 2, 1);
    px(ex2, ey, pal.outline, 2, 1);
  } else if (opts.surprisedEyes) {
    // Wide shiny excited/surprised eyes (`O_O`)
    px(ex1, ey - 1, pal.eye, 2, 3);
    px(ex1, ey - 1, pal.eyeShine, 1, 1);
    px(ex2, ey - 1, pal.eye, 2, 3);
    px(ex2, ey - 1, pal.eyeShine, 1, 1);
  } else if (opts.relaxedEyes) {
    px(ex1, ey, pal.shade, 2, 1);
    px(ex1, ey + 1, pal.eye, 2, 1);
    px(ex2, ey, pal.shade, 2, 1);
    px(ex2, ey + 1, pal.eye, 2, 1);
  } else {
    px(ex1, ey, pal.eye, 2, 2);
    px(ex1, ey, pal.eyeShine, 1, 1);
    px(ex2, ey, pal.eye, 2, 2);
    px(ex2, ey, pal.eyeShine, 1, 1);
    if (stage === 'tiny_kitten') {
      // Extra kawaii bottom sparkle dot for Tiny Kitten
      px(ex1 + 1, ey + 1, pal.eyeShine, 1, 1);
      px(ex2 + 1, ey + 1, pal.eyeShine, 1, 1);
    }
  }

  // Rosy blush cheeks
  if (opts.blush) {
    px(ex1 - 1, ey + 2, pal.blush, 2, 1);
    px(ex2 + 1, ey + 2, pal.blush, 1, 1);
  }

  // Round Lunar Glasses (wire-frame overlay preserving eyes)
  if (opts.accessory === 'lunar_glasses') {
    px(ex1 - 1, ey - 1, '#c8a6f7', 4, 1);
    px(ex1 - 1, ey + 2, '#c8a6f7', 4, 1);
    px(ex2 - 1, ey - 1, '#c8a6f7', 3, 1);
    px(ex2 - 1, ey + 2, '#c8a6f7', 3, 1);
    px(ex1 + 3, ey, '#f7ca3e', 1, 1); // gold bridge
  }

  // Nose (+ cozy little pink yawn pixel during stretch peak)
  px(hx + hw - 4, hy + hh - 2, pal.earInner, 1, 1);
  if (opts.yawnMouth) {
    px(hx + hw - 4, hy + hh - 1, '#d95f76', 2, 1);
  }

  // Head Accessories
  const midX = hx + Math.floor(hw / 2);
  if (opts.accessory === 'leaf_hat') {
    px(midX, hy - 2, '#5a3d28', 1, 2);
    px(midX - 2, hy - 4, '#245824', 5, 2);
    px(midX - 1, hy - 4, '#5ec250', 3, 2);
  } else if (opts.accessory === 'lavender_bow') {
    // Silky lavender ribbon bow perched by the front ear!
    const bx = hx + hw - 4;
    const by = hy - 2;
    px(bx - 1, by - 1, '#2e1f47', 5, 3);
    px(bx - 1, by, '#a682e8', 2, 2);
    px(bx + 2, by, '#a682e8', 2, 2);
    px(bx + 1, by, '#f3ebff', 1, 2);
  } else if (opts.accessory === 'pink_bow') {
    // Cute ribbon bow perched by the front ear!
    const bx = hx + hw - 4;
    const by = hy - 2;
    px(bx - 1, by - 1, '#7a193b', 5, 3);
    px(bx - 1, by, '#ff5c8a', 2, 2);
    px(bx + 2, by, '#ff5c8a', 2, 2);
    px(bx + 1, by, '#ffd1e3', 1, 2);
  } else if (opts.accessory === 'flower_crown') {
    px(hx + 2, hy - 1, '#5ec250', hw - 4, 1);
    px(hx + 2, hy - 2, '#ff7aa2', 2, 2);
    px(hx + 2, hy - 2, '#fff59d', 1, 1);
    px(midX, hy - 2, '#ffffff', 2, 2);
    px(midX, hy - 2, '#ffd54f', 1, 1);
    px(hx + hw - 4, hy - 2, '#c59bf7', 2, 2);
  } else if (opts.accessory === 'tiara') {
    px(midX - 2, hy - 1, '#d99a1e', 5, 1);
    px(midX - 2, hy - 3, '#f7ca3e', 1, 2);
    px(midX, hy - 4, '#f7ca3e', 1, 3);
    px(midX + 2, hy - 3, '#f7ca3e', 1, 2);
    px(midX, hy - 2, '#ff5c8a', 1, 1);
  } else if (opts.accessory === 'star_clip') {
    const sx = hx + hw - 3;
    const sy = hy - 2;
    px(sx - 1, sy, '#2e1f47', 3, 3);
    px(sx, sy - 1, '#f7ca3e', 1, 3);
    px(sx - 1, sy, '#f7ca3e', 3, 1);
    px(sx, sy, '#fffdf5', 1, 1);
  } else if (opts.accessory === 'bunny_ears') {
    // Tall cream-lavender bunny ears with rosy inner strips!
    const e1 = hx + 1;
    const e2 = hx + hw - 3;
    px(e1 - 1, hy - 5, '#2e1f47', 3, 5);
    px(e1, hy - 4, '#fbf8ff', 1, 4);
    px(e1, hy - 3, '#f49ca8', 1, 2);
    px(e2 - 1, hy - 5, '#2e1f47', 3, 5);
    px(e2, hy - 4, '#fbf8ff', 1, 4);
    px(e2, hy - 3, '#f49ca8', 1, 2);
  } else if (opts.accessory === 'beret') {
    px(midX - 4, hy - 2, '#2e1f47', 8, 2);
    px(midX - 3, hy - 3, '#a682e8', 6, 2);
    px(midX - 2, hy - 3, '#e5d4fa', 2, 1);
    px(midX, hy - 4, '#2e1f47', 1, 1);
  } else if (opts.accessory === 'nightcap') {
    px(hx + 1, hy - 2, '#2e1f47', hw - 2, 2);
    px(hx + 1, hy - 1, '#fffdf9', hw - 2, 1);
    px(midX - 2, hy - 4, '#9d74db', 5, 3);
    px(midX - 3, hy - 3, '#c8a6f7', 2, 2);
    px(midX - 4, hy - 2, '#fffdf9', 2, 2); // fluffy pom-pom
  } else if (opts.accessory === 'lace_headband') {
    px(hx + 1, hy - 1, '#2e1f47', hw - 2, 1);
    px(hx + 1, hy - 1, '#d8c2f8', hw - 2, 1);
    for (let lx = hx + 2; lx < hx + hw - 2; lx += 2) {
      px(lx, hy - 2, '#fffdf9', 1, 1);
    }
    px(midX, hy - 2, '#a682e8', 2, 1);
  } else if (opts.accessory === 'amethyst_crown') {
    px(hx + 2, hy - 1, '#d8dee9', hw - 4, 1);
    px(midX - 2, hy - 3, '#9d74db', 1, 2);
    px(midX, hy - 4, '#b88aff', 1, 3);
    px(midX + 2, hy - 3, '#9d74db', 1, 2);
    px(midX, hy - 4, '#fff8ff', 1, 1);
  } else if (opts.accessory === 'witch_hat') {
    px(hx - 1, hy - 1, '#2e1f47', hw + 2, 2);
    px(hx, hy - 1, '#4c2c7a', hw, 1);
    px(midX - 3, hy - 4, '#3a2061', 6, 3);
    px(midX - 2, hy - 6, '#523185', 4, 2);
    px(midX - 1, hy - 7, '#6c42ab', 2, 1);
    px(midX - 3, hy - 2, '#c8a6f7', 6, 1); // lavender band
    px(midX, hy - 2, '#f7ca3e', 1, 1); // gold buckle star
  } else if (opts.accessory === 'crescent_crown') {
    px(midX - 3, hy - 3, '#c8a6f7', 6, 1);
    px(midX - 2, hy - 4, '#fde68a', 4, 1);
    px(midX - 1, hy - 5, '#fef3c7', 1, 1);
    px(midX + 1, hy - 5, '#fef3c7', 1, 1);
    px(midX, hy - 6, '#a78bfa', 1, 1);
  }
}

function drawCollarOrScarf(
  px: (gx: number, gy: number, color: string, w?: number, h?: number) => void,
  pal: CoatPalette,
  accessory: AccessoryId,
  cx: number,
  cy: number,
  w: number,
) {
  if (accessory === 'red_collar' || accessory === 'golden_bell') {
    px(cx, cy, '#c9343b', w, 1);
    px(cx + w - 1, cy + 1, accessory === 'golden_bell' ? '#f7ca3e' : '#d8dee9', 2, 2);
    px(cx + w, cy + 1, pal.outline, 1, 1);
  } else if (accessory === 'pearl_collar') {
    px(cx, cy, '#fffdf9', w, 1);
    for (let i = 1; i < w; i += 2) {
      px(cx + i, cy, '#e6dcf7', 1, 1);
    }
    px(cx + w - 1, cy + 1, '#8d63d9', 2, 2);
    px(cx + w - 1, cy + 1, '#f3ebff', 1, 1);
  } else if (accessory === 'heart_collar') {
    px(cx, cy, '#ff7aa2', w, 1);
    px(cx + w - 1, cy + 1, '#ff3b78', 2, 2);
    px(cx + w - 1, cy + 1, '#ffd1e3', 1, 1);
  } else if (accessory === 'tiny_scarf') {
    px(cx, cy, '#3578c7', w, 2);
    px(cx + 1, cy, '#72b1f7', 1, 2);
    px(cx + 2, cy + 2, '#3578c7', 2, 2);
  }
}

export function drawPixelToy(
  ctx: CanvasRenderingContext2D,
  kind: ToyKind,
  x: number,
  y: number,
  rotation: number,
  color?: string,
) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(Math.round(x), Math.round(y));
  ctx.rotate(rotation);
  const s = 4;
  const px = (gx: number, gy: number, c: string, w = 1, h = 1) => {
    ctx.fillStyle = c;
    ctx.fillRect(gx * s, gy * s, w * s, h * s);
  };

  if (kind === 'yarn') {
    const main = color || '#a682e8';
    px(-3, -4, '#2e1f47', 6, 8);
    px(-4, -3, '#2e1f47', 8, 6);
    px(-3, -3, main, 6, 6);
    px(-2, -2, '#f8f3ff', 2, 2);
    px(-2, 0, 'rgba(36, 22, 56, 0.28)', 5, 1);
    px(0, -3, 'rgba(36, 22, 56, 0.28)', 1, 5);
    px(3, 2, main, 3, 1);
  } else if (kind === 'macaron') {
    // Cute pastel taro-lavender & vanilla-cream macaron treat!
    px(-4, -3, '#2e1f47', 8, 6);
    px(-3, -4, '#2e1f47', 6, 8);
    px(-3, -3, '#c6a4f2', 6, 2); // top shell
    px(-2, -3, '#efe7ff', 2, 1); // highlight
    px(-3, -1, '#fffcf5', 6, 2); // vanilla cream filling
    px(-3, 1, '#9d74db', 6, 2);  // bottom shell
  } else if (kind === 'boba') {
    // Taro-lavender milk tea cup with tapioca pearls & straw!
    px(1, -6, '#8d63d9', 1, 3); // straw
    px(2, -6, '#8d63d9', 1, 1);
    px(-3, -3, '#2e1f47', 7, 7);
    px(-2, -3, '#fffdf9', 5, 1); // lid/cream foam
    px(-2, -2, '#d8c2f8', 5, 5); // taro milk tea
    px(-1, -1, '#f3ebff', 1, 2); // glass highlight
    px(-2, 2, '#2e1f47', 1, 1); // tapioca pearls
    px(0, 2, '#2e1f47', 1, 1);
    px(2, 2, '#2e1f47', 1, 1);
  } else if (kind === 'cake') {
    // Strawberry-cream shortcake slice!
    px(-4, -3, '#2e1f47', 8, 6);
    px(-3, -4, '#2e1f47', 6, 7);
    px(-3, -3, '#fffdf9', 6, 2); // whipped cream top
    px(-1, -4, '#ff4d88', 2, 2); // strawberry on top
    px(-3, -1, '#ffe3b3', 6, 1); // sponge
    px(-3, 0, '#ff85b3', 6, 1);  // berry jam layer
    px(-3, 1, '#ffe3b3', 6, 1);  // sponge base
  } else if (kind === 'ube_icecream') {
    // Pastel ube-lavender soft-serve swirl cone!
    px(-2, -6, '#2e1f47', 4, 2);
    px(-3, -4, '#2e1f47', 6, 4);
    px(-2, -5, '#c8a6f7', 4, 2); // top swirl
    px(-2, -3, '#9d74db', 4, 2); // ube swirl
    px(-1, -4, '#fffdf9', 1, 1); // highlight
    px(1, -3, '#ffd966', 1, 1);  // star sprinkle
    px(-2, 0, '#2e1f47', 4, 4);
    px(-1, 0, '#e6b87d', 2, 3);  // waffle cone
    px(0, 3, '#c9935b', 1, 1);
  } else if (kind === 'star_kibble') {
    // Twinkling galaxy star biscuit!
    px(-1, -4, '#2e1f47', 2, 8);
    px(-4, -1, '#2e1f47', 8, 2);
    px(-2, -3, '#2e1f47', 4, 6);
    px(-3, -2, '#2e1f47', 6, 4);
    px(-1, -3, '#b88aff', 2, 6);
    px(-3, -1, '#b88aff', 6, 2);
    px(-2, -2, '#d8c2f8', 4, 4);
    px(-1, -1, '#fff3a8', 2, 2); // glowing gold core
  } else if (kind === 'croissant') {
    // Lavender-honey glazed buttery croissant!
    px(-4, -2, '#2e1f47', 8, 5);
    px(-3, -3, '#2e1f47', 6, 6);
    px(-3, -2, '#e8a85a', 6, 4);
    px(-2, -2, '#f5cc84', 4, 2);
    px(-1, -2, '#d8b4f8', 2, 1); // lavender honey glaze
    px(1, -1, '#fff8ff', 1, 1);  // sugar sparkle
  } else {
    // Pixel fish treat
    px(-5, -2, '#1f2937', 9, 4);
    px(-4, -3, '#1f2937', 5, 6);
    px(4, -3, '#1f2937', 2, 6);
    px(-4, -2, '#5fb5e8', 7, 4);
    px(-3, -1, '#b8e3fc', 3, 2);
    px(4, -2, '#438fbe', 1, 4);
    px(-3, -1, '#1f2937', 1, 1); // eye
  }
  ctx.restore();
}

export function drawFakeCursorProp(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const s = 3;
  const rows = [
    'O.......',
    'OO......',
    'OWO.....',
    'OWWO....',
    'OWWWO...',
    'OWWWWO..',
    'OWWWWWO.',
    'OWWOOO..',
    'OWO.....',
    'O..O....',
  ];
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      const ch = rows[r][c];
      if (ch === '.') continue;
      ctx.fillStyle = ch === 'O' ? '#16141c' : '#ffffff';
      ctx.fillRect(Math.round(x) + c * s, Math.round(y) + r * s, s, s);
    }
  }
  ctx.restore();
}

export function drawLavenderPlant(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  bottomY: number,
  animTime: number,
  swayTimer = 0,
) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const p = 3;
  const x = Math.round(centerX - 7 * p);
  const y = Math.round(bottomY - 12 * p);
  const sway = swayTimer > 0 ? Math.round(Math.sin(animTime * 14) * 2) : Math.round(Math.sin(animTime * 2) * 0.6);

  // Shadow
  ctx.fillStyle = 'rgba(46, 31, 71, 0.2)';
  ctx.fillRect(x + 2 * p, bottomY - 2, 10 * p, 4);

  // Cute lilac-cream ceramic kitty pot
  ctx.fillStyle = '#2e1f47';
  ctx.fillRect(x + 3 * p, y + 7 * p, 8 * p, 5 * p);
  ctx.fillRect(x + 2 * p, y + 6 * p, 10 * p, 2 * p);
  ctx.fillStyle = '#efe7fb';
  ctx.fillRect(x + 3 * p, y + 7 * p, 8 * p, 4 * p);
  ctx.fillStyle = '#d3bcf6';
  ctx.fillRect(x + 3 * p, y + 9 * p, 8 * p, 2 * p);
  // Little kitty face on pot
  ctx.fillStyle = '#2e1f47';
  ctx.fillRect(x + 5 * p, y + 8 * p, p, p);
  ctx.fillRect(x + 8 * p, y + 8 * p, p, p);
  ctx.fillStyle = '#f28eb6';
  ctx.fillRect(x + 6 * p + 1, y + 9 * p, p, p - 1);

  // Stems & green foliage
  ctx.fillStyle = '#4f9c6b';
  ctx.fillRect(x + 4 * p + sway, y + 3 * p, p, 4 * p);
  ctx.fillRect(x + 6 * p + sway, y + 2 * p, p, 5 * p);
  ctx.fillRect(x + 8 * p + sway, y + 3 * p, p, 4 * p);
  ctx.fillStyle = '#71c48d';
  ctx.fillRect(x + 3 * p, y + 5 * p, 2 * p, p);
  ctx.fillRect(x + 9 * p, y + 5 * p, 2 * p, p);

  // Blooming lavender spikes
  const blooms = [
    { bx: 4, by: 1, col: '#9d74db', hi: '#e3d0ff' },
    { bx: 6, by: 0, col: '#8d63d9', hi: '#f6edff' },
    { bx: 8, by: 1, col: '#b88aff', hi: '#efe2ff' },
  ];
  for (const b of blooms) {
    const pxX = x + b.bx * p + sway;
    const pxY = y + b.by * p;
    ctx.fillStyle = '#2e1f47';
    ctx.fillRect(pxX - 1, pxY - 1, 2 * p + 2, 3 * p + 2);
    ctx.fillStyle = b.col;
    ctx.fillRect(pxX, pxY, 2 * p, 3 * p);
    ctx.fillStyle = b.hi;
    ctx.fillRect(pxX, pxY, p, p);
    ctx.fillRect(pxX + p, pxY + p, p, p);
  }
  ctx.restore();
}

export function drawVioletLaserDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  animTime: number,
) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const rx = Math.round(x);
  const ry = Math.round(y);
  const pulse = 0.65 + 0.3 * Math.sin(animTime * 16);
  ctx.fillStyle = `rgba(184, 107, 255, ${pulse * 0.38})`;
  ctx.beginPath();
  ctx.arc(rx, ry, 11, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#b64dff';
  ctx.fillRect(rx - 4, ry - 4, 8, 8);
  ctx.fillStyle = '#f2b8ff';
  ctx.fillRect(rx - 2, ry - 2, 4, 4);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(rx - 1, ry - 1, 2, 2);
  ctx.restore();
}

export function getLoveNoteSaveRect(note: LoveNoteEntity): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const w = 224;
  const h = 90;
  const cx = Math.round(note.x - w / 2);
  const cy = Math.round(note.y - h - 8);
  return {
    x: cx + 8,
    y: cy + h - 22,
    width: 72,
    height: 18,
  };
}

export function drawLoveNoteOverlay(
  ctx: CanvasRenderingContext2D,
  note: LoveNoteEntity,
  animTime: number,
) {
  if (!note.active) return;
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  if (!note.opened) {
    const bob = Math.round(Math.sin(animTime * 4) * 3);
    const ex = Math.round(note.x - 17);
    const ey = Math.round(note.y - 13 + bob);

    // Envelope shadow + border
    ctx.fillStyle = 'rgba(46, 31, 71, 0.2)';
    ctx.fillRect(ex + 2, ey + 26, 32, 4);
    ctx.fillStyle = '#2e1f47';
    ctx.fillRect(ex, ey, 34, 24);
    // Cream paper body
    ctx.fillStyle = '#fffdf9';
    ctx.fillRect(ex + 2, ey + 2, 30, 20);
    // Lavender flap
    ctx.fillStyle = '#e7daf9';
    ctx.fillRect(ex + 3, ey + 3, 28, 7);
    ctx.fillStyle = '#d3bcf6';
    ctx.fillRect(ex + 6, ey + 10, 22, 3);
    // Heart wax seal
    ctx.fillStyle = '#9d74db';
    ctx.fillRect(ex + 14, ey + 10, 2, 2);
    ctx.fillRect(ex + 18, ey + 10, 2, 2);
    ctx.fillRect(ex + 14, ey + 12, 6, 2);
    ctx.fillRect(ex + 15, ey + 14, 4, 2);

    ctx.font = 'bold 9px "Cascadia Mono", Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#2e1f47';
    ctx.fillText('Tap 💌', Math.round(note.x), ey - 4);
  } else {
    const w = 224;
    const h = 90;
    const cx = Math.round(note.x - w / 2);
    const cy = Math.round(note.y - h - 8);

    // Card shadow + pixel border
    ctx.fillStyle = 'rgba(46, 31, 71, 0.24)';
    ctx.fillRect(cx + 4, cy + 4, w, h);
    ctx.fillStyle = '#2e1f47';
    ctx.fillRect(cx, cy, w, h);
    ctx.fillStyle = '#faf6ff';
    ctx.fillRect(cx + 2, cy + 2, w - 4, h - 4);

    // Lavender header stripe
    ctx.fillStyle = '#ede2fc';
    ctx.fillRect(cx + 2, cy + 2, w - 4, 22);
    ctx.fillStyle = '#8d63d9';
    ctx.fillRect(cx + 2, cy + 24, w - 4, 2);

    ctx.font = 'bold 11px "Cascadia Mono", Consolas, monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#2e1f47';
    ctx.fillText('Akii\'s Note 💜', cx + 10, cy + 17);

    // Word-wrap note text cleanly in 2-3 short lines
    ctx.font = '11px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#3b2b5c';
    const words = note.text.split(/\s+/);
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length > 34) {
        if (current) lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);

    lines.slice(0, 3).forEach((line, i) => {
      ctx.fillText(line, cx + 10, cy + 41 + i * 15);
    });

    // Clickable Save ♥ pill button
    const saveRect = getLoveNoteSaveRect(note);
    ctx.fillStyle = '#2e1f47';
    ctx.fillRect(saveRect.x, saveRect.y, saveRect.width, saveRect.height);
    ctx.fillStyle = note.saved ? '#d8c2f8' : '#8d63d9';
    ctx.fillRect(saveRect.x + 1, saveRect.y + 1, saveRect.width - 2, saveRect.height - 2);
    ctx.font = 'bold 9px "Cascadia Mono", Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = note.saved ? '#2e1f47' : '#ffffff';
    ctx.fillText(
      note.saved ? 'Saved ♥' : 'Save ♥',
      saveRect.x + saveRect.width / 2,
      saveRect.y + 12,
    );

    ctx.font = '9px "Cascadia Mono", Consolas, monospace';
    ctx.fillStyle = '#75629a';
    ctx.textAlign = 'right';
    ctx.fillText('click to fold', cx + w - 8, cy + h - 6);
  }

  ctx.restore();
}

export function drawPixelSoapBubble(ctx: CanvasRenderingContext2D, bubble: BubbleEntity) {
  const cx = Math.round(bubble.x);
  const cy = Math.round(bubble.y);
  const r = Math.max(8, Math.round(bubble.radius));

  ctx.save();
  // Soft iridescent lavender-pink translucent fill
  const grad = ctx.createRadialGradient(
    cx - r * 0.35,
    cy - r * 0.35,
    1,
    cx,
    cy,
    r,
  );
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.72)');
  grad.addColorStop(0.55, 'rgba(229, 200, 255, 0.34)');
  grad.addColorStop(0.85, 'rgba(181, 134, 247, 0.45)');
  grad.addColorStop(1, 'rgba(247, 178, 224, 0.75)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(214, 178, 255, 0.92)';
  ctx.stroke();

  // Crisp pixel specular highlights
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx - Math.round(r * 0.5), cy - Math.round(r * 0.5), 3, 3);
  ctx.fillRect(cx - Math.round(r * 0.25), cy - Math.round(r * 0.65), 2, 2);
  ctx.fillStyle = 'rgba(255, 214, 245, 0.9)';
  ctx.fillRect(cx + Math.round(r * 0.25), cy + Math.round(r * 0.3), 2, 2);

  ctx.restore();
}

export function drawStarBrushCursor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  animTime: number,
) {
  const bx = Math.round(x);
  const by = Math.round(y);
  const pulse = Math.sin(animTime * 8) * 1.5;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(bx, by);

  // Soft pastel lavender aura around brush bristles
  ctx.fillStyle = 'rgba(205, 165, 255, 0.26)';
  ctx.beginPath();
  ctx.arc(0, 0, 14 + pulse, 0, Math.PI * 2);
  ctx.fill();

  // Handle + pastel bristle head (pixel art brush)
  ctx.fillStyle = '#3b2458';
  ctx.fillRect(-10, 2, 10, 4);
  ctx.fillStyle = '#b47ef2';
  ctx.fillRect(-9, 3, 8, 2);

  // Plush bristle oval
  ctx.fillStyle = '#3b2458';
  ctx.fillRect(-1, -5, 11, 11);
  ctx.fillStyle = '#edd8ff';
  ctx.fillRect(0, -4, 9, 9);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(2, -3, 5, 2);

  // Little gold star badge on brush back
  ctx.fillStyle = '#ffd86b';
  ctx.fillRect(3, 0, 3, 3);
  ctx.fillRect(4, -1, 1, 5);
  ctx.fillRect(2, 1, 5, 1);

  ctx.restore();
}

export function drawGiftBox(
  ctx: CanvasRenderingContext2D,
  giftBox: GiftBoxEntity,
  coat: CoatId,
  animTime: number,
) {
  if (!giftBox.active) return;

  const s = 2;
  const cx = Math.round(giftBox.x);
  const bottomY = Math.round(giftBox.y);
  const wiggle =
    giftBox.wiggleTimer > 0
      ? Math.round(Math.sin(animTime * 28) * 2)
      : giftBox.occupied
        ? Math.round(Math.sin(animTime * 6) * 0.8)
        : 0;
  const left = cx - 22 + wiggle;
  const top = bottomY - 32;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const px = (gx: number, gy: number, color: string, w = 1, h = 1) => {
    ctx.fillStyle = color;
    ctx.fillRect(left + gx * s, top + gy * s, w * s, h * s);
  };

  // Shadow under gift box
  ctx.fillStyle = 'rgba(42, 24, 68, 0.28)';
  ctx.fillRect(left + 4, bottomY - 2, 36, 4);

  // Slightly popped lid when occupied!
  const lidLift = giftBox.occupied ? -2 : 0;

  // Box base (lavender plush cardboard)
  px(2, 5, '#2b1942', 18, 11);
  px(3, 6, '#c7a4f7', 16, 9);
  px(3, 6, '#dec7ff', 16, 2);
  px(3, 13, '#a47ad9', 16, 2);

  // Satin gold/lilac vertical ribbon + cross
  px(10, 6, '#ffd86b', 2, 9);
  px(3, 9, '#ffd86b', 16, 2);
  px(10, 9, '#ffefa8', 2, 2);

  // If cat is hiding inside, draw tiny peeking ears + glowing eyes from crack!
  if (giftBox.occupied) {
    const pal = COAT_PALETTES[coat] ?? COAT_PALETTES.lilac_ragdoll;
    // Peeking ears
    px(5, 2 + lidLift, pal.outline, 3, 3);
    px(6, 3 + lidLift, pal.earInner, 1, 2);
    px(14, 2 + lidLift, pal.outline, 3, 3);
    px(15, 3 + lidLift, pal.earInner, 1, 2);
    // Dark box interior + glowing curious eyes + nose
    px(4, 5, '#1d1030', 14, 3);
    px(6, 6, '#ffe57f', 2, 1);
    px(14, 6, '#ffe57f', 2, 1);
    px(10, 7, pal.earInner, 2, 1);
  }

  // Lid + big bow on top
  px(1, 3 + lidLift, '#2b1942', 20, 3);
  px(2, 4 + lidLift, '#b282eb', 18, 1);
  // Bow loops
  px(7, 1 + lidLift, '#2b1942', 3, 3);
  px(8, 2 + lidLift, '#ffd86b', 2, 1);
  px(12, 1 + lidLift, '#2b1942', 3, 3);
  px(12, 2 + lidLift, '#ffd86b', 2, 1);
  px(10, 2 + lidLift, '#ffe999', 2, 2);

  ctx.restore();
}

export interface QuickWheelItemDef {
  id: QuickWheelActionId;
  icon: string;
  label: string;
}

export const QUICK_WHEEL_ITEMS: QuickWheelItemDef[] = [
  { id: 'treat', icon: '🍨', label: 'Treat' },
  { id: 'trick', icon: '🌟', label: 'Trick' },
  { id: 'bubbles', icon: '🫧', label: 'Bubbles' },
  { id: 'snap', icon: '📷', label: 'Snap' },
  { id: 'hud', icon: '⚙️', label: 'Menu' },
];

export interface QuickWheelButtonRect {
  id: QuickWheelActionId;
  icon: string;
  label: string;
  cx: number;
  cy: number;
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
}

export interface QuickWheelCenterRect {
  cx: number;
  cy: number;
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
}

const QUICK_WHEEL_RADIUS = 92;
const QUICK_WHEEL_PILL_W = 84;
const QUICK_WHEEL_PILL_H = 34;
const QUICK_WHEEL_MARGIN = 16;

function getQuickWheelCenter(
  wheel: QuickWheelState,
  bounds: { x: number; y: number; width: number; height: number },
): { cx: number; cy: number } {
  const safeCenterX = Math.max(
    bounds.x + QUICK_WHEEL_RADIUS + QUICK_WHEEL_PILL_W / 2 + QUICK_WHEEL_MARGIN,
    Math.min(bounds.x + bounds.width - QUICK_WHEEL_RADIUS - QUICK_WHEEL_PILL_W / 2 - QUICK_WHEEL_MARGIN, wheel.x),
  );
  const safeCenterY = Math.max(
    bounds.y + QUICK_WHEEL_RADIUS + QUICK_WHEEL_PILL_H / 2 + QUICK_WHEEL_MARGIN,
    Math.min(bounds.y + bounds.height - QUICK_WHEEL_RADIUS - QUICK_WHEEL_PILL_H / 2 - QUICK_WHEEL_MARGIN, wheel.y),
  );
  return { cx: Math.round(safeCenterX), cy: Math.round(safeCenterY) };
}

export function getQuickWheelCenterRect(
  wheel: QuickWheelState,
  bounds: { x: number; y: number; width: number; height: number },
): QuickWheelCenterRect | null {
  if (!wheel.active) return null;
  const { cx, cy } = getQuickWheelCenter(wheel, bounds);
  const radius = 24;
  return {
    cx,
    cy,
    x: cx - radius,
    y: cy - radius,
    width: radius * 2,
    height: radius * 2,
    radius,
  };
}

export function getQuickWheelLayout(
  wheel: QuickWheelState,
  bounds: { x: number; y: number; width: number; height: number },
): QuickWheelButtonRect[] {
  if (!wheel.active) return [];
  const { cx: safeCenterX, cy: safeCenterY } = getQuickWheelCenter(wheel, bounds);

  return QUICK_WHEEL_ITEMS.map((item, idx) => {
    const angle = -Math.PI / 2 + (idx * Math.PI * 2) / QUICK_WHEEL_ITEMS.length;
    const cx = Math.round(safeCenterX + Math.cos(angle) * QUICK_WHEEL_RADIUS);
    const cy = Math.round(safeCenterY + Math.sin(angle) * QUICK_WHEEL_RADIUS);
    return {
      id: item.id,
      icon: item.icon,
      label: item.label,
      cx,
      cy,
      x: Math.round(cx - QUICK_WHEEL_PILL_W / 2),
      y: Math.round(cy - QUICK_WHEEL_PILL_H / 2),
      width: QUICK_WHEEL_PILL_W,
      height: QUICK_WHEEL_PILL_H,
      active: false,
    };
  });
}

export function drawMoonlightLantern(
  ctx: CanvasRenderingContext2D,
  lantern: LanternEntity,
  animTime: number,
): void {
  if (!lantern.active) return;
  const s = 3;
  const flicker = Math.sin(animTime * 3.4) * 0.08 + 0.92;
  const baseX = Math.round(lantern.x);
  const baseY = Math.round(lantern.y);

  ctx.save();
  if (lantern.lit) {
    const grad = ctx.createRadialGradient(baseX, baseY - 22, 4, baseX, baseY - 22, 68 * flicker);
    grad.addColorStop(0, 'rgba(254, 240, 172, 0.38)');
    grad.addColorStop(0.45, 'rgba(196, 160, 248, 0.22)');
    grad.addColorStop(1, 'rgba(196, 160, 248, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(baseX, baseY - 22, 68 * flicker, 0, Math.PI * 2);
    ctx.fill();
  }

  const ox = baseX - 5 * s;
  const oy = baseY - 12 * s;
  const px = (gx: number, gy: number, color: string, w = 1, h = 1) => {
    ctx.fillStyle = color;
    ctx.fillRect(ox + gx * s, oy + gy * s, w * s, h * s);
  };

  // Top carrying ring + lavender cap
  px(4, 0, '#d8b4fe', 2, 1);
  px(3, 1, '#3b2458', 4, 1);
  px(2, 2, '#4c2c7a', 6, 1);
  px(1, 3, '#6d44a8', 8, 1);
  px(2, 3, '#a78bfa', 6, 1);

  // Glass body & frame
  px(2, 4, '#2d1b46', 1, 6);
  px(7, 4, '#2d1b46', 1, 6);
  if (lantern.lit) {
    px(3, 4, '#fef3c7', 4, 6);
    px(4, 5, '#fde047', 2, 4);
    px(4, 6, '#ffffff', 1, 2);
  } else {
    px(3, 4, '#4c3575', 4, 6);
    px(4, 5, '#6b5399', 2, 4);
  }
  // Tiny crescent motif on front bar
  px(4, 4, '#c084fc', 2, 1);

  // Pedestal base
  px(1, 10, '#3b2458', 8, 1);
  px(2, 11, '#26143b', 6, 1);
  ctx.restore();
}

export function drawShootingStar(
  ctx: CanvasRenderingContext2D,
  star: ShootingStarEntity,
): void {
  if (star.wished) return;
  const t = star.life / Math.max(0.01, star.maxLife);
  const alpha = t < 0.12 ? t / 0.12 : t > 0.8 ? Math.max(0, (1 - t) / 0.2) : 1;
  if (alpha <= 0.01) return;

  const speed = Math.hypot(star.vx, star.vy) || 1;
  const tailLen = 58;
  const tx = star.x - (star.vx / speed) * tailLen;
  const ty = star.y - (star.vy / speed) * tailLen;

  ctx.save();
  ctx.globalAlpha = alpha;
  const grad = ctx.createLinearGradient(tx, ty, star.x, star.y);
  grad.addColorStop(0, 'rgba(192, 132, 252, 0)');
  grad.addColorStop(0.55, 'rgba(216, 180, 254, 0.7)');
  grad.addColorStop(1, 'rgba(254, 249, 195, 0.98)');
  ctx.strokeStyle = grad;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(star.x, star.y);
  ctx.stroke();

  // Crisp pixel star head
  const s = 3;
  const cx = Math.round(star.x);
  const cy = Math.round(star.y);
  ctx.fillStyle = star.color || '#fef08a';
  ctx.fillRect(cx - s, cy - s, s * 2, s * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx - 1, cy - s * 2, 2, s * 4);
  ctx.fillRect(cx - s * 2, cy - 1, s * 4, 2);
  ctx.restore();
}

export function drawQuickWheel(
  ctx: CanvasRenderingContext2D,
  wheel: QuickWheelState,
  bounds: { x: number; y: number; width: number; height: number },
) {
  if (!wheel.active) return;

  const buttons = getQuickWheelLayout(wheel, bounds);
  if (buttons.length === 0) return;

  const centerX =
    buttons.reduce((acc, b) => acc + b.cx, 0) / buttons.length;
  const centerY =
    buttons.reduce((acc, b) => acc + b.cy, 0) / buttons.length;

  ctx.save();

  // Subtle dashed lavender halo connecting wheel options
  ctx.strokeStyle = 'rgba(209, 174, 255, 0.55)';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.arc(centerX, centerY, 92, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  for (const btn of buttons) {
    const hovered = wheel.hoveredId === btn.id;
    const fill = hovered
      ? '#6e45a8'
      : btn.active
        ? '#553285'
        : 'rgba(34, 20, 56, 0.94)';
    const border = hovered || btn.active ? '#f1d4ff' : '#9c78d1';

    ctx.fillStyle = 'rgba(18, 10, 32, 0.35)';
    ctx.fillRect(btn.x + 2, btn.y + 3, btn.width, btn.height);

    ctx.fillStyle = fill;
    ctx.fillRect(btn.x, btn.y, btn.width, btn.height);
    ctx.strokeStyle = border;
    ctx.lineWidth = hovered ? 2 : 1.5;
    ctx.strokeRect(btn.x, btn.y, btn.width, btn.height);

    ctx.font = 'bold 11px "Cascadia Mono", Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = hovered ? '#ffffff' : '#f7ecff';
    ctx.fillText(`${btn.icon} ${btn.label}`, btn.cx, btn.cy + 1);
  }

  const centerRect = getQuickWheelCenterRect(wheel, bounds);
  if (centerRect) {
    const hubHovered = Boolean(wheel.hoveredCenter);
    ctx.fillStyle = hubHovered ? '#6e45a8' : 'rgba(34, 20, 56, 0.94)';
    ctx.beginPath();
    ctx.arc(centerRect.cx, centerRect.cy, centerRect.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hubHovered ? '#f1d4ff' : '#9c78d1';
    ctx.lineWidth = hubHovered ? 2 : 1.5;
    ctx.stroke();

    ctx.font = 'bold 11px "Cascadia Mono", Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = hubHovered ? '#ffffff' : '#e8d4ff';
    ctx.fillText(hubHovered ? '♥ Pet' : '🐾', centerRect.cx, centerRect.cy + 1);
  }

  ctx.restore();
}
