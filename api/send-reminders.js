export default async function handler(req, res) {
  const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/rest\/v1\/?$/, "");
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  const brevoKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.SENDER_EMAIL || "cleannet06600@gmail.com";
  const ownerEmail = process.env.OWNER_EMAIL || senderEmail;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  try {
    const r = await fetch(
      `${supabaseUrl}/rest/v1/reservations?date=eq.${tomorrowStr}&statut=neq.annule&select=*`,
      { headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` } }
    );
    const reservations = await r.json();

    if (!Array.isArray(reservations) || reservations.length === 0) {
      return res.status(200).json({ success: true, message: "Aucune réservation demain", date: tomorrowStr });
    }

    const sendEmail = async (to, toName, subject, html) => {
      if (!brevoKey) return false;
      const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "Content-Type": "application/json", "api-key": brevoKey },
        body: JSON.stringify({
          sender: { name: "CleanNet Multi-Service 06", email: senderEmail },
          to: [{ email: to, name: toName }],
          subject, htmlContent: html,
        }),
      });
      return resp.ok;
    };

    const sendSMS = async (telephone, text) => {
      if (!brevoKey || !telephone) return false;
      let tel = telephone.replace(/\s/g, "").replace(/\./g, "");
      if (tel.startsWith("0")) tel = "+33" + tel.slice(1);
      if (!tel.startsWith("+")) tel = "+33" + tel;
      try {
        const resp = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
          method: "POST",
          headers: { "Content-Type": "application/json", "api-key": brevoKey },
          body: JSON.stringify({ sender: "CleanNet", recipient: tel, content: text, type: "transactional" }),
        });
        return resp.ok;
      } catch (e) { console.error("SMS error:", e.message); return false; }
    };

    // Email récap au propriétaire
    const ownerHtml = `
      <div style="font-family:Inter,system-ui,sans-serif;max-width:600px;margin:0 auto;background:#F7F8FC;padding:24px;">
        <div style="background:#0057FF;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:20px;">📅 Vos rendez-vous de demain</h1>
          <p style="margin:6px 0 0;opacity:0.85;font-size:14px;">${tomorrowStr} — ${reservations.length} intervention(s)</p>
        </div>
        <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;">
          ${reservations.map(rv => `
            <div style="border:1.5px solid #E5E7EB;border-radius:10px;padding:14px 18px;margin-bottom:14px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                <strong style="font-size:15px;color:#1A1F36;">${rv.prenom} ${rv.nom}</strong>
                <span style="color:#0057FF;font-weight:700;">${rv.creneau || ""}</span>
              </div>
              <div style="font-size:13px;color:#6B7280;line-height:1.8;">
                🧹 ${rv.service} — ${rv.option || ""}<br/>
                📍 ${rv.adresse || ""}<br/>
                📞 ${rv.telephone || ""}<br/>
                💶 Total : ${rv.total || ""}€
              </div>
            </div>
          `).join("")}
          <p style="font-size:12px;color:#9CA3AF;text-align:center;margin-top:16px;">CleanNet Multi-Service 06 · Rappel automatique</p>
        </div>
      </div>`;

    await sendEmail(ownerEmail, "CleanNet", `📅 ${reservations.length} rendez-vous demain — ${tomorrowStr}`, ownerHtml);

    let sent = 0;
    for (const rv of reservations) {
      if (!rv.email) continue;

      const clientHtml = `
        <div style="font-family:Inter,system-ui,sans-serif;max-width:600px;margin:0 auto;background:#F7F8FC;padding:24px;">
          <div style="background:#0057FF;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
            <h1 style="margin:0;font-size:20px;">⏰ Rappel — Votre rendez-vous est demain !</h1>
          </div>
          <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;">
            <p style="font-size:15px;color:#1A1F36;line-height:1.7;">Bonjour <strong>${rv.prenom}</strong>,<br><br>Nous vous rappelons votre rendez-vous prévu <strong>demain</strong> :</p>
            <div style="background:#EEF3FF;border:1.5px solid #0057FF;border-radius:10px;padding:16px 20px;margin:16px 0;">
              <table style="width:100%;border-collapse:collapse;font-size:14px;">
                <tr><td style="padding:6px 0;color:#6B7280;width:120px;">Service</td><td style="font-weight:700;">${rv.service} — ${rv.option || ""}</td></tr>
                <tr><td style="padding:6px 0;color:#6B7280;">Date</td><td style="font-weight:700;">${rv.date}</td></tr>
                <tr><td style="padding:6px 0;color:#6B7280;">Créneau</td><td style="font-weight:700;">${rv.creneau || ""}</td></tr>
                <tr><td style="padding:6px 0;color:#6B7280;">Adresse</td><td style="font-weight:700;">${rv.adresse || ""}</td></tr>
              </table>
            </div>
            <p style="font-size:14px;color:#6B7280;">Une question ? 📞 <strong>${process.env.COMPANY_PHONE || "06 12 92 20 48"}</strong></p>
            <p style="font-size:12px;color:#9CA3AF;text-align:center;">CleanNet Multi-Service 06 · Alpes-Maritimes</p>
          </div>
        </div>`;

      await sendEmail(rv.email, `${rv.prenom} ${rv.nom}`, `⏰ Rappel — Votre rendez-vous CleanNet est demain à ${rv.creneau || ""}`, clientHtml);

      // SMS de rappel au client
      if (rv.telephone) {
        const smsText = `CleanNet\n⏰ Rappel rdv demain !\n🧹 ${rv.service}\n📅 ${rv.date} à ${rv.creneau?.split(" → ")[0] || ""}\n📍 ${rv.adresse || ""}\nQuestion ? 📞 ${process.env.COMPANY_PHONE || "06 12 92 20 48"}`;
        await sendSMS(rv.telephone, smsText);
      }

      sent++;
    }

    return res.status(200).json({ success: true, date: tomorrowStr, total: reservations.length, emailsSent: sent + 1 });

  } catch (error) {
    console.error("Reminder error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
