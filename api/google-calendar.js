import crypto from "crypto";

function base64url(str) {
  return Buffer.from(str).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function getAccessToken(privateKey, clientEmail) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({
    iss: clientEmail, sub: clientEmail,
    scope: "https://www.googleapis.com/auth/calendar",
    aud: "https://oauth2.googleapis.com/token",
    iat: now, exp: now + 3600,
  }));
  const signingInput = `${header}.${payload}`;
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signingInput);
  const signature = sign.sign(privateKey, "base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  const jwt = `${signingInput}.${signature}`;
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const data = await r.json();
  if (!data.access_token) throw new Error(`Token error: ${JSON.stringify(data)}`);
  return data.access_token;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_CLIENT_EMAIL) {
    return res.status(500).json({ error: "Google Calendar not configured" });
  }
  const { prenom, nom, service, option, date, creneau, adresse, telephone, email } = req.body;
  try {
    const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";
    const accessToken = await getAccessToken(privateKey, clientEmail);
    const [startTime, endTime] = (creneau || "09:00 → 10:00").split(" → ");
    const startDateTime = `${date}T${startTime.trim()}:00`;
    const endDateTime = `${date}T${(endTime || "10:00").trim()}:00`;
    const event = {
      summary: `🧹 ${service} — ${prenom} ${nom}`,
      description: `Service: ${service} — ${option}\nClient: ${prenom} ${nom}\nTéléphone: ${telephone}\nEmail: ${email}\nAdresse: ${adresse}`,
      location: adresse,
      start: { dateTime: startDateTime, timeZone: "Europe/Paris" },
      end: { dateTime: endDateTime, timeZone: "Europe/Paris" },
      colorId: "2",
    };
    const r = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: "POST",
        headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(event),
      }
    );
    const data = await r.json();
    if (!r.ok) throw new Error(data.error?.message || "Google Calendar API error");
    return res.status(200).json({ success: true, eventId: data.id });
  } catch (error) {
    console.error("Google Calendar error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
