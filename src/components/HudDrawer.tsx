import React, { useEffect, useRef, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import {
  Award,
  Camera,
  Clock,
  Code2,
  Cookie,
  Eraser,
  Feather,
  Fish,
  Flower2,
  Gamepad2,
  Gift,
  Hand,
  Heart,
  Lock,
  Moon,
  Palette,
  Pointer,
  Power,
  Settings,
  Sparkles,
  Star,
  Timer,
  Volume2,
  VolumeX,
  Wand2,
  X,
} from 'lucide-react';
import {
  ACCESSORY_META,
  ACHIEVEMENTS,
  getAchievementProgress,
  MEMENTO_DEFS,
  STAGE_THRESHOLDS,
} from '../engine/progression';
import { COAT_PALETTES, drawPixelCat, getStageDimensions } from '../engine/sprites';
import {
  AccessoryId,
  CoatId,
  FocusState,
  KittenSaveState,
  KittenSettings,
  PolaroidMemory,
  ToyKind,
} from '../types/kitten';

type HudTab = 'timeline' | 'achievements' | 'wardrobe' | 'play' | 'settings' | 'developer';

interface HudDrawerProps {
  save: KittenSaveState;
  focus: FocusState;
  teaseYarnActive?: boolean;
  featherWandActive?: boolean;
  cushionActive?: boolean;
  laserActive?: boolean;
  plantActive?: boolean;
  brushActive?: boolean;
  giftBoxActive?: boolean;
  lanternActive?: boolean;
  x?: number;
  y?: number;
  standalone?: boolean;
  onClose: () => void;
  onRename: (name: string) => void;
  onSelectCoat: (coat: CoatId) => void;
  onEquipAccessory: (acc: AccessoryId) => void;
  onTossToy: (kind: ToyKind) => void;
  onPokeKitten?: () => void;
  onToggleTeaseYarn?: () => void;
  onToggleFeatherWand?: () => void;
  onToggleCushion?: () => void;
  onToggleLaser?: () => void;
  onTogglePlant?: () => void;
  onToggleBrush?: () => void;
  onToggleGiftBox?: () => void;
  onToggleLantern?: () => void;
  onSummonShootingStar?: () => void;
  onMakeJarWish?: () => void;
  onSpawnBubbles?: () => void;
  onDoTrick?: () => void;
  onClearYarn?: () => void;
  onToggleFocus: () => void;
  onSnapMemory?: () => void;
  onDeleteMemory?: (id: string) => void;
  onDeleteSavedNote?: (id: string) => void;
  onUpdateSettings: (patch: Partial<KittenSettings>) => void;
  onReplayIntro?: () => void;
  onResetKitten: () => void;
  onExitApp?: () => void;
}

const PolaroidThumb: React.FC<{ memory: PolaroidMemory }> = ({ memory }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    const scale = memory.stage === 'grown_cat' ? 0.34 : memory.stage === 'young_cat' ? 0.37 : 0.42;
    ctx.scale(scale, scale);
    drawPixelCat(ctx, {
      x: 16,
      y: 8,
      facing: 1,
      stage: memory.stage,
      coat: memory.coat,
      accessory: memory.accessory,
      state: memory.pose,
      animTime: 0.4,
      pixelScale: 6,
      blush: memory.pose === 'celebrate' || memory.pose === 'petted' || memory.pose === 'knead',
    });
    ctx.restore();
  }, [memory.id, memory.coat, memory.accessory, memory.stage, memory.pose]);
  return <canvas ref={ref} width={64} height={50} style={{ imageRendering: 'pixelated' }} />;
};

export const HudDrawer: React.FC<HudDrawerProps> = ({
  save,
  focus,
  teaseYarnActive = false,
  featherWandActive = false,
  cushionActive = false,
  laserActive = false,
  plantActive = false,
  brushActive = false,
  giftBoxActive = false,
  lanternActive = false,
  x = 0,
  y = 0,
  standalone = false,
  onClose,
  onRename,
  onSelectCoat,
  onEquipAccessory,
  onTossToy,
  onPokeKitten,
  onToggleTeaseYarn,
  onToggleFeatherWand,
  onToggleCushion,
  onToggleLaser,
  onTogglePlant,
  onToggleBrush,
  onToggleGiftBox,
  onToggleLantern,
  onSummonShootingStar,
  onMakeJarWish,
  onSpawnBubbles,
  onDoTrick,
  onClearYarn,
  onToggleFocus,
  onSnapMemory,
  onDeleteMemory,
  onDeleteSavedNote,
  onUpdateSettings,
  onReplayIntro,
  onResetKitten,
  onExitApp,
}) => {
  const [tab, setTab] = useState<HudTab>('timeline');
  const portraitRef = useRef<HTMLCanvasElement | null>(null);

  const stageInfo = STAGE_THRESHOLDS[save.stage];
  const growthPct = stageInfo.nextXp
    ? Math.min(
        100,
        Math.max(
          0,
          ((save.xp - stageInfo.minXp) / (stageInfo.nextXp - stageInfo.minXp)) * 100,
        ),
      )
    : 100;

  const unlockedCount = Object.keys(save.achievements).length;
  const ageMinutes = Math.max(1, Math.floor((Date.now() - save.bornAt) / 60000));
  const ageLabel =
    ageMinutes >= 1440
      ? `${Math.floor(ageMinutes / 1440)}d ${Math.floor((ageMinutes % 1440) / 60)}h`
      : ageMinutes >= 60
        ? `${Math.floor(ageMinutes / 60)}h ${ageMinutes % 60}m`
        : `${ageMinutes}m`;

  const topSleepApp = Object.entries(save.stats.appSleepCounts).sort(
    (a, b) => b[1] - a[1],
  )[0]?.[0];

  // Mini animated portrait inside the HUD header (low-overhead ~5.5 FPS)
  useEffect(() => {
    let t = 0;
    const render = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }
      const canvas = portraitRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.save();
          const scale =
            save.stage === 'grown_cat'
              ? 0.34
              : save.stage === 'young_cat'
                ? 0.37
                : 0.42;
          ctx.scale(scale, scale);
          drawPixelCat(ctx, {
            x: 6,
            y: 4,
            facing: 1,
            stage: save.stage,
            coat: save.coat,
            accessory: save.equippedAccessory,
            state: 'sit',
            animTime: t,
            pixelScale: 6,
          });
          ctx.restore();
        }
      }
      t += 0.16;
    };
    render();
    const timer = window.setInterval(render, 180);
    return () => window.clearInterval(timer);
  }, [save.stage, save.coat, save.equippedAccessory]);

  const formatClock = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const hudTheme = save.settings.hudTheme ?? 'lavender';
  const themeClass =
    hudTheme === 'midnight_plum'
      ? 'hud-drawer--midnight'
      : hudTheme === 'blossom'
        ? 'hud-drawer--blossom'
        : hudTheme === 'parchment'
          ? 'hud-drawer--parchment'
          : '';

  return (
    <aside
      className={[
        'hud-drawer',
        standalone ? 'hud-drawer--standalone' : '',
        themeClass,
      ]
        .filter(Boolean)
        .join(' ')}
      style={standalone ? undefined : { left: `${Math.round(x)}px`, top: `${Math.round(y)}px` }}
      aria-label="Kitten Progress HUD"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <header
        className="hud-header"
        data-tauri-drag-region={standalone ? true : undefined}
        onMouseDown={(e) => {
          if (!standalone || e.button !== 0) return;
          const target = e.target as HTMLElement | null;
          if (target?.closest('input, button')) return;
          if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
            void getCurrentWindow().startDragging().catch(() => {});
          }
        }}
      >
        <div className="hud-portrait" data-tauri-drag-region={standalone ? true : undefined}>
          <canvas ref={portraitRef} width={50} height={46} />
        </div>
        <div className="hud-title-block" data-tauri-drag-region={standalone ? true : undefined}>
          <div className="hud-name-row">
            <input
              className="hud-name-input"
              value={save.name}
              maxLength={14}
              aria-label="Cat Name"
              onMouseDown={(e) => e.stopPropagation()}
              onChange={(e) => onRename(e.target.value)}
              onBlur={() => {
                if (!save.name.trim()) onRename('Mochi');
              }}
            />
            <span className="hud-stage-pill">{stageInfo.label}</span>
          </div>
          <div className="hud-meta-line" data-tauri-drag-region={standalone ? true : undefined}>
            Age {ageLabel} · {Math.floor(save.xp)} XP · {unlockedCount}/{ACHIEVEMENTS.length} Achievements
          </div>
        </div>
        <button
          type="button"
          className="hud-close-btn"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onClose}
          title="Close HUD (or middle-click cat)"
          aria-label="Close HUD"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      </header>

      {/* 4 Progress Bars */}
      <section className="bars-panel" aria-label="Progress Bars">
        <div className="bar-item">
          <div className="bar-label-row">
            <span>Growth</span>
            <span className="bar-val">
              {stageInfo.nextXp
                ? `${Math.floor(save.xp)}/${stageInfo.nextXp}`
                : `${Math.floor(save.xp)} MAX`}
            </span>
          </div>
          <div className="bar-track">
            <div className="bar-fill bar-fill--growth" style={{ width: `${growthPct}%` }} />
          </div>
        </div>

        <div className="bar-item">
          <div className="bar-label-row">
            <span>Bond</span>
            <span className="bar-val">{Math.round(save.bond)}%</span>
          </div>
          <div className="bar-track">
            <div className="bar-fill bar-fill--bond" style={{ width: `${Math.round(save.bond)}%` }} />
          </div>
        </div>

        <div className="bar-item">
          <div className="bar-label-row">
            <span>Energy</span>
            <span className="bar-val">{Math.round(save.energy)}%</span>
          </div>
          <div className="bar-track">
            <div className="bar-fill bar-fill--energy" style={{ width: `${Math.round(save.energy)}%` }} />
          </div>
        </div>

        <div className="bar-item">
          <div className="bar-label-row">
            <span>Treats</span>
            <span className="bar-val">{Math.round(save.treats)}%</span>
          </div>
          <div className="bar-track">
            <div className="bar-fill bar-fill--treats" style={{ width: `${Math.round(save.treats)}%` }} />
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <nav className="hud-tabs" aria-label="HUD Sections">
        <button
          type="button"
          className={`hud-tab-btn ${tab === 'timeline' ? 'hud-tab-btn--active' : ''}`}
          onClick={() => setTab('timeline')}
        >
          <Clock size={14} />
          <span>Timeline</span>
        </button>
        <button
          type="button"
          className={`hud-tab-btn ${tab === 'achievements' ? 'hud-tab-btn--active' : ''}`}
          onClick={() => setTab('achievements')}
        >
          <Award size={14} />
          <span>Achievements</span>
        </button>
        <button
          type="button"
          className={`hud-tab-btn ${tab === 'wardrobe' ? 'hud-tab-btn--active' : ''}`}
          onClick={() => setTab('wardrobe')}
        >
          <Palette size={14} />
          <span>Coat</span>
        </button>
        <button
          type="button"
          className={`hud-tab-btn ${tab === 'play' ? 'hud-tab-btn--active' : ''}`}
          onClick={() => setTab('play')}
        >
          <Gamepad2 size={14} />
          <span>Play</span>
        </button>
        <button
          type="button"
          className={`hud-tab-btn ${tab === 'settings' ? 'hud-tab-btn--active' : ''}`}
          onClick={() => setTab('settings')}
        >
          <Settings size={14} />
          <span>Config</span>
        </button>
        <button
          type="button"
          className={`hud-tab-btn ${tab === 'developer' ? 'hud-tab-btn--active' : ''}`}
          onClick={() => setTab('developer')}
        >
          <Code2 size={14} />
          <span>About</span>
        </button>
      </nav>

      {/* Tab Body */}
      <div className="hud-body">
        {tab === 'timeline' && (
          <>
            <div className="polaroid-section">
              <div className="polaroid-header">
                <span className="section-label">Polaroid Scrapbook ({save.memories?.length ?? 0}/12)</span>
                <button
                  type="button"
                  className="pixel-btn pixel-btn--primary"
                  style={{ padding: '3px 7px', fontSize: '10px' }}
                  onClick={() => onSnapMemory?.()}
                >
                  <Camera size={12} />
                  <span>Snap</span>
                </button>
              </div>
              {(save.memories?.length ?? 0) > 0 ? (
                <div className="polaroid-grid">
                  {(save.memories ?? []).map((mem) => (
                    <div key={mem.id} className="polaroid-card">
                      {onDeleteMemory && (
                        <button
                          type="button"
                          className="polaroid-del"
                          aria-label="Delete memory"
                          onClick={() => onDeleteMemory(mem.id)}
                        >
                          <X size={10} />
                        </button>
                      )}
                      <div className="polaroid-frame">
                        <PolaroidThumb memory={mem} />
                      </div>
                      <div className="polaroid-caption" title={mem.caption}>{mem.caption}</div>
                      <div className="polaroid-meta">{formatClock(mem.timestamp)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="timeline-detail">
                  No snapshots yet — press Snap to save a cute desktop Polaroid!
                </div>
              )}
            </div>

            <div className="polaroid-section">
              <div className="polaroid-header">
                <span className="section-label">
                  Love Jar ({save.savedNotes?.length ?? 0}) 💜
                </span>
              </div>
              {(save.savedNotes?.length ?? 0) > 0 ? (
                <div className="love-jar-list">
                  {(save.savedNotes ?? []).map((note) => (
                    <div key={note.id} className="love-jar-item">
                      <span>{note.text}</span>
                      {onDeleteSavedNote && (
                        <button
                          type="button"
                          className="love-jar-del"
                          aria-label="Remove saved note"
                          onClick={() => onDeleteSavedNote(note.id)}
                        >
                          <X size={11} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="timeline-detail">
                  Tap &ldquo;Save ♥&rdquo; on Akii&apos;s desktop notes to keep your favorites here!
                </div>
              )}
            </div>

            {save.timeline.map((entry) => (
              <div key={entry.id} className="timeline-item">
                <span className={`timeline-dot timeline-dot--${entry.kind}`} />
                <div>
                  <div className="timeline-title">{entry.title}</div>
                  <div className="timeline-detail">{entry.detail}</div>
                  <div className="timeline-time">
                    {formatClock(entry.timestamp)} · {STAGE_THRESHOLDS[entry.stage].label}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'achievements' && (
          <>
            <div className="star-jar-banner">
              <div>
                <div className="section-label" style={{ marginBottom: 0 }}>
                  Lavender Star Jar
                </div>
                <div className="timeline-detail">
                  Earned from Focus Naps &amp; butterfly boops
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className={`pixel-btn ${(save.starJarCount ?? 0) >= 5 ? 'pixel-btn--primary' : ''}`}
                  disabled={(save.starJarCount ?? 0) < 5}
                  onClick={() => onMakeJarWish?.()}
                  title="Spend 5 collected stars for a cosmic wish (+18 XP, +5 Bond, +15 Energy/Treats)"
                >
                  <Sparkles size={13} />
                  <span>Wish (5 ★)</span>
                </button>
                <span className="star-jar-count">
                  ★ {save.starJarCount ?? 0}
                </span>
              </div>
            </div>

            <div>
              <div className="section-label">
                Keepsake Shelf ({save.mementos?.length ?? 0}/{MEMENTO_DEFS.length})
              </div>
              <div className="memento-grid">
                {MEMENTO_DEFS.map((mem) => {
                  const unlocked = (save.mementos ?? []).includes(mem.id);
                  return (
                    <div
                      key={mem.id}
                      title={unlocked ? mem.description : `Keep playing to discover: ${mem.title}`}
                      className={`memento-chip ${unlocked ? 'memento-chip--unlocked' : 'memento-chip--locked'}`}
                    >
                      <span className="memento-icon">{unlocked ? mem.icon : '❔'}</span>
                      <span className="memento-name">{unlocked ? mem.title : '???'}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="section-label" style={{ marginTop: '2px' }}>
              Achievements
            </div>
            {ACHIEVEMENTS.map((def) => {
              const unlockedAt = save.achievements[def.id];
              const progress = Math.min(def.target, Math.floor(getAchievementProgress(save, def)));
              const pct = Math.min(100, (progress / def.target) * 100);
              return (
                <div
                  key={def.id}
                  className={`ach-item ${unlockedAt ? 'ach-item--unlocked' : ''}`}
                >
                  <div className="ach-top">
                    <span className="ach-title">
                      {unlockedAt ? <Sparkles size={13} /> : <Lock size={12} />}
                      {def.title}
                    </span>
                    <span className={`ach-badge ${unlockedAt ? 'ach-badge--done' : ''}`}>
                      {unlockedAt ? 'DONE' : `${progress}/${def.target}`}
                    </span>
                  </div>
                  <div className="timeline-detail">{def.description}</div>
                  {def.rewardLabel && (
                    <div className="ach-reward">Reward: {def.rewardLabel}</div>
                  )}
                  {!unlockedAt && (
                    <div className="bar-track" style={{ height: '6px' }}>
                      <div className="bar-fill bar-fill--growth" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {tab === 'wardrobe' && (
          <>
            <div>
              <div className="section-label">Coat Pattern</div>
              <div className="swatch-grid">
                {(Object.keys(COAT_PALETTES) as CoatId[]).map((cid) => {
                  const p = COAT_PALETTES[cid];
                  return (
                    <button
                      key={cid}
                      type="button"
                      className={`swatch-btn ${save.coat === cid ? 'swatch-btn--active' : ''}`}
                      onClick={() => onSelectCoat(cid)}
                    >
                      <span className="swatch-chip" style={{ background: p.body }} />
                      <span>{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="section-label">Accessories (Unlock via Badges)</div>
              <div className="swatch-grid">
                {(Object.keys(ACCESSORY_META) as AccessoryId[]).map((aid) => {
                  const meta = ACCESSORY_META[aid];
                  const unlocked = save.unlockedAccessories.includes(aid);
                  return (
                    <button
                      key={aid}
                      type="button"
                      disabled={!unlocked}
                      title={meta.hint}
                      className={`swatch-btn ${save.equippedAccessory === aid ? 'swatch-btn--active' : ''}`}
                      onClick={() => onEquipAccessory(aid)}
                    >
                      {unlocked ? <Heart size={12} /> : <Lock size={12} />}
                      <span>{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {tab === 'play' && (
          <>
            <div className="action-grid">
              <button
                type="button"
                className="pixel-btn pixel-btn--primary"
                onClick={() => onTossToy('yarn')}
              >
                <Sparkles size={14} />
                <span>Toss Yarn</span>
              </button>
              <button
                type="button"
                className={`pixel-btn ${teaseYarnActive ? 'pixel-btn--primary' : ''}`}
                onClick={() => onToggleTeaseYarn?.()}
                title="Dangle yarn under your cursor so kitten stands up to catch it!"
              >
                <Hand size={14} />
                <span>{teaseYarnActive ? 'Drop Yarn' : 'Hold Yarn'}</span>
              </button>
              <button
                type="button"
                className="pixel-btn pixel-btn--primary"
                onClick={() => onTossToy('fish')}
              >
                <Fish size={14} />
                <span>Toss Fish</span>
              </button>
              <button
                type="button"
                className="pixel-btn pixel-btn--primary"
                onClick={() => onTossToy('macaron')}
              >
                <Cookie size={14} />
                <span>Toss Macaron</span>
              </button>
              <button
                type="button"
                className="pixel-btn pixel-btn--primary"
                onClick={() => onTossToy('boba')}
              >
                <Sparkles size={14} />
                <span>Toss Boba</span>
              </button>
              <button
                type="button"
                className="pixel-btn pixel-btn--primary"
                onClick={() => onTossToy('cake')}
              >
                <Heart size={14} />
                <span>Toss Cake</span>
              </button>
              <button
                type="button"
                className="pixel-btn pixel-btn--primary"
                onClick={() => onTossToy('ube_icecream')}
              >
                <Sparkles size={14} />
                <span>Ube Cone</span>
              </button>
              <button
                type="button"
                className="pixel-btn pixel-btn--primary"
                onClick={() => onTossToy('star_kibble')}
              >
                <Star size={14} />
                <span>Star Kibble</span>
              </button>
              <button
                type="button"
                className="pixel-btn pixel-btn--primary"
                onClick={() => onTossToy('croissant')}
              >
                <Cookie size={14} />
                <span>Croissant</span>
              </button>
            </div>

            <div className="action-grid">
              <button
                type="button"
                className="pixel-btn"
                onClick={() => onPokeKitten?.()}
              >
                <Pointer size={14} />
                <span>Poke Kitten</span>
              </button>
              <button
                type="button"
                className="pixel-btn"
                onClick={() => onClearYarn?.()}
                title="Make all yarn balls disappear"
              >
                <Eraser size={14} />
                <span>Clear Yarn</span>
              </button>
              <button
                type="button"
                className={`pixel-btn ${laserActive ? 'pixel-btn--primary' : ''}`}
                onClick={() => onToggleLaser?.()}
                title="Turn your cursor into a glowing violet laser dot to chase!"
              >
                <Wand2 size={14} />
                <span>{laserActive ? 'Laser Off' : 'Violet Laser'}</span>
              </button>
              <button
                type="button"
                className={`pixel-btn ${featherWandActive ? 'pixel-btn--primary' : ''}`}
                onClick={() => onToggleFeatherWand?.()}
                title="Spawn a feather ribbon wand (drag with cursor to play; auto-removes after 10s idle)"
              >
                <Feather size={14} />
                <span>Feather Wand</span>
              </button>
              <button
                type="button"
                className={`pixel-btn ${cushionActive ? 'pixel-btn--primary' : ''}`}
                onClick={() => onToggleCushion?.()}
                title="Spawn or remove a cozy lavender cushion on your desktop"
              >
                <Moon size={14} />
                <span>{cushionActive ? 'Hide Cushion' : 'Cat Cushion'}</span>
              </button>
              <button
                type="button"
                className={`pixel-btn ${plantActive ? 'pixel-btn--primary' : ''}`}
                onClick={() => onTogglePlant?.()}
                title="Place or remove a blooming potted lavender plant on your desktop"
              >
                <Flower2 size={14} />
                <span>{plantActive ? 'Hide Plant' : 'Lavender Pot'}</span>
              </button>
              <button
                type="button"
                className={`pixel-btn ${brushActive ? 'pixel-btn--primary' : ''}`}
                onClick={() => onToggleBrush?.()}
                title="Brush head/back for glossy purrs, or brush tummy for bunny kicks!"
              >
                <Sparkles size={14} />
                <span>{brushActive ? 'Put Brush Away' : 'Star Brush'}</span>
              </button>
              <button
                type="button"
                className="pixel-btn"
                onClick={() => onDoTrick?.()}
                title="Ask your kitten to perform a pirouette, high five, or flip!"
              >
                <Star size={14} />
                <span>Do a Trick</span>
              </button>
              <button
                type="button"
                className="pixel-btn"
                onClick={() => onSpawnBubbles?.()}
                title="Blow pastel lavender soap bubbles for you & your kitten to pop!"
              >
                <Heart size={14} />
                <span>Soap Bubbles</span>
              </button>
              <button
                type="button"
                className={`pixel-btn ${giftBoxActive ? 'pixel-btn--primary' : ''}`}
                onClick={() => onToggleGiftBox?.()}
                title="Place a purple gift box for peekaboo ambushes (drag to move, click to pop out!)"
              >
                <Gift size={14} />
                <span>{giftBoxActive ? 'Hide Box' : 'Gift Box'}</span>
              </button>
              <button
                type="button"
                className={`pixel-btn ${lanternActive ? 'pixel-btn--primary' : ''}`}
                onClick={() => onToggleLantern?.()}
                title="Place a Moonlight Lantern (click to toggle glow, drag to move, right-click to remove)"
              >
                <Moon size={14} />
                <span>{lanternActive ? 'Hide Lantern' : 'Moon Lantern'}</span>
              </button>
              <button
                type="button"
                className="pixel-btn"
                onClick={() => onSummonShootingStar?.()}
                title="Summon a streaking shooting star across the sky — click it to make a wish!"
              >
                <Star size={14} />
                <span>Shooting Star</span>
              </button>
              <button
                type="button"
                className="pixel-btn"
                onClick={() => onSnapMemory?.()}
                title="Save a cute Polaroid snapshot to your Scrapbook!"
              >
                <Camera size={14} />
                <span>Snap Polaroid</span>
              </button>
            </div>

            <button type="button" className="pixel-btn" onClick={onToggleFocus}>
              <Timer size={14} />
              <span>
                {focus.active
                  ? `Stop Focus Nap (${Math.ceil(focus.remainingSeconds / 60)}m)`
                  : `Start ${save.settings.focusMinutes}m Focus Nap`}
              </span>
            </button>

            <div className="section-label" style={{ marginTop: '4px' }}>
              Lifetime Stats
            </div>
            <div className="stats-grid">
              <div className="stat-cell">
                <div className="stat-cell-label">Distance Patrolled</div>
                <div className="stat-cell-val">
                  {(save.stats.distancePx / 380).toFixed(1)} m
                </div>
              </div>
              <div className="stat-cell">
                <div className="stat-cell-label">Titlebar Jumps</div>
                <div className="stat-cell-val">{save.stats.jumpsCount}</div>
              </div>
              <div className="stat-cell">
                <div className="stat-cell-label">Cursors Caught</div>
                <div className="stat-cell-val">{save.stats.cursorsCaught}</div>
              </div>
              <div className="stat-cell">
                <div className="stat-cell-label">Pets / Pokes</div>
                <div className="stat-cell-val">
                  {save.stats.petsReceived} / {save.stats.pokesCount ?? 0}
                </div>
              </div>
              <div className="stat-cell">
                <div className="stat-cell-label">Yarn Catches</div>
                <div className="stat-cell-val">{save.stats.yarnCatches ?? 0}</div>
              </div>
              <div className="stat-cell">
                <div className="stat-cell-label">Tricks / Bubbles</div>
                <div className="stat-cell-val">
                  {save.stats.tricksPerformed ?? 0} / {save.stats.bubblesPopped ?? 0}
                </div>
              </div>
              <div className="stat-cell">
                <div className="stat-cell-label">Box Ambushes</div>
                <div className="stat-cell-val">{save.stats.boxAmbushes ?? 0}</div>
              </div>
              <div className="stat-cell">
                <div className="stat-cell-label">Wishes / Lantern Naps</div>
                <div className="stat-cell-val">
                  {save.stats.wishesMade ?? 0} / {save.stats.lanternNaps ?? 0}
                </div>
              </div>
              <div className="stat-cell">
                <div className="stat-cell-label">Favorite Window</div>
                <div className="stat-cell-val" style={{ fontSize: '11px' }}>
                  {topSleepApp ?? 'Taskbar'}
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 'settings' && (
          <>
            <div className="setting-card">
              <div className="section-label">Your Name (Greeting)</div>
              <input
                type="text"
                maxLength={24}
                value={save.settings.userName ?? 'Jane'}
                placeholder="Jane"
                onChange={(e) => onUpdateSettings({ userName: e.target.value })}
                onBlur={(e) => {
                  const trimmed = e.target.value.trim();
                  onUpdateSettings({ userName: trimmed || 'Jane' });
                }}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '12px',
                  fontFamily: 'inherit',
                  background: 'var(--bg-parchment)',
                  color: 'var(--ink-primary)',
                  border: '2px solid var(--border-pixel)',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div className="setting-card">
              <div className="bar-label-row">
                <span className="section-label" style={{ marginBottom: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  {save.settings.soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
                  Sound Effects (SFX)
                </span>
                {save.settings.soundEnabled && (
                  <span className="bar-val">{Math.round(save.settings.volume * 100)}%</span>
                )}
              </div>
              <div className="seg-group">
                <button
                  type="button"
                  className={`seg-btn ${save.settings.soundEnabled ? 'seg-btn--active' : ''}`}
                  onClick={() => onUpdateSettings({ soundEnabled: true })}
                >
                  SFX On
                </button>
                <button
                  type="button"
                  className={`seg-btn ${!save.settings.soundEnabled ? 'seg-btn--active' : ''}`}
                  onClick={() => onUpdateSettings({ soundEnabled: false })}
                >
                  SFX Off
                </button>
              </div>
              {save.settings.soundEnabled && (
                <>
                  <input
                    type="range"
                    min={0.05}
                    max={0.8}
                    step={0.05}
                    aria-label="SFX Volume"
                    value={save.settings.volume}
                    onChange={(e) =>
                      onUpdateSettings({ volume: parseFloat(e.target.value) })
                    }
                  />
                  <div className="seg-group">
                    <button
                      type="button"
                      className={`seg-btn ${(save.settings.soundStyle ?? 'chiptune') === 'chiptune' ? 'seg-btn--active' : ''}`}
                      onClick={() => onUpdateSettings({ soundStyle: 'chiptune' })}
                    >
                      Retro Chiptune
                    </button>
                    <button
                      type="button"
                      className={`seg-btn ${save.settings.soundStyle === 'music_box' ? 'seg-btn--active' : ''}`}
                      onClick={() => onUpdateSettings({ soundStyle: 'music_box' })}
                    >
                      Music Box
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="setting-card">
              <div className="section-label">HUD Theme</div>
              <div className="seg-group seg-group--4">
                <button
                  type="button"
                  className={`seg-btn ${hudTheme === 'lavender' ? 'seg-btn--active' : ''}`}
                  onClick={() => onUpdateSettings({ hudTheme: 'lavender' })}
                >
                  Lavender
                </button>
                <button
                  type="button"
                  className={`seg-btn ${hudTheme === 'midnight_plum' ? 'seg-btn--active' : ''}`}
                  onClick={() => onUpdateSettings({ hudTheme: 'midnight_plum' })}
                >
                  Midnight Plum
                </button>
                <button
                  type="button"
                  className={`seg-btn ${hudTheme === 'blossom' ? 'seg-btn--active' : ''}`}
                  onClick={() => onUpdateSettings({ hudTheme: 'blossom' })}
                >
                  Blossom
                </button>
                <button
                  type="button"
                  className={`seg-btn ${hudTheme === 'parchment' ? 'seg-btn--active' : ''}`}
                  onClick={() => onUpdateSettings({ hudTheme: 'parchment' })}
                >
                  Parchment
                </button>
              </div>

              <div className="section-label" style={{ marginTop: '4px' }}>
                Click on Kitten
              </div>
              <div className="seg-group">
                <button
                  type="button"
                  className={`seg-btn ${(save.settings.clickAction ?? 'poke') === 'poke' ? 'seg-btn--active' : ''}`}
                  onClick={() => onUpdateSettings({ clickAction: 'poke' })}
                >
                  Poke / Boop
                </button>
                <button
                  type="button"
                  className={`seg-btn ${save.settings.clickAction === 'pet' ? 'seg-btn--active' : ''}`}
                  onClick={() => onUpdateSettings({ clickAction: 'pet' })}
                >
                  Gentle Pet
                </button>
              </div>
            </div>

            <div className="setting-card">
              <label className="toggle-row">
                <span>Allow Cursor-Hold Pounces</span>
                <input
                  type="checkbox"
                  checked={save.settings.cursorHoldEnabled}
                  onChange={(e) =>
                    onUpdateSettings({ cursorHoldEnabled: e.target.checked })
                  }
                />
              </label>

              <div className="section-label">Cursor-Hold Mode</div>
              <div className="seg-group">
                <button
                  type="button"
                  className={`seg-btn ${save.settings.cursorHoldMode === 'real_tug' ? 'seg-btn--active' : ''}`}
                  onClick={() => onUpdateSettings({ cursorHoldMode: 'real_tug' })}
                >
                  Real Tug (Esc/Shake)
                </button>
                <button
                  type="button"
                  className={`seg-btn ${save.settings.cursorHoldMode === 'visual_only' ? 'seg-btn--active' : ''}`}
                  onClick={() => onUpdateSettings({ cursorHoldMode: 'visual_only' })}
                >
                  Visual Paw Grab
                </button>
              </div>
            </div>

            <div className="setting-card">
              <div className="bar-label-row">
                <span className="section-label" style={{ marginBottom: 0 }}>
                  Cat Sprite Size
                </span>
                <span className="bar-val">
                  {save.settings.spriteScale ?? 6}x (
                  {getStageDimensions(save.stage, save.settings.spriteScale).width}×
                  {getStageDimensions(save.stage, save.settings.spriteScale).height} px)
                </span>
              </div>
              <input
                type="range"
                min={2}
                max={9}
                step={1}
                aria-label="Cat Sprite Size"
                value={save.settings.spriteScale ?? 6}
                onChange={(e) =>
                  onUpdateSettings({ spriteScale: parseInt(e.target.value, 10) })
                }
              />
            </div>

            <div className="setting-card">
              <div className="section-label">Growth Pace</div>
              <div className="seg-group seg-group--3">
                <button
                  type="button"
                  className={`seg-btn ${(save.settings.growthPace ?? 'very_slow') === 'very_slow' ? 'seg-btn--active' : ''}`}
                  onClick={() => onUpdateSettings({ growthPace: 'very_slow' })}
                >
                  Very Slow
                </button>
                <button
                  type="button"
                  className={`seg-btn ${save.settings.growthPace === 'normal' ? 'seg-btn--active' : ''}`}
                  onClick={() => onUpdateSettings({ growthPace: 'normal' })}
                >
                  Normal
                </button>
                <button
                  type="button"
                  className={`seg-btn ${save.settings.growthPace === 'fast' ? 'seg-btn--active' : ''}`}
                  onClick={() => onUpdateSettings({ growthPace: 'fast' })}
                >
                  Fast (3.5x)
                </button>
              </div>
            </div>

            <div className="setting-card">
              <label className="toggle-row">
                <span>Study Buddy (Quiet on Busy Input)</span>
                <input
                  type="checkbox"
                  checked={save.settings.studyBuddyEnabled}
                  onChange={(e) =>
                    onUpdateSettings({ studyBuddyEnabled: e.target.checked })
                  }
                />
              </label>
              <label className="toggle-row">
                <span>Late-Night Sleepy Mode (11 PM+)</span>
                <input
                  type="checkbox"
                  checked={save.settings.lateNightEnabled}
                  onChange={(e) =>
                    onUpdateSettings({ lateNightEnabled: e.target.checked })
                  }
                />
              </label>
              <label className="toggle-row">
                <span>Sweet Care Whispers &amp; Akii Notes</span>
                <input
                  type="checkbox"
                  checked={save.settings.careWhispersEnabled ?? true}
                  onChange={(e) =>
                    onUpdateSettings({ careWhispersEnabled: e.target.checked })
                  }
                />
              </label>
            </div>

            {onReplayIntro && (
              <button
                type="button"
                className="pixel-btn"
                onClick={onReplayIntro}
              >
                <Sparkles size={14} />
                <span>Replay Gift Intro</span>
              </button>
            )}

            <button
              type="button"
              className="pixel-btn"
              onClick={onResetKitten}
              style={{ color: '#9f2323' }}
            >
              Adopt New Tiny Kitten (Reset)
            </button>
          </>
        )}

        {tab === 'developer' && (
          <>
            <div className="setting-card">
              <div className="section-label">About</div>
              <p className="timeline-detail">
                Kitty Night v1.0.0
              </p>
              <p className="timeline-detail">
                Developed by: Akii 😸✨
              </p>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  marginTop: '8px',
                }}
              >
                <div
                  className="timeline-detail"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-label="Discord"
                  >
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                  <span>aki.hiko</span>
                </div>
                <div
                  className="timeline-detail"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-label="GitHub"
                  >
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                  <span>akiistaken</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="pixel-btn"
              onClick={() => onExitApp?.()}
              style={{ color: '#9f2323' }}
            >
              <Power size={14} />
              <span>Exit Application</span>
            </button>
          </>
        )}
      </div>

      <footer className="hud-footer-hint">
        <span>Mid-click: HUD · Drag yarn: tease</span>
        <span>Tap: poke · Rub: pet</span>
      </footer>
    </aside>
  );
};
