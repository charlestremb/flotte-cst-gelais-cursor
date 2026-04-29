# CLAUDE.md — Gestion de flotte · Les Constructions St-Gelais

Document de référence pour tout assistant IA (Claude, Lovable, etc.) qui intervient sur ce projet. À lire **avant** de modifier le code.

---

## 1. Vue d'ensemble

Application interne de **gestion de flotte d'équipements de construction** pour **Les Constructions St-Gelais** (entreprise québécoise basée au Québec).

L'application sert à :
- Suivre l'inventaire des unités (camions, équipements, machinerie)
- Gérer le **remisage saisonnier** (mise hivernale / déremisage)
- Planifier et suivre les **inspections** (SAAQ annuelle, pré-saison, mécanique, etc.)
- Suivre les **calibrations laser**
- Archiver les unités vendues/disposées
- Gérer les utilisateurs avec deux niveaux d'accès (admin / utilisateur)

L'interface est **100 % en français**. Tous les textes visibles, libellés, messages d'erreur et notifications doivent être en français québécois standard.

---

## 2. Stack technique

| Couche | Techno |
|---|---|
| Framework | **TanStack Start v1** (React 19, SSR, server functions) |
| Build | Vite 7 |
| Runtime serveur | Cloudflare Workers (compatibilité Node) |
| Styling | **Tailwind CSS v4** (config dans `src/styles.css`) |
| UI | shadcn/ui (Radix primitives) + lucide-react |
| Backend | **Lovable Cloud** (Supabase managé) |
| Base de données | PostgreSQL (Supabase) |
| Auth | Supabase Auth (email + mot de passe) |
| Storage | Bucket `inspection-documents` |
| Email | Resend (via `RESEND_API_KEY`) pour notifications garage |
| Polices | DM Sans (400/500/600/700) |

Routing : **file-based** dans `src/routes/` (ne **jamais** éditer `src/routeTree.gen.ts`, auto-généré).

---

## 3. Design system

Définir **toutes** les couleurs comme tokens sémantiques dans `src/styles.css` (format `oklch`). **Ne jamais** utiliser de classes Tailwind couleur en dur (`text-white`, `bg-yellow-500`, etc.) dans les composants.

### Palette
- **Couleur principale** : jaune St-Gelais `#fcb40a` → `oklch(0.78 0.17 80)` (token `--primary`)
- **Foreground sur primary** : noir/foncé pour contraste sur jaune
- **Mode** : interface en mode **dark** (classe `dark` sur `<html>` dans `__root.tsx`)
- **Police** : DM Sans (`--font-sans`)

### Logo
- Fichier : `src/assets/logo-st-gelais.jpg`
- Affiché dans la sidebar (haut-gauche) et la page de connexion
- Toujours sur fond blanc (`bg-white`) car le logo a un fond transparent/blanc d'origine

### Entités
3 entités existent dans la table `unites` (champ `entite`) :
- `CSTG` — Les Constructions St-Gelais
- `T1C`
- `9487-6216` (numéro d'entreprise)

---

## 4. Authentification & rôles

### Modèle
- **Email + mot de passe uniquement** (pas de Google, pas de magic link)
- **Pas d'inscription publique** : seul un admin peut créer des comptes via l'interface (`/admin/utilisateurs`)
- **Confirmation email automatique** (`auto_confirm_email: true`) — accès immédiat
- **Premier utilisateur créé = admin** (logique dans le trigger `handle_new_user`)

### Rôles (`app_role` enum)
| Rôle | Permissions |
|---|---|
| `admin` | Tout : créer, lire, modifier, **supprimer** unités/inspections, gérer les utilisateurs |
| `user` | Créer, lire, modifier unités/inspections — **pas de suppression** |

La sécurité est appliquée à **deux niveaux** :
1. **UI** : les boutons « Supprimer » sont masqués via `{isAdmin && ...}` (hook `useAuth`)
2. **RLS** (sécurité réelle) : policies PostgreSQL bloquent les DELETE pour les non-admins

### Tables auth-related
- `profiles` — info supplémentaire (email, full_name) liée à `auth.users` via `user_id`
- `user_roles` — table séparée (jamais stocker le rôle dans `profiles`, sinon faille d'élévation de privilèges)
- Fonction `has_role(_user_id, _role)` en `SECURITY DEFINER` pour éviter la récursion RLS

### Hook client
```ts
import { useAuth } from "@/hooks/use-auth";
const { user, session, role, isAdmin, signIn, signOut, loading } = useAuth();
```

Le `AuthProvider` est monté dans `AppLayout`. La redirection vers `/auth` se fait dans `LayoutInner` si non connecté.

---

## 5. Schéma de base de données

### `unites`
Inventaire des équipements. Champs principaux :
- Identifiants : `numero_unite`, `entite`, `categorie`, `marque`, `modele`, `annee`, `numero_serie`, `plaque`, `couleur`
- Caractéristiques : `poids`, `pnvb`, `nb_essieux`, `reservoir`
- Statut : `statut` (`actif`, `brise`, `hors_usage`, `remise`, `a_remiser`, `a_deremiser`, `vendu`)
- Remisage : `date_remisage`, `date_deremisage`, `demande_par`
- Légal : `assurance_expiration`, `immatriculation_expiration`
- Historique : `date_acquisition`, `date_disposition`, `prix_achat`, `km_achat`, `km_actuel`, `date_maj_km`
- `notes`, `utilisateur`

### `inspections`
- `unite_id` (FK logique vers `unites.id`, **pas** de FK SQL — gérée en code via `deleteUnite`)
- `type_inspection` (cf. `TYPES_INSPECTION` : "Annuelle SAAQ", "Pré-saison", "Maintenance préventive", "Mécanique", "Autre")
- Workflow : `statut_workflow` (`a_planifier` → `planifiee` → `terminee`)
- Dates : `date_reception_lettre`, `date_limite`, `date_inspection`, `prochaine_inspection`
- Résultat : `resultat` (`Passé`, `Échoué`, `En attente`)
- `effectuee_par`, `notes_inspection`, `document_url`

### `profiles` & `user_roles`
Voir section auth ci-dessus.

### Politiques RLS (résumé)
- **`unites` et `inspections`** : `authenticated` peut SELECT/INSERT/UPDATE ; seuls les admins peuvent DELETE (`has_role(auth.uid(), 'admin')`)
- **`profiles`** : tout authentifié peut lire ; chacun modifie le sien, admin modifie tous
- **`user_roles`** : tout authentifié peut lire ; seuls admins INSERT/UPDATE/DELETE

---

## 6. Architecture du code

### Server functions (TanStack Start)
**Toujours** utiliser `createServerFn` pour les opérations DB, pas de `supabase.from(...)` direct depuis les composants pour les opérations principales.

Localisation : `src/lib/*.functions.ts`
- `unites.functions.ts` — CRUD unités
- `inspections.functions.ts` — CRUD inspections + workflow (planifier, terminer)
- `users.functions.ts` — Gestion utilisateurs (admin uniquement, utilise `supabaseAdmin`)
- `notifications.functions.ts` — Envoi de courriels au garage via Resend

Pattern :
```ts
export const maFonction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth]) // si besoin auth
  .inputValidator((data: { ... }) => data)
  .handler(async ({ data, context }) => { ... });
```

### Clients Supabase
| Client | Import | Usage |
|---|---|---|
| Browser | `@/integrations/supabase/client` | Composants, auth, listeners |
| Auth middleware | `@/integrations/supabase/auth-middleware` | Server fn agissant comme l'utilisateur |
| Admin (service role) | `@/integrations/supabase/client.server` | Opérations admin (ex : créer un user) — **JAMAIS** côté client |

### Routes (file-based)
| Fichier | URL | Accès |
|---|---|---|
| `index.tsx` | `/` | Tableau de bord |
| `equipements.tsx` + `equipements.index.tsx` | `/equipements` | Liste des unités |
| `equipements.$uniteId.tsx` | `/equipements/:id` | Détail d'une unité + inspections |
| `remisage.tsx` | `/remisage` | Gestion remisage saisonnier |
| `inspections.tsx` | `/inspections` | Toutes les inspections + onglet Calibrations |
| `archives.tsx` | `/archives` | Unités vendues/disposées (avec désarchivage) |
| `admin.utilisateurs.tsx` | `/admin/utilisateurs` | Gestion utilisateurs (admin uniquement) |
| `auth.tsx` | `/auth` | Connexion |

### Composants clés
- `AppLayout` — wrap avec `AuthProvider`, redirection auth, sidebar
- `AppSidebar` — navigation (item « Utilisateurs » conditionnel à `isAdmin`), logo, infos user, déconnexion
- `UniteFormModal` — formulaire création/édition unité
- `InspectionModal` — création d'inspection (à planifier)
- `PlanifierModal` / `TerminerModal` — workflow inspection
- `StatutBadge` — badge coloré par statut
- `InspectionAlerts` — composants d'alerte (`AlertDot`, `WorkflowBadge`, `ResultatBadge`) + helper `getInspectionAlertLevel`
- `CalibrationsTab` — onglet calibrations laser dans la page inspections

### Helpers
- `src/lib/laser-status.ts` — `getEffectiveStatut`, `getLastCalibration` pour le statut effectif des unités laser
- `src/lib/utils.ts` — `cn()` (clsx + tailwind-merge)

---

## 7. Secrets disponibles

Configurés dans Lovable Cloud (ne **jamais** demander à l'utilisateur) :
- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`
- `LOVABLE_API_KEY` (pour appels IA via Lovable AI Gateway)
- `RESEND_API_KEY` (envoi courriels notifications)

Côté client : utiliser `import.meta.env.VITE_*`. Côté serveur : `process.env.*` à l'intérieur d'un `.handler()`.

---

## 8. Conventions à respecter

### Toujours
- **Français** pour tout texte UI, message, libellé, alerte
- **Tokens sémantiques** (`bg-primary`, `text-foreground`) — pas de couleurs en dur
- **Server functions** pour les opérations DB (pas de logique métier dans les composants)
- **Vérifier `isAdmin`** avant de montrer des actions de suppression (en plus du RLS qui protège déjà côté DB)
- **Migrations** via l'outil dédié pour tout changement de schéma — jamais en édition manuelle de `types.ts`
- **Date format** : `toLocaleDateString("fr-CA")` ou `Intl.DateTimeFormat("fr-CA")`
- **Format monétaire** : `Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" })`

### Jamais
- Modifier `src/integrations/supabase/client.ts` ou `types.ts` (auto-générés)
- Modifier `src/routeTree.gen.ts` (auto-généré)
- Stocker le rôle utilisateur dans `profiles` (faille de sécurité)
- Importer `@/integrations/supabase/client.server` côté client
- Utiliser `child_process`, `sharp`, `puppeteer` ou autres deps Node-only (Cloudflare Workers)
- Créer des routes via React Router DOM ou un autre router
- Mettre en place une `.env` manuellement (géré par Lovable Cloud)
- Désactiver la confirmation email sans demande explicite (déjà désactivée pour ce projet — conservé tel quel)
- Ajouter une page « Inscription » publique (les comptes sont créés par l'admin)

---

## 9. Workflow d'inspection

```
[a_planifier]
   ↓ planifierInspection (date_inspection)
[planifiee]
   ↓ terminerInspection (resultat)
[terminee]
```

À la création (`createInspection`) :
1. Statut initial = `a_planifier`, `resultat` = `En attente`
2. Si `RESEND_API_KEY` configurée, courriel automatique au garage (`sendInspectionNotification`, best-effort)

Suppression d'une unité = suppression en cascade des inspections liées (géré dans `deleteUnite`, pas via FK SQL).

---

## 10. Notes opérationnelles

- **Préfixe routes** : pas de slash final (`/equipements`, pas `/equipements/`)
- **Imports** : `@tanstack/react-router` (pas `react-router-dom`)
- **404 / erreurs** : toujours fournir `notFoundComponent` et `errorComponent` sur les routes avec loader
- **Réinitialisation de mot de passe** : pas implémentée (à ajouter au besoin avec page `/reset-password` dédiée)
- **Print** : styles `@media print` configurés dans `styles.css` (cache la sidebar, fond blanc)

---

## 11. Avant de livrer une modification

1. ✅ Texte UI en français
2. ✅ Couleurs via tokens sémantiques
3. ✅ Permissions vérifiées (UI + RLS si nouvelle table/opération)
4. ✅ Server function utilisée pour la DB (pas de Supabase direct dans le composant si possible)
5. ✅ Pas de modification des fichiers auto-générés
6. ✅ Build passe sans erreur TypeScript
