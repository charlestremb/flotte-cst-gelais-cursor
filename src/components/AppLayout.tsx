import { type ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { AppSidebar } from "./AppSidebar";
import { AuthProvider, useAuth } from "@/hooks/use-auth";

function LayoutInner({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthRoute = location.pathname === "/auth";

  useEffect(() => {
    if (!loading && !session && !isAuthRoute) {
      navigate({ to: "/auth" });
    }
  }, [loading, session, isAuthRoute, navigate]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (isAuthRoute || !session) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen">
      <AppSidebar />
      <main className="ml-60 min-h-screen p-6">{children}</main>
    </div>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <LayoutInner>{children}</LayoutInner>
    </AuthProvider>
  );
}
