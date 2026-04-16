import { useState } from "react";
import { createInspection, TYPES_INSPECTION } from "@/lib/inspections.functions";
import type { Unite } from "@/lib/unites.functions";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  unites: Unite[];
  preselectedUniteId?: string;
};

export function InspectionModal({ open, onClose, onCreated, unites, preselectedUniteId }: Props) {
  const [uniteId, setUniteId] = useState(preselectedUniteId ?? "");
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>(TYPES_INSPECTION[0]);
  const [datePlanifiee, setDatePlanifiee] = useState("");
  const [effectueePar, setEffectueePar] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const filteredUnites = preselectedUniteId
    ? unites.filter((u) => u.id === preselectedUniteId)
    : search
      ? unites.filter((u) => {
          const q = search.toLowerCase();
          return (
            u.numero_unite.toLowerCase().includes(q) ||
            (u.marque ?? "").toLowerCase().includes(q) ||
            (u.modele ?? "").toLowerCase().includes(q)
          );
        }).slice(0, 8)
      : [];

  const handleSubmit = async () => {
    if (!uniteId || !type) return;
    setSaving(true);

    let documentUrl: string | null = null;
    if (pdfFile) {
      setUploading(true);
      const ext = pdfFile.name.split(".").pop() ?? "pdf";
      const path = `${uniteId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("inspection-documents")
        .upload(path, pdfFile, { contentType: pdfFile.type || "application/pdf" });
      setUploading(false);
      if (upErr) {
        alert("Erreur lors du téléversement: " + upErr.message);
        setSaving(false);
        return;
      }
      const { data: pub } = supabase.storage.from("inspection-documents").getPublicUrl(path);
      documentUrl = pub.publicUrl;
    }

    await createInspection({
      data: {
        unite_id: uniteId,
        type_inspection: type,
        prochaine_inspection: datePlanifiee || null,
        effectuee_par: effectueePar || null,
        resultat: "En attente",
        document_url: documentUrl,
      },
    });
    setSaving(false);
    setUniteId(preselectedUniteId ?? "");
    setSearch("");
    setType(TYPES_INSPECTION[0]);
    setDatePlanifiee("");
    setEffectueePar("");
    setPdfFile(null);
    onCreated();
  };

  const selectedUnite = unites.find((u) => u.id === uniteId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Planifier une inspection</h3>
        <div className="space-y-3">
          {!preselectedUniteId && (
            <div>
              <label className="text-sm text-muted-foreground">Unité</label>
              {selectedUnite ? (
                <div className="mt-1 flex items-center justify-between rounded-lg border border-input bg-secondary px-3 py-2 text-sm">
                  <span>
                    <span className="font-semibold text-primary">{selectedUnite.numero_unite}</span>
                    <span className="text-muted-foreground"> — {selectedUnite.marque} {selectedUnite.modele}</span>
                  </span>
                  <button
                    onClick={() => { setUniteId(""); setSearch(""); }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Changer
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher (numéro, marque, modèle)..."
                    className="mt-1 block w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  {filteredUnites.length > 0 && (
                    <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-border bg-secondary">
                      {filteredUnites.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => { setUniteId(u.id); setSearch(""); }}
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-accent"
                        >
                          <span className="font-semibold text-primary">{u.numero_unite}</span>
                          <span className="text-muted-foreground"> — {u.marque} {u.modele} ({u.entite})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {preselectedUniteId && selectedUnite && (
            <div className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm">
              <span className="font-semibold text-primary">{selectedUnite.numero_unite}</span>
              <span className="text-muted-foreground"> — {selectedUnite.marque} {selectedUnite.modele}</span>
            </div>
          )}

          <div>
            <label className="text-sm text-muted-foreground">Type d'inspection</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {TYPES_INSPECTION.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Date planifiée</label>
            <input
              type="date"
              value={datePlanifiee}
              onChange={(e) => setDatePlanifiee(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Effectuée par</label>
            <input
              type="text"
              value={effectueePar}
              onChange={(e) => setEffectueePar(e.target.value)}
              placeholder="Nom du technicien"
              className="mt-1 block w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Document PDF (feuille d'inspection)</label>
            {pdfFile ? (
              <div className="mt-1 flex items-center justify-between rounded-lg border border-input bg-secondary px-3 py-2 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate">{pdfFile.name}</span>
                </div>
                <button
                  onClick={() => setPdfFile(null)}
                  className="text-muted-foreground hover:text-destructive shrink-0 ml-2"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="mt-1 flex items-center justify-center gap-2 rounded-lg border border-dashed border-input bg-secondary px-3 py-4 text-sm text-muted-foreground cursor-pointer hover:bg-accent transition-colors">
                <Upload className="h-4 w-4" />
                <span>Cliquer pour sélectionner un PDF</span>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setPdfFile(f);
                  }}
                />
              </label>
            )}
          </div>

          <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 text-xs text-muted-foreground">
            ✉️ Un courriel sera envoyé automatiquement au garage à la création.
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!uniteId || saving}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {uploading ? "Téléversement..." : saving ? "Enregistrement..." : "Planifier"}
          </button>
        </div>
      </div>
    </div>
  );
}
