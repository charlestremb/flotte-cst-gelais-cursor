import type { Unite } from "@/lib/unites.functions";
import type { Inspection } from "@/lib/inspections.functions";

/**
 * Pour un laser, retourne "hors_usage" si la dernière calibration
 * (inspection avec une date) date de plus d'un an. Sinon retourne le statut tel quel.
 * Le statut "brise" et autres statuts manuels priment.
 */
export function getEffectiveStatut(
  unite: Pick<Unite, "categorie" | "statut">,
  lastCalibrationDate: string | null,
): string {
  // Statuts manuels prioritaires
  if (
    unite.statut === "brise" ||
    unite.statut === "hors_usage" ||
    unite.statut === "vendu" ||
    unite.statut === "remise" ||
    unite.statut === "a_remiser" ||
    unite.statut === "a_deremiser"
  ) {
    return unite.statut;
  }
  if (unite.categorie !== "Laser") return unite.statut;

  if (!lastCalibrationDate) return "hors_usage";
  const last = new Date(lastCalibrationDate);
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  if (last < oneYearAgo) return "hors_usage";
  return unite.statut;
}

export function getLastCalibration(inspections: Inspection[]): string | null {
  const calibrations = inspections
    .filter((i) => i.date_inspection && i.type_inspection?.toLowerCase().includes("calibration"))
    .sort((a, b) => (a.date_inspection! < b.date_inspection! ? 1 : -1));
  return calibrations[0]?.date_inspection ?? null;
}
