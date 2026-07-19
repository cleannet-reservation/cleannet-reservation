const getBase = () => {
  const url = (process.env.SUPABASE_URL || "").replace(/\/rest\/v1\/?$/, "");
  return `${url}/rest/v1/pipeline`;
};

const headers = () => ({
  "Content-Type": "application/json",
  "apikey": process.env.SUPABASE_ANON_KEY,
  "Authorization": `Bearer ${process.env.SUPABASE_ANON_KEY}`,
});

export default async function handler(req, res) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  const base = getBase();

  // GET — liste tous les deals
  if (req.method === "GET") {
    const r = await fetch(`${base}?order=created_at.desc`, { headers: headers() });
    const data = await r.json();
    return res.status(200).json(Array.isArray(data) ? data : []);
  }

  // POST — créer un deal
  if (req.method === "POST") {
    const r = await fetch(base, {
      method: "POST",
      headers: { ...headers(), "Prefer": "return=representation" },
      body: JSON.stringify(req.body),
    });
    const data = await r.json();
    return res.status(201).json(data);
  }

  // PATCH — modifier stage/notes
  if (req.method === "PATCH") {
    const { id, ...updates } = req.body;
    const r = await fetch(`${base}?id=eq.${id}`, {
      method: "PATCH",
      headers: { ...headers(), "Prefer": "return=representation" },
      body: JSON.stringify(updates),
    });
    const data = await r.json();
    return res.status(200).json(data);
  }

  // DELETE
  if (req.method === "DELETE") {
    const { id } = req.body;
    await fetch(`${base}?id=eq.${id}`, { method: "DELETE", headers: headers() });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
