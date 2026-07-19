export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { note, feedback, reservationId } = req.body;
  const brevoKey = process.env.BREVO_API_KEY;
  const ownerEmail = process.env.OWNER_EMAIL || "cleannet06600@gmail.com";
  const senderEmail = process.env.SENDER_EMAIL || "cleannet06600@gmail.com";

  if (!brevoKey) return res.status(500).json({ error: "Brevo not configured" });

  const stars = "⭐".repeat(note) + "☆".repeat(5 - note);

  const html = `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:600px;margin:0 auto;background:#F7F8FC;padding:24px;">
      <div style="background:#DC2626;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
        <h1 style="margin:0;font-size:20px;">⚠️ Avis négatif reçu</h1>
        <p style="margin:6px 0 0;opacity:0.85;font-size:14px;">Un client a laissé un retour privé</p>
      </div>
      <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;">
        <div style="background:#FEF2F2;border:1.5px solid #FCA5A5;border-radius:10px;padding:14px 18px;margin-bottom:16px;">
          <div style="font-size:24px;margin-bottom:8px;">${stars}</div>
          <div style="font-size:13px;color:#6B7280;">Note : <strong>${note}/5</strong>${reservationId ? ` · Réservation #${reservationId}` : ""}</div>
        </div>
        <div style="background:#F7F8FC;border-radius:10px;padding:16px;font-size:15px;color:#1A1F36;line-height:1.7;font-style:italic;">
          "${feedback}"
        </div>
        <p style="font-size:13px;color:#6B7280;margin-top:16px;">
          💡 Contactez ce client rapidement pour résoudre le problème et transformer cette expérience négative en positive.
        </p>
        <p style="font-size:12px;color:#9CA3AF;text-align:center;margin-top:16px;">CleanNet Multi-Service 06 · Système d'avis</p>
      </div>
    </div>`;

  try {
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": brevoKey },
      body: JSON.stringify({
        sender: { name: "CleanNet Avis", email: senderEmail },
        to: [{ email: ownerEmail, name: "CleanNet" }],
        subject: `⚠️ Avis négatif ${stars} — Retour client privé`,
        htmlContent: html,
      }),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Feedback error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
