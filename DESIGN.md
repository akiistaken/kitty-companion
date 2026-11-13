# Design System

## Aesthetic Direction

Crisp retro desktop pixel-art companion: integer-scaled pixel sprites (`imageSmoothingEnabled = false`, configurable `2×–9×` scale, default `6×`) living directly over live OS windows, paired with a warm parchment-and-espresso pixel-framed HUD & Config window (`"hud"`) that opens on middle-click.

## Color Roles

| Role | Token | Hex | Usage |
|---|---|---|---|
| Ground / Parchment | `--bg-parchment` | `#f6f0e2` | Primary HUD drawer background |
| Elevated Card | `--bg-card` | `#fffaf0` | Progress bar panel, timeline items, swatches, stat cells |
| Inset / Track | `--bg-inset` | `#ebe2cf` | HUD header, tab strip, progress bar tracks, footer |
| Primary Ink | `--ink-primary` | `#1e1714` | Primary text, 2px stepped pixel borders, stage badges |
| Muted Ink | `--ink-muted` | `#615349` | Timestamps, secondary metadata, tab inactive labels |
| Soft Border | `--border-soft` | `#cbbda6` | Internal list item and swatch borders |
| Growth Accent | `--accent-amber` | `#d4622a` | Growth XP bar, active tab underline, primary action buttons |
| Bond Accent | `--accent-bond` | `#c84b6b` | Bond/Affection bar, achievement timeline dot |
| Energy Accent | `--accent-energy` | `#3a7d44` | Energy/Zoomies bar, completed achievement badges |
| Treats Accent | `--accent-treats` | `#2c66b8` | Treats/Tummy bar |
| Milestone Gold | `--accent-gold` | `#c9921a` | Evolution timeline dot |

## Typography

- **UI Body**: `'Segoe UI', system-ui, -apple-system, sans-serif` (`13px`, `1.4` line-height).
- **Monospace Data & Pixel Labels**: `'Cascadia Mono', Consolas, monospace` with `font-variant-numeric: tabular-nums` for XP counters, progress percentages, timers, and timestamps.

## Pixel Art & Motion Rules

- Canvas rendering enforces `ctx.imageSmoothingEnabled = false` and `image-rendering: pixelated`.
- Cat sprites use distinct pixel-grid silhouettes per life stage (`16×14` Tiny Kitten, `18×16` Junior Kitten, `20×18` Young Cat, `22×20` Grown Cat logical pixels, integer-scaled `2×–9×`, defaulting to `6×` / `96×84`–`132×120`).
- Progress bar transitions use stepped animation (`transition: width 160ms steps(8)`).
- Transparent `"overlay"` defaults to click-through (`WS_EX_TRANSPARENT`) outside the cat and active toys; the Progress HUD & Config lives in a separate focusable `"hud"` window (`index.html?view=hud`) so all tabs and controls remain natively clickable.
