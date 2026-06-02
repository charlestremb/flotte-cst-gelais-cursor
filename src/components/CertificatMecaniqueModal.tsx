import { useState } from "react";
import { Upload, FileText, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { createCertificat } from "@/lib/certificats.functions";

const BUCKET = "certificat-verification-mecanique";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  uniteId: string;
};

export function CertificatMecaniqueModal({ open, onClose, onCreated, uniteId }: Props) {
  const [dateCertificat, setDateCertificat] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [effectueePar, setEffectueePar] = useState("");
  const [notes, setNotes] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!dateCertificat) {
      setError("La date du certificat est requise.");
      return;
    }
    setError(null);
    setSaving(true);

    let documentUrl: string | null = null;
    let nomFichier: string | null = null;

    if (pdfFile) {
      setUploading(true);
      const ext = pdfFile.name.split(".").pop() ?? "pdf";
      const path = `${uniteId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, pdfFile, { contentType: pdfFile.type || "application/pdf" });
      setUploading(false);

      if (upErr) {
        setError("Erreur lors du téléversement : " + upErr.message);
        setSaving(false);
        return;
      }

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      documentUrl = pub.publicUrl;
      nomFichier = pdfFile.name;
    }

    await createCertificat({
      data: {
        unite_id: uniteId,
        date_certificat: dateCertificat,
        effectuee_par: effectueePar || null,
        notes: notes || null,
        document_url: documentUrl,
        nom_fichier: nomFichier,
      },
    });

    setSaving(false);
    setDateCertificat(new Date().toISOString().slice(0, 10));
    setEffectueePar("");
    setNotes("");
    setPdfFile(null);
    onCreated();
    onClose();
  };

  const inputCls =
    "mt-1 block w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
        <h3 className="text-lg font-semibold mb-4">Ajouter un certificat de vérification mécanique</h3>

        {error && (
          <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Date du certificat</label>
            <input
              type="date"
              value={dateCertificat}
              onChange={(e) => setDateCertificat(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Effectuée par (optionnel)</label>
            <input
              type="text"
              value={effectueePar}
              onChange={(e) => setEffectueePar(e.target.value)}
              placeholder="Nom du technicien / garage"
              className={inputCls}
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Notes (optionnel)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observations, travaux effectués..."
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Certificat PDF (optionnel)</label>
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
            disabled={!dateCertificat || saving}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {uploading ? "Téléversement..." : saving ? "Enregistrement..." : "Ajouter"}
          </button>
        </div>
      </div>
    </div>
  );
}
