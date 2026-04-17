import { useMemo, useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { Search, FileText } from "lucide-react";
import type { InspectionWithUnite } from "@/lib/inspections.functions";
import type { Unite } from "@/lib/unites.functions";

type Props = {
  calibrations: InspectionWithUnite[];
  unites: Unite[];
};

/**
 * Affiche, par unité Laser, la dernière calibration connue + le statut
 * (à jour / expirée si > 1 an / jamais).
 */
export function CalibrationsTab({ calibrations, unites }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filtre, setFiltre] = useState<"all" | "ok" | "expiree" | "jamais">("all");

  const lasers = useMemo(
    () => unites.filter((u) => u.categorie === "Laser").sort((a, b) => a.numero_unite.localeCompare(b.numero_unite)),
    [unites]
  );

  const lastByUnite = useMemo(() => {
    const m = new Map<string, InspectionWithUnite>();
    for (const c of calibrations) {
      if (!c.date_inspection) continue;
      const prev = m.get(c.unite_id);
      if (!prev || (prev.date_inspection ?? "") < (c.date_inspection ?? "")) {
        m.set(c.unite_id, c);
      }
    }
    return m;
  }, [calibrations]);

  const oneYearAgo = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d;
  }, []);

  const rows = lasers
    .map((u) => {
      const last = lastByUnite.get(u.id) ?? null;
      const lastDate = last?.date_inspection ?? null;
      const status: "ok" | "expiree" | "jamais" = !lastDate
        ? "jamais"
        : new Date(lastDate) < oneYearAgo
        ? "expiree"
        : "ok";
      return { unite: u, last, lastDate, status };
    })
    .filter((r) => {
      if (filtre !== "all" && r.status !== filtre) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [r.unite.numero_unite, r.unite.marque, r.unite.modele, r.unite.utilisateur]
          .filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

  return (
    <div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher (numéro, marque, utilisateur)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-64 rounded-lg border border-input bg-secondary pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <select
          value={filtre}
          onChange={(e) => setFiltre(e.target.value as any)}
          className="h-9 rounded-lg border border-input bg-secondary px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="all">Tous les lasers</option>
          <option value="ok">Calibration à jour</option>
          <option value="expiree">Calibration expirée (&gt; 1 an)</option>
          <option value="jamais">Jamais calibré</option>
        </select>
        <div className="ml-auto text-xs text-muted-foreground">
          Une calibration par laser est requise tous les 12 mois.
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50 text-left">
              <th className="px-4 py-3 font-medium text-muted-foreground">Unité</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Marque / Modèle</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Utilisateur</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Dernière calibration</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">État</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Document</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const accent =
                r.status === "expiree" || r.status === "jamais"
                  ? "border-l-2 border-l-destructive"
                  : "border-l-2 border-l-success/40";
              const badge =
                r.status === "ok" ? (
                  <span className="inline-flex items-center rounded-full border border-success/30 bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success">
                    À jour
                  </span>
                ) : r.status === "expiree" ? (
                  <span className="inline-flex items-center rounded-full border border-destructive/30 bg-destructive/15 px-2.5 py-0.5 text-xs font-medium text-destructive">
                    Expirée (&gt; 1 an)
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full border border-muted bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    Jamais calibré
                  </span>
                );

              return (
                <tr key={r.unite.id} className={`border-b border-border last:border-0 hover:bg-secondary/30 transition-colors ${accent}`}>
                  <td className="px-4 py-3">
                    <Link
                      to="/equipements/$uniteId"
                      params={{ uniteId: r.unite.id }}
                      className="font-semibold text-primary hover:underline"
                    >
                      {r.unite.numero_unite}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.unite.marque} {r.unite.modele}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.unite.utilisateur ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.lastDate ? new Date(r.lastDate).toLocaleDateString("fr-CA") : "—"}
                  </td>
                  <td className="px-4 py-3">{badge}</td>
                  <td className="px-4 py-3">
                    {r.last?.document_url ? (
                      <a
                        href={r.last.document_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                      >
                        <FileText className="h-3.5 w-3.5" /> Voir
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Aucun laser trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        💡 Pour ajouter ou enregistrer une calibration, ouvrir la fiche du laser et utiliser la section Inspections.
        {/* router used so import is preserved for future use */}
        <span className="hidden">{router ? "" : null}</span>
      </p>
    </div>
  );
}
