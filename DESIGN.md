# Design

A calm, native chat interface. Conversations lead; navigation and controls stay quiet. These principles guide every client.

## Visual language

- Use monochrome surfaces and semantic theme tokens. Color communicates state and has a text or icon cue.
- Support light and dark themes. Keep contrast and focus visible in both.
- Use Inter for web text and monospace for code, paths, and identifiers. Use sentence case.
- Use the framework's spacing, radius, and type scales. One parent owns each gap.
- Mobile type scale: caption 12, footnote 13, subhead 14, body 16, title 20, display 24 (`text-<step>` in the mobile theme). Readable content, row titles, inputs, and buttons use body; secondary text is subhead and muted. Use no pixel font sizes, except emoji and avatar glyphs that scale with their container.
- Mobile shapes: containers (cards, row groups, alerts, bubbles) use `rounded-2xl`; controls (inputs, buttons, groups nested in a card) use `rounded-lg`; pills and icon buttons are round. Controls in one row share a height: a default `Button` matches `Input` at 40px.
- Prefer a continuous chat canvas and clear grouping. Avoid nested cards, decorative borders, gradients, and glows.

## Components

- For web UI, start with shadcn primitives. App components compose them; styling belongs in the primitive.
- Extend appearance through `variant` and `size`; add `density` only when needed. Avoid parallel styling props and repeated overrides.
- Parents control layout. A component owns its appearance and scales text, icons, padding, and gaps together.
- Use Lucide icons for web actions. Icons communicate meaning, not decoration.
- Use native platform controls where web primitives do not apply.

## Interaction

- Show real agent state. Avatars express identity and live activity; animations must reflect actual work.
- Keep essential actions visible without hover. Preserve keyboard navigation, labels, focus rings, and usable touch targets.
- Disclose details progressively. Ask for confirmation before destructive actions.
- Loading skeletons match the final layout. Empty states give one clear action. Errors name the failed action and offer recovery where possible.
- Respect reduced motion. Avoid decorative motion and indefinite fake progress.

## Copy and validation

- Use short, plain English through the i18n package. State only what the system knows.
- Check affected screens in light and dark themes and at desktop and mobile widths.
- Verify loading, empty, live, and error states when the corresponding feature exists.
