import { useState } from "react";
import { createUnite } from "@/lib/unites.functions";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

const CATEGORIES = [
  "Pelle", "Camion", "Pick-up", "Remorque", "Loader", "Bouteur",
  "Concasseur", "Petit outil", "Véhicule", "Plate-forme élévatrice",
];

export function UniteFormModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    numero_unite: "",
    entite: "CSTG",
    categorie: "",
    marque: "",
    modele: "",
    annee: "",
    numero_serie: "",
    plaque: "",
    couleur: "",
    poids: "",
    pnvb: "",
    nb_essieux: "",
    date_acquisition: "",
    date_disposition: "",
    prix_achat: "",
    km_achat: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.numero_unite || !form.entite) {
      setError("Numéro d'unité et entité sont requis");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createUnite({
        data: {
          numero_unite: form.numero_unite,
          entite: form.entite,
          categorie: form.categorie || null,
          marque: form.marque || null,
          modele: form.modele || null,
          annee: form.annee ? parseInt(form.annee, 10) : null,
          numero_serie: form.numero_serie || null,
          plaque: form.plaque || null,
          couleur: form.couleur || null,
          poids: form.poids || null,
          pnvb: form.pnvb || null,
          nb_essieux: form.nb_essieux || null,
          date_acquisition: form.date_acquisition || null,
          date_disposition: form.date_disposition || null,
          prix_achat: form.prix_achat ? parseFloat(form.prix_achat) : null,
          km_achat: form.km_achat ? parseInt(form.km_achat, 10) : null,
          notes: form.notes || null,
          statut: "actif",
        },
      });
      setSaving(false);
      onCreated();
    } catch (e) {
      setSaving(false);
      setError((e as Error).message);
    }
  };

  const inputCls =
    "mt-1 block w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
        <h3 className="text-lg font-semibold mb-4">Ajouter une unité</h3>

        {error && (
          <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Numéro d'unité *</label>
            <input value={form.numero_unite} onChange={(e) => update("numero_unite", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Entité *</label>
            <select value={form.entite} onChange={(e) => update("entite", e.target.value)} className={inputCls}>
              <option value="CSTG">CSTG</option>
              <option value="9487-6216">9487-6216</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Catégorie</label>
            <select value={form.categorie} onChange={(e) => update("categorie", e.target.value)} className={inputCls}>
              <option value="">—</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Année</label>
            <input type="number" value={form.annee} onChange={(e) => update("annee", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Marque</label>
            <input value={form.marque} onChange={(e) => update("marque", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Modèle</label>
            <input value={form.modele} onChange={(e) => update("modele", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Numéro de série</label>
            <input value={form.numero_serie} onChange={(e) => update("numero_serie", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Plaque</label>
            <input value={form.plaque} onChange={(e) => update("plaque", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Couleur</label>
            <input value={form.couleur} onChange={(e) => update("couleur", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Nb essieux</label>
            <input value={form.nb_essieux} onChange={(e) => update("nb_essieux", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Poids</label>
            <input value={form.poids} onChange={(e) => update("poids", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">PNVB</label>
            <input value={form.pnvb} onChange={(e) => update("pnvb", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Date d'acquisition</label>
            <input type="date" value={form.date_acquisition} onChange={(e) => update("date_acquisition", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Date de disposition</label>
            <input type="date" value={form.date_disposition} onChange={(e) => update("date_disposition", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Prix d'achat ($)</label>
            <input type="number" step="0.01" value={form.prix_achat} onChange={(e) => update("prix_achat", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Km/h à l'achat</label>
            <input type="number" value={form.km_achat} onChange={(e) => update("km_achat", e.target.value)} className={inputCls} />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground">Notes</label>
            <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={2} className={inputCls} />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={saving} className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
            {saving ? "Création..." : "Créer l'unité"}
          </button>
        </div>
      </div>
    </div>
  );
}
