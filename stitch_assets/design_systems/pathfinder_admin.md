# Design System Document: Pathfinder Admin (Modern Sentinel)

## 1. Overview & Creative North Star
**Creative North Star: "The Digital Field-Guide"**

This design system moves away from the "generic SaaS dashboard" look to embrace an aesthetic inspired by high-end editorial field guides and heritage outdoor equipment. For a Scout management system operated by adult volunteers, the interface must feel authoritative yet organic—evoking the reliability of a compass and the clarity of a topographic map.

We achieve this through **Organic Structuralism**. Instead of rigid grids and harsh borders, we use expansive white space, intentional asymmetry in layout, and a sophisticated "tonal layering" technique. The goal is to reduce cognitive load for volunteers while maintaining a premium, "pro-grade" feel that honors the Scout tradition.

---

## 2. Colors: Tonal Depth & The "No-Line" Rule

The palette is rooted in the "Forest, Sea, and Sun" of the Scout tradition, but executed with high-end, muted saturation to ensure professional legibility.

### Core Palette Roles
- **Primary (`#003629`)**: Our "Deep Forest." Used for high-level navigation and core brand moments.
- **Secondary (`#485f84`)**: Our "Marine Blue." Used for utilitarian elements, secondary actions, and data visualization.
- **Tertiary (`#3d2c00`)**: Our "Mustard Earth." Reserved for accentuation, highlights, and critical "Golden Thread" information.

### The "No-Line" Rule
**Prohibit 1px solid borders for sectioning.** 
Structural boundaries must be defined solely through background color shifts. For example, a `surface_container_low` sidebar sitting against a `surface` background creates a clean, sophisticated break without the "clutter" of lines.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked, physical materials.
- **Base Level:** `surface` (`#f9faf7`) – The canvas.
- **Level 1 (Sections):** `surface_container_low` (`#f3f4f1`) – For secondary content areas.
- **Level 2 (Active Cards):** `surface_container_lowest` (`#ffffff`) – Pure white cards to "pop" off the background.
- **Level 3 (Interactive Overlays):** `surface_bright` with Glassmorphism.

### The Glass & Gradient Rule
To provide "soul," use subtle linear gradients (e.g., `primary` to `primary_container`) for primary CTA buttons. For floating modals or navigation rails, use a `surface_container_highest` color with a **20px backdrop-blur**, creating a "frosted glass" effect that feels integrated into the environment.

---

## 3. Typography: Editorial Authority

We use a high-contrast pairings: **Manrope** for structural impact and **Inter** for high-utility reading.

*   **Display & Headline (Manrope):** These are our "Compass Points." Use `display-md` for dashboard welcomes and `headline-sm` for section headers. The wider tracking of Manrope provides an open, modern feel.
*   **Title & Body (Inter):** Our "Logbook." Use `title-md` for card titles and `body-lg` for all volunteer-facing instructions. Inter’s high x-height ensures readability for adults in low-light environments (e.g., during camp planning).
*   **Labels (Inter):** Use `label-md` (`0.75rem`) for metadata and tags. These should always be in high-contrast `on_surface_variant` to ensure they don't fade into the background.

---

## 4. Elevation & Depth: The Layering Principle

Shadows and lines are crutches; use tone to define space.

*   **Tonal Layering:** Create "lift" by nesting. A `surface_container_highest` element placed inside a `surface_container_low` area creates immediate focus without a single pixel of shadow.
*   **Ambient Shadows:** Where a floating effect is required (e.g., a floating action button), use an extra-diffused shadow: `offset-y: 8px, blur: 24px, color: rgba(25, 28, 27, 0.06)`. This mimics natural sunlight filtered through a canopy.
*   **The "Ghost Border" Fallback:** If a container absolutely requires a border for accessibility, use `outline_variant` at **15% opacity**. It should be felt, not seen.
*   **Glassmorphism:** For top navigation bars, use `surface_container_lowest` at 80% opacity with a blur. This maintains a sense of "place" as the user scrolls through long member lists.

---

## 5. Components

### Cards & Metric Tiles
*   **Constraint:** No borders. No dividers.
*   **Style:** Use `surface_container_lowest` (pure white) on a `surface` background. 
*   **Layout:** Use `spacing-6` (1.5rem) internal padding. Metrics should use `headline-lg` in `primary` color to anchor the card.

### Buttons
*   **Primary:** A subtle gradient from `primary` to `primary_container`. Roundedness: `md` (0.375rem).
*   **Secondary:** `surface_container_high` background with `on_surface` text.
*   **Tertiary:** No background; `on_secondary_container` text with a `primary` icon.

### Data Tables & Calendars
*   **Rule:** Forbid horizontal divider lines.
*   **Alternative:** Use "Zebra Layering" with `surface_container_low` for alternating rows, or simply use `spacing-4` of vertical white space to let the data breathe.
*   **Calendar:** Use `tertiary_fixed` (Mustard) for "Today" markers and `primary_fixed` (Light Green) for event blocks. This provides a warm, heritage feel.

### Input Fields
*   **Style:** Minimalist. Use `surface_container_highest` as the fill color.
*   **State:** On focus, transition the background to `surface_container_lowest` and add a 2px "Ghost Border" of `primary` at 40% opacity.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use asymmetrical layouts. For example, a dashboard with a wide 2/3 column for the \"Calendar\" and a narrow 1/3 column for \"Quick Metrics.\"
*   **Do** lean heavily into the `surface` color transitions to guide the eye.
*   **Do** use `spacing-12` or `spacing-16` between major sections to give the \"adult volunteer\" room to breathe and think.

### Don't:
*   **Don't** use pure black `#000000`. Use `on_surface` (`#191c1b`) to maintain a soft, organic feel.
*   **Don't** use \"Card-in-Card\" layouts with borders. Use nested tonal shifts (Level 1 color inside Level 2 color).
*   **Don't** use high-contrast shadows. If the shadow is the first thing you notice, it is too heavy.
*   **Don't** use standard 12px padding. In this system, `spacing-4` (16px) is the absolute minimum for touch targets and internal margins.
