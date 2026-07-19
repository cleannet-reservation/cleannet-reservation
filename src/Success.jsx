import { useEffect, useState } from "react";

const WHATSAPP_NUMBER = "33612922048";

export default function Success() {
  const [booking, setBooking] = useState(null);
  const [status, setStatus] = useState("sending");

  useEffect(() => {
    const raw = sessionStorage.getItem("cleannet_booking");
    if (!raw) { setStatus("done"); return; }

    const data = JSON.parse(raw);
    sessionStorage.removeItem("cleannet_booking");
    setBooking(data);

    // Sauvegarder dans le pipeline via API
    fetch("/api/pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: `deal_${Date.now()}`,
        client: `${data.prenom} ${data.nom}`,
        service: `${data.service} — ${data.option}`,
        montant: parseFloat((data.total || "0").replace(/[^\d.,]/g,"").replace(",",".")) || 0,
        stage: "gagne",
        date_creation: new Date().toISOString().slice(0,10),
        date_relance: data.date,
        notes: `✅ Acompte payé: ${data.acompte} | 📅 ${data.date} ${data.creneau} | 📍 ${data.adresse}`,
        priorite: "haute",
        telephone: data.telephone,
        email: data.email,
      }),
    }).catch(() => {});
    fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prenom: data.prenom, nom: data.nom, email: data.email,
        telephone: data.telephone, adresse: data.adresse,
        service: data.service, option: data.option,
        date: data.date, creneau: data.creneau,
        total: String(data.total || "").replace(/[^\d.,]/g, "").replace(",", "."),
        acompte: String(data.acompte || "").replace(/[^\d.,]/g, "").replace(",", "."),
        statut: "confirme", source: "site",
      }),
    }).catch(() => {});

    // Créer événement Google Calendar
    fetch("/api/google-calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prenom: data.prenom, nom: data.nom,
        service: data.service, option: data.option,
        date: data.date, creneau: data.creneau,
        adresse: data.adresse, telephone: data.telephone,
        email: data.email,
      }),
    }).catch(() => {});

    setStatus("done");
  }, []);

  const openWhatsApp = () => {
    if (!booking) return;
    const msg = encodeURIComponent(
`✅ *Acompte reçu — Nouvelle réservation CleanNet*

👤 *Client :* ${booking.prenom} ${booking.nom}
📞 *Téléphone :* ${booking.telephone}
📧 *Email :* ${booking.email}
📍 *Adresse :* ${booking.adresse}

🧹 *Service :* ${booking.service} — ${booking.option}
📅 *Date :* ${booking.date}
🕐 *Créneau :* ${booking.creneau}
💶 *Total estimé :* ${booking.total}
💳 *Acompte encaissé :* ${booking.acompte}

_Paiement confirmé via Stripe_`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F7F8FC", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, system-ui, sans-serif", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "48px 32px", maxWidth: 480, width: "100%", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        {status === "sending" ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px" }}>Traitement en cours…</h1>
            <p style={{ color: "#6B7280", fontSize: 15 }}>Confirmation de votre paiement.</p>
          </>
        ) : (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1A1F36", margin: "0 0 12px" }}>Paiement confirmé !</h1>
            <p style={{ color: "#6B7280", fontSize: 15, lineHeight: 1.7, marginBottom: 20 }}>
              Merci <strong>{booking?.prenom}</strong>, votre acompte a bien été encaissé.<br />
              Envoyez votre récapitulatif sur WhatsApp pour que nous confirmions votre créneau.
            </p>

            <div style={{ background: "#F0FDF4", border: "1.5px solid #059669", borderRadius: 10, padding: "14px 20px", marginBottom: 20, fontSize: 14, color: "#059669", fontWeight: 600 }}>
              🔒 Acompte de {booking?.acompte} encaissé avec succès
            </div>

            {/* WhatsApp button */}
            <button onClick={openWhatsApp}
              style={{ width: "100%", background: "#25D366", color: "#fff", border: "none", borderRadius: 10, padding: "15px", fontSize: 15, fontWeight: 800, cursor: "pointer", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>📲</span>
              Envoyer le récapitulatif sur WhatsApp
            </button>

            <a href="/"
              style={{ display: "inline-block", background: "#F3F4F6", color: "#374151", textDecoration: "none", borderRadius: 10, padding: "12px 28px", fontWeight: 700, fontSize: 14 }}>
              Retour à l'accueil
            </a>

            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 24 }}>
              ✦ CleanNet Multi-Service 06 · Alpes-Maritimes
            </p>
          </>
        )}
      </div>
    </div>
  );
}
