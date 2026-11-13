import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import esbuild from 'esbuild';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';

const outDir = path.resolve('dist-test');
fs.mkdirSync(outDir, { recursive: true });

after(() => {
  fs.rmSync(outDir, { recursive: true, force: true });
});

await esbuild.build({
  entryPoints: [
    path.resolve('src/engine/physics.ts'),
    path.resolve('src/engine/progression.ts'),
    path.resolve('src/engine/ai.ts'),
    path.resolve('src/engine/onboardingSprites.ts'),
    path.resolve('src/engine/sound.ts'),
    path.resolve('src/engine/sprites.ts'),
  ],
  outdir: outDir,
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node22',
});

const physics = await import(pathToFileURL(path.join(outDir, 'physics.js')).href);
const progression = await import(pathToFileURL(path.join(outDir, 'progression.js')).href);
const ai = await import(pathToFileURL(path.join(outDir, 'ai.js')).href);
const onboardingSprites = await import(pathToFileURL(path.join(outDir, 'onboardingSprites.js')).href);
const sound = await import(pathToFileURL(path.join(outDir, 'sound.js')).href);
const sprites = await import(pathToFileURL(path.join(outDir, 'sprites.js')).href);

function makeCat(x, y) {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    facing: 1,
    state: 'idle',
    stateTimer: 1,
    animTime: 0,
    grounded: true,
    perchedHwnd: null,
    perchedOffsetX: 0,
    perchedWindowY: 0,
    perchedAppTitle: null,
    targetX: null,
    targetLedge: null,
    holdCooldown: 10,
    holdDuration: 0,
    petRubAccum: 0,
    lastPetCursorX: 0,
    pawPrintCooldown: 0,
    particleCooldown: 0,
    activeAppReaction: 'none',
    statusBubble: null,
    statusBubbleTimer: 0,
    pokeStreak: 0,
    lastPokeAt: 0,
    yarnReachHopCooldown: 0,
    yarnCatchCooldown: 0,
    blushTimer: 0,
    ignoreLedgeHwnd: null,
    ignoreLedgeUntilY: 0,
    meowCooldown: 0,
    cuddledYarnColor: null,
  };
}

test('buildWalkableLedges treats multi-monitor taskbars as ground and subtracts occluded titlebars', () => {
  const snap = {
    virtualX: 0,
    virtualY: 0,
    virtualWidth: 3840,
    virtualHeight: 1080,
    cursorX: 500,
    cursorY: 500,
    idleMs: 1000,
    monitors: [
      { x: 0, y: 0, width: 1920, height: 1080, workX: 0, workY: 0, workWidth: 1920, workHeight: 1032, isPrimary: true },
      { x: 1920, y: 0, width: 1920, height: 1080, workX: 1920, workY: 0, workWidth: 1920, workHeight: 1032, isPrimary: false },
    ],
    windows: [
      { hwnd: 1, x: 100, y: 120, width: 400, height: 300, title: 'Spotify', zIndex: 0, isForeground: true, isMedia: true },
      { hwnd: 2, x: 250, y: 200, width: 600, height: 400, title: 'VS Code', zIndex: 1, isForeground: false, isMedia: false },
    ],
  };

  const ledges = physics.buildWalkableLedges(snap);
  const taskbars = ledges.filter((l) => l.kind === 'taskbar');
  assert.equal(taskbars.length, 2);
  assert.equal(taskbars[0].y, 1032);
  assert.equal(taskbars[1].startX, 1920);

  const rearWinLedges = ledges.filter((l) => l.hwnd === 2);
  assert.equal(rearWinLedges.length, 1);
  assert.equal(rearWinLedges[0].startX, 500);
  assert.equal(rearWinLedges[0].endX, 850 - 14);
});

test('kitten crosses seamlessly onto second monitor when yarn is pushed there', () => {
  const snap = {
    virtualX: 0,
    virtualY: 0,
    virtualWidth: 3840,
    virtualHeight: 1080,
    cursorX: 100,
    cursorY: 100,
    idleMs: 5000,
    monitors: [
      { x: 0, y: 0, width: 1920, height: 1080, workX: 0, workY: 0, workWidth: 1920, workHeight: 1032, isPrimary: true },
      { x: 1920, y: 0, width: 1920, height: 1080, workX: 1920, workY: 0, workWidth: 1920, workHeight: 1080, isPrimary: false },
    ],
    windows: [],
  };
  const ledges = physics.buildWalkableLedges(snap);
  const save = progression.createInitialSaveState('sakura', 'Mochi');
  const cat = makeCat(1780, 1032 - 84);
  const toys = [
    {
      id: 'yarn-1',
      kind: 'yarn',
      heldBy: null,
      x: 2250,
      y: 1080 - 16,
      vx: 0,
      vy: 0,
      radius: 16,
      rotation: 0,
      settled: true,
      bounces: 0,
      spawnedAt: Date.now(),
    },
  ];
  const particles = [];
  const focus = { active: false, totalSeconds: 1500, remainingSeconds: 1500, startedAt: 0 };

  for (let i = 0; i < 180; i++) {
    ai.stepCatAI({
      dt: 1 / 60,
      cat,
      save,
      snapshot: snap,
      ledges,
      toys,
      particles,
      focus,
      isBusyUser: false,
      isDraggingCat: false,
    });
  }

  assert.ok(cat.x > 1920, `Expected kitten to cross onto second monitor (x > 1920), got x=${cat.x}`);
});

test('computeJumpVelocity generates upward velocity sufficient to reach elevated titlebar', () => {
  const { vx, vy } = physics.computeJumpVelocity(400, 1000, 550, 300, 60);
  assert.ok(vy < -1400, `Expected strong upward vy, got ${vy}`);
  assert.ok(vx > 0, `Expected positive vx toward target, got ${vx}`);
});

test('triggerPokeCat increments pokesCount, sets poked state, and unlocks heart_shades', () => {
  const save = progression.createInitialSaveState('sakura', 'Peach');
  const cat = makeCat(300, 600);
  const particles = [];

  for (let i = 0; i < 10; i++) {
    ai.triggerPokeCat(cat, save, particles);
  }
  assert.equal(cat.state, 'poked');
  assert.equal(save.stats.pokesCount, 10);
  assert.ok(save.unlockedAccessories.includes('heart_shades'));
});

test('kitten stands on two legs (reach_yarn) under held yarn and catches it', () => {
  const snap = {
    virtualX: 0,
    virtualY: 0,
    virtualWidth: 1920,
    virtualHeight: 1080,
    cursorX: 500,
    cursorY: 920,
    idleMs: 100,
    monitors: [
      { x: 0, y: 0, width: 1920, height: 1080, workX: 0, workY: 0, workWidth: 1920, workHeight: 1032, isPrimary: true },
    ],
    windows: [],
  };
  const ledges = physics.buildWalkableLedges(snap);
  const save = progression.createInitialSaveState('lavender', 'Lily');
  const cat = makeCat(450, 1032 - 84);
  const toys = [
    {
      id: 'yarn-tease',
      kind: 'yarn',
      heldBy: 'tease',
      x: 500,
      y: 920,
      vx: 0,
      vy: 0,
      radius: 16,
      rotation: 0,
      settled: false,
      bounces: 0,
      spawnedAt: Date.now(),
    },
  ];
  const particles = [];
  const focus = { active: false, totalSeconds: 1500, remainingSeconds: 1500, startedAt: 0 };

  ai.stepCatAI({
    dt: 1 / 60,
    cat,
    save,
    snapshot: snap,
    ledges,
    toys,
    particles,
    focus,
    isBusyUser: false,
    isDraggingCat: false,
  });
  assert.equal(cat.state, 'reach_yarn');

  // Lower yarn right onto kitten's raised paws -> catch!
  toys[0].y = cat.y + 12;
  toys[0].x = cat.x + 60;
  ai.stepCatAI({
    dt: 1 / 60,
    cat,
    save,
    snapshot: snap,
    ledges,
    toys,
    particles,
    focus,
    isBusyUser: false,
    isDraggingCat: false,
  });
  assert.equal(save.stats.yarnCatches, 1);
  assert.equal(cat.state, 'celebrate');
});

test('progression defaults to very_slow pace and evolves under normal pace', () => {
  const save = progression.createInitialSaveState('calico', 'Biscuit');
  assert.equal(save.stage, 'tiny_kitten');
  assert.equal(save.settings.growthPace, 'very_slow');
  assert.ok(save.unlockedAccessories.includes('pink_bow'));

  // Under default very_slow pace (0.12x), 120 raw XP grants 14.4 XP and keeps Tiny Kitten stage
  const slowEv = progression.applyXpAndEvaluate(save, 120);
  assert.equal(slowEv.evolvedTo, undefined);
  assert.equal(save.stage, 'tiny_kitten');
  assert.ok(save.xp > 14 && save.xp < 15);

  save.settings.growthPace = 'normal';
  const ev1 = progression.applyXpAndEvaluate(save, 120);
  assert.equal(ev1.evolvedTo, 'junior_kitten');
  assert.equal(save.stage, 'junior_kitten');
  assert.ok(save.achievements['junior_grad']);
  assert.ok(save.unlockedAccessories.includes('tiara'));

  save.stats.jumpsCount = 12;
  save.stats.titlebarNaps = 3;
  const ev2 = progression.applyXpAndEvaluate(save, 800);
  assert.equal(ev2.evolvedTo, 'grown_cat');
  assert.ok(save.unlockedAccessories.includes('leaf_hat'));
  assert.ok(save.unlockedAccessories.includes('red_collar'));
  assert.ok(save.unlockedAccessories.includes('golden_bell'));
  assert.ok(save.timeline.length >= 4);
});

test('kitten jump height is capped to half of the screen size (no superjumps)', () => {
  const snap = {
    virtualX: 0,
    virtualY: 0,
    virtualWidth: 1920,
    virtualHeight: 1080,
    cursorX: 100,
    cursorY: 100,
    idleMs: 5000,
    isAudioPlaying: false,
    monitors: [
      { x: 0, y: 0, width: 1920, height: 1080, workX: 0, workY: 0, workWidth: 1920, workHeight: 1032, isPrimary: true },
    ],
    windows: [
      { hwnd: 10, x: 0, y: 0, width: 900, height: 950, title: 'Browser', zIndex: 0, isForeground: true, isMedia: false },
      { hwnd: 11, x: 960, y: 600, width: 800, height: 350, title: 'MidWindow', zIndex: 1, isForeground: false, isMedia: false },
    ],
  };
  const ledges = physics.buildWalkableLedges(snap);
  const tallLedge = ledges.find((l) => l.hwnd === 10);
  const midLedge = ledges.find((l) => l.hwnd === 11);
  assert.ok(tallLedge && midLedge, 'Expected ledges for both windows');

  // Direct velocity helper caps rise cleanly at maxRisePx = 540
  const maxUpSpeed = Math.sqrt(2 * physics.GRAVITY * 540);
  const capped = physics.computeJumpVelocity(500, 1032, 500, 0, 58, 540);
  assert.ok(Math.abs(capped.vy) <= maxUpSpeed + 0.01, `Expected capped jump speed <= ${maxUpSpeed}, got ${capped.vy}`);

  // Yarn way above half-screen (>540px above taskbar) should NOT trigger a full-screen superjump
  const save = progression.createInitialSaveState('sakura', 'Mochi');
  const cat = makeCat(500, 1032 - 84);
  const highToys = [
    {
      id: 'yarn-too-high',
      kind: 'yarn',
      heldBy: null,
      x: 520,
      y: tallLedge.y - 16,
      vx: 0,
      vy: 0,
      radius: 16,
      rotation: 0,
      settled: true,
      bounces: 0,
      spawnedAt: Date.now(),
    },
  ];
  const particles = [];
  const focus = { active: false, totalSeconds: 1500, remainingSeconds: 1500, startedAt: 0 };

  ai.stepCatAI({
    dt: 1 / 60,
    cat,
    save,
    snapshot: snap,
    ledges,
    toys: highToys,
    particles,
    focus,
    isBusyUser: false,
    isDraggingCat: false,
  });

  assert.notEqual(cat.state, 'jump', 'Kitten should not superjump over half the screen height in one leap');

  // Yarn on the mid-height window (1032 -> 600 = 432px <= 540px) SHOULD trigger a jump within the cap
  const cat2 = makeCat(1080, 1032 - 84);
  const midToys = [
    {
      id: 'yarn-mid',
      kind: 'yarn',
      heldBy: null,
      x: 1120,
      y: midLedge.y - 16,
      vx: 0,
      vy: 0,
      radius: 16,
      rotation: 0,
      settled: true,
      bounces: 0,
      spawnedAt: Date.now(),
    },
  ];

  ai.stepCatAI({
    dt: 1 / 60,
    cat: cat2,
    save,
    snapshot: snap,
    ledges,
    toys: midToys,
    particles,
    focus,
    isBusyUser: false,
    isDraggingCat: false,
  });

  assert.equal(cat2.state, 'jump');
  assert.ok(Math.abs(cat2.vy) <= maxUpSpeed + 0.01, `Jump speed exceeded half-screen cap: vy=${cat2.vy}`);
});

test('kitten on elevated titlebar jumps down cleanly when yarn goes down to taskbar', () => {
  const snap = {
    virtualX: 0,
    virtualY: 0,
    virtualWidth: 1920,
    virtualHeight: 1080,
    cursorX: 100,
    cursorY: 100,
    idleMs: 5000,
    isAudioPlaying: false,
    monitors: [
      { x: 0, y: 0, width: 1920, height: 1080, workX: 0, workY: 0, workWidth: 1920, workHeight: 1032, isPrimary: true },
    ],
    windows: [
      { hwnd: 1, x: 100, y: 200, width: 800, height: 400, title: 'Upper', zIndex: 0, isForeground: true, isMedia: false },
      { hwnd: 2, x: 150, y: 460, width: 900, height: 400, title: 'Lower', zIndex: 1, isForeground: false, isMedia: false },
    ],
  };
  const ledges = physics.buildWalkableLedges(snap);
  const save = progression.createInitialSaveState('ginger', 'Mochi');
  const cat = makeCat(460, 200 - 84);
  cat.perchedHwnd = 1;
  cat.perchedWindowY = 200;
  cat.perchedOffsetX = 360;

  const toys = [
    {
      id: 'yarn-low',
      kind: 'yarn',
      heldBy: null,
      x: 500,
      y: 1032 - 16,
      vx: 0,
      vy: 0,
      radius: 16,
      rotation: 0,
      settled: true,
      bounces: 0,
      spawnedAt: Date.now(),
    },
  ];
  const particles = [];
  const focus = { active: false, totalSeconds: 1500, remainingSeconds: 1500, startedAt: 0 };

  for (let i = 0; i < 120; i++) {
    ai.stepCatAI({
      dt: 1 / 60,
      cat,
      save,
      snapshot: snap,
      ledges,
      toys,
      particles,
      focus,
      isBusyUser: false,
      isDraggingCat: false,
    });
  }

  assert.notEqual(cat.perchedHwnd, 1, 'Expected kitten to leave upper titlebar');
  assert.ok(cat.y > 350, `Expected kitten to descend toward lower titlebar/taskbar, got y=${cat.y}`);
});

test('kitten cuddles yarn to sleep after playing and yarn disappears', () => {
  const snap = {
    virtualX: 0,
    virtualY: 0,
    virtualWidth: 1920,
    virtualHeight: 1080,
    cursorX: 100,
    cursorY: 100,
    idleMs: 5000,
    isAudioPlaying: false,
    monitors: [
      { x: 0, y: 0, width: 1920, height: 1080, workX: 0, workY: 0, workWidth: 1920, workHeight: 1032, isPrimary: true },
    ],
    windows: [],
  };
  const ledges = physics.buildWalkableLedges(snap);
  const save = progression.createInitialSaveState('sakura', 'Mochi');
  const cat = makeCat(400, 1032 - 84);
  const toys = [
    {
      id: 'yarn-cuddle',
      kind: 'yarn',
      color: '#ff85b3',
      heldBy: null,
      batsCount: 3,
      x: 448,
      y: 1032 - 16,
      vx: 0,
      vy: 0,
      radius: 16,
      rotation: 0,
      settled: true,
      bounces: 0,
      spawnedAt: Date.now(),
    },
  ];
  const particles = [];
  const focus = { active: false, totalSeconds: 1500, remainingSeconds: 1500, startedAt: 0 };

  ai.stepCatAI({
    dt: 1 / 60,
    cat,
    save,
    snapshot: snap,
    ledges,
    toys,
    particles,
    focus,
    isBusyUser: false,
    isDraggingCat: false,
  });

  assert.equal(cat.state, 'cuddle_yarn');
  assert.equal(toys.length, 0);
  assert.equal(cat.cuddledYarnColor, '#ff85b3');

  // Step through nap until yarn vanishes
  for (let i = 0; i < 320; i++) {
    ai.stepCatAI({
      dt: 1 / 60,
      cat,
      save,
      snapshot: snap,
      ledges,
      toys,
      particles,
      focus,
      isBusyUser: false,
      isDraggingCat: false,
    });
  }
  assert.equal(cat.cuddledYarnColor, null);
});

test('kitten vibes to desktop audio with music chord emojis', () => {
  const snap = {
    virtualX: 0,
    virtualY: 0,
    virtualWidth: 1920,
    virtualHeight: 1080,
    cursorX: 100,
    cursorY: 100,
    idleMs: 5000,
    isAudioPlaying: true,
    monitors: [
      { x: 0, y: 0, width: 1920, height: 1080, workX: 0, workY: 0, workWidth: 1920, workHeight: 1032, isPrimary: true },
    ],
    windows: [],
  };
  const ledges = physics.buildWalkableLedges(snap);
  const save = progression.createInitialSaveState('lavender', 'Mochi');
  const cat = makeCat(400, 1032 - 84);
  const particles = [];
  const focus = { active: false, totalSeconds: 1500, remainingSeconds: 1500, startedAt: 0 };

  ai.stepCatAI({
    dt: 1 / 60,
    cat,
    save,
    snapshot: snap,
    ledges,
    toys: [],
    particles,
    focus,
    isBusyUser: false,
    isDraggingCat: false,
  });

  assert.equal(cat.state, 'head_bob');
  assert.ok(particles.some((p) => p.kind === 'note' && typeof p.glyph === 'string'));
});

test('startup greeting addresses default Jane and custom configured names', () => {
  const save = progression.createInitialSaveState('sakura', 'Mochi');
  assert.equal(save.settings.userName, 'Jane');

  const cat = makeCat(400, 900);
  const particles = [];
  ai.triggerGreeting(cat, save, particles);

  assert.equal(cat.state, 'celebrate');
  assert.equal(cat.statusBubble, 'Hi Jane! ♥');
  assert.ok(cat.statusBubbleTimer > 0);
  assert.ok(particles.some((p) => p.kind === 'heart'));

  save.settings.userName = 'Akii';
  ai.triggerGreeting(cat, save, particles);
  assert.equal(cat.statusBubble, 'Hi Akii! ♥');
});

test('first-boot save state defaults onboardingCompleted to false and positions onboarding inside primary work area', () => {
  const fresh = progression.createInitialSaveState();
  assert.equal(fresh.onboardingCompleted, false);
  assert.equal(fresh.settings.userName, 'Jane');
  assert.equal(fresh.settings.hudTheme, 'lavender');
  assert.equal(fresh.settings.soundStyle, 'music_box');
  assert.equal(fresh.coat, 'lavender');
  assert.ok(fresh.unlockedAccessories.includes('lavender_bow'));
  assert.ok(fresh.unlockedAccessories.includes('pearl_collar'));
  assert.ok(fresh.unlockedAccessories.includes('pink_bow'));

  const monitor = {
    x: 0,
    y: 0,
    width: 1920,
    height: 1080,
    workX: 0,
    workY: 0,
    workWidth: 1920,
    workHeight: 1032,
    isPrimary: true,
  };

  const letterpad = onboardingSprites.getLetterpadRect(monitor);
  assert.ok(letterpad.x > 0 && letterpad.x + letterpad.width < monitor.workWidth);
  assert.ok(letterpad.y > 0 && letterpad.y + letterpad.height < monitor.workHeight);

  const eggLayout = onboardingSprites.getEggSceneLayout(monitor);
  assert.equal(eggLayout.anchorX, 960);
  assert.equal(eggLayout.anchorY, 620);
  assert.ok(eggLayout.hitRect.width > 180 && eggLayout.hitRect.height > 180);
});

test('Phase B: butterfly booping, cushion landing, and feather wand reach work in engine', () => {
  const snap = {
    virtualX: 0,
    virtualY: 0,
    virtualWidth: 1920,
    virtualHeight: 1080,
    cursorX: 400,
    cursorY: 960,
    idleMs: 2000,
    musicPlaying: false,
    monitors: [
      { x: 0, y: 0, width: 1920, height: 1080, workX: 0, workY: 0, workWidth: 1920, workHeight: 1032, isPrimary: true },
    ],
    windows: [],
  };
  const ledges = physics.buildWalkableLedges(snap);
  const cushion = { active: true, x: 520, y: 920, vy: 0, grounded: false };
  for (let i = 0; i < 60; i++) {
    physics.stepCushionPhysics(cushion, ledges, snap.monitors, 1 / 60, false);
  }
  assert.equal(cushion.grounded, true);
  assert.equal(cushion.y, 1032);

  const save = progression.createInitialSaveState('lavender', 'Mochi');
  const cat = makeCat(400, 1032 - 84);
  const particles = [];
  const focus = { active: false, totalSeconds: 1500, remainingSeconds: 1500, startedAt: 0 };
  const butterflies = [
    {
      id: 'b-1',
      kind: 'butterfly',
      x: 425,
      y: 1032 - 50,
      vx: 40,
      vy: 0,
      phase: 0,
      color: '#d8b4fe',
      life: 0,
      maxLife: 20,
    },
  ];
  physics.stepButterflies(butterflies, snap.monitors, 1 / 60);
  assert.equal(butterflies.length, 1);

  ai.stepCatAI({
    dt: 1 / 60,
    cat,
    save,
    snapshot: snap,
    ledges,
    toys: [],
    particles,
    focus,
    isBusyUser: false,
    isDraggingCat: false,
    butterflies,
    cushion,
  });

  assert.equal(butterflies[0].booped, true);
  assert.equal(save.stats.butterfliesCaught, 1);
  assert.equal(cat.state, 'celebrate');

  const wand = { active: true, x: 520, y: 900, vx: 60, vy: -120, grounded: false, heldByCursor: false, idleSeconds: 0 };
  for (let i = 0; i < 80; i++) {
    physics.stepFeatherWandPhysics(wand, ledges, snap.monitors, 1 / 60);
  }
  assert.equal(wand.grounded, true);

  cat.state = 'idle';
  ai.stepCatAI({
    dt: 1 / 60,
    cat,
    save,
    snapshot: snap,
    ledges,
    toys: [],
    particles,
    focus,
    isBusyUser: false,
    isDraggingCat: false,
    featherWand: { active: true, x: 430, y: 890, vx: 0, vy: 0, heldByCursor: true },
  });
  assert.equal(cat.state, 'reach_yarn');

  ai.stepCatAI({
    dt: 1 / 60,
    cat,
    save,
    snapshot: snap,
    ledges,
    toys: [],
    particles,
    focus,
    isBusyUser: false,
    isDraggingCat: false,
    featherWand: { active: true, x: 430, y: 960, vx: 0, vy: 0, heldByCursor: true },
  });
  assert.equal(cat.state, 'celebrate');
  assert.equal(save.stats.yarnCatches, 1);
});

test('Phase C: Polaroid memories cap at 12 and care whispers / Akii love notes personalize', () => {
  const save = progression.createInitialSaveState('lavender', 'Mochi');
  assert.equal(save.settings.careWhispersEnabled, true);
  assert.deepEqual(save.memories, []);

  for (let i = 0; i < 15; i++) {
    progression.addPolaroidMemory(save, {
      id: `mem-${i}`,
      coat: 'lavender',
      accessory: 'star_clip',
      stage: 'tiny_kitten',
      pose: 'sit',
      caption: `Snap ${i}`,
    });
  }
  assert.equal(save.memories.length, 12);
  assert.equal(save.memories[0].id, 'mem-14');

  progression.removePolaroidMemory(save, 'mem-14');
  assert.equal(save.memories.length, 11);
  assert.equal(save.memories[0].id, 'mem-13');

  const dayWhisper = progression.pickCareWhisper('Jane', 14);
  assert.ok(dayWhisper.length > 0);
  const loveNote = progression.pickLoveNoteText('Jane');
  assert.ok(loveNote.includes('Akii'));

  const dayPool = progression.getCareWhisperPool('Jane', 14);
  const nightPool = progression.getCareWhisperPool('Jane', 23);
  assert.ok(new Set(dayPool).size >= 50, `Expected >= 50 unique day whispers, got ${new Set(dayPool).size}`);
  assert.ok(new Set(nightPool).size >= 50, `Expected >= 50 unique night whispers, got ${new Set(nightPool).size}`);

  const notePool = progression.getLoveNotePool('Jane');
  assert.ok(new Set(notePool).size >= 50, `Expected >= 50 unique Akii notes, got ${new Set(notePool).size}`);
  for (const note of notePool) {
    assert.ok(note.includes('Akii'), `Expected note to mention Akii: ${note}`);
    const words = note.split(/\s+/);
    const lines = [];
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
    assert.ok(lines.length <= 3, `Akii note exceeded 3 wrapped lines (${lines.length}): ${note}`);
  }
});

test('SFX enabled setting syncs to kittenAudio and suspends running AudioContext when turned off', () => {
  let suspended = false;
  sound.kittenAudio.ctx = {
    state: 'running',
    suspend: async () => {
      suspended = true;
    },
  };
  sound.kittenAudio.enabled = true;
  assert.equal(sound.kittenAudio.enabled, true);

  sound.kittenAudio.enabled = false;
  assert.equal(sound.kittenAudio.enabled, false);
  assert.equal(suspended, true);
  sound.kittenAudio.ctx = null;
  sound.kittenAudio.enabled = true;
});

test('Lavender expansion: new coats, accessories, violet laser chase, lavender pot, treats, mementos, and Love Jar', () => {
  for (const cid of ['lilac_ragdoll', 'starlight_plum', 'wisteria_calico']) {
    assert.ok(sprites.COAT_PALETTES[cid], `Missing palette for coat ${cid}`);
  }
  for (const aid of ['lace_headband', 'fairy_wings', 'witch_hat', 'amethyst_crown', 'lunar_glasses']) {
    assert.ok(progression.ACCESSORY_META[aid], `Missing metadata for accessory ${aid}`);
  }

  const snap = {
    virtualX: 0,
    virtualY: 0,
    virtualWidth: 1920,
    virtualHeight: 1080,
    cursorX: 430,
    cursorY: 1032,
    idleMs: 2000,
    monitors: [
      { x: 0, y: 0, width: 1920, height: 1080, workX: 0, workY: 0, workWidth: 1920, workHeight: 1032, isPrimary: true },
    ],
    windows: [],
  };
  const ledges = physics.buildWalkableLedges(snap);
  const save = progression.createInitialSaveState('starlight_plum', 'Mochi');
  assert.ok(save.unlockedAccessories.includes('lace_headband'));

  // Violet Laser pounce & achievement unlock
  const cat = makeCat(400, 1032 - 84);
  const particles = [];
  const focus = { active: false, totalSeconds: 1500, remainingSeconds: 1500, startedAt: 0 };
  for (let i = 0; i < 5; i++) {
    cat.state = 'idle';
    cat.yarnCatchCooldown = 0;
    ai.stepCatAI({
      dt: 1 / 60,
      cat,
      save,
      snapshot: snap,
      ledges,
      toys: [],
      particles,
      focus,
      isBusyUser: false,
      isDraggingCat: false,
      laserActive: true,
    });
  }
  assert.equal(save.stats.laserPounces, 5);
  assert.ok(save.achievements.laser_chaser, 'Expected laser_chaser achievement unlocked');
  assert.ok(save.unlockedAccessories.includes('amethyst_crown'));

  // Potted Lavender physics & sniff interaction
  const plant = { active: true, x: 430, y: 900, vx: 0, vy: 0, grounded: false, swayTimer: 0 };
  for (let i = 0; i < 80; i++) {
    physics.stepPlantPhysics(plant, ledges, snap.monitors, 1 / 60);
  }
  assert.equal(plant.grounded, true);
  assert.equal(plant.y, 1032);

  cat.state = 'walk';
  cat.vx = 60;
  cat.grounded = true;
  cat.x = 400;
  cat.y = 1032 - 84;
  ai.stepCatAI({
    dt: 1 / 60,
    cat,
    save,
    snapshot: snap,
    ledges,
    toys: [],
    particles,
    focus,
    isBusyUser: false,
    isDraggingCat: false,
    plant,
  });
  assert.equal(save.stats.plantSniffs, 1);
  assert.ok(plant.swayTimer > 0);
  assert.ok(particles.some((p) => p.kind === 'petal'));

  // New treats (ube_icecream, star_kibble, croissant)
  const treats = ['ube_icecream', 'star_kibble', 'croissant'].map((kind, idx) => ({
    id: `treat-${idx}`,
    kind,
    x: 440,
    y: 1032 - 14,
    vx: 0,
    vy: 0,
    radius: 14,
    rotation: 0,
    settled: true,
    bounces: 0,
    spawnedAt: Date.now(),
  }));
  for (const t of treats) {
    cat.state = 'idle';
    ai.stepCatAI({
      dt: 1 / 60,
      cat,
      save,
      snapshot: snap,
      ledges,
      toys: [t],
      particles,
      focus,
      isBusyUser: false,
      isDraggingCat: false,
    });
  }
  assert.equal(save.stats.treatsEaten, 3);
  assert.ok(save.mementos.includes('velvet_ribbon'));

  // Love Jar deduplication & removal
  const n1 = progression.saveLoveNote(save, 'Sending a tiny pocket hug! - Akii 💜');
  progression.saveLoveNote(save, 'Sending a tiny pocket hug! - Akii 💜');
  assert.equal(save.savedNotes.length, 1);
  progression.deleteSavedNote(save, n1.id);
  assert.equal(save.savedNotes.length, 0);
});

test('Soap bubbles float, bounce inside monitor, and pop unlocks soap_wand & bubble_popper', () => {
  const save = progression.createInitialSaveState('lilac_ragdoll', 'Wisteria', true);
  const snap = physics.createBrowserFallbackSnapshot();
  const particles = [];
  const bubbles = [
    {
      id: 'b-edge',
      x: snap.monitors[0].x + 12,
      y: snap.monitors[0].workY + 12,
      vx: -90,
      vy: -80,
      radius: 16,
      phase: 0,
      color: '#d9b5ff',
      life: 0,
      maxLife: 10,
    },
  ];

  physics.stepBubbles(bubbles, snap.monitors, 0.1);
  assert.equal(bubbles.length, 1);
  assert.ok(bubbles[0].vx > 0, 'bubble should bounce inward from left edge');
  assert.ok(bubbles[0].vy > 0, 'bubble should bounce downward from top workY');

  // Pop 12 bubbles to unlock both soap_wand (3) and bubble_popper (12)
  for (let i = 0; i < 12; i++) {
    bubbles.push({
      id: `b-${i}`,
      x: 400,
      y: 400,
      vx: 0,
      vy: -20,
      radius: 14,
      phase: 0,
      color: '#f7b2e0',
      life: 0,
      maxLife: 10,
    });
    const { popped } = ai.popBubble(bubbles, `b-${i}`, save, particles, i, false);
    assert.equal(popped, true);
  }
  assert.equal(save.stats.bubblesPopped, 12);
  assert.ok(save.mementos.includes('soap_wand'));
  assert.ok(save.achievements.bubble_popper);
});

test('Tricks, zoomies, and Star Brush touch zones update state and progression', () => {
  const save = progression.createInitialSaveState('starlight_plum', 'Mochi', true);
  const cat = makeCat(300, 900);
  const particles = [];

  ai.brushCat(cat, save, particles, 'head');
  assert.equal(cat.state, 'petted');

  ai.brushCat(cat, save, particles, 'belly');
  assert.equal(cat.state, 'roll_wiggle');
  assert.equal(cat.statusBubble, 'Hehe ticklish! >w<');

  ai.triggerCatZoomies(cat, save, particles);
  assert.equal(cat.state, 'zoomies');
  assert.ok(Math.abs(cat.vx) >= 400);

  for (let i = 0; i < 6; i++) {
    const trick = i % 3 === 0 ? 'trick_spin' : i % 3 === 1 ? 'trick_highfive' : 'trick_flip';
    ai.triggerCatTrick(cat, save, particles, trick);
    assert.equal(cat.state, trick);
  }
  assert.equal(save.stats.tricksPerformed, 6);
  assert.ok(save.mementos.includes('confetti_bow'));
  assert.ok(save.achievements.trick_star);
});

test('Purple Gift Box physics, box ambush progression, and Quick Wheel bounds', () => {
  const save = progression.createInitialSaveState('wisteria_calico', 'Boba', true);
  const snap = physics.createBrowserFallbackSnapshot();
  const ledges = physics.buildWalkableLedges(snap);
  const cat = makeCat(420, 948);
  const particles = [];

  const giftBox = {
    active: true,
    x: 440,
    y: 700,
    vx: 0,
    vy: 0,
    grounded: false,
    occupied: false,
    wiggleTimer: 0.4,
    cooldown: 0,
  };
  for (let i = 0; i < 90; i++) {
    physics.stepGiftBoxPhysics(giftBox, ledges, snap.monitors, 1 / 60, false);
  }
  assert.equal(giftBox.grounded, true);
  assert.equal(giftBox.wiggleTimer, 0);

  giftBox.occupied = true;
  cat.state = 'box_hide';
  for (let i = 0; i < 4; i++) {
    giftBox.occupied = true;
    cat.state = 'box_hide';
    ai.triggerGiftBoxAmbush(cat, save, giftBox, giftBox.x + 80, giftBox.y - 60, particles);
    assert.equal(giftBox.occupied, false);
    assert.equal(cat.state, 'pounce');
  }
  assert.equal(save.stats.boxAmbushes, 4);
  assert.ok(save.achievements.box_ambusher);

  const wheel = {
    active: true,
    x: 10,
    y: 10,
    hoveredId: null,
  };
  const mon = snap.monitors[0];
  const bounds = { x: mon.workX, y: mon.workY, width: mon.workWidth, height: mon.workHeight };
  const buttons = sprites.getQuickWheelLayout(wheel, bounds, { laserActive: true });
  assert.equal(buttons.length, 8);
  for (const btn of buttons) {
    assert.ok(btn.x >= bounds.x);
    assert.ok(btn.y >= bounds.y);
    assert.ok(btn.x + btn.width <= bounds.x + bounds.width);
    assert.ok(btn.y + btn.height <= bounds.y + bounds.height);
  }
  assert.equal(buttons.find((b) => b.id === 'laser')?.active, true);
});

test('Moonlight Lantern physics, shooting star wishes, and Star Jar wish unlocks', () => {
  const save = progression.createInitialSaveState('lavender', 'Luna', true);
  const snap = physics.createBrowserFallbackSnapshot();
  const ledges = physics.buildWalkableLedges(snap);
  const cat = makeCat(300, 620);
  const particles = [];

  const lantern = {
    active: true,
    lit: true,
    x: 320,
    y: 400,
    vx: 0,
    vy: 0,
    grounded: false,
  };
  for (let i = 0; i < 90; i++) {
    physics.stepLanternPhysics(lantern, ledges, snap.monitors, 1 / 60, false);
  }
  assert.equal(lantern.grounded, true);
  assert.equal(lantern.lit, true);

  const star = ai.spawnShootingStar(snap.monitors);
  assert.ok(star);
  const stars = [star];
  const prevX = star.x;
  physics.stepShootingStars(stars, 0.25);
  assert.notEqual(star.x, prevX);

  // First shooting star wish unlocks Moonstone Charm memento
  ai.wishOnShootingStar(star, cat, save, particles);
  assert.equal(star.wished, true);
  assert.equal(save.stats.wishesMade, 1);
  assert.ok(save.mementos.includes('moon_stone'));
  physics.stepShootingStars(stars, 0.016);
  assert.equal(stars.length, 0);

  // Spending from Star Jar requires 5 stars
  save.starJarCount = 3;
  assert.equal(progression.spendStarJarForWish(save).ok, false);

  save.starJarCount = 10;
  assert.equal(progression.spendStarJarForWish(save).ok, true);
  assert.equal(save.starJarCount, 5);
  assert.equal(save.stats.wishesMade, 2);

  // Third wish unlocks Stargazer achievement & Crescent Halo accessory
  assert.equal(progression.spendStarJarForWish(save).ok, true);
  assert.equal(save.starJarCount, 0);
  assert.equal(save.stats.wishesMade, 3);
  assert.ok(save.achievements.stargazer);
  assert.ok(save.unlockedAccessories.includes('crescent_crown'));
});
