export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    prenom, nom, email, telephone, adresse,
    service, option, date, creneau,
    total, acompte, message, statut, smsOnly,
  } = req.body;

  const SENDER_EMAIL = process.env.SENDER_EMAIL || "cleannet06600@gmail.com";
  const SENDER_NAME = "CleanNet Multi-Service 06";
  const OWNER_EMAIL = process.env.OWNER_EMAIL || SENDER_EMAIL;
  const REPLY_TO = SENDER_EMAIL;
  // Use Brevo-friendly sender if Gmail detected
  const ACTUAL_SENDER = SENDER_EMAIL.includes("gmail.com")
    ? "no-reply@cleannetmultiservice06.com"
    : SENDER_EMAIL;
  const avecAcompte = acompte && acompte !== "0" && acompte !== "0,00 €";

  // ── Créer événement Google Calendar ───────────────────────────────────────
  if (process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_CLIENT_EMAIL && date) {
    try {
      await fetch(`${req.headers.origin || "https://cleannet-reservation-cleannet-reservation.vercel.app"}/api/google-calendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prenom, nom, service, option, date, creneau, adresse, telephone, email }),
      });
    } catch (e) {
      console.error("Google Calendar skip:", e.message);
    }
  }

  // ── Sauvegarder dans Supabase ─────────────────────────────────────────────
  const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/rest\/v1\/?$/, "");
  if (supabaseUrl && process.env.SUPABASE_ANON_KEY) {
    try {
      await fetch(`${supabaseUrl}/rest/v1/reservations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": process.env.SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({
          prenom, nom, email, telephone, adresse,
          service, option, date, creneau,
          total: (total || "0").replace(/[^\d.,]/g, "").replace(",", "."),
          acompte: (acompte || "0").replace(/[^\d.,]/g, "").replace(",", "."),
          statut: avecAcompte ? "confirme" : "attente",
          source: "site",
        }),
      });
    } catch (e) {
      console.error("Supabase save error:", e.message);
    }
  }

  // ── Email au propriétaire ──────────────────────────────────────────────────
  const ownerHtml = `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:600px;margin:0 auto;background:#F7F8FC;padding:24px;">
      <div style="background:${avecAcompte ? "#0057FF" : "#F59E0B"};color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
        <h1 style="margin:0;font-size:20px;">${avecAcompte ? "✦ Nouvelle réservation (acompte payé)" : "📋 Nouvelle demande (sans acompte)"}</h1>
        <p style="margin:6px 0 0;opacity:0.85;font-size:14px;">CleanNet Multi-Service 06</p>
      </div>
      <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;">
        ${!avecAcompte ? `<div style="background:#FFF7ED;border:1.5px solid #F59E0B;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:13px;color:#92400E;font-weight:600;">⚠️ Cette réservation est EN ATTENTE — le créneau n'est pas encore bloqué. Confirmez avec le client.</div>` : ""}
        <h2 style="font-size:15px;color:#1A1F36;margin:0 0 12px;">👤 Client</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
          <tr><td style="padding:7px 0;color:#6B7280;width:140px;">Nom</td><td style="font-weight:600;">${prenom} ${nom}</td></tr>
          <tr><td style="padding:7px 0;color:#6B7280;">Email</td><td style="font-weight:600;">${email}</td></tr>
          <tr><td style="padding:7px 0;color:#6B7280;">Téléphone</td><td style="font-weight:600;">${telephone}</td></tr>
          <tr><td style="padding:7px 0;color:#6B7280;">Adresse</td><td style="font-weight:600;">${adresse}</td></tr>
          ${message ? `<tr><td style="padding:7px 0;color:#6B7280;">Note</td><td>${message}</td></tr>` : ""}
        </table>
        <h2 style="font-size:15px;color:#1A1F36;margin:0 0 12px;">🧹 Prestation</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
          <tr><td style="padding:7px 0;color:#6B7280;width:140px;">Service</td><td style="font-weight:600;">${service}</td></tr>
          <tr><td style="padding:7px 0;color:#6B7280;">Formule</td><td style="font-weight:600;">${option}</td></tr>
          <tr><td style="padding:7px 0;color:#6B7280;">Date</td><td style="font-weight:600;">${date}</td></tr>
          <tr><td style="padding:7px 0;color:#6B7280;">Créneau</td><td style="font-weight:600;">${creneau}</td></tr>
          <tr><td style="padding:7px 0;color:#6B7280;">Total estimé</td><td style="font-weight:800;color:#0057FF;">${total}</td></tr>
          ${avecAcompte ? `<tr><td style="padding:7px 0;color:#6B7280;">Acompte reçu</td><td style="font-weight:800;color:#059669;">${acompte} ✓</td></tr>` : ""}
        </table>
      </div>
    </div>`;

  // ── Email au client ────────────────────────────────────────────────────────
  const clientHtml = `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:600px;margin:0 auto;background:#F7F8FC;padding:24px;">
      <div style="background:${avecAcompte ? "#0057FF" : "#059669"};color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
        <h1 style="margin:0;font-size:20px;">${avecAcompte ? "✅ Réservation confirmée !" : "📬 Demande de réservation reçue !"}</h1>
        <p style="margin:6px 0 0;opacity:0.85;font-size:14px;">CleanNet Multi-Service 06</p>
      </div>
      <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;">
        <p style="font-size:15px;color:#1A1F36;line-height:1.7;">
          Bonjour <strong>${prenom}</strong>,<br><br>
          ${avecAcompte
            ? `Votre réservation est <strong>confirmée</strong> et votre acompte de <strong style="color:#0057FF;">${acompte}</strong> a bien été encaissé.`
            : `Votre demande de réservation a bien été reçue. Nous vous contacterons <strong>sous 24h</strong> pour confirmer votre créneau.`
          }
        </p>
        ${!avecAcompte ? `<div style="background:#FFF7ED;border:1.5px solid #F59E0B;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:13px;color:#92400E;">⏳ <strong>En attente de confirmation</strong> — votre créneau n'est pas encore bloqué.</div>` : ""}
        <div style="background:#F7F8FC;border-radius:10px;padding:16px 20px;margin:16px 0;">
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:6px 0;color:#6B7280;width:120px;">Service</td><td style="font-weight:700;">${service} — ${option}</td></tr>
            <tr><td style="padding:6px 0;color:#6B7280;">Date</td><td style="font-weight:700;">${date}</td></tr>
            <tr><td style="padding:6px 0;color:#6B7280;">Créneau</td><td style="font-weight:700;">${creneau}</td></tr>
            <tr><td style="padding:6px 0;color:#6B7280;">Adresse</td><td style="font-weight:700;">${adresse}</td></tr>
            <tr><td style="padding:6px 0;color:#6B7280;">Total estimé</td><td style="font-weight:700;">${total}</td></tr>
            ${avecAcompte ? `<tr><td style="padding:6px 0;color:#6B7280;">Acompte réglé</td><td style="font-weight:700;color:#059669;">${acompte} ✓</td></tr>` : ""}
          </table>
        </div>
        <p style="font-size:14px;color:#6B7280;line-height:1.6;">
          Une question ? Contactez-nous :<br>
          📞 <strong>${process.env.COMPANY_PHONE || "06 00 00 00 00"}</strong><br>
          📧 <strong>${SENDER_EMAIL}</strong>
        </p>
        <p style="font-size:12px;color:#9CA3AF;text-align:center;margin-top:20px;">CleanNet Multi-Service 06 · Alpes-Maritimes</p>
      </div>
    </div>`;

  // ── Envoi Brevo ────────────────────────────────────────────────────────────
  if (!process.env.BREVO_API_KEY) {
    return res.status(200).json({ success: true, warning: "Brevo not configured, emails not sent" });
  }

  const sendEmail = async (to, toName, subject, html) => {
    const r = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": process.env.BREVO_API_KEY },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email: to, name: toName }],
        replyTo: { email: OWNER_EMAIL },
        subject,
        htmlContent: html
      }),
    });
    if (!r.ok) {
      const err = await r.text();
      throw new Error(`Brevo error: ${err}`);
    }
    return true;
  };

  try {
    // Envoyer emails seulement si pas en mode smsOnly
    if (!smsOnly) {
      await sendEmail(OWNER_EMAIL, SENDER_NAME, `${avecAcompte ? "🔔" : "📋"} ${avecAcompte ? "Nouvelle réservation" : "Nouvelle demande"} — ${prenom} ${nom} — ${date}`, ownerHtml);
      await sendEmail(email, `${prenom} ${nom}`, `${avecAcompte ? "✅ Réservation confirmée" : "📬 Demande reçue"} — CleanNet — ${date}`, clientHtml);
    }

    // ── SMS au client via Brevo ────────────────────────────────────────────────
    if (telephone) {
      // Formater le numéro en international
      let tel = telephone.replace(/\s/g, "").replace(/\./g, "");
      if (tel.startsWith("0")) tel = "+33" + tel.slice(1);
      if (!tel.startsWith("+")) tel = "+33" + tel;

      const smsText = avecAcompte
        ? `✅ CleanNet06\nRésa confirmée !\n🧹 ${service} - ${option}\n📅 ${date} à ${creneau?.split(" → ")[0] || creneau}\n📍 ${adresse}\nMerci !`
        : `📬 CleanNet06\nDemande reçue !\n🧹 ${service} - ${option}\n📅 ${date} à ${creneau?.split(" → ")[0] || creneau}\nConfirmation sous 24h.`;

      try {
        const smsRes = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": process.env.BREVO_API_KEY,
          },
          body: JSON.stringify({
            sender: "CleanNet",
            recipient: tel,
            content: smsText,
            type: "transactional",
            tag: "reservation",
          }),
        });
        const smsData = await smsRes.json();
        console.log("SMS result:", JSON.stringify(smsData));
      } catch (smsErr) {
        console.error("SMS error:", smsErr.message);
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Email error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
