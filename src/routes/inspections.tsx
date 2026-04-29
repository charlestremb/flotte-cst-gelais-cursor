import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search, FileText, CalendarPlus, CheckCircle2, Trash2 } from "lucide-react";
import { getInspections, TYPES_INSPECTION, deleteInspection } from "@/lib/inspections.functions";
import type { InspectionWithUnite } from "@/lib/inspections.functions";
import { getUnites } from "@/lib/unites.functions";
import type { Unite } from "@/lib/unites.functions";
import { AlertDot, WorkflowBadge, ResultatBadge, getInspectionAlertLevel } from "@/components/InspectionAlerts";
import { InspectionModal } from "@/components/InspectionModal";
import { PlanifierModal, TerminerModal } from "@/components/PlanifierModal";
import { CalibrationsTab } from "@/components/CalibrationsTab";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/inspections")({
  loader: async () => {
    const [inspections, unites] = await Promise.all([getInspections(), getUnites()]);
    return { inspections, unites };
  },
  component: InspectionsPage,
});

type Tab = "vehicules" | "calibrations";

function InspectionsPage() {
  const data = Route.useLoaderData() as { inspections: InspectionWithUnite[]; unites: Unite[] };
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState<Tab>("vehicules");
  const [search, setSearch] = useState("");
  const [entite, setEntite] = useState("all");
  const [type, setType] = useState("all");
  const [statut, setStatut] = useState<string>("actives");
  const [showModal, setShowModal] = useState(false);
  const [planifierFor, setPlanifierFor] = useState<InspectionWithUnite | null>(null);
  const [terminerFor, setTerminerFor] = useState<InspectionWithUnite | null>(null);

  // Sépare laser (calibrations) et autres (inspections véhicules)
  const inspectionsVehicules = data.inspections.filter((i) => i.unite?.categorie !== "Laser");
  const calibrationsLaser = data.inspections.filter((i) => i.unite?.categorie === "Laser");

  const filtered = inspectionsVehicules.filter((i) => {
    if (entite !== "all" && i.unite?.entite !== entite) return false;
    if (type !== "all" && i.type_inspection !== type) return false;
    if (statut === "actives" && i.statut_workflow === "terminee") return false;
    if (statut !== "all" && statut !== "actives" && i.statut_workflow !== statut) return false;
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
  const uniteLabel = (i: InspectionWithUnite) =>
    i.unite ? `${i.unite.numero_unite} — ${i.unite.marque ?? ""} ${i.unite.modele ?? ""}`.trim() : "—";

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Inspections</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tab === "vehicules"
              ? `${filtered.length} inspection${filtered.length > 1 ? "s" : ""} affichée${filtered.length > 1 ? "s" : ""}`
              : `${calibrationsLaser.length} calibration${calibrationsLaser.length > 1 ? "s" : ""}`}
          </p>
        </div>
        {tab === "vehicules" && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouvelle inspection
          </button>
        )}
      </div>

      {/* Onglets */}
      <div className="mt-5 flex gap-1 border-b border-border">
        <button
          onClick={() => setTab("vehicules")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === "vehicules" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Inspections véhicules
        </button>
        <button
          onClick={() => setTab("calibrations")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === "calibrations" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Calibrations laser
        </button>
      </div>

      {tab === "calibrations" ? (
        <CalibrationsTab calibrations={calibrationsLaser} unites={data.unites} />
      ) : (
        <>
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
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
              className="h-9 rounded-lg border border-input bg-secondary px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="actives">En cours (à planifier + planifiées)</option>
              <option value="a_planifier">À planifier</option>
              <option value="planifiee">Planifiées</option>
              <option value="terminee">Terminées (archivées)</option>
              <option value="all">Toutes</option>
            </select>
          </div>

          {/* Tableau */}
          <div className="mt-5 overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50 text-left">
                  <th className="px-4 py-3 font-medium text-muted-foreground w-8"></th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Unité</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Réception lettre</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Date limite</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Date inspection</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">État</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">PDF</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((i) => {
                  const level = getInspectionAlertLevel(i.date_limite ?? i.prochaine_inspection);
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
                          <div>
                            <Link
                              to="/equipements/$uniteId"
                              params={{ uniteId: i.unite.id }}
                              className="font-semibold text-primary hover:underline"
                            >
                              {i.unite.numero_unite}
                            </Link>
                            <div className="text-xs text-muted-foreground">{i.unite.marque} {i.unite.modele}</div>
                          </div>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3">{i.type_inspection}</td>
                      <td className="px-4 py-3 text-muted-foreground">{fmt(i.date_reception_lettre)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{fmt(i.date_limite)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{fmt(i.date_inspection)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <WorkflowBadge statut={i.statut_workflow} />
                          {i.statut_workflow === "terminee" && <ResultatBadge resultat={i.resultat} />}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {i.document_url ? (
                          <a href={i.document_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline text-xs">
                            <FileText className="h-3.5 w-3.5" /> Voir
                          </a>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {i.statut_workflow === "a_planifier" && (
                            <button
                              onClick={() => setPlanifierFor(i)}
                              className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                            >
                              <CalendarPlus className="h-3.5 w-3.5" />
                              Planifier
                            </button>
                          )}
                          {i.statut_workflow === "planifiee" && (
                            <button
                              onClick={() => setTerminerFor(i)}
                              className="inline-flex items-center gap-1 rounded-lg bg-success px-2.5 py-1 text-xs font-medium text-success-foreground hover:bg-success/90 transition-colors"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Inspection terminée
                            </button>
                          )}
                          {i.statut_workflow === "terminee" && (
                            <span className="text-xs text-muted-foreground">Archivée</span>
                          )}
                          {isAdmin && (
                            <button
                              onClick={async () => {
                                if (!confirm(`Supprimer cette inspection (${i.type_inspection}) ?\nCette action est irréversible.`)) return;
                                await deleteInspection({ data: { id: i.id } });
                                router.invalidate();
                              }}
                              title="Supprimer l'inspection"
                              className="inline-flex items-center justify-center rounded-lg border border-border p-1.5 text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                      Aucune inspection trouvée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <InspectionModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={() => {
          setShowModal(false);
          router.invalidate();
        }}
        unites={data.unites}
      />

      {planifierFor && (
        <PlanifierModal
          open={!!planifierFor}
          onClose={() => setPlanifierFor(null)}
          inspectionId={planifierFor.id}
          uniteLabel={uniteLabel(planifierFor)}
          defaultDate={planifierFor.date_limite}
        />
      )}

      {terminerFor && (
        <TerminerModal
          open={!!terminerFor}
          onClose={() => setTerminerFor(null)}
          inspectionId={terminerFor.id}
          uniteLabel={uniteLabel(terminerFor)}
        />
      )}
    </div>
  );
}
