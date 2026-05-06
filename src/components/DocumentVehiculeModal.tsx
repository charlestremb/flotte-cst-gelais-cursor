import { useState } from "react";
import { Upload, FileText, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { createDocumentVehicule } from "@/lib/documents.functions";
import type { DocumentType } from "@/lib/documents.functions";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  uniteId: string;
};

function getDefaultDateImmatriculation(): string {
  const now = new Date();
  const year = now > new Date(now.getFullYear(), 2, 31) ? now.getFullYear() + 1 : now.getFullYear();
  return `${year}-03-31`;
}

export function DocumentVehiculeModal({ open, onClose, onCreated, uniteId }: Props) {
  const [type, setType] = useState<DocumentType>("immatriculation");
  const [dateEcheance, setDateEcheance] = useState(getDefaultDateImmatriculation());
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleTypeChange = (newType: DocumentType) => {
    setType(newType);
    if (newType === "immatriculation") {
      setDateEcheance(getDefaultDateImmatriculation());
    } else {
      setDateEcheance("");
    }
  };

  const handleSubmit = async () => {
    if (!pdfFile) {
      setError("Veuillez sélectionner un fichier PDF.");
      return;
    }
    setError(null);
    setSaving(true);

    let documentUrl: string | null = null;
    let nomFichier: string | null = pdfFile.name;

    setUploading(true);
    const ext = pdfFile.name.split(".").pop() ?? "pdf";
    const path = `${uniteId}/${type}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("vehicule-documents")
      .upload(path, pdfFile, { contentType: pdfFile.type || "application/pdf" });
    setUploading(false);

    if (upErr) {
      setError("Erreur lors du téléversement : " + upErr.message);
      setSaving(false);
      return;
    }

    const { data: pub } = supabase.storage.from("vehicule-documents").getPublicUrl(path);
    documentUrl = pub.publicUrl;

    await createDocumentVehicule({
      data: {
        unite_id: uniteId,
        type,
        date_echeance: dateEcheance || null,
        document_url: documentUrl,
        nom_fichier: nomFichier,
      },
    });

    setSaving(false);
    setType("immatriculation");
    setDateEcheance(getDefaultDateImmatriculation());
    setPdfFile(null);
    onCreated();
    onClose();
  };

  const inputCls =
    "mt-1 block w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
        <h3 className="text-lg font-semibold mb-4">Ajouter un document</h3>

        {error && (
          <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Type */}
          <div>
            <label className="text-sm font-medium text-foreground">Type de document</label>
            <div className="mt-2 flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="immatriculation"
                  checked={type === "immatriculation"}
                  onChange={() => handleTypeChange("immatriculation")}
                  className="accent-primary"
                />
                <span className="text-sm text-foreground">Immatriculation</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="assurance"
                  checked={type === "assurance"}
                  onChange={() => handleTypeChange("assurance")}
                  className="accent-primary"
                />
                <span className="text-sm text-foreground">Assurance</span>
              </label>
            </div>
          </div>

          {/* Date d'échéance */}
          <div>
            <label className="text-sm text-muted-foreground">
              Date d'échéance
              {type === "immatriculation" && (
                <span className="ml-1 text-xs text-primary">(31 mars par défaut)</span>
              )}
            </label>
            <input
              type="date"
              value={dateEcheance}
              onChange={(e) => setDateEcheance(e.target.value)}
              className={inputCls}
            />
          </div>

          {/* PDF */}
          <div>
            <label className="text-sm text-muted-foreground">
              {type === "immatriculation" ? "Certificat d'immatriculation PDF" : "Police d'assurance PDF"}
            </label>
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
            disabled={!pdfFile || saving}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {uploading ? "Téléversement..." : saving ? "Enregistrement..." : "Ajouter"}
          </button>
        </div>
      </div>
    </div>
  );
}
