import type { Zone } from "../deck/types";

/**
 * LigaMagic's own zone header labels, as observed on live deck pages (and, for
 * Comandante Parceiro / Maybeboard, as named directly in the product brief —
 * LigaMagic keeps "Sideboard" and "Maybeboard" in English and mixes English
 * "Comandante" with Portuguese "Parceiro" for the partner-commander zone).
 */
const ZONE_LABELS: Record<string, Zone> = {
  Comandante: "comandante",
  "Comandante Parceiro": "comandanteParceiro",
  Sideboard: "sideboard",
  Maybeboard: "maybeboard",
};

export function zoneForHeaderLabel(label: string): Zone | undefined {
  return ZONE_LABELS[label.trim()];
}
