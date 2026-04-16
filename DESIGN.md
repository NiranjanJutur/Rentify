# Design System Specification

## 1. Overview & Creative North Star: "The Architectural Curator"

This design system moves beyond the utility of a standard management tool into the realm of a premium hospitality concierge. Our Creative North Star is **The Architectural Curator**. 

Traditional PG/Hostel apps feel cluttered and transactional. We will break this "template" look by treating the UI as an architectural plan—prioritizing spatial awareness, intentional asymmetry, and tonal depth. By utilizing high-contrast typography scales (Manrope for displays, Inter for utility) and a "No-Line" philosophy, we create an environment that feels authoritative yet breathable. The goal is to make the property manager feel like a curator of a high-end estate rather than a clerk in a dormitory.

---

## 2. Colors & Atmospheric Tones

We utilize a palette that balances the weight of deep navy with the vitality of emerald.

### Primary & Secondary (The Foundation)
- **Primary (`#00236f`) & Primary Container (`#1e3a8a`):** Used for core branding and high-importance interactions.
- **Secondary (`#006c49`):** Reserved strictly for financial success, paid statuses, and growth metrics.

### The "No-Line" Rule
**Explicit Instruction:** 1px solid borders are strictly prohibited for sectioning. Structural boundaries must be defined solely through background color shifts.
- To separate a sidebar from a main dashboard, use `surface-container-low` against a `surface` background.
- To define a card, use `surface-container-lowest` on top of a `surface-container` section.

### The Glass & Gradient Rule
To provide "visual soul," use subtle linear gradients for CTAs:
- **Primary Action:** Linear gradient from `primary` to `primary_container` at a 135° angle.
- **Floating Elements:** Use Glassmorphism for overlays (e.g., filter drawers). Apply `surface_container_lowest` at 80% opacity with a `24px` backdrop-blur.

---

## 3. Typography: Editorial Authority

We use a dual-typeface system to distinguish between "Status" (Editorial) and "Data" (Functional).

*   **Headlines (Manrope):** Chosen for its geometric, modern personality. Use `display-lg` and `headline-md` for high-density dashboards to create clear entry points for the eye.
*   **Body & Labels (Inter):** Chosen for its unparalleled legibility at small sizes. Use `body-md` for tenant details and `label-sm` for the high-density status badges.

**Hierarchy Tip:** Pair a `display-sm` (Manrope) header with a `label-md` (Inter, All Caps, tracked out 5%) sub-header to create a premium, editorial look that standard apps lack.

---

## 4. Elevation & Depth: Tonal Layering

We reject traditional box-shadows in favor of **Tonal Layering**. Depth is achieved by "stacking" surface tiers like sheets of fine paper.

### The Layering Principle
- **Base Level:** `surface` (#f8f9fb)
- **Content Blocks:** `surface-container-low` (#f3f4f6)
- **Interactive Cards:** `surface-container-lowest` (#ffffff)
- **Floating Modals:** `surface-bright` with an Ambient Shadow.

### Ambient Shadows & Ghost Borders
- **Shadows:** Only for floating elements. Use the `on_surface` color at 6% opacity with a `32px` blur and `8px` Y-offset. It should feel like a soft glow, not a dark edge.
- **The Ghost Border:** If a divider is mandatory for accessibility, use `outline_variant` at **15% opacity**. Never use a 100% opaque border.

---

## 5. Components: High-Density Utility

### Cards & Lists (The "Breathable Grid")
Forbid the use of divider lines. Separate tenant lists using `8px` or `12px` of vertical white space. Use `surface-container-high` for hovered states to provide tactile feedback without visual clutter.

### Status Badges (The "Success" Indicators)
Badges should not have borders. Use high-contrast tonal fills:
- **Occupied:** `primary_fixed` background with `on_primary_fixed` text.
- **Vacant:** `secondary_fixed` background with `on_secondary_fixed` text.
- **Pending:** `tertiary_fixed` background with `on_tertiary_fixed` text.

### Buttons
- **Primary:** `primary` fill, `on_primary` text, `xl` (0.75rem) corner radius. Use a subtle gradient to avoid flatness.
- **Secondary:** Glass-style. `surface_container_high` at 40% opacity with `primary` text.

### High-Density Dashboards
In the PG context, data density is key. Use "Micro-Modules":
- Group "Revenue," "Occupancy," and "Maintenance" into a three-column asymmetric grid.
- Use `headline-sm` for primary metrics and `label-sm` (Secondary Green) for "growth" percentages.

### Input Fields (Intuitive Onboarding)
Avoid the "boxed-in" look. Use a `surface-container-low` fill with a `2px` bottom-only highlight in `primary` when focused. This mimics high-end physical stationery.

---

## 6. Do’s and Don’ts

### Do:
- **Do** use `surface-container` shifts to group related tenant information.
- **Do** use `display-lg` typography for large numerical data (e.g., Total Monthly Rent) to give it "hero" importance.
- **Do** embrace white space; a high-density dashboard requires "gutters" of at least `24px` to remain legible.

### Don’t:
- **Don’t** use black (`#000000`) for text. Use `on_surface_variant` for body and `on_surface` for headlines to keep the UI soft.
- **Don’t** use standard "drop shadows." If an element doesn't feel elevated enough through color, increase the background contrast instead.
- **Don’t** use icons as the sole indicator of status. Always pair with `label-md` text for accessibility in financial management.