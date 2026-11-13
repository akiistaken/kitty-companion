import React, { useCallback, useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { OnboardingOverlay } from './components/OnboardingOverlay';
import {
  brushCat,
  popBubble,
  spawnYarnVanishParticles,
  stepCatAI,
  triggerCatTrick,
  triggerCatZoomies,
  triggerGiftBoxAmbush,
  triggerGreeting,
  triggerPokeCat,
} from './engine/ai';
import { getEggSceneLayout, getLetterpadRect } from './engine/onboardingSprites';
import { stepAndDrawOverlay } from './engine/overlayCanvas';
import {
  buildWalkableLedges,
  createBrowserFallbackSnapshot,
  findMonitorForPoint,
  getGroundYAt,
  stepBubbles,
  stepButterflies,
  stepCushionPhysics,
  stepFeatherWandPhysics,
  stepGiftBoxPhysics,
  stepPlantPhysics,
  stepToysPhysics,
} from './engine/physics';
import {
  addPolaroidMemory,
  applyXpAndEvaluate,
  createInitialSaveState,
  deleteSavedNote,
  formatAppLabel,
  pickCareWhisper,
  pickLoveNoteText,
  pushTimelineEntry,
  removePolaroidMemory,
  saveLoveNote,
  STAGE_THRESHOLDS,
} from './engine/progression';
import { kittenAudio } from './engine/sound';
import {
  getLoveNoteSaveRect,
  getQuickWheelLayout,
  getStageDimensions,
} from './engine/sprites';
import { HudAction, HudSyncPayload } from './types/bridge';
import {
  AccessoryId,
  BubbleEntity,
  ButterflyEntity,
  CatRuntime,
  CoatId,
  CushionEntity,
  DesktopSnapshot,
  FeatherWandState,
  FocusState,
  GiftBoxEntity,
  HitRect,
  KittenSaveState,
  LavenderPlantEntity,
  LoveNoteEntity,
  MonitorRect,
  OnboardingPhase,
  Particle,
  QuickWheelState,
  ToyEntity,
  ToyKind,
  WalkableLedge,
} from './types/kitten';

const isTauriEnv = () =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [save, setSave] = useState<KittenSaveState>(() => createInitialSaveState());
  const saveRef = useRef<KittenSaveState>(save);
  saveRef.current = save;

  const [focus, setFocus] = useState<FocusState>({
    active: false,
    totalSeconds: 25 * 60,
    remainingSeconds: 25 * 60,
    startedAt: 0,
  });
  const focusRef = useRef<FocusState>(focus);
  focusRef.current = focus;

  const teaseYarnActiveRef = useRef<boolean>(false);
  const laserActiveRef = useRef<boolean>(false);
  const brushActiveRef = useRef<boolean>(false);
  const bubblesRef = useRef<BubbleEntity[]>([]);
  const bubbleComboRef = useRef<{ count: number }>({ count: 0 });
  const quickWheelRef = useRef<QuickWheelState>({
    active: false,
    x: 0,
    y: 0,
    hoveredId: null,
  });
  const giftBoxRef = useRef<GiftBoxEntity>({
    active: false,
    x: 420,
    y: 400,
    vx: 0,
    vy: 0,
    grounded: false,
    occupied: false,
    wiggleTimer: 0,
    cooldown: 0,
  });
  const giftBoxDragRef = useRef<{
    dragging: boolean;
    offsetX: number;
    offsetY: number;
    lastX: number;
    lastY: number;
    vx: number;
    vy: number;
  }>({
    dragging: false,
    offsetX: 0,
    offsetY: 0,
    lastX: 0,
    lastY: 0,
    vx: 0,
    vy: 0,
  });
  const featherWandRef = useRef<FeatherWandState>({
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
  });
  const cushionRef = useRef<CushionEntity>({
    active: false,
    x: 280,
    y: 400,
    vx: 0,
    vy: 0,
    grounded: false,
  });
  const plantRef = useRef<LavenderPlantEntity>({
    active: false,
    x: 360,
    y: 400,
    vx: 0,
    vy: 0,
    grounded: false,
    swayTimer: 0,
  });
  const cushionDragRef = useRef<{
    dragging: boolean;
    offsetX: number;
    offsetY: number;
    lastX: number;
    lastY: number;
    vx: number;
    vy: number;
  }>({
    dragging: false,
    offsetX: 0,
    offsetY: 0,
    lastX: 0,
    lastY: 0,
    vx: 0,
    vy: 0,
  });
  const plantDragRef = useRef<{
    dragging: boolean;
    offsetX: number;
    offsetY: number;
    lastX: number;
    lastY: number;
    vx: number;
    vy: number;
  }>({
    dragging: false,
    offsetX: 0,
    offsetY: 0,
    lastX: 0,
    lastY: 0,
    vx: 0,
    vy: 0,
  });
  const featherWandDragRef = useRef<{
    dragging: boolean;
    lastX: number;
    lastY: number;
    vx: number;
    vy: number;
  }>({ dragging: false, lastX: 0, lastY: 0, vx: 0, vy: 0 });
  const butterfliesRef = useRef<ButterflyEntity[]>([]);
  const butterflySpawnTimerRef = useRef<number>(22 + Math.random() * 40);
  const careWhisperTimerRef = useRef<number>(95 + Math.random() * 85);
  const loveNoteScheduleRef = useRef<number>(180 + Math.random() * 180);
  const loveNoteRef = useRef<LoveNoteEntity>({
    active: false,
    x: 0,
    y: 0,
    text: '',
    opened: false,
    timer: 0,
  });

  const hudOpenRef = useRef<boolean>(false);
  const wakeLoopRef = useRef<(() => void) | null>(null);

  const publishBridgeState = useCallback(
    (nextSave: KittenSaveState = saveRef.current, nextFocus: FocusState = focusRef.current) => {
      if (!isTauriEnv()) return;
      const payload: HudSyncPayload = {
        save: nextSave,
        focus: nextFocus,
        teaseYarnActive: teaseYarnActiveRef.current,
        featherWandActive: featherWandRef.current.active,
        cushionActive: cushionRef.current.active,
        laserActive: laserActiveRef.current,
        plantActive: plantRef.current.active,
        brushActive: brushActiveRef.current,
        giftBoxActive: giftBoxRef.current.active,
      };
      void invoke('publish_hud_state', { json: JSON.stringify(payload) }).catch(() => {});
    },
    [],
  );
  const publishBridgeRef = useRef(publishBridgeState);
  publishBridgeRef.current = publishBridgeState;

  const snapshotRef = useRef<DesktopSnapshot>(createBrowserFallbackSnapshot());
  const ledgesRef = useRef<WalkableLedge[]>(buildWalkableLedges(snapshotRef.current));
  const toysRef = useRef<ToyEntity[]>([]);
  const particlesRef = useRef<Particle[]>([]);

  const catRef = useRef<CatRuntime>({
    x: 240,
    y: 400,
    vx: 65,
    vy: 0,
    facing: 1,
    state: 'idle',
    stateTimer: 1.5,
    animTime: 0,
    grounded: false,
    perchedHwnd: null,
    perchedOffsetX: 0,
    perchedWindowY: 0,
    perchedAppTitle: null,
    targetX: null,
    targetLedge: null,
    holdCooldown: 6,
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
  });

  const dragStateRef = useRef<{
    dragging: boolean;
    offsetX: number;
    offsetY: number;
    moved: boolean;
    prevGrounded: boolean;
    prevPerchedHwnd: number | null;
    prevState: CatRuntime['state'];
  }>({
    dragging: false,
    offsetX: 0,
    offsetY: 0,
    moved: false,
    prevGrounded: true,
    prevPerchedHwnd: null,
    prevState: 'idle',
  });

  const toyDragRef = useRef<{
    dragging: boolean;
    toyId: string | null;
    lastX: number;
    lastY: number;
    vx: number;
    vy: number;
  }>({ dragging: false, toyId: null, lastX: 0, lastY: 0, vx: 0, vy: 0 });

  const lastCursorRef = useRef<{ x: number; y: number; activeAt: number }>({
    x: 0,
    y: 0,
    activeAt: 0,
  });
  const holdSentActiveRef = useRef<boolean>(false);
  const saveDirtyRef = useRef<boolean>(false);

  const [onboardingPhase, setOnboardingPhase] = useState<OnboardingPhase>('loading');
  const onboardingPhaseRef = useRef<OnboardingPhase>('loading');
  const onboardingAnimRef = useRef<number>(0);
  const smokeTimerRef = useRef<number>(0);
  const hatchElapsedRef = useRef<number>(0);
  const hatchCrackStageRef = useRef<number>(0);
  const onboardingHoverRef = useRef<boolean>(false);
  const [onboardingHovered, setOnboardingHovered] = useState<boolean>(false);
  const nameTagHitRectRef = useRef<HitRect | null>(null);

  const setPhase = useCallback((next: OnboardingPhase) => {
    const prev = onboardingPhaseRef.current;
    onboardingPhaseRef.current = next;
    onboardingHoverRef.current = false;
    setOnboardingHovered(false);
    setOnboardingPhase(next);
    if (isTauriEnv() && (next === 'naming' || prev === 'naming')) {
      void invoke('set_overlay_focusable', { focusable: next === 'naming' }).catch(() => {});
    }
  }, []);

  const getPrimaryMonitor = useCallback((): MonitorRect | undefined => {
    const mons = snapshotRef.current.monitors;
    return mons.find((m) => m.isPrimary) ?? mons[0];
  }, []);

  const spawnSmokeBurst = useCallback((cx: number, cy: number, count = 20) => {
    const smokeColors = ['#efe7fb', '#fffdf9', '#dfd0f7', '#e6dcf9'];
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const spd = 35 + Math.random() * 110;
      particlesRef.current.push({
        id: `smoke-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        kind: 'smoke',
        x: cx + (Math.random() - 0.5) * 40,
        y: cy + (Math.random() - 0.5) * 28,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 24,
        alpha: 1,
        life: 0,
        maxLife: 0.55 + Math.random() * 0.35,
        size: 12 + Math.round(Math.random() * 12),
        color: smokeColors[i % smokeColors.length],
      });
    }
    for (let i = 0; i < 8; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 45 + Math.random() * 90;
      particlesRef.current.push({
        id: `spark-smoke-${Date.now()}-${i}`,
        kind: 'sparkle',
        x: cx + (Math.random() - 0.5) * 32,
        y: cy + (Math.random() - 0.5) * 32,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 15,
        alpha: 1,
        life: 0,
        maxLife: 0.7 + Math.random() * 0.35,
      });
    }
  }, []);

  const spawnBasketDisappearPoof = useCallback((cx: number, cy: number) => {
    for (let i = 0; i < 12; i++) {
      const ang = (Math.PI * 2 * i) / 12;
      particlesRef.current.push({
        id: `bpoof-${Date.now()}-${i}`,
        kind: 'smoke',
        x: cx + (Math.random() - 0.5) * 90,
        y: cy + (Math.random() - 0.5) * 24,
        vx: Math.cos(ang) * (40 + Math.random() * 55),
        vy: -18 - Math.random() * 40,
        alpha: 1,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.25,
        size: 10 + Math.round(Math.random() * 8),
        color: i % 2 === 0 ? '#f3ece0' : '#efe7fb',
      });
    }
  }, []);

  const spawnEggChips = useCallback((cx: number, cy: number, count = 4) => {
    const shellColors = ['#fffdf9', '#efe7fb', '#d2baf6', '#ad8ae8'];
    for (let i = 0; i < count; i++) {
      const dir = Math.random() < 0.5 ? -1 : 1;
      particlesRef.current.push({
        id: `chip-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 5)}`,
        kind: 'shell',
        x: cx + (Math.random() - 0.5) * 36,
        y: cy + (Math.random() - 0.5) * 36,
        vx: dir * (50 + Math.random() * 90),
        vy: -110 - Math.random() * 110,
        alpha: 1,
        life: 0,
        maxLife: 0.75 + Math.random() * 0.35,
        size: 4 + Math.round(Math.random() * 2),
        rotation: Math.random() * Math.PI,
        vRot: dir * (4 + Math.random() * 6),
        color: shellColors[i % shellColors.length],
      });
    }
  }, []);

  const spawnHatchExplosion = useCallback((cx: number, cy: number) => {
    spawnSmokeBurst(cx, cy, 18);
    spawnEggChips(cx, cy, 12);
    const petalColors = ['#c8a6f7', '#efe7fb', '#fffdf8', '#e5b8f4'];
    for (let i = 0; i < 14; i++) {
      const ang = -Math.PI * Math.random();
      const spd = 60 + Math.random() * 120;
      particlesRef.current.push({
        id: `hatch-petal-${Date.now()}-${i}`,
        kind: i % 3 === 0 ? 'heart' : 'petal',
        x: cx + (Math.random() - 0.5) * 26,
        y: cy - 8,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 35,
        alpha: 1,
        life: 0,
        maxLife: 1.2 + Math.random() * 0.6,
        color: petalColors[i % petalColors.length],
      });
    }
  }, [spawnEggChips, spawnSmokeBurst]);

  const persistNow = useCallback(async (next: KittenSaveState) => {
    saveDirtyRef.current = false;
    if (isTauriEnv()) {
      await invoke('save_kitten_state', { json: JSON.stringify(next) }).catch(() => {});
    } else {
      try {
        localStorage.setItem('kitten_save_v1', JSON.stringify(next));
      } catch {
        // ignore storage quota errors
      }
    }
  }, []);

  const commitSave = useCallback((mutator: (draft: KittenSaveState) => void, immediate = false) => {
    setSave((prev) => {
      const clone: KittenSaveState = structuredClone(prev);
      mutator(clone);
      saveRef.current = clone;
      kittenAudio.enabled = clone.settings.soundEnabled;
      kittenAudio.volume = clone.settings.volume;
      kittenAudio.style = clone.settings.soundStyle ?? 'chiptune';
      kittenAudio.setStage(clone.stage);
      if (immediate) {
        void persistNow(clone);
      } else {
        saveDirtyRef.current = true;
      }
      publishBridgeState(clone, focusRef.current);
      return clone;
    });
  }, [persistNow, publishBridgeState]);

  const toggleHud = useCallback(() => {
    publishBridgeState(saveRef.current, focusRef.current);
    if (isTauriEnv()) {
      void invoke('toggle_hud_window').catch(() => {});
    }
  }, [publishBridgeState]);

  const YARN_COLORS = ['#a682e8', '#c8a6f7', '#d972b8', '#7ea3e8'];

  const tossToy = useCallback((kind: ToyKind) => {
    const snap = snapshotRef.current;
    const cat = catRef.current;
    const dims = getStageDimensions(saveRef.current.stage, saveRef.current.settings.spriteScale);
    const mon = findMonitorForPoint(snap.monitors, cat.x, cat.y);
    const spawnX = cat.x + dims.width / 2 + (Math.random() * 140 - 70);
    const spawnY = Math.max((mon?.workY ?? 0) + 40, cat.y - 180);

    if (toysRef.current.length >= 4) {
      const idx = toysRef.current.findIndex((t) => !t.heldBy);
      toysRef.current.splice(idx >= 0 ? idx : 0, 1);
    }
    toysRef.current.push({
      id: `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      kind,
      color: kind === 'yarn' ? YARN_COLORS[Math.floor(Math.random() * YARN_COLORS.length)] : undefined,
      heldBy: null,
      x: spawnX,
      y: spawnY,
      vx: (Math.random() < 0.5 ? -1 : 1) * (150 + Math.random() * 120),
      vy: -220,
      radius: 16,
      rotation: 0,
      settled: false,
      bounces: 0,
      spawnedAt: Date.now(),
    });
    kittenAudio.setStage(saveRef.current.stage);
    kittenAudio.playTrill(saveRef.current.stage === 'tiny_kitten');
    wakeLoopRef.current?.();
  }, []);

  const pokeCat = useCallback(() => {
    const ev = triggerPokeCat(catRef.current, saveRef.current, particlesRef.current);
    if (ev.evolvedLabel) {
      kittenAudio.playUnlock();
      catRef.current.statusBubble = `Grew: ${STAGE_THRESHOLDS[ev.evolvedLabel as keyof typeof STAGE_THRESHOLDS]?.label ?? ev.evolvedLabel}!`;
      catRef.current.statusBubbleTimer = 4.0;
    } else if (ev.achievementBanner) {
      kittenAudio.playUnlock();
      catRef.current.statusBubble = `Badge: ${ev.achievementBanner}`;
      catRef.current.statusBubbleTimer = 3.5;
    }
    setSave({ ...saveRef.current });
    saveDirtyRef.current = true;
    publishBridgeState(saveRef.current, focusRef.current);
    wakeLoopRef.current?.();
  }, [publishBridgeState]);

  const clearYarn = useCallback(() => {
    teaseYarnActiveRef.current = false;
    toyDragRef.current.dragging = false;
    toyDragRef.current.toyId = null;

    const remaining: ToyEntity[] = [];
    for (const toy of toysRef.current) {
      if (toy.kind === 'yarn') {
        spawnYarnVanishParticles(particlesRef.current, toy.x, toy.y, toy.color);
      } else {
        remaining.push(toy);
      }
    }
    toysRef.current = remaining;

    if (catRef.current.state === 'cuddle_yarn' || catRef.current.state === 'reach_yarn') {
      catRef.current.cuddledYarnColor = null;
      catRef.current.state = 'sit';
      catRef.current.stateTimer = 1.0;
    }
    publishBridgeState(saveRef.current, focusRef.current);
  }, [publishBridgeState]);

  const toggleTeaseYarn = useCallback(() => {
    const next = !teaseYarnActiveRef.current;
    teaseYarnActiveRef.current = next;
    if (next) {
      featherWandRef.current.active = false;
      const snap = snapshotRef.current;
      // Reuse existing loose yarn if available, or spawn a fresh pastel yarn ball!
      let yarn = toysRef.current.find((t) => t.kind === 'yarn');
      if (!yarn) {
        if (toysRef.current.length >= 4) toysRef.current.shift();
        yarn = {
          id: `yarn-tease-${Date.now()}`,
          kind: 'yarn',
          color: YARN_COLORS[Math.floor(Math.random() * YARN_COLORS.length)],
          heldBy: 'tease',
          x: snap.cursorX,
          y: snap.cursorY + 28,
          vx: 0,
          vy: 0,
          radius: 16,
          rotation: 0,
          settled: false,
          bounces: 0,
          spawnedAt: Date.now(),
        };
        toysRef.current.push(yarn);
      } else {
        yarn.heldBy = 'tease';
        yarn.settled = false;
        yarn.vx = 0;
        yarn.vy = 0;
      }
      kittenAudio.setStage(saveRef.current.stage);
      kittenAudio.playTrill(false);
    } else {
      for (const toy of toysRef.current) {
        if (toy.heldBy === 'tease') {
          toy.heldBy = null;
          toy.vx = 0;
          toy.vy = 20;
          toy.bounces = 0;
        }
      }
    }
    publishBridgeState(saveRef.current, focusRef.current);
  }, [publishBridgeState]);

  const toggleFeatherWand = useCallback(() => {
    const cat = catRef.current;
    const snap = snapshotRef.current;
    const dims = getStageDimensions(saveRef.current.stage, saveRef.current.settings.spriteScale);
    const mon = findMonitorForPoint(snap.monitors, cat.x, cat.y);
    const spawnX = cat.x + dims.width / 2 + (Math.random() * 140 - 70);
    const spawnY = Math.max((mon?.workY ?? 0) + 40, cat.y - 180);

    featherWandDragRef.current.dragging = false;
    featherWandRef.current = {
      active: true,
      x: spawnX,
      y: spawnY,
      vx: (Math.random() < 0.5 ? -1 : 1) * (150 + Math.random() * 110),
      vy: -220,
      grounded: false,
      heldByCursor: false,
      idleSeconds: 0,
    };
    kittenAudio.setStage(saveRef.current.stage);
    kittenAudio.playBellJingle();
    publishBridgeState(saveRef.current, focusRef.current);
  }, [publishBridgeState]);

  const toggleCushion = useCallback(() => {
    const next = !cushionRef.current.active;
    if (next) {
      const cat = catRef.current;
      const snap = snapshotRef.current;
      const dims = getStageDimensions(saveRef.current.stage, saveRef.current.settings.spriteScale);
      const mon = findMonitorForPoint(snap.monitors, cat.x, cat.y);
      const spawnX = cat.x + dims.width / 2 + (Math.random() * 140 - 70);
      const spawnY = Math.max((mon?.workY ?? 0) + 40, cat.y - 180);

      cushionDragRef.current.dragging = false;
      cushionRef.current = {
        active: true,
        x: spawnX,
        y: spawnY,
        vx: (Math.random() < 0.5 ? -1 : 1) * (130 + Math.random() * 100),
        vy: -200,
        grounded: false,
      };
      kittenAudio.playToyBat();
      catRef.current.statusBubble = 'Comfy cushion!';
      catRef.current.statusBubbleTimer = 2.0;
    } else {
      cushionDragRef.current.dragging = false;
      spawnYarnVanishParticles(
        particlesRef.current,
        cushionRef.current.x,
        cushionRef.current.y - 10,
        '#c8a6f7',
      );
      cushionRef.current.active = false;
    }
    publishBridgeState(saveRef.current, focusRef.current);
  }, [publishBridgeState]);

  const toggleLaser = useCallback(() => {
    const next = !laserActiveRef.current;
    laserActiveRef.current = next;
    if (next) {
      brushActiveRef.current = false;
      teaseYarnActiveRef.current = false;
      for (const toy of toysRef.current) {
        if (toy.heldBy === 'tease') toy.heldBy = null;
      }
      catRef.current.statusBubble = 'Violet dot!! ✨';
      catRef.current.statusBubbleTimer = 1.6;
      kittenAudio.playTrill(false);
    }
    publishBridgeState(saveRef.current, focusRef.current);
  }, [publishBridgeState]);

  const toggleBrush = useCallback(() => {
    const next = !brushActiveRef.current;
    brushActiveRef.current = next;
    if (next) {
      laserActiveRef.current = false;
      teaseYarnActiveRef.current = false;
      for (const toy of toysRef.current) {
        if (toy.heldBy === 'tease') toy.heldBy = null;
      }
      catRef.current.statusBubble = 'Brush time! ✨';
      catRef.current.statusBubbleTimer = 1.6;
      kittenAudio.playBrushStroke();
    }
    publishBridgeState(saveRef.current, focusRef.current);
  }, [publishBridgeState]);

  const spawnBubbles = useCallback(() => {
    const cat = catRef.current;
    const snap = snapshotRef.current;
    const dims = getStageDimensions(saveRef.current.stage, saveRef.current.settings.spriteScale);
    const mon = findMonitorForPoint(snap.monitors, cat.x, cat.y);
    const baseX = cat.x + dims.width / 2;
    const baseY = cat.y + dims.height * 0.4;
    const monLeft = mon ? mon.x + 28 : 40;
    const monRight = mon ? mon.x + mon.width - 28 : 1200;

    bubbleComboRef.current.count = 0;
    const count = 8;
    for (let i = 0; i < count; i++) {
      if (bubblesRef.current.length >= 16) bubblesRef.current.shift();
      const bx = Math.max(monLeft, Math.min(monRight, baseX + (Math.random() - 0.5) * 180));
      bubblesRef.current.push({
        id: `bubble-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 5)}`,
        x: bx,
        y: baseY - Math.random() * 26,
        vx: (Math.random() - 0.5) * 76,
        vy: -26 - Math.random() * 34,
        radius: 13 + Math.random() * 9,
        phase: Math.random() * Math.PI * 2,
        color: i % 2 === 0 ? '#d9b5ff' : '#f7b2e0',
        life: 0,
        maxLife: 11 + Math.random() * 5,
      });
    }
    kittenAudio.playBubblePop(0);
    cat.statusBubble = 'Soap bubbles! 🫧';
    cat.statusBubbleTimer = 1.8;
    wakeLoopRef.current?.();
  }, []);

  const toggleGiftBox = useCallback(() => {
    const next = !giftBoxRef.current.active;
    if (next) {
      const cat = catRef.current;
      const snap = snapshotRef.current;
      const dims = getStageDimensions(saveRef.current.stage, saveRef.current.settings.spriteScale);
      const mon = findMonitorForPoint(snap.monitors, cat.x, cat.y);
      const spawnX = cat.x + dims.width / 2 + (Math.random() < 0.5 ? -90 : 90);
      const spawnY = Math.max((mon?.workY ?? 0) + 40, cat.y - 160);

      giftBoxDragRef.current.dragging = false;
      giftBoxRef.current = {
        active: true,
        x: spawnX,
        y: spawnY,
        vx: (Math.random() < 0.5 ? -1 : 1) * (100 + Math.random() * 70),
        vy: -200,
        grounded: false,
        occupied: false,
        wiggleTimer: 0.7,
        cooldown: 0,
      };
      kittenAudio.playToyBat();
      catRef.current.statusBubble = 'A gift box!! 🎁';
      catRef.current.statusBubbleTimer = 2.0;
    } else {
      giftBoxDragRef.current.dragging = false;
      giftBoxRef.current.occupied = false;
      if (catRef.current.state === 'box_hide') {
        catRef.current.state = 'sit';
        catRef.current.stateTimer = 1.2;
      }
      spawnYarnVanishParticles(
        particlesRef.current,
        giftBoxRef.current.x,
        giftBoxRef.current.y - 16,
        '#c8a6f7',
      );
      giftBoxRef.current.active = false;
    }
    publishBridgeState(saveRef.current, focusRef.current);
  }, [publishBridgeState]);

  const doTrick = useCallback(() => {
    if (onboardingPhaseRef.current !== 'done') return;
    const res = triggerCatTrick(catRef.current, saveRef.current, particlesRef.current);
    commitSave(() => {}, false);
    if (res.evolvedLabel) {
      kittenAudio.playUnlock();
      catRef.current.statusBubble = `Grew: ${STAGE_THRESHOLDS[res.evolvedLabel as keyof typeof STAGE_THRESHOLDS]?.label ?? res.evolvedLabel}!`;
      catRef.current.statusBubbleTimer = 4.0;
    } else if (res.achievementBanner) {
      kittenAudio.playUnlock();
      catRef.current.statusBubble = `Badge: ${res.achievementBanner}`;
      catRef.current.statusBubbleTimer = 3.5;
    } else if (res.mementoBanner) {
      kittenAudio.playUnlock();
      catRef.current.statusBubble = `Gift: ${res.mementoBanner}!`;
      catRef.current.statusBubbleTimer = 3.5;
    }
    publishBridgeState(saveRef.current, focusRef.current);
    wakeLoopRef.current?.();
  }, [commitSave, publishBridgeState]);

  const snapPolaroidMemory = useCallback(() => {
    const cat = catRef.current;
    const dims = getStageDimensions(saveRef.current.stage, saveRef.current.settings.spriteScale);
    const caption = cat.perchedAppTitle
      ? `Cozy on ${formatAppLabel(cat.perchedAppTitle)}`
      : cat.state === 'sleep' || cat.state === 'cuddle_yarn'
        ? 'Dreamy afternoon nap'
        : cat.state === 'head_bob'
          ? 'Vibing to tunes ♪'
          : cat.state === 'knead'
            ? 'Making biscuits ♥'
            : `${saveRef.current.name} desktop moment`;
    commitSave((d) => {
      addPolaroidMemory(d, {
        coat: d.coat,
        accessory: d.equippedAccessory,
        stage: d.stage,
        pose: cat.state,
        caption,
      });
    }, true);
    kittenAudio.playCatch();
    kittenAudio.playMew();
    cat.statusBubble = 'Snap! 📸';
    cat.statusBubbleTimer = 2.0;
    for (let i = 0; i < 6; i++) {
      const ang = (Math.PI * 2 * i) / 6;
      particlesRef.current.push({
        id: `snap-${Date.now()}-${i}`,
        kind: 'sparkle',
        x: cat.x + dims.width / 2 + Math.cos(ang) * 18,
        y: cat.y + dims.height / 2 + Math.sin(ang) * 18,
        vx: Math.cos(ang) * 28,
        vy: Math.sin(ang) * 28 - 10,
        alpha: 1,
        life: 0,
        maxLife: 0.7,
      });
    }
  }, [commitSave]);

  const togglePlant = useCallback(() => {
    const next = !plantRef.current.active;
    if (next) {
      const cat = catRef.current;
      const snap = snapshotRef.current;
      const dims = getStageDimensions(saveRef.current.stage, saveRef.current.settings.spriteScale);
      const mon = findMonitorForPoint(snap.monitors, cat.x, cat.y);
      const spawnX = cat.x + dims.width / 2 + (Math.random() < 0.5 ? -85 : 85);
      const spawnY = Math.max((mon?.workY ?? 0) + 40, cat.y - 160);

      plantDragRef.current.dragging = false;
      plantRef.current = {
        active: true,
        x: spawnX,
        y: spawnY,
        vx: (Math.random() < 0.5 ? -1 : 1) * (100 + Math.random() * 80),
        vy: -190,
        grounded: false,
        swayTimer: 0.8,
      };
      kittenAudio.playToyBat();
      catRef.current.statusBubble = 'Blooming lavender! 🪻';
      catRef.current.statusBubbleTimer = 2.0;
    } else {
      plantDragRef.current.dragging = false;
      spawnYarnVanishParticles(
        particlesRef.current,
        plantRef.current.x,
        plantRef.current.y - 14,
        '#b88aff',
      );
      plantRef.current.active = false;
    }
    publishBridgeState(saveRef.current, focusRef.current);
  }, [publishBridgeState]);

  const toggleFocus = useCallback(() => {
    setFocus((prev) => {
      if (prev.active) {
        return { ...prev, active: false };
      }
      const total = saveRef.current.settings.focusMinutes * 60;
      catRef.current.statusBubble = 'Focus Nap!';
      catRef.current.statusBubbleTimer = 2.0;
      return {
        active: true,
        totalSeconds: total,
        remainingSeconds: total,
        startedAt: Date.now(),
      };
    });
  }, []);

  // Startup sequence: sync bounds, scan desktop, load saved state, report splash progress
  useEffect(() => {
    let cancelled = false;
    const reportProgress = (progress: number, status: string) => {
      if (isTauriEnv()) {
        void invoke('report_loading_progress', { progress, status }).catch(() => {});
      }
    };

    (async () => {
      reportProgress(25, 'Scanning desktop windows...');
      if (isTauriEnv()) {
        await invoke('sync_overlay_bounds').catch(() => {});
        const snap = await invoke<DesktopSnapshot>('get_desktop_snapshot').catch(() => null);
        if (snap && !cancelled) {
          snapshotRef.current = snap;
          ledgesRef.current = buildWalkableLedges(snap);
        }
      } else {
        const snap = createBrowserFallbackSnapshot();
        snap.cursorX = lastCursorRef.current.x;
        snap.cursorY = lastCursorRef.current.y;
        snapshotRef.current = snap;
        ledgesRef.current = buildWalkableLedges(snap);
      }
      if (cancelled) return;

      reportProgress(60, 'Loading companion...');
      let raw: string | null = null;
      if (isTauriEnv()) {
        raw = await invoke<string | null>('load_kitten_state').catch(() => null);
      } else {
        raw = localStorage.getItem('kitten_save_v1');
      }
      if (cancelled) return;

      let shouldOnboard = true;
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as KittenSaveState;
          if (parsed && parsed.version === 1) {
            const defaults = createInitialSaveState();
            const mergedAccessories = Array.from(
              new Set([...(parsed.unlockedAccessories ?? []), ...defaults.unlockedAccessories]),
            );
            const completed = parsed.onboardingCompleted !== false;
            shouldOnboard = !completed;
            const merged: KittenSaveState = {
              ...parsed,
              onboardingCompleted: completed,
              mementos: Array.isArray(parsed.mementos) ? parsed.mementos : [],
              starJarCount: typeof parsed.starJarCount === 'number' ? parsed.starJarCount : 0,
              savedNotes: Array.isArray(parsed.savedNotes) ? parsed.savedNotes : [],
              stats: { ...defaults.stats, ...parsed.stats },
              unlockedAccessories: mergedAccessories,
              settings: {
                ...defaults.settings,
                ...parsed.settings,
                userName: parsed.settings?.userName?.trim() || defaults.settings.userName,
              },
            };
            setSave(merged);
            saveRef.current = merged;
            kittenAudio.enabled = merged.settings.soundEnabled;
            kittenAudio.volume = merged.settings.volume;
            kittenAudio.style = merged.settings.soundStyle ?? 'chiptune';
            kittenAudio.setStage(merged.stage);
          }
        } catch {
          // Ignore corrupt save
        }
      }

      if (!cancelled) {
        reportProgress(88, 'Preparing pixel playground...');
        const snap = snapshotRef.current;
        const primary = snap.monitors.find((m) => m.isPrimary) ?? snap.monitors[0];
        if (primary) {
          const dims = getStageDimensions(saveRef.current.stage, saveRef.current.settings.spriteScale);
          catRef.current.x = primary.workX + Math.round(primary.workWidth * 0.45);
          catRef.current.y = primary.workY + primary.workHeight - dims.height;
          catRef.current.grounded = true;
        }

        publishBridgeState(saveRef.current, focusRef.current);
        if (shouldOnboard) {
          setPhase('letterpad');
        } else {
          setPhase('done');
          triggerGreeting(catRef.current, saveRef.current, particlesRef.current);
        }
        if (isTauriEnv()) {
          void invoke('finish_loading').catch(() => {});
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [publishBridgeState, setPhase]);

  // Sync focus countdown/state to the separate HUD window
  useEffect(() => {
    publishBridgeState(saveRef.current, focus);
  }, [focus, publishBridgeState]);

  // Listen for Tauri Tray actions, HUD actions, & Cursor-Hold Escape
  useEffect(() => {
    if (!isTauriEnv()) return;
    let unlistenTray: (() => void) | undefined;
    let unlistenEscape: (() => void) | undefined;
    let unlistenHudOpened: (() => void) | undefined;
    let unlistenHudClosed: (() => void) | undefined;
    let unlistenHudAction: (() => void) | undefined;

    void listen<string>('kitten://tray-action', (event) => {
      if (onboardingPhaseRef.current !== 'done' && event.payload !== 'toggle_hud') {
        return;
      }
      switch (event.payload) {
        case 'toggle_hud':
          toggleHud();
          break;
        case 'toss_yarn':
          tossToy('yarn');
          break;
        case 'toss_fish':
          tossToy('fish');
          break;
        case 'toss_macaron':
          tossToy('macaron');
          break;
        case 'toss_boba':
          tossToy('boba');
          break;
        case 'toss_cake':
          tossToy('cake');
          break;
        case 'poke_kitten':
          pokeCat();
          break;
        case 'toggle_tease_yarn':
          toggleTeaseYarn();
          break;
        case 'toggle_feather_wand':
          toggleFeatherWand();
          break;
        case 'toggle_cushion':
          toggleCushion();
          break;
        case 'clear_yarn':
          clearYarn();
          break;
        case 'toggle_focus':
          toggleFocus();
          break;
      }
    }).then((fn) => {
      unlistenTray = fn;
    });

    void listen('kitten://hud-opened', () => {
      hudOpenRef.current = true;
      publishBridgeState(saveRef.current, focusRef.current);
    }).then((fn) => {
      unlistenHudOpened = fn;
    });

    void listen('kitten://hud-closed', () => {
      hudOpenRef.current = false;
    }).then((fn) => {
      unlistenHudClosed = fn;
    });

    void listen<string>('kitten://hud-action', (event) => {
      try {
        const action = JSON.parse(event.payload) as HudAction;
        switch (action.type) {
          case 'rename':
            commitSave((d) => {
              d.name = action.name.slice(0, 14);
            }, true);
            break;
          case 'selectCoat':
            commitSave((d) => {
              d.coat = action.coat;
            }, true);
            break;
          case 'equipAccessory':
            commitSave((d) => {
              d.equippedAccessory = action.accessory;
            }, true);
            break;
          case 'tossToy':
            tossToy(action.kind);
            break;
          case 'pokeKitten':
            pokeCat();
            break;
          case 'toggleTeaseYarn':
            toggleTeaseYarn();
            break;
          case 'toggleFeatherWand':
            toggleFeatherWand();
            break;
          case 'toggleCushion':
            toggleCushion();
            break;
          case 'toggleLaser':
            toggleLaser();
            break;
          case 'togglePlant':
            togglePlant();
            break;
          case 'toggleBrush':
            toggleBrush();
            break;
          case 'toggleGiftBox':
            toggleGiftBox();
            break;
          case 'spawnBubbles':
            spawnBubbles();
            break;
          case 'doTrick':
            doTrick();
            break;
          case 'clearYarn':
            clearYarn();
            break;
          case 'toggleFocus':
            toggleFocus();
            break;
          case 'snapMemory': {
            snapPolaroidMemory();
            break;
          }
          case 'deleteMemory': {
            commitSave((d) => {
              removePolaroidMemory(d, action.id);
            }, true);
            break;
          }
          case 'deleteSavedNote': {
            commitSave((d) => {
              deleteSavedNote(d, action.id);
            }, true);
            break;
          }
          case 'updateSettings': {
            if (typeof action.patch.spriteScale === 'number' && catRef.current.grounded) {
              const oldDims = getStageDimensions(saveRef.current.stage, saveRef.current.settings.spriteScale);
              const newDims = getStageDimensions(saveRef.current.stage, action.patch.spriteScale);
              catRef.current.y += oldDims.height - newDims.height;
            }
            commitSave((d) => {
              d.settings = { ...d.settings, ...action.patch };
            }, true);
            break;
          }
          case 'replayIntro': {
            toysRef.current = [];
            particlesRef.current = [];
            butterfliesRef.current = [];
            bubblesRef.current = [];
            teaseYarnActiveRef.current = false;
            laserActiveRef.current = false;
            brushActiveRef.current = false;
            quickWheelRef.current.active = false;
            featherWandRef.current.active = false;
            cushionRef.current.active = false;
            plantRef.current.active = false;
            giftBoxRef.current.active = false;
            giftBoxRef.current.occupied = false;
            loveNoteRef.current.active = false;
            smokeTimerRef.current = 0;
            hatchElapsedRef.current = 0;
            hatchCrackStageRef.current = 0;
            setPhase('letterpad');
            break;
          }
          case 'reset': {
            const fresh = createInitialSaveState(saveRef.current.coat, saveRef.current.name, false);
            toysRef.current = [];
            particlesRef.current = [];
            butterfliesRef.current = [];
            bubblesRef.current = [];
            teaseYarnActiveRef.current = false;
            laserActiveRef.current = false;
            brushActiveRef.current = false;
            quickWheelRef.current.active = false;
            featherWandRef.current.active = false;
            cushionRef.current.active = false;
            plantRef.current.active = false;
            giftBoxRef.current.active = false;
            giftBoxRef.current.occupied = false;
            loveNoteRef.current.active = false;
            smokeTimerRef.current = 0;
            hatchElapsedRef.current = 0;
            hatchCrackStageRef.current = 0;
            setSave(fresh);
            saveRef.current = fresh;
            kittenAudio.enabled = fresh.settings.soundEnabled;
            kittenAudio.volume = fresh.settings.volume;
            kittenAudio.style = fresh.settings.soundStyle ?? 'chiptune';
            kittenAudio.setStage(fresh.stage);
            void persistNow(fresh);
            publishBridgeState(fresh, focusRef.current);
            setPhase('letterpad');
            break;
          }
        }
      } catch {
        // Ignore malformed HUD action
      }
    }).then((fn) => {
      unlistenHudAction = fn;
    });

    void listen('kitten://cursor-hold-escaped', () => {
      const cat = catRef.current;
      if (cat.state === 'hold_cursor') {
        cat.state = 'sit';
        cat.stateTimer = 1.4;
        cat.holdCooldown = 14;
        holdSentActiveRef.current = false;
      }
    }).then((fn) => {
      unlistenEscape = fn;
    });

    return () => {
      unlistenTray?.();
      unlistenEscape?.();
      unlistenHudOpened?.();
      unlistenHudClosed?.();
      unlistenHudAction?.();
    };
  }, [clearYarn, commitSave, persistNow, pokeCat, publishBridgeState, setPhase, toggleCushion, toggleFeatherWand, toggleFocus, toggleHud, toggleLaser, togglePlant, toggleTeaseYarn, tossToy]);

  // Poll Win32 Desktop Snapshot (adaptive 120ms-320ms) & Periodic Save
  useEffect(() => {
    let cancelled = false;
    let snapTimerId = 0;

    const pollSnapshot = async () => {
      if (cancelled) return;
      if (isTauriEnv()) {
        const snap = await invoke<DesktopSnapshot>('get_desktop_snapshot').catch(() => null);
        if (snap && !cancelled) {
          snapshotRef.current = snap;
          ledgesRef.current = buildWalkableLedges(snap);
        }
      } else {
        const snap = createBrowserFallbackSnapshot();
        snap.cursorX = lastCursorRef.current.x;
        snap.cursorY = lastCursorRef.current.y;
        snapshotRef.current = snap;
        ledgesRef.current = buildWalkableLedges(snap);
      }
      if (!cancelled) {
        const st = catRef.current.state;
        const fastCursor =
          teaseYarnActiveRef.current ||
          dragStateRef.current.dragging ||
          st === 'stalk' ||
          st === 'pounce' ||
          st === 'hold_cursor';
        const calmSleep =
          !fastCursor &&
          toysRef.current.length === 0 &&
          (st === 'sleep' || st === 'loaf' || st === 'cuddle_yarn');
        snapTimerId = window.setTimeout(
          () => void pollSnapshot(),
          fastCursor ? 120 : calmSleep ? 600 : 320,
        );
      }
    };

    snapTimerId = window.setTimeout(() => void pollSnapshot(), 320);
    const saveTimer = window.setInterval(() => {
      if (saveDirtyRef.current) {
        void persistNow(saveRef.current);
      }
    }, 15000);
    const boundsTimer = window.setInterval(() => {
      if (isTauriEnv()) {
        void invoke('sync_overlay_bounds').catch(() => {});
      }
    }, 10000);

    return () => {
      cancelled = true;
      clearTimeout(snapTimerId);
      clearInterval(saveTimer);
      clearInterval(boundsTimer);
    };
  }, [persistNow]);

  // Hit-rect sync to Rust (deduplicated, ~22 Hz) for seamless click-through
  useEffect(() => {
    if (!isTauriEnv()) return;
    let lastHitKey = '';
    const syncHits = window.setInterval(() => {
      const phase = onboardingPhaseRef.current;
      const rects: HitRect[] = [];

      if (phase === 'letterpad') {
        const r = getLetterpadRect(getPrimaryMonitor());
        rects.push({ x: r.x - 10, y: r.y - 10, width: r.width + 20, height: r.height + 20 });
      } else if (phase === 'egg_basket') {
        const layout = getEggSceneLayout(getPrimaryMonitor());
        rects.push({
          x: layout.hitRect.x - 10,
          y: layout.hitRect.y - 10,
          width: layout.hitRect.width + 20,
          height: layout.hitRect.height + 20,
        });
      } else if (phase === 'naming') {
        if (nameTagHitRectRef.current) {
          rects.push(nameTagHitRectRef.current);
        }
        const cat = catRef.current;
        const dims = getStageDimensions(saveRef.current.stage, saveRef.current.settings.spriteScale);
        rects.push({
          x: cat.x - 10,
          y: cat.y - 10,
          width: dims.width + 20,
          height: dims.height + 20,
        });
      } else if (phase === 'done') {
        const cat = catRef.current;
        const dims = getStageDimensions(saveRef.current.stage, saveRef.current.settings.spriteScale);
        rects.push({
          x: cat.x - 10,
          y: cat.y - 10,
          width: dims.width + 20,
          height: dims.height + 20,
        });

        for (const toy of toysRef.current) {
          rects.push({
            x: toy.x - toy.radius - 8,
            y: toy.y - toy.radius - 8,
            width: toy.radius * 2 + 16,
            height: toy.radius * 2 + 16,
          });
        }

        if (cushionRef.current.active) {
          rects.push({
            x: cushionRef.current.x - 42,
            y: cushionRef.current.y - 28,
            width: 84,
            height: 36,
          });
        }

        if (plantRef.current.active) {
          rects.push({
            x: plantRef.current.x - 24,
            y: plantRef.current.y - 38,
            width: 48,
            height: 42,
          });
        }

        if (featherWandRef.current.active) {
          rects.push({
            x: featherWandRef.current.x - 32,
            y: featherWandRef.current.y - 36,
            width: 64,
            height: 66,
          });
        }

        if (giftBoxRef.current.active) {
          rects.push({
            x: giftBoxRef.current.x - 26,
            y: giftBoxRef.current.y - 36,
            width: 52,
            height: 42,
          });
        }

        for (const bubble of bubblesRef.current) {
          const pad = bubble.radius + 8;
          rects.push({
            x: bubble.x - pad,
            y: bubble.y - pad,
            width: pad * 2,
            height: pad * 2,
          });
        }

        if (quickWheelRef.current.active) {
          const qw = quickWheelRef.current;
          const mon = findMonitorForPoint(snapshotRef.current.monitors, qw.x, qw.y);
          const bounds = mon
            ? { x: mon.workX, y: mon.workY, width: mon.workWidth, height: mon.workHeight }
            : { x: 0, y: 0, width: snapshotRef.current.virtualWidth, height: snapshotRef.current.virtualHeight };
          for (const btn of getQuickWheelLayout(qw, bounds)) {
            rects.push({
              x: btn.x - 4,
              y: btn.y - 4,
              width: btn.width + 8,
              height: btn.height + 8,
            });
          }
        }

        if (loveNoteRef.current.active) {
          const note = loveNoteRef.current;
          if (note.opened) {
            rects.push({
              x: note.x - 115,
              y: note.y - 102,
              width: 230,
              height: 100,
            });
          } else {
            rects.push({
              x: note.x - 24,
              y: note.y - 26,
              width: 48,
              height: 44,
            });
          }
        }
      }

      const pointerLocked =
        dragStateRef.current.dragging ||
        toyDragRef.current.dragging ||
        cushionDragRef.current.dragging ||
        plantDragRef.current.dragging ||
        giftBoxDragRef.current.dragging ||
        featherWandDragRef.current.dragging;

      let key = pointerLocked ? '1|' : '0|';
      for (let i = 0; i < rects.length; i++) {
        const r = rects[i];
        r.x = Math.round(r.x);
        r.y = Math.round(r.y);
        r.width = Math.round(r.width);
        r.height = Math.round(r.height);
        key += `${r.x},${r.y},${r.width},${r.height};`;
      }
      if (key === lastHitKey) {
        return;
      }
      lastHitKey = key;

      void invoke('update_hit_rects', {
        rects,
        pointerLocked,
      }).catch(() => {});
    }, 45);

    return () => clearInterval(syncHits);
  }, [getPrimaryMonitor]);

  // Focus timer countdown
  useEffect(() => {
    if (!focus.active) return;
    const timer = window.setInterval(() => {
      setFocus((prev) => {
        if (!prev.active) return prev;
        if (prev.remainingSeconds <= 1) {
          kittenAudio.playFocusDone();
          catRef.current.state = 'celebrate';
          catRef.current.stateTimer = 3.5;
          catRef.current.statusBubble = 'Focus Done!';
          catRef.current.statusBubbleTimer = 3.5;

          commitSave((draft) => {
            draft.stats.focusSessionsCompleted += 1;
            draft.starJarCount = (draft.starJarCount ?? 0) + 1;
            draft.bond = Math.min(100, draft.bond + 15);
            pushTimelineEntry(draft, {
              kind: 'focus',
              title: `Completed ${draft.settings.focusMinutes}m Focus Nap`,
              detail: `${draft.name} kept you company & folded a Lucky Star.`,
            });
            applyXpAndEvaluate(draft, 40);
          }, true);

          return { ...prev, active: false, remainingSeconds: 0 };
        }
        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [commitSave, focus.active]);

  // Adaptive Simulation & Render Loop (scales from ~6.7 FPS idle to ~30-60 FPS interactive, skipping redundant canvas draws)
  useEffect(() => {
    let raf = 0;
    let timer = 0;
    let disposed = false;
    let lastTs = performance.now();
    let lastDrawTs = 0;
    let uiSyncAccum = 0;
    let lastVisualSig = '';
    let lastSaveFingerprint = '';
    let cachedCtx: CanvasRenderingContext2D | null = null;
    let cachedCanvas: HTMLCanvasElement | null = null;

    const getLoopDelayMs = (): number => {
      const phase = onboardingPhaseRef.current;
      if (
        dragStateRef.current.dragging ||
        toyDragRef.current.dragging ||
        cushionDragRef.current.dragging ||
        plantDragRef.current.dragging ||
        featherWandDragRef.current.dragging
      ) {
        return 16;
      }
      if (
        phase === 'smoke_reveal' ||
        phase === 'egg_hatching' ||
        teaseYarnActiveRef.current ||
        laserActiveRef.current ||
        brushActiveRef.current ||
        quickWheelRef.current.active ||
        butterfliesRef.current.length > 0 ||
        bubblesRef.current.length > 0 ||
        toysRef.current.some((t) => !t.settled) ||
        (featherWandRef.current.active && !featherWandRef.current.grounded) ||
        (cushionRef.current.active && !cushionRef.current.grounded) ||
        (plantRef.current.active && (!plantRef.current.grounded || plantRef.current.swayTimer > 0)) ||
        (giftBoxRef.current.active &&
          (!giftBoxRef.current.grounded || giftBoxRef.current.wiggleTimer > 0 || giftBoxRef.current.occupied))
      ) {
        return 33;
      }
      const cat = catRef.current;
      if (
        !cat.grounded ||
        cat.state === 'jump' ||
        cat.state === 'fall' ||
        cat.state === 'pounce' ||
        cat.state === 'run' ||
        cat.state === 'zoomies' ||
        cat.state === 'trick_spin' ||
        cat.state === 'trick_highfive' ||
        cat.state === 'trick_flip'
      ) {
        return 33;
      }
      if (
        cat.state === 'walk' ||
        cat.state === 'stalk' ||
        cat.state === 'reach_yarn' ||
        cat.state === 'celebrate' ||
        cat.state === 'poked' ||
        cat.state === 'eat' ||
        cat.state === 'roll_wiggle' ||
        cat.state === 'box_hide' ||
        cat.state === 'peek' ||
        particlesRef.current.length > 0 ||
        loveNoteRef.current.active
      ) {
        return 55;
      }
      return 150;
    };

    const scheduleNext = (delayMs: number) => {
      if (disposed) return;
      if (delayMs <= 34) {
        raf = requestAnimationFrame(onRaf);
      } else {
        timer = window.setTimeout(runTick, delayMs);
      }
    };

    const onRaf = (ts: number) => {
      raf = 0;
      const delayMs = getLoopDelayMs();
      if (delayMs > 20 && ts - lastDrawTs < delayMs - 4) {
        scheduleNext(delayMs);
        return;
      }
      runTick();
    };

    const runTick = () => {
      timer = 0;
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min(0.2, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;
      lastDrawTs = now;

      const canvas = canvasRef.current;
      const snap = snapshotRef.current;
      const ledges = ledgesRef.current;

      if (canvas) {
        // Use 1x logical CSS resolution; pixel-art sprites stay crisp via image-rendering: pixelated
        const targetW = Math.max(1, Math.round(canvas.clientWidth));
        const targetH = Math.max(1, Math.round(canvas.clientHeight));
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
          lastVisualSig = '';
        }

        const scaleX = targetW / Math.max(1, snap.virtualWidth);
        const scaleY = targetH / Math.max(1, snap.virtualHeight);
        const workingSave = saveRef.current;
        const phase = onboardingPhaseRef.current;
        onboardingAnimRef.current += dt;
        const primaryMonitor = snap.monitors.find((m) => m.isPrimary) ?? snap.monitors[0];

        if (phase === 'smoke_reveal') {
          smokeTimerRef.current += dt;
          if (smokeTimerRef.current >= 0.72) {
            setPhase('egg_basket');
          }
        } else if (phase === 'egg_hatching') {
          hatchElapsedRef.current += dt;
          const t = hatchElapsedRef.current;
          const layout = getEggSceneLayout(primaryMonitor);
          const nextCrackStage =
            t >= 3.8 ? 4 : t >= 2.5 ? 3 : t >= 1.25 ? 2 : t >= 0.12 ? 1 : 0;

          if (nextCrackStage > hatchCrackStageRef.current) {
            hatchCrackStageRef.current = nextCrackStage;
            kittenAudio.playEggCrack(nextCrackStage as 1 | 2 | 3 | 4);
            spawnEggChips(layout.eggCenterX, layout.eggCenterY, nextCrackStage + 2);
          }

          if (t >= 5.0) {
            const dims = getStageDimensions(workingSave.stage, workingSave.settings.spriteScale);
            catRef.current.x = Math.round(layout.anchorX - dims.width / 2);
            catRef.current.y = Math.round(layout.anchorY - dims.height);
            catRef.current.vx = 0;
            catRef.current.vy = 0;
            catRef.current.grounded = true;
            catRef.current.perchedHwnd = null;
            catRef.current.state = 'celebrate';
            catRef.current.stateTimer = 3.2;
            catRef.current.blushTimer = 4.0;
            catRef.current.statusBubble = null;
            catRef.current.statusBubbleTimer = 0;

            spawnHatchExplosion(layout.anchorX, layout.anchorY - 46);
            kittenAudio.setStage(workingSave.stage);
            kittenAudio.playHatchFanfare();
            kittenAudio.playMew(true);
            setPhase('naming');
          }
        } else if (phase === 'naming') {
          catRef.current.animTime += dt;
          catRef.current.blushTimer = Math.max(0.5, catRef.current.blushTimer);
          catRef.current.state = 'celebrate';
        } else if (phase === 'done') {
          // Keep hands-free teased yarn dangling right under the desktop cursor
          if (teaseYarnActiveRef.current) {
            const teased = toysRef.current.find((t) => t.heldBy === 'tease');
            if (teased) {
              const targetX = snap.cursorX;
              const targetY = snap.cursorY + 28;
              teased.x += (targetX - teased.x) * Math.min(1, dt * 18);
              teased.y += (targetY - teased.y) * Math.min(1, dt * 18);
              teased.rotation += (targetX - teased.x) * 0.015;
            }
          }

          // Feather Ribbon Wand physics & 10s no-interaction auto-removal
          const wand = featherWandRef.current;
          if (wand.active) {
            stepFeatherWandPhysics(wand, ledges, snap.monitors, dt);
            if (!wand.heldByCursor) {
              wand.idleSeconds = (wand.idleSeconds ?? 0) + dt;
              if (wand.idleSeconds >= 10) {
                wand.active = false;
                featherWandDragRef.current.dragging = false;
                spawnYarnVanishParticles(particlesRef.current, wand.x, wand.y, '#c8a6f7');
                if (hudOpenRef.current) {
                  publishBridgeRef.current(workingSave, focusRef.current);
                }
              }
            }
          }

          // Random Pastel Butterfly / Night Firefly auto-spawner at 1.5x kitten height
          butterflySpawnTimerRef.current -= dt;
          if (butterflySpawnTimerRef.current <= 0) {
            butterflySpawnTimerRef.current = 35 + Math.random() * 55;
            if (butterfliesRef.current.length < 2 && snap.monitors.length > 0) {
              const catDims = getStageDimensions(workingSave.stage, workingSave.settings.spriteScale);
              const catBottomY = catRef.current.y + catDims.height;
              const catCenterX = catRef.current.x + catDims.width / 2;
              const mon = findMonitorForPoint(snap.monitors, catCenterX, catBottomY) ?? getPrimaryMonitor();
              if (mon) {
                const hour = new Date().getHours();
                const isFirefly = hour >= 23 || hour < 5;
                const fromLeft = Math.random() < 0.5;
                const colors = isFirefly
                  ? ['#fde68a', '#fef08a']
                  : ['#d8b4fe', '#f5d0fe', '#fbcfe8', '#e9d5ff'];
                const flightY = Math.max(
                  mon.workY + 24,
                  Math.min(mon.workY + mon.workHeight - 28, catBottomY - catDims.height * 1.5),
                );
                const spawnX = Math.max(
                  mon.workX + 24,
                  Math.min(mon.workX + mon.workWidth - 24, catCenterX + (fromLeft ? -210 : 210)),
                );
                butterfliesRef.current.push({
                  id: `fly-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  kind: isFirefly ? 'firefly' : 'butterfly',
                  x: spawnX,
                  y: flightY,
                  baseY: flightY,
                  vx: (spawnX <= catCenterX ? 1 : -1) * (46 + Math.random() * 20),
                  vy: 0,
                  phase: Math.random() * Math.PI * 2,
                  color: colors[Math.floor(Math.random() * colors.length)],
                  life: 0,
                  maxLife: 18 + Math.random() * 12,
                });
              }
            }
          }

          // Physics for toys, butterflies & lavender cushion
          if (toysRef.current.length > 0) {
            stepToysPhysics(toysRef.current, ledges, snap.windows, snap.monitors, dt);
          }
          if (butterfliesRef.current.length > 0) {
            stepButterflies(butterfliesRef.current, snap.monitors, dt);
          }
          if (bubblesRef.current.length > 0) {
            stepBubbles(bubblesRef.current, snap.monitors, dt);
          }
          if (cushionRef.current.active) {
            stepCushionPhysics(
              cushionRef.current,
              ledges,
              snap.monitors,
              dt,
              cushionDragRef.current.dragging,
            );
          }
          if (plantRef.current.active) {
            stepPlantPhysics(
              plantRef.current,
              ledges,
              snap.monitors,
              dt,
              plantDragRef.current.dragging,
            );
          }
          if (giftBoxRef.current.active) {
            stepGiftBoxPhysics(
              giftBoxRef.current,
              ledges,
              snap.monitors,
              dt,
              giftBoxDragRef.current.dragging,
            );
          }

          // Gentle Sweet Care Whispers & "Akii's Love Note" envelope delivery
          if (workingSave.settings.careWhispersEnabled !== false) {
            careWhisperTimerRef.current -= dt;
            if (careWhisperTimerRef.current <= 0) {
              careWhisperTimerRef.current = 120 + Math.random() * 120;
              if (!focusRef.current.active && !catRef.current.statusBubble) {
                catRef.current.statusBubble = pickCareWhisper(
                  workingSave.settings.userName ?? 'Jane',
                  new Date().getHours(),
                );
                catRef.current.statusBubbleTimer = 3.4;
              }
            }

            if (!loveNoteRef.current.active) {
              loveNoteScheduleRef.current -= dt;
              if (loveNoteScheduleRef.current <= 0) {
                loveNoteScheduleRef.current = 300 + Math.random() * 240;
                if (!focusRef.current.active) {
                  const catDims = getStageDimensions(workingSave.stage, workingSave.settings.spriteScale);
                  const mon = getPrimaryMonitor();
                  let nx = catRef.current.x + catDims.width + 26;
                  let ny = catRef.current.y + catDims.height - 20;
                  if (mon) {
                    nx = Math.max(mon.workX + 125, Math.min(mon.workX + mon.workWidth - 125, nx));
                    ny = Math.max(mon.workY + 115, Math.min(mon.workY + mon.workHeight - 24, ny));
                  }
                  loveNoteRef.current = {
                    active: true,
                    x: nx,
                    y: ny,
                    text: pickLoveNoteText(workingSave.settings.userName ?? 'Jane'),
                    opened: false,
                    timer: 38,
                  };
                  catRef.current.statusBubble = 'Special mail! 💌';
                  catRef.current.statusBubbleTimer = 2.6;
                  kittenAudio.playBellJingle();
                }
              }
            }
          }

          if (loveNoteRef.current.active) {
            loveNoteRef.current.timer -= dt;
            if (loveNoteRef.current.timer <= 0) {
              loveNoteRef.current.active = false;
            }
          }

          // Determine if user is actively busy typing/moving mouse fast
          const isBusyUser = snap.idleMs < 650;

          // Substep AI cleanly in <= 0.05s slices so calm tick rates match 60 FPS behavior
          let remainingAiDt = dt;
          let stepOut: ReturnType<typeof stepCatAI> = { holdCursorTarget: null };
          while (remainingAiDt > 0.0001) {
            const subDt = Math.min(0.05, remainingAiDt);
            remainingAiDt -= subDt;
            const res = stepCatAI({
              dt: subDt,
              cat: catRef.current,
              save: workingSave,
              snapshot: snap,
              ledges,
              toys: toysRef.current,
              particles: particlesRef.current,
              focus: focusRef.current,
              isBusyUser,
              isDraggingCat: dragStateRef.current.dragging,
              butterflies: butterfliesRef.current,
              bubbles: bubblesRef.current,
              cushion: cushionRef.current,
              featherWand: featherWandRef.current,
              plant: plantRef.current,
              giftBox: giftBoxRef.current,
              laserActive: laserActiveRef.current,
              popComboRef: bubbleComboRef.current,
            });
            if (res.holdCursorTarget) stepOut.holdCursorTarget = res.holdCursorTarget;
            if (res.evolvedLabel) stepOut.evolvedLabel = res.evolvedLabel;
            if (res.achievementBanner) stepOut.achievementBanner = res.achievementBanner;
            if (res.mementoBanner) stepOut.mementoBanner = res.mementoBanner;
          }

          // Handle Real Cursor Tug IPC only when state changes or active
          if (isTauriEnv() && workingSave.settings.cursorHoldMode === 'real_tug') {
            if (stepOut.holdCursorTarget?.active) {
              holdSentActiveRef.current = true;
              void invoke('set_cursor_hold', {
                req: stepOut.holdCursorTarget,
              }).catch(() => {});
            } else if (holdSentActiveRef.current) {
              holdSentActiveRef.current = false;
              void invoke('set_cursor_hold', {
                req: { active: false, x: 0, y: 0 },
              }).catch(() => {});
            }
          } else if (holdSentActiveRef.current && isTauriEnv()) {
            holdSentActiveRef.current = false;
            void invoke('set_cursor_hold', {
              req: { active: false, x: 0, y: 0 },
            }).catch(() => {});
          }

          if (stepOut.evolvedLabel) {
            kittenAudio.playUnlock();
            catRef.current.statusBubble = `Grew: ${STAGE_THRESHOLDS[stepOut.evolvedLabel as keyof typeof STAGE_THRESHOLDS]?.label ?? stepOut.evolvedLabel}!`;
            catRef.current.statusBubbleTimer = 4.0;
            saveDirtyRef.current = true;
          }
          if (stepOut.achievementBanner) {
            kittenAudio.playUnlock();
            catRef.current.statusBubble = `Badge: ${stepOut.achievementBanner}`;
            catRef.current.statusBubbleTimer = 3.5;
            saveDirtyRef.current = true;
          } else if (stepOut.mementoBanner) {
            kittenAudio.playUnlock();
            catRef.current.statusBubble = `Gift: ${stepOut.mementoBanner}!`;
            catRef.current.statusBubbleTimer = 3.5;
            saveDirtyRef.current = true;
          }

          uiSyncAccum += dt;
          if (uiSyncAccum >= 0.5) {
            uiSyncAccum = 0;
            if (hudOpenRef.current) {
              publishBridgeRef.current(workingSave, focusRef.current);
            }
            if (stepOut.evolvedLabel || stepOut.achievementBanner || stepOut.mementoBanner) {
              setSave({ ...workingSave });
            }
            const fp = `${workingSave.xp}|${workingSave.bond}|${workingSave.energy}|${workingSave.treats}|${Math.round(workingSave.stats.distancePx)}`;
            if (fp !== lastSaveFingerprint) {
              lastSaveFingerprint = fp;
              saveDirtyRef.current = true;
            }
          }
        }

        const cat = catRef.current;
        const hasParticles = particlesRef.current.length > 0;
        let visualSig = '';
        if (
          !hasParticles &&
          phase !== 'smoke_reveal' &&
          phase !== 'egg_hatching' &&
          !teaseYarnActiveRef.current &&
          !laserActiveRef.current &&
          !brushActiveRef.current &&
          !quickWheelRef.current.active &&
          butterfliesRef.current.length === 0 &&
          bubblesRef.current.length === 0 &&
          !giftBoxRef.current.occupied &&
          giftBoxRef.current.wiggleTimer <= 0
        ) {
          const animBucket =
            cat.state === 'sleep' || cat.state === 'loaf' || cat.state === 'cuddle_yarn'
              ? Math.floor(cat.animTime * 2)
              : cat.state === 'sit' || cat.state === 'idle'
                ? `${Math.floor(cat.animTime * 3)}:${Math.floor(cat.animTime * 2) % 9 === 0 ? 1 : 0}`
                : cat.state === 'head_bob'
                  ? Math.floor(cat.animTime * 4.5)
                  : Math.floor(cat.animTime * 11);

          let extras = '';
          for (const t of toysRef.current) {
            extras += `${t.id}:${Math.round(t.x)},${Math.round(t.y)},${Math.round(t.rotation * 10)};`;
          }
          if (cushionRef.current.active) {
            extras += `c:${Math.round(cushionRef.current.x)},${Math.round(cushionRef.current.y)};`;
          }
          if (plantRef.current.active) {
            extras += `p:${Math.round(plantRef.current.x)},${Math.round(plantRef.current.y)},${plantRef.current.swayTimer > 0 ? Math.floor(cat.animTime * 12) : 0};`;
          }
          if (giftBoxRef.current.active) {
            extras += `gb:${Math.round(giftBoxRef.current.x)},${Math.round(giftBoxRef.current.y)};`;
          }
          if (featherWandRef.current.active) {
            extras += `w:${Math.round(featherWandRef.current.x)},${Math.round(featherWandRef.current.y)},${Math.floor(cat.animTime * 4)};`;
          }
          if (loveNoteRef.current.active) {
            extras += `n:${loveNoteRef.current.opened ? 1 : 0},${Math.floor(cat.animTime * 4)};`;
          }
          if (phase !== 'done') {
            extras += `o:${Math.floor(onboardingAnimRef.current * 6)},${onboardingHoverRef.current ? 1 : 0};`;
          }

          visualSig =
            `${phase}|${targetW}x${targetH}|${Math.round(cat.x)},${Math.round(cat.y)}|` +
            `${cat.state}|${cat.facing}|${cat.grounded ? 1 : 0}|${animBucket}|` +
            `${cat.blushTimer > 0 ? 1 : 0}|${cat.statusBubbleTimer > 0 ? cat.statusBubble ?? '' : ''}|` +
            `${workingSave.stage}|${workingSave.coat}|${workingSave.equippedAccessory}|${workingSave.settings.spriteScale}|` +
            `${focusRef.current.active ? focusRef.current.remainingSeconds : -1}|${extras}`;
        }

        if (visualSig === '' || visualSig !== lastVisualSig) {
          lastVisualSig = visualSig;
          if (cachedCanvas !== canvas) {
            cachedCanvas = canvas;
            cachedCtx = canvas.getContext('2d');
          }
          if (cachedCtx) {
            const qw = quickWheelRef.current;
            const qwMon = qw.active
              ? findMonitorForPoint(snap.monitors, qw.x, qw.y)
              : undefined;
            const wheelBounds = qwMon
              ? {
                  x: qwMon.workX,
                  y: qwMon.workY,
                  width: qwMon.workWidth,
                  height: qwMon.workHeight,
                }
              : { x: 0, y: 0, width: snap.virtualWidth, height: snap.virtualHeight };
            stepAndDrawOverlay({
              ctx: cachedCtx,
              width: targetW,
              height: targetH,
              scaleX,
              scaleY,
              dt,
              cat,
              save: workingSave,
              toys: toysRef.current,
              particles: particlesRef.current,
              focus: focusRef.current,
              isHudOpen: false,
              cursorX: snap.cursorX,
              cursorY: snap.cursorY,
              butterflies: butterfliesRef.current,
              bubbles: bubblesRef.current,
              cushion: cushionRef.current,
              featherWand: featherWandRef.current,
              plant: plantRef.current,
              giftBox: giftBoxRef.current,
              laserActive: laserActiveRef.current,
              brushActive: brushActiveRef.current,
              quickWheel: quickWheelRef.current,
              wheelBounds,
              loveNote: loveNoteRef.current,
              onboarding: {
                phase: onboardingPhaseRef.current,
                animTime: onboardingAnimRef.current,
                hatchElapsed: hatchElapsedRef.current,
                hovered: onboardingHoverRef.current,
                primaryMonitor,
              },
            });
          }
        }
      }

      scheduleNext(getLoopDelayMs());
    };

    wakeLoopRef.current = () => {
      if (disposed) return;
      if (timer) {
        clearTimeout(timer);
        timer = 0;
        raf = requestAnimationFrame(onRaf);
      }
    };

    scheduleNext(16);
    return () => {
      disposed = true;
      wakeLoopRef.current = null;
      if (raf) cancelAnimationFrame(raf);
      if (timer) clearTimeout(timer);
    };
  }, [getPrimaryMonitor, setPhase, spawnEggChips, spawnHatchExplosion]);

  // Mouse handlers on overlay canvas (petting, dragging, middle-click HUD!)
  const toVirtualCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    const snap = snapshotRef.current;
    const cw = canvas?.clientWidth || window.innerWidth;
    const ch = canvas?.clientHeight || window.innerHeight;
    return {
      vx: (clientX / Math.max(1, cw)) * snap.virtualWidth,
      vy: (clientY / Math.max(1, ch)) * snap.virtualHeight,
    };
  };

  const isPointOnCat = (vx: number, vy: number) => {
    const cat = catRef.current;
    const dims = getStageDimensions(saveRef.current.stage, saveRef.current.settings.spriteScale);
    return (
      vx >= cat.x - 10 &&
      vx <= cat.x + dims.width + 10 &&
      vy >= cat.y - 10 &&
      vy <= cat.y + dims.height + 10
    );
  };

  const isPointInRect = (vx: number, vy: number, r: { x: number; y: number; width: number; height: number }) =>
    vx >= r.x && vx <= r.x + r.width && vy >= r.y && vy <= r.y + r.height;

  const handleNameTagHitRectChange = useCallback((rect: HitRect | null) => {
    nameTagHitRectRef.current = rect;
  }, []);

  const handleConfirmOnboarding = useCallback(
    (chosenName: string, chosenCoat: CoatId, chosenAccessory: AccessoryId) => {
      commitSave((draft) => {
        const isFirstCompletion = draft.onboardingCompleted !== true;
        draft.name = chosenName;
        draft.coat = chosenCoat;
        draft.equippedAccessory = chosenAccessory;
        draft.onboardingCompleted = true;
        if (isFirstCompletion && draft.timeline.length <= 1) {
          const birthEntry = draft.timeline[0];
          if (birthEntry) {
            birthEntry.title = `${chosenName} hatched from Akii's dragon egg ♥`;
            birthEntry.detail =
              'Opened Akii’s gift letter, hatched a shimmering dragon egg, and arrived on your desktop.';
          }
        }
      }, true);
      setPhase('done');
      triggerGreeting(catRef.current, saveRef.current, particlesRef.current);
      const dims = getStageDimensions(saveRef.current.stage, saveRef.current.settings.spriteScale);
      const groundY = getGroundYAt(
        snapshotRef.current.monitors,
        catRef.current.x + dims.width / 2,
        catRef.current.y,
      );
      if (catRef.current.y + dims.height < groundY - 6) {
        catRef.current.grounded = false;
        catRef.current.state = 'fall';
        catRef.current.vy = 20;
      }
    },
    [commitSave, setPhase],
  );

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    wakeLoopRef.current?.();
    const { vx, vy } = toVirtualCoords(e.clientX, e.clientY);
    const phase = onboardingPhaseRef.current;

    if (phase === 'letterpad') {
      if (e.button === 0) {
        const rect = getLetterpadRect(getPrimaryMonitor());
        if (isPointInRect(vx, vy, rect)) {
          const layout = getEggSceneLayout(getPrimaryMonitor());
          kittenAudio.playPaperOpen();
          kittenAudio.playSmokePoof();
          spawnSmokeBurst(rect.x + rect.width / 2, rect.y + rect.height / 2, 18);
          spawnSmokeBurst(layout.eggCenterX, layout.eggCenterY, 20);
          smokeTimerRef.current = 0;
          setPhase('smoke_reveal');
        }
      }
      return;
    }

    if (phase === 'egg_basket') {
      if (e.button === 0) {
        const layout = getEggSceneLayout(getPrimaryMonitor());
        if (isPointInRect(vx, vy, layout.hitRect)) {
          spawnBasketDisappearPoof(layout.anchorX, layout.anchorY - 24);
          hatchElapsedRef.current = 0;
          hatchCrackStageRef.current = 0;
          setPhase('egg_hatching');
        }
      }
      return;
    }

    if (phase !== 'done') {
      return;
    }

    // Middle mouse button click on avatar -> toggle Progress HUD!
    if (e.button === 1) {
      e.preventDefault();
      if (isPointOnCat(vx, vy)) {
        toggleHud();
      }
      return;
    }

    // Left click: quick wheel, bubbles, gift box, open/fold love note, drag/poke cat, grab yarn / bat treat, or drag cushion
    if (e.button === 0) {
      if (quickWheelRef.current.active) {
        const qw = quickWheelRef.current;
        const snap = snapshotRef.current;
        const mon = findMonitorForPoint(snap.monitors, qw.x, qw.y);
        const bounds = mon
          ? { x: mon.workX, y: mon.workY, width: mon.workWidth, height: mon.workHeight }
          : { x: 0, y: 0, width: snap.virtualWidth, height: snap.virtualHeight };
        const clicked = getQuickWheelLayout(qw, bounds).find((b) => isPointInRect(vx, vy, b));
        qw.active = false;
        qw.hoveredId = null;
        if (clicked) {
          switch (clicked.id) {
            case 'treat':
              tossToy('ube_icecream');
              break;
            case 'laser':
              toggleLaser();
              break;
            case 'brush':
              toggleBrush();
              break;
            case 'trick':
              doTrick();
              break;
            case 'bubbles':
              spawnBubbles();
              break;
            case 'box':
              toggleGiftBox();
              break;
            case 'snap':
              snapPolaroidMemory();
              break;
            case 'hud':
              toggleHud();
              break;
          }
          return;
        }
      }

      for (const bubble of bubblesRef.current) {
        if (Math.hypot(vx - bubble.x, vy - bubble.y) <= bubble.radius + 10) {
          const { result: popRes } = popBubble(
            bubblesRef.current,
            bubble.id,
            saveRef.current,
            particlesRef.current,
            bubbleComboRef.current.count++,
            true,
          );
          if (popRes.achievementBanner) {
            kittenAudio.playUnlock();
            catRef.current.statusBubble = `Badge: ${popRes.achievementBanner}`;
            catRef.current.statusBubbleTimer = 3.5;
          } else if (popRes.mementoBanner) {
            kittenAudio.playUnlock();
            catRef.current.statusBubble = `Gift: ${popRes.mementoBanner}!`;
            catRef.current.statusBubbleTimer = 3.5;
          }
          commitSave(() => {}, false);
          return;
        }
      }

      if (
        giftBoxRef.current.active &&
        Math.abs(vx - giftBoxRef.current.x) <= 26 &&
        vy >= giftBoxRef.current.y - 36 &&
        vy <= giftBoxRef.current.y + 6
      ) {
        const gb = giftBoxRef.current;
        if (gb.occupied) {
          const ambushRes = triggerGiftBoxAmbush(
            catRef.current,
            saveRef.current,
            gb,
            vx,
            vy,
            particlesRef.current,
          );
          if (ambushRes.achievementBanner) {
            kittenAudio.playUnlock();
            catRef.current.statusBubble = `Badge: ${ambushRes.achievementBanner}`;
            catRef.current.statusBubbleTimer = 3.5;
          } else if (ambushRes.mementoBanner) {
            kittenAudio.playUnlock();
            catRef.current.statusBubble = `Gift: ${ambushRes.mementoBanner}!`;
            catRef.current.statusBubbleTimer = 3.5;
          }
          commitSave(() => {}, false);
          return;
        }
        giftBoxDragRef.current = {
          dragging: true,
          offsetX: vx - gb.x,
          offsetY: vy - gb.y,
          lastX: vx,
          lastY: vy,
          vx: 0,
          vy: 0,
        };
        gb.grounded = false;
        gb.vx = 0;
        gb.vy = 0;
        return;
      }

      if (loveNoteRef.current.active) {
        const note = loveNoteRef.current;
        const noteRect = note.opened
          ? { x: note.x - 115, y: note.y - 102, width: 230, height: 100 }
          : { x: note.x - 24, y: note.y - 26, width: 48, height: 44 };
        if (isPointInRect(vx, vy, noteRect)) {
          if (!note.opened) {
            note.opened = true;
            note.timer = 16;
            kittenAudio.playPaperOpen();
            kittenAudio.playMew(true);
            catRef.current.blushTimer = 3.0;
            commitSave((d) => {
              d.bond = Math.min(100, d.bond + 4);
              applyXpAndEvaluate(d, 10);
            });
            particlesRef.current.push({
              id: `note-heart-${Date.now()}`,
              kind: 'heart',
              x: note.x,
              y: note.y - 24,
              vx: 0,
              vy: -26,
              alpha: 1,
              life: 0,
              maxLife: 1.0,
            });
          } else {
            const saveBtnRect = getLoveNoteSaveRect(note);
            if (isPointInRect(vx, vy, saveBtnRect)) {
              if (!note.saved) {
                note.saved = true;
                note.timer = Math.max(note.timer, 8);
                kittenAudio.playCatch();
                commitSave((d) => {
                  saveLoveNote(d, note.text);
                }, true);
                catRef.current.statusBubble = 'Saved to Love Jar! 💜';
                catRef.current.statusBubbleTimer = 2.0;
                particlesRef.current.push({
                  id: `note-save-${Date.now()}`,
                  kind: 'heart',
                  x: saveBtnRect.x + saveBtnRect.width / 2,
                  y: saveBtnRect.y,
                  vx: 0,
                  vy: -24,
                  alpha: 1,
                  life: 0,
                  maxLife: 0.9,
                });
              }
              return;
            }
            note.active = false;
            particlesRef.current.push({
              id: `note-fold-${Date.now()}`,
              kind: 'sparkle',
              x: note.x,
              y: note.y - 30,
              vx: 0,
              vy: -20,
              alpha: 1,
              life: 0,
              maxLife: 0.7,
            });
          }
          return;
        }
      }

      if (isPointOnCat(vx, vy)) {
        dragStateRef.current = {
          dragging: true,
          offsetX: vx - catRef.current.x,
          offsetY: vy - catRef.current.y,
          moved: false,
          prevGrounded: catRef.current.grounded,
          prevPerchedHwnd: catRef.current.perchedHwnd,
          prevState: catRef.current.state,
        };
        return;
      }

      for (const toy of toysRef.current) {
        if (Math.hypot(vx - toy.x, vy - toy.y) <= toy.radius + 16) {
          if (toy.kind === 'yarn') {
            if (toy.heldBy === 'tease') {
              // Clicking a hands-free teased yarn drops it
              toggleTeaseYarn();
              return;
            }
            // Pick up & drag the yarn ball so the user can tease the kitten!
            toy.heldBy = 'drag';
            toy.settled = false;
            toy.vx = 0;
            toy.vy = 0;
            toyDragRef.current = {
              dragging: true,
              toyId: toy.id,
              lastX: vx,
              lastY: vy,
              vx: 0,
              vy: 0,
            };
            return;
          }
          toy.vx = (toy.x >= vx ? 1 : -1) * (200 + Math.random() * 100);
          toy.vy = -310;
          toy.settled = false;
          toy.bounces = 0;
          kittenAudio.playToyBat();
          return;
        }
      }

      if (
        featherWandRef.current.active &&
        vx >= featherWandRef.current.x - 32 &&
        vx <= featherWandRef.current.x + 32 &&
        vy >= featherWandRef.current.y - 36 &&
        vy <= featherWandRef.current.y + 30
      ) {
        const wand = featherWandRef.current;
        wand.heldByCursor = true;
        wand.grounded = false;
        wand.idleSeconds = 0;
        wand.vx = 0;
        wand.vy = 0;
        featherWandDragRef.current = {
          dragging: true,
          lastX: vx,
          lastY: vy,
          vx: 0,
          vy: 0,
        };
        kittenAudio.playBellJingle();
        return;
      }

      if (
        cushionRef.current.active &&
        Math.abs(vx - cushionRef.current.x) <= 42 &&
        vy >= cushionRef.current.y - 28 &&
        vy <= cushionRef.current.y + 10
      ) {
        cushionDragRef.current = {
          dragging: true,
          offsetX: vx - cushionRef.current.x,
          offsetY: vy - cushionRef.current.y,
          lastX: vx,
          lastY: vy,
          vx: 0,
          vy: 0,
        };
        cushionRef.current.grounded = false;
        cushionRef.current.vx = 0;
        cushionRef.current.vy = 0;
        return;
      }

      if (
        plantRef.current.active &&
        Math.abs(vx - plantRef.current.x) <= 24 &&
        vy >= plantRef.current.y - 38 &&
        vy <= plantRef.current.y + 6
      ) {
        plantDragRef.current = {
          dragging: true,
          offsetX: vx - plantRef.current.x,
          offsetY: vy - plantRef.current.y,
          lastX: vx,
          lastY: vy,
          vx: 0,
          vy: 0,
        };
        plantRef.current.grounded = false;
        plantRef.current.vx = 0;
        plantRef.current.vy = 0;
        return;
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { vx, vy } = toVirtualCoords(e.clientX, e.clientY);
    lastCursorRef.current = { x: vx, y: vy, activeAt: performance.now() };

    const phase = onboardingPhaseRef.current;
    if (phase === 'letterpad' || phase === 'egg_basket') {
      const targetRect =
        phase === 'letterpad'
          ? getLetterpadRect(getPrimaryMonitor())
          : getEggSceneLayout(getPrimaryMonitor()).hitRect;
      const isHover = isPointInRect(vx, vy, targetRect);
      if (isHover !== onboardingHoverRef.current) {
        onboardingHoverRef.current = isHover;
        setOnboardingHovered(isHover);
      }
      return;
    }
    if (phase !== 'done') {
      return;
    }

    if (quickWheelRef.current.active) {
      const qw = quickWheelRef.current;
      const snap = snapshotRef.current;
      const mon = findMonitorForPoint(snap.monitors, qw.x, qw.y);
      const bounds = mon
        ? { x: mon.workX, y: mon.workY, width: mon.workWidth, height: mon.workHeight }
        : { x: 0, y: 0, width: snap.virtualWidth, height: snap.virtualHeight };
      const hovered = getQuickWheelLayout(qw, bounds).find((b) => isPointInRect(vx, vy, b));
      qw.hoveredId = hovered ? hovered.id : null;
    }

    if (giftBoxDragRef.current.dragging) {
      giftBoxDragRef.current.vx = Math.max(-900, Math.min(900, (vx - giftBoxDragRef.current.lastX) * 45));
      giftBoxDragRef.current.vy = Math.max(-900, Math.min(900, (vy - giftBoxDragRef.current.lastY) * 45));
      giftBoxDragRef.current.lastX = vx;
      giftBoxDragRef.current.lastY = vy;
      giftBoxRef.current.x = vx - giftBoxDragRef.current.offsetX;
      giftBoxRef.current.y = vy - giftBoxDragRef.current.offsetY;
      giftBoxRef.current.vy = 0;
      giftBoxRef.current.grounded = false;
      return;
    }

    if (featherWandDragRef.current.dragging) {
      const wand = featherWandRef.current;
      if (wand.active && wand.heldByCursor) {
        featherWandDragRef.current.vx = Math.max(
          -900,
          Math.min(900, (vx - featherWandDragRef.current.lastX) * 45),
        );
        featherWandDragRef.current.vy = Math.max(
          -900,
          Math.min(900, (vy - featherWandDragRef.current.lastY) * 45),
        );
        featherWandDragRef.current.lastX = vx;
        featherWandDragRef.current.lastY = vy;
        wand.x = vx;
        wand.y = vy + 24;
        wand.idleSeconds = 0;
      } else {
        featherWandDragRef.current.dragging = false;
      }
      return;
    }

    if (cushionDragRef.current.dragging) {
      cushionDragRef.current.vx = Math.max(-900, Math.min(900, (vx - cushionDragRef.current.lastX) * 45));
      cushionDragRef.current.vy = Math.max(-900, Math.min(900, (vy - cushionDragRef.current.lastY) * 45));
      cushionDragRef.current.lastX = vx;
      cushionDragRef.current.lastY = vy;
      cushionRef.current.x = vx - cushionDragRef.current.offsetX;
      cushionRef.current.y = vy - cushionDragRef.current.offsetY;
      cushionRef.current.vy = 0;
      cushionRef.current.grounded = false;
      return;
    }

    if (plantDragRef.current.dragging) {
      plantDragRef.current.vx = Math.max(-900, Math.min(900, (vx - plantDragRef.current.lastX) * 45));
      plantDragRef.current.vy = Math.max(-900, Math.min(900, (vy - plantDragRef.current.lastY) * 45));
      plantDragRef.current.lastX = vx;
      plantDragRef.current.lastY = vy;
      plantRef.current.x = vx - plantDragRef.current.offsetX;
      plantRef.current.y = vy - plantDragRef.current.offsetY;
      plantRef.current.vy = 0;
      plantRef.current.grounded = false;
      return;
    }

    if (toyDragRef.current.dragging && toyDragRef.current.toyId) {
      const toy = toysRef.current.find((t) => t.id === toyDragRef.current.toyId);
      if (toy && toy.heldBy === 'drag') {
        toyDragRef.current.vx = Math.max(-900, Math.min(900, (vx - toyDragRef.current.lastX) * 45));
        toyDragRef.current.vy = Math.max(-900, Math.min(900, (vy - toyDragRef.current.lastY) * 45));
        toyDragRef.current.lastX = vx;
        toyDragRef.current.lastY = vy;
        toy.x = vx;
        toy.y = vy;
        toy.rotation += toyDragRef.current.vx * 0.0008;
      } else {
        toyDragRef.current.dragging = false;
        toyDragRef.current.toyId = null;
      }
      return;
    }

    if (dragStateRef.current.dragging) {
      const movedDist = Math.hypot(
        vx - dragStateRef.current.offsetX - catRef.current.x,
        vy - dragStateRef.current.offsetY - catRef.current.y,
      );
      if (dragStateRef.current.moved || movedDist > 5) {
        dragStateRef.current.moved = true;
        catRef.current.state = 'carried';
        catRef.current.grounded = false;
        catRef.current.perchedHwnd = null;
        catRef.current.x = vx - dragStateRef.current.offsetX;
        catRef.current.y = vy - dragStateRef.current.offsetY;
      }
      return;
    }

    // Gentle mouse rub over cat = petting + lavender sparkle trail!
    if (isPointOnCat(vx, vy) && catRef.current.grounded) {
      const cat = catRef.current;
      const delta = Math.abs(vx - cat.lastPetCursorX);
      cat.lastPetCursorX = vx;
      if (delta > 3 && delta < 45) {
        cat.petRubAccum += delta;
        if (Math.random() < 0.35 && particlesRef.current.length < 48) {
          particlesRef.current.push({
            id: `pet-trail-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            kind: Math.random() < 0.5 ? 'petal' : 'sparkle',
            x: vx + (Math.random() * 10 - 5),
            y: vy + (Math.random() * 8 - 4),
            vx: (Math.random() - 0.5) * 18,
            vy: -16 - Math.random() * 14,
            alpha: 1,
            life: 0,
            maxLife: 0.75,
            color: '#c8a6f7',
          });
        }
        if (cat.petRubAccum >= (brushActiveRef.current ? 34 : 48)) {
          cat.petRubAccum = 0;
          if (brushActiveRef.current) {
            const dims = getStageDimensions(saveRef.current.stage, saveRef.current.settings.spriteScale);
            const zone = vy >= cat.y + dims.height * 0.56 ? 'belly' : 'head';
            brushCat(cat, saveRef.current, particlesRef.current, zone);
            commitSave(() => {}, false);
          } else {
            cat.state = 'petted';
            cat.stateTimer = 1.4;
            cat.blushTimer = 2.0;
            cat.vx = 0;
            kittenAudio.playMew();
            kittenAudio.playPurr('happy');
            commitSave((draft) => {
              draft.stats.petsReceived += 1;
              draft.bond = Math.min(100, draft.bond + 3);
              applyXpAndEvaluate(draft, 8);
            });
          }
        }
      }
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0 && featherWandDragRef.current.dragging) {
      const wand = featherWandRef.current;
      wand.heldByCursor = false;
      wand.vx = featherWandDragRef.current.vx * 0.65;
      wand.vy = featherWandDragRef.current.vy * 0.65;
      wand.idleSeconds = 0;
      featherWandDragRef.current.dragging = false;
      return;
    }

    if (e.button === 0 && cushionDragRef.current.dragging) {
      cushionDragRef.current.dragging = false;
      cushionRef.current.vx = cushionDragRef.current.vx * 0.6;
      cushionRef.current.vy = cushionDragRef.current.vy * 0.6;
      return;
    }

    if (e.button === 0 && plantDragRef.current.dragging) {
      plantDragRef.current.dragging = false;
      plantRef.current.vx = plantDragRef.current.vx * 0.6;
      plantRef.current.vy = plantDragRef.current.vy * 0.6;
      return;
    }

    if (e.button === 0 && giftBoxDragRef.current.dragging) {
      giftBoxDragRef.current.dragging = false;
      giftBoxRef.current.vx = giftBoxDragRef.current.vx * 0.6;
      giftBoxDragRef.current.vy = giftBoxDragRef.current.vy * 0.6;
      return;
    }

    if (e.button === 0 && toyDragRef.current.dragging) {
      const toy = toysRef.current.find((t) => t.id === toyDragRef.current.toyId);
      if (toy && toy.heldBy === 'drag') {
        toy.heldBy = null;
        toy.vx = toyDragRef.current.vx * 0.7;
        toy.vy = toyDragRef.current.vy * 0.7;
        toy.bounces = 0;
      }
      toyDragRef.current.dragging = false;
      toyDragRef.current.toyId = null;
      return;
    }

    if (e.button === 0 && dragStateRef.current.dragging) {
      const wasMoved = dragStateRef.current.moved;
      const prevGrounded = dragStateRef.current.prevGrounded;
      const prevPerchedHwnd = dragStateRef.current.prevPerchedHwnd;
      dragStateRef.current.dragging = false;
      const cat = catRef.current;
      const dims = getStageDimensions(saveRef.current.stage, saveRef.current.settings.spriteScale);
      const groundY = getGroundYAt(snapshotRef.current.monitors, cat.x + dims.width / 2, cat.y);

      if (!wasMoved) {
        cat.grounded = prevGrounded || cat.y + dims.height >= groundY - 6;
        cat.perchedHwnd = prevPerchedHwnd;
        if (brushActiveRef.current) {
          const { vy } = toVirtualCoords(e.clientX, e.clientY);
          const zone = vy >= cat.y + dims.height * 0.56 ? 'belly' : 'head';
          brushCat(cat, saveRef.current, particlesRef.current, zone);
          commitSave(() => {}, false);
        } else if ((saveRef.current.settings.clickAction ?? 'poke') === 'poke') {
          pokeCat();
        } else {
          cat.state = 'petted';
          cat.stateTimer = 1.2;
          cat.blushTimer = 2.0;
          kittenAudio.playMew();
          kittenAudio.playPurr('happy');
          commitSave((draft) => {
            draft.stats.petsReceived += 1;
            draft.bond = Math.min(100, draft.bond + 2);
            applyXpAndEvaluate(draft, 5);
          });
        }
      } else {
        // Release in mid-air -> gravity drops cat onto window or taskbar!
        cat.grounded = false;
        cat.state = 'fall';
        cat.vy = 40;
        cat.vx = 0;
      }
    }
  };

  const dims = getStageDimensions(save.stage, save.settings.spriteScale);
  const snap = snapshotRef.current;
  const primaryMonitor = snap.monitors.find((m) => m.isPrimary) ?? snap.monitors[0];

  return (
    <main className="overlay-root">
      <canvas
        ref={canvasRef}
        className="overlay-canvas"
        style={{
          cursor:
            onboardingHovered && (onboardingPhase === 'letterpad' || onboardingPhase === 'egg_basket')
              ? 'pointer'
              : 'default',
        }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onDoubleClick={(e) => {
          if (onboardingPhaseRef.current !== 'done') return;
          const { vx, vy } = toVirtualCoords(e.clientX, e.clientY);
          if (isPointOnCat(vx, vy) && !giftBoxRef.current.occupied) {
            triggerCatZoomies(catRef.current, saveRef.current, particlesRef.current);
            commitSave(() => {}, false);
            wakeLoopRef.current?.();
          }
        }}
        onAuxClick={(e) => {
          if (e.button === 1) e.preventDefault();
        }}
        onContextMenu={(e) => {
          if (onboardingPhaseRef.current !== 'done') return;
          const { vx, vy } = toVirtualCoords(e.clientX, e.clientY);
          if (
            giftBoxRef.current.active &&
            Math.abs(vx - giftBoxRef.current.x) <= 26 &&
            vy >= giftBoxRef.current.y - 36 &&
            vy <= giftBoxRef.current.y + 6
          ) {
            e.preventDefault();
            toggleGiftBox();
            return;
          }
          if (
            featherWandRef.current.active &&
            vx >= featherWandRef.current.x - 32 &&
            vx <= featherWandRef.current.x + 32 &&
            vy >= featherWandRef.current.y - 36 &&
            vy <= featherWandRef.current.y + 30
          ) {
            e.preventDefault();
            featherWandRef.current.active = false;
            featherWandDragRef.current.dragging = false;
            spawnYarnVanishParticles(
              particlesRef.current,
              featherWandRef.current.x,
              featherWandRef.current.y,
              '#c8a6f7',
            );
            publishBridgeState(saveRef.current, focusRef.current);
            return;
          }
          if (teaseYarnActiveRef.current) {
            e.preventDefault();
            toggleTeaseYarn();
            return;
          }
          if (
            cushionRef.current.active &&
            Math.abs(vx - cushionRef.current.x) <= 42 &&
            vy >= cushionRef.current.y - 28 &&
            vy <= cushionRef.current.y + 10
          ) {
            e.preventDefault();
            toggleCushion();
            return;
          }
          for (const toy of toysRef.current) {
            if (toy.kind === 'yarn' && Math.hypot(vx - toy.x, vy - toy.y) <= toy.radius + 16) {
              e.preventDefault();
              clearYarn();
              return;
            }
          }
          if (isPointOnCat(vx, vy) || (giftBoxRef.current.active && giftBoxRef.current.occupied)) {
            e.preventDefault();
            const cat = catRef.current;
            const cDims = getStageDimensions(saveRef.current.stage, saveRef.current.settings.spriteScale);
            if (quickWheelRef.current.active) {
              quickWheelRef.current.active = false;
              quickWheelRef.current.hoveredId = null;
            } else {
              quickWheelRef.current = {
                active: true,
                x: cat.x + cDims.width / 2,
                y: cat.y + cDims.height / 2,
                hoveredId: null,
              };
            }
            wakeLoopRef.current?.();
            return;
          }
          if (quickWheelRef.current.active) {
            e.preventDefault();
            quickWheelRef.current.active = false;
            quickWheelRef.current.hoveredId = null;
          }
        }}
      />
      {onboardingPhase === 'naming' && (
        <OnboardingOverlay
          catCenterX={catRef.current.x + dims.width / 2}
          catTopY={catRef.current.y}
          virtualWidth={snap.virtualWidth}
          virtualHeight={snap.virtualHeight}
          primaryMonitor={primaryMonitor}
          initialName={save.name}
          initialCoat={save.coat}
          initialAccessory={save.equippedAccessory}
          onPreviewCoat={(coat) => commitSave((d) => { d.coat = coat; }, false)}
          onPreviewAccessory={(accessory) => commitSave((d) => { d.equippedAccessory = accessory; }, false)}
          onHitRectChange={handleNameTagHitRectChange}
          onConfirm={handleConfirmOnboarding}
        />
      )}
    </main>
  );
};

export default App;
