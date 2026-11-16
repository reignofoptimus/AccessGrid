---
name: AccessGrid
description: A focused campus access desk for administrators, security personnel and students.
colors:
  page: "#121413"
  rail: "#0e100f"
  surface: "#191c1a"
  raised: "#222623"
  hover: "#292e29"
  border: "#303630"
  line: "#292e29"
  text: "#efefe9"
  secondary: "#b4bcb4"
  muted: "#96a095"
  accent: "#d4e8a0"
  accent-hover: "#e1efbd"
  accent-ink: "#1c2415"
  positive: "#b7d6a0"
  negative: "#f0aaa1"
  warning: "#e3ca92"
typography:
  display:
    fontFamily: "Manrope, 'Segoe UI', sans-serif"
    fontSize: "clamp(44px, 4.4vw, 72px)"
    fontWeight: 500
    lineHeight: 1.08
    letterSpacing: "-2.8px"
  headline:
    fontFamily: "Manrope, 'Segoe UI', sans-serif"
    fontSize: "32px"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "-1.2px"
  title:
    fontFamily: "Manrope, 'Segoe UI', sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-.25px"
  body:
    fontFamily: "Manrope, 'Segoe UI', sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Manrope, 'Segoe UI', sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.6
  plate:
    fontFamily: "Consolas, 'Courier New', monospace"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: ".2px"
rounded:
  plate: "4px"
  field: "6px"
  button: "7px"
  inset: "8px"
  panel: "12px"
spacing:
  tight: "4px"
  compact: "8px"
  control: "12px"
  inset: "16px"
  section: "20px"
  panel: "24px"
  page: "32px"
  spacious: "40px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.button}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.button}"
    padding: "10px 16px"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.secondary}"
    padding: "4px 0"
  field:
    backgroundColor: "#131613"
    textColor: "{colors.text}"
    rounded: "{rounded.field}"
    height: "42px"
    padding: "0 12px"
  navigation:
    backgroundColor: "#252d20"
    textColor: "{colors.accent}"
    rounded: "{rounded.button}"
    padding: "10px 12px"
  badge-positive:
    textColor: "{colors.positive}"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.panel}"
  plate:
    backgroundColor: "#202420"
    textColor: "#ebeee4"
    typography: "{typography.plate}"
    rounded: "{rounded.plate}"
    padding: "8px 10px"
---

# Design System: AccessGrid

## Overview

**Creative North Star: "The Campus Access Desk"**

A shared dark working frame gives administrators, security personnel and students equal care. Charcoal surfaces, warm white text and muted yellow-green actions establish a quiet operational hierarchy. Compact data and controls sit inside generous page spacing; plate identifiers provide the distinctive visual anchor.

The source of truth is `frontend/src/accessgrid.css` and the active `frontend/src/ui` components. This document records the implemented direction in `UI-DIRECTION.md`; it does not certify production authentication or a real geographic site plan.

**Key Characteristics:**
- Fixed dark palette, thin rules and restrained tonal layering.
- Self-hosted Manrope with monospaced plate identifiers and tabular counts.
- Role-specific workspaces inside one responsive navigation frame.
- Short state transitions with reduced-motion support.

## Colors

The palette combines neutral charcoal with a restrained botanical accent. Frontmatter values are normative; corresponding CSS custom properties retain the same names.

**Primary:** `accent` marks primary actions, selected navigation and focus. `accent-hover` lightens primary controls; `accent-ink` provides their dark text.

**Neutral:** `rail` is the deepest persistent surface; `page`, `surface` and `raised` establish hierarchy. `border` and `line` divide content. `text`, `secondary` and `muted` distinguish primary information, supporting information and metadata.

**Status:** `positive`, `warning` and `negative` accompany readable status labels. Preserve the text as well as the color. Local olive tints in parking, recognition and the vehicle pass are contextual component treatments, not additional global action colors.

## Typography

Manrope serves display and body text, falling back to Segoe UI and sans-serif. Weights 400, 500, 600 and 700 are self-hosted from Google Fonts; the OFL license ships at `frontend/public/fonts/OFL.txt`. Plate identifiers use Consolas, Courier New and monospace.

The display role belongs to the login introduction; page headlines use 32px, panel titles 15px/600 and the body base 14px. Operational labels are often 11–12px; table metadata uses 8–10px. Counts use tabular numerals, typically 36px/500 with 1.2 line height. Preserve the established hierarchy rather than making every panel a headline.

Login display sizes step to 52px at 1200px, 44px at 1000px and 38px at 760px. Mobile workspace headlines use 28px. Text remains actual HTML, including the plate number.

## Layout

The desktop frame uses a fixed 224px rail, a 64px utility bar and a centered workspace capped at 1640px with `32px 32px 0` padding. The main rhythm is 24px; a four-column ruled metrics band leads the workspace. The overview grid uses `minmax(0,1.7fr) minmax(280px,1fr)`; the student grid uses `minmax(0,1.8fr) minmax(280px,1fr)`. Tables scroll within their container.

At 1600px and above, the rail becomes 248px and workspace padding becomes `32px 40px`. At 1200px and below, the rail is 208px, content padding 24px and the overview gap 16px. At 1000px, overview, student and settings layouts become single-column.

At 760px and below, the content has no rail offset. Navigation becomes a hidden 260px overlay rail with a backdrop and a close control; the utility bar is 56px, workspace padding `24px 16px`, metrics become two columns, and forms stack. Login becomes vertical and hides its decorative gate scene. At 440px, zone buttons use two columns and secondary utility metadata hides. The body supports a 320px minimum width. Demo mode retains a visible 32px banner, increasing to 36px on mobile.

## Elevation & Depth

Panels are flat, with 1px borders and tonal surface changes. The login recognition illustration alone uses `0 20px 48px #070c0666` with a static −3° rotation. Do not spread this illustrative shadow to operational panels. The mobile rail is separated by a `#0009` backdrop. Focus uses a 2px accent outline with 4px offset by default; field wrappers have their own closer focus treatment.

## Shapes

The system favors compact rounded rectangles: 12px panels, 8px inset messages and result containers, 7px buttons, 6px fields and 4px plates. Avatars and tiny status dots are circular. Thin borders and ruled data rows establish structure; badges are lightweight text with a dot rather than filled pills.

## Components

**Buttons:** Primary and outlined buttons use 12px/600 type, `10px 16px` padding and a 40px minimum height. Primary hover uses the accent-hover token; outlined hover uses `hover` with a `#4b5548` border. Text actions use 11px type and turn accent on hover. Disabled buttons have 0.5 opacity and a not-allowed cursor. Pressed buttons shift down 1px.

**Fields:** Standard inputs and selects are 42px tall with 6px corners and a `#3a4434` border; focus changes border and 1px outline to accent. Search wrappers use a 2px accent focus outline. Plate lookup uses a 17px monospaced input with 1px tracking. Login fields are 46px tall, increasing to 48px on mobile. Errors use readable notices; do not represent failure solely through a border.

**Navigation:** Rail items use 11px type, 7px corners and a 40px minimum height. Active items have olive fill, accent text and a small indicator; hover deepens the background. Preserve the mobile open/close behavior and keyboard focus visibility.

**Panels and data:** Panel headings use `24px 24px 20px` padding. Tables retain compact rows and horizontal overflow; ledger timestamps and metric values use tabular numerals. Status badges pair a 5px dot with a text label. Segmented filters indicate selection with olive fill and a border.

**Signature patterns:** The authored SVG parking schematic represents zones, not verified geography or per-space sensors. Plate lookup reveals a bordered olive result; the student's vehicle pass enlarges the plate on a pale inset. Retain the original `frontend/src/assets/logo.svg`; it is inverted in the dark brand treatment. No new raster imagery is shipped.

**Motion:** Controls transition color, background, border and opacity over 180ms using `cubic-bezier(.22,1,.36,1)`. View entry lasts 200ms, from 0.6 opacity and 4px downward displacement. Plate results reveal over 240ms from 0.35 opacity and 6px displacement. Mobile rail transforms use 180ms. Under `prefers-reduced-motion: reduce`, animations and transitions are disabled and scrolling is automatic.

## Do's and Don'ts

- **Do** preserve equal visual care for all three roles and visible demo labeling.
- **Do** reuse semantic tokens, readable statuses and keyboard focus treatments.
- **Do** keep dense tables contained and controls usable on the mobile rail layout.
- **Do** preserve font licensing and SVG asset provenance.
- **Don't** add a light-mode switch to this fixed-dark implementation.
- **Don't** imply live cameras, per-space sensors, SSO or recovery services that do not exist.
- **Don't** turn the schematic into a claimed campus map or use invented counts as live data.
- **Don't** add perpetual motion or decorative shadows to working panels.
