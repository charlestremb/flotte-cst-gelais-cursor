import { Outlet, Link, createRootRoute, HeadContent, Scripts, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import appCss from "../styles.css?url";
import { AppLayout } from "../components/AppLayout";
import { getAccessTokenFromRequest, createSupabaseServerClient } from "../integrations/supabase/server-client";

const checkAuth = createServerFn({ method: "GET" }).handler(async () => {
  const token = getAccessTokenFromRequest();
  if (!token) return { authenticated: false };

  const supabase = createSupabaseServerClient(token);
  const { data, error } = await supabase.auth.getClaims(token);
  return { authenticated: !error && !!data?.claims?.sub };
});

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page non trouvée</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          La page que vous cherchez n'existe pas.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    if (location.pathname === "/auth") return;
    const { authenticated } = await checkAuth();
    if (!authenticated) throw redirect({ to: "/auth" });
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Les Constructions St-Gelais — Gestion de flotte" },
      { name: "description", content: "Application de gestion de flotte d'équipements de construction — Les Constructions St-Gelais" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
