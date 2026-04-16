import { createFileRoute, Link } from "@tanstack/react-router";
import { getUnites } from "@/lib/unites.functions";
import type { Unite } from "@/lib/unites.functions";
import { StatutBadge } from "@/components/StatutBadge";

export const Route = createFileRoute("/archives")({
  loader: () => getUnites(),
  component: ArchivesPage,
  errorComponent: ({ error }) => (
    <div className="text-center py-12">
      <p className="text-destructive">{error.message}</p>
    </div>
  ),
});

function ArchivesPage() {
  const unites = Route.useLoaderData() as Unite[];
  const vendues = unites.filter((u) => u.statut === "vendu");

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("fr-CA") : "—";
  const fmtMoney = (v: number | null) =>
    v != null ? v.toLocaleString("fr-CA", { style: "currency", currency: "CAD" }) : "—";

  return (
    <div>
      <h1 className="text-2xl font-bold">Archives</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Unités vendues ou disposées (lecture seule) — {vendues.length} unité{vendues.length > 1 ? "s" : ""}
      </p>

      <div className="mt-5 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50 text-left">
              <th className="px-4 py-3 font-medium text-muted-foreground">Unité</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Entité</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Marque / Modèle</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Année</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Date de disposition</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Prix d'achat</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Statut</th>
            </tr>
          </thead>
          <tbody>
            {vendues.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                <td className="px-4 py-3">
                  <Link
                    to="/equipements/$uniteId"
                    params={{ uniteId: u.id }}
                    className="font-semibold text-primary hover:underline"
                  >
                    {u.numero_unite}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{u.entite}</td>
                <td className="px-4 py-3">{u.marque} {u.modele}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.annee}</td>
                <td className="px-4 py-3 text-muted-foreground">{fmt(u.date_disposition)}</td>
                <td className="px-4 py-3 text-muted-foreground">{fmtMoney(u.prix_achat)}</td>
                <td className="px-4 py-3"><StatutBadge statut={u.statut} /></td>
              </tr>
            ))}
            {vendues.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Aucune unité archivée
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
