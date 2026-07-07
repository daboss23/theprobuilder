# DESIGN.md — TPB Creative Reactor · Liquid Glass Design System

The visual language of the Creative Reactor is **Liquid Glass**: translucent,
frosted panels floating over a deep navy field, lit from within by neon
cyan / electric-blue / violet / magenta glow, with glossy top-left shine,
luminous bottom edges, and layered depth shadows underneath. Reference
North Star: Apple Vision Pro glassmorphism × premium AI command center.

> This is the implementation contract. Every colour, radius, shadow, and
> primitive used in UI code must trace back to a token or class named here.

---

## 1. Atmosphere & background

The app sits on a fixed, layered field (never a single flat fill):

- **Base:** deep navy `#050914 → #070B16 → #0B1020`, `linear-gradient(162deg)`.
- **Left glow:** soft cyan bloom (`#22E7FF`, low alpha) from the lower-left.
- **Right glow:** violet/magenta bloom (`#8B5CF6` / `#FF4FD8`) from the right.
- **Top glow:** large soft electric-blue radial behind the hero / OPUS.
- **Texture:** very subtle engineering grid + drifting particle nodes, masked
  toward the centre. Never distracting.

Implemented in `body` + `.reactor-bg` + `.reactor-nodes` (`app/globals.css`).

---

## 2. Colour tokens

Reference palette (Tailwind: `liquid-*`, also raw `--lg-*` custom props):

| Token | Hex | Use |
|---|---|---|
| `liquid-bg` | `#050914` | deepest background |
| `liquid-bg-2` | `#070B16` | mid background |
| `liquid-bg-3` | `#0B1020` | raised background |
| `liquid-cyan` | `#22E7FF` | primary neon glow, primary CTA gradient |
| `liquid-blue` | `#4DA3FF` | electric blue, links, primary gradient end |
| `liquid-violet` | `#8B5CF6` | secondary glass edge glow |
| `liquid-magenta` | `#FF4FD8` | accent / ORACLE, right-side bloom |
| `liquid-teal` | `#2FFFD2` | soft teal / ECHO, success glow |
| `liquid-flame` | `#FF4B3E` | campaign CTA base (red) |
| `liquid-ember` | `#FF6A3D` | campaign CTA highlight (orange) |

Glass fills: `rgba(22,32,52,0.45)` (tinted) / `rgba(255,255,255,0.06)` (light).

**Agent identity colours** (map to the existing `.acc-*` channels):

| Agent | Accent | `.acc-*` |
|---|---|---|
| ATLAS | cyan / deep blue | `acc-cyan` |
| NOVA | violet / purple | `acc-violet` |
| SPARK | gold + cyan blend | `acc-amber` |
| ECHO | teal / green-cyan | `acc-emerald` |
| ORACLE | magenta / pink | `acc-pink` |
| OPUS | multi-colour core | (crystal orb — cyan+violet+magenta+gold) |

Colour is applied as a **perceptual glow ramp** (accent → accent-hi at varying
alpha across rim, halo, and bottom strip), never one flat tint.

---

## 3. Typography

- Display / headings: **Space Grotesk** (`font-display`) — tight tracking.
- Body / UI: **Inter** (`font-sans`).
- System labels / mono: `font-mono`, uppercase, `tracking-[0.22em–0.3em]`.

Hierarchy: big crisp section labels, readable card body, clear status badges.
Never use tiny unreadable text for primary content.

---

## 4. Elevation & material recipe

A surface reads as liquid glass through **layered** effects, not a lone blur:

1. `backdrop-filter: blur(28px) saturate(150%)` — frosts what's behind.
2. Multi-stop fill: diagonal white shine (top-left) → transparent → tinted
   navy body, plus accent radial washes in two corners.
3. **Inner** highlights: bright top edge + thin inner rim (`inset` box-shadows).
4. **Outer** glow: coloured halo + deep floating drop shadow underneath.
5. **Bottom strip:** luminous cyan/accent edge (`::after` or gradient border).
6. Glossy diagonal reflection overlay (`::before`, `mix-blend: screen`).

Radii: cards `1.5rem` (24px) / `borderRadius.panel`; tiles `1.4rem`; pills full.

Shadows (Tailwind): `shadow-panel`, `shadow-glow`, `shadow-glow-lg`,
`shadow-liquid` (floating card), `shadow-liquid-hover`.

---

## 5. Reusable primitives (`components/reactor/liquid-glass.tsx`)

All product UI composes from these. Each has default + hover + (where relevant)
active/focus/disabled states, is responsive, and uses only tokens above.

| Primitive | Purpose |
|---|---|
| `GlassShell` | Full-page atmospheric wrapper (background layers). |
| `GlassPanel` | Base frosted panel (the raw material). |
| `LiquidGlassCard` | Panel + glossy shine + accent edge glow + hover lift. |
| `LiquidGlassAgentCard` | Agent-identity card (accent-driven rim + glow). |
| `LiquidGlassButton` | `primary` (cyan→blue glossy pill), `secondary` (violet glass), `cta` (red/orange campaign). |
| `LiquidGlassInput` | Frosted text field, cyan focus glow. |
| `LiquidGlassSelect` | Frosted native select, matching material. |
| `LiquidGlassBadge` / `NeonStatusPill` | Glossy status pills (breathing dot). |
| `LiquidGlassTabs` | Segmented glass tab switch. |
| `LiquidGlassModal` | Frosted modal over dimmed atmospheric scrim. |
| `GlowDivider` | Horizontal luminous divider (accent gradient). |
| `OrbitalGlow` | Rotating multi-colour glow ring (OPUS/hero decoration). |

The primitives are thin React wrappers over the shared `.lg-*` and `.glass`
classes in `globals.css`, so the whole app inherits the material even where
older components still use the raw classes directly.

---

## 6. Motion

GPU-composited only (`transform`, `opacity`, `filter`). Subtle, premium:

- Glass cards: hover lift `translateY(-2…-5px)` + glow intensifies (`0.22–0.32s`).
- Buttons: smooth hover brighten + active press translate.
- OPUS: rings slowly rotate/pulse; heart breathes; connection lines shimmer.
- Status pills: gentle breathing dot.
- Respect `prefers-reduced-motion` (ambient loops pause).

Never animate layout properties. Keep it subtle — never busy/cyberpunk.

---

## 7. Accepted debt

- Legacy components still use raw `.glass` / `.kpi-card` / `.opus-*` classes
  directly rather than importing the primitives. This is intentional: the
  material lives in shared CSS, so upgrading the CSS lifts them too. New work
  should prefer the `liquid-glass.tsx` primitives.
</content>
</invoke>
