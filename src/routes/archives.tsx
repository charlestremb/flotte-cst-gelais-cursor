import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { getUnites, deleteUnite, updateUnite } from "@/lib/unites.functions";
import type { Unite } from "@/lib/unites.functions";
import { StatutBadge } from "@/components/StatutBadge";
import { Trash2, ArchiveRestore } from "lucide-react";

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
  const router = useRouter();
  const vendues = unites.filter((u) => u.statut === "vendu");

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("fr-CA") : "—";
  const fmtMoney = (v: number | null) =>
    v != null ? v.toLocaleString("fr-CA", { style: "currency", currency: "CAD" }) : "—";

  const handleDelete = async (u: Unite) => {
    if (!confirm(`Supprimer définitivement l'unité ${u.numero_unite} ?\n\nToutes les inspections liées seront aussi supprimées.\nCette action est irréversible.`)) return;
    await deleteUnite({ data: { id: u.id } });
    router.invalidate();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Archives</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Unités vendues ou disposées — {vendues.length} unité{vendues.length > 1 ? "s" : ""}
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
              <th className="px-4 py-3 font-medium text-muted-foreground text-right">Action</th>
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
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(u)}
                    title="Supprimer définitivement"
                    className="inline-flex items-center justify-center rounded-lg border border-border p-1.5 text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {vendues.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
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
