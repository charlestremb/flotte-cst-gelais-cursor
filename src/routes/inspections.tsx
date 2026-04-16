import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/inspections")({
  component: InspectionsPage,
});

function InspectionsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Inspections</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Module d'inspections — à venir dans la prochaine version.
      </p>
      <div className="mt-6 rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          Cette section sera disponible prochainement.
        </p>
      </div>
    </div>
  );
}
