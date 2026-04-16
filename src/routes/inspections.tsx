import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { getInspections, TYPES_INSPECTION, RESULTATS } from "@/lib/inspections.functions";
import type { InspectionWithUnite } from "@/lib/inspections.functions";
import { getUnites } from "@/lib/unites.functions";
import type { Unite } from "@/lib/unites.functions";
import { AlertDot, ResultatBadge, getInspectionAlertLevel } from "@/components/InspectionAlerts";
import { InspectionModal } from "@/components/InspectionModal";

export const Route = createFileRoute("/inspections")({
  loader: async () => {
    const [inspections, unites] = await Promise.all([getInspections(), getUnites()]);
    return { inspections, unites };
  },
  component: InspectionsPage,
});

function InspectionsPage() {
  const data = Route.useLoaderData() as { inspections: InspectionWithUnite[]; unites: Unite[] };
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [entite, setEntite] = useState("all");
  const [type, setType] = useState("all");
  const [resultat, setResultat] = useState("all");
  const [showModal, setShowModal] = useState(false);

  const filtered = data.inspections.filter((i) => {
    if (entite !== "all" && i.unite?.entite !== entite) return false;
    if (type !== "all" && i.type_inspection !== type) return false;
    if (resultat !== "all" && i.resultat !== resultat) return false;
    if (search) {
      const q = search.toLowerCase();
      const haystack = [
        i.unite?.numero_unite,
        i.unite?.marque,
        i.unite?.modele,
        i.effectuee_par,
      ].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const fmt = (d: string | null) => (d ? d.slice(0, 10) : "—");

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Inspections</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} inspection{filtered.length > 1 ? "s" : ""} affichée{filtered.length > 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Planifier une inspection
        </button>
      </div>

      {/* Filtres */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 rounded-lg border border-input bg-secondary pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <select
          value={entite}
          onChange={(e) => setEntite(e.target.value)}
          className="h-9 rounded-lg border border-input bg-secondary px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="all">Toutes les entités</option>
          <option value="CSTG">CSTG</option>
          <option value="9487-6216">9487-6216</option>
        </select>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="h-9 rounded-lg border border-input bg-secondary px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="all">Tous les types</option>
          {TYPES_INSPECTION.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          value={resultat}
          onChange={(e) => setResultat(e.target.value)}
          className="h-9 rounded-lg border border-input bg-secondary px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="all">Tous les résultats</option>
          {RESULTATS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Tableau */}
      <div className="mt-5 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50 text-left">
              <th className="px-4 py-3 font-medium text-muted-foreground w-8"></th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Unité</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Marque / Modèle</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Date prévue</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Effectuée par</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Statut</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => {
              const level = getInspectionAlertLevel(i.prochaine_inspection);
              const rowAccent =
                level === "danger" ? "border-l-2 border-l-destructive" :
                level === "warning" ? "border-l-2 border-l-warning" :
                level === "ok" ? "border-l-2 border-l-success/40" : "";
              return (
                <tr key={i.id} className={`border-b border-border last:border-0 hover:bg-secondary/30 transition-colors ${rowAccent}`}>
                  <td className="px-4 py-3">
                    <AlertDot level={level} />
                  </td>
                  <td className="px-4 py-3">
                    {i.unite ? (
                      <Link
                        to="/equipements/$uniteId"
                        params={{ uniteId: i.unite.id }}
                        className="font-semibold text-primary hover:underline"
                      >
                        {i.unite.numero_unite}
                      </Link>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {i.unite?.marque} {i.unite?.modele}
                  </td>
                  <td className="px-4 py-3">{i.type_inspection}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmt(i.prochaine_inspection)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{i.effectuee_par ?? "—"}</td>
                  <td className="px-4 py-3">
                    <ResultatBadge resultat={i.resultat} />
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Aucune inspection trouvée
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <InspectionModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={() => {
          setShowModal(false);
          router.invalidate();
        }}
        unites={data.unites}
      />
    </div>
  );
}
