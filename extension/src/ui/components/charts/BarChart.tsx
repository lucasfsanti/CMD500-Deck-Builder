import type { Bucket } from "../../../lib/analytics/bucket-counts";

export interface BarChartProps {
  title: string;
  buckets: Bucket[];
}

/**
 * A single-series horizontal bar chart: each of these three charts compares
 * one magnitude (card count) across a fixed set of labeled categories. Only
 * the Cor (color) chart's buckets carry a `color` — its categories *are*
 * Magic's color identities, so per-bucket color is the data, not decoration
 * (see mana-colors.ts). Curva and Tipo's buckets have no color-identity
 * meaning, so they're left uncolored and fall back to the neutral hue
 * `.c500-chart__bar` defines — a categorical palette there would be noise,
 * not signal (see dataviz skill: color follows the entity's job). Hand-
 * rolled SVG/CSS, consistent with the rest of the design system (no
 * charting library dependency).
 */
export function BarChart({ title, buckets }: BarChartProps) {
  const max = Math.max(1, ...buckets.map((b) => b.count));

  return (
    <div className="c500-chart">
      <div className="c500-chart__title">{title}</div>
      {buckets.length === 0 ? (
        <p className="c500-chart__empty">Ainda sem cartas no Main Deck</p>
      ) : (
        <div className="c500-chart__rows" role="table" aria-label={title}>
          {buckets.map((bucket) => (
            <div className="c500-chart__row" role="row" key={bucket.label}>
              <span className="c500-chart__label" role="cell">
                {bucket.label}
              </span>
              <div className="c500-chart__track" role="cell">
                <div
                  className="c500-chart__bar"
                  style={{ width: `${(bucket.count / max) * 100}%`, backgroundColor: bucket.color }}
                />
              </div>
              <span className="c500-chart__count" role="cell">
                {bucket.count}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
