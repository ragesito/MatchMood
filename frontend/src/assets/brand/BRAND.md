# MatchMood — Brand system

Terminal-meets-esports identity for a real-time 1v1 coding arena.
Positioning line: **"Code is the new résumé."**

## Logo

The mark is a **versus glyph**: two opposing code brackets (`>` `<`) meeting at a
terminal cursor. It reads simultaneously as *code*, *duel*, and *blinking prompt*.

- `favicon.svg` — mark on a rounded near-black tile (browser tab / app icon).
- `logo-mark.svg` — transparent mark, for use on dark surfaces.
- In-app it is inlined in the landing header, modal, footer and final CTA so the
  cursor can blink and the strokes can inherit brand color.

**Clear space:** keep at least the width of one bracket around the mark.
**Don't:** recolor the two brackets to the same hue (the lime-vs-magenta split
*is* the concept), stretch, or add effects.

## Color

| Token   | Hex       | Role                                   |
|---------|-----------|----------------------------------------|
| lime    | `#C6FF3D` | brand / "you" / primary CTA            |
| magenta | `#FF3D77` | opponent / versus / danger             |
| green   | `#22C55E` | pass / success (ties to the app UI)    |
| base    | `#0A0B0D` | page background (near-black)           |
| surface | `#101215` | cards, nav                             |
| line    | `#20242B` | borders / grid                         |
| text    | `#EDEDED` | primary text                           |
| muted   | `#8B939C` | secondary text                         |

Lime and magenta are a deliberate **rivalry pair** — one is always "you", the
other the opponent. Use green only for verified/pass states.

## Type

- **Display:** Space Grotesk (600/700) — big, tight, confident headlines.
- **Terminal / labels / code:** JetBrains Mono — eyebrows, tags, stats, the live
  match card, kickers (`// section`).

Both are loaded from Google Fonts in `index.html`.

## Motion

GSAP + ScrollTrigger drive the landing:
- hero timeline (headline lines wipe up, terminal card slides in, chips pop),
- a text **scramble** on "résumé.",
- scroll reveals, animated stat counters, a magnetic pull on primary buttons,
  and a cursor-following glow.

Motion is gated behind `prefers-reduced-motion` and a `.anim` class, so content
stays fully visible if animation is disabled or JS fails.
