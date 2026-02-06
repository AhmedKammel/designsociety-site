// db.js
export const STORAGE_KEY = "scms_db_v2_ar";
export const SESSION_KEY = "scms_session_v2_ar";

export const ADMIN_CREDS = {
  username: "adminahmed",
  password: "ahmedkammel##",
};

export const DEFAULTS = {
  groups: ["مجموعة 1"],
  plans: [
    { id: "plan_monthly", name: "اشتراك شهري", months: 1, price: 500 },
  ],
};

export function safeUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "id_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
}

export function pad6(n) {
  return String(n).padStart(6, "0");
}

export function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function nowHuman() {
  const d = new Date();
  return d.toLocaleString("ar-EG", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function parseISODate(iso) {
  return new Date(`${iso}T00:00:00`);
}

export function toISODate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function addMonthsISO(iso, months) {
  const d = parseISODate(iso);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() !== day) d.setDate(0);
  return toISODate(d);
}

export function isoToHuman(iso) {
  if (!iso) return "—";
  const d = parseISODate(iso);
  return d.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "2-digit" });
}

export function isISOOnOrAfter(aISO, bISO) {
  return parseISODate(aISO).getTime() >= parseISODate(bISO).getTime();
}

export function isThisMonthISO(iso) {
  const d = parseISODate(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export function money(amount, currencyLabel = "ج.م") {
  const n = Number(amount || 0);
  return `${n.toLocaleString("ar-EG")} ${currencyLabel}`;
}

export function sortPlayersNameAsc(players) {
  return [...players].sort((a, b) => {
    const an = String(a.name || "").trim().toLocaleLowerCase("ar");
    const bn = String(b.name || "").trim().toLocaleLowerCase("ar");
    return an.localeCompare(bn, "ar", { sensitivity: "base" });
  });
}

export function defaultDB() {
  return {
    meta: {
      version: 2,
      createdAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
    },
    settings: {
      currencyLabel: "ج.م",
    },
    groups: [...DEFAULTS.groups],
    plans: DEFAULTS.plans.map(p => ({ ...p })),
    expenses: [],
    players: [],
  };
}

export function loadDB() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveDB(db) {
  db.meta = db.meta || {};
  db.meta.lastUpdatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  return db;
}

export function ensureDB() {
  let db = loadDB();
  if (!db) db = defaultDB();

  db.settings = db.settings || { currencyLabel: "ج.م" };
  db.settings.currencyLabel = db.settings.currencyLabel || "ج.م";

  db.groups = Array.isArray(db.groups) ? db.groups : [...DEFAULTS.groups];
  if (db.groups.length === 0) db.groups = [...DEFAULTS.groups];

  db.plans = Array.isArray(db.plans) ? db.plans : DEFAULTS.plans.map(p => ({ ...p }));
  if (db.plans.length === 0) db.plans = DEFAULTS.plans.map(p => ({ ...p }));

  db.expenses = Array.isArray(db.expenses) ? db.expenses : [];
  db.players = Array.isArray(db.players) ? db.players : [];

  db.meta = db.meta || { version: 2, createdAt: new Date().toISOString(), lastUpdatedAt: new Date().toISOString() };

  saveDB(db);
  return db;
}

export function loadSession() {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const s = JSON.parse(raw);
    if (!s || typeof s !== "object") return null;
    return s;
  } catch {
    return null;
  }
}

export function saveSession(session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function generateUniqueCode(players) {
  const used = new Set(players.map(p => String(p.accessCode)));
  for (let i = 0; i < 2000; i++) {
    const c = pad6(Math.floor(Math.random() * 1000000));
    if (!used.has(c)) return c;
  }
  let base = 100000;
  while (used.has(String(base))) base++;
  return pad6(base);
}

export function playerStatus(player) {
  const t = todayISO();
  return isISOOnOrAfter(player.expiryDate, t) ? "نشط" : "منتهي";
}

export function getPlanById(db, planId) {
  return db.plans.find(p => p.id === planId) || null;
}

export function computeRevenueThisMonth(db) {
  let sum = 0;
  for (const p of db.players) {
    const payments = Array.isArray(p.payments) ? p.payments : [];
    for (const pay of payments) {
      if (pay?.date && isThisMonthISO(pay.date)) sum += Number(pay.amount || 0);
    }
  }
  return sum;
}

export function computeExpensesThisMonth(db) {
  let sum = 0;
  for (const e of db.expenses) {
    if (e?.date && isThisMonthISO(e.date)) sum += Number(e.amount || 0);
  }
  return sum;
}

export function getPlayerByCode(db, code) {
  return db.players.find(p => String(p.accessCode) === String(code));
}
