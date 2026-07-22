export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { note, feedback, reservationId } = req.body;
  const brevoKey = process.env.BREVO_API_KEY;
  const ownerEmail = process.env.OWNER_EMAIL || "cleannet06600@gmail.com";
  const senderEmail = process.env.SENDER_EMAIL || "cleannet06600@gmail.com";
  if (!brevoKey) return res.status(500).json({ error: "Brevo not configured" });
  const stars = "⭐".repeat(note) + "☆".repeat(5 - note);
  const html = `<div style="font-family:Inter,sans-serif;padding:20px;background:#FEF2F2;border-radius:12px;"><h2>⚠️ Avis négatif reçu</h2><div style="font-size:24px;">${stars}</div><p>Note : <strong>${note}/5</strong></p><blockquote style="background:#fff;padding:16px;border-radius:8px;font-style:italic;">"${feedback}"</blockquote></div>`;
  try {
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": brevoKey },
      body: JSON.stringify({ sender: { name: "CleanNet Avis", email: senderEmail }, to: [{ email: ownerEmail }], subject: `⚠️ Avis négatif ${stars}`, htmlContent: html }),
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
