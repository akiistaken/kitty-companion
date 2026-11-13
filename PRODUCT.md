# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Tauri v2 (Rust Win32 overlay backend + TypeScript / HTML5 Canvas pixel-art renderer & HUD UI)

## Users

Desktop users (Windows primary target, multi-monitor capable) who want a playful, interactive pixel-art cat companion living directly on their workspace rather than confined inside a separate app window.

## Product Purpose

Kitten is an interactive, transparent, always-on-top desktop overlay pet. Starting as a tiny pixel kitten, it explores the screen with real gravity, treats the Windows taskbar as its ground floor, jumps up onto and down from open window titlebars, walks or lies down above windows, plays with and holds the cursor, and grows through life stages into an adult cat based on activity and user interactions—with progress bars, a life timeline, and achievements.

## Positioning

Unlike isolated virtual-pet windows or flat bottom-bar sprites, Kitten inhabits the user's live window hierarchy—jumping onto, walking along, and sleeping on actual window titlebars while turning everyday computer sessions into a persistent, milestone-and-achievement-driven life story.

## Operating Context

- Runs as a transparent, always-on-top desktop overlay spanning the virtual desktop (multi-monitor aware).
- Empty overlay areas are click-through; hovering or interacting with the avatar or open HUD intercepts input cleanly.
- **Middle-mouse click on the avatar** toggles the compact HUD showing progress bars and tabs/drawers for the Life Timeline, Achievements, Coat & Accessories, Toys/Treats, Focus Mode, and Settings.
- System tray icon provides backup controls (show/hide HUD, toss toy/treat, Focus/Nap mode, quit).

## Capabilities and Constraints

- **Gravity & Multi-Monitor Taskbar Ground**: Real vertical gravity and landing physics; the taskbar/work-area floor of each monitor is always the ground floor, and the cat crosses seamlessly across monitors.
- **Window & Titlebar Platforming**: Queries visible OS window bounds and Z-order (`DWMWA_CLOAKED`, `DWMWA_EXTENDED_FRAME_BOUNDS`) without reading window contents or keystrokes. Kitten jumps up onto titlebars, walks/loafs above windows, and hops/falls down between stacked windows and the taskbar.
- **Cursor Interaction ("Hold the Cursor")**: Stalks, pounces, and holds the cursor—supporting a toggle between **Real Tug** (gentle anchor/tug with instant shake, click, or `Esc` escape) and **Visual Paw-Grab** (sprite grabs a visual cursor prop while the real cursor stays free).
- **Middle-Click Progress HUD**: Middle-clicking the cat toggles the progress bars HUD (Growth/Life XP, Bond/Affection, Energy/Zoomies, Treats/Hunger) plus access to Life Timeline, Achievements, Coats/Accessories, Toys/Treats, Focus Timer, and Settings.
- **Growth Stages, Life Timeline & Achievements**:
  - 4 pixel-scaled life stages: **Tiny Kitten** → **Junior Kitten** → **Young Cat** → **Grown Cat** (with Normal and Fast/Demo pace toggle).
  - Chronological **Life Timeline** recording milestones, growth transitions, and memorable events.
  - **Achievements** system tracking badges, progress, timestamps, and unlocked accessories.
- **App-Aware Reactions** *(title/bounds/activity rate only — zero content or keylogging)*:
  - Music/video window open → bobs head to a gentle beat on that titlebar.
  - Late night → yawns more, curls into a tighter sleep ball, shows pixel moon/`Zzz` bubble.
  - Busy typing/fast mouse → settles into a quiet "study buddy" loaf nearby instead of grabbing the cursor.
- **Tossable Pixel Toys & Treats**: Yarn ball and fish treats bounce off real window edges and titlebars with gravity; the cat chases, bats, or eats them.
- **Micro-Feedback**: Fading pixel paw prints, floating pixel hearts on pets, dust puffs on landings, and optional chiptune purr/mew WebAudio SFX (muted or adjustable volume).
- **Coat & Accessory Customization**: Choose or roll initial coat (**Tuxedo**, **Calico**, **Ginger Tabby**, **Void Black**, **Siamese**, **Gray Striped**) and equip accessories unlocked via milestones/achievements (Red Collar, Tiny Scarf, Leaf Hat, Sunglasses, Golden Bell).
- **Focus / Pomodoro Companion**: Optional 25-minute focus timer where the cat curls up and naps on the active window with a subtle progress ring, then stretches and celebrates on completion.
- **Art Direction**: Pure 16×16 / 24×24 retro pixel art scaled crisply (`imageSmoothingEnabled = false`, 3×–4× integer scaling) with a matching crisp retro pixel HUD.

## Product Principles

1. **Playful, never obstructive**: Click-through outside the pet/HUD, safe cursor-hold with instant override, and Focus/Study-buddy awareness so work always comes first.
2. **Physical desktop world**: Real gravity, taskbar ground, and window titlebars as jumpable platforms make the OS itself the playground.
3. **Visible growth, memory & achievement**: Every interaction feeds progress bars, unlocks achievements/accessories, and enriches a lasting life timeline.
4. **Featherweight footprint**: Minimal idle CPU/RAM and clean local JSON persistence so Kitten can stay open all day.
