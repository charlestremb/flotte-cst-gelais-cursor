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
    vendu: {
      label: "Vendu",
      className: "bg-muted text-muted-foreground border-muted-foreground/30",
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
