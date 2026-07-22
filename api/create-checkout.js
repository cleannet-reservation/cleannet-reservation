import Stripe from "stripe";
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const { priceId, prenom, nom, email, telephone, adresse, service, option, date, creneau, total, acompte, message } = req.body;
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      locale: "fr",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.headers.origin}/success?prenom=${encodeURIComponent(prenom)}&nom=${encodeURIComponent(nom)}&email=${encodeURIComponent(email)}&telephone=${encodeURIComponent(telephone)}&adresse=${encodeURIComponent(adresse)}&service=${encodeURIComponent(service)}&option=${encodeURIComponent(option)}&date=${encodeURIComponent(date)}&creneau=${encodeURIComponent(creneau)}&total=${encodeURIComponent(total)}&acompte=${encodeURIComponent(acompte)}&message=${encodeURIComponent(message || "")}`,
      cancel_url: req.headers.origin,
    });
    return res.status(200).json({ url: session.url });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
