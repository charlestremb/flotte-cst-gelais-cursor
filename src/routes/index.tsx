import { createFileRoute, Link } from "@tanstack/react-router";
import { getUnites } from "@/lib/unites.functions";
import type { Unite } from "@/lib/unites.functions";
import { getInspections } from "@/lib/inspections.functions";
import type { InspectionWithUnite } from "@/lib/inspections.functions";
import {
  Truck,
  ParkingSquare,
  AlertTriangle,
  ShieldAlert,
  ClipboardCheck,
  CalendarClock,
  FileWarning,
} from "lucide-react";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [unites, inspections] = await Promise.all([getUnites(), getInspections()]);
    return { unites, inspections };
  },
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
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={`rounded-lg p-2.5 ${iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function AlertList({
  title,
  icon: Icon,
  variant,
  items,
}: {
  title: string;
  icon: React.ElementType;
  variant: "danger" | "warning";
  items: { id: string; label: string; sub: string }[];
}) {
  const colors = variant === "danger"
    ? { border: "border-destructive/40", text: "text-destructive", bg: "bg-destructive/10" }
    : { border: "border-warning/40", text: "text-warning", bg: "bg-warning/10" };

  return (
    <div className={`rounded-xl border ${colors.border} bg-card p-4`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`rounded-md ${colors.bg} p-1.5 ${colors.text}`}>
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}>
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">Aucune alerte ✓</p>
      ) : (
        <ul className="space-y-1.5 max-h-48 overflow-y-auto">
          {items.slice(0, 8).map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate">{item.label}</span>
              <span className={`shrink-0 font-mono ${colors.text}`}>{item.sub}</span>
            </li>
          ))}
          {items.length > 8 && (
            <li className="text-xs text-muted-foreground italic">+{items.length - 8} autres…</li>
          )}
        </ul>
      )}
    </div>
  );
}

function DashboardPage() {
  const { unites, inspections } = Route.useLoaderData() as {
    unites: Unite[];
    inspections: InspectionWithUnite[];
  };

  const actifs = unites.filter((u) => u.statut === "actif");
  const remises = unites.filter((u) => u.statut === "remise");
  const aRemiser = unites.filter((u) => u.statut === "a_remiser" || u.statut === "a_deremiser");

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const fmt = (d: string) => new Date(d).toLocaleDateString("fr-CA");

  const assurancesAlerts = unites
    .filter((u) => u.assurance_expiration && new Date(u.assurance_expiration) <= in30Days)
    .map((u) => ({
      id: u.id,
      label: `${u.numero_unite} — ${u.marque ?? ""} ${u.modele ?? ""}`,
      sub: fmt(u.assurance_expiration!),
    }));

  const immatAlerts = unites
    .filter((u) => u.immatriculation_expiration && new Date(u.immatriculation_expiration) <= in30Days)
    .map((u) => ({
      id: u.id,
      label: `${u.numero_unite} — ${u.marque ?? ""} ${u.modele ?? ""}`,
      sub: fmt(u.immatriculation_expiration!),
    }));

  const inspectionsRetard = inspections
    .filter((i) => i.prochaine_inspection && new Date(i.prochaine_inspection) < now)
    .map((i) => ({
      id: i.id,
      label: `${i.unite?.numero_unite ?? "?"} — ${i.type_inspection}`,
      sub: fmt(i.prochaine_inspection!),
    }));

  const inspectionsBientot = inspections
    .filter((i) => {
      if (!i.prochaine_inspection) return false;
      const d = new Date(i.prochaine_inspection);
      return d >= now && d <= in14Days;
    })
    .map((i) => ({
      id: i.id,
      label: `${i.unite?.numero_unite ?? "?"} — ${i.type_inspection}`,
      sub: fmt(i.prochaine_inspection!),
    }));

  const totalAlerts = assurancesAlerts.length + immatAlerts.length + inspectionsRetard.length;
  const entites = ["CSTG", "T1C", "9487-6216"] as const;

  return (
    <div>
      <h1 className="text-2xl font-bold">Tableau de bord</h1>
      <p className="mt-1 text-sm text-muted-foreground">Vue d'ensemble de la flotte CST Gelais</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Unités actives" value={actifs.length} icon={Truck} subtitle={`sur ${unites.length} au total`} />
        <StatCard title="Unités remisées" value={remises.length} icon={ParkingSquare} />
        <StatCard title="À remiser / déremiser" value={aRemiser.length} icon={AlertTriangle} variant="warning" />
        <StatCard title="Alertes critiques" value={totalAlerts} icon={ShieldAlert} variant="danger" />
      </div>

      {/* Alertes actives */}
      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Alertes actives</h2>
        <Link to="/inspections" className="text-xs text-primary hover:underline">
          Voir les inspections →
        </Link>
      </div>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AlertList title="Assurances < 30j" icon={ShieldAlert} variant="danger" items={assurancesAlerts} />
        <AlertList title="Immatriculations < 30j" icon={FileWarning} variant="danger" items={immatAlerts} />
        <AlertList title="Inspections en retard" icon={ClipboardCheck} variant="danger" items={inspectionsRetard} />
        <AlertList title="Inspections < 14j" icon={CalendarClock} variant="warning" items={inspectionsBientot} />
      </div>

      {/* Par entité */}
      <h2 className="mt-8 text-lg font-semibold">Répartition par entité</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-3">
        {entites.map((ent) => {
          const count = actifs.filter((u) => u.entite === ent).length;
          const total = unites.filter((u) => u.entite === ent).length;
          return (
            <div key={ent} className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm font-medium text-primary">{ent}</p>
              <p className="mt-1 text-2xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground">actifs sur {total}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
