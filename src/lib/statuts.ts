/**
 * Statuts « action à faire » : une unité dans l'un de ces statuts
 * apparaît dans la page « Actions à faire ».
 */
export const ACTION_STATUTS = ["a_remiser", "a_deremiser", "a_assurer", "a_immatriculer"] as const;
export type ActionStatut = (typeof ACTION_STATUTS)[number];

export function isActionStatut(statut: string | null | undefined): statut is ActionStatut {
  return !!statut && (ACTION_STATUTS as readonly string[]).includes(statut);
}

/** Liste complète des statuts d'une unité (filtres, formulaires). */
export const STATUT_OPTIONS: { value: string; label: string }[] = [
  { value: "actif", label: "Actif" },
  { value: "brise", label: "Brisé" },
  { value: "hors_usage", label: "Hors d'usage" },
  { value: "interdit_circuler", label: "Interdit de circuler" },
  { value: "remise", label: "Remisé" },
  { value: "a_remiser", label: "À remiser" },
  { value: "a_deremiser", label: "À déremiser" },
  { value: "a_assurer", label: "À assurer" },
  { value: "a_immatriculer", label: "À immatriculer" },
  { value: "vendu", label: "Vendu" },
  { value: "archive", label: "Archivé" },
];
