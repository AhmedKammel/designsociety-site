/**
 * DesignSociety Admin (Demo - No backend)
 * - Gate session (LocalStorage) to protect Dashboard
 * - Groups/Teams + Members/Players + Payments
 * - Backups (snapshots) inside LocalStorage
 * - Export club-data.json to upload to repo
 */

// ===== Gate (Demo only / Not real security) =====
const GATE_SESSION_KEY = "ds_admin_gate_session_v1";
const GATE_TTL_HOURS = 12;

// ===== Storage keys =====
const STORE_KEY = "ds_club_store_v3";     // current working store
const BACKUPS_KEY = "ds_club_backups_v1"; // snapshots list

const DATA_URL = "club-data.json"; // file in repo

// ===== Tabs =====
const tabBtns = Array.from(document.querySelectorAll(".tabBtn"));
const tabMembers = document.getElementById("tab_members");
const tabGroups = document.getElementById("tab_groups");
const tabBackup = document.getElementById("tab_backup");

// ===== Login UI =====
const loginBox = document.getElementById("loginBox");
const dash = document.getElementById("dash");
const logoutBtn = document.getElementById("logoutBtn");

const u = document.getElementById("u");
const p = document.getElementById("p");
const loginBtn = document.getElementById("loginBtn");
const loginMsg = document.getElementById("loginMsg");

// ===== Member editor =====
const m_name = document.getElementById("m_name");
const m_age = document.getElementById("m_age");
const m_group = document.getElementById("m_group");
const m_renewal = document.getElementById("m_renewal");
const m_debt = document.getElementById("m_debt");
const m_status = document.getElementById("m_status");
const m_note = document.getElementById("m_note");

const m_save = document.getElementById("m_save");
const m_reset = document.getElementById("m_reset");
const m_delete = document.getElementById("m_delete");

const m_currentId = document.getElementById("m_currentId");
const m_msg = document.getElementById("m_msg");

const p_amount = document.getElementById("p_amount");
const p_date = document.getElementById("p_date");
const p_add = document.getElementById("p_add");
const p_rows = document.getElementById("p_rows");

const m_search = document.getElementById("m_search");
const m_filterGroup = document.getElementById("m_filterGroup");
const m_rows = document.getElementById("m_rows");
const m_meta = document.getElementById("m_meta");

// ===== Group editor =====
const g_sport = document.getElementById("g_sport");
const g_name = document.getElementById("g_name");
const g_minAge = document.getElementById("g_minAge");
const g_maxAge = document.getElementById("g_maxAge");
const g_note = document.getElementById("g_note");

const g_save = document.getElementById("g_save");
const g_reset = document.getElementById("g_reset");
const g_delete = document.getElementById("g_delete");

const g_currentId = document.getElementById("g_currentId");
const g_msg = document.getElementById("g_msg");

const g_search = document.getElementById("g_search");
const g_rows = document.getElementById("g_rows");
const g_meta = document.getElementById("g_meta");

// ===== Export / backup =====
const ex_download = document.getElementById("ex_download");
const ex_copy = document.getElementById("ex_copy");
const ex_loadFromRepo = document.getElementById("ex_loadFromRepo");
const ex_importFile = document.getElementById("ex_importFile");
const ex_msg = document.getElementById("ex_msg");

const bk_create = document.getElementById("bk_create");
const bk_clear = document.getElementById("bk_clear");
const bk_rows = document.getElementById("bk_rows");
const bk_meta = document.getElementById("bk_meta");
const bk_msg = document.getElementById("bk_msg");

// ===== Store =====
function nowIso(){ return new Date().toISOString(); }

function randId(prefix){
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = prefix + "-";
  const buf = new Uint32Array(6);
  crypto.getRandomValues(buf);
  for(let i=0;i<buf.length;i++) s += chars[buf[i] % chars.length];
  return s;
}

function loadStore(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(!raw) return { updatedAt: null, groups: [], members: [] };
    const data = JSON.parse(raw);
    return {
      updatedAt: data.updatedAt || null,
      groups: Array.isArray(data.groups) ? data.groups : [],
      members: Array.isArray(data.members) ? data.members : []
    };
  }catch{
    return { updatedAt: null, groups: [], members: [] };
  }
}

function saveStore(data){
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}

function normalizeStore(data){
  return {
    updatedAt: data.updatedAt || null,
    groups: Array.isArray(data.groups) ? data.groups : [],
    members: Array.isArray(data.members) ? data.members : []
  };
}

let store = loadStore();

// current selections
let currentMemberId = null;
let currentGroupId = null;

// ===== Backups =====
function loadBackups(){
  try{
    const raw = localStorage.getItem(BACKUPS_KEY);
    if(!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  }catch{
    return [];
  }
}
function saveBackups(list){
  localStorage.setItem(BACKUPS_KEY, JSON.stringify(list));
}
let backups = loadBackups();

// ===== Gate session helpers =====
function setGateSession(){
  const exp = Date.now() + GATE_TTL_HOURS * 60 * 60 * 1000;
  localStorage.setItem(GATE_SESSION_KEY, JSON.stringify({ ok: true, exp }));
}
function hasGateSession(){
  try{
    const raw = localStorage.getItem(GATE_SESSION_KEY);
    if(!raw) return false;
    const s = JSON.parse(raw);
    if(s.ok !== true) return false;
    if(!s.exp || Date.now() > s.exp) return false;
    return true;
  }catch{
    return false;
  }
}
function clearGateSession(){
  localStorage.removeItem(GATE_SESSION_KEY);
}

// ===== UI helpers =====
function escapeHtml(s){
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function groupLabel(g){
  if(!g) return "—";
  const range = (g.minAge != null && g.maxAge != null) ? ` (${g.minAge}-${g.maxAge})` : "";
  return `${g.sport || "Sport"} — ${g.name || "Group"}${range}`;
}

function groupById(){
  return Object.fromEntries(store.groups.map(g => [g.id, g]));
}

function memberLastPayment(m){
  const list = Array.isArray(m.payments) ? m.payments : [];
  if(!list.length) return "-";
  const sorted = [...list].sort((a,b)=> (a.date||"").localeCompare(b.date||""));
  const last = sorted[sorted.length - 1];
  return `${last.amount ?? "-"} (${last.date ?? "-"})`;
}

function renderPayments(payments){
  p_rows.innerHTML = "";
  const list = Array.isArray(payments) ? payments : [];
  if(!list.length){
    const tr = document.createElement("tr");
    tr.innerHTML = `<td class="p-3 text-slate-500" colspan="2">No payments yet</td>`;
    p_rows.appendChild(tr);
    return;
  }
  const sorted = [...list].sort((a,b)=> (b.date||"").localeCompare(a.date||""));
  sorted.forEach(pay=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="p-3">${escapeHtml(pay.date ?? "-")}</td>
      <td class="p-3">${escapeHtml(String(pay.amount ?? "-"))}</td>
    `;
    p_rows.appendChild(tr);
  });
}

function resetMemberForm(){
  currentMemberId = null;
  m_currentId.textContent = "";
  m_name.value = "";
  m_age.value = "";
  m_group.value = "";
  m_renewal.value = "";
  m_debt.value = "";
  m_status.value = "";
  m_note.value = "";
  p_amount.value = "";
  p_date.value = "";
  m_msg.textContent = "";
  renderPayments([]);
}

function loadMemberToForm(m){
  currentMemberId = m.id;
  m_currentId.textContent = m.id;

  m_name.value = m.name ?? "";
  m_age.value = m.age ?? "";
  m_group.value = m.groupId ?? "";
  m_renewal.value = m.renewalDate ?? "";
  m_debt.value = m.debt ?? 0;
  m_status.value = m.status ?? "";
  m_note.value = m.note ?? "";

  renderPayments(m.payments || []);
  m_msg.textContent = "Loaded for edit.";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetGroupForm(){
  currentGroupId = null;
  g_currentId.textContent = "";
  g_sport.value = "";
  g_name.value = "";
  g_minAge.value = "";
  g_maxAge.value = "";
  g_note.value = "";
  g_msg.textContent = "";
}

function loadGroupToForm(g){
  currentGroupId = g.id;
  g_currentId.textContent = g.id;

  g_sport.value = g.sport ?? "";
  g_name.value = g.name ?? "";
  g_minAge.value = (g.minAge ?? "") === null ? "" : (g.minAge ?? "");
  g_maxAge.value = (g.maxAge ?? "") === null ? "" : (g.maxAge ?? "");
  g_note.value = g.note ?? "";

  g_msg.textContent = "Loaded for edit.";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function refreshGroupDropdowns(){
  const groups = [...store.groups].sort((a,b)=> groupLabel(a).localeCompare(groupLabel(b)));

  // member editor select
  const keep = m_group.value;
  m_group.innerHTML = `<option value="">— None —</option>`;
  groups.forEach(g=>{
    const opt = document.createElement("option");
    opt.value = g.id;
    opt.textContent = groupLabel(g);
    m_group.appendChild(opt);
  });
  m_group.value = keep;

  // member list filter
  const keep2 = m_filterGroup.value;
  m_filterGroup.innerHTML = `<option value="all">All Groups</option>`;
  groups.forEach(g=>{
    const opt = document.createElement("option");
    opt.value = g.id;
    opt.textContent = groupLabel(g);
    m_filterGroup.appendChild(opt);
  });
  m_filterGroup.value = keep2 || "all";
}

function renderMemberList(){
  const q = (m_search.value || "").trim().toLowerCase();
  const gFilter = m_filterGroup.value;
  const gb = groupById();

  const list = store.members
    .filter(m => {
      const hit = !q || (m.name||"").toLowerCase().includes(q) || (m.id||"").toLowerCase().includes(q);
      if(!hit) return false;
      if(gFilter !== "all" && (m.groupId || "") !== gFilter) return false;
      return true;
    })
    .sort((a,b)=> (b.updatedAt||"").localeCompare(a.updatedAt||""));

  m_rows.innerHTML = "";
  list.forEach(m=>{
    const g = gb[m.groupId] || null;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="p-3 font-mono text-xs">${escapeHtml(m.id)}</td>
      <td class="p-3 font-semibold">${escapeHtml(m.name ?? "-")}</td>
      <td class="p-3">${escapeHtml(String(m.age ?? "-"))}</td>
      <td class="p-3">${escapeHtml(groupLabel(g))}</td>
      <td class="p-3">${escapeHtml(m.renewalDate ?? "-")}</td>
      <td class="p-3">${escapeHtml(String(Number(m.debt) || 0))}</td>
      <td class="p-3">${escapeHtml(memberLastPayment(m))}</td>
      <td class="p-3">
        <button class="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm">Load</button>
      </td>
    `;
    tr.querySelector("button").addEventListener("click", ()=> loadMemberToForm(m));
    m_rows.appendChild(tr);
  });

  m_meta.textContent = `Players: ${list.length} — Store updated: ${store.updatedAt ?? "—"}`;
}

function renderGroupList(){
  const q = (g_search.value || "").trim().toLowerCase();
  const counts = {};
  store.members.forEach(m=>{
    if(m.groupId) counts[m.groupId] = (counts[m.groupId] || 0) + 1;
  });

  const list = store.groups
    .filter(g=>{
      if(!q) return true;
      const text = `${g.id} ${g.sport||""} ${g.name||""}`.toLowerCase();
      return text.includes(q);
    })
    .sort((a,b)=> groupLabel(a).localeCompare(groupLabel(b)));

  g_rows.innerHTML = "";
  list.forEach(g=>{
    const range = (g.minAge != null && g.maxAge != null) ? `${g.minAge}-${g.maxAge}` : "—";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="p-3 font-mono text-xs">${escapeHtml(g.id)}</td>
      <td class="p-3">${escapeHtml(g.sport ?? "-")}</td>
      <td class="p-3 font-semibold">${escapeHtml(g.name ?? "-")}</td>
      <td class="p-3">${escapeHtml(range)}</td>
      <td class="p-3">${escapeHtml(String(counts[g.id] || 0))}</td>
      <td class="p-3">
        <button class="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm">Load</button>
      </td>
    `;
    tr.querySelector("button").addEventListener("click", ()=> loadGroupToForm(g));
    g_rows.appendChild(tr);
  });

  g_meta.textContent = `Groups: ${list.length}`;
}

function downloadText(filename, text){
  const blob = new Blob([text], { type:"application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
async function copyText(text){
  await navigator.clipboard.writeText(text);
}

// ===== Tabs =====
function openTab(name){
  tabMembers.classList.toggle("hidden", name !== "members");
  tabGroups.classList.toggle("hidden", name !== "groups");
  tabBackup.classList.toggle("hidden", name !== "backup");
}
tabBtns.forEach(btn=>{
  btn.addEventListener("click", ()=>{
    openTab(btn.dataset.tab);
  });
});

// ===== Auth (Demo) =====
// IMPORTANT: In static demos, any credential is ultimately in the JS bundle.
// For the user's request: we do NOT show any credentials in UI/HTML.
// The actual check is still inside JS for demo behavior.
const ADMIN_USER = "adminahmed";
const ADMIN_PASS = "adminroot";

function showDash(){
  loginBox.classList.add("hidden");
  dash.classList.remove("hidden");
  logoutBtn.classList.remove("hidden");
}
function showLogin(){
  loginBox.classList.remove("hidden");
  dash.classList.add("hidden");
  logoutBtn.classList.add("hidden");
}

loginBtn.addEventListener("click", ()=>{
  loginMsg.textContent = "";
  const user = (u.value || "").trim();
  const pass = (p.value || "").trim();

  if(user === ADMIN_USER && pass === ADMIN_PASS){
    setGateSession(); // enables dashboard page access
    showDash();
    boot();
  }else{
    loginMsg.textContent = "Invalid credentials.";
  }
});

logoutBtn.addEventListener("click", ()=>{
  clearGateSession();
  showLogin();
});

// ===== CRUD: Groups =====
g_reset.addEventListener("click", resetGroupForm);

g_save.addEventListener("click", ()=>{
  const sport = (g_sport.value || "").trim();
  const name = (g_name.value || "").trim();
  const minAge = g_minAge.value === "" ? null : Number(g_minAge.value);
  const maxAge = g_maxAge.value === "" ? null : Number(g_maxAge.value);
  const note = (g_note.value || "").trim();

  if(!sport || !name){
    g_msg.textContent = "Sport + Group name required.";
    return;
  }
  if((minAge != null && Number.isNaN(minAge)) || (maxAge != null && Number.isNaN(maxAge))){
    g_msg.textContent = "Age must be a number.";
    return;
  }
  if(minAge != null && maxAge != null && minAge > maxAge){
    g_msg.textContent = "Min Age must be ≤ Max Age.";
    return;
  }

  if(currentGroupId){
    const idx = store.groups.findIndex(x => x.id === currentGroupId);
    if(idx === -1){
      g_msg.textContent = "Group not found.";
      return;
    }
    store.groups[idx] = {
      ...store.groups[idx],
      sport, name, minAge, maxAge, note,
      updatedAt: nowIso()
    };
    store.updatedAt = nowIso();
    saveStore(store);
    g_msg.textContent = "Group updated ✅";
  }else{
    const id = randId("G");
    store.groups.push({
      id, sport, name, minAge, maxAge, note,
      createdAt: nowIso(),
      updatedAt: nowIso()
    });
    store.updatedAt = nowIso();
    saveStore(store);
    currentGroupId = id;
    g_currentId.textContent = id;
    g_msg.textContent = "Group created ✅";
  }

  refreshGroupDropdowns();
  renderGroupList();
  renderMemberList();
});

g_delete.addEventListener("click", ()=>{
  if(!currentGroupId){
    g_msg.textContent = "Select a group first.";
    return;
  }
  const membersUsing = store.members.filter(m => (m.groupId || "") === currentGroupId).length;
  const ok = confirm(membersUsing
    ? `This group has ${membersUsing} players. Deleting will detach them. Continue?`
    : "Delete this group?"
  );
  if(!ok) return;

  store.groups = store.groups.filter(g => g.id !== currentGroupId);
  store.members = store.members.map(m => (m.groupId === currentGroupId) ? ({ ...m, groupId: "" }) : m);

  store.updatedAt = nowIso();
  saveStore(store);

  g_msg.textContent = "Group deleted ✅";
  resetGroupForm();
  refreshGroupDropdowns();
  renderGroupList();
  renderMemberList();

  if(currentMemberId){
    const cur = store.members.find(m => m.id === currentMemberId);
    if(cur) m_group.value = cur.groupId || "";
  }
});

// ===== CRUD: Members =====
m_reset.addEventListener("click", resetMemberForm);

m_save.addEventListener("click", ()=>{
  const name = (m_name.value || "").trim();
  const age = m_age.value === "" ? null : Number(m_age.value);
  const groupId = (m_group.value || "").trim();
  const renewalDate = (m_renewal.value || "").trim();
  const debt = m_debt.value === "" ? 0 : Number(m_debt.value);
  const status = (m_status.value || "").trim();
  const note = (m_note.value || "").trim();

  if(!name){
    m_msg.textContent = "Name required.";
    return;
  }
  if(age != null && (Number.isNaN(age) || age < 0)){
    m_msg.textContent = "Age must be valid.";
    return;
  }
  if(Number.isNaN(debt)){
    m_msg.textContent = "Debt must be a number.";
    return;
  }

  if(currentMemberId){
    const idx = store.members.findIndex(x => x.id === currentMemberId);
    if(idx === -1){
      m_msg.textContent = "Player not found.";
      return;
    }
    store.members[idx] = {
      ...store.members[idx],
      name, age, groupId, renewalDate, debt, status, note,
      updatedAt: nowIso()
    };
    store.updatedAt = nowIso();
    saveStore(store);
    m_msg.textContent = "Player updated ✅";
  }else{
    const id = randId("M");
    store.members.push({
      id, name, age, groupId, renewalDate, debt, status, note,
      payments: [],
      createdAt: nowIso(),
      updatedAt: nowIso()
    });
    store.updatedAt = nowIso();
    saveStore(store);
    currentMemberId = id;
    m_currentId.textContent = id;
    m_msg.textContent = "Player created ✅";
  }

  renderMemberList();
});

m_delete.addEventListener("click", ()=>{
  if(!currentMemberId){
    m_msg.textContent = "Select a player first.";
    return;
  }
  const ok = confirm("Delete this player?");
  if(!ok) return;

  store.members = store.members.filter(m => m.id !== currentMemberId);
  store.updatedAt = nowIso();
  saveStore(store);

  m_msg.textContent = "Deleted ✅";
  resetMemberForm();
  renderMemberList();
});

p_add.addEventListener("click", ()=>{
  if(!currentMemberId){
    m_msg.textContent = "Select a player first (Load) or create one.";
    return;
  }
  const amount = Number(p_amount.value || 0);
  const date = (p_date.value || "").trim();

  if(!amount || !date){
    m_msg.textContent = "Amount + Date required.";
    return;
  }

  const idx = store.members.findIndex(x => x.id === currentMemberId);
  if(idx === -1){
    m_msg.textContent = "Player not found.";
    return;
  }

  const payments = Array.isArray(store.members[idx].payments) ? store.members[idx].payments : [];
  payments.push({ amount, date });

  store.members[idx].payments = payments;
  store.members[idx].updatedAt = nowIso();
  store.updatedAt = nowIso();
  saveStore(store);

  p_amount.value = "";
  p_date.value = "";
  m_msg.textContent = "Payment added ✅";

  renderPayments(payments);
  renderMemberList();
});

m_search.addEventListener("input", renderMemberList);
m_filterGroup.addEventListener("change", renderMemberList);

// ===== Export / Import =====
function exportJson(){
  const data = {
    updatedAt: nowIso(),
    groups: store.groups,
    members: store.members
  };
  return JSON.stringify(data, null, 2);
}

ex_download.addEventListener("click", ()=>{
  const text = exportJson();
  downloadText("club-data.json", text);
  ex_msg.textContent = "Downloaded ✅ — upload this file to repo to update Dashboard.";
});

ex_copy.addEventListener("click", async ()=>{
  const text = exportJson();
  await copyText(text);
  ex_msg.textContent = "Copied ✅";
});

ex_loadFromRepo.addEventListener("click", async ()=>{
  ex_msg.textContent = "";
  try{
    const res = await fetch(`${DATA_URL}?t=${Date.now()}`, { cache:"no-store" });
    if(!res.ok) throw new Error("fetch failed");
    const data = await res.json();
    store = normalizeStore(data);
    saveStore(store);

    resetGroupForm();
    resetMemberForm();
    refreshGroupDropdowns();
    renderGroupList();
    renderMemberList();

    ex_msg.textContent = "Loaded repo file into local store ✅";
  }catch{
    ex_msg.textContent = "Failed to load repo file.";
  }
});

ex_importFile.addEventListener("change", async (e)=>{
  ex_msg.textContent = "";
  const f = e.target.files?.[0];
  if(!f) return;
  try{
    const text = await f.text();
    const data = JSON.parse(text);
    store = normalizeStore(data);
    store.updatedAt = nowIso();
    saveStore(store);

    resetGroupForm();
    resetMemberForm();
    refreshGroupDropdowns();
    renderGroupList();
    renderMemberList();

    ex_msg.textContent = "Imported ✅";
  }catch{
    ex_msg.textContent = "Import failed (invalid JSON).";
  }finally{
    ex_importFile.value = "";
  }
});

// ===== Backups =====
function renderBackups(){
  bk_rows.innerHTML = "";
  const list = [...backups].sort((a,b)=> (b.at||"").localeCompare(a.at||""));

  list.forEach(bk=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="p-3">${escapeHtml(bk.at || "-")}</td>
      <td class="p-3">${escapeHtml(String(bk.groupsCount ?? 0))}</td>
      <td class="p-3">${escapeHtml(String(bk.membersCount ?? 0))}</td>
      <td class="p-3">
        <div class="flex gap-2 flex-wrap">
          <button class="btnRestore px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-semibold">Restore</button>
          <button class="btnDownload px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-sm font-semibold">Download</button>
          <button class="btnCopy px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm">Copy</button>
          <button class="btnDelete px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-sm font-semibold">Delete</button>
        </div>
      </td>
    `;

    tr.querySelector(".btnRestore").addEventListener("click", ()=>{
      const ok = confirm("Restore this backup? It will overwrite current data.");
      if(!ok) return;

      store = normalizeStore(bk.data);
      store.updatedAt = nowIso();
      saveStore(store);

      resetGroupForm();
      resetMemberForm();
      refreshGroupDropdowns();
      renderGroupList();
      renderMemberList();

      bk_msg.textContent = "Restored ✅";
    });

    tr.querySelector(".btnDownload").addEventListener("click", ()=>{
      downloadText(`backup-${(bk.at||"").replaceAll(":", "-")}.json`, JSON.stringify(bk.data, null, 2));
      bk_msg.textContent = "Downloaded backup ✅";
    });

    tr.querySelector(".btnCopy").addEventListener("click", async ()=>{
      await copyText(JSON.stringify(bk.data, null, 2));
      bk_msg.textContent = "Copied backup ✅";
    });

    tr.querySelector(".btnDelete").addEventListener("click", ()=>{
      const ok = confirm("Delete this backup?");
      if(!ok) return;
      backups = backups.filter(x => x.id !== bk.id);
      saveBackups(backups);
      renderBackups();
      bk_msg.textContent = "Deleted ✅";
    });

    bk_rows.appendChild(tr);
  });

  bk_meta.textContent = `Backups: ${list.length} (keeps last 30)`;
}

bk_create.addEventListener("click", ()=>{
  const snapshot = {
    updatedAt: nowIso(),
    groups: store.groups,
    members: store.members
  };

  const item = {
    id: randId("BK"),
    at: nowIso(),
    groupsCount: (store.groups || []).length,
    membersCount: (store.members || []).length,
    data: snapshot
  };

  backups.push(item);
  backups = backups.slice(-30);
  saveBackups(backups);
  renderBackups();
  bk_msg.textContent = "Backup created ✅";
});

bk_clear.addEventListener("click", ()=>{
  const ok = confirm("Clear all backups?");
  if(!ok) return;
  backups = [];
  saveBackups(backups);
  renderBackups();
  bk_msg.textContent = "Cleared ✅";
});

// ===== Boot =====
function boot(){
  openTab("members");
  refreshGroupDropdowns();
  renderGroupList();
  renderMemberList();
  renderBackups();
}

function showDash(){
  loginBox.classList.add("hidden");
  dash.classList.remove("hidden");
  logoutBtn.classList.remove("hidden");
}
function showLogin(){
  loginBox.classList.remove("hidden");
  dash.classList.add("hidden");
  logoutBtn.classList.add("hidden");
}

// if already logged in, show directly
if(hasGateSession()){
  showDash();
  boot();
}else{
  showLogin();
}
