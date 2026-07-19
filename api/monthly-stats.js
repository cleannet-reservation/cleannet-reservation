export default async function handler(req, res) {
  const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/rest\/v1\/?$/, "");
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  const brevoKey = process.env.BREVO_API_KEY;
  const ownerPhone = process.env.OWNER_PHONE || "33612922048";
  const ownerEmail = process.env.OWNER_EMAIL || "cleannet06600@gmail.com";
  const senderEmail = process.env.SENDER_EMAIL || "cleannet06600@gmail.com";

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  // Mois précédent
  const now = new Date();
  const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const firstDayTwoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const lastDayTwoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 1, 0);

  const toStr = (d) => d.toISOString().split("T")[0];
  const monthName = firstDayLastMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  const headers = {
    "apikey": supabaseKey,
    "Authorization": `Bearer ${supabaseKey}`,
  };

  try {
    // Réservations du mois précédent
    const r1 = await fetch(
      `${supabaseUrl}/rest/v1/reservations?date=gte.${toStr(firstDayLastMonth)}&date=lte.${toStr(lastDayLastMonth)}&statut=neq.annule&select=*`,
      { headers }
    );
    const lastMonth = await r1.json();

    // Réservations du mois d'avant (pour comparaison)
    const r2 = await fetch(
      `${supabaseUrl}/rest/v1/reservations?date=gte.${toStr(firstDayTwoMonthsAgo)}&date=lte.${toStr(lastDayTwoMonthsAgo)}&statut=neq.annule&select=*`,
      { headers }
    );
    const twoMonthsAgo = await r2.json();

    if (!Array.isArray(lastMonth)) {
      return res.status(500).json({ error: "Supabase error" });
    }

    // Calculs
    const totalInterventions = lastMonth.length;
    const totalCA = lastMonth.reduce((s, r) => s + (parseFloat(r.total) || 0), 0);
    const prevInterventions = Array.isArray(twoMonthsAgo) ? twoMonthsAgo.length : 0;
    const prevCA = Array.isArray(twoMonthsAgo) ? twoMonthsAgo.reduce((s, r) => s + (parseFloat(r.total) || 0), 0) : 0;

    // Service le plus demandé
    const serviceCount = {};
    lastMonth.forEach(r => {
      const s = r.service || "Autre";
      serviceCount[s] = (serviceCount[s] || 0) + 1;
    });
    const topService = Object.entries(serviceCount).sort((a, b) => b[1] - a[1])[0];

    // Évolution
    const evolutionCA = prevCA > 0 ? ((totalCA - prevCA) / prevCA * 100).toFixed(0) : null;
    const evolutionSign = evolutionCA > 0 ? "+" : "";

    // SMS
    const smsText = [
      `CleanNet - Récap ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`,
      `📋 ${totalInterventions} intervention${totalInterventions > 1 ? "s" : ""}`,
      `💶 CA : ${totalCA.toFixed(0)}€`,
      topService ? `⭐ Top service : ${topService[0]} (${topService[1]}x)` : null,
      evolutionCA !== null ? `📈 CA vs mois précédent : ${evolutionSign}${evolutionCA}%` : null,
    ].filter(Boolean).join("\n");

    // Envoyer SMS
    if (brevoKey && ownerPhone) {
      await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json", "api-key": brevoKey },
        body: JSON.stringify({
          sender: "CleanNet",
          recipient: `+${ownerPhone.replace(/\D/g, "")}`,
          content: smsText,
          type: "transactional",
        }),
      });
    }

    // Envoyer email récap détaillé
    if (brevoKey && ownerEmail) {
      const html = `
        <div style="font-family:Inter,system-ui,sans-serif;max-width:600px;margin:0 auto;background:#F7F8FC;padding:24px;">
          <div style="background:#0057FF;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
            <h1 style="margin:0;font-size:20px;">📊 Récap mensuel — ${monthName}</h1>
            <p style="margin:6px 0 0;opacity:0.85;font-size:14px;">CleanNet Multi-Service 06</p>
          </div>
          <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;">

            <!-- KPIs -->
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px;">
              ${[
                { label: "Interventions", val: totalInterventions, icon: "📋" },
                { label: "CA du mois", val: `${totalCA.toFixed(0)}€`, icon: "💶" },
                { label: "Moy. par intervention", val: totalInterventions > 0 ? `${(totalCA / totalInterventions).toFixed(0)}€` : "0€", icon: "📈" },
              ].map(s => `
                <div style="background:#EEF3FF;border-radius:10px;padding:14px;text-align:center;">
                  <div style="font-size:24px;margin-bottom:4px;">${s.icon}</div>
                  <div style="font-size:20px;font-weight:800;color:#0057FF;">${s.val}</div>
                  <div style="font-size:11px;color:#6B7280;">${s.label}</div>
                </div>
              `).join("")}
            </div>

            <!-- Comparaison -->
            ${evolutionCA !== null ? `
            <div style="background:${evolutionCA >= 0 ? "#F0FDF4" : "#FEF2F2"};border:1.5px solid ${evolutionCA >= 0 ? "#059669" : "#DC2626"};border-radius:10px;padding:14px 18px;margin-bottom:20px;text-align:center;">
              <span style="font-size:16px;font-weight:800;color:${evolutionCA >= 0 ? "#059669" : "#DC2626"};">
                ${evolutionCA >= 0 ? "📈" : "📉"} CA ${evolutionSign}${evolutionCA}% vs ${new Date(firstDayTwoMonthsAgo).toLocaleDateString("fr-FR", { month: "long" })}
              </span>
              <div style="font-size:13px;color:#6B7280;margin-top:4px;">
                ${prevCA.toFixed(0)}€ → ${totalCA.toFixed(0)}€
              </div>
            </div>` : ""}

            <!-- Services -->
            ${Object.keys(serviceCount).length > 0 ? `
            <p style="font-size:14px;font-weight:700;margin:0 0 10px;">🧹 Répartition par service</p>
            ${Object.entries(serviceCount).sort((a,b)=>b[1]-a[1]).map(([s,n]) => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-radius:8px;background:#F7F8FC;margin-bottom:6px;">
                <span style="font-size:14px;font-weight:600;">${s}</span>
                <div style="display:flex;align-items:center;gap:8px;">
                  <div style="background:#0057FF;height:6px;border-radius:3px;width:${Math.round(n/totalInterventions*80)}px;"></div>
                  <span style="font-size:13px;font-weight:700;color:#0057FF;">${n}x</span>
                </div>
              </div>
            `).join("")}` : ""}

            <!-- Liste interventions -->
            <p style="font-size:14px;font-weight:700;margin:16px 0 10px;">📋 Toutes les interventions</p>
            ${lastMonth.sort((a,b) => new Date(a.date)-new Date(b.date)).map(r => `
              <div style="border:1px solid #E5E7EB;border-radius:8px;padding:10px 14px;margin-bottom:8px;font-size:13px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                  <strong>${r.prenom} ${r.nom}</strong>
                  <span style="color:#0057FF;font-weight:700;">${r.total}€</span>
                </div>
                <div style="color:#6B7280;">🧹 ${r.service} · 📅 ${r.date} · 📞 ${r.telephone || ""}</div>
              </div>
            `).join("")}

            <p style="font-size:12px;color:#9CA3AF;text-align:center;margin-top:20px;">CleanNet Multi-Service 06 · Récap automatique mensuel</p>
          </div>
        </div>`;

      await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "Content-Type": "application/json", "api-key": brevoKey },
        body: JSON.stringify({
          sender: { name: "CleanNet Stats", email: senderEmail },
          to: [{ email: ownerEmail, name: "CleanNet" }],
          subject: `📊 Récap ${monthName} — ${totalInterventions} interventions · ${totalCA.toFixed(0)}€ CA`,
          htmlContent: html,
        }),
      });
    }

    return res.status(200).json({
      success: true,
      month: monthName,
      interventions: totalInterventions,
      ca: totalCA.toFixed(0),
      topService: topService ? topService[0] : null,
      evolution: evolutionCA,
    });

  } catch (error) {
    console.error("Monthly stats error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
