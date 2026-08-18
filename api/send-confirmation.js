export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { prenom, nom, email, telephone, adresse, service, option, date, creneau, total, acompte, smsOnly } = req.body;
  const SENDER_EMAIL = process.env.SENDER_EMAIL || "cleannet06600@gmail.com";
  const SENDER_NAME = "CleanNet Multi-Service 06";
  const OWNER_EMAIL = process.env.OWNER_EMAIL || SENDER_EMAIL;
  const avecAcompte = acompte && acompte !== "0" && acompte !== "0,00 €";
  const sendEmail = async (to, toName, subject, html) => {
    if (!process.env.BREVO_API_KEY) return;
    await fetch("https://api.brevo.com/v3/smtp/email", { method: "POST", headers: { "Content-Type": "application/json", "api-key": process.env.BREVO_API_KEY }, body: JSON.stringify({ sender: { name: SENDER_NAME, email: SENDER_EMAIL }, to: [{ email: to, name: toName }], subject, htmlContent: html }) });
  };
  const ownerHtml = `<div style="font-family:Inter,sans-serif;padding:20px;"><h2>${avecAcompte?"🔔 Nouvelle réservation":"📋 Nouvelle demande"}</h2><p><strong>${prenom} ${nom}</strong><br>📞 ${telephone}<br>📧 ${email}<br>📍 ${adresse}</p><p>🧹 ${service} — ${option}<br>📅 ${date} · ${creneau}<br>💶 Total : ${total}</p></div>`;
  const clientHtml = `<div style="font-family:Inter,sans-serif;padding:20px;"><h2>${avecAcompte?"✅ Réservation confirmée !":"📬 Demande bien reçue !"}</h2><p>Bonjour <strong>${prenom}</strong>,</p><p>🧹 ${service} — ${option}<br>📅 ${date} · ${creneau}<br>📍 ${adresse}<br>💶 Total : ${total}</p><p>CleanNet Multi-Service 06</p></div>`;
  try {
    if (!smsOnly) {
      await sendEmail(OWNER_EMAIL, SENDER_NAME, `${avecAcompte?"🔔":"📋"} ${avecAcompte?"Nouvelle réservation":"Nouvelle demande"} — ${prenom} ${nom} — ${date}`, ownerHtml);
      await sendEmail(email, `${prenom} ${nom}`, `${avecAcompte?"✅ Réservation confirmée":"📬 Demande reçue"} — CleanNet — ${date}`, clientHtml);
    }
    if (telephone) {
      let tel = telephone.replace(/\s/g,"").replace(/\./g,"");
      if (tel.startsWith("0")) tel = "+33" + tel.slice(1);
      if (!tel.startsWith("+")) tel = "+33" + tel;
      const smsText = avecAcompte ? `✅ CleanNet06\nRésa confirmée !\n🧹 ${service} - ${option}\n📅 ${date} à ${creneau?.split(" → ")[0]||creneau}\n📍 ${adresse}\nMerci !` : `📬 CleanNet06\nDemande reçue !\n🧹 ${service} - ${option}\n📅 ${date} à ${creneau?.split(" → ")[0]||creneau}\nConfirmation sous 24h.`;
      try {
        const smsRes = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", { method: "POST", headers: { "Content-Type": "application/json", "api-key": process.env.BREVO_API_KEY }, body: JSON.stringify({ sender: "CleanNet", recipient: tel, content: smsText, type: "transactional" }) });
        const smsData = await smsRes.json();
        console.log("SMS result:", JSON.stringify(smsData));
      } catch(smsErr) { console.error("SMS error:", smsErr.message); }
    }
    return res.status(200).json({ success: true });
  } catch (error) { return res.status(500).json({ error: error.message }); }
}
