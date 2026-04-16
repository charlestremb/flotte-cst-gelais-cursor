import { createFileRoute, Link } from "@tanstack/react-router";
import { getUnites } from "@/lib/unites.functions";
import { StatutBadge } from "@/components/StatutBadge";
import { Search } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/equipements/")({
  loader: () => getUnites(),
  component: EquipementsPage,
});

function EquipementsPage() {
  const unites = Route.useLoaderData();
  const [search, setSearch] = useState("");
  const [entite, setEntite] = useState("all");
  const [categorie, setCategorie] = useState("all");
  const [statut, setStatut] = useState("all");

  const categories = [...new Set(unites.map((u) => u.categorie).filter(Boolean))].sort();

  const filtered = unites.filter((u) => {
    if (entite !== "all" && u.entite !== entite) return false;
    if (categorie !== "all" && u.categorie !== categorie) return false;
    if (statut !== "all" && u.statut !== statut) return false;
    if (search) {
      const q = search.toLowerCase();
      const haystack = [u.numero_unite, u.marque, u.modele, u.plaque]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Équipements</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {filtered.length} unité{filtered.length > 1 ? "s" : ""} affichée{filtered.length > 1 ? "s" : ""}
      </p>

      {/* Filtres */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 rounded-lg border border-input bg-secondary pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <select
          value={entite}
          onChange={(e) => setEntite(e.target.value)}
          className="h-9 rounded-lg border border-input bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="all">Toutes les entités</option>
          <option value="CSTG">CSTG</option>
          <option value="T1C">T1C</option>
          <option value="9487-6216">9487-6216</option>
        </select>
        <select
          value={categorie}
          onChange={(e) => setCategorie(e.target.value)}
          className="h-9 rounded-lg border border-input bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="all">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c} value={c!}>{c}</option>
          ))}
        </select>
        <select
          value={statut}
          onChange={(e) => setStatut(e.target.value)}
          className="h-9 rounded-lg border border-input bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="all">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="remise">Remisé</option>
          <option value="a_remiser">À remiser</option>
          <option value="a_deremiser">À déremiser</option>
          <option value="vendu">Vendu</option>
        </select>
      </div>

      {/* Tableau */}
      <div className="mt-5 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50 text-left">
              <th className="px-4 py-3 font-medium text-muted-foreground">Unité</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Entité</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Catégorie</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Marque / Modèle</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Année</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Plaque</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Statut</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr
                key={u.id}
                className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
              >
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
                <td className="px-4 py-3">{u.categorie}</td>
                <td className="px-4 py-3">
                  {u.marque} {u.modele}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{u.annee}</td>
                <td className="px-4 py-3 font-mono text-xs">{u.plaque}</td>
                <td className="px-4 py-3">
                  <StatutBadge statut={u.statut} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Aucune unité trouvée
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
