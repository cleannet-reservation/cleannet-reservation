import Stripe from "stripe";

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Check secret key is configured
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: "Stripe not configured" });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const { amount, currency, customerEmail, description, metadata } = req.body;

  // Validate amount (minimum 50 centimes)
  if (!amount || amount < 50) {
    return res.status(400).json({ error: "Montant invalide" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: currency || "eur",
            product_data: {
              name: description || "Acompte CleanNet Multi-Service 06",
              description: `Acompte de réservation — ${metadata?.service || ""} le ${metadata?.date || ""}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata: metadata || {},
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/`,
      locale: "fr",
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Stripe error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
