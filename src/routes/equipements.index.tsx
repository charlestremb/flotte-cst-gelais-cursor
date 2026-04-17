import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { getUnites, deleteUnite, updateUnite } from "@/lib/unites.functions";
import type { Unite } from "@/lib/unites.functions";
import { StatutBadge } from "@/components/StatutBadge";
import { UniteFormModal } from "@/components/UniteFormModal";
import { Search, Plus, Download, Trash2, X } from "lucide-react";
import { useState, type ReactNode } from "react";

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
  const [bulkCategorie, setBulkCategorie] = useState<string>("");
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

  const applyBulkCategorie = async () => {
    if (!bulkCategorie || selected.size === 0) return;
    setBulkBusy(true);
    try {
      await Promise.all(
        Array.from(selected).map((id) =>
          updateUnite({ data: { id, updates: { categorie: bulkCategorie } } })
        )
      );
      setSelected(new Set());
      setBulkCategorie("");
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
      <div className="sticky top-0 z-30 -mx-6 -mt-6 bg-background px-6 pt-6 pb-4 border-b border-border">
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
        <div className="mt-4 flex flex-wrap items-center gap-3">
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
      </div>

      {/* Barre d'actions groupées */}
      {selected.size > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 p-3">
          <span className="text-sm font-medium text-foreground">
            {selected.size} unité{selected.size > 1 ? "s" : ""} sélectionnée{selected.size > 1 ? "s" : ""}
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <select
              value={bulkStatut}
              onChange={(e) => setBulkStatut(e.target.value)}
              className="h-9 rounded-lg border border-input bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Changer le statut…</option>
              {STATUT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button
              onClick={applyBulkStatut}
              disabled={!bulkStatut || bulkBusy}
              className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {bulkBusy ? "..." : "Appliquer"}
            </button>
            <select
              value={bulkCategorie}
              onChange={(e) => setBulkCategorie(e.target.value)}
              className="h-9 rounded-lg border border-input bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Changer la catégorie…</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              onClick={applyBulkCategorie}
              disabled={!bulkCategorie || bulkBusy}
              className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {bulkBusy ? "..." : "Appliquer"}
            </button>
            <button
              onClick={() => setConfirmBulkDelete(true)}
              disabled={bulkBusy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              title="Effacer la sélection"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tableau */}
      <div className="mt-5 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50 text-left">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && filtered.every((u) => selected.has(u.id))}
                  ref={(el) => {
                    if (el) {
                      const some = filtered.some((u) => selected.has(u.id));
                      const all = filtered.length > 0 && filtered.every((u) => selected.has(u.id));
                      el.indeterminate = some && !all;
                    }
                  }}
                  onChange={(e) => {
                    if (e.target.checked) setSelected(new Set(filtered.map((u) => u.id)));
                    else setSelected(new Set());
                  }}
                  className="h-4 w-4 cursor-pointer accent-primary"
                  aria-label="Tout sélectionner"
                />
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Unité</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Entité</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Catégorie</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Marque / Modèle</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Année</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Couleur</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Plaque</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">N° série</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Statut</th>
              <th className="px-4 py-3 font-medium text-muted-foreground w-12"></th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const isUnfiltered =
                !search && entite === "all" && categorie === "all" && statut === "all";
              const rows: ReactNode[] = [];
              let lastCat: string | null | undefined = undefined;
              const numCompare = (a: Unite, b: Unite) =>
                (a.numero_unite ?? "").localeCompare(b.numero_unite ?? "", undefined, {
                  numeric: true,
                  sensitivity: "base",
                });
              const sorted = [...filtered].sort(numCompare);
              sorted.forEach((u) => {
                if (isUnfiltered && u.categorie !== lastCat) {
                  lastCat = u.categorie;
                  rows.push(
                    <tr key={`cat-${u.categorie ?? "none"}-${u.id}`} className="bg-primary/15 border-y-2 border-primary/40">
                      <td colSpan={11} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary">
                        {u.categorie ?? "Sans catégorie"}
                      </td>
                    </tr>
                  );
                }
                rows.push(
                  <tr
                    key={u.id}
                    className={`border-b border-border last:border-0 transition-colors ${
                      selected.has(u.id) ? "bg-primary/5" : "hover:bg-secondary/30"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(u.id)}
                        onChange={() => toggleOne(u.id)}
                        className="h-4 w-4 cursor-pointer accent-primary"
                        aria-label={`Sélectionner ${u.numero_unite}`}
                      />
                    </td>
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
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{u.numero_serie ?? "—"}</td>
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
                );
              });
              return rows;
            })()}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">
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
      {confirmBulkDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold">Supprimer {selected.size} unité{selected.size > 1 ? "s" : ""} ?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Vous êtes sur le point de supprimer définitivement{" "}
              <span className="font-semibold text-foreground">{selected.size}</span> unité{selected.size > 1 ? "s" : ""}.
              Toutes les inspections liées seront aussi supprimées. Cette action est irréversible.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmBulkDelete(false)}
                disabled={bulkBusy}
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={applyBulkDelete}
                disabled={bulkBusy}
                className="rounded-lg bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {bulkBusy ? "Suppression..." : "Supprimer définitivement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
