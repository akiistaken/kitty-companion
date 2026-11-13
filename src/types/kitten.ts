export interface MonitorRect {
  x: number;
  y: number;
  width: number;
  height: number;
  workX: number;
  workY: number;
  workWidth: number;
  workHeight: number;
  isPrimary: boolean;
}

export interface WindowPlatform {
  hwnd: number;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  zIndex: number;
  isForeground: boolean;
  isMedia: boolean;
}

export interface DesktopSnapshot {
  virtualX: number;
  virtualY: number;
  virtualWidth: number;
  virtualHeight: number;
  cursorX: number;
  cursorY: number;
  idleMs: number;
  isAudioPlaying?: boolean;
  monitors: MonitorRect[];
  windows: WindowPlatform[];
}

export interface HitRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type LifeStage = 'tiny_kitten' | 'junior_kitten' | 'young_cat' | 'grown_cat';

export type CoatId =
  | 'ginger'
  | 'tuxedo'
  | 'calico'
  | 'void'
  | 'siamese'
  | 'gray_tabby'
  | 'sakura'
  | 'lavender'
  | 'vanilla'
  | 'lilac_ragdoll'
  | 'starlight_plum'
  | 'wisteria_calico';

export type AccessoryId =
  | 'none'
  | 'lavender_bow'
  | 'pearl_collar'
  | 'pink_bow'
  | 'star_clip'
  | 'bunny_ears'
  | 'lace_headband'
  | 'fairy_wings'
  | 'witch_hat'
  | 'amethyst_crown'
  | 'lunar_glasses'
  | 'beret'
  | 'nightcap'
  | 'red_collar'
  | 'heart_collar'
  | 'golden_bell'
  | 'tiny_scarf'
  | 'leaf_hat'
  | 'flower_crown'
  | 'tiara'
  | 'sunglasses'
  | 'heart_shades';

export type CatBehaviorState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'jump'
  | 'fall'
  | 'sit'
  | 'loaf'
  | 'sleep'
  | 'stalk'
  | 'pounce'
  | 'hold_cursor'
  | 'petted'
  | 'poked'
  | 'reach_yarn'
  | 'cuddle_yarn'
  | 'groom'
  | 'carried'
  | 'head_bob'
  | 'eat'
  | 'celebrate'
  | 'stretch'
  | 'knead'
  | 'trick_spin'
  | 'trick_highfive'
  | 'trick_flip'
  | 'zoomies'
  | 'roll_wiggle'
  | 'box_hide'
  | 'peek';

export type CursorHoldMode = 'real_tug' | 'visual_only';
export type GrowthPace = 'very_slow' | 'normal' | 'fast';
export type HudTheme = 'lavender' | 'midnight_plum' | 'parchment' | 'blossom';
export type ClickAction = 'poke' | 'pet';
export type SoundStyle = 'chiptune' | 'music_box';
export type ToyKind = 'yarn' | 'fish' | 'macaron' | 'boba' | 'cake' | 'ube_icecream' | 'star_kibble' | 'croissant';

export interface WalkableLedge {
  id: string;
  kind: 'taskbar' | 'window';
  hwnd?: number;
  title?: string;
  isMedia?: boolean;
  isForeground?: boolean;
  startX: number;
  endX: number;
  y: number;
}

export interface TimelineEntry {
  id: string;
  timestamp: number;
  kind: 'birth' | 'growth' | 'milestone' | 'achievement' | 'focus' | 'custom';
  title: string;
  detail: string;
  stage: LifeStage;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  rewardAccessory?: AccessoryId;
  rewardLabel?: string;
  target: number;
  statKey: keyof LifetimeStats | 'stageLevel';
}

export interface LifetimeStats {
  distancePx: number;
  jumpsCount: number;
  titlebarNaps: number;
  cursorsCaught: number;
  petsReceived: number;
  pokesCount: number;
  yarnBats: number;
  yarnCatches: number;
  treatsEaten: number;
  butterfliesCaught?: number;
  laserPounces?: number;
  plantSniffs?: number;
  tricksPerformed?: number;
  bubblesPopped?: number;
  boxAmbushes?: number;
  focusSessionsCompleted: number;
  headBobSeconds: number;
  nightMinutes: number;
  studyBuddyMinutes: number;
  visitedApps: string[];
  appSleepCounts: Record<string, number>;
}

export interface KittenSettings {
  cursorHoldMode: CursorHoldMode;
  cursorHoldEnabled: boolean;
  growthPace: GrowthPace;
  soundEnabled: boolean;
  volume: number;
  soundStyle: SoundStyle;
  hudTheme: HudTheme;
  clickAction: ClickAction;
  studyBuddyEnabled: boolean;
  lateNightEnabled: boolean;
  focusMinutes: number;
  spriteScale: number;
  userName: string;
  careWhispersEnabled?: boolean;
}

export interface PolaroidMemory {
  id: string;
  timestamp: number;
  coat: CoatId;
  accessory: AccessoryId;
  stage: LifeStage;
  pose: CatBehaviorState;
  caption: string;
}

export interface SavedLoveNote {
  id: string;
  text: string;
  savedAt: number;
}

export interface MementoDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  statKey: keyof LifetimeStats | 'stageLevel';
  target: number;
}

export interface KittenSaveState {
  version: number;
  onboardingCompleted?: boolean;
  name: string;
  bornAt: number;
  xp: number;
  bond: number;
  energy: number;
  treats: number;
  stage: LifeStage;
  coat: CoatId;
  equippedAccessory: AccessoryId;
  unlockedAccessories: AccessoryId[];
  stats: LifetimeStats;
  achievements: Record<string, number>; // id -> unlockedAt timestamp
  timeline: TimelineEntry[];
  memories?: PolaroidMemory[];
  mementos?: string[];
  starJarCount?: number;
  savedNotes?: SavedLoveNote[];
  settings: KittenSettings;
}

export interface ToyEntity {
  id: string;
  kind: ToyKind;
  color?: string;
  heldBy?: 'drag' | 'tease' | null;
  batsCount?: number;
  playTime?: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  settled: boolean;
  bounces: number;
  spawnedAt: number;
}

export type OnboardingPhase =
  | 'loading'
  | 'letterpad'
  | 'smoke_reveal'
  | 'egg_basket'
  | 'egg_hatching'
  | 'naming'
  | 'done';

export interface Particle {
  id: string;
  kind: 'heart' | 'zzz' | 'paw' | 'dust' | 'note' | 'sparkle' | 'moon' | 'petal' | 'boop' | 'smoke' | 'shell';
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  life: number;
  maxLife: number;
  flip?: boolean;
  color?: string;
  glyph?: string;
  size?: number;
  rotation?: number;
  vRot?: number;
}

export interface ButterflyEntity {
  id: string;
  kind: 'butterfly' | 'firefly';
  x: number;
  y: number;
  baseY?: number;
  vx: number;
  vy: number;
  phase: number;
  color: string;
  life: number;
  maxLife: number;
  booped?: boolean;
}

export interface CushionEntity {
  active: boolean;
  x: number;
  y: number;
  vx?: number;
  vy: number;
  grounded: boolean;
}

export interface LavenderPlantEntity {
  active: boolean;
  x: number;
  y: number;
  vx?: number;
  vy: number;
  grounded: boolean;
  swayTimer: number;
}

export interface BubbleEntity {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
  color: string;
  life: number;
  maxLife: number;
  popped?: boolean;
}

export interface GiftBoxEntity {
  active: boolean;
  x: number;
  y: number;
  vx?: number;
  vy: number;
  grounded: boolean;
  occupied: boolean;
  wiggleTimer: number;
  cooldown: number;
}

export type QuickWheelActionId =
  | 'treat'
  | 'laser'
  | 'brush'
  | 'trick'
  | 'bubbles'
  | 'box'
  | 'snap'
  | 'hud';

export interface QuickWheelState {
  active: boolean;
  x: number;
  y: number;
  hoveredId?: QuickWheelActionId | null;
}

export interface FeatherWandState {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  grounded?: boolean;
  heldByCursor?: boolean;
  idleSeconds?: number;
}

export interface LoveNoteEntity {
  active: boolean;
  x: number;
  y: number;
  text: string;
  opened: boolean;
  saved?: boolean;
  timer: number;
}

export interface FocusState {
  active: boolean;
  totalSeconds: number;
  remainingSeconds: number;
  startedAt: number;
}

export interface CatRuntime {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  state: CatBehaviorState;
  stateTimer: number;
  animTime: number;
  grounded: boolean;
  perchedHwnd: number | null;
  perchedOffsetX: number;
  perchedWindowY: number;
  perchedAppTitle: string | null;
  targetX: number | null;
  targetLedge: WalkableLedge | null;
  holdCooldown: number;
  holdDuration: number;
  petRubAccum: number;
  lastPetCursorX: number;
  pawPrintCooldown: number;
  particleCooldown: number;
  activeAppReaction: 'none' | 'music' | 'late_night' | 'study_buddy';
  statusBubble: string | null;
  statusBubbleTimer: number;
  pokeStreak: number;
  lastPokeAt: number;
  yarnReachHopCooldown: number;
  yarnCatchCooldown: number;
  blushTimer: number;
  ignoreLedgeHwnd: number | null;
  ignoreLedgeUntilY: number;
  meowCooldown: number;
  cuddledYarnColor: string | null;
}
