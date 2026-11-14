import {
  AccessoryId,
  AchievementDef,
  CoatId,
  GrowthPace,
  KittenSaveState,
  LifeStage,
  MementoDef,
  PolaroidMemory,
  SavedLoveNote,
  TimelineEntry,
} from '../types/kitten';

export const STAGE_THRESHOLDS: Record<LifeStage, { minXp: number; nextXp: number | null; level: number; label: string }> = {
  tiny_kitten: { minXp: 0, nextXp: 100, level: 1, label: 'Tiny Kitten' },
  junior_kitten: { minXp: 100, nextXp: 350, level: 2, label: 'Junior Kitten' },
  young_cat: { minXp: 350, nextXp: 850, level: 3, label: 'Young Cat' },
  grown_cat: { minXp: 850, nextXp: null, level: 4, label: 'Grown Cat' },
};

export const ACCESSORY_META: Record<AccessoryId, { label: string; hint: string }> = {
  none: { label: 'Natural Fur', hint: 'Always unlocked' },
  lavender_bow: { label: 'Lavender Bow', hint: 'Always unlocked' },
  pearl_collar: { label: 'Pearl Collar', hint: 'Always unlocked' },
  pink_bow: { label: 'Pink Ribbon Bow', hint: 'Always unlocked' },
  star_clip: { label: 'Star Hairclip', hint: 'Always unlocked' },
  bunny_ears: { label: 'Bunny Ears', hint: 'Always unlocked' },
  lace_headband: { label: 'Lavender Lace', hint: 'Always unlocked' },
  fairy_wings: { label: 'Fairy Wings', hint: 'Unlock: Butterfly Friend (3 butterflies)' },
  witch_hat: { label: 'Witchy Hat', hint: 'Unlock: Moonbeam Watcher (2m late night)' },
  amethyst_crown: { label: 'Amethyst Halo', hint: 'Unlock: Dot Detective (5 laser pounces)' },
  lunar_glasses: { label: 'Lunar Glasses', hint: 'Unlock: Lavender Sniffer (3 plant sniffs)' },
  beret: { label: 'Cozy Beret', hint: 'Unlock: Beat Keeper (20s music bob)' },
  nightcap: { label: 'Sleepy Nightcap', hint: 'Unlock: Focus Companion (1 Focus Nap)' },
  crescent_crown: { label: 'Crescent Halo', hint: 'Unlock: Stargazer (3 Star Wishes)' },
  red_collar: { label: 'Red Collar', hint: 'Unlock: Titlebar Napper (3 window naps)' },
  heart_collar: { label: 'Heart Collar', hint: 'Unlock: Sweet Tooth (5 treats eaten)' },
  tiny_scarf: { label: 'Cozy Scarf', hint: 'Unlock: Purr Machine (15 pets received)' },
  leaf_hat: { label: 'Sprout Leaf', hint: 'Unlock: Window Climber (12 titlebar jumps)' },
  flower_crown: { label: 'Flower Crown', hint: 'Unlock: Paws Up! (5 teased yarn catches)' },
  tiara: { label: 'Princess Tiara', hint: 'Unlock: Junior Graduation (Reach Junior Kitten)' },
  sunglasses: { label: 'Cool Shades', hint: 'Unlock: Cursor Bandit (5 cursor catches)' },
  heart_shades: { label: 'Heart Shades', hint: 'Unlock: Boop Squad (10 playful pokes)' },
  golden_bell: { label: 'Golden Bell', hint: 'Unlock: Full-Grown Legend (Reach Grown Cat)' },
};

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_jump',
    title: 'Skyward Paws',
    description: 'Jump up onto an open window titlebar for the first time.',
    target: 1,
    statKey: 'jumpsCount',
  },
  {
    id: 'window_climber',
    title: 'Window Climber',
    description: 'Leap across 12 window titlebars using desktop gravity.',
    rewardAccessory: 'leaf_hat',
    rewardLabel: 'Sprout Leaf',
    target: 12,
    statKey: 'jumpsCount',
  },
  {
    id: 'titlebar_napper',
    title: 'Titlebar Napper',
    description: 'Curl up and nap above 3 different windows.',
    rewardAccessory: 'red_collar',
    rewardLabel: 'Red Collar',
    target: 3,
    statKey: 'titlebarNaps',
  },
  {
    id: 'cursor_bandit',
    title: 'Cursor Bandit',
    description: 'Catch and hold the desktop cursor 5 times.',
    rewardAccessory: 'sunglasses',
    rewardLabel: 'Cool Shades',
    target: 5,
    statKey: 'cursorsCaught',
  },
  {
    id: 'purr_machine',
    title: 'Purr Machine',
    description: 'Receive 15 affectionate pets from your human.',
    rewardAccessory: 'tiny_scarf',
    rewardLabel: 'Cozy Scarf',
    target: 15,
    statKey: 'petsReceived',
  },
  {
    id: 'yarn_striker',
    title: 'Yarn Striker',
    description: 'Chase and bat the pixel yarn ball 8 times.',
    target: 8,
    statKey: 'yarnBats',
  },
  {
    id: 'gourmet_kitty',
    title: 'Sweet Tooth',
    description: 'Gobble down 5 tossed pixel fish, macaron, boba, or cake treats.',
    rewardAccessory: 'heart_collar',
    rewardLabel: 'Heart Collar',
    target: 5,
    statKey: 'treatsEaten',
  },
  {
    id: 'butterfly_friend',
    title: 'Butterfly Friend',
    description: 'Playfully boop 3 fluttering desktop butterflies or fireflies.',
    rewardAccessory: 'fairy_wings',
    rewardLabel: 'Fairy Wings',
    target: 3,
    statKey: 'butterfliesCaught',
  },
  {
    id: 'laser_chaser',
    title: 'Dot Detective',
    description: 'Chase and pounce on the violet laser dot 5 times.',
    rewardAccessory: 'amethyst_crown',
    rewardLabel: 'Amethyst Halo',
    target: 5,
    statKey: 'laserPounces',
  },
  {
    id: 'lavender_sniffer',
    title: 'Lavender Sniffer',
    description: 'Sniff and swirl petals by the potted lavender 3 times.',
    rewardAccessory: 'lunar_glasses',
    rewardLabel: 'Lunar Glasses',
    target: 3,
    statKey: 'plantSniffs',
  },
  {
    id: 'moonbeam_watcher',
    title: 'Moonbeam Watcher',
    description: 'Keep gentle late-night company for 2 cozy minutes.',
    rewardAccessory: 'witch_hat',
    rewardLabel: 'Witchy Hat',
    target: 2,
    statKey: 'nightMinutes',
  },
  {
    id: 'bubble_popper',
    title: 'Bubble Popper',
    description: 'Pop 8 floating lavender soap bubbles together.',
    target: 8,
    statKey: 'bubblesPopped',
  },
  {
    id: 'trick_star',
    title: 'Showstopper Kitty',
    description: 'Perform 5 adorable desktop tricks.',
    target: 5,
    statKey: 'tricksPerformed',
  },
  {
    id: 'box_ambusher',
    title: 'Jack-in-the-Box',
    description: 'Ambush the cursor from inside the Purple Gift Box 3 times.',
    target: 3,
    statKey: 'boxAmbushes',
  },
  {
    id: 'boop_squad',
    title: 'Boop Squad',
    description: 'Playfully poke your kitten 10 times.',
    rewardAccessory: 'heart_shades',
    rewardLabel: 'Heart Shades',
    target: 10,
    statKey: 'pokesCount',
  },
  {
    id: 'yarn_catcher',
    title: 'Paws Up!',
    description: 'Stand on two legs and catch a dangled yarn ball 5 times.',
    rewardAccessory: 'flower_crown',
    rewardLabel: 'Flower Crown',
    target: 5,
    statKey: 'yarnCatches',
  },
  {
    id: 'beat_keeper',
    title: 'Beat Keeper',
    description: 'Bob your head on a music or video window for 20 seconds.',
    rewardAccessory: 'beret',
    rewardLabel: 'Cozy Beret',
    target: 20,
    statKey: 'headBobSeconds',
  },
  {
    id: 'focus_master',
    title: 'Focus Companion',
    description: 'Complete a full Focus / Pomodoro session together.',
    rewardAccessory: 'nightcap',
    rewardLabel: 'Sleepy Nightcap',
    target: 1,
    statKey: 'focusSessionsCompleted',
  },
  {
    id: 'marathon_paws',
    title: 'Marathon Paws',
    description: 'Patrol 25,000 pixels across taskbars and monitors.',
    target: 25000,
    statKey: 'distancePx',
  },
  {
    id: 'junior_grad',
    title: 'Junior Graduation',
    description: 'Grow from Tiny Kitten into a playful Junior Kitten.',
    rewardAccessory: 'tiara',
    rewardLabel: 'Princess Tiara',
    target: 2,
    statKey: 'stageLevel',
  },
  {
    id: 'full_grown',
    title: 'Full-Grown Legend',
    description: 'Reach the Grown Cat life stage.',
    rewardAccessory: 'golden_bell',
    rewardLabel: 'Golden Bell',
    target: 4,
    statKey: 'stageLevel',
  },
  {
    id: 'stargazer',
    title: 'Stargazer Kitty',
    description: 'Wish on 3 shooting stars or Star Jar constellations.',
    rewardAccessory: 'crescent_crown',
    rewardLabel: 'Crescent Halo',
    target: 3,
    statKey: 'wishesMade',
  },
  {
    id: 'lantern_keeper',
    title: 'Lantern Keeper',
    description: 'Take 3 cozy midnight naps beside the Moonlight Lantern.',
    target: 3,
    statKey: 'lanternNaps',
  },
];

export function createInitialSaveState(
  coat: CoatId = 'lavender',
  name = 'Mochi',
  onboardingCompleted = false,
): KittenSaveState {
  const now = Date.now();
  return {
    version: 1,
    onboardingCompleted,
    name,
    bornAt: now,
    xp: 0,
    bond: 0,
    energy: 0,
    treats: 0,
    stage: 'tiny_kitten',
    coat,
    equippedAccessory: 'none',
    unlockedAccessories: [
      'none',
      'lavender_bow',
      'pearl_collar',
      'pink_bow',
      'star_clip',
      'bunny_ears',
      'lace_headband',
    ],
    stats: {
      distancePx: 0,
      jumpsCount: 0,
      titlebarNaps: 0,
      cursorsCaught: 0,
      petsReceived: 0,
      pokesCount: 0,
      yarnBats: 0,
      yarnCatches: 0,
      treatsEaten: 0,
      butterfliesCaught: 0,
      laserPounces: 0,
      plantSniffs: 0,
      tricksPerformed: 0,
      bubblesPopped: 0,
      boxAmbushes: 0,
      focusSessionsCompleted: 0,
      headBobSeconds: 0,
      nightMinutes: 0,
      studyBuddyMinutes: 0,
      wishesMade: 0,
      lanternNaps: 0,
      visitedApps: [],
      appSleepCounts: {},
    },
    achievements: {},
    memories: [],
    mementos: [],
    starJarCount: 0,
    savedNotes: [],
    timeline: [
      {
        id: `born-${now}`,
        timestamp: now,
        kind: 'birth',
        title: `${name} arrived on your desktop`,
        detail: 'Took first wobbly tiny-kitten steps across the taskbar.',
        stage: 'tiny_kitten',
      },
    ],
    settings: {
      cursorHoldMode: 'real_tug',
      cursorHoldEnabled: true,
      growthPace: 'very_slow',
      soundEnabled: true,
      volume: 0.25,
      soundStyle: 'music_box',
      hudTheme: 'lavender',
      clickAction: 'poke',
      studyBuddyEnabled: true,
      lateNightEnabled: true,
      focusMinutes: 25,
      spriteScale: 6,
      userName: 'Jane',
      careWhispersEnabled: true,
    },
  };
}

export function stageFromXp(xp: number): LifeStage {
  if (xp >= STAGE_THRESHOLDS.grown_cat.minXp) return 'grown_cat';
  if (xp >= STAGE_THRESHOLDS.young_cat.minXp) return 'young_cat';
  if (xp >= STAGE_THRESHOLDS.junior_kitten.minXp) return 'junior_kitten';
  return 'tiny_kitten';
}

export function paceMultiplier(pace: GrowthPace): number {
  if (pace === 'fast') return 3.5;
  if (pace === 'normal') return 1;
  return 0.12;
}

export function pushTimelineEntry(
  save: KittenSaveState,
  entry: Omit<TimelineEntry, 'id' | 'timestamp' | 'stage'>,
): void {
  const now = Date.now();
  save.timeline.unshift({
    ...entry,
    id: `${entry.kind}-${now}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: now,
    stage: save.stage,
  });
  if (save.timeline.length > 120) {
    save.timeline.length = 120;
  }
}

export function getAchievementProgress(save: KittenSaveState, def: AchievementDef): number {
  if (def.statKey === 'stageLevel') {
    return STAGE_THRESHOLDS[save.stage].level;
  }
  const val = save.stats[def.statKey];
  return typeof val === 'number' ? val : 0;
}

export const MEMENTO_DEFS: MementoDef[] = [
  {
    id: 'pressed_lavender',
    title: 'Pressed Lavender',
    description: 'A tiny dried lilac sprig tucked beside your keyboard.',
    icon: '🪻',
    statKey: 'petsReceived',
    target: 3,
  },
  {
    id: 'amethyst_pebble',
    title: 'Amethyst Pebble',
    description: 'A smooth shiny purple stone carried down from a window.',
    icon: '🔮',
    statKey: 'jumpsCount',
    target: 3,
  },
  {
    id: 'velvet_ribbon',
    title: 'Velvet Ribbon',
    description: 'A soft plum café ribbon traded for sweet treats.',
    icon: '🎀',
    statKey: 'treatsEaten',
    target: 3,
  },
  {
    id: 'purple_marble',
    title: 'Galaxy Marble',
    description: 'A swirly violet marble batted under the taskbar.',
    icon: '🫧',
    statKey: 'yarnBats',
    target: 5,
  },
  {
    id: 'lilac_scrunchie',
    title: 'Lilac Scrunchie',
    description: 'Found while ambushing your desktop pointer.',
    icon: '💜',
    statKey: 'cursorsCaught',
    target: 2,
  },
  {
    id: 'origami_star',
    title: 'Lucky Paper Star',
    description: 'Folded quietly during a cozy Focus Nap.',
    icon: '🌟',
    statKey: 'focusSessionsCompleted',
    target: 1,
  },
  {
    id: 'soap_wand',
    title: 'Bubble Wand',
    description: 'A tiny iridescent lavender bubble wand.',
    icon: '🪄',
    statKey: 'bubblesPopped',
    target: 3,
  },
  {
    id: 'confetti_bow',
    title: 'Party Confetti',
    description: 'Sparkly lilac confetti from your favorite cat tricks.',
    icon: '🎊',
    statKey: 'tricksPerformed',
    target: 3,
  },
  {
    id: 'moon_stone',
    title: 'Moonstone Charm',
    description: 'A luminescent crescent pebble caught from a shooting-star wish.',
    icon: '🌙',
    statKey: 'wishesMade',
    target: 1,
  },
];

export interface ProgressionEvents {
  evolvedTo?: LifeStage;
  unlockedAchievements: AchievementDef[];
  unlockedMementos: MementoDef[];
}

export function applyXpAndEvaluate(
  save: KittenSaveState,
  rawXpDelta: number,
): ProgressionEvents {
  const events: ProgressionEvents = { unlockedAchievements: [], unlockedMementos: [] };
  const mult = paceMultiplier(save.settings.growthPace);
  save.xp += rawXpDelta * mult;

  const newStage = stageFromXp(save.xp);
  if (newStage !== save.stage) {
    const prevLabel = STAGE_THRESHOLDS[save.stage].label;
    save.stage = newStage;
    const nextLabel = STAGE_THRESHOLDS[newStage].label;
    events.evolvedTo = newStage;
    pushTimelineEntry(save, {
      kind: 'growth',
      title: `Grew into a ${nextLabel}!`,
      detail: `Evolved from ${prevLabel} at ${Math.floor(save.xp)} Growth XP.`,
    });
  }

  for (const def of ACHIEVEMENTS) {
    if (save.achievements[def.id]) continue;
    const prog = getAchievementProgress(save, def);
    if (prog >= def.target) {
      save.achievements[def.id] = Date.now();
      events.unlockedAchievements.push(def);

      if (def.rewardAccessory && !save.unlockedAccessories.includes(def.rewardAccessory)) {
        save.unlockedAccessories.push(def.rewardAccessory);
      }

      pushTimelineEntry(save, {
        kind: 'achievement',
        title: `Achievement: ${def.title}`,
        detail: def.rewardLabel
          ? `${def.description} Unlocked ${def.rewardLabel}!`
          : def.description,
      });
    }
  }

  if (!Array.isArray(save.mementos)) save.mementos = [];
  for (const mem of MEMENTO_DEFS) {
    if (save.mementos.includes(mem.id)) continue;
    const prog = getAchievementProgress(save, mem as unknown as AchievementDef);
    if (prog >= mem.target) {
      save.mementos.push(mem.id);
      events.unlockedMementos.push(mem);
      pushTimelineEntry(save, {
        kind: 'milestone',
        title: `Gift Found: ${mem.title}`,
        detail: mem.description,
      });
    }
  }

  return events;
}

export function formatAppLabel(title: string): string {
  const cleaned = title.trim();
  const parts = cleaned.split(/\s[-—|]\s/);
  const tail = parts.length > 1 ? parts[parts.length - 1] : cleaned;
  return tail.slice(0, 32);
}

export function addPolaroidMemory(
  save: KittenSaveState,
  memory: Omit<PolaroidMemory, 'id' | 'timestamp'> & { id?: string; timestamp?: number },
): PolaroidMemory {
  const now = memory.timestamp ?? Date.now();
  const item: PolaroidMemory = {
    id: memory.id ?? `mem-${now}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: now,
    coat: memory.coat,
    accessory: memory.accessory,
    stage: memory.stage,
    pose: memory.pose,
    caption: memory.caption.slice(0, 42),
  };
  const current = Array.isArray(save.memories) ? save.memories : [];
  save.memories = [item, ...current].slice(0, 12);
  return item;
}

export function removePolaroidMemory(save: KittenSaveState, id: string): void {
  if (!Array.isArray(save.memories)) return;
  save.memories = save.memories.filter((m) => m.id !== id);
}

/**
 * Spend 5 collected stars from the Lavender Star Jar to grant a cosmic wish.
 */
export function spendStarJarForWish(
  save: KittenSaveState,
): { ok: true; events: ProgressionEvents } | { ok: false } {
  const count = save.starJarCount ?? 0;
  if (count < 5) {
    return { ok: false };
  }
  save.starJarCount = count - 5;
  save.stats.wishesMade = (save.stats.wishesMade ?? 0) + 1;
  save.bond = Math.min(100, save.bond + 5);
  save.energy = Math.min(100, save.energy + 15);
  save.treats = Math.min(100, save.treats + 15);
  const events = applyXpAndEvaluate(save, 18);
  pushTimelineEntry(save, {
    kind: 'milestone',
    title: 'Made a Star Jar Wish!',
    detail: `Spent 5 collected stars from the Lavender Star Jar for cosmic luck (${save.starJarCount} ★ left).`,
  });
  return { ok: true, events };
}

export function saveLoveNote(save: KittenSaveState, text: string): SavedLoveNote {
  const current = Array.isArray(save.savedNotes) ? save.savedNotes : [];
  const trimmed = text.trim();
  const existing = current.find((n) => n.text === trimmed);
  if (existing) return existing;
  const item: SavedLoveNote = {
    id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    text: trimmed,
    savedAt: Date.now(),
  };
  save.savedNotes = [item, ...current].slice(0, 30);
  return item;
}

export function deleteSavedNote(save: KittenSaveState, id: string): void {
  if (!Array.isArray(save.savedNotes)) return;
  save.savedNotes = save.savedNotes.filter((n) => n.id !== id);
}

const NIGHT_CARE_WHISPER_BUILDERS: Array<(who: string) => string> = [
  (who) => `Cozy night, ${who} 💜`,
  () => 'Rest your eyes soon ~',
  () => 'Blanket & warm tea time?',
  (who) => `Soft dreams await, ${who}`,
  () => 'Dim your screen a little ✨',
  () => 'Wind down gently tonight',
  (who) => `Moonlight purrs for ${who}`,
  () => 'Hands off keys, stretch out',
  () => 'Sip warm water before bed',
  (who) => `Save your work, ${who} ♥`,
  () => 'Tomorrow can wait for morning',
  () => 'Wrap up cozy & breathe slow',
  (who) => `Sleepy paws miss ${who}`,
  () => 'Close a few extra tabs~',
  () => 'Let your shoulders drop now',
  () => 'Deep yawn, soft pillow soon',
  (who) => `Starry wishes, ${who} ✨`,
  () => 'Rest makes tomorrow lighter',
  () => 'Warm socks, calm heart 💜',
  () => 'Curl up like a cozy loaf~',
  (who) => `Enough for tonight, ${who}`,
  () => 'Blink slowly, rest your gaze',
  () => 'Quiet hours, gentle pace',
  () => 'One last stretch then bed!',
  (who) => `Goodnight hugs, ${who} 💜`,
  () => 'Let your mind float softly',
  () => 'Warm mug, sleepy purrs~',
  () => 'Turn the brightness down ♥',
];

const DAY_CARE_WHISPER_BUILDERS: Array<(who: string) => string> = [
  (who) => `Sip some water, ${who}!`,
  (who) => `Proud of u, ${who} ♥`,
  () => 'Quick shoulder stretch~',
  () => 'Unclench your jaw ✨',
  (who) => `You're doing great, ${who}!`,
  () => 'Drop your shoulders down',
  () => 'Look 20ft away for 20s!',
  () => 'Deep breath in... and out',
  (who) => `Rooting for you, ${who} 💜`,
  () => 'Un-shrimp your back~',
  () => 'Have you eaten a snack?',
  () => 'Wiggle your wrists & fingers',
  (who) => `Tiny steps count, ${who}!`,
  () => 'Refresh your water glass 💧',
  () => 'Soften your forehead brow',
  () => 'Open a window for fresh air',
  (who) => `Sending kitty purrs, ${who}`,
  () => 'One task at a time ✨',
  () => 'Stand up & shake it out!',
  () => 'Take three slow belly breaths',
  (who) => `Keep going gently, ${who} ♥`,
  () => 'Relax your neck side to side',
  () => 'Give yourself grace today',
  () => 'Hydrate check! Take a sip',
  (who) => `Lucky to sit by ${who} 💜`,
  () => 'Uncross & stretch your legs',
  () => 'Blink break for tired eyes',
  () => 'Celebrate your tiny wins!',
  (who) => `So glad you're here, ${who}`,
  () => 'Warm tea or cold water break?',
  () => 'Roll your ankles in circles',
  () => 'Pause & smile for 3 seconds',
  (who) => `Pace yourself kindly, ${who}`,
  () => 'You deserve a cozy break',
  () => 'Loosen your grip on the mouse',
  () => 'Check your posture, tall spine!',
  (who) => `Gold star for ${who} today ⭐`,
  () => 'Breathe in calm, exhale rush',
  () => 'Have a little fruit or treat!',
  () => 'Step away for 2 calm minutes',
  (who) => `Head pats for ${who} ~`,
  () => 'No need to rush perfection',
  () => 'Wash your face with cool water',
  () => 'Let today feel a bit lighter',
  (who) => `Cheerleader kitten loves ${who}`,
  () => 'Stretch arms high up to the sky',
  () => 'Look away from screens a moment',
  () => 'Gentle reminder: be kind to u',
  (who) => `Cozy focus vibes, ${who} ✨`,
  () => 'Rest your palms in your lap',
  () => 'Sip, stretch, smile, repeat ♥',
  () => 'You survived 100% of hard days',
  (who) => `Tiny paw high-five, ${who}!`,
  () => 'Close eyes for 5 calm seconds',
];

const AKII_LOVE_NOTE_BUILDERS: Array<(who: string) => string> = [
  (who) => `You're doing amazing today, ${who}! Always cheering. - Akii 💜`,
  (who) => `Hey ${who}, take a breather & smile today! - Akii 💜`,
  () => 'Sending a tiny pocket hug whenever work feels heavy. - Akii 💜',
  (who) => `One cozy step at a time, ${who}. You've got this! - Akii 💜`,
  (who) => `Just reminding ${who} how loved & appreciated you are. - Akii 💜`,
  (who) => `Don't forget water & snacks today, sweet ${who}! - Akii 💜`,
  () => 'Even small progress today is worth celebrating. - Akii 💜',
  (who) => `If today feels noisy, hide in our cozy corner, ${who}. - Akii 💜`,
  (who) => `Proud of every quiet effort you make, ${who}! - Akii 💜`,
  () => 'May your coffee stay warm and your tabs stay few. - Akii 💜',
  (who) => `Hey ${who}, your smile makes every day brighter! - Akii 💜`,
  () => 'Take 3 slow breaths right now—I believe in you! - Akii 💜',
  (who) => `You deserve softness, rest, and sweet treats, ${who}. - Akii 💜`,
  () => 'Here is a tiny paper star for getting through today. - Akii 💜',
  (who) => `No matter how busy it gets, ${who}, I'm in your corner. - Akii 💜`,
  () => 'Pause, stretch your shoulders, and give yourself grace. - Akii 💜',
  (who) => `Thinking of ${who} and hoping something nice happens! - Akii 💜`,
  () => 'You do not have to finish everything all at once. - Akii 💜',
  (who) => `Mochi and I are sending ${who} a big warm hug! - Akii 💜`,
  () => 'Drink a glass of water right now, pretty please! - Akii 💜',
  (who) => `You handle so much with kindness, ${who}. Thank you. - Akii 💜`,
  () => 'Save some gentle energy just for yourself today. - Akii 💜',
  (who) => `Rain or shine, ${who}, you make the world sweeter. - Akii 💜`,
  () => 'Drop your jaw, relax your brow, and unclench. - Akii 💜',
  (who) => `Whenever you doubt yourself, ${who}, borrow my faith! - Akii 💜`,
  () => 'A gentle reminder that resting counts as progress too. - Akii 💜',
  (who) => `Hey ${who}, go stretch for 30 seconds for me! - Akii 💜`,
  () => 'Sending warm bakery smells and cozy blanket vibes. - Akii 💜',
  (who) => `Every tiny bit of care you show yourself matters, ${who}. - Akii 💜`,
  () => 'Take a sip of water and look out the window a bit. - Akii 💜',
  (who) => `Hope today treats ${who} with extra gentleness! - Akii 💜`,
  () => 'You are never behind on your own quiet timeline. - Akii 💜',
  (who) => `Little reminder: ${who} is stronger than any tough day. - Akii 💜`,
  () => 'Keep a soft heart today, and let small worries go. - Akii 💜',
  (who) => `Sending ${who} a pocket full of luck & lavender! - Akii 💜`,
  () => 'Give Mochi a tiny pet and take a deep sigh out. - Akii 💜',
  (who) => `You shine brightest when you don't rush, ${who}. - Akii 💜`,
  () => 'Here is permission to close five tabs you hate. - Akii 💜',
  (who) => `Be proud of how far you've come already, ${who}! - Akii 💜`,
  () => 'Warm tea, comfy socks, and soft music for your soul. - Akii 💜',
  (who) => `Hey ${who}, remember to blink & rest your pretty eyes! - Akii 💜`,
  () => 'You bring so much warmth to everyone around you. - Akii 💜',
  (who) => `If you're tired, ${who}, slow down without guilt. - Akii 💜`,
  () => 'Tiny wins stack up into magic—keep going gently. - Akii 💜',
  (who) => `Sending ${who} a cozy high-five from across the desk! - Akii 💜`,
  () => 'Do one kind little thing just for yourself today. - Akii 💜',
  (who) => `Rooting for ${who} from morning coffee to starry night. - Akii 💜`,
  () => 'Your peace matters more than any checklist right now. - Akii 💜',
  (who) => `Smile check! Looking cute as ever today, ${who}. - Akii 💜`,
  () => 'Nothing to prove today—just breathe and be cozy. - Akii 💜',
  (who) => `Thank you for being wonderfully you, ${who}. - Akii 💜`,
  () => 'May the next hour bring you ease and a little joy. - Akii 💜',
  (who) => `Special delivery of calm & sunny thoughts for ${who}! - Akii 💜`,
  () => 'Wrap yourself in patience—good things are blooming. - Akii 💜',
  (who) => `Whenever you need encouragement, open this note, ${who}. - Akii 💜`,
  () => 'Lots of love, purrs, and gentle luck on your day! - Akii 💜',
];

let lastWhisperIdx = -1;
let lastLoveNoteIdx = -1;

function pickNonRepeatingIndex(length: number, lastIdx: number): number {
  if (length <= 1) return 0;
  let idx = Math.floor(Math.random() * length);
  if (idx === lastIdx) {
    idx = (idx + 1 + Math.floor(Math.random() * (length - 1))) % length;
  }
  return idx;
}

export function getCareWhisperPool(userName: string, hour: number): string[] {
  const who = userName.trim() || 'Jane';
  if (hour >= 22 || hour < 5) {
    const night = NIGHT_CARE_WHISPER_BUILDERS.map((fn) => fn(who));
    const gentleDay = DAY_CARE_WHISPER_BUILDERS.slice(0, 26).map((fn) => fn(who));
    return [...night, ...gentleDay];
  }
  return DAY_CARE_WHISPER_BUILDERS.map((fn) => fn(who));
}

export function getLoveNotePool(userName: string): string[] {
  const who = userName.trim() || 'Jane';
  return AKII_LOVE_NOTE_BUILDERS.map((fn) => fn(who));
}

export function pickCareWhisper(userName: string, hour: number): string {
  const pool = getCareWhisperPool(userName, hour);
  const idx = pickNonRepeatingIndex(pool.length, lastWhisperIdx);
  lastWhisperIdx = idx;
  return pool[idx];
}

export function pickLoveNoteText(userName: string): string {
  const pool = getLoveNotePool(userName);
  const idx = pickNonRepeatingIndex(pool.length, lastLoveNoteIdx);
  lastLoveNoteIdx = idx;
  return pool[idx];
}

export interface DailyStampDef {
  id: string;
  title: string;
  icon: string;
  description: string;
}

export const DAILY_STAMP_DEFS: DailyStampDef[] = [
  {
    id: 'first_stretch',
    title: 'Big Stretch',
    icon: '🧘',
    description: 'Did a cozy nose-to-tail stretch.',
  },
  {
    id: 'belly_roll',
    title: 'Belly Roll',
    icon: '🐾',
    description: 'Rolled around kicking pink toe beans.',
  },
  {
    id: 'sleep_firefly',
    title: 'Deep Sleeper',
    icon: '🌙',
    description: 'Slept peacefully past a fluttery visitor.',
  },
  {
    id: 'slow_blink',
    title: 'Slow Blink',
    icon: '💜',
    description: 'Gave you an affectionate slow blink.',
  },
  {
    id: 'window_peek',
    title: 'Edge Peek',
    icon: '🪟',
    description: 'Peeked curiously over a window ledge.',
  },
  {
    id: 'morning_yawn',
    title: 'Morning Yawn',
    icon: '✨',
    description: 'Let out a tiny sleepy yawn.',
  },
];

export function getLocalDateKey(now = Date.now()): string {
  const d = new Date(now);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getTodayDailyStamps(save: KittenSaveState, now = Date.now()): string[] {
  const key = getLocalDateKey(now);
  if (!save.dailyStamps || save.dailyStamps.dateKey !== key) {
    return [];
  }
  return Array.isArray(save.dailyStamps.stamps) ? save.dailyStamps.stamps : [];
}

/**
 * Record a cute daily moment stamp (resetting automatically each local day).
 */
export function recordDailyStamp(
  save: KittenSaveState,
  stampId: string,
  now = Date.now(),
): boolean {
  const key = getLocalDateKey(now);
  if (!save.dailyStamps || save.dailyStamps.dateKey !== key) {
    save.dailyStamps = { dateKey: key, stamps: [stampId] };
    return true;
  }
  if (!Array.isArray(save.dailyStamps.stamps)) {
    save.dailyStamps.stamps = [];
  }
  if (save.dailyStamps.stamps.includes(stampId)) {
    return false;
  }
  save.dailyStamps.stamps.push(stampId);
  return true;
}
