# aeweb Design System

Universal element-level design language for **aeweb web applications**. aeweb builds business web apps whose navigation and page structures differ from project to project — so this system deliberately does **not** define layouts. It defines how individual elements look and behave: radius, shadows, spacing, type, borders, hover/focus states, transitions, cards, badges, inputs, modals.

**Only the color tokens are project-specific.** Set `--color-*` in `tokens/colors.css` per application; radius, elevation, spacing, typography ratios and states stay identical everywhere.

## Sources
- `f1/aeweb-design-system.md` (attached local folder) — extracted from computed styles of a productive aeweb business app (login + logged-in area: buttons, inputs, cards, modals, badges, tabs, sidebar). All values in this project are copied verbatim from it.
- Additional brief from the user (same content, German) describing the tint pattern, scales and core principles.
- No logo, font binaries, icon set or screenshots were provided.

## Content fundamentals
The source apps are **German (Swiss)** business software. Observed copy: "Anmelden", "Schliessen", "Mit Sublevia anmelden".
- **Language:** German, Swiss orthography — `ss` instead of `ß` ("Schliessen"), Swiss number format (`1'204`).
- **Address:** formal *Sie* ("Bitte ändern Sie Ihr Passwort…"). Never *du*.
- **Buttons:** short verbs / infinitives — *Anmelden, Speichern, Schliessen, Einladen, Löschen*. Authored in sentence case; CSS renders them uppercase with 0.5px tracking.
- **Headlines:** nouns, no punctuation — *Benutzer, Rechnungsadresse, Profil*.
- **Alerts:** one factual sentence, optional bold title — *"Passwort läuft ab. Bitte innert 7 Tagen ändern."*
- **Tone:** sober, functional, calm. No exclamation marks, no marketing hype, **no emoji**.

## Visual foundations
- **Color:** flat. Brand primary `#4DA19F` (teal), secondary `#00427C` (navy — links, focus rings, icons, secondary actions), text `#2F313B`, page `#EEF1F7`, surface white. Status: danger `#EE4110`, success `#05BF66`, warning `#E9A533`.
- **Tint rule (core motif):** soft surfaces are never separate hex values. They are the role color at **5 %** (inactive tabs, nav hover), **10 %** (borders, secondary buttons) or **20 %** (alert/info backgrounds, badges) over white; text on a tint uses a darker "ink" of the same color. Tokens: `--{primary|secondary|success|warning|danger}-{5|10|20}` and `--*-ink`.
- **Badge color** is used for category distinction (visibility, role, audience), not strict traffic-light semantics.
- **Gradients:** only one — `linear-gradient(104deg, primary, secondary)` for a single partner/premium CTA. Otherwise strictly flat. No background images, textures or patterns.
- **Type:** one webfont throughout (exaFont → Manrope). Contrast via **weight** — body 16/300 (light), labels & headlines 700. 400 only as caption/in-between. Scale: 12 · 13–14 · 16 · 18 · 21 · 24 · 30 · 40.
- **Spacing:** 8px base — 4 · 8 · 16 · 24 · 32 · 96. Card padding `16px 32px 32px` (or 32px), form fields 32px apart, label→input 8px, badge `2.4px 8px`.
- **Radius:** **10px default for anything interactive** (buttons, inputs, avatars, tabs); modals always 20px. 4px checkbox/chips, 5px small secondary/tertiary buttons, 8px mid containers, 16px pills, 20px outer cards, 40px icon buttons/CTA pills, 50% dots.
- **Cards:** white, radius 20px, `--shadow-card` (3 % black) on `#EEF1F7`. Depth comes from white-on-grey, not the shadow. Inner list rows have no radius/shadow; separated by padding, hover → page-bg. Never nest shadowed cards.
- **Shadows:** calm at rest (card 3 %, soft avatar shadow, 1px ring); strong only for overlays (modal `0 20px 60px /20 %`, tooltip `-5px 13px 26px -5px /36 %`). Inner (inset) shadows are used for focus and hover rings.
- **Borders:** 1px solid at color/10 %, rarely visible grey. Focus = 2px inset box-shadow ring, not a border. Occasional 2px dashed divider.
- **Hover:** never color-only — **darker fill + inset ring** (`0 0 1px 1px inset secondary`). Tint elements step 10 → 20 %. Rows/nav get page-bg or secondary/5 %.
- **Press:** no shrink/scale; the hover state is the pressed look.
- **Focus:** lives on the **wrapper** (`:focus-within`), not on the native input: input wrapper turns white + `--shadow-input-focus`. Buttons: `--shadow-focus` inset ring.
- **Motion:** one rule — `transition: all 0.35s ease` everywhere. Checkbox exception: bg/border 0.3s ease. No bounces, slides or scale; only fades/color/shadow.
- **Modals:** outer radius 20px, 3px page-bg frame around the white content (inner radius 17px), footer actions on the frame, `--shadow-modal`.
- **Transparency & blur:** modal backdrop = `backdrop-filter: blur(15px)` with barely any tint (no black scrim). Tooltips are translucent dark with blur.
- **Avatars:** square with 10px radius (deliberately not round), 50×50, `--shadow-soft`.
- **Imagery:** none defined in source. If needed, keep neutral/cool business photography; never decorative illustration.
- **Layout:** intentionally unspecified — each app decides its navigation. Only fixed element: modals are `position: fixed` overlays.

## Iconography
The source defines **no icon set**. This system substitutes **Lucide** (outline, 2px stroke, rounded caps) loaded from `unpkg.com/lucide-static@0.468.0`, rendered through the `Icon` component as a CSS mask so icons inherit `currentColor` (usually `--color-secondary` or muted text). Sizes: 16px inside compact buttons/inputs, 18px nav/alerts, 20–22px icon buttons. No emoji, no unicode symbols as icons. ⚠ Substitution — replace with the real aeweb icon set if one exists.

## Fonts
Self-hosted in `fonts/`, declared in `tokens/fonts.css`.
- `--font-sans: 'exaFont', 'Manrope', sans-serif` — **exaFont is mapped to Manrope** (200–800). ⚠ Assumption: no file named exaFont was uploaded; confirm or swap.
- Also available: `--font-museo` (Museo Sans 500 + italic), `--font-raveo` (Raveo variable), `--font-multa` (Multa Pecunia) — roles not yet defined.

## Logo
No logo was provided. The brand name "aeweb" is rendered in plain type (14px/700 uppercase, primary) wherever a mark would go.

## Index
- `styles.css` — entry point (imports only)
- `tokens/` — `colors.css` (base + tint scale + semantic aliases), `typography.css`, `spacing.css`, `shape.css` (radius, borders, shadows, blur), `motion.css`, `base.css` (element defaults)
- `components/aeweb.css` — `.ae-*` classes for hover/focus/`:focus-within` states
- `guidelines/` — foundation specimen cards (Colors, Type, Shape, Spacing, Motion, States)
- `components/` — React primitives (below), one `*.card.html` per folder
- `ui_kits/business-app/` — click-through: login, dashboard, users, settings, user modal
- `thumbnail.html`, `SKILL.md`

## Components
- **actions/** — `Button` (primary, secondary, tertiary, danger, gradient), `IconButton`
- **forms/** — `Input` (wrapper pattern), `Checkbox`
- **surfaces/** — `Card`, `CardRow`
- **feedback/** — `Badge`, `Alert`, `Tooltip`
- **overlays/** — `Modal`, `Tabs`
- **display/** — `Avatar`, `Dots`
- **navigation/** — `NavItem`
- **icons/** — `Icon`

### Intentional additions
- `Icon` — source has no icon set; wraps Lucide so every component uses one glyph system.
- `NavItem` — source mentions a sidebar without specs; built purely from the tint rule so any menu structure can use it.
- `Button variant="danger"` — derived from the primary pattern using `--color-danger`.
