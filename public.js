const DATA_URL = "club-data.json";
const SOON_DAYS = 7;

const rows = document.getElementById("rows");
const meta = document.getElementById("meta");
const stamp = document.getElementById("stamp");
const warn = document.getElementById("warn");

const qEl = document.getElementById("q");
const filterGroup = document.getElementById("filterGroup");
const filterRenewal = document.getElementById("filterRenewal");
const filterDebt = document.getElementById("filterDebt");
const reloadBtn = document.getElementById("reloadBtn");
const logoutBtn = document.getElementById("logoutBtn");

const kpiSoon = document.getElementById("kpiSoon");
const kpiLate = document.getElementById("kpiLate");
const kpiDebt = document.getElementById("kpiDebt");

// Gate (must exist)
window.__DS_GATE__?.requireGate?.();

logoutBtn?.addEventListener("click", ()=>{
  window.__DS_GATE__?.clearGate?.();
  location.replace("admin.html");
});

let groupsById = {};
let allMembers = [];
let updatedAt = null;

function parseDateYMD(s){
  if(!s) return null;
  const d = new Date(s + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}
function daysDiff(a, b){
  const ms = 24 * 60 * 60 * 1000;
  return Math.floor((a - b) / ms);
}
function paymentsSummary(payments){
  const list = Array.isArray(payments) ? payments : [];
  if(!list.length) return { last: "-", total: 0 };

  const sorted = [...list].sort((x, y) => (x.date || "").localeCompare(y.date || ""));
  const last = sorted[sorted.length - 1];
  const total = list.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

  return { last: `${last.amount ?? "-"} (${last.date ?? "-"})`, total };
}

function fillGroupsDropdown(groups){
  filterGroup.innerHTML = "";
  const optAll = document.createElement("option");
  optAll.value = "all";
  optAll.textContent = "الفرق / المجموعات: الكل";
  filterGroup.appendChild(optAll);

  groups.forEach(g => {
    const opt = document.createElement("option");
    opt.value = g.id;
    const range = (g.minAge != null && g.maxAge != null) ? ` (${g.minAge}-${g.maxAge})` : "";
    opt.textContent = `${g.sport || "رياضة"} — ${g.name || "مجموعة"}${range}`;
    filterGroup.appendChild(opt);
  });
}

function applyFilters(list){
  const q = (qEl.value || "").trim().toLowerCase();
  const g = filterGroup.value;
  const r = filterRenewal.value;
  const d = filterDebt.value;

  const today = new Date();

  return list.filter(m => {
    if (q && !(m.name || "").toLowerCase().includes(q)) return false;
    if (g !== "all" && m.groupId !== g) return false;

    const debt = Number(m.debt) || 0;
    if (d === "debt" && !(debt > 0)) return false;
    if (d === "clear" && !(debt <= 0)) return false;

    const rd = parseDateYMD(m.renewalDate);
    if (r === "soon") {
      if (!rd) return false;
      const diff = daysDiff(rd, today);
      if (!(diff >= 0 && diff <= SOON_DAYS)) return false;
    }
    if (r === "late") {
      if (!rd) return false;
      const diff = daysDiff(rd, today);
      if (!(diff < 0)) return false;
    }

    return true;
  });
}

function computeKpis(list){
  const today = new Date();
  let soon = 0, late = 0, debt = 0;

  list.forEach(m=>{
    const rd = parseDateYMD(m.renewalDate);
    if (rd){
      const diff = daysDiff(rd, today);
      if (diff >= 0 && diff <= SOON_DAYS) soon++;
      if (diff < 0) late++;
    }
    if ((Number(m.debt) || 0) > 0) debt++;
  });

  kpiSoon.textContent = String(soon);
  kpiLate.textContent = String(late);
  kpiDebt.textContent = String(debt);
}

function render(list){
  rows.innerHTML = "";

  list.forEach(m => {
    const p = paymentsSummary(m.payments);
    const g = groupsById[m.groupId] || null;
    const groupLabel = g ? `${g.sport || "رياضة"} — ${g.name || "مجموعة"}` : "—";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="p-3 font-semibold">${escapeHtml(m.name ?? "-")}</td>
      <td class="p-3">${escapeHtml(String(m.age ?? "-"))}</td>
      <td class="p-3">${escapeHtml(groupLabel)}</td>
      <td class="p-3">${escapeHtml(m.renewalDate ?? "-")}</td>
      <td class="p-3">${escapeHtml(p.last)}</td>
      <td class="p-3">${escapeHtml(String(p.total))}</td>
      <td class="p-3">${escapeHtml(String(Number(m.debt) || 0))}</td>
      <td class="p-3">${escapeHtml(m.status ?? "-")}</td>
      <td class="p-3 text-slate-300">${escapeHtml(m.note ?? "")}</td>
    `;
    rows.appendChild(tr);
  });

  meta.textContent = `المعروض: ${list.length} لاعب`;
  stamp.textContent = updatedAt ? `آخر تحديث: ${updatedAt}` : "";
  warn.textContent = "";
}

function escapeHtml(s){
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function rerender(){
  const filtered = applyFilters(allMembers);
  render(filtered);
  computeKpis(allMembers);
}

[qEl, filterGroup, filterRenewal, filterDebt].forEach(el => el.addEventListener("input", rerender));
filterGroup.addEventListener("change", rerender);

async function load(){
  try{
    const res = await fetch(`${DATA_URL}?t=${Date.now()}`, { cache: "no-store" });
    if(!res.ok) throw new Error("fetch failed");

    const data = await res.json();
    updatedAt = data.updatedAt || null;

    const groups = Array.isArray(data.groups) ? data.groups : [];
    groupsById = Object.fromEntries(groups.map(g => [g.id, g]));
    fillGroupsDropdown(groups);

    allMembers = Array.isArray(data.members) ? data.members : [];

    rerender();
  }catch(e){
    updatedAt = null;
    groupsById = {};
    allMembers = [];
    fillGroupsDropdown([]);
    render([]);
    computeKpis([]);
    warn.textContent = "مش قادر أقرأ club-data.json — اتأكد إن الملف موجود في الريبو.";
  }
}

reloadBtn.addEventListener("click", load);
load();
