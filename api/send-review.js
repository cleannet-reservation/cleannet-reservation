export default async function handler(req, res) {
  const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/rest\/v1\/?$/, "");
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  const brevoKey = process.env.BREVO_API_KEY;
  const googleReviewUrl = "https://g.page/r/CYYAykIVxndLEBM/review";

  if (!supabaseUrl || !supabaseKey || !brevoKey) {
    return res.status(500).json({ error: "Missing configuration" });
  }

  // Calculer la plage horaire — réservations dont le créneau se termine il y a 4h
  const now = new Date();
  const target = new Date(now.getTime() - 4 * 60 * 60 * 1000);
  const targetDate = target.toISOString().split("T")[0];
  const targetHour = String(target.getHours()).padStart(2, "0");
  const targetMinute = String(target.getMinutes()).padStart(2, "0");
  const targetTime = `${targetHour}:${targetMinute}`;

  try {
    // Récupérer les réservations de la date cible non annulées
    const r = await fetch(
      `${supabaseUrl}/rest/v1/reservations?date=eq.${targetDate}&statut=neq.annule&select=*`,
      {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
        },
      }
    );
    const reservations = await r.json();

    if (!Array.isArray(reservations) || reservations.length === 0) {
      return res.status(200).json({ success: true, message: "Aucune réservation", sent: 0 });
    }

    // Filtrer celles dont le créneau de fin correspond à ~4h avant maintenant (±15 min)
    const targets = reservations.filter(rv => {
      if (!rv.creneau) return false;
      const endTime = rv.creneau.split(" → ")[1];
      if (!endTime) return false;
      const [h, m] = endTime.split(":").map(Number);
      const endMinutes = h * 60 + m;
      const targetMinutes = target.getHours() * 60 + target.getMinutes();
      return Math.abs(endMinutes - targetMinutes) <= 15;
    });

    let sent = 0;
    for (const rv of targets) {
      if (!rv.telephone) continue;

      // Formater le numéro
      let tel = rv.telephone.replace(/\s/g, "").replace(/\./g, "");
      if (tel.startsWith("0")) tel = "+33" + tel.slice(1);
      if (!tel.startsWith("+")) tel = "+33" + tel;

      const reviewUrl = `https://cleannet-reservation.vercel.app/avis?id=${rv.id}`;
      const smsText = `CleanNet\nBonjour ${rv.prenom} 😊\nVotre intervention s'est bien passée ?\nDonnez-nous une note :\n${reviewUrl}\nMerci ! 🙏`;

      try {
        const smsRes = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": brevoKey,
          },
          body: JSON.stringify({
            sender: "CleanNet",
            recipient: tel,
            content: smsText,
            type: "transactional",
            tag: "review-request",
          }),
        });
        const smsData = await smsRes.json();
        console.log(`SMS avis ${rv.prenom} ${rv.nom}:`, JSON.stringify(smsData));
        if (smsRes.ok) sent++;
      } catch (e) {
        console.error("SMS avis error:", e.message);
      }
    }

    return res.status(200).json({ success: true, date: targetDate, time: targetTime, checked: reservations.length, sent });
  } catch (error) {
    console.error("Review error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
