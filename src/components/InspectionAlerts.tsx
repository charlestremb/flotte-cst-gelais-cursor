export function getInspectionAlertLevel(prochaine: string | null): "ok" | "warning" | "danger" | "none" {
  if (!prochaine) return "none";
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const date = new Date(prochaine);
  date.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "danger";
  if (diffDays <= 14) return "warning";
  return "ok";
}

export function AlertDot({ level }: { level: "ok" | "warning" | "danger" | "none" }) {
  const config = {
    ok: { color: "bg-success", label: "OK" },
    warning: { color: "bg-warning", label: "Bientôt" },
    danger: { color: "bg-destructive", label: "En retard" },
    none: { color: "bg-muted-foreground/40", label: "—" },
  };
  const c = config[level];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className={`h-2 w-2 rounded-full ${c.color}`} />
      <span className="text-muted-foreground">{c.label}</span>
    </span>
  );
}

export function ResultatBadge({ resultat }: { resultat: string }) {
  const config: Record<string, string> = {
    "Passé": "bg-success/15 text-success border-success/30",
    "Échoué": "bg-destructive/15 text-destructive border-destructive/30",
    "En attente": "bg-warning/15 text-warning border-warning/30",
  };
  const className = config[resultat] ?? "bg-muted text-muted-foreground border-muted";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {resultat}
    </span>
  );
}

export function WorkflowBadge({ statut }: { statut: string }) {
  const config: Record<string, { label: string; cls: string }> = {
    a_planifier: { label: "À planifier", cls: "bg-warning/15 text-warning border-warning/30" },
    planifiee: { label: "Planifiée", cls: "bg-primary/15 text-primary border-primary/30" },
    terminee: { label: "Terminée", cls: "bg-success/15 text-success border-success/30" },
  };
  const c = config[statut] ?? { label: statut, cls: "bg-muted text-muted-foreground border-muted" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${c.cls}`}>
      {c.label}
    </span>
  );
}
