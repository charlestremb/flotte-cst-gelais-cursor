import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { getUnite, updateUnite, getUnites } from "@/lib/unites.functions";
import type { Unite } from "@/lib/unites.functions";
import { getInspectionsForUnite } from "@/lib/inspections.functions";
import type { Inspection } from "@/lib/inspections.functions";
import { StatutBadge } from "@/components/StatutBadge";
import { AlertDot, ResultatBadge, getInspectionAlertLevel } from "@/components/InspectionAlerts";
import { InspectionModal } from "@/components/InspectionModal";
import { ArrowLeft, Save, Plus } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/equipements/$uniteId")({
  loader: async ({ params }) => {
    const [unite, inspections, allUnites] = await Promise.all([
      getUnite({ data: { id: params.uniteId } }),
      getInspectionsForUnite({ data: { uniteId: params.uniteId } }),
      getUnites(),
    ]);
    return { unite, inspections, allUnites };
  },
  component: UniteDetailPage,
  notFoundComponent: () => (
    <div className="text-center py-12">
      <p className="text-muted-foreground">Unité non trouvée</p>
      <Link to="/equipements" className="mt-4 text-primary hover:underline">
        Retour aux équipements
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="text-center py-12">
      <p className="text-destructive">{error.message}</p>
      <Link to="/equipements" className="mt-4 text-primary hover:underline">
        Retour aux équipements
      </Link>
    </div>
  ),
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-4 text-base font-semibold text-primary">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

function DateBadge({ date, label }: { date: string | null; label: string }) {
  if (!date) return <Field label={label} value="—" />;
  const d = new Date(date);
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const isExpiring = d <= in30;
  const isExpired = d < now;

  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 flex items-center gap-2 text-sm font-medium">
        {d.toLocaleDateString("fr-CA")}
        {isExpired && (
          <span className="rounded-full bg-destructive/15 border border-destructive/30 px-2 py-0.5 text-xs text-destructive">
            Expiré
          </span>
        )}
        {!isExpired && isExpiring && (
          <span className="rounded-full bg-destructive/15 border border-destructive/30 px-2 py-0.5 text-xs text-destructive">
            &lt; 30 jours
          </span>
        )}
      </p>
    </div>
  );
}

function UniteDetailPage() {
  const unite = Route.useLoaderData();
  const router = useRouter();
  const [notes, setNotes] = useState(unite.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState<"remiser" | "deremiser" | "vendu" | null>(null);
  const [modalDate, setModalDate] = useState("");
  const [modalDemandePar, setModalDemandePar] = useState("");

  const handleSaveNotes = async () => {
    setSaving(true);
    await updateUnite({ data: { id: unite.id, updates: { notes } } });
    setSaving(false);
  };

  const handleStatusChange = async () => {
    if (!showModal) return;
    const updates: Record<string, unknown> = {};

    if (showModal === "remiser") {
      updates.statut = "remise";
      updates.date_remisage = modalDate || new Date().toISOString().split("T")[0];
      updates.demande_par = modalDemandePar;
    } else if (showModal === "deremiser") {
      updates.statut = "actif";
      updates.date_deremisage = modalDate || new Date().toISOString().split("T")[0];
      updates.demande_par = modalDemandePar;
    } else if (showModal === "vendu") {
      updates.statut = "vendu";
      updates.date_disposition = modalDate || new Date().toISOString().split("T")[0];
    }

    await updateUnite({ data: { id: unite.id, updates } });
    setShowModal(null);
    setModalDate("");
    setModalDemandePar("");
    router.invalidate();
  };

  const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("fr-CA") : "—");
  const fmtMoney = (v: number | null) =>
    v != null ? v.toLocaleString("fr-CA", { style: "currency", currency: "CAD" }) : "—";

  return (
    <div>
      <Link
        to="/equipements"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux équipements
      </Link>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/15 text-primary text-xl font-bold">
          {unite.numero_unite}
        </div>
        <div>
          <h1 className="text-xl font-bold">
            {unite.marque} {unite.modele} ({unite.annee})
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <StatutBadge statut={unite.statut} />
            <span className="text-xs text-muted-foreground">{unite.entite} · {unite.categorie}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Section 1 - Identité */}
        <Section title="Identité">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Numéro d'unité" value={unite.numero_unite} />
            <Field label="Entité" value={unite.entite} />
            <Field label="Catégorie" value={unite.categorie} />
            <Field label="Marque" value={unite.marque} />
            <Field label="Modèle" value={unite.modele} />
            <Field label="Année" value={unite.annee} />
            <Field label="Numéro de série" value={unite.numero_serie} />
            <Field label="Plaque" value={unite.plaque} />
            <Field label="Poids" value={unite.poids} />
            <Field label="Couleur" value={unite.couleur} />
            <Field label="Nb essieux" value={unite.nb_essieux} />
            <Field label="PNVB" value={unite.pnvb} />
          </div>
        </Section>

        {/* Section 2 - Statut */}
        <Section title="Statut de remisage">
          <div className="flex items-center gap-3 mb-4">
            <StatutBadge statut={unite.statut} />
            {unite.date_remisage && (
              <span className="text-xs text-muted-foreground">
                Remisé le {fmt(unite.date_remisage)}
              </span>
            )}
            {unite.demande_par && (
              <span className="text-xs text-muted-foreground">
                par {unite.demande_par}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {unite.statut === "actif" && (
              <button
                onClick={() => setShowModal("remiser")}
                className="rounded-lg bg-destructive/15 border border-destructive/30 px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/25 transition-colors"
              >
                Remiser
              </button>
            )}
            {unite.statut === "remise" && (
              <button
                onClick={() => setShowModal("deremiser")}
                className="rounded-lg bg-success/15 border border-success/30 px-3 py-1.5 text-sm font-medium text-success hover:bg-success/25 transition-colors"
              >
                Déremiser
              </button>
            )}
            {unite.statut !== "vendu" && (
              <button
                onClick={() => setShowModal("vendu")}
                className="rounded-lg bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Marquer comme vendu
              </button>
            )}
          </div>
        </Section>

        {/* Section 3 - Acquisition */}
        <Section title="Acquisition">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date d'achat" value={fmt(unite.date_acquisition)} />
            <Field label="Prix d'achat" value={fmtMoney(unite.prix_achat)} />
            <Field label="Km à l'achat" value={unite.km_achat != null ? `${unite.km_achat.toLocaleString()} km` : "—"} />
            <Field label="Km actuel" value={unite.km_actuel != null ? `${unite.km_actuel.toLocaleString()} km` : "—"} />
            <Field label="Date MAJ km" value={fmt(unite.date_maj_km)} />
          </div>
        </Section>

        {/* Section 4 - Assurances */}
        <Section title="Assurances & Immatriculation">
          <div className="grid grid-cols-2 gap-4">
            <DateBadge date={unite.assurance_expiration} label="Expiration assurance" />
            <DateBadge date={unite.immatriculation_expiration} label="Expiration immatriculation" />
          </div>
        </Section>

        {/* Section 5 - Inspections */}
        <Section title="Inspections">
          <p className="text-sm text-muted-foreground">Aucune inspection enregistrée.</p>
          <button
            disabled
            className="mt-3 rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium text-muted-foreground cursor-not-allowed opacity-50"
          >
            + Ajouter une inspection
          </button>
        </Section>

        {/* Section 6 - Notes */}
        <Section title="Notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-input bg-secondary p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            placeholder="Ajouter une note..."
          />
          <button
            onClick={handleSaveNotes}
            disabled={saving}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        </Section>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">
              {showModal === "remiser"
                ? "Remiser l'unité"
                : showModal === "deremiser"
                  ? "Déremiser l'unité"
                  : "Marquer comme vendu"}
            </h3>
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
              {showModal !== "vendu" && (
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
              )}
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
                onClick={handleStatusChange}
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
