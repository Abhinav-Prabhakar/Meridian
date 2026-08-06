# Meridian Design System

This document defines the visual language, design tokens, and component standards for the **Meridian Calendar OS**. The goal is to ensure that all future components, views, and extensions maintain the established aesthetic: a high-density, dark-mode, professional productivity tool with sharp typography, vibrant categorical accents, and precise grid alignment.

---

## 1. Core Design Principles

1. **Information Density over Whitespace:** Meridian is an OS. Components should be compact, utilizing tight padding and grid lines to maximize visible data without feeling cluttered.
2. **Function Dictates Color:** The primary accent (Lime) is reserved for primary actions and current time/focus. All event categorization uses specific, dedicated secondary accents.
3. **Sharp Geometry:** No large border radii. Elements have square or slightly squared corners to maintain a technical, engineered feel.
4. **Monospace for Data:** Time, metrics, and system metadata should always use the monospace font to separate *data* from *content*.
5. **Atmospheric Depth:** The UI sits on a deep dark background with subtle ambient gradients and a grid texture to prevent the interface from feeling flat.

---

## 2. Design Tokens

All design decisions must reference CSS custom properties (variables) defined in the `:root` selector. **Do not hardcode hex values.**

### 2.1 Color Palette

#### Backgrounds & Surfaces
Meridian uses a layered dark theme. Components sit on top of each other using progressively lighter shades of dark grey.

| Variable | Hex | Usage |
| :--- | :--- | :--- |
| `--bg` | `#0a0b0d` | App background (Base layer) |
| `--bg-1` | `#0d0e11` | Primary panels (Sidebar, Topbar, Detail Panel) |
| `--bg-2` | `#14151a` | Secondary surfaces (Cards, Inputs, Buttons, Events) |
| `--bg-3` | `#1a1c22` | Hover states, tertiary elements, deep stats |

#### Borders & Dividers
Borders are essential for structure in this dark theme.

| Variable | Hex | Usage |
| :--- | :--- | :--- |
| `--border` | `#232529` | Standard 1px borders between major elements |
| `--border-bright`| `#2e3138` | Hover states for borders on interactive elements |

#### Typography & Foreground

| Variable | Hex | Usage |
| :--- | :--- | :--- |
| `--fg` | `#f4f1ea` | High-emphasis text (Titles, primary data). Slightly warm. |
| `--fg-2` | `#9ea2ab` | Medium-emphasis text (Labels, descriptions) |
| `--fg-3` | `#5a5d65` | Low-emphasis text (Metadata, disabled states, placeholders) |

#### Accents & Categorical Colors
Accents are used for categorization and status. Each accent has a base color and a `-dim` variant (rgba) used for subtle background fills.

| Variable | Hex | Dim Variable / Usage |
| :--- | :--- | :--- |
| `--accent` | `#d4ff3d` | `--accent-dim` (12%). Primary actions, "Today", Strategy. |
| `--orange` | `#ff9248` | `--orange-dim`. Meetings, high-load warnings. |
| `--cyan` | `#5dd9d4` | `--cyan-dim`. Focus time, upcoming events. |
| `--pink` | `#ff7ab0` | `--pink-dim`. Personal events. |
| `--yellow` | `#ffd23f` | `--yellow-dim`. Travel. |
| `--red` | `#ff4d4d` | Critical alerts, "Now" time indicator line. |

### 2.2 Typography

Meridian uses three distinct typefaces to separate structure, content, and data.

1. **Primary UI (`Inter Tight`)**: Used for all standard interface text, buttons, and body copy.
2. **Display (`Space Grotesk`)**: Used for titles, large numbers, event names, and brand elements. (Apply via `.font-display`).
3. **Monospace (`JetBrains Mono`)**: Used strictly for *data*—times, dates, counts, tags, and trend metrics. (Apply via `.font-mono`).

**Typographic Scale & Standards:**
*   **Titles (H1/H2):** `Space Grotesk`, `28px - 18px`, weight `600`, tight letter-spacing (`-0.025em`).
*   **Body / UI:** `Inter Tight`, `12px - 13px`, weight `500` or `600`.
*   **Labels (Uppercase):** `9px - 10px`, weight `600`, wide letter-spacing (`0.18em`), color `--fg-3`.
*   **Data / Time:** `JetBrains Mono`, `10px - 13px`, letter-spacing (`0.05em`).

### 2.3 Spatial System

*   **Base Unit:** `4px`. All padding, margins, and dimensions should be multiples of 4 (or 2 for micro-adjustments).
*   **Standard Gaps:** `8px` (tight), `12px` (normal), `20px` (wide).
*   **Border Radius:** Generally `0`. Avatars, status dots, and numeric badges use `50%` (circular).
*   **Borders:** Always `1px` solid using border variables.

---

## 3. Global Layout Architecture

The application is built on a rigid, non-fluid grid system that fills the viewport (`100vh`).

1.  **App Shell:** The root container uses `display: grid; grid-template-columns: 260px 1fr;`.
2.  **Main Area:** Uses `display: flex; flex-direction: column;`.
3.  **Calendar Wrap:** Uses `display: grid; grid-template-columns: 1fr 340px;` to place the main calendar next to the detail panel.
4.  **Scrolling:** The root `body` is `overflow: hidden`. Only specific inner containers (`sidebar`, `detail-panel`, `calendar-area`) are permitted to scroll.

### 3.1 The Atmosphere Layer
To maintain the atmospheric depth, the `.atmosphere` fixed div must remain at `z-index: 0`. It features:
*   Subtle radial gradients (Lime and Orange) in the corners.
*   A global grid texture overlay (`32px x 32px` squares) at extremely low opacity (`0.014`).

---

## 4. Component Specifications

### 4.1 Buttons

Buttons in Meridian are highly structured. Avoid using standard Tailwind button styles.

*   **Primary Action (`.new-event-btn`, `.join-btn`):**
    *   `background: var(--accent)`, `color: var(--bg)` (dark text).
    *   Weight: `600`, Size: `12px - 13px`.
    *   Hover: Brighten background slightly, apply `translateY(-1px)` and a `box-shadow` using the accent color.
*   **Secondary Action (`.today-btn`, `.share-btn`):**
    *   `background: var(--bg-2)`, `color: var(--fg)`, `1px solid var(--border)`.
    *   Hover: Border turns `var(--accent)`, text turns `var(--accent)`.
*   **Icon Buttons (`.icon-btn`, `.nav-btn`):**
    *   Fixed dimensions (`30px x 30px` or `32px x 32px`).
    *   Uses SVG icons (stroke-width `2` or `2.5`), strictly sized `12px - 14px`.
*   **Segmented Control (`.view-switcher`):**
    *   Container is a `flex` box with `border: 1px solid var(--border); padding: 2px;`.
    *   Active state: `background: var(--fg); color: var(--bg);`

### 4.2 Cards & Data Displays

*   **Base Card (e.g., `.mini-cal`, `.next-event`, `.sparkline-card`):**
    *   `background: var(--bg-2)`
    *   `border: 1px solid var(--border)`
    *   Padding: `12px - 14px`
*   **Stats Grid (`.stats-grid`):**
    *   A 2x2 grid. To create the internal grid lines, the container uses `background: var(--border); gap: 1px;` and the child elements use `background: var(--bg-2);`.
*   **Sparklines (`.sparkline-bars`):**
    *   Flexbox aligned to `flex-end`.
    *   Bars use `background: var(--bg-3)` by default; active state is `var(--accent)`.

### 4.3 Calendar Specifics

*   **Grid Layout:** The week view uses `grid-template-columns: 64px repeat(7, 1fr);`. `64px` is the fixed gutter for time labels.
*   **Time Labels (`.hour-label`):**
    *   Background must match the main background (`var(--bg)`) where the text sits to mask the vertical grid line behind it. Overlap using negative margin if necessary.
*   **Events (`.event`):**
    *   Absolutely positioned.
    *   Must use a `border-left: 3px solid var(--cat-color)`.
    *   Base background: `var(--bg-2)`.
    *   Hover: `transform: translateX(2px); z-index: 3;` with a drop shadow.
*   **The "Now" Line (`.now-line`):**
    *   Absolute positioned, `1px` height, `background: var(--red)`.
    *   Includes a pulsing red dot (`.pulseNow` animation) and a red "NOW" monospaced tag to the left.

### 4.4 Lists & Attendees

*   **Avatars / Attendees (`.att-circle`, `.event-attendee`):**
    *   Circular (`border-radius: 50%`).
    *   Overlap technique: `margin-left: -5px` or `-6px`.
    *   Border (`2px solid`) must match the background of the parent container to cut out the preceding circle.
*   **Status Dots (`.user-status::before`):**
    *   Small circles (`6px x 6px`) utilizing the `pulseStatus` keyframe animation to indicate "Live" or "Available" states.

---

## 5. Interaction & Motion Standards

Meridian interactions are quick and deliberate.

*   **Standard Transition:** `transition: all 0.15s ease;` (or `0.1s` for rapid hover states like calendar days).
*   **Entrance Animations:** Modules fade up into place on page load using the `.fade-up` utility classes, staggered via delay classes (`.fade-up-1`, `.fade-up-2`, `.fade-up-3`). Curve: `cubic-bezier(0.16, 1, 0.3, 1)`.
*   **Toast Notifications:**
    *   Fixed bottom-right.
    *   Slide in from the right (`translateX(20px)`), fade out automatically after `2.5s`.

---

## 6. Rules for Building New Components

When constructing a new UI element for Meridian, follow this checklist:

1.  [ ] **Are you using CSS variables?** Never hardcode colors. If you need a new category color, define it in `:root` with its `-dim` counterpart.
2.  [ ] **Is the typography contextual?** Are titles using `Space Grotesk`? Are times/counts using `JetBrains Mono`? Are labels properly uppercase and spaced?
3.  [ ] **Are the borders precise?** Ensure 1px borders are using `--border` against `--bg-2` or `--bg-1` surfaces.
4.  [ ] **Is the padding consistent?** Compact elements use `8px` or `12px`. Full sections use `18px 20px`.
5.  [ ] **Does it hover well?** Interactive elements must change border brightness or shift slightly (`translateX(2px)` or `translateY(-1px)`).
6.  [ ] **Are the icons correct?** Icons should be inline SVGs, stroke-width `2`, sized between `12px` and `16px`, inheriting `currentColor`.
