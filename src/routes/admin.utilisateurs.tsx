import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { createUser, deleteUser, updateUserRole } from "@/lib/users.functions";
import { Trash2, UserPlus, Shield, User as UserIcon } from "lucide-react";

export const Route = createFileRoute("/admin/utilisateurs")({
  component: UsersPage,
});

type UserRow = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: "admin" | "user";
  created_at: string;
};

function UsersPage() {
  const { isAdmin, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "user" as "admin" | "user",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, email, full_name, created_at")
      .order("created_at", { ascending: false });
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role");

    const rolesMap = new Map<string, "admin" | "user">();
    (roles ?? []).forEach((r: any) => {
      const existing = rolesMap.get(r.user_id);
      if (r.role === "admin" || !existing) rolesMap.set(r.user_id, r.role);
    });

    const merged: UserRow[] = (profiles ?? []).map((p: any) => ({
      user_id: p.user_id,
      email: p.email,
      full_name: p.full_name,
      role: rolesMap.get(p.user_id) ?? "user",
      created_at: p.created_at,
    }));
    setUsers(merged);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  if (authLoading) return null;
  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Accès réservé aux administrateurs.</p>
      </div>
    );
  }

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createUser({ data: formData });
      setShowForm(false);
      setFormData({ email: "", password: "", full_name: "", role: "user" });
      await load();
    } catch (err: any) {
      setError(err.message ?? "Erreur lors de la création");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (u: UserRow) => {
    if (u.user_id === user?.id) {
      alert("Vous ne pouvez pas supprimer votre propre compte.");
      return;
    }
    if (!confirm(`Supprimer définitivement ${u.email} ?`)) return;
    try {
      await deleteUser({ data: { userId: u.user_id } });
      await load();
    } catch (err: any) {
      alert(err.message ?? "Erreur");
    }
  };

  const handleToggleRole = async (u: UserRow) => {
    if (u.user_id === user?.id) {
      alert("Vous ne pouvez pas modifier votre propre rôle.");
      return;
    }
    const newRole = u.role === "admin" ? "user" : "admin";
    if (!confirm(`Changer le rôle de ${u.email} en ${newRole === "admin" ? "Administrateur" : "Utilisateur"} ?`)) return;
    try {
      await updateUserRole({ data: { userId: u.user_id, role: newRole } });
      await load();
    } catch (err: any) {
      alert(err.message ?? "Erreur");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Utilisateurs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {users.length} utilisateur{users.length > 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <UserPlus className="h-4 w-4" />
          Nouvel utilisateur
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mt-5 grid gap-4 rounded-xl border border-border bg-card p-5 md:grid-cols-2"
        >
          <div>
            <label className="block text-sm font-medium mb-1.5">Nom complet</label>
            <input
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Courriel</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Mot de passe</label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Rôle</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as "admin" | "user" })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="user">Utilisateur (sans suppression)</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
          {error && (
            <div className="md:col-span-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="md:col-span-2 flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Création..." : "Créer"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-secondary"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="mt-5 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50 text-left">
              <th className="px-4 py-3 font-medium text-muted-foreground">Nom</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Courriel</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Rôle</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Créé le</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Chargement...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Aucun utilisateur</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.user_id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{u.full_name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${
                        u.role === "admin"
                          ? "bg-primary/15 text-primary"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {u.role === "admin" ? <Shield className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                      {u.role === "admin" ? "Administrateur" : "Utilisateur"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString("fr-CA")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleToggleRole(u)}
                        disabled={u.user_id === user?.id}
                        className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-secondary disabled:opacity-40"
                        title="Changer le rôle"
                      >
                        {u.role === "admin" ? "→ Utilisateur" : "→ Admin"}
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        disabled={u.user_id === user?.id}
                        className="rounded-md border border-destructive/40 p-1.5 text-destructive hover:bg-destructive/10 disabled:opacity-40"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
