import { type ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <AppSidebar />
      <main className="ml-60 min-h-screen p-6">{children}</main>
    </div>
  );
}
