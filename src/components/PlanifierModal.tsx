import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { planifierInspection, terminerInspection } from "@/lib/inspections.functions";

type Props = {
  open: boolean;
  onClose: () => void;
  inspectionId: string;
  uniteLabel: string;
  defaultDate?: string | null;
};

export function PlanifierModal({ open, onClose, inspectionId, uniteLabel, defaultDate }: Props) {
  const router = useRouter();
  const [date, setDate] = useState(defaultDate ?? "");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!date) return;
    setSaving(true);
    await planifierInspection({ data: { id: inspectionId, date_inspection: date } });
    setSaving(false);
    router.invalidate();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
        <h3 className="text-lg font-semibold">Planifier l'inspection</h3>
        <p className="mt-1 text-xs text-muted-foreground">{uniteLabel}</p>
        <div className="mt-4">
          <label className="text-sm text-muted-foreground">Date de l'inspection</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
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
            disabled={!date || saving}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : "Planifier"}
          </button>
        </div>
      </div>
    </div>
  );
}

type TerminerProps = {
  open: boolean;
  onClose: () => void;
  inspectionId: string;
  uniteLabel: string;
};

export function TerminerModal({ open, onClose, inspectionId, uniteLabel }: TerminerProps) {
  const router = useRouter();
  const [resultat, setResultat] = useState("Passé");
  const [effectueePar, setEffectueePar] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    setSaving(true);
    await terminerInspection({
      data: { id: inspectionId, resultat, effectuee_par: effectueePar || null },
    });
    setSaving(false);
    router.invalidate();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
        <h3 className="text-lg font-semibold">Inspection terminée</h3>
        <p className="mt-1 text-xs text-muted-foreground">{uniteLabel}</p>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm text-muted-foreground">Résultat</label>
            <select
              value={resultat}
              onChange={(e) => setResultat(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="Passé">Passé</option>
              <option value="Échoué">Échoué</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Effectuée par (optionnel)</label>
            <input
              type="text"
              value={effectueePar}
              onChange={(e) => setEffectueePar(e.target.value)}
              placeholder="Nom du technicien"
              className="mt-1 block w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
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
            disabled={saving}
            className="rounded-lg bg-success px-3 py-1.5 text-sm font-medium text-success-foreground hover:bg-success/90 transition-colors disabled:opacity-50"
          >
            {saving ? "..." : "Marquer terminée"}
          </button>
        </div>
      </div>
    </div>
  );
}
