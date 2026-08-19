# Design System Strategy: Modern Sentinel

## 1. Overview & Creative North Star
The "Modern Sentinel" is not just a management tool; it is a digital compass. Our Creative North Star is **"The Precision Navigator."** We are moving away from the cluttered, line-heavy layouts of traditional admin dashboards toward a high-end editorial experience that feels authoritative yet breathable.

By leveraging **Intentional Asymmetry** and **Tonal Depth**, we create a UI that feels like a custom-tailored field journal. We break the "template" look by using exaggerated white space (derived from our 24/20 spacing tokens) and overlapping elements that suggest a sense of layered physical materials. The goal is a professional, scout-themed aesthetic that prioritizes clarity and high-velocity decision-making.

---

## 2. Colors & Surface Architecture
The palette is rooted in the "Modern Sentinel" identity: the stability of the deep blue, the heritage of the emerald green, and the high-visibility alertness of the vibrant yellow.

### The "No-Line" Rule
To achieve a premium feel, **1px solid borders for sectioning are strictly prohibited.** Boundaries must be defined solely through background color shifts.
*   **Implementation:** Place a `surface_container_low` section directly onto a `surface` background to define a zone. The eye will perceive the change in luminance as a structural boundary without the visual \"noise\" of a line.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked, precision-cut sheets. 
*   **The Stack:** Base Layer (`surface`) → Section Layer (`surface_container_low`) → Content Card (`surface_container_lowest`).
*   This \"nesting\" creates natural depth and directs the user’s focus toward the innermost (highest importance) content without requiring heavy shadows.

### Signature Textures: Glass & Gradient
To prevent the \"out-of-the-box\" look, we use:
*   **The Sentinel Gradient:** Use a subtle linear gradient from `primary` (#0a1a75) to `primary_container` (#27348b) for primary CTAs and header backgrounds. This adds a \"soul\" to the interface that flat colors cannot replicate.
*   **Frosted Navigation:** Floating overlays or sidebars should utilize **Glassmorphism**. Use semi-transparent `surface` colors with a `backdrop-filter: blur(20px)`. This allows the brand colors to bleed through the UI, softening the layout.

---

## 3. Typography
We utilize **Manrope** for its geometric precision and modern legibility. Our typography scale is built on high-contrast ratios to mimic an editorial magazine.

*   **Display (lg/md):** Reserved for high-level data storytelling or welcome states. Use `primary` color to assert authority.
*   **Headline (sm/md):** These are your \"Field Markers.\" They should have generous `8` (2rem) bottom margins to create a sense of openness.
*   **Body (lg/md):** Set in `on_surface_variant` (#454652) to reduce eye strain.
*   **Labels (sm/md):** Our \"Tactical Data.\" Often set in `tertiary` (#6d5e00) or `secondary` (#376757) to differentiate meta-data from primary content.

---

## 4. Elevation & Depth
In the \"Modern Sentinel\" system, light and shadow are used to mimic ambient forest light—soft, diffused, and natural.

*   **The Layering Principle:** Depth is achieved by \"stacking\" surface tiers. A `surface_container_lowest` card on a `surface_container_low` section creates a \"soft lift.\"
*   **Ambient Shadows:** If a floating effect is required (e.g., a modal), use a shadow with a 32px blur at 6% opacity. The shadow color must be a tinted version of `on_surface` rather than pure black to maintain a natural appearance.
*   **The \"Ghost Border\" Fallback:** If accessibility requires a container boundary, use a \"Ghost Border\": the `outline_variant` token at **15% opacity**. Never use a 100% opaque border.

---

## 5. Components

### Buttons
*   **Primary:** Features the \"Sentinel Gradient\" (`primary` to `primary_container`). Radius set to `md` (0.375rem).
*   **Secondary:** Uses `secondary` (#376757) with `on_secondary` text. This is our \"Emerald\" heritage color, used for secondary paths.
*   **Tertiary/Highlight:** Vibrant Yellow (`tertiary_fixed`) used sparingly for status indicators or \"New\" badges.

### Input Fields
*   **Styling:** No bottom line or full border. Use a `surface_container_high` fill with a `sm` (0.125rem) bottom-weighted \"Ghost Border\" that transforms into a `primary` 2px bar on focus.
*   **Labels:** Use `label-md` in `on_surface_variant`.

### Cards & Lists
*   **The Divider Forbiddance:** Never use line dividers between list items. Use the spacing scale (`4` or `1rem`) to create separation.
*   **Selection:** Instead of a checkbox, use a background shift to `secondary_container` (#baeed9) to indicate a selected row.

### Tactical Components (App Specific)
*   **Sentinel Status Chips:** High-contrast `tertiary_fixed` (#ffe24a) background with `on_tertiary_fixed` text for immediate attention.
*   **Glass Sidebars:** A fixed navigation bar using the Glassmorphism rule to maintain context of the \"field\" (the content) behind it.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** embrace asymmetry. A header can be left-aligned while a data-viz is slightly offset to the right to create a custom, \"curated\" feel.
*   **Do** use the `secondary` (Emerald) color for \"Action Success\" or \"Scout-level\" confirmations.
*   **Do** use `16` (4rem) and `20` (5rem) spacing tokens for vertical sectioning to let the design breathe.

### Don't:
*   **Don't** use 1px solid borders. It shatters the \"Precision Navigator\" illusion and makes the UI look like a generic template.
*   **Don't** use pure black for text. Always use `on_surface` (#1b1c1c).
*   **Don't** over-use the Vibrant Yellow. It is a \"Sentinel\" light; if it’s everywhere, it alerts to nothing. Use it only for highlights or critical status.
