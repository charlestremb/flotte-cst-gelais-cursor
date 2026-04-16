import { createFileRoute } from "@tanstack/react-router";
import { getUnites, type Unite } from "@/lib/unites.functions";
import { Truck, ParkingSquare, AlertTriangle, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/")({
  loader: () => getUnites(),
  component: DashboardPage,
});

function StatCard({
  title,
  value,
  icon: Icon,
  variant = "default",
  subtitle,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  variant?: "default" | "warning" | "danger";
  subtitle?: string;
}) {
  const borderColor =
    variant === "danger"
      ? "border-destructive/40"
      : variant === "warning"
        ? "border-primary/40"
        : "border-border";

  const iconBg =
    variant === "danger"
      ? "bg-destructive/15 text-destructive"
      : variant === "warning"
        ? "bg-primary/15 text-primary"
        : "bg-secondary text-muted-foreground";

  return (
    <div className={`rounded-xl border ${borderColor} bg-card p-5`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-3xl font-bold">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={`rounded-lg p-2.5 ${iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function DashboardPage() {
  const unites = Route.useLoaderData();

  const actifs = unites.filter((u) => u.statut === "actif");
  const remises = unites.filter((u) => u.statut === "remise");
  const aRemiser = unites.filter(
    (u) => u.statut === "a_remiser" || u.statut === "a_deremiser"
  );

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const assurancesExpirantes = unites.filter((u) => {
    if (!u.assurance_expiration) return false;
    const d = new Date(u.assurance_expiration);
    return d <= in30Days && d >= now;
  });

  const entites = ["CSTG", "T1C", "9487-6216"] as const;

  return (
    <div>
      <h1 className="text-2xl font-bold">Tableau de bord</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Vue d'ensemble de la flotte CST Gelais
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Unités actives"
          value={actifs.length}
          icon={Truck}
          subtitle={`sur ${unites.length} au total`}
        />
        <StatCard
          title="Unités remisées"
          value={remises.length}
          icon={ParkingSquare}
        />
        <StatCard
          title="À remiser / déremiser"
          value={aRemiser.length}
          icon={AlertTriangle}
          variant="warning"
        />
        <StatCard
          title="Assurances < 30 jours"
          value={assurancesExpirantes.length}
          icon={ShieldAlert}
          variant="danger"
        />
      </div>

      {/* Par entité */}
      <h2 className="mt-8 text-lg font-semibold">Répartition par entité</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-3">
        {entites.map((ent) => {
          const count = actifs.filter((u) => u.entite === ent).length;
          const total = unites.filter((u) => u.entite === ent).length;
          return (
            <div
              key={ent}
              className="rounded-xl border border-border bg-card p-5"
            >
              <p className="text-sm font-medium text-primary">{ent}</p>
              <p className="mt-1 text-2xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground">
                actifs sur {total}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
