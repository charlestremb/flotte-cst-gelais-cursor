import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { getUnites, deleteUnite, updateUnite } from "@/lib/unites.functions";
import type { Unite } from "@/lib/unites.functions";
import { StatutBadge } from "@/components/StatutBadge";
import { UniteFormModal } from "@/components/UniteFormModal";
import { Search, Plus, Download, Trash2, X } from "lucide-react";
import { useState } from "react";

const STATUT_OPTIONS: { value: string; label: string }[] = [
  { value: "actif", label: "Actif" },
  { value: "remise", label: "Remisé" },
  { value: "a_remiser", label: "À remiser" },
  { value: "a_deremiser", label: "À déremiser" },
  { value: "vendu", label: "Vendu" },
];

export const Route = createFileRoute("/equipements/")({
  loader: () => getUnites(),
  component: EquipementsPage,
});

function EquipementsPage() {
  const unites = Route.useLoaderData() as Unite[];
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [entite, setEntite] = useState("all");
  const [categorie, setCategorie] = useState("all");
  const [statut, setStatut] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Unite | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatut, setBulkStatut] = useState<string>("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteUnite({ data: { id: confirmDelete.id } });
      setConfirmDelete(null);
      router.invalidate();
    } catch (e) {
      alert("Erreur lors de la suppression : " + (e as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const applyBulkStatut = async () => {
    if (!bulkStatut || selected.size === 0) return;
    setBulkBusy(true);
    try {
      await Promise.all(
        Array.from(selected).map((id) =>
          updateUnite({ data: { id, updates: { statut: bulkStatut } } })
        )
      );
      setSelected(new Set());
      setBulkStatut("");
      router.invalidate();
    } catch (e) {
      alert("Erreur lors de la mise à jour : " + (e as Error).message);
    } finally {
      setBulkBusy(false);
    }
  };

  const applyBulkDelete = async () => {
    setBulkBusy(true);
    try {
      await Promise.all(Array.from(selected).map((id) => deleteUnite({ data: { id } })));
      setSelected(new Set());
      setConfirmBulkDelete(false);
      router.invalidate();
    } catch (e) {
      alert("Erreur lors de la suppression : " + (e as Error).message);
    } finally {
      setBulkBusy(false);
    }
  };

  const categories = [...new Set(unites.map((u: Unite) => u.categorie).filter(Boolean))].sort() as string[];

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

  const exportCSV = () => {
    const headers = ["Unité", "Entité", "Catégorie", "Marque", "Modèle", "Année", "Plaque", "N° série", "Statut"];
    const escape = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = filtered.map((u) =>
      [u.numero_unite, u.entite, u.categorie, u.marque, u.modele, u.annee, u.plaque, u.numero_serie, u.statut]
        .map(escape)
        .join(";")
    );
    const csv = "\uFEFF" + [headers.join(";"), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `equipements-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Équipements</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} unité{filtered.length > 1 ? "s" : ""} affichée{filtered.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            <Download className="h-4 w-4" />
            Exporter CSV
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ajouter une unité
          </button>
        </div>
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
              <th className="px-4 py-3 font-medium text-muted-foreground">Couleur</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Plaque</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Statut</th>
              <th className="px-4 py-3 font-medium text-muted-foreground w-12"></th>
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
                <td className="px-4 py-3 text-muted-foreground">{u.couleur ?? "—"}</td>
                <td className="px-4 py-3 font-mono text-xs">{u.plaque}</td>
                <td className="px-4 py-3">
                  <StatutBadge statut={u.statut} />
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setConfirmDelete(u)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    title="Supprimer cette unité"
                    aria-label="Supprimer cette unité"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                  Aucune unité trouvée
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <UniteFormModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onCreated={() => {
          setShowAdd(false);
          router.invalidate();
        }}
      />

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold">Supprimer cette unité ?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Vous êtes sur le point de supprimer définitivement l'unité{" "}
              <span className="font-semibold text-foreground">{confirmDelete.numero_unite}</span>
              {confirmDelete.marque && <> ({confirmDelete.marque} {confirmDelete.modele})</>}.
              Toutes les inspections liées seront aussi supprimées. Cette action est irréversible.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {deleting ? "Suppression..." : "Supprimer définitivement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
