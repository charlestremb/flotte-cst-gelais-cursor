export function StatutBadge({ statut }: { statut: string }) {
  const config: Record<string, { label: string; className: string }> = {
    actif: {
      label: "Actif",
      className: "bg-success/15 text-success border-success/30",
    },
    remise: {
      label: "Remisé",
      className: "bg-destructive/15 text-destructive border-destructive/30",
    },
    a_remiser: {
      label: "À remiser",
      className: "bg-warning/15 text-warning border-warning/30",
    },
    a_deremiser: {
      label: "À déremiser",
      className: "bg-primary/15 text-primary border-primary/30",
    },
    a_assurer: {
      label: "À assurer",
      className: "bg-assurance/15 text-assurance border-assurance/30",
    },
    a_immatriculer: {
      label: "À immatriculer",
      className: "bg-immatriculation/15 text-immatriculation border-immatriculation/30",
    },
    vendu: {
      label: "Vendu",
      className: "bg-muted text-muted-foreground border-muted-foreground/30",
    },
    brise: {
      label: "Brisé",
      className: "bg-destructive/15 text-destructive border-destructive/30",
    },
    hors_usage: {
      label: "Hors d'usage",
      className: "bg-destructive/25 text-destructive border-destructive/50",
    },
  };

  const c = config[statut] ?? config.actif;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${c.className}`}
    >
      {c.label}
    </span>
  );
}
