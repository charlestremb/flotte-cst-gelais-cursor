import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Truck,
  ParkingSquare,
  ClipboardCheck,
  Archive,
  ChevronLeft,
  ChevronRight,
  Users,
  LogOut,
  Shield,
  User as UserIcon,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import logoStGelais from "@/assets/logo-st-gelais.jpg";

const baseNavItems = [
  { to: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/equipements", label: "Équipements", icon: Truck },
  { to: "/remisage", label: "Remisage", icon: ParkingSquare },
  { to: "/inspections", label: "Inspections", icon: ClipboardCheck },
  { to: "/archives", label: "Archives", icon: Archive },
] as const;

export function AppSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { user, isAdmin, signOut } = useAuth();

  const navItems = isAdmin
    ? [...baseNavItems, { to: "/admin/utilisateurs", label: "Utilisateurs", icon: Users } as const]
    : baseNavItems;

  return (
    <aside
      className={`no-print fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-sidebar transition-all duration-300 ${collapsed ? "w-16" : "w-60"}`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <img
          src={logoStGelais}
          alt="Les Constructions St-Gelais"
          className="h-10 w-10 shrink-0 rounded-lg bg-white object-contain p-0.5"
        />
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-foreground truncate">
              Les Constructions St-Gelais
            </p>
            <p className="text-xs text-muted-foreground">Gestion de flotte</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive =
            item.to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      {user && !collapsed && (
        <div className="border-t border-border p-3">
          <div className="mb-2 flex items-center gap-2 rounded-lg px-2 py-1.5">
            {isAdmin ? (
              <Shield className="h-4 w-4 shrink-0 text-primary" />
            ) : (
              <UserIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-foreground">
                {user.email}
              </p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {isAdmin ? "Administrateur" : "Utilisateur"}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </div>
      )}
      {user && collapsed && (
        <button
          onClick={() => signOut()}
          className="flex h-12 items-center justify-center border-t border-border text-muted-foreground hover:text-foreground transition-colors"
          title="Déconnexion"
        >
          <LogOut className="h-4 w-4" />
        </button>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex h-12 items-center justify-center border-t border-border text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>
    </aside>
  );
}
