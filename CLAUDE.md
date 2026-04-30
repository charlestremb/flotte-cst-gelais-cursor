# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Commandes de développement

```bash
npm run dev        # serveur de développement (Vite + Cloudflare Workers)
npm run build      # build de production
npm run build:dev  # build en mode développement
npm run preview    # prévisualisation du build
npm run lint       # ESLint
npm run format     # Prettier (formatage automatique)
```

TypeScript est vérifié par Vite à la compilation — il n'y a pas de commande `tsc` séparée. Il n'y a pas de suite de tests.

---

## Vue d'ensemble

Application interne de **gestion de flotte d'équipements de construction** pour **Les Constructions St-Gelais** (entreprise québécoise).

L'application sert à :
- Suivre l'inventaire des unités (camions, équipements, machinerie)
- Gérer le **remisage saisonnier** (mise hivernale / déremisage)
- Planifier et suivre les **inspections** (SAAQ annuelle, pré-saison, mécanique, etc.)
- Suivre les **calibrations laser**
- Archiver les unités vendues/disposées
- Gérer les utilisateurs avec deux niveaux d'accès (admin / utilisateur)

L'interface est **100 % en français**. Tous les textes visibles, libellés, messages d'erreur et notifications doivent être en français québécois standard.

---

## Stack technique

| Couche | Techno |
|---|---|
| Framework | **TanStack Start v1** (React 19, SSR, server functions) |
| Build | Vite 7 |
| Runtime serveur | Cloudflare Workers (compatibilité Node) |
| Styling | **Tailwind CSS v4** (config dans `src/styles.css`) |
| UI | shadcn/ui (Radix primitives) + lucide-react |
| Backend | **Supabase** (PostgreSQL managé) |
| Auth | Supabase Auth (email + mot de passe) |
| Storage | Bucket `inspection-documents` |
| Email | Resend (via `RESEND_API_KEY`) pour notifications garage |
| Polices | DM Sans (400/500/600/700) |

Routing : **file-based** dans `src/routes/` (ne **jamais** éditer `src/routeTree.gen.ts`, auto-généré).

---

## Design system

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

## Authentification & rôles

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

## Schéma de base de données

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

## Architecture du code

### Pattern de chargement des données

Les données sont chargées dans la fonction `loader` de chaque route (SSR via TanStack Start), **pas** dans des hooks `useEffect` ou `useQuery` côté composant. Les composants reçoivent les données via `Route.useLoaderData()`.

```ts
export const Route = createFileRoute("/ma-route")({
  loader: async () => {
    const [unites, inspections] = await Promise.all([getUnites(), getInspections()]);
    return { unites, inspections };
  },
  component: MaPage,
  notFoundComponent: () => <div>...</div>,  // toujours fournir
  errorComponent: ({ error }) => <div>{error.message}</div>,  // toujours fournir
});

function MaPage() {
  const { unites } = Route.useLoaderData();
  // ...
}
```

### Server functions (TanStack Start)
**Toujours** utiliser `createServerFn` pour les opérations DB, pas de `supabase.from(...)` direct depuis les composants.

Localisation : `src/lib/*.functions.ts`
- `unites.functions.ts` — CRUD unités
- `inspections.functions.ts` — CRUD inspections + workflow (planifier, terminer)
- `users.functions.ts` — Gestion utilisateurs (admin uniquement, utilise `supabaseAdmin`)
- `notifications.functions.ts` — Envoi de courriels au garage via Resend

Pattern :
```ts
export const maFonction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth]) // uniquement si on a besoin du contexte user côté serveur
  .inputValidator((data: { ... }) => data)
  .handler(async ({ data, context }) => { ... });
```

Note : la plupart des server functions utilisent `supabaseAdmin` (service role) directement plutôt que `requireSupabaseAuth`, car la protection est déjà assurée par le RLS et l'auth côté client.

### Clients Supabase
| Client | Import | Usage |
|---|---|---|
| Browser | `@/integrations/supabase/client` | Composants, auth, listeners |
| Auth middleware | `@/integrations/supabase/auth-middleware` | Server fn agissant comme l'utilisateur (expose `requireSupabaseAuth`) |
| Admin (service role) | `@/integrations/supabase/client.server` | Opérations admin (ex : créer un user) — **JAMAIS** côté client |

### Routes (file-based)
| Fichier | URL |
|---|---|
| `index.tsx` | `/` — Tableau de bord |
| `equipements.tsx` + `equipements.index.tsx` | `/equipements` — Liste des unités |
| `equipements.$uniteId.tsx` | `/equipements/:id` — Détail + inspections |
| `remisage.tsx` | `/remisage` — Gestion remisage saisonnier |
| `inspections.tsx` | `/inspections` — Toutes les inspections + onglet Calibrations |
| `archives.tsx` | `/archives` — Unités vendues/disposées |
| `admin.utilisateurs.tsx` | `/admin/utilisateurs` — Gestion utilisateurs (admin) |
| `auth.tsx` | `/auth` — Connexion |

### Composants clés
- `AppLayout` — wrap avec `AuthProvider`, redirection auth, sidebar
- `AppSidebar` — navigation (item « Utilisateurs » conditionnel à `isAdmin`), logo, infos user, déconnexion
- `UniteFormModal` — formulaire création/édition unité
- `InspectionModal` — création d'inspection (statut initial `a_planifier`)
- `PlanifierModal` — passage au statut `planifiee` (date d'inspection)
- `StatutBadge` — badge coloré par statut
- `InspectionAlerts` — composants d'alerte (`AlertDot`, `WorkflowBadge`, `ResultatBadge`) + helper `getInspectionAlertLevel`
- `CalibrationsTab` — onglet calibrations laser dans la page inspections

### Helpers
- `src/lib/laser-status.ts` — `getEffectiveStatut`, `getLastCalibration` : un laser sans calibration depuis plus d'un an passe automatiquement à `hors_usage`
- `src/lib/utils.ts` — `cn()` (clsx + tailwind-merge)

---

## Variables d'environnement

Fichier **`.env.local`** à la racine (jamais versionné dans Git) :

| Variable | Côté | Usage |
|---|---|---|
| `VITE_SUPABASE_URL` | Client | URL du projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | Client | Clé anon publique |
| `SUPABASE_URL` | Serveur | Même URL, pour le SSR / server functions |
| `SUPABASE_ANON_KEY` | Serveur | Clé anon, utilisée par `requireSupabaseAuth` middleware |
| `SUPABASE_SERVICE_ROLE_KEY` | Serveur | Clé service role — **jamais** côté client |
| `RESEND_API_KEY` | Serveur | Envoi courriels notifications garage |

Côté client : `import.meta.env.VITE_*`. Côté serveur : `process.env.*` dans `.handler()`.

---

## Conventions à respecter

### Toujours
- **Français** pour tout texte UI, message, libellé, alerte
- **Tokens sémantiques** (`bg-primary`, `text-foreground`) — pas de couleurs en dur
- **Server functions** pour les opérations DB (pas de logique métier dans les composants)
- **Vérifier `isAdmin`** avant de montrer des actions de suppression (en plus du RLS)
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
- Versionner `.env.local` ou tout fichier contenant des secrets dans Git
- Ajouter une page « Inscription » publique (les comptes sont créés par l'admin)

---

## Workflow d'inspection

```
[a_planifier]
   ↓ planifierInspection (date_inspection) — via PlanifierModal
[planifiee]
   ↓ terminerInspection (resultat) — inline dans equipements.$uniteId.tsx
[terminee]
```

À la création (`createInspection`) :
1. Statut initial = `a_planifier`, `resultat` = `En attente`
2. Si `RESEND_API_KEY` configurée, courriel automatique au garage (`sendInspectionNotification`, best-effort)

Suppression d'une unité = suppression en cascade des inspections liées (géré dans `deleteUnite`, pas via FK SQL).

---

## Notes opérationnelles

- **Préfixe routes** : pas de slash final (`/equipements`, pas `/equipements/`)
- **Imports router** : `@tanstack/react-router` (pas `react-router-dom`)
- **404 / erreurs** : toujours fournir `notFoundComponent` et `errorComponent` sur les routes avec loader
- **Réinitialisation de mot de passe** : pas implémentée (à ajouter avec page `/reset-password` dédiée)
- **Print** : styles `@media print` configurés dans `styles.css` (cache la sidebar, fond blanc)

---

## Avant de livrer une modification

1. ✅ Texte UI en français
2. ✅ Couleurs via tokens sémantiques
3. ✅ Permissions vérifiées (UI + RLS si nouvelle table/opération)
4. ✅ Server function utilisée pour la DB (pas de Supabase direct dans le composant)
5. ✅ Pas de modification des fichiers auto-générés
6. ✅ Build passe sans erreur TypeScript (`npm run build`)
