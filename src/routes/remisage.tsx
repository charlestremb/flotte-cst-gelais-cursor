import { createFileRoute, useRouter } from "@tanstack/react-router";
import { getUnites, updateUnite } from "@/lib/unites.functions";
import type { Unite } from "@/lib/unites.functions";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/remisage")({
  loader: () => getUnites(),
  component: RemisagePage,
});

function RemisagePage() {
  const unites = Route.useLoaderData() as Unite[];
  const router = useRouter();
  const [showModal, setShowModal] = useState<{ id: string; action: "remiser" | "deremiser"; numero: string } | null>(null);
  const [modalDate, setModalDate] = useState("");
  const [modalDemandePar, setModalDemandePar] = useState("");

  const aRemiser = unites.filter((u) => u.statut === "a_remiser");
  const aDeremiser = unites.filter((u) => u.statut === "a_deremiser");

  const handleAction = async () => {
    if (!showModal) return;
    const updates: Record<string, unknown> =
      showModal.action === "remiser"
        ? {
            statut: "remise",
            date_remisage: modalDate || new Date().toISOString().split("T")[0],
            demande_par: modalDemandePar,
          }
        : {
            statut: "actif",
            date_deremisage: modalDate || new Date().toISOString().split("T")[0],
            demande_par: modalDemandePar,
          };

    await updateUnite({ data: { id: showModal.id, updates } });
    setShowModal(null);
    setModalDate("");
    setModalDemandePar("");
    router.invalidate();
  };

  const renderRow = (u: Unite, action: "remiser" | "deremiser") => (
    <div
      key={u.id}
      className="rounded-xl border border-border bg-card p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-primary">{u.numero_unite}</span>
            <span className="text-xs text-muted-foreground">{u.entite}</span>
          </div>
          <p className="mt-0.5 text-sm truncate">{u.marque} {u.modele}</p>
          <p className="mt-0.5 text-xs text-muted-foreground font-mono">{u.plaque ?? "—"}</p>
          {u.demande_par && (
            <p className="mt-1 text-xs text-muted-foreground">Demandé par : <span className="text-foreground">{u.demande_par}</span></p>
          )}
        </div>
        <button
          onClick={() => setShowModal({ id: u.id, action, numero: u.numero_unite })}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            action === "remiser"
              ? "bg-destructive/15 border border-destructive/30 text-destructive hover:bg-destructive/25"
              : "bg-success/15 border border-success/30 text-success hover:bg-success/25"
          }`}
        >
          {action === "remiser" ? "Confirmer le remisage" : "Confirmer le déremisage"}
        </button>
      </div>
    </div>
  );

  const emptyState = (
    <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-success">
      <CheckCircle2 className="h-4 w-4" />
      Aucune unité en attente
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold">Remisage</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Gestion des unités à remiser et déremiser
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* À remiser */}
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            À remiser
            <span className="rounded-full bg-warning/15 border border-warning/30 px-2 py-0.5 text-xs font-medium text-warning">
              {aRemiser.length}
            </span>
          </h2>
          <div className="mt-3 space-y-2">
            {aRemiser.length > 0 ? aRemiser.map((u) => renderRow(u, "remiser")) : emptyState}
          </div>
        </div>

        {/* À déremiser */}
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            À déremiser
            <span className="rounded-full bg-primary/15 border border-primary/30 px-2 py-0.5 text-xs font-medium text-primary">
              {aDeremiser.length}
            </span>
          </h2>
          <div className="mt-3 space-y-2">
            {aDeremiser.length > 0 ? aDeremiser.map((u) => renderRow(u, "deremiser")) : emptyState}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-1">
              {showModal.action === "remiser" ? "Confirmer le remisage" : "Confirmer le déremisage"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">Unité {showModal.numero}</p>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground">Date</label>
                <input
                  type="date"
                  value={modalDate}
                  onChange={(e) => setModalDate(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Demandé par</label>
                <input
                  type="text"
                  value={modalDemandePar}
                  onChange={(e) => setModalDemandePar(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Nom de la personne"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowModal(null);
                  setModalDate("");
                  setModalDemandePar("");
                }}
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAction}
                className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
