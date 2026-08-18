export default async function handler(req, res) {
  const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/rest\/v1\/?$/, "");
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  const brevoKey = process.env.BREVO_API_KEY;
  const today = new Date().toISOString().split("T")[0];
  try {
    const r = await fetch(`${supabaseUrl}/rest/v1/reservations?date=eq.${today}&statut=neq.annule&select=*`, { headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` } });
    const reservations = await r.json();
    if (!Array.isArray(reservations) || reservations.length === 0) return res.status(200).json({ success: true, message: "Aucune intervention aujourd'hui", sent: 0 });
    let sent = 0;
    for (const rv of reservations) {
      if (!rv.telephone) continue;
      let tel = rv.telephone.replace(/\s/g,"").replace(/\./g,"");
      if (tel.startsWith("0")) tel = "+33" + tel.slice(1);
      if (!tel.startsWith("+")) tel = "+33" + tel;
      const reviewUrl = `https://cleannet-reservation.vercel.app/avis?id=${rv.id}`;
      const smsText = `CleanNet\nBonjour ${rv.prenom} 😊\nVotre intervention de ce jour s'est bien passée ?\nDonnez-nous une note :\n${reviewUrl}\nMerci ! 🙏`;
      try {
        const smsRes = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", { method: "POST", headers: { "Content-Type": "application/json", "api-key": brevoKey }, body: JSON.stringify({ sender: "CleanNet", recipient: tel, content: smsText, type: "transactional" }) });
        if (smsRes.ok) sent++;
      } catch(e) { console.error("SMS error:", e.message); }
    }
    return res.status(200).json({ success: true, date: today, sent });
  } catch(error) { return res.status(500).json({ error: error.message }); }
}
