import { SignJWT, importPKCS8 } from "jose";

async function getAccessToken() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;

  const key = await importPKCS8(privateKey, "RS256");

  const jwt = await new SignJWT({
    scope: "https://www.googleapis.com/auth/calendar",
  })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(clientEmail)
    .setSubject(clientEmail)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(key);

  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const data = await r.json();
  return data.access_token;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_CLIENT_EMAIL) {
    return res.status(500).json({ error: "Google Calendar not configured" });
  }

  const { prenom, nom, service, option, date, creneau, adresse, telephone, email } = req.body;

  try {
    const accessToken = await getAccessToken();
    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

    // Parse date and time
    const [startTime, endTime] = (creneau || "09:00 → 10:00").split(" → ");
    const startDateTime = `${date}T${startTime}:00`;
    const endDateTime = `${date}T${(endTime || "10:00")}:00`;

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
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    const data = await r.json();

    if (!r.ok) {
      throw new Error(data.error?.message || "Google Calendar API error");
    }

    return res.status(200).json({ success: true, eventId: data.id, eventLink: data.htmlLink });
  } catch (error) {
    console.error("Google Calendar error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
