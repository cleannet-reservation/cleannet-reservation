export default async function handler(req, res) {
  const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/rest\/v1\/?$/, "");
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  const brevoKey = process.env.BREVO_API_KEY;
  const ownerPhone = process.env.OWNER_PHONE || "33612922048";
  const ownerEmail = process.env.OWNER_EMAIL || "cleannet06600@gmail.com";
  const senderEmail = process.env.SENDER_EMAIL || "cleannet06600@gmail.com";

  const now = new Date();
  const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const firstDayTwoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const lastDayTwoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 1, 0);
  const toStr = (d) => d.toISOString().split("T")[0];
  const monthName = firstDayLastMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const headers = { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` };

  try {
    const r1 = await fetch(`${supabaseUrl}/rest/v1/reservations?date=gte.${toStr(firstDayLastMonth)}&date=lte.${toStr(lastDayLastMonth)}&statut=neq.annule&select=*`, { headers });
    const lastMonth = await r1.json();
    const r2 = await fetch(`${supabaseUrl}/rest/v1/reservations?date=gte.${toStr(firstDayTwoMonthsAgo)}&date=lte.${toStr(lastDayTwoMonthsAgo)}&statut=neq.annule&select=*`, { headers });
    const twoMonthsAgo = await r2.json();

    const totalInterventions = lastMonth.length;
    const totalCA = lastMonth.reduce((s, r) => s + (parseFloat(r.total) || 0), 0);
    const prevCA = Array.isArray(twoMonthsAgo) ? twoMonthsAgo.reduce((s, r) => s + (parseFloat(r.total) || 0), 0) : 0;
    const serviceCount = {};
    lastMonth.forEach(r => { serviceCount[r.service] = (serviceCount[r.service] || 0) + 1; });
    const topService = Object.entries(serviceCount).sort((a, b) => b[1] - a[1])[0];
    const evolutionCA = prevCA > 0 ? ((totalCA - prevCA) / prevCA * 100).toFixed(0) : null;
    const evolutionSign = evolutionCA > 0 ? "+" : "";

    const smsText = [`CleanNet - Récap ${monthName}`, `📋 ${totalInterventions} intervention${totalInterventions > 1 ? "s" : ""}`, `💶 CA : ${totalCA.toFixed(0)}€`, topService ? `⭐ Top : ${topService[0]} (${topService[1]}x)` : null, evolutionCA !== null ? `📈 CA ${evolutionSign}${evolutionCA}% vs mois préc.` : null].filter(Boolean).join("\n");

    if (brevoKey && ownerPhone) {
      await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json", "api-key": brevoKey },
        body: JSON.stringify({ sender: "CleanNet", recipient: `+${ownerPhone.replace(/\D/g, "")}`, content: smsText, type: "transactional" }),
      });
    }
    return res.status(200).json({ success: true, month: monthName, interventions: totalInterventions, ca: totalCA.toFixed(0) });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
