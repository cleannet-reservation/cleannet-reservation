import { useState, useEffect } from "react";

// ─── STORAGE KEY ──────────────────────────────────────────────────────────────
const STORAGE_KEY = "cleannet_config";
const PWD_KEY = "cleannet_pwd";
const RESERVATIONS_KEY = "cleannet_reservations";
const PIPELINE_KEY = "cleannet_pipeline";
const DEFAULT_PASSWORD = "cleannet2026";

const PIPELINE_STAGES = [
  { id: "prospect",    label: "Prospect",          color: "#94a3b8", icon: "🎯" },
  { id: "contact",     label: "Contact pris",       color: "#60a5fa", icon: "📞" },
  { id: "visite",      label: "Visite / Éval.",     color: "#a78bfa", icon: "🔍" },
  { id: "devis",       label: "Devis envoyé",       color: "#f59e0b", icon: "📄" },
  { id: "negociation", label: "En négociation",     color: "#f97316", icon: "🤝" },
  { id: "gagne",       label: "Contrat signé ✓",    color: "#22c55e", icon: "🏆" },
  { id: "perdu",       label: "Perdu",              color: "#ef4444", icon: "✗"  },
];

function loadPipeline() {
  try { return JSON.parse(localStorage.getItem(PIPELINE_KEY) || "[]"); } catch (_) { return []; }
}
function savePipeline(list) {
  try { localStorage.setItem(PIPELINE_KEY, JSON.stringify(list)); } catch (_) {}
}

function getPassword() {
  try { return localStorage.getItem(PWD_KEY) || DEFAULT_PASSWORD; } catch (_) { return DEFAULT_PASSWORD; }
}
function setPassword(pwd) {
  try { localStorage.setItem(PWD_KEY, pwd); } catch (_) {}
}
function loadReservations() {
  try { return JSON.parse(localStorage.getItem(RESERVATIONS_KEY) || "[]"); } catch (_) { return []; }
}
function saveReservations(list) {
  try { localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(list)); } catch (_) {}
}

// ─── DEFAULT CONFIG ───────────────────────────────────────────────────────────
const DEFAULT_CONFIG = {
  company: {
    name: "CleanNet Multi-Service 06",
    tagline: "Nettoyage professionnel à domicile",
    phone: "06 00 00 00 00",
    email: "contact@cleannet06.fr",
    zone: "Alpes-Maritimes",
    acomptePercent: 30,
    accentColor: "#0057FF",
  },
  services: [
    {
      id: "canape", icon: "🛋️", name: "Nettoyage Canapé",
      description: "Nettoyage en profondeur, détachage et désodorisation",
      options: [
        { id: "c1", label: "2 places", price: 89, duration: 60 },
        { id: "c2", label: "3 places", price: 109, duration: 90 },
        { id: "c3", label: "Canapé d'angle", price: 139, duration: 120 },
      ],
    },
    {
      id: "matelas", icon: "🛏️", name: "Nettoyage Matelas",
      description: "Assainissement, anti-acariens et désodorisation",
      options: [
        { id: "m1", label: "1 personne (90×190)", price: 69, duration: 45 },
        { id: "m2", label: "2 personnes (140×190)", price: 89, duration: 60 },
        { id: "m3", label: "King size (160×200+)", price: 109, duration: 90 },
      ],
    },
    {
      id: "voiture", icon: "🚗", name: "Nettoyage Voiture",
      description: "Intérieur complet, sièges, moquettes, tableau de bord",
      options: [
        { id: "v1", label: "Citadine / Berline", price: 79, duration: 90 },
        { id: "v2", label: "SUV / Monospace", price: 99, duration: 120 },
        { id: "v3", label: "Van / Utilitaire", price: 129, duration: 150 },
      ],
    },
    {
      id: "chantier", icon: "🏗️", name: "Après-Chantier",
      description: "Nettoyage fin de chantier, poussières, résidus de travaux",
      options: [
        { id: "ch1", label: "Jusqu'à 50 m²", price: 149, duration: 120 },
        { id: "ch2", label: "50 à 100 m²", price: 249, duration: 180 },
        { id: "ch3", label: "100 à 200 m²", price: 399, duration: 300 },
      ],
    },
    {
      id: "vitres", icon: "🪟", name: "Nettoyage Vitres",
      description: "Vitres intérieur/extérieur, sans traces, résultat brillant",
      options: [
        { id: "vi1", label: "Appartement (≤ 80 m²)", price: 59, duration: 60 },
        { id: "vi2", label: "Maison (≤ 150 m²)", price: 99, duration: 120 },
        { id: "vi3", label: "Commerce / Bureau", price: 129, duration: 150 },
      ],
    },
    {
      id: "moquette", icon: "🏠", name: "Nettoyage Moquette",
      description: "Extraction profonde, détachage, séchage rapide",
      options: [
        { id: "mo1", label: "À la pièce", price: 49, duration: 45 },
        { id: "mo2", label: "Forfait 3 pièces", price: 129, duration: 120 },
        { id: "mo3", label: "Forfait 5 pièces", price: 199, duration: 180 },
      ],
    },
  ],
  upsells: [],
  availability: {
    daySchedules: {
      0: { active: false, start: "08:00", end: "18:00" }, // Dimanche
      1: { active: true,  start: "08:00", end: "18:00" }, // Lundi
      2: { active: true,  start: "08:00", end: "18:00" }, // Mardi
      3: { active: true,  start: "08:00", end: "18:00" }, // Mercredi
      4: { active: true,  start: "08:00", end: "18:00" }, // Jeudi
      5: { active: true,  start: "08:00", end: "18:00" }, // Vendredi
      6: { active: false, start: "09:00", end: "13:00" }, // Samedi
    },
    blockedDates: [],
    googleCalendarUrl: "",
  },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n).toFixed(2).replace(".", ",") + " €";
const uid = () => Math.random().toString(36).slice(2, 8);
const today = () => new Date().toISOString().split("T")[0];

const fmtDuration = (minutes) => {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, "0")}`;
};

const generateSlots = (startTime, endTime, durationMinutes) => {
  if (!startTime || !endTime || !durationMinutes) return [];
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const startTotal = sh * 60 + sm;
  const endTotal = eh * 60 + em;
  const slots = [];
  for (let t = startTotal; t + durationMinutes <= endTotal; t += 30) {
    const hh = String(Math.floor(t / 60)).padStart(2, "0");
    const mm = String(t % 60).padStart(2, "0");
    const endMin = t + durationMinutes;
    const eh2 = String(Math.floor(endMin / 60)).padStart(2, "0");
    const em2 = String(endMin % 60).padStart(2, "0");
    slots.push({ start: `${hh}:${mm}`, end: `${eh2}:${em2}` });
  }
  return slots;
};

function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return DEFAULT_CONFIG;
}
function saveConfig(cfg) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg)); } catch (_) {}
  // Sauvegarde aussi dans Supabase
  fetch("/api/config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: cfg }),
  }).catch(() => {});
}

// ─── BOOKING STEPS ────────────────────────────────────────────────────────────
const STEPS = ["Prestations", "Options", "Coordonnées", "Récapitulatif"];

function ProgressBar({ step, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "20px 24px 0" }}>
      {STEPS.map((label, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", flex: 1 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%", flexShrink: 0, zIndex: 1,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, transition: "all 0.2s",
            background: i <= step ? color : "#E5E7EB",
            color: i <= step ? "#fff" : "#9CA3AF",
            boxShadow: i === step ? `0 0 0 3px ${color}22` : "none",
          }}>
            {i < step ? "✓" : i + 1}
          </div>
          <span style={{
            fontSize: 11, marginLeft: 5, fontWeight: i <= step ? 700 : 500,
            color: i <= step ? color : "#9CA3AF", whiteSpace: "nowrap",
          }}>{label}</span>
          {i < STEPS.length - 1 && (
            <div style={{
              flex: 1, height: 2, margin: "0 6px",
              background: i < step ? color : "#E5E7EB", transition: "background 0.2s",
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── MINI CALENDAR ────────────────────────────────────────────────────────────
const DAYS_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

function MiniCalendar({ availability, selected, onSelect, color }) {
  const schedules = availability?.daySchedules || {
    0:{active:false,start:"08:00",end:"18:00"},1:{active:true,start:"08:00",end:"18:00"},
    2:{active:true,start:"08:00",end:"18:00"},3:{active:true,start:"08:00",end:"18:00"},
    4:{active:true,start:"08:00",end:"18:00"},5:{active:true,start:"08:00",end:"18:00"},
    6:{active:false,start:"09:00",end:"13:00"},
  };
  const activeDays = Object.entries(schedules).filter(([,v]) => v.active).map(([k]) => Number(k));

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const isAvailable = (d) => {
    const date = new Date(viewYear, viewMonth, d);
    const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const today2 = new Date(); today2.setHours(0,0,0,0);
    if (date < today2) return false;
    if ((availability?.blockedDates || []).includes(dateStr)) return false;
    if (!activeDays.includes(date.getDay())) return false;
    return true;
  };

  const getSchedule = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return schedules[d.getDay()] || null;
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ border: "1.5px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: color, color: "#fff" }}>
        <button onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1); } else setViewMonth(m => m-1); }}
          style={{ background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", fontWeight: 700, padding: "0 6px" }}>‹</button>
        <span style={{ fontWeight: 700, fontSize: 15 }}>{MONTHS_FR[viewMonth]} {viewYear}</span>
        <button onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1); } else setViewMonth(m => m+1); }}
          style={{ background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", fontWeight: 700, padding: "0 6px" }}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", background: "#F7F8FC" }}>
        {DAYS_FR.map(d => <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#9CA3AF", padding: "8px 0" }}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", padding: "8px" }}>
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
          const avail = isAvailable(d);
          const isSel = selected === dateStr;
          return (
            <button key={d} disabled={!avail} onClick={() => onSelect(dateStr)}
              style={{
                margin: 2, borderRadius: 8, border: "none", padding: "8px 4px",
                fontWeight: isSel ? 800 : 500, fontSize: 13,
                background: isSel ? color : avail ? "#fff" : "transparent",
                color: isSel ? "#fff" : avail ? "#1A1F36" : "#D1D5DB",
                cursor: avail ? "pointer" : "not-allowed",
                boxShadow: isSel ? `0 2px 8px ${color}55` : "none",
              }}>
              {d}
            </button>
          );
        })}
      </div>
      {selected && getSchedule(selected) && (
        <div style={{ padding: "10px 16px 14px", borderTop: "1px solid #E5E7EB", fontSize: 13, color: "#374151" }}>
          ✅ <strong>{selected}</strong> — {getSchedule(selected).start} à {getSchedule(selected).end}
        </div>
      )}
      <div style={{ padding: "0 16px 12px", fontSize: 12, color: "#9CA3AF" }}>
        Jours disponibles : {activeDays.map(d => DAYS_FR[d]).join(", ")}
      </div>
    </div>
  );
}

function BookingFlow({ config }) {
  const { company, services, upsells, availability } = config;
  const color = company.accentColor || "#0057FF";
  const [step, setStep] = useState(0);
  const [service, setService] = useState(null);
  const [option, setOption] = useState(null);
  const [activeUpsells, setActiveUpsells] = useState({});
  const [form, setForm] = useState({});
  const [confirmed, setConfirmed] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState(null);

  const canNext = () => {
    if (step === 0) {
      if (Object.keys(selectedServices).length === 0) return false;
      for (const [svcId, optId] of Object.entries(selectedServices)) {
        const svc = services.find(s => s.id === svcId);
        const opt = svc?.options.find(o => o.id === optId);
        if (opt?.priceType === "m2" && !(parseFloat(surfaces[svcId]) > 0)) return false;
        if (opt?.priceType === "hour" && !(parseFloat(surfaces[svcId]) > 0)) return false;
      }
      return true;
    }
    if (step === 1) return true; // Upsells — toujours possible de continuer
    if (step === 2) return !!(form.prenom && form.nom && form.email && form.telephone && form.adresse && form.date && form.timeSlot);
    return true;
  };

  const [payMode, setPayMode] = useState(null);
  const [requesting, setRequesting] = useState(false);
  const [requestDone, setRequestDone] = useState(false);
  const [surface, setSurface] = useState("");
  const [surfaces, setSurfaces] = useState({});
  const [bookedSlots, setBookedSlots] = useState([]);
  const [selectedServices, setSelectedServices] = useState({});

  const servicesTotal = Object.entries(selectedServices).reduce((total, [svcId, optId]) => {
    const svc = services.find(s => s.id === svcId);
    const opt = svc?.options.find(o => o.id === optId);
    if (!opt) return total;
    const price = opt.priceType === "m2" || opt.priceType === "hour"
      ? Number(opt.price) * (parseFloat(surfaces[svcId]) || 0)
      : Number(opt.price);
    return total + price;
  }, 0);

  // Charger les créneaux déjà réservés quand la date change
  useEffect(() => {
    if (!form.date) return;
    fetch(`/api/reservations?t=${Date.now()}`, { cache: "no-store" })
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        // Stocker les plages horaires occupées (début + fin)
        const taken = data
          .filter(r => r.date === form.date && r.statut !== "annule")
          .map(r => {
            const parts = r.creneau?.split(" → ");
            if (!parts || parts.length < 2) return null;
            const [sh, sm] = parts[0].split(":").map(Number);
            const [eh, em] = parts[1].split(":").map(Number);
            return { start: sh * 60 + sm, end: eh * 60 + em };
          })
          .filter(Boolean);
        setBookedSlots(taken);
      })
      .catch(() => {});
  }, [form.date]);

  const optionPrice = 0; // Non utilisé - remplacé par servicesTotal
  const upsellTotal = upsells.filter(u => (activeUpsells[u.id] || 0) > 0).reduce((s, u) => s + Number(u.price) * (activeUpsells[u.id] || 0), 0);
  const subtotal = servicesTotal + upsellTotal;
  const acompte = subtotal * (Number(company.acomptePercent) / 100);

  // Résumé des services sélectionnés
  const getServicesLabel = () => Object.entries(selectedServices).map(([svcId, optId]) => {
    const svc = services.find(s => s.id === svcId);
    const opt = svc?.options.find(o => o.id === optId);
    return `${svc?.name} — ${opt?.label}`;
  }).join(" + ");

  const handleRequestOnly = () => {
    const servicesLabel = getServicesLabel();
    // Sauvegarder dans le pipeline via API
    fetch("/api/pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: uid(),
        client: `${form.prenom} ${form.nom}`,
        service: servicesLabel,
        montant: subtotal,
        stage: "contact",
        date_creation: new Date().toISOString().slice(0, 10),
        date_relance: form.date,
        notes: `📅 ${form.date} ${form.timeSlot}→${form.timeSlotEnd} | 📍 ${form.adresse}${form.message ? ` | 💬 ${form.message}` : ""}`,
        priorite: "normale",
        telephone: form.telephone,
        email: form.email,
      }),
    }).catch(() => {});

    // Sauvegarder dans Supabase
    fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prenom: form.prenom, nom: form.nom, email: form.email,
        telephone: form.telephone, adresse: form.adresse,
        service: servicesLabel, option: "",
        date: form.date, creneau: `${form.timeSlot} → ${form.timeSlotEnd}`,
        total: String(subtotal.toFixed(2)), acompte: "0",
        statut: "attente", source: "site",
      }),
    }).catch(() => {});

    // Créer événement Google Calendar
    fetch("/api/google-calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prenom: form.prenom, nom: form.nom,
        service: servicesLabel, option: "",
        date: form.date, creneau: `${form.timeSlot} → ${form.timeSlotEnd}`,
        adresse: form.adresse, telephone: form.telephone,
        email: form.email,
      }),
    }).catch(() => {});

    // Envoyer SMS de confirmation au client
    fetch("/api/send-confirmation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prenom: form.prenom, nom: form.nom,
        email: form.email, telephone: form.telephone,
        adresse: form.adresse,
        service: service.name, option: option.label,
        date: form.date, creneau: `${form.timeSlot} → ${form.timeSlotEnd}`,
        total: fmt(subtotal), acompte: "0",
        statut: "attente", smsOnly: true,
      }),
    }).catch(() => {});

    const msg = encodeURIComponent(
`🗓 *Nouvelle réservation CleanNet*

👤 *Client :* ${form.prenom} ${form.nom}
📞 *Téléphone :* ${form.telephone}
📧 *Email :* ${form.email}
📍 *Adresse :* ${form.adresse}

🧹 *Service :* ${service.name} — ${option.label}
📅 *Date :* ${form.date}
🕐 *Créneau :* ${form.timeSlot} → ${form.timeSlotEnd}
💶 *Total estimé :* ${fmt(subtotal)}
💳 *Mode :* Sans acompte
${form.message ? `📝 *Note :* ${form.message}` : ""}

_Envoyé depuis le site de réservation CleanNet_`
    );
    window.open(`https://wa.me/33612922048?text=${msg}`, "_blank");
    setRequestDone(true);
  };

  const handlePay = async () => {
    setPaying(true);
    setPayError(null);
    try {
      // Save booking data to sessionStorage so success page can send confirmation email
      sessionStorage.setItem("cleannet_booking", JSON.stringify({
        prenom: form.prenom, nom: form.nom, email: form.email,
        telephone: form.telephone, adresse: form.adresse,
        service: service.name, option: option.label,
        date: form.date, creneau: `${form.timeSlot} → ${form.timeSlotEnd}`,
        total: fmt(subtotal), acompte: fmt(acompte),
        message: form.message || "",
      }));

      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(acompte * 100),
          currency: "eur",
          customerEmail: form.email,
          description: `Acompte ${company.acomptePercent}% — ${service.name} (${option.label}) — ${form.date} ${form.timeSlot}`,
          metadata: {
            prenom: form.prenom, nom: form.nom, telephone: form.telephone,
            adresse: form.adresse, service: service.name, option: option.label,
            date: form.date, creneau: `${form.timeSlot} → ${form.timeSlotEnd}`,
            total_estime: subtotal.toFixed(2), acompte: acompte.toFixed(2),
          },
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setPayError("Erreur lors de la création du paiement. Veuillez réessayer.");
      }
    } catch (e) {
      setPayError("Impossible de contacter le serveur de paiement. Vérifiez votre connexion.");
    } finally {
      setPaying(false);
    }
  };

  if (confirmed) return (
    <div style={{ padding: "48px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 12px" }}>Demande envoyée !</h2>
      <p style={{ color: "#6B7280", lineHeight: 1.7, marginBottom: 20 }}>
        Merci <strong>{form.prenom}</strong>, votre demande a été reçue.<br />
        Nous confirmons le créneau du <strong>{form.date}</strong> par email sous 24h.
      </p>
      <div style={{ background: "#F7F8FC", borderRadius: 10, padding: "14px 20px", display: "inline-block", textAlign: "left", fontSize: 14, lineHeight: 2 }}>
        <p>📧 <strong>{form.email}</strong></p>
        <p>📞 {form.telephone}</p>
      </div>
      <br />
      <button onClick={() => { setConfirmed(false); setStep(0); setService(null); setOption(null); setActiveUpsells({}); setForm({}); setSelectedServices({}); }}
        style={{ marginTop: 24, background: color, color: "#fff", border: "none", borderRadius: 8, padding: "11px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
        Nouvelle réservation
      </button>
    </div>
  );

  // Calcul total toutes prestations
  const totalDuration = Object.entries(selectedServices).reduce((total, [svcId, optId]) => {
    const svc = services.find(s => s.id === svcId);
    const opt = svc?.options.find(o => o.id === optId);
    if (opt?.priceType === "hour") {
      return total + (parseFloat(surfaces[svcId]) || 1) * 60;
    }
    return total + (Number(opt?.duration) || 60);
  }, 0) + upsells.filter(u => (activeUpsells[u.id] || 0) > 0).reduce((total, u) => {
    return total + (Number(u.duration) || 0) * (activeUpsells[u.id] || 1);
  }, 0);

  const fmtDurationTotal = (m) => { const h = Math.floor(m/60), mn = m%60; return h===0?`${mn}min`:mn===0?`${h}h`:`${h}h${String(mn).padStart(2,"0")}`; };

  return (
    <div>
      <ProgressBar step={step} color={color} />

      <div style={{ padding: "24px 24px 8px" }}>

        {/* STEP 0 — Sélection multiple de services */}
        {step === 0 && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 4px" }}>Quelles prestations souhaitez-vous ?</h2>
            <p style={{ color: "#6B7280", fontSize: 14, margin: "0 0 18px" }}>Sélectionnez un ou plusieurs services</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {services.map(s => {
                const selectedOptId = selectedServices[s.id];
                const isSelected = !!selectedOptId;
                const selectedOpt = s.options.find(o => o.id === selectedOptId);
                return (
                  <div key={s.id} style={{ border: `2px solid ${isSelected ? color : "#E5E7EB"}`, background: isSelected ? color + "08" : "#fff", borderRadius: 12, padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: isSelected ? 12 : 0 }}>
                      <span style={{ fontSize: 24 }}>{s.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{s.name}</div>
                        <div style={{ fontSize: 12, color: "#6B7280" }}>{s.description}</div>
                      </div>
                      <button onClick={() => {
                        if (isSelected) {
                          setSelectedServices(prev => { const n = {...prev}; delete n[s.id]; return n; });
                        } else {
                          // Sélectionner la première option par défaut
                          setSelectedServices(prev => ({ ...prev, [s.id]: s.options[0].id }));
                        }
                      }} style={{ background: isSelected ? "#FEE2E2" : color, color: isSelected ? "#DC2626" : "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                        {isSelected ? "✕ Retirer" : "+ Ajouter"}
                      </button>
                    </div>
                    {/* Sélection de l'option si service sélectionné */}
                    {isSelected && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {s.options.map(opt => (
                          <button key={opt.id} onClick={() => setSelectedServices(prev => ({ ...prev, [s.id]: opt.id }))}
                            style={{ border: `1.5px solid ${selectedOptId === opt.id ? color : "#E5E7EB"}`, background: selectedOptId === opt.id ? color + "11" : "#F7F8FC", borderRadius: 8, padding: "10px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontWeight: 600, fontSize: 14 }}>{opt.label}</span>
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <span style={{ fontWeight: 800, color }}>{opt.priceType === "m2" ? `${fmt(opt.price)}/m²` : opt.priceType === "hour" ? `${fmt(opt.price)}/h` : fmt(opt.price)}</span>
                              <span style={{ fontSize: 12, color: "#9CA3AF" }}>({fmtDurationTotal(Number(opt.duration)||60)})</span>
                              {selectedOptId === opt.id && <span style={{ background: color, color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>✓</span>}
                            </div>
                          </button>
                        ))}
                        {/* Champ surface si m² */}
                        {selectedOpt?.priceType === "m2" && (
                          <div style={{ background: "#EEF3FF", border: `1.5px solid ${color}`, borderRadius: 10, padding: "12px 14px", marginTop: 4 }}>
                            <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>📐 Surface pour {s.name} ?</label>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <input type="number" min="1" placeholder="ex: 30" value={surfaces[s.id] || ""}
                                onChange={e => setSurfaces(prev => ({ ...prev, [s.id]: e.target.value }))}
                                style={{ border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "8px 12px", fontSize: 15, width: 90, outline: "none" }} />
                              <span style={{ color: "#6B7280" }}>m²</span>
                              {surfaces[s.id] && parseFloat(surfaces[s.id]) > 0 && (
                                <span style={{ fontWeight: 800, color }}>= {fmt(Number(selectedOpt.price) * parseFloat(surfaces[s.id]))}</span>
                              )}
                            </div>
                          </div>
                        )}
                        {/* Champ heures si prix/heure */}
                        {selectedOpt?.priceType === "hour" && (
                          <div style={{ background: "#EEF3FF", border: `1.5px solid ${color}`, borderRadius: 10, padding: "12px 14px", marginTop: 4 }}>
                            <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>⏱️ Combien d'heures pour {s.name} ?</label>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <input type="number" min="0.5" step="0.5" placeholder="ex: 2" value={surfaces[s.id] || ""}
                                onChange={e => setSurfaces(prev => ({ ...prev, [s.id]: e.target.value }))}
                                style={{ border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "8px 12px", fontSize: 15, width: 90, outline: "none" }} />
                              <span style={{ color: "#6B7280" }}>heure(s)</span>
                              {surfaces[s.id] && parseFloat(surfaces[s.id]) > 0 && (
                                <span style={{ fontWeight: 800, color }}>= {fmt(Number(selectedOpt.price) * parseFloat(surfaces[s.id]))}</span>
                              )}
                            </div>
                            <p style={{ fontSize: 11, color: "#6B7280", margin: "6px 0 0" }}>
                              {parseFloat(surfaces[s.id]) || 0}h × {fmt(selectedOpt.price)}/h = <strong style={{ color }}>{fmt(Number(selectedOpt.price) * (parseFloat(surfaces[s.id]) || 0))}</strong>
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Récap sélection */}
            {Object.keys(selectedServices).length > 0 && (
              <div style={{ marginTop: 16, background: "#EEF3FF", border: `1.5px solid ${color}`, borderRadius: 12, padding: "14px 18px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 8 }}>📋 Récapitulatif de votre sélection</div>
                {Object.entries(selectedServices).map(([svcId, optId]) => {
                  const svc = services.find(s => s.id === svcId);
                  const opt = svc?.options.find(o => o.id === optId);
                  const svcPrice = ["m2","hour"].includes(opt?.priceType) ? Number(opt.price) * (parseFloat(surfaces[svcId]) || 0) : Number(opt?.price || 0);
                  return (
                    <div key={svcId} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}>
                      <span>{svc?.icon} {svc?.name} — {opt?.label}</span>
                      <span style={{ fontWeight: 700, color }}>{fmt(svcPrice)}</span>
                    </div>
                  );
                })}
                <div style={{ borderTop: "1px solid #D1D5DB", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                  <span style={{ fontWeight: 700 }}>⏱️ Durée totale</span>
                  <span style={{ fontWeight: 700, color }}>{fmtDurationTotal(totalDuration)}</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* STEP 1 — Upsells */}
        {step === 1 && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 4px" }}>✨ Services complémentaires</h2>
            <p style={{ color: "#6B7280", fontSize: 14, margin: "0 0 18px" }}>Ajoutez des options pour en profiter davantage</p>
            {upsells.filter(u => !u.services || u.services.length === 0 || u.services.some(sid => selectedServices[sid])).length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px", color: "#9CA3AF", background: "#F7F8FC", borderRadius: 12 }}>
                <p>Aucun service complémentaire disponible.</p>
                <p style={{ fontSize: 12 }}>Vous pouvez continuer directement.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {upsells.filter(u => !u.services || u.services.length === 0 || u.services.some(sid => selectedServices[sid])).map(u => {
                  const qty = activeUpsells[u.id] || 0;
                  const active = qty > 0;
                  const hasQty = !!u.priceUnit;
                  return (
                    <div key={u.id} style={{ border: `2px solid ${active ? "#059669" : "#E5E7EB"}`, background: active ? "#F0FDF4" : "#fff", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 22 }}>{u.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                        <div style={{ fontSize: 13, color: "#059669", fontWeight: 700 }}>
                          {hasQty ? `${fmt(u.price)} / ${u.priceUnit}` : `+${fmt(u.price)}`}
                          {active && hasQty && <span style={{ color, marginLeft: 8 }}>= +{fmt(Number(u.price) * qty)}</span>}
                        </div>
                      </div>
                      {hasQty ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <button onClick={() => setActiveUpsells(p => ({ ...p, [u.id]: Math.max(0, (p[u.id] || 0) - 1) }))} style={{ width: 30, height: 30, borderRadius: "50%", border: "1.5px solid #E5E7EB", background: "#fff", fontSize: 16, cursor: "pointer", fontWeight: 700 }}>−</button>
                          <span style={{ fontSize: 15, fontWeight: 800, minWidth: 20, textAlign: "center", color: active ? "#059669" : "#9CA3AF" }}>{qty}</span>
                          <button onClick={() => setActiveUpsells(p => ({ ...p, [u.id]: (p[u.id] || 0) + 1 }))} style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: color, fontSize: 16, cursor: "pointer", fontWeight: 700, color: "#fff" }}>+</button>
                        </div>
                      ) : (
                        <button onClick={() => setActiveUpsells(p => ({ ...p, [u.id]: p[u.id] ? 0 : 1 }))} style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 20, border: "none", background: active ? "#DCFCE7" : color + "11", color: active ? "#059669" : color, cursor: "pointer" }}>
                          {active ? "✓ Ajouté" : "+ Ajouter"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* STEP 2 — Coordonnées */}
        {step === 2 && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 4px" }}>Vos coordonnées</h2>
            <p style={{ color: "#6B7280", fontSize: 14, margin: "0 0 18px" }}>Nous confirmerons le rendez-vous par email</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[
                { id: "prenom", label: "Prénom", type: "text", ph: "Marie" },
                { id: "nom", label: "Nom", type: "text", ph: "Dupont" },
                { id: "email", label: "Email", type: "email", ph: "marie@exemple.fr", full: true },
                { id: "telephone", label: "Téléphone", type: "tel", ph: "06 12 34 56 78" },
                { id: "adresse", label: "Adresse d'intervention", type: "text", ph: "12 rue des Fleurs, Nice", full: true },
              ].map(f => (
                <div key={f.id} style={{ gridColumn: f.full ? "1 / -1" : undefined, display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>{f.label}</label>
                  <input type={f.type} style={inputStyle} placeholder={f.ph}
                    value={form[f.id] || ""} onChange={e => setForm(p => ({ ...p, [f.id]: e.target.value }))} />
                </div>
              ))}

              {/* Smart Calendar */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Date souhaitée</label>
                <MiniCalendar
                  availability={availability}
                  selected={form.date}
                  onSelect={d => setForm(p => ({ ...p, date: d, timeSlot: null }))}
                  color={color}
                />
              </div>

              {/* Time slot picker */}
              {form.date && (() => {
                const dateObj = new Date(form.date);
                const daySched = availability?.daySchedules?.[dateObj.getDay()];
                const duration = totalDuration || 60;
                const slots = daySched ? generateSlots(daySched.start, daySched.end, duration) : [];
                return (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
                      Créneau horaire
                      <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 500, marginLeft: 8 }}>
                        Durée estimée : {fmtDuration(duration)}
                      </span>
                    </label>
                    {slots.length === 0 ? (
                      <div style={{ background: "#FEF2F2", border: "1.5px solid #FCA5A5", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#DC2626" }}>
                        Aucun créneau disponible pour cette date. Veuillez choisir un autre jour.
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 8 }}>
                        {slots.map(slot => {
                          const isSelected = form.timeSlot === slot.start;
                          // Vérifier si ce créneau chevauche une réservation existante
                          const [sh, sm] = slot.start.split(":").map(Number);
                          const [eh, em] = slot.end.split(":").map(Number);
                          const slotStart = sh * 60 + sm;
                          const slotEnd = eh * 60 + em;
                          const isBooked = bookedSlots.some(b => slotStart < b.end && slotEnd > b.start);
                          return (
                            <button key={slot.start}
                              onClick={() => !isBooked && setForm(p => ({ ...p, timeSlot: slot.start, timeSlotEnd: slot.end }))}
                              disabled={isBooked}
                              title={isBooked ? "Créneau déjà réservé" : ""}
                              style={{
                                border: `2px solid ${isBooked ? "#E5E7EB" : isSelected ? color : "#E5E7EB"}`,
                                background: isBooked ? "#F3F4F6" : isSelected ? color : "#fff",
                                color: isBooked ? "#D1D5DB" : isSelected ? "#fff" : "#1A1F36",
                                borderRadius: 10, padding: "10px 8px",
                                cursor: isBooked ? "not-allowed" : "pointer",
                                fontWeight: isSelected ? 800 : 600, fontSize: 13,
                                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                                transition: "all 0.15s",
                                position: "relative",
                              }}>
                              <span style={{ fontSize: 15, textDecoration: isBooked ? "line-through" : "none" }}>{slot.start}</span>
                              <span style={{ fontSize: 11, opacity: isBooked ? 0.5 : 0.75 }}>
                                {isBooked ? "Réservé" : `→ ${slot.end}`}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Infos complémentaires (optionnel)</label>
                <textarea style={{ ...inputStyle, height: 70, resize: "vertical" }} placeholder="Accès, étage, particularités…" rows={3}
                  value={form.message || ""} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} />
              </div>
            </div>
          </>
        )}

        {/* STEP 3 — Récapitulatif */}
        {step === 3 && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 16px" }}>Récapitulatif</h2>
            <div style={recapCard}>
              {Object.entries(selectedServices).map(([svcId, optId]) => {
                const svc = services.find(s => s.id === svcId);
                const opt = svc?.options.find(o => o.id === optId);
                const price = ["m2","hour"].includes(opt?.priceType) ? Number(opt.price) * (parseFloat(surfaces[svcId]) || 0) : Number(opt?.price || 0);
                return (
                  <Row key={svcId} label={`${svc?.icon} ${svc?.name} — ${opt?.label}${opt?.priceType === "m2" ? ` (${surfaces[svcId]}m²)` : opt?.priceType === "hour" ? ` (${surfaces[svcId]}h)` : ""}`} val={fmt(price)} />
                );
              })}
              {upsells.filter(u => (activeUpsells[u.id] || 0) > 0).map(u => (
                <Row key={u.id} label={`${u.icon} ${u.name}${u.priceUnit ? ` × ${activeUpsells[u.id]}` : ""}`} val={`+${fmt(Number(u.price) * (activeUpsells[u.id] || 1))}`} />
              ))}
              <div style={{ height: 1, background: "#E5E7EB", margin: "8px 0" }} />
              <Row label="⏱️ Durée totale" val={`${Math.floor(totalDuration/60)}h${totalDuration%60>0?String(totalDuration%60).padStart(2,"0")+"min":""}`} />
              <Row label="Total estimé" val={fmt(subtotal)} bold />
            </div>
            <div style={recapCard}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 10px" }}>Détails</p>
              <Row label="Client" val={`${form.prenom} ${form.nom}`} />
              <Row label="Date" val={form.date} />
              {form.timeSlot && <Row label="Créneau" val={`${form.timeSlot} → ${form.timeSlotEnd} (${fmtDuration(Number(option?.duration))})`} />}
              <Row label="Adresse" val={form.adresse} />
              {form.message && <Row label="Note" val={form.message} />}
            </div>

            {/* Payment mode choice */}
            {!requestDone && (
              <>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1A1F36", margin: "0 0 10px" }}>
                  Comment souhaitez-vous confirmer votre réservation ?
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>

                  {/* Option acompte */}
                  <button onClick={() => setPayMode("acompte")}
                    style={{
                      border: `2px solid ${payMode === "acompte" ? color : "#E5E7EB"}`,
                      background: payMode === "acompte" ? color + "0D" : "#fff",
                      borderRadius: 12, padding: "16px", cursor: "pointer", textAlign: "left",
                    }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <span style={{ fontSize: 20 }}>🔒</span>
                      <span style={{ fontWeight: 800, fontSize: 14, color: "#1A1F36" }}>
                        Payer un acompte — {fmt(acompte)}
                      </span>
                      {payMode === "acompte" && <span style={{ marginLeft: "auto", background: color, color: "#fff", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>✓</span>}
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>
                      Votre créneau est <strong>bloqué immédiatement</strong>. Paiement sécurisé via Stripe.<br />
                      Solde restant ({fmt(subtotal - acompte)}) réglé le jour de l'intervention.
                    </p>
                  </button>

                  {/* Option sans acompte */}
                  <button onClick={() => setPayMode("sans")}
                    style={{
                      border: `2px solid ${payMode === "sans" ? "#059669" : "#E5E7EB"}`,
                      background: payMode === "sans" ? "#F0FDF4" : "#fff",
                      borderRadius: 12, padding: "16px", cursor: "pointer", textAlign: "left",
                    }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <span style={{ fontSize: 20 }}>📋</span>
                      <span style={{ fontWeight: 800, fontSize: 14, color: "#1A1F36" }}>
                        Demande sans acompte
                      </span>
                      {payMode === "sans" && <span style={{ marginLeft: "auto", background: "#059669", color: "#fff", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>✓</span>}
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>
                      Votre demande est envoyée <strong>sans paiement</strong>.<br />
                      Le prestataire vous contactera pour confirmer le rendez-vous.
                    </p>
                  </button>
                </div>

                {/* Action buttons */}
                {payMode === "acompte" && (
                  <>
                    {payError && (
                      <div style={{ background: "#FEF2F2", border: "1.5px solid #FCA5A5", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#DC2626", marginBottom: 14 }}>
                        ⚠️ {payError}
                      </div>
                    )}
                    <button onClick={handlePay} disabled={paying}
                      style={{ width: "100%", background: paying ? "#9CA3AF" : color, color: "#fff", border: "none", borderRadius: 10, padding: 16, fontSize: 15, fontWeight: 800, cursor: paying ? "not-allowed" : "pointer" }}>
                      {paying ? "⏳ Redirection vers Stripe..." : `Payer l'acompte — ${fmt(acompte)}`}
                    </button>
                    <p style={{ textAlign: "center", fontSize: 12, color: "#9CA3AF", marginTop: 10 }}>🔐 Paiement sécurisé via Stripe · SSL</p>
                  </>
                )}

                {payMode === "sans" && (
                  <button onClick={handleRequestOnly}
                    style={{ width: "100%", background: "#25D366", color: "#fff", border: "none", borderRadius: 10, padding: 16, fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
                    📲 Envoyer ma réservation sur WhatsApp →
                  </button>
                )}
              </>
            )}

            {/* Confirmation sans acompte */}
            {requestDone && (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📬</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 8px" }}>Demande envoyée !</h3>
                <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7, margin: "0 0 16px" }}>
                  Votre demande a bien été reçue, <strong>{form.prenom}</strong>.<br />
                  Nous vous contacterons sous 24h pour confirmer votre rendez-vous du <strong>{form.date}</strong>.
                </p>
                <div style={{ background: "#FFF7ED", border: "1.5px solid #F59E0B", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#92400E", marginBottom: 16 }}>
                  ⏳ En attente de confirmation — votre créneau n'est pas encore bloqué
                </div>

                {/* WhatsApp button */}
                <button onClick={() => {
                  const msg = encodeURIComponent(
`🗓 *Nouvelle réservation CleanNet*

👤 *Client :* ${form.prenom} ${form.nom}
📞 *Téléphone :* ${form.telephone}
📧 *Email :* ${form.email}
📍 *Adresse :* ${form.adresse}

🧹 *Service :* ${service.name} — ${option.label}
📅 *Date :* ${form.date}
🕐 *Créneau :* ${form.timeSlot} → ${form.timeSlotEnd}
💶 *Total estimé :* ${fmt(subtotal)}
💳 *Mode :* Sans acompte
${form.message ? `📝 *Note :* ${form.message}` : ""}

_Envoyé depuis le site de réservation CleanNet_`
                  );
                  window.open(`https://wa.me/33612922048?text=${msg}`, "_blank");
                }}
                  style={{ width: "100%", background: "#25D366", color: "#fff", border: "none", borderRadius: 10, padding: "14px", fontSize: 15, fontWeight: 800, cursor: "pointer", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span style={{ fontSize: 20 }}>📲</span> Envoyer sur WhatsApp
                </button>

                <button onClick={() => { setStep(0); setService(null); setOption(null); setActiveUpsells([]); setForm({}); setPayMode(null); setRequestDone(false); }}
                  style={{ background: color, color: "#fff", border: "none", borderRadius: 8, padding: "11px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  Nouvelle réservation
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Nav */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 24px 24px", borderTop: "1px solid #E5E7EB", gap: 12, marginTop: 8 }}>
        {step > 0
          ? <button onClick={() => setStep(s => s - 1)} style={backBtn}>← Retour</button>
          : <div />
        }
        {step < 3 && (
          <button onClick={() => canNext() && setStep(s => s + 1)} disabled={!canNext()}
            style={{ ...nextBtn, background: canNext() ? color : "#E5E7EB", color: canNext() ? "#fff" : "#9CA3AF", cursor: canNext() ? "pointer" : "not-allowed" }}>
            {step === 2 ? "Voir le récapitulatif →" : "Continuer →"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── RESERVATIONS DASHBOARD ───────────────────────────────────────────────────
const STATUTS = [
  { id: "attente",   label: "En attente",  color: "#F59E0B", bg: "#FFF7ED" },
  { id: "confirme",  label: "Confirmé",    color: "#0057FF", bg: "#EEF3FF" },
  { id: "en_cours",  label: "En cours",    color: "#7C3AED", bg: "#F5F3FF" },
  { id: "termine",   label: "Terminé",     color: "#059669", bg: "#F0FDF4" },
  { id: "annule",    label: "Annulé",      color: "#DC2626", bg: "#FEF2F2" },
];

const EMPTY_FORM = {
  prenom: "", nom: "", email: "", telephone: "", adresse: "",
  service: "", option: "", date: "", creneau: "",
  total: "", acompte: "", statut: "attente", note: "",
};

function ReservationsDashboard({ color, services }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [detailId, setDetailId] = useState(null);

  // Load from Supabase
  const fetchReservations = async () => {
    try {
      const r = await fetch(`/api/reservations?t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const data = await r.json();
      if (Array.isArray(data)) setReservations(data);
    } catch (_) {
      setReservations(loadReservations());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReservations(); }, []);

  const saveLocal = (list) => { setReservations(list); saveReservations(list); };

  const filtered = reservations
    .filter(r => filterStatut === "all" || r.statut === filterStatut)
    .filter(r => !search || `${r.prenom} ${r.nom} ${r.service} ${r.date}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt));

  const stats = {
    total: reservations.length,
    attente: reservations.filter(r => r.statut === "attente").length,
    confirme: reservations.filter(r => r.statut === "confirme").length,
    termine: reservations.filter(r => r.statut === "termine").length,
    ca: reservations.filter(r => r.statut !== "annule").reduce((s, r) => s + (parseFloat(r.total) || 0), 0),
  };

  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); };
  const openEdit = (r) => { setForm({ ...r }); setEditId(r.id); setShowForm(true); setDetailId(null); };

  const handleSave = async () => {
    if (!form.prenom || !form.nom || !form.date) return;
    try {
      if (editId) {
        await fetch("/api/reservations", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, id: editId }),
        });
      } else {
        await fetch("/api/reservations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, source: "manuel" }),
        });
      }
      await fetchReservations();
    } catch (_) {
      // Fallback localStorage
      if (editId) {
        saveLocal(reservations.map(r => r.id === editId ? { ...form, id: editId } : r));
      } else {
        saveLocal([{ ...form, id: uid(), createdAt: new Date().toISOString() }, ...reservations]);
      }
    }
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer cette réservation ?")) return;
    try {
      await fetch("/api/reservations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await fetchReservations();
    } catch (_) {
      saveLocal(reservations.filter(r => r.id !== id));
    }
    setDetailId(null);
  };

  const updateStatut = async (id, statut) => {
    try {
      await fetch("/api/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, statut }),
      });
      setReservations(prev => prev.map(r => r.id === id ? { ...r, statut } : r));
    } catch (_) {
      saveLocal(reservations.map(r => r.id === id ? { ...r, statut } : r));
    }
  };

  const updateNote = async (id, note) => {
    try {
      await fetch("/api/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, note }),
      });
      setReservations(prev => prev.map(r => r.id === id ? { ...r, note } : r));
    } catch (_) {
      saveLocal(reservations.map(r => r.id === id ? { ...r, note } : r));
    }
  };

  const getStatut = (id) => STATUTS.find(s => s.id === id) || STATUTS[0];
  const detail = reservations.find(r => r.id === detailId);

  return (
    <div>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Total", val: stats.total, icon: "📋", c: "#1A1F36" },
          { label: "En attente", val: stats.attente, icon: "⏳", c: "#F59E0B" },
          { label: "Confirmés", val: stats.confirme, icon: "✅", c: color },
          { label: "Terminés", val: stats.termine, icon: "🏁", c: "#059669" },
          { label: "CA estimé", val: `${stats.ca.toFixed(0)}€`, icon: "💶", c: "#7C3AED" },
        ].map(s => (
          <div key={s.label} style={{ background: "#F7F8FC", border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.c }}>{s.val}</div>
            <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Rechercher…" style={{ ...inputStyle, flex: 1, minWidth: 160 }} />
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
          style={{ ...inputStyle, width: "auto" }}>
          <option value="all">Tous les statuts</option>
          {STATUTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <button onClick={openAdd}
          style={{ background: color, color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
          + Ajouter
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#9CA3AF" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
          <p style={{ margin: 0, fontSize: 14 }}>Chargement des réservations…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", background: "#F7F8FC", borderRadius: 12, color: "#9CA3AF" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
          <p style={{ margin: 0, fontSize: 14 }}>
            {reservations.length === 0 ? "Aucune réservation pour l'instant.\nLes réservations payées apparaîtront ici automatiquement." : "Aucune réservation ne correspond à votre recherche."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(r => {
            const st = getStatut(r.statut);
            return (
              <div key={r.id}
                style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "12px 16px", background: "#fff", cursor: "pointer", transition: "box-shadow 0.15s" }}
                onClick={() => setDetailId(r.id)}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  {/* Statut badge */}
                  <span style={{ background: st.bg, color: st.color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>
                    {st.label}
                  </span>
                  {/* Client */}
                  <span style={{ fontWeight: 700, fontSize: 14, color: "#1A1F36" }}>{r.prenom} {r.nom}</span>
                  {/* Service */}
                  <span style={{ fontSize: 13, color: "#6B7280" }}>{r.service}</span>
                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
                    {/* Date */}
                    <span style={{ fontSize: 13, color: "#6B7280", whiteSpace: "nowrap" }}>📅 {r.date}</span>
                    {/* Total */}
                    {r.total && <span style={{ fontSize: 13, fontWeight: 700, color: color }}>{r.total}€</span>}
                  </div>
                </div>
                {r.creneau && (
                  <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>🕐 {r.creneau}</div>
                )}
                {r.note && (
                  <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4, fontStyle: "italic" }}>📝 {r.note}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {detail && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setDetailId(null)}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontWeight: 800, fontSize: 17 }}>{detail.prenom} {detail.nom}</h3>
              <button onClick={() => setDetailId(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9CA3AF" }}>✕</button>
            </div>
            <div style={{ padding: "20px 24px" }}>
              {/* Statut selector */}
              <p style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", margin: "0 0 8px" }}>Statut</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
                {STATUTS.map(s => (
                  <button key={s.id} onClick={() => updateStatut(detail.id, s.id)}
                    style={{ border: `2px solid ${detail.statut === s.id ? s.color : "#E5E7EB"}`, background: detail.statut === s.id ? s.bg : "#fff", color: detail.statut === s.id ? s.color : "#6B7280", borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Details */}
              {[
                { label: "Service", val: `${detail.service}${detail.option ? ` — ${detail.option}` : ""}` },
                { label: "Date", val: detail.date },
                { label: "Créneau", val: detail.creneau },
                { label: "Adresse", val: detail.adresse },
                { label: "Téléphone", val: detail.telephone },
                { label: "Email", val: detail.email },
                { label: "Total estimé", val: detail.total ? `${detail.total} €` : null },
                { label: "Acompte", val: detail.acompte ? `${detail.acompte} €` : null },
              ].filter(f => f.val).map(f => (
                <div key={f.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #F3F4F6", fontSize: 14 }}>
                  <span style={{ color: "#6B7280" }}>{f.label}</span>
                  <span style={{ fontWeight: 600, color: "#1A1F36", textAlign: "right", maxWidth: "60%" }}>{f.val}</span>
                </div>
              ))}

              {/* Note */}
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>📝 Note interne</label>
                <textarea
                  value={detail.note || ""}
                  onChange={e => updateNote(detail.id, e.target.value)}
                  placeholder="Ajouter une note..."
                  style={{ ...inputStyle, height: 80, resize: "vertical" }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button onClick={() => openEdit(detail)}
                  style={{ flex: 1, background: color, color: "#fff", border: "none", borderRadius: 8, padding: "10px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  ✏️ Modifier
                </button>
                <button onClick={() => handleDelete(detail.id)}
                  style={{ background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: 8, padding: "10px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontWeight: 800, fontSize: 17 }}>{editId ? "Modifier la réservation" : "Nouvelle réservation"}</h3>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9CA3AF" }}>✕</button>
            </div>
            <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { id: "prenom", label: "Prénom *", full: false },
                { id: "nom", label: "Nom *", full: false },
                { id: "email", label: "Email", full: false },
                { id: "telephone", label: "Téléphone", full: false },
                { id: "adresse", label: "Adresse", full: true },
                { id: "service", label: "Service", full: false },
                { id: "option", label: "Formule", full: false },
                { id: "date", label: "Date *", type: "date", full: false },
                { id: "creneau", label: "Créneau", full: false },
                { id: "total", label: "Total (€)", type: "number", full: false },
                { id: "acompte", label: "Acompte (€)", type: "number", full: false },
              ].map(f => (
                <div key={f.id} style={{ gridColumn: f.full ? "1 / -1" : undefined, display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{f.label}</label>
                  <input type={f.type || "text"} value={form[f.id] || ""} onChange={e => setForm(p => ({ ...p, [f.id]: e.target.value }))}
                    style={{ ...inputStyle, fontSize: 13 }} />
                </div>
              ))}
              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Statut</label>
                <select value={form.statut} onChange={e => setForm(p => ({ ...p, statut: e.target.value }))} style={inputStyle}>
                  {STATUTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Note interne</label>
                <textarea value={form.note || ""} onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                  style={{ ...inputStyle, height: 70, resize: "vertical" }} placeholder="Note visible uniquement par vous…" />
              </div>
              <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
                <button onClick={handleSave}
                  style={{ flex: 1, background: color, color: "#fff", border: "none", borderRadius: 8, padding: 12, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  {editId ? "Enregistrer les modifications" : "Ajouter la réservation"}
                </button>
                <button onClick={() => setShowForm(false)}
                  style={{ background: "#F3F4F6", border: "none", borderRadius: 8, padding: "12px 16px", fontWeight: 600, cursor: "pointer", color: "#374151" }}>
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PIPELINE COMPONENT ───────────────────────────────────────────────────────
function PipelineDashboard({ color }) {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState("all");

  const fetchDeals = async () => {
    try {
      const r = await fetch(`/api/pipeline?t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const data = await r.json();
      if (Array.isArray(data)) setDeals(data);
      else setDeals(loadPipeline());
    } catch (_) {
      setDeals(loadPipeline());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDeals(); }, []);

  const activeStages = PIPELINE_STAGES.filter(s => s.id !== "perdu" && s.id !== "gagne");

  const moveDeal = async (id, direction) => {
    const deal = deals.find(d => d.id === id);
    if (!deal) return;
    let newStage = deal.stage;
    if (direction === "perdu") newStage = "perdu";
    else if (direction === "gagne") newStage = "gagne";
    else {
      const idx = activeStages.findIndex(s => s.id === deal.stage);
      if (direction === "next") newStage = idx === activeStages.length - 1 ? "gagne" : activeStages[idx + 1].id;
      if (direction === "back" && idx > 0) newStage = activeStages[idx - 1].id;
    }
    setDeals(prev => prev.map(d => d.id === id ? { ...d, stage: newStage } : d));
    try {
      await fetch("/api/pipeline", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, stage: newStage }),
      });
    } catch (_) { savePipeline(deals.map(d => d.id === id ? { ...d, stage: newStage } : d)); }
  };

  const saveDeal = async (deal) => {
    try {
      if (deal.id && deals.find(d => d.id === deal.id)) {
        await fetch("/api/pipeline", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(deal),
        });
      } else {
        await fetch("/api/pipeline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...deal, id: deal.id || uid() }),
        });
      }
      await fetchDeals();
    } catch (_) {
      const list = deals.find(d => d.id === deal.id)
        ? deals.map(d => d.id === deal.id ? deal : d)
        : [...deals, { ...deal, id: uid() }];
      setDeals(list); savePipeline(list);
    }
    setModal(null);
  };

  const deleteDeal = async (id) => {
    setDeals(prev => prev.filter(d => d.id !== id));
    try {
      await fetch("/api/pipeline", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch (_) { savePipeline(deals.filter(d => d.id !== id)); }
  };

  const filtered = deals.filter(d => {
    const matchStage = filterStage === "all" || d.stage === filterStage;
    const matchSearch = !search || `${d.client} ${d.service}`.toLowerCase().includes(search.toLowerCase());
    return matchStage && matchSearch;
  });

  const byStage = PIPELINE_STAGES.reduce((acc, s) => {
    acc[s.id] = filtered.filter(d => d.stage === s.id);
    return acc;
  }, {});

  const fmtM = n => (Number(n) || 0).toLocaleString("fr-FR") + " €";
  const isUrgent = d => { if (!d.dateRelance) return false; const diff = (new Date(d.dateRelance) - new Date()) / 86400000; return diff <= 2; };

  const totalPipeline = deals.filter(d => !["gagne","perdu"].includes(d.stage)).reduce((s,d) => s + (Number(d.montant)||0), 0);
  const totalGagne = deals.filter(d => d.stage === "gagne").reduce((s,d) => s + (Number(d.montant)||0), 0);
  const urgents = deals.filter(d => isUrgent(d) && !["gagne","perdu"].includes(d.stage));

  return (
    <div>
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#9CA3AF" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
          <p style={{ margin: 0 }}>Chargement du pipeline…</p>
        </div>
      ) : (
      <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px,1fr))", gap: 10, marginBottom: 16 }}>
        {[
          { label: "En cours", val: deals.filter(d => !["gagne","perdu"].includes(d.stage)).length, icon: "📋", c: color },
          { label: "Pipeline", val: fmtM(totalPipeline), icon: "💰", c: "#f59e0b" },
          { label: "Signés", val: fmtM(totalGagne), icon: "🏆", c: "#22c55e" },
          { label: "Relances", val: urgents.length, icon: "🔔", c: urgents.length > 0 ? "#ef4444" : "#9CA3AF" },
        ].map(k => (
          <div key={k.label} style={{ background: "#F7F8FC", border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{k.icon}</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: k.c }}>{k.val}</div>
            <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Rechercher…" style={{ ...inputStyle, flex: 1, minWidth: 140 }} />
        <button onClick={() => setModal({ client:"", service:"", montant:"", stage:"prospect", dateCreation: new Date().toISOString().slice(0,10), dateRelance:"", notes:"", priorite:"normale" })}
          style={{ background: color, color: "#fff", border: "none", borderRadius: 8, padding: "9px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
          + Nouveau dossier
        </button>
      </div>

      {/* Kanban scroll */}
      <div style={{ overflowX: "auto", paddingBottom: 8 }}>
        <div style={{ display: "flex", gap: 10, minWidth: 800 }}>
          {PIPELINE_STAGES.filter(s => s.id !== "perdu").map(stage => (
            <div key={stage.id} style={{ flex: 1, minWidth: 160 }}>
              {/* Column header */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: stage.color, flexShrink: 0 }} />
                <span style={{ fontWeight: 700, fontSize: 12, color: "#374151" }}>{stage.icon} {stage.label}</span>
                <span style={{ marginLeft: "auto", background: "#F3F4F6", color: "#9CA3AF", borderRadius: 20, padding: "1px 7px", fontSize: 11 }}>
                  {byStage[stage.id]?.length || 0}
                </span>
              </div>
              {/* Cards */}
              <div style={{ background: "#F7F8FC", borderRadius: 8, padding: "6px", minHeight: 80, border: "1px solid #E5E7EB" }}>
                {(byStage[stage.id] || []).map(deal => {
                  const urgent = isUrgent(deal);
                  const idx = activeStages.findIndex(s => s.id === deal.stage);
                  return (
                    <div key={deal.id} style={{ background: "#fff", border: `1.5px solid ${urgent ? "#FCA5A5" : "#E5E7EB"}`, borderLeft: `3px solid ${stage.color}`, borderRadius: 8, padding: "10px 12px", marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 6, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: "#1A1F36" }}>{deal.client}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#059669", whiteSpace: "nowrap" }}>{fmtM(deal.montant)}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 6 }}>{deal.service}</div>
                      {deal.notes && <div style={{ fontSize: 11, color: "#9CA3AF", fontStyle: "italic", marginBottom: 6 }}>💬 {deal.notes}</div>}
                      {deal.priorite === "haute" && <span style={{ background: "#F5F3FF", color: "#7C3AED", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, marginRight: 4 }}>⚡ Haute</span>}
                      {deal.dateRelance && <span style={{ background: urgent ? "#FEF2F2" : "#EFF6FF", color: urgent ? "#DC2626" : "#2563EB", fontSize: 10, padding: "2px 6px", borderRadius: 4 }}>
                        {urgent ? "🔔 Urgent" : `📅 ${deal.dateRelance}`}
                      </span>}
                      {/* Actions */}
                      <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
                        {idx > 0 && <button onClick={() => moveDeal(deal.id, "back")} style={pipeBtn("#F3F4F6","#374151")}>←</button>}
                        {deal.stage !== "gagne" && deal.stage !== "perdu" && <button onClick={() => moveDeal(deal.id, "next")} style={pipeBtn(color+"22", color)}>→</button>}
                        <button onClick={() => setModal(deal)} style={pipeBtn("#F3F4F6","#374151")}>✏️</button>
                        <button onClick={() => moveDeal(deal.id, "perdu")} style={pipeBtn("#FEE2E2","#DC2626")}>✗</button>
                        <button onClick={() => deleteDeal(deal.id)} style={{ ...pipeBtn("#F3F4F6","#9CA3AF"), marginLeft: "auto" }}>🗑</button>
                      </div>
                    </div>
                  );
                })}
                {(byStage[stage.id] || []).length === 0 && (
                  <div style={{ color: "#D1D5DB", fontSize: 12, textAlign: "center", padding: "16px 0" }}>Aucun dossier</div>
                )}
              </div>
              {byStage[stage.id]?.length > 0 && stage.id !== "gagne" && (
                <div style={{ fontSize: 11, color: "#9CA3AF", textAlign: "right", marginTop: 4 }}>
                  {fmtM(byStage[stage.id].reduce((s,d) => s + (Number(d.montant)||0), 0))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Perdus */}
        {byStage["perdu"]?.length > 0 && (
          <div style={{ marginTop: 14, background: "#FEF2F2", border: "1.5px solid #FCA5A5", borderRadius: 8, padding: 12 }}>
            <div style={{ color: "#DC2626", fontWeight: 700, marginBottom: 8, fontSize: 13 }}>✗ Perdus ({byStage["perdu"].length})</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {byStage["perdu"].map(d => (
                <div key={d.id} style={{ background: "#fff", border: "1px solid #FCA5A5", borderRadius: 6, padding: "6px 10px", fontSize: 12 }}>
                  <span style={{ fontWeight: 600 }}>{d.client}</span>
                  <span style={{ color: "#9CA3AF", marginLeft: 6 }}>{fmtM(d.montant)}</span>
                  <button onClick={() => deleteDeal(d.id)} style={{ ...pipeBtn("#F3F4F6","#9CA3AF"), marginLeft: 8, padding: "1px 6px" }}>🗑</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      </>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 440, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, fontWeight: 800, fontSize: 17 }}>{modal.id && deals.find(d=>d.id===modal.id) ? "Modifier" : "Nouveau dossier"}</h3>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#9CA3AF" }}>✕</button>
            </div>
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { id: "client", label: "Client / Entreprise" },
                { id: "service", label: "Service" },
                { id: "montant", label: "Montant estimé (€)", type: "number" },
                { id: "date_creation", label: "Date création", type: "date" },
                { id: "date_relance", label: "Date relance", type: "date" },
              ].map(f => (
                <div key={f.id}>
                  <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>{f.label}</label>
                  <input type={f.type || "text"} value={modal[f.id] || ""} onChange={e => setModal(p => ({...p, [f.id]: e.target.value}))}
                    style={inputStyle} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>Étape</label>
                <select value={modal.stage || "prospect"} onChange={e => setModal(p => ({...p, stage: e.target.value}))} style={inputStyle}>
                  {PIPELINE_STAGES.map(s => <option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>Priorité</label>
                <select value={modal.priorite || "normale"} onChange={e => setModal(p => ({...p, priorite: e.target.value}))} style={inputStyle}>
                  <option value="normale">Normale</option>
                  <option value="haute">Haute ⚡</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>Notes</label>
                <textarea value={modal.notes || ""} onChange={e => setModal(p => ({...p, notes: e.target.value}))}
                  style={{ ...inputStyle, height: 70, resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button onClick={() => saveDeal({ ...modal, id: modal.id || uid(), montant: Number(modal.montant)||0 })}
                  style={{ flex: 1, background: color, color: "#fff", border: "none", borderRadius: 8, padding: 12, fontWeight: 700, cursor: "pointer" }}>
                  Enregistrer
                </button>
                <button onClick={() => setModal(null)}
                  style={{ flex: 1, background: "#F3F4F6", border: "none", borderRadius: 8, padding: 12, fontWeight: 600, cursor: "pointer", color: "#374151" }}>
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const pipeBtn = (bg, color) => ({
  background: bg, color, border: `1px solid ${color}33`,
  borderRadius: 5, padding: "3px 8px", fontSize: 11, cursor: "pointer", fontWeight: 600,
});

// ─── BLOCKED DATES PICKER ─────────────────────────────────────────────────────
function BlockedDatesPicker({ blockedDates, onChange, color }) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const toStr = (d) => `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

  const isPast = (d) => {
    const date = new Date(viewYear, viewMonth, d);
    const t = new Date(); t.setHours(0,0,0,0);
    return date < t;
  };

  const toggle = (d) => {
    const str = toStr(d);
    if (blockedDates.includes(str)) {
      onChange(blockedDates.filter(x => x !== str));
    } else {
      onChange([...blockedDates, str].sort());
    }
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const blockedThisMonth = blockedDates.filter(d => d.startsWith(`${viewYear}-${String(viewMonth+1).padStart(2,"0")}`)).length;

  return (
    <div style={{ border: "1.5px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
      {/* Nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#1A1F36", color: "#fff" }}>
        <button onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1); } else setViewMonth(m => m-1); }}
          style={{ background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", fontWeight: 700, padding: "0 8px" }}>‹</button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{MONTHS_FR[viewMonth]} {viewYear}</div>
          {blockedThisMonth > 0 && (
            <div style={{ fontSize: 11, color: "#FCA5A5", marginTop: 2 }}>🚫 {blockedThisMonth} jour(s) bloqué(s) ce mois</div>
          )}
        </div>
        <button onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1); } else setViewMonth(m => m+1); }}
          style={{ background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", fontWeight: 700, padding: "0 8px" }}>›</button>
      </div>

      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", background: "#F7F8FC" }}>
        {DAYS_FR.map(d => <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#9CA3AF", padding: "8px 0" }}>{d}</div>)}
      </div>

      {/* Cells */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", padding: "8px", background: "#fff" }}>
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const str = toStr(d);
          const isBlocked = blockedDates.includes(str);
          const past = isPast(d);
          return (
            <button key={d}
              disabled={past}
              onClick={() => toggle(d)}
              title={isBlocked ? `Cliquer pour débloquer le ${str}` : `Cliquer pour bloquer le ${str}`}
              style={{
                margin: 2, borderRadius: 8, border: isBlocked ? "2px solid #DC2626" : "2px solid transparent",
                padding: "8px 4px", fontSize: 13, cursor: past ? "not-allowed" : "pointer",
                fontWeight: isBlocked ? 800 : 400,
                background: isBlocked ? "#FEE2E2" : past ? "transparent" : "#F7F8FC",
                color: isBlocked ? "#DC2626" : past ? "#D1D5DB" : "#1A1F36",
                position: "relative",
                transition: "all 0.1s",
              }}>
              {d}
              {isBlocked && (
                <span style={{ position: "absolute", top: 1, right: 3, fontSize: 8, color: "#DC2626" }}>🚫</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ padding: "10px 16px", borderTop: "1px solid #E5E7EB", display: "flex", gap: 16, fontSize: 12, color: "#6B7280" }}>
        <span>💡 Cliquez sur un jour pour le bloquer</span>
        <span style={{ color: "#DC2626", fontWeight: 600 }}>🚫 = Bloqué (cliquez pour débloquer)</span>
      </div>
    </div>
  );
}

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
// ─── CLIENTS HISTORY ──────────────────────────────────────────────────────────
function ClientsHistory({ color }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`/api/reservations?t=${Date.now()}`, { cache: "no-store", headers: { "Cache-Control": "no-cache" } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setReservations(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Grouper par client (email ou téléphone)
  const clientsMap = {};
  reservations.forEach(r => {
    const key = r.email || r.telephone || `${r.prenom}-${r.nom}`;
    if (!clientsMap[key]) {
      clientsMap[key] = {
        prenom: r.prenom, nom: r.nom,
        email: r.email, telephone: r.telephone,
        reservations: [],
      };
    }
    clientsMap[key].reservations.push(r);
  });

  const clients = Object.values(clientsMap)
    .map(c => ({
      ...c,
      total: c.reservations.filter(r => r.statut !== "annule").reduce((s, r) => s + (parseFloat(r.total) || 0), 0),
      count: c.reservations.length,
      lastDate: c.reservations.sort((a, b) => new Date(b.date) - new Date(a.date))[0]?.date,
    }))
    .sort((a, b) => b.total - a.total)
    .filter(c => !search || `${c.prenom} ${c.nom} ${c.email} ${c.telephone}`.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div style={{ textAlign: "center", padding: 40, color: "#6B7280" }}>⏳ Chargement...</div>;

  // Vue détail client
  if (selected) {
    const client = clients.find(c => (c.email || c.telephone) === selected);
    if (!client) return null;
    return (
      <div>
        <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color, fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 16 }}>
          ← Retour à la liste
        </button>
        <div style={{ background: "#F7F8FC", borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: "#1A1F36", marginBottom: 4 }}>{client.prenom} {client.nom}</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, color: "#6B7280" }}>
            {client.telephone && <a href={`tel:${client.telephone}`} style={{ color, fontWeight: 600 }}>📞 {client.telephone}</a>}
            {client.email && <a href={`mailto:${client.email}`} style={{ color, fontWeight: 600 }}>✉️ {client.email}</a>}
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
            {[
              { label: "Interventions", val: client.count, icon: "📋" },
              { label: "CA total", val: `${client.total.toFixed(0)}€`, icon: "💶" },
              { label: "Dernière visite", val: client.lastDate, icon: "📅" },
            ].map(s => (
              <div key={s.label} style={{ background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", flex: 1, minWidth: 100 }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color }}>{s.val}</div>
                <div style={{ fontSize: 11, color: "#9CA3AF" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", margin: "0 0 10px" }}>Historique des réservations</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {client.reservations.sort((a, b) => new Date(b.date) - new Date(a.date)).map(r => (
            <div key={r.id} style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "12px 14px", background: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{r.service} — {r.option}</span>
                <span style={{ background: r.statut === "confirme" ? "#F0FDF4" : r.statut === "annule" ? "#FEF2F2" : "#FFF7ED", color: r.statut === "confirme" ? "#059669" : r.statut === "annule" ? "#DC2626" : "#F59E0B", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                  {r.statut === "confirme" ? "✅ Confirmé" : r.statut === "annule" ? "✕ Annulé" : "⏳ Attente"}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#6B7280" }}>📅 {r.date} · {r.creneau} · 💶 {r.total}€</div>
              {r.adresse && <div style={{ fontSize: 12, color: "#6B7280" }}>📍 {r.adresse}</div>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Vue liste clients
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>👤 {clients.length} clients</div>
          <div style={{ fontSize: 12, color: "#6B7280" }}>CA total : {clients.reduce((s, c) => s + c.total, 0).toFixed(0)}€</div>
        </div>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Rechercher..."
          style={{ border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", fontFamily: "inherit", width: 200 }}
        />
      </div>
      {clients.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>Aucun client trouvé</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {clients.map(c => {
            const key = c.email || c.telephone || `${c.prenom}-${c.nom}`;
            return (
              <button key={key} onClick={() => setSelected(key)}
                style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "12px 14px", background: "#fff", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: color + "15", color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, flexShrink: 0 }}>
                  {(c.prenom?.[0] || "?").toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1A1F36" }}>{c.prenom} {c.nom}</div>
                  <div style={{ fontSize: 12, color: "#6B7280" }}>{c.telephone} {c.email ? `· ${c.email}` : ""}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color }}>{c.total.toFixed(0)}€</div>
                  <div style={{ fontSize: 11, color: "#9CA3AF" }}>{c.count} intervention{c.count > 1 ? "s" : ""}</div>
                </div>
                <span style={{ color: "#D1D5DB", fontSize: 18 }}>›</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── MONTHLY STATS TAB ────────────────────────────────────────────────────────
function MonthlyStatsTab({ color }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetch(`/api/reservations?t=${Date.now()}`, { cache: "no-store" })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setReservations(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Stats du mois en cours
  const thisMonth = reservations.filter(r => {
    if (!r.date || r.statut === "annule") return false;
    const d = new Date(r.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  // Stats du mois précédent
  const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const lastMonth = reservations.filter(r => {
    if (!r.date || r.statut === "annule") return false;
    const d = new Date(r.date);
    return d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear();
  });

  const caThis = thisMonth.reduce((s, r) => s + (parseFloat(r.total) || 0), 0);
  const caLast = lastMonth.reduce((s, r) => s + (parseFloat(r.total) || 0), 0);
  const evol = caLast > 0 ? ((caThis - caLast) / caLast * 100).toFixed(0) : null;

  // Services du mois en cours
  const serviceCount = {};
  thisMonth.forEach(r => { serviceCount[r.service] = (serviceCount[r.service] || 0) + 1; });
  const topServices = Object.entries(serviceCount).sort((a, b) => b[1] - a[1]);

  const monthName = now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const lastMonthName = lastMonthDate.toLocaleDateString("fr-FR", { month: "long" });

  const handleSendNow = async () => {
    setSending(true);
    try {
      await fetch("/api/monthly-stats");
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch (e) {} finally { setSending(false); }
  };

  if (loading) return <div style={{ textAlign: "center", padding: 40, color: "#6B7280" }}>⏳ Chargement...</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>📊 Statistiques — {monthName}</div>
          <div style={{ fontSize: 12, color: "#6B7280" }}>Récap automatique envoyé le 1er de chaque mois</div>
        </div>
        <button onClick={handleSendNow} disabled={sending}
          style={{ background: sent ? "#059669" : color, color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          {sending ? "⏳ Envoi..." : sent ? "✓ Envoyé !" : "📨 Envoyer maintenant"}
        </button>
      </div>

      {/* KPIs mois en cours */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Interventions", val: thisMonth.length, icon: "📋", c: color },
          { label: "CA du mois", val: `${caThis.toFixed(0)}€`, icon: "💶", c: "#059669" },
          { label: "Moy./intervention", val: thisMonth.length > 0 ? `${(caThis / thisMonth.length).toFixed(0)}€` : "0€", icon: "📈", c: "#7C3AED" },
          { label: "Annulées", val: reservations.filter(r => { const d = new Date(r.date); return d.getMonth() === currentMonth && d.getFullYear() === currentYear && r.statut === "annule"; }).length, icon: "✕", c: "#DC2626" },
        ].map(s => (
          <div key={s.label} style={{ background: "#F7F8FC", border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "12px", textAlign: "center" }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: s.c }}>{s.val}</div>
            <div style={{ fontSize: 11, color: "#9CA3AF" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Comparaison mois précédent */}
      {evol !== null && (
        <div style={{ background: evol >= 0 ? "#F0FDF4" : "#FEF2F2", border: `1.5px solid ${evol >= 0 ? "#059669" : "#DC2626"}`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: evol >= 0 ? "#059669" : "#DC2626" }}>
            {evol >= 0 ? "📈" : "📉"} {evol >= 0 ? "+" : ""}{evol}% vs {lastMonthName}
          </span>
          <span style={{ fontSize: 13, color: "#6B7280" }}>{caLast.toFixed(0)}€ → {caThis.toFixed(0)}€</span>
        </div>
      )}

      {/* Top services */}
      {topServices.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 8px" }}>🧹 Services ce mois-ci</p>
          {topServices.map(([s, n]) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", background: "#F7F8FC", borderRadius: 8, marginBottom: 6 }}>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{s}</span>
              <div style={{ background: color, height: 6, borderRadius: 3, width: `${Math.round(n / thisMonth.length * 100)}px`, minWidth: 10 }} />
              <span style={{ fontSize: 13, fontWeight: 700, color, minWidth: 30 }}>{n}x</span>
            </div>
          ))}
        </div>
      )}

      {/* Note */}
      <div style={{ background: "#EEF3FF", borderRadius: 10, padding: "12px 14px", fontSize: 12, color: "#374151" }}>
        💡 Le récap complet est envoyé automatiquement par SMS + email le <strong>1er de chaque mois</strong> à 8h00.
      </div>
    </div>
  );
}

function AdminPanel({ config, onSave, onClose }) {
  const [cfg, setCfg] = useState(JSON.parse(JSON.stringify(config)));
  const [tab, setTab] = useState("reservations");
  const [saved, setSaved] = useState(false);
  const [pwdCurrent, setPwdCurrent] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");
  const [pwdMsg, setPwdMsg] = useState(null);
  const [stripeKey, setStripeKey] = useState(() => { try { return localStorage.getItem("cleannet_stripe") || ""; } catch(_) { return ""; } });
  const [stripeSaved, setStripeSaved] = useState(false);
  const [stripeMode, setStripeMode] = useState(() => { try { return localStorage.getItem("cleannet_stripe_mode") || "test"; } catch(_) { return "test"; } });

  const color = cfg.company.accentColor || "#0057FF";

  const save = () => { onSave(cfg); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  // Company tab
  const setCompany = (k, v) => setCfg(c => ({ ...c, company: { ...c.company, [k]: v } }));

  // Services
  const updateService = (si, field, val) => setCfg(c => {
    const svcs = [...c.services];
    svcs[si] = { ...svcs[si], [field]: val };
    return { ...c, services: svcs };
  });
  const updateOption = (si, oi, field, val) => setCfg(c => {
    const svcs = [...c.services];
    const opts = [...svcs[si].options];
    opts[oi] = { ...opts[oi], [field]: val };
    svcs[si] = { ...svcs[si], options: opts };
    return { ...c, services: svcs };
  });
  const addOption = (si) => setCfg(c => {
    const svcs = [...c.services];
    svcs[si] = { ...svcs[si], options: [...svcs[si].options, { id: uid(), label: "Nouvelle option", price: 0 }] };
    return { ...c, services: svcs };
  });
  const removeOption = (si, oi) => setCfg(c => {
    const svcs = [...c.services];
    const opts = svcs[si].options.filter((_, i) => i !== oi);
    svcs[si] = { ...svcs[si], options: opts };
    return { ...c, services: svcs };
  });
  const addService = () => setCfg(c => ({
    ...c,
    services: [...c.services, { id: uid(), icon: "🧹", name: "Nouveau service", description: "Description du service", options: [{ id: uid(), label: "Option 1", price: 0 }] }],
  }));
  const removeService = (si) => setCfg(c => ({ ...c, services: c.services.filter((_, i) => i !== si) }));

  // Upsells
  const updateUpsell = (ui, field, val) => setCfg(c => {
    const ups = [...c.upsells];
    ups[ui] = { ...ups[ui], [field]: val };
    return { ...c, upsells: ups };
  });
  const addUpsell = () => setCfg(c => ({
    ...c, upsells: [...c.upsells, { id: uid(), icon: "⭐", name: "Nouvel upsell", price: 0 }],
  }));
  const removeUpsell = (ui) => setCfg(c => ({ ...c, upsells: c.upsells.filter((_, i) => i !== ui) }));

  const tabs = [
    { id: "reservations", label: "📋 Réservations" },
    { id: "clients", label: "👤 Clients" },
    { id: "pipeline", label: "🎯 Pipeline" },
    { id: "stats", label: "📊 Stats" },
    { id: "company", label: "🏢 Entreprise" },
    { id: "services", label: "🧹 Services" },
    { id: "upsells", label: "✨ Upsells" },
    { id: "availability", label: "📅 Disponibilités" },
    { id: "stripe", label: "💳 Stripe" },
    { id: "publish", label: "🚀 Publier" },
    { id: "password", label: "🔑 Mot de passe" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "20px 12px", overflowY: "auto" }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 680, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>

        {/* Admin Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #E5E7EB" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>⚙️ Panneau d'administration</div>
            <div style={{ fontSize: 13, color: "#6B7280" }}>Modifiez tout sans toucher au code</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={save} style={{ background: saved ? "#059669" : color, color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {saved ? "✓ Sauvegardé !" : "Sauvegarder"}
            </button>
            <button onClick={onClose} style={{ background: "#F3F4F6", border: "none", borderRadius: 8, padding: "9px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#374151" }}>✕ Fermer</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #E5E7EB", padding: "0 24px", overflowX: "auto" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ border: "none", background: "none", padding: "12px 16px", fontWeight: tab === t.id ? 700 : 500, fontSize: 14, color: tab === t.id ? color : "#6B7280", cursor: "pointer", borderBottom: `2px solid ${tab === t.id ? color : "transparent"}`, marginBottom: -1 }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: "24px", maxHeight: "65vh", overflowY: "auto" }}>

          {/* TAB: Reservations */}
          {tab === "reservations" && (
            <ReservationsDashboard color={color} services={cfg.services} />
          )}

          {/* TAB: Pipeline */}
          {tab === "pipeline" && (
            <PipelineDashboard color={color} />
          )}

          {/* TAB: Clients */}
          {tab === "clients" && (
            <ClientsHistory color={color} />
          )}

          {/* TAB: Stats */}
          {tab === "stats" && (
            <MonthlyStatsTab color={color} />
          )}

          {/* TAB: Company */}
          {tab === "company" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <AdminSection title="Identité">
                <AdminField label="Nom de l'entreprise" value={cfg.company.name} onChange={v => setCompany("name", v)} />
                <AdminField label="Slogan / tagline" value={cfg.company.tagline} onChange={v => setCompany("tagline", v)} />
                <AdminField label="Zone d'intervention" value={cfg.company.zone} onChange={v => setCompany("zone", v)} />
              </AdminSection>
              <AdminSection title="Contact">
                <AdminField label="Téléphone" value={cfg.company.phone} onChange={v => setCompany("phone", v)} />
                <AdminField label="Email" type="email" value={cfg.company.email} onChange={v => setCompany("email", v)} />
              </AdminSection>
              <AdminSection title="Paiement & Apparence">
                <AdminField label="Acompte (%)" type="number" value={cfg.company.acomptePercent} onChange={v => setCompany("acomptePercent", v)} />
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>Couleur principale</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input type="color" value={cfg.company.accentColor} onChange={e => setCompany("accentColor", e.target.value)}
                      style={{ width: 44, height: 36, border: "1.5px solid #E5E7EB", borderRadius: 6, cursor: "pointer", padding: 2 }} />
                    <span style={{ fontSize: 13, color: "#6B7280" }}>{cfg.company.accentColor}</span>
                  </div>
                </div>
              </AdminSection>
            </div>
          )}

          {/* TAB: Services */}
          {tab === "services" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {cfg.services.map((svc, si) => (
                <div key={svc.id} style={{ border: "1.5px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ background: "#F7F8FC", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                    <input value={svc.icon} onChange={e => updateService(si, "icon", e.target.value)}
                      style={{ ...inputStyle, width: 48, textAlign: "center", fontSize: 18 }} />
                    <input value={svc.name} onChange={e => updateService(si, "name", e.target.value)}
                      style={{ ...inputStyle, flex: 1, fontWeight: 700 }} />
                    <button onClick={() => removeService(si)}
                      style={{ background: "#FEE2E2", border: "none", borderRadius: 6, padding: "6px 10px", color: "#DC2626", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>
                      Supprimer
                    </button>
                  </div>
                  <div style={{ padding: "12px 16px" }}>
                    <AdminField label="Description" value={svc.description} onChange={v => updateService(si, "description", v)} />
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", margin: "14px 0 6px" }}>Options & Prix</p>
                    <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                      <span style={{ flex: 1, fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>Label</span>
                      <span style={{ width: 70, fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>Prix (€)</span>
                      <span style={{ width: 60, fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>Durée</span>
                      <span style={{ width: 28 }} />
                    </div>
                    {svc.options.map((opt, oi) => (
                      <div key={opt.id} style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 12px", marginBottom: 8, background: "#FAFAFA" }}>
                        <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                          <input value={opt.label} onChange={e => updateOption(si, oi, "label", e.target.value)}
                            style={{ ...inputStyle, flex: 1 }} placeholder="Label" />
                          <button onClick={() => removeOption(si, oi)}
                            style={{ background: "none", border: "1.5px solid #FCA5A5", borderRadius: 6, padding: "6px 8px", color: "#EF4444", cursor: "pointer", fontSize: 13 }}>✕</button>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                          {/* Type de prix */}
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            <button onClick={() => updateOption(si, oi, "priceType", "fixed")}
                              style={{ padding: "6px 10px", fontSize: 12, fontWeight: 600, border: `1.5px solid ${!opt.priceType || opt.priceType === "fixed" ? color : "#E5E7EB"}`, borderRadius: 6, background: !opt.priceType || opt.priceType === "fixed" ? color + "15" : "#fff", color: !opt.priceType || opt.priceType === "fixed" ? color : "#6B7280", cursor: "pointer" }}>
                              💶 Prix fixe
                            </button>
                            <button onClick={() => updateOption(si, oi, "priceType", "m2")}
                              style={{ padding: "6px 10px", fontSize: 12, fontWeight: 600, border: `1.5px solid ${opt.priceType === "m2" ? color : "#E5E7EB"}`, borderRadius: 6, background: opt.priceType === "m2" ? color + "15" : "#fff", color: opt.priceType === "m2" ? color : "#6B7280", cursor: "pointer" }}>
                              📐 Prix/m²
                            </button>
                            <button onClick={() => updateOption(si, oi, "priceType", "hour")}
                              style={{ padding: "6px 10px", fontSize: 12, fontWeight: 600, border: `1.5px solid ${opt.priceType === "hour" ? color : "#E5E7EB"}`, borderRadius: 6, background: opt.priceType === "hour" ? color + "15" : "#fff", color: opt.priceType === "hour" ? color : "#6B7280", cursor: "pointer" }}>
                              ⏱️ Prix/heure
                            </button>
                          </div>
                          {/* Prix */}
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <input type="number" value={opt.price} onChange={e => updateOption(si, oi, "price", e.target.value)}
                              style={{ ...inputStyle, width: 70 }} />
                            <span style={{ fontSize: 12, color: "#6B7280" }}>{opt.priceType === "m2" ? "€/m²" : opt.priceType === "hour" ? "€/h" : "€"}</span>
                          </div>
                          {/* Durée */}
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <input type="number" value={opt.duration || 60} onChange={e => updateOption(si, oi, "duration", e.target.value)}
                              style={{ ...inputStyle, width: 60 }} title="Durée en minutes" />
                            <span style={{ fontSize: 12, color: "#6B7280" }}>min</span>
                          </div>
                        </div>
                        {opt.priceType === "m2" && (
                          <p style={{ fontSize: 11, color: "#6B7280", margin: "6px 0 0", fontStyle: "italic" }}>
                            💡 Le client entrera la surface et le prix sera calculé automatiquement
                          </p>
                        )}
                        {opt.priceType === "hour" && (
                          <p style={{ fontSize: 11, color: "#6B7280", margin: "6px 0 0", fontStyle: "italic" }}>
                            💡 Le client entrera le nombre d'heures et le prix sera calculé automatiquement
                          </p>
                        )}
                      </div>
                    ))}
                    <button onClick={() => addOption(si)}
                      style={{ background: "none", border: `1.5px dashed ${color}`, borderRadius: 8, padding: "8px 14px", color, fontWeight: 600, fontSize: 13, cursor: "pointer", marginTop: 4 }}>
                      + Ajouter une option
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={addService}
                style={{ background: "none", border: `2px dashed ${color}`, borderRadius: 10, padding: "14px", color, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                + Ajouter un service
              </button>
            </div>
          )}

          {/* TAB: Upsells */}
          {tab === "upsells" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ fontSize: 14, color: "#6B7280", margin: "0 0 8px" }}>
                Les upsells apparaissent à l'étape 2. Vous pouvez les limiter à certains services.
              </p>
              {cfg.upsells.length === 0 && (
                <div style={{ textAlign: "center", padding: "32px 16px", background: "#F7F8FC", borderRadius: 12, color: "#9CA3AF", fontSize: 14 }}>
                  Aucun upsell pour l'instant. Ajoutez-en un ci-dessous !
                </div>
              )}
              {cfg.upsells.map((u, ui) => (
                <div key={u.id} style={{ border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                    <input value={u.icon} onChange={e => updateUpsell(ui, "icon", e.target.value)}
                      style={{ ...inputStyle, width: 48, textAlign: "center", fontSize: 18 }} />
                    <input value={u.name} onChange={e => updateUpsell(ui, "name", e.target.value)}
                      style={{ ...inputStyle, flex: 1 }} placeholder="Nom de l'upsell" />
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <input type="number" value={u.price} onChange={e => updateUpsell(ui, "price", e.target.value)}
                        style={{ ...inputStyle, width: 70 }} />
                      <span style={{ fontSize: 13, color: "#6B7280" }}>€</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <input type="number" value={u.duration || 0} onChange={e => updateUpsell(ui, "duration", e.target.value)}
                        style={{ ...inputStyle, width: 55 }} title="Durée en minutes" placeholder="0" />
                      <span style={{ fontSize: 12, color: "#6B7280" }}>min</span>
                    </div>
                    <button onClick={() => removeUpsell(ui)}
                      style={{ background: "#FEE2E2", border: "none", borderRadius: 6, padding: "7px 10px", color: "#DC2626", fontWeight: 700, cursor: "pointer" }}>✕</button>
                  </div>
                  {/* Mode quantité */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                      <button onClick={() => updateUpsell(ui, "priceUnit", "")}
                        style={{ padding: "4px 10px", fontSize: 12, fontWeight: 600, border: `1.5px solid ${!u.priceUnit ? color : "#E5E7EB"}`, borderRadius: 20, background: !u.priceUnit ? color + "15" : "#fff", color: !u.priceUnit ? color : "#6B7280", cursor: "pointer" }}>
                        ✅ Prix unique
                      </button>
                      <button onClick={() => updateUpsell(ui, "priceUnit", u.priceUnit || "unité")}
                        style={{ padding: "4px 10px", fontSize: 12, fontWeight: 600, border: `1.5px solid ${u.priceUnit ? color : "#E5E7EB"}`, borderRadius: 20, background: u.priceUnit ? color + "15" : "#fff", color: u.priceUnit ? color : "#6B7280", cursor: "pointer" }}>
                        🔢 Prix par quantité
                      </button>
                    </div>
                    {u.priceUnit && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, color: "#6B7280" }}>Unité :</span>
                        <input value={u.priceUnit} onChange={e => updateUpsell(ui, "priceUnit", e.target.value)}
                          style={{ ...inputStyle, width: 120 }} placeholder="ex: coussin, fenêtre..." />
                        <span style={{ fontSize: 12, color: "#6B7280" }}>→ Le client choisit la quantité</span>
                      </div>
                    )}
                  </div>
                  {/* Sélection des services */}
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", margin: "0 0 6px" }}>
                      Afficher pour :
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      <button
                        onClick={() => updateUpsell(ui, "services", [])}
                        style={{ padding: "4px 10px", fontSize: 12, fontWeight: 600, border: `1.5px solid ${!u.services || u.services.length === 0 ? color : "#E5E7EB"}`, borderRadius: 20, background: !u.services || u.services.length === 0 ? color + "15" : "#fff", color: !u.services || u.services.length === 0 ? color : "#6B7280", cursor: "pointer" }}>
                        Tous les services
                      </button>
                      {cfg.services.map(s => {
                        const selected = u.services && u.services.includes(s.id);
                        return (
                          <button key={s.id}
                            onClick={() => {
                              const current = u.services || [];
                              const next = selected ? current.filter(id => id !== s.id) : [...current, s.id];
                              updateUpsell(ui, "services", next);
                            }}
                            style={{ padding: "4px 10px", fontSize: 12, fontWeight: 600, border: `1.5px solid ${selected ? color : "#E5E7EB"}`, borderRadius: 20, background: selected ? color + "15" : "#fff", color: selected ? color : "#6B7280", cursor: "pointer" }}>
                            {s.icon} {s.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={addUpsell}
                style={{ background: "none", border: `2px dashed ${color}`, borderRadius: 10, padding: "14px", color, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                + Ajouter un upsell
              </button>
            </div>
          )}

          {/* TAB: Availability */}
          {tab === "availability" && (() => {
            const schedules = cfg.availability?.daySchedules || {};
            const updateDay = (dayIdx, field, val) => setCfg(c => ({
              ...c,
              availability: {
                ...c.availability,
                daySchedules: {
                  ...c.availability.daySchedules,
                  [dayIdx]: { ...(c.availability.daySchedules?.[dayIdx] || { active: false, start: "08:00", end: "18:00" }), [field]: val }
                }
              }
            }));

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                <AdminSection title="Horaires par jour">
                  <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 12px" }}>
                    Activez les jours travaillés et définissez les horaires pour chacun.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {DAYS_FR.map((dayLabel, i) => {
                      const dayCfg = schedules[i] || { active: false, start: "08:00", end: "18:00" };
                      return (
                        <div key={i} style={{
                          border: `2px solid ${dayCfg.active ? color : "#E5E7EB"}`,
                          borderRadius: 10, padding: "12px 14px",
                          background: dayCfg.active ? color + "08" : "#FAFAFA",
                          transition: "all 0.15s",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            {/* Toggle */}
                            <button onClick={() => updateDay(i, "active", !dayCfg.active)}
                              style={{
                                width: 42, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                                background: dayCfg.active ? color : "#D1D5DB", position: "relative", flexShrink: 0,
                                transition: "background 0.2s",
                              }}>
                              <span style={{
                                position: "absolute", top: 3, width: 18, height: 18, borderRadius: "50%",
                                background: "#fff", transition: "left 0.2s",
                                left: dayCfg.active ? 21 : 3,
                                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                              }} />
                            </button>

                            {/* Day name */}
                            <span style={{ fontWeight: 700, fontSize: 14, width: 36, color: dayCfg.active ? "#1A1F36" : "#9CA3AF" }}>
                              {dayLabel}
                            </span>

                            {/* Time inputs */}
                            {dayCfg.active ? (
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                                <input type="time" value={dayCfg.start}
                                  onChange={e => updateDay(i, "start", e.target.value)}
                                  style={{ ...inputStyle, width: 110, fontSize: 13, padding: "6px 10px" }} />
                                <span style={{ color: "#9CA3AF", fontWeight: 600, fontSize: 13 }}>→</span>
                                <input type="time" value={dayCfg.end}
                                  onChange={e => updateDay(i, "end", e.target.value)}
                                  style={{ ...inputStyle, width: 110, fontSize: 13, padding: "6px 10px" }} />
                              </div>
                            ) : (
                              <span style={{ fontSize: 13, color: "#9CA3AF", fontStyle: "italic" }}>Jour non travaillé</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AdminSection>

                <AdminSection title="🚫 Dates bloquées (congés, jours fériés)">
                  <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 10px" }}>
                    Cliquez sur les jours à bloquer directement dans le calendrier. Cliquez à nouveau pour débloquer.
                  </p>
                  <BlockedDatesPicker
                    blockedDates={cfg.availability?.blockedDates || []}
                    onChange={dates => setCfg(c => ({ ...c, availability: { ...c.availability, blockedDates: dates } }))}
                    color={color}
                  />
                  {(cfg.availability?.blockedDates || []).length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 8px" }}>
                        {(cfg.availability?.blockedDates || []).length} jour(s) bloqué(s)
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {(cfg.availability?.blockedDates || []).map(d => (
                          <div key={d} style={{ display: "flex", alignItems: "center", gap: 5, background: "#FEE2E2", borderRadius: 20, padding: "4px 10px 4px 12px", fontSize: 12, fontWeight: 600, color: "#DC2626" }}>
                            🚫 {d}
                            <button onClick={() => setCfg(c => ({ ...c, availability: { ...c.availability, blockedDates: c.availability.blockedDates.filter(x => x !== d) } }))}
                              style={{ background: "none", border: "none", color: "#DC2626", cursor: "pointer", fontWeight: 800, fontSize: 13, padding: 0 }}>✕</button>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => setCfg(c => ({ ...c, availability: { ...c.availability, blockedDates: [] } }))}
                        style={{ marginTop: 10, background: "none", border: "1.5px solid #FCA5A5", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, color: "#DC2626", cursor: "pointer" }}>
                        Tout débloquer
                      </button>
                    </div>
                  )}
                </AdminSection>

                <AdminSection title="🔗 Google Calendar">
                  <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 8px", lineHeight: 1.6 }}>
                    Connectez votre Google Calendar pour synchroniser vos disponibilités.
                  </p>
                  <AdminField label="URL iCal Google Calendar" value={cfg.availability?.googleCalendarUrl || ""}
                    onChange={v => setCfg(c => ({ ...c, availability: { ...c.availability, googleCalendarUrl: v } }))} />
                  <a href="https://calendar.google.com/calendar/r/settings" target="_blank" rel="noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "9px 14px", fontSize: 13, fontWeight: 700, color: "#374151", textDecoration: "none" }}>
                    📅 Ouvrir Google Calendar →
                  </a>
                  <p style={{ fontSize: 12, color: "#9CA3AF", margin: "4px 0 0" }}>
                    Paramètres → votre agenda → "Intégrer l'agenda" → copiez l'adresse iCal publique.
                  </p>
                </AdminSection>
              </div>
            );
          })()}

          {/* TAB: Stripe */}
          {tab === "stripe" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Status badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: stripeKey.startsWith("pk_live") ? "#F0FDF4" : stripeKey.startsWith("pk_test") ? "#FFF7ED" : "#F7F8FC", border: `1.5px solid ${stripeKey.startsWith("pk_live") ? "#059669" : stripeKey.startsWith("pk_test") ? "#F59E0B" : "#E5E7EB"}`, borderRadius: 10, padding: "12px 16px" }}>
                <span style={{ fontSize: 22 }}>{stripeKey.startsWith("pk_live") ? "✅" : stripeKey.startsWith("pk_test") ? "🟡" : "⚪"}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {stripeKey.startsWith("pk_live") ? "Stripe connecté (mode production)" : stripeKey.startsWith("pk_test") ? "Stripe connecté (mode test)" : "Stripe non connecté"}
                  </div>
                  <div style={{ fontSize: 12, color: "#6B7280" }}>
                    {stripeKey.startsWith("pk_live") ? "Les paiements réels sont activés" : stripeKey.startsWith("pk_test") ? "Les paiements sont en mode test" : "Ajoutez votre clé pour activer les paiements"}
                  </div>
                </div>
              </div>

              <AdminSection title="Configuration Stripe">
                {/* Mode toggle */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>Mode</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["test", "live"].map(m => (
                      <button key={m} onClick={() => { setStripeMode(m); try { localStorage.setItem("cleannet_stripe_mode", m); } catch(_){} }}
                        style={{ flex: 1, border: `2px solid ${stripeMode === m ? color : "#E5E7EB"}`, background: stripeMode === m ? color + "11" : "#fff", borderRadius: 8, padding: "10px", fontWeight: 700, fontSize: 13, cursor: "pointer", color: stripeMode === m ? color : "#6B7280" }}>
                        {m === "test" ? "🧪 Test" : "🚀 Production"}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: 12, color: "#6B7280", margin: "4px 0 0" }}>
                    {stripeMode === "test" ? "Utilisez le mode test pour vérifier que tout fonctionne avant d'accepter de vrais paiements." : "Mode production : les vrais paiements sont encaissés."}
                  </p>
                </div>

                {/* Key input */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>
                    Clé publique Stripe ({stripeMode === "test" ? "pk_test_..." : "pk_live_..."})
                  </label>
                  <input
                    type="text"
                    value={stripeKey}
                    onChange={e => setStripeKey(e.target.value)}
                    style={inputStyle}
                    placeholder={stripeMode === "test" ? "pk_test_xxxxxxxxxxxx" : "pk_live_xxxxxxxxxxxx"}
                  />
                </div>

                <button onClick={() => {
                  try { localStorage.setItem("cleannet_stripe", stripeKey); } catch(_){}
                  setStripeSaved(true); setTimeout(() => setStripeSaved(false), 2500);
                }} style={{ background: stripeSaved ? "#059669" : color, color: "#fff", border: "none", borderRadius: 8, padding: "11px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  {stripeSaved ? "✓ Clé sauvegardée !" : "Sauvegarder la clé Stripe"}
                </button>
              </AdminSection>

              <AdminSection title="Où trouver ma clé Stripe ?">
                <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.8 }}>
                  <p style={{ margin: "0 0 8px" }}>1. Connecte-toi sur <strong>dashboard.stripe.com</strong></p>
                  <p style={{ margin: "0 0 8px" }}>2. Clique sur <strong>Développeurs</strong> → <strong>Clés API</strong></p>
                  <p style={{ margin: "0 0 12px" }}>3. Copie la <strong>Clé publique</strong> (commence par pk_test_ ou pk_live_)</p>
                  <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noreferrer"
                    style={{ display: "inline-block", background: "#635BFF", color: "#fff", textDecoration: "none", borderRadius: 8, padding: "10px 16px", fontWeight: 700, fontSize: 13 }}>
                    Ouvrir le dashboard Stripe →
                  </a>
                </div>
              </AdminSection>
            </div>
          )}

          {/* TAB: Publish */}
          {tab === "publish" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Deploy button */}
              <div style={{ background: "linear-gradient(135deg, #000 0%, #333 100%)", borderRadius: 12, padding: "24px 20px", textAlign: "center", color: "#fff" }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>▲</div>
                <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>Déployer sur Vercel</div>
                <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 20 }}>Votre site en ligne en 2 minutes, gratuitement</div>
                <a
                  href="https://vercel.com/new/clone?repository-url=https://github.com/vercel/next.js/tree/canary/examples/hello-world"
                  target="_blank" rel="noreferrer"
                  style={{ display: "inline-block", background: "#fff", color: "#000", textDecoration: "none", borderRadius: 8, padding: "12px 24px", fontWeight: 800, fontSize: 14 }}>
                  ▲ Ouvrir Vercel →
                </a>
              </div>

              <AdminSection title="📋 Guide de mise en ligne étape par étape">
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {[
                    { n: "1", title: "Crée un compte GitHub gratuit", desc: "Va sur github.com et crée un compte si tu n'en as pas.", link: "https://github.com", linkLabel: "Ouvrir GitHub →" },
                    { n: "2", title: "Crée un nouveau projet", desc: 'Clique sur "New repository", nomme-le cleannet-reservation, coche "Add README", puis "Create repository".', link: "https://github.com/new", linkLabel: "Créer le projet →" },
                    { n: "3", title: "Upload ton fichier", desc: 'Sur ton projet GitHub, clique "Add file" → "Upload files", puis glisse le fichier .jsx téléchargé depuis Claude.', link: null },
                    { n: "4", title: "Connecte Vercel à GitHub", desc: "Va sur vercel.com, crée un compte gratuit avec GitHub, clique \"Add New Project\" et sélectionne cleannet-reservation.", link: "https://vercel.com/new", linkLabel: "Ouvrir Vercel →" },
                    { n: "5", title: "Déploie !", desc: 'Clique "Deploy". En 2 minutes tu obtiens un lien du type cleannet-reservation.vercel.app à partager à tes clients.', link: null },
                  ].map(s => (
                    <div key={s.n} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{s.n}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{s.title}</div>
                        <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.5, marginBottom: s.link ? 6 : 0 }}>{s.desc}</div>
                        {s.link && (
                          <a href={s.link} target="_blank" rel="noreferrer"
                            style={{ fontSize: 13, color, fontWeight: 700, textDecoration: "none" }}>{s.linkLabel}</a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </AdminSection>

              <AdminSection title="💡 Ton lien une fois en ligne">
                <div style={{ background: "#F7F8FC", borderRadius: 8, padding: "12px 14px", fontSize: 14, fontFamily: "monospace", color: "#374151", letterSpacing: "0.3px" }}>
                  https://cleannet-reservation.vercel.app
                </div>
                <p style={{ fontSize: 12, color: "#6B7280", margin: "4px 0 0" }}>Tu peux aussi connecter ton propre nom de domaine gratuitement dans les réglages Vercel.</p>
              </AdminSection>
            </div>
          )}

          {/* TAB: Password */}
          {tab === "password" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <AdminSection title="Changer le mot de passe admin">
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>Mot de passe actuel</label>
                  <input type="password" value={pwdCurrent} onChange={e => setPwdCurrent(e.target.value)}
                    style={inputStyle} placeholder="Entrez le mot de passe actuel" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>Nouveau mot de passe</label>
                  <input type="password" value={pwdNew} onChange={e => setPwdNew(e.target.value)}
                    style={inputStyle} placeholder="Minimum 6 caractères" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>Confirmer le nouveau mot de passe</label>
                  <input type="password" value={pwdConfirm} onChange={e => setPwdConfirm(e.target.value)}
                    style={inputStyle} placeholder="Répétez le nouveau mot de passe" />
                </div>
                {pwdMsg && (
                  <div style={{ background: pwdMsg.ok ? "#F0FDF4" : "#FEF2F2", border: `1.5px solid ${pwdMsg.ok ? "#059669" : "#DC2626"}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: pwdMsg.ok ? "#059669" : "#DC2626", fontWeight: 600 }}>
                    {pwdMsg.ok ? "✓ " : "✕ "}{pwdMsg.text}
                  </div>
                )}
                <button onClick={() => {
                  if (pwdCurrent !== getPassword()) { setPwdMsg({ ok: false, text: "Mot de passe actuel incorrect" }); return; }
                  if (pwdNew.length < 6) { setPwdMsg({ ok: false, text: "Le nouveau mot de passe doit faire au moins 6 caractères" }); return; }
                  if (pwdNew !== pwdConfirm) { setPwdMsg({ ok: false, text: "Les deux mots de passe ne correspondent pas" }); return; }
                  setPassword(pwdNew);
                  setPwdCurrent(""); setPwdNew(""); setPwdConfirm("");
                  setPwdMsg({ ok: true, text: "Mot de passe modifié avec succès !" });
                  setTimeout(() => setPwdMsg(null), 3000);
                }} style={{ background: color, color: "#fff", border: "none", borderRadius: 8, padding: "11px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  Changer le mot de passe
                </button>
              </AdminSection>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN LOGIN ──────────────────────────────────────────────────────────────
function AdminLogin({ onSuccess, onClose }) {
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState(false);
  const check = () => {
    if (pwd === getPassword()) { onSuccess(); }
    else { setErr(true); setTimeout(() => setErr(false), 2000); }
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 320, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ fontSize: 32, textAlign: "center", marginBottom: 8 }}>🔐</div>
        <h2 style={{ fontWeight: 800, fontSize: 18, textAlign: "center", margin: "0 0 4px" }}>Accès administration</h2>
        <p style={{ fontSize: 13, color: "#6B7280", textAlign: "center", margin: "0 0 20px" }}>Entrez le mot de passe admin</p>
        <input type="password" value={pwd} onChange={e => setPwd(e.target.value)} onKeyDown={e => e.key === "Enter" && check()}
          placeholder="Mot de passe" style={{ ...inputStyle, marginBottom: 10 }} autoFocus />
        {err && <p style={{ color: "#DC2626", fontSize: 13, margin: "0 0 8px" }}>Mot de passe incorrect</p>}
        <button onClick={check}
          style={{ width: "100%", background: "#0057FF", color: "#fff", border: "none", borderRadius: 8, padding: 12, fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 10 }}>
          Accéder au panneau
        </button>
        <button onClick={onClose}
          style={{ width: "100%", background: "#F3F4F6", border: "none", borderRadius: 8, padding: 12, fontWeight: 600, fontSize: 14, cursor: "pointer", color: "#374151" }}>
          Annuler
        </button>
      </div>
    </div>
  );
}

// ─── SMALL UI HELPERS ─────────────────────────────────────────────────────────
function AdminSection({ title, children }) {
  return (
    <div style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "14px 16px" }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 12px" }}>{title}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
    </div>
  );
}
function AdminField({ label, value, onChange, type = "text" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 13, fontWeight: 600 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} style={inputStyle} />
    </div>
  );
}
function Row({ label, val, bold, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 14 }}>
      <span style={{ color: "#6B7280" }}>{label}</span>
      <span style={{ fontWeight: bold ? 800 : 600, color: color || "#1A1F36" }}>{val}</span>
    </div>
  );
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const inputStyle = {
  border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "9px 12px",
  fontSize: 14, color: "#1A1F36", outline: "none", fontFamily: "inherit",
  background: "#fff", width: "100%", boxSizing: "border-box",
};
const recapCard = {
  background: "#F7F8FC", borderRadius: 12, padding: "14px 18px", marginBottom: 14,
};
const backBtn = {
  background: "none", border: "1.5px solid #E5E7EB", borderRadius: 8,
  padding: "10px 18px", fontSize: 14, fontWeight: 600, color: "#6B7280", cursor: "pointer",
};
const nextBtn = {
  border: "none", borderRadius: 8, padding: "11px 24px",
  fontSize: 14, fontWeight: 700, marginLeft: "auto", transition: "background 0.15s",
};

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
// ─── PAGE AVIS ────────────────────────────────────────────────────────────────
const GOOGLE_REVIEW_URL = "https://g.page/r/CYYAykIVxndLEBM/review";

function ReviewPage() {
  const params = new URLSearchParams(window.location.search);
  const reservationId = params.get("id") || "";
  const [note, setNote] = useState(null);
  const [hover, setHover] = useState(null);
  const [step, setStep] = useState("rating");
  const [feedback, setFeedback] = useState("");
  const [sending, setSending] = useState(false);

  const handleNote = (n) => {
    setNote(n);
    if (n >= 4) {
      setStep("google");
      setTimeout(() => { window.location.href = GOOGLE_REVIEW_URL; }, 2000);
    } else {
      setStep("feedback");
    }
  };

  const handleFeedback = async () => {
    setSending(true);
    try {
      await fetch("/api/review-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note, feedback, reservationId }),
      });
      setStep("done");
    } catch (e) { setStep("done"); }
    finally { setSending(false); }
  };

  const stars = [1, 2, 3, 4, 5];

  return (
    <div style={{ minHeight: "100vh", background: "#F7F8FC", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter,system-ui,sans-serif", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "40px 32px", maxWidth: 440, width: "100%", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: "#0057FF", marginBottom: 4 }}>✦ CleanNet</div>
        <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 28 }}>Multi-Service 06</div>

        {step === "rating" && (
          <>
            <div style={{ fontSize: 36, marginBottom: 12 }}>😊</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 8px", color: "#1A1F36" }}>Votre intervention s'est bien passée ?</h2>
            <p style={{ fontSize: 14, color: "#6B7280", margin: "0 0 28px" }}>Donnez-nous une note de 1 à 5 étoiles</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 12 }}>
              {stars.map(s => (
                <button key={s} onClick={() => handleNote(s)} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(null)}
                  style={{ fontSize: 40, background: "none", border: "none", cursor: "pointer", transform: (hover || note) >= s ? "scale(1.2)" : "scale(1)", transition: "transform 0.15s", filter: (hover || note) >= s ? "none" : "grayscale(1)" }}>
                  ⭐
                </button>
              ))}
            </div>
            <p style={{ fontSize: 12, color: "#9CA3AF" }}>{hover ? ["", "Très insatisfait", "Insatisfait", "Correct", "Satisfait", "Très satisfait"][hover] : "Cliquez sur une étoile"}</p>
          </>
        )}

        {step === "google" && (
          <>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🌟</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 8px", color: "#1A1F36" }}>Merci pour votre {note} étoile{note > 1 ? "s" : ""} !</h2>
            <p style={{ fontSize: 14, color: "#6B7280", margin: "0 0 20px" }}>Redirection vers Google en cours...</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
              {stars.map(s => <span key={s} style={{ fontSize: 28, filter: s <= note ? "none" : "grayscale(1)" }}>⭐</span>)}
            </div>
            <a href={GOOGLE_REVIEW_URL} style={{ display: "inline-block", marginTop: 16, color: "#0057FF", fontSize: 13, fontWeight: 600 }}>Cliquez ici si la redirection ne fonctionne pas</a>
          </>
        )}

        {step === "feedback" && (
          <>
            <div style={{ fontSize: 36, marginBottom: 12 }}>😔</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 8px", color: "#1A1F36" }}>Nous sommes désolés !</h2>
            <p style={{ fontSize: 14, color: "#6B7280", margin: "0 0 20px" }}>Dites-nous ce qui s'est mal passé.</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 20 }}>
              {stars.map(s => <span key={s} style={{ fontSize: 24, filter: s <= note ? "none" : "grayscale(1)" }}>⭐</span>)}
            </div>
            <textarea value={feedback} onChange={e => setFeedback(e.target.value)}
              placeholder="Décrivez votre expérience..."
              style={{ width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "12px 14px", fontSize: 14, fontFamily: "inherit", resize: "vertical", minHeight: 100, outline: "none", boxSizing: "border-box", marginBottom: 14 }} />
            <button onClick={handleFeedback} disabled={sending || !feedback.trim()}
              style={{ width: "100%", background: sending || !feedback.trim() ? "#E5E7EB" : "#0057FF", color: sending || !feedback.trim() ? "#9CA3AF" : "#fff", border: "none", borderRadius: 10, padding: "13px", fontSize: 15, fontWeight: 800, cursor: sending || !feedback.trim() ? "not-allowed" : "pointer" }}>
              {sending ? "⏳ Envoi..." : "Envoyer mon retour →"}
            </button>
          </>
        )}

        {step === "done" && (
          <>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🙏</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 8px", color: "#1A1F36" }}>Merci pour votre retour !</h2>
            <p style={{ fontSize: 14, color: "#6B7280" }}>Votre message a été transmis à notre équipe.</p>
            <div style={{ background: "#F0FDF4", border: "1.5px solid #059669", borderRadius: 10, padding: "12px 16px", marginTop: 20, fontSize: 14, color: "#059669", fontWeight: 600 }}>
              ✅ Retour bien reçu
            </div>
          </>
        )}
        <p style={{ fontSize: 11, color: "#D1D5DB", marginTop: 28 }}>✦ CleanNet Multi-Service 06 · Alpes-Maritimes</p>
      </div>
    </div>
  );
}

export default function App() {
  // ── Route /avis ──────────────────────────────────────────────────────────────
  if (window.location.pathname === "/avis") {
    return <ReviewPage />;
  }

  const [config, setConfig] = useState(loadConfig);
  const [showLogin, setShowLogin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  const color = config.company.accentColor || "#0057FF";

  // Charger la config depuis Supabase au démarrage
  useEffect(() => {
    fetch("/api/config")
      .then(r => r.json())
      .then(data => {
        if (data && data.company) {
          setConfig(data);
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch(_) {}
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = (newCfg) => { setConfig(newCfg); saveConfig(newCfg); };

  return (
    <div style={{ minHeight: "100vh", background: "#F7F8FC", fontFamily: "'Inter', system-ui, sans-serif", color: "#1A1F36", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <header style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", position: "sticky", top: 0, zIndex: 9 }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22, color, fontWeight: 900 }}>✦</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.5px" }}>{config.company.name}</div>
              <div style={{ fontSize: 11, color: "#6B7280" }}>{config.company.tagline}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ background: color + "15", color, fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 20 }}>
              Réservation en ligne
            </span>
            <button onClick={() => setShowLogin(true)}
              style={{ background: "#F3F4F6", border: "none", borderRadius: 8, padding: "6px 10px", fontSize: 12, cursor: "pointer", color: "#6B7280", fontWeight: 600 }}>
              ⚙️ Admin
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{ flex: 1, padding: "24px 16px 48px", maxWidth: 720, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px rgba(0,0,0,0.07)", overflow: "hidden" }}>
          <BookingFlow config={config} />
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: "18px 20px", textAlign: "center", fontSize: 12, color: "#9CA3AF", borderTop: "1px solid #E5E7EB" }}>
        © 2026 {config.company.name} · {config.company.zone} · {config.company.phone}
      </footer>

      {/* Modals */}
      {showLogin && !showAdmin && (
        <AdminLogin
          onSuccess={() => { setShowLogin(false); setShowAdmin(true); }}
          onClose={() => setShowLogin(false)}
        />
      )}
      {showAdmin && (
        <AdminPanel config={config} onSave={handleSave} onClose={() => setShowAdmin(false)} />
      )}
    </div>
  );
}
