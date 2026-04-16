import { createServerFn } from "@tanstack/react-start";

const DESTINATAIRES = ["garage@cstgelais.com", "f.stgelais@cstgelais.com"];

type InspectionPayload = {
  id: string;
  type_inspection: string;
  prochaine_inspection: string | null;
  date_inspection: string | null;
  effectuee_par: string | null;
  document_url: string | null;
  unite: {
    numero_unite: string;
    marque: string | null;
    modele: string | null;
    entite: string;
  } | null;
};

export const sendInspectionNotification = createServerFn({ method: "POST" })
  .inputValidator((data: { inspection: InspectionPayload }) => data)
  .handler(async ({ data }) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY non configuré — courriel non envoyé.");
      return { sent: false, reason: "missing_api_key" };
    }

    const { inspection } = data;
    const u = inspection.unite;
    const uniteLabel = u ? `${u.numero_unite} — ${u.marque ?? ""} ${u.modele ?? ""}`.trim() : "—";
    const subject = `Nouvelle inspection planifiée — Unité ${u?.numero_unite ?? ""} (${inspection.type_inspection})`;

    const html = `
      <div style="font-family: Arial, sans-serif; color: #1f2937; max-width: 600px;">
        <h2 style="color: #f97316; margin-bottom: 16px;">Nouvelle inspection planifiée</h2>
        <p>Une nouvelle inspection vient d'être planifiée par l'administration.</p>
        <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
          <tr><td style="padding: 6px 0; color: #6b7280;">Unité</td><td style="padding: 6px 0; font-weight: 600;">${uniteLabel}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280;">Entité</td><td style="padding: 6px 0;">${u?.entite ?? "—"}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280;">Type</td><td style="padding: 6px 0;">${inspection.type_inspection}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280;">Date prévue</td><td style="padding: 6px 0;">${inspection.prochaine_inspection ?? "—"}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280;">Effectuée par</td><td style="padding: 6px 0;">${inspection.effectuee_par ?? "—"}</td></tr>
        </table>
        ${inspection.document_url ? `<p><a href="${inspection.document_url}" style="background:#f97316;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;display:inline-block;">📄 Voir le document PDF</a></p>` : ""}
        <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">Gestion de flotte — Les Constructions St-Gelais</p>
      </div>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Flotte Les Constructions St-Gelais <onboarding@resend.dev>",
        to: DESTINATAIRES,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("Resend error:", response.status, body);
      return { sent: false, reason: `http_${response.status}` };
    }

    return { sent: true };
  });
