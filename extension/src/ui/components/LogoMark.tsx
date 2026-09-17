/**
 * The "Selo Octogonal" brand mark (logo v2, replacing the earlier gold-badge
 * placeholder): a chamfered-octagon seal with a zigzag peak figure and a
 * ledger-style underline rule, from the Claude Design "CMD500 Logo v2"
 * project. Colors are set via the design system's own CSS custom
 * properties (--c500-bg, --c500-mana-gold, --c500-text-soft) rather than
 * hardcoded hex values, so the mark re-themes for free whenever
 * `document.documentElement.dataset.theme` flips — no branching logic
 * needed here (see design.md's theming decision).
 */
export function LogoMark() {
  return (
    <svg width="38" height="38" viewBox="0 0 64 64" className="c500-tab__mark" aria-hidden="true">
      <path
        d="M9.5 22 L22 9.5 L42 9.5 L54.5 22 L54.5 42 L42 54.5 L22 54.5 L9.5 42 Z"
        fill="var(--c500-bg)"
        stroke="var(--c500-mana-gold)"
        strokeWidth="4"
      />
      <path
        d="M19 39 L19 22.5 L25.5 30 L32 20 L38.5 30 L45 22.5 L45 39 Z"
        fill="var(--c500-mana-gold)"
      />
      <rect x="21" y="43" width="22" height="3" fill="var(--c500-text-soft)" />
    </svg>
  );
}

/**
 * The full horizontal lockup (mark + "CMD500" / "Deck Builder" wordmark),
 * used in the header. The wordmark is set in Cinzel — see tab.html/index.html
 * for the font `<link>` and panel.css's `.c500-wordmark` rule for the
 * scoped fallback stack. Decorative: the header's accessible name still
 * comes from its own (visually-hidden) heading, not from this lockup, so
 * the whole thing is aria-hidden to avoid a screen reader announcing the
 * brand name a second time back to back.
 */
export function LogoLockup() {
  return (
    <span className="c500-tab__logo-lockup" aria-hidden="true">
      <LogoMark />
      <span className="c500-wordmark">
        <b className="c500-wordmark__line1">CMD500</b>
        <i className="c500-wordmark__line2">Deck Builder</i>
      </span>
    </span>
  );
}
