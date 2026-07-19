const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

const headers = {
  "Content-Type": "application/json",
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
};

export default async function handler(req, res) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  const cleanUrl = SUPABASE_URL.replace(/\/rest\/v1\/?$/, "");
  const base = `${cleanUrl}/rest/v1/reservations`;

  // GET — liste toutes les réservations
  if (req.method === "GET") {
    const r = await fetch(`${base}?order=created_at.desc`, { headers });
    const data = await r.json();
    res.setHeader("Cache-Control", "no-store, no-cache");
    return res.status(200).json(Array.isArray(data) ? data : []);
  }

  // POST — créer une réservation
  if (req.method === "POST") {
    const r = await fetch(base, {
      method: "POST",
      headers: { ...headers, "Prefer": "return=representation" },
      body: JSON.stringify(req.body),
    });
    const data = await r.json();
    return res.status(201).json(data);
  }

  // PATCH — modifier statut/note
  if (req.method === "PATCH") {
    const { id, ...updates } = req.body;
    const r = await fetch(`${base}?id=eq.${id}`, {
      method: "PATCH",
      headers: { ...headers, "Prefer": "return=representation" },
      body: JSON.stringify(updates),
    });
    const data = await r.json();
    return res.status(200).json(data);
  }

  // DELETE
  if (req.method === "DELETE") {
    const { id } = req.body;
    await fetch(`${base}?id=eq.${id}`, { method: "DELETE", headers });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
