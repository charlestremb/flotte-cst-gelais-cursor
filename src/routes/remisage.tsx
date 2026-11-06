import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { getUnites, updateUnite } from "@/lib/unites.functions";
import type { Unite } from "@/lib/unites.functions";
import { StatutBadge } from "@/components/StatutBadge";
import { ACTION_STATUTS, isActionStatut, type ActionStatut } from "@/lib/statuts";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/remisage")({
  loader: () => getUnites(),
  component: ActionsPage,
});

const today = () => new Date().toISOString().split("T")[0];

/** Ce que fait le bouton « complété » pour chaque type d'action. */
const ACTION_CONFIG: Record<
  ActionStatut,
  {
    doneLabel: string;
    modalTitle: string;
    withDate: boolean;
    buttonClass: string;
    buildUpdates: (date: string) => Record<string, unknown>;
  }
> = {
  a_remiser: {
    doneLabel: "Remisé",
    modalTitle: "Confirmer le remisage",
    withDate: true,
    buttonClass: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    buildUpdates: (date) => ({ statut: "remise", date_remisage: date }),
  },
  a_deremiser: {
    doneLabel: "Déremisé",
    modalTitle: "Confirmer le déremisage",
    withDate: true,
    buttonClass: "bg-success text-success-foreground hover:bg-success/90",
    buildUpdates: (date) => ({ statut: "actif", date_deremisage: date }),
  },
  a_assurer: {
    doneLabel: "Assuré",
    modalTitle: "Confirmer l'assurance",
    withDate: false,
    buttonClass: "bg-success text-success-foreground hover:bg-success/90",
    buildUpdates: () => ({ statut: "actif" }),
  },
  a_immatriculer: {
    doneLabel: "Immatriculé",
    modalTitle: "Confirmer l'immatriculation",
    withDate: false,
    buttonClass: "bg-success text-success-foreground hover:bg-success/90",
    buildUpdates: () => ({ statut: "actif" }),
  },
};

const FILTER_LABELS: Record<ActionStatut, string> = {
  a_remiser: "À remiser",
  a_deremiser: "À déremiser",
  a_assurer: "À assurer",
  a_immatriculer: "À immatriculer",
};

function ActionsPage() {
  const unites = Route.useLoaderData() as Unite[];
  const router = useRouter();
  const [filter, setFilter] = useState<ActionStatut | "all">("all");
  const [showModal, setShowModal] = useState<{ id: string; statut: ActionStatut; numero: string } | null>(null);
  const [modalDate, setModalDate] = useState("");
  const [modalDemandePar, setModalDemandePar] = useState("");

  const actions = unites
    .filter((u) => isActionStatut(u.statut))
    .sort((a, b) => {
      const sa = ACTION_STATUTS.indexOf(a.statut as ActionStatut);
      const sb = ACTION_STATUTS.indexOf(b.statut as ActionStatut);
      if (sa !== sb) return sa - sb;
      return a.numero_unite.localeCompare(b.numero_unite, "fr-CA", { numeric: true });
    });
  const visibles = filter === "all" ? actions : actions.filter((u) => u.statut === filter);
  const countFor = (s: ActionStatut) => actions.filter((u) => u.statut === s).length;

  const closeModal = () => {
    setShowModal(null);
    setModalDate("");
    setModalDemandePar("");
  };

  const handleAction = async () => {
    if (!showModal) return;
    const updates = {
      ...ACTION_CONFIG[showModal.statut].buildUpdates(modalDate || today()),
      demande_par: modalDemandePar,
    };
    await updateUnite({ data: { id: showModal.id, updates } });
    closeModal();
    router.invalidate();
  };

  const handleQuickDone = async (u: Unite) => {
    const updates = ACTION_CONFIG[u.statut as ActionStatut].buildUpdates(today());
    await updateUnite({ data: { id: u.id, updates } });
    router.invalidate();
  };

  const chipCls = (active: boolean) =>
    `rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-secondary text-muted-foreground hover:text-foreground"
    }`;

  return (
    <div>
      <h1 className="text-2xl font-bold">Actions à faire</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Unités à remiser, déremiser, assurer ou immatriculer
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <button onClick={() => setFilter("all")} className={chipCls(filter === "all")}>
          Toutes ({actions.length})
        </button>
        {ACTION_STATUTS.map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={chipCls(filter === s)}>
            {FILTER_LABELS[s]} ({countFor(s)})
          </button>
        ))}
      </div>

      <div className="mt-4 max-w-3xl space-y-2">
        {visibles.length === 0 ? (
          <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-success">
            <CheckCircle2 className="h-4 w-4" />
            Aucune action à faire
          </div>
        ) : (
          visibles.map((u) => {
            const cfg = ACTION_CONFIG[u.statut as ActionStatut];
            return (
              <div key={u.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to="/equipements/$uniteId"
                        params={{ uniteId: u.id }}
                        className="font-semibold text-primary hover:underline"
                      >
                        {u.numero_unite}
                      </Link>
                      <span className="text-xs text-muted-foreground">{u.entite}</span>
                      <StatutBadge statut={u.statut} />
                    </div>
                    <p className="mt-0.5 truncate text-sm">
                      {u.marque} {u.modele}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">{u.plaque ?? "—"}</p>
                    {u.demande_par && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Demandé par : <span className="text-foreground">{u.demande_par}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <button
                      onClick={() => handleQuickDone(u)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${cfg.buttonClass}`}
                    >
                      {cfg.doneLabel}
                    </button>
                    <button
                      onClick={() =>
                        setShowModal({ id: u.id, statut: u.statut as ActionStatut, numero: u.numero_unite })
                      }
                      className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                      {cfg.withDate ? "Avec date / demandeur…" : "Avec demandeur…"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <h3 className="mb-1 text-lg font-semibold">{ACTION_CONFIG[showModal.statut].modalTitle}</h3>
            <p className="mb-4 text-sm text-muted-foreground">Unité {showModal.numero}</p>
            <div className="space-y-3">
              {ACTION_CONFIG[showModal.statut].withDate && (
                <div>
                  <label className="text-sm text-muted-foreground">Date</label>
                  <input
                    type="date"
                    value={modalDate}
                    onChange={(e) => setModalDate(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              )}
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
                onClick={closeModal}
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Annuler
              </button>
              <button
                onClick={handleAction}
                className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
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
