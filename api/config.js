const getBase = () => {
  const url = (process.env.SUPABASE_URL || "").replace(/\/rest\/v1\/?$/, "");
  return `${url}/rest/v1/config`;
};
const headers = () => ({
  "Content-Type": "application/json",
  "apikey": process.env.SUPABASE_ANON_KEY,
  "Authorization": `Bearer ${process.env.SUPABASE_ANON_KEY}`,
});
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const base = getBase();
  if (req.method === "GET") {
    const r = await fetch(`${base}?id=eq.main&select=data`, { headers: headers() });
    const data = await r.json();
    if (Array.isArray(data) && data.length > 0 && data[0].data && Object.keys(data[0].data).length > 0) {
      return res.status(200).json(data[0].data);
    }
    return res.status(200).json({});
  }
  if (req.method === "POST") {
    const body = req.body;
    const configData = body.data || body;
    if (!configData || Object.keys(configData).length === 0) {
      return res.status(400).json({ error: "No data received" });
    }
    const r = await fetch(`${base}?id=eq.main`, {
      method: "PATCH",
      headers: { ...headers(), "Prefer": "return=representation" },
      body: JSON.stringify({ data: configData, updated_at: new Date().toISOString() }),
    });
    const result = await r.json();
    console.log("Supabase response:", JSON.stringify(result).slice(0, 200));
    return res.status(200).json({ success: true });
  }
  return res.status(405).json({ error: "Method not allowed" });
}
