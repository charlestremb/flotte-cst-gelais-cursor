import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getEntites, createEntite, deleteEntite } from "@/lib/entites.functions";
import type { Entite } from "@/lib/entites.functions";
import { Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/admin/entites")({
  loader: () => getEntites(),
  component: EntitesPage,
});

function EntitesPage() {
  const entites = Route.useLoaderData() as Entite[];
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuth();
  const [nom, setNom] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Entite | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (authLoading) return null;
  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Accès réservé aux administrateurs.</p>
      </div>
    );
  }

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      await createEntite({ data: { nom: nom.trim() } });
      setNom("");
      router.invalidate();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteEntite({ data: { id: confirmDelete.id } });
      setConfirmDelete(null);
      router.invalidate();
    } catch (err) {
      alert("Erreur lors de la suppression : " + (err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  const inputCls =
    "h-9 rounded-lg border border-input bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring";

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold">Entités</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Gérez les entités juridiques disponibles dans la flotte.
      </p>

      {/* Formulaire d'ajout */}
      <form onSubmit={handleCreate} className="mt-6 flex gap-2">
        <input
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Nom de la nouvelle entité…"
          className={`flex-1 ${inputCls}`}
          maxLength={80}
        />
        <button
          type="submit"
          disabled={submitting || !nom.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Ajouter
        </button>
      </form>

      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}

      {/* Liste */}
      <div className="mt-6 rounded-xl border border-border overflow-hidden">
        {entites.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Aucune entité configurée.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Nom</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Ajoutée le</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {entites.map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{e.nom}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(e.created_at).toLocaleDateString("fr-CA")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setConfirmDelete(e)}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      title="Supprimer cette entité"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Confirmation suppression */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold">Supprimer cette entité ?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Vous êtes sur le point de supprimer l'entité{" "}
              <span className="font-semibold text-foreground">{confirmDelete.nom}</span>.
              Les unités existantes conserveront leur valeur, mais elle ne sera plus disponible dans les formulaires.
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
                {deleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
