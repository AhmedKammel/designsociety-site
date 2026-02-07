const DATA_URL = "club-data.json";

const STORE_KEY = "ds_club_store_v5";
const BACKUPS_KEY = "ds_club_backups_v3";

const loginBox = document.getElementById("loginBox");
const dash = document.getElementById("dash");
const logoutBtn = document.getElementById("logoutBtn");

const a_email = document.getElementById("a_email");
const a_pass = document.getElementById("a_pass");
const a_loginBtn = document.getElementById("a_loginBtn");
const a_loginMsg = document.getElementById("a_loginMsg");

const storeStamp = document.getElementById("storeStamp");

const tabBtns = Array.from(document.querySelectorAll(".tabBtn"));
const tab_players = document.getElementById("tab_players");
const tab_groups = document.getElementById("tab_groups");
const tab_stats = document.getElementById("tab_stats");
const tab_backup = document.getElementById("tab_backup");

// Players
const m_id = document.getElementById("m_id");
const m_name = document.getElementById("m_name");
const m_email = document.getElementById("m_email");
const m_age = document.getElementById("m_age");
const m_group = document.getElementById("m_group");
const m_renewal = document.getElementById("m_renewal");
const m_debt = document.getElementById("m_debt");
const m_status = document.getElementById("m_status");
const m_newPass = document.getElementById("m_newPass");
const m_togglePass = document.getElementById("m_togglePass");
const m_genPass = document.getElementById("m_genPass");
const m_copyPass = document.getElementById("m_copyPass");
const m_note = document.getElementById("m_note");
const m_save = document.getElementById("m_save");
const m_reset = document.getElementById("m_reset");
const m_delete = document.getElementById("m_delete");
const m_msg = document.getElementById("m_msg");
const m_search = document.getElementById("m_search");
const m_filterGroup = document.getElementById("m_filterGroup");
const m_rows = document.getElementById("m_rows");
const m_meta = document.getElementById("m_meta");

// Payments
const p_amount = document.getElementById("p_amount");
const p_date = document.getElementById("p_date");
const p_add = document.getElementById("p_add");
const p_rows = document.getElementById("p_rows");

// Groups
const g_id = document.getElementById("g_id");
const g_sport = document.getElementById("g_sport");
const g_name = document.getElementById("g_name");
const g_minAge = document.getElementById("g_minAge");
const g_maxAge = document.getElementById("g_maxAge");
const g_note = document.getElementById("g_note");
const g_save = document.getElementById("g_save");
const g_reset = document.getElementById("g_reset");
const g_delete = document.getElementById("g_delete");
const g_msg = document.getElementById("g_msg");
const g_search = document.getElementById("g_search");
const g_rows = document.getElementById("g_rows");
const g_meta = document.getElementById("g_meta");

// Stats
const s_from = document.getElementById("s_from");
const s_to = document.getElementById("s_to");
const s_apply = document.getElementById("s_apply");
const s_reset = document.getElementById("s_reset");

const k_income = document.getElementById("k_income");
const k_expenses = document.getElementById("k_expenses");
const k_net = document.getElementById("k_net");
const k_members = document.getElementById("k_members");

const e_category = document.getElementById("e_category");
const e_amount = document.getElementById("e_amount");
const e_date = document.getElementById("e_date");
const e_title = document.getElementById("e_title");
const e_note = document.getElementById("e_note");
const e_add = document.getElementById("e_add");
const e_clear = document.getElementById("e_clear");
const e_msg = document.getElementById("e_msg");
const e_search = document.getElementById("e_search");
const e_rows = document.getElementById("e_rows");

const s_monthRows = document.getElementById("s_monthRows");
const s_meta = document.getElementById("s_meta");
const s_export_csv = document.getElementById("s_export_csv");

// Export/Backup
const ex_download = document.getElementById("ex_download");
const ex_copy = document.getElementById("ex_copy");
const ex_loadRepo = document.getElementById("ex_loadRepo");
const ex_importFile = document.getElementById("ex_importFile");
const ex_msg = document.getElementById("ex_msg");

const bk_create = document.getElementById("bk_create");
const bk_clear = document.getElementById("bk_clear");
const bk_rows = document.getElementById("bk_rows");
const bk_meta = document.getElementById("bk_meta");
const bk_msg = document.getElementById("bk_msg");

let isAuthed = false; // in-memory فقط: كل Refresh لازم Login
let store = loadStore();
let backups = loadBackups();

let currentMemberId = null;
let currentGroupId = null;

// ---------- Utilities ----------
function nowIso(){ return new Date().toISOString(); }

function randId(prefix){
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = prefix + "-";
  const buf = new Uint32Array(6);
  crypto.getRandomValues(buf);
  for(let i=0;i<buf.length;i++) s += chars[buf[i] % chars.length];
  return s;
}

function escapeHtml(s){
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseDateYMD(s){
  if(!s) return null;
  const d = new Date(s + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function inRange(dateStr, fromStr, toStr){
  const d = parseDateYMD(dateStr);
  if(!d) return false;
  const from = fromStr ? parseDateYMD(fromStr) : null;
  const to = toStr ? parseDateYMD(toStr) : null;
  if(from && d < from) return false;
  if(to && d > to) return false;
  return true;
}

function formatMoney(n){
  const x = Number(n) || 0;
  return x.toLocaleString("ar-EG");
}

// ---------- UI ----------
function showLogin(){
  loginBox.classList.remove("hidden");
  dash.classList.add("hidden");
  logoutBtn.classList.add("hidden");
}
function showDash(){
  loginBox.classList.add("hidden");
  dash.classList.remove("hidden");
  logoutBtn.classList.remove("hidden");
}

function openTab(name){
  tab_players.classList.toggle("hidden", name !== "players");
  tab_groups.classList.toggle("hidden", name !== "groups");
  tab_stats.classList.toggle("hidden", name !== "stats");
  tab_backup.classList.toggle("hidden", name !== "backup");
}
tabBtns.forEach(btn=>{
  btn.addEventListener("click", ()=> openTab(btn.dataset.tab));
});

// ---------- Storage ----------
function normalizeStore(data){
  return {
    updatedAt: data.updatedAt || null,
    groups: Array.isArray(data.groups) ? data.groups : [],
    members: Array.isArray(data.members) ? data.members : [],
    expenses: Array.isArray(data.expenses) ? data.expenses : []
  };
}

function loadStore(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(!raw) return { updatedAt:null, groups:[], members:[], expenses:[] };
    return normalizeStore(JSON.parse(raw));
  }catch{
    return { updatedAt:null, groups:[], members:[], expenses:[] };
  }
}

function saveStore(){
  store.updatedAt = nowIso();
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
  storeStamp.textContent = store.updatedAt ? `آخر تحديث: ${store.updatedAt}` : "";
}

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
function saveBackups(){
  localStorage.setItem(BACKUPS_KEY, JSON.stringify(backups));
}

// ---------- Groups helpers ----------
function groupLabel(g){
  if(!g) return "—";
  const range = (g.minAge != null && g.maxAge != null) ? ` (${g.minAge}-${g.maxAge})` : "";
  return `${g.sport || "رياضة"} — ${g.name || "مجموعة"}${range}`;
}
function groupById(){
  return Object.fromEntries(store.groups.map(g => [g.id, g]));
}
function refreshGroupDropdowns(){
  const groups = [...store.groups].sort((a,b)=> groupLabel(a).localeCompare(groupLabel(b)));

  const keep = m_group.value;
  m_group.innerHTML = `<option value="">— بدون —</option>`;
  groups.forEach(g=>{
    const opt = document.createElement("option");
    opt.value = g.id;
    opt.textContent = groupLabel(g);
    m_group.appendChild(opt);
  });
  m_group.value = keep;

  const keep2 = m_filterGroup.value;
  m_filterGroup.innerHTML = `<option value="all">كل المجموعات</option>`;
  groups.forEach(g=>{
    const opt = document.createElement("option");
    opt.value = g.id;
    opt.textContent = groupLabel(g);
    m_filterGroup.appendChild(opt);
  });
  m_filterGroup.value = keep2 || "all";
}

// ---------- Players ----------
function memberLastPayment(m){
  const list = Array.isArray(m.payments) ? m.payments : [];
  if(!list.length) return "-";
  const sorted = [...list].sort((a,b)=> (a.date||"").localeCompare(b.date||""));
  const last = sorted[sorted.length - 1];
  return `${last.amount ?? "-"} (${last.date ?? "-"})`;
}

function renderPayments(member){
  p_rows.innerHTML = "";
  const list = Array.isArray(member?.payments) ? member.payments : [];
  if(!list.length){
    const tr = document.createElement("tr");
    tr.innerHTML = `<td class="p-3 text-slate-500" colspan="3">لا توجد دفعات</td>`;
    p_rows.appendChild(tr);
    return;
  }
  const sorted = [...list].sort((a,b)=> (b.date||"").localeCompare(a.date||""));
  sorted.forEach((pay, idx)=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="p-3">${escapeHtml(pay.date ?? "-")}</td>
      <td class="p-3">${escapeHtml(String(pay.amount ?? "-"))}</td>
      <td class="p-3">
        <button class="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-sm font-semibold">حذف</button>
      </td>
    `;
    tr.querySelector("button").addEventListener("click", ()=>{
      const ok = confirm("حذف هذه الدفعة؟");
      if(!ok) return;
      const m = store.members.find(x=> x.id === currentMemberId);
      if(!m) return;
      m.payments = (m.payments || []).filter((_, i)=> i !== idx);
      m.updatedAt = nowIso();
      saveStore();
      renderPayments(m);
      renderMemberList();
      renderStats();
    });
    p_rows.appendChild(tr);
  });
}

function resetMemberForm(){
  currentMemberId = null;
  m_id.textContent = "—";
  m_name.value = "";
  m_email.value = "";
  m_age.value = "";
  m_group.value = "";
  m_renewal.value = "";
  m_debt.value = "";
  m_status.value = "";
  m_newPass.value = "";
  m_note.value = "";
  m_msg.textContent = "";
  renderPayments(null);
}

function loadMemberToForm(member){
  currentMemberId = member.id;
  m_id.textContent = member.id;

  m_name.value = member.name ?? "";
  m_email.value = member.email ?? "";
  m_age.value = member.age ?? "";
  m_group.value = member.groupId ?? "";
  m_renewal.value = member.renewalDate ?? "";
  m_debt.value = member.debt ?? 0;
  m_status.value = member.status ?? "";
  m_note.value = member.note ?? "";
  m_newPass.value = "";

  renderPayments(member);
  m_msg.textContent = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderMemberList(){
  const q = (m_search.value || "").trim().toLowerCase();
  const gFilter = m_filterGroup.value;
  const gb = groupById();

  const list = store.members
    .filter(m=>{
      const hit = !q || (m.name||"").toLowerCase().includes(q) || (m.id||"").toLowerCase().includes(q) || (m.email||"").toLowerCase().includes(q);
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
      <td class="p-3">${escapeHtml(m.email ?? "-")}</td>
      <td class="p-3">${escapeHtml(groupLabel(g))}</td>
      <td class="p-3">${escapeHtml(m.renewalDate ?? "-")}</td>
      <td class="p-3">${escapeHtml(String(Number(m.debt) || 0))}</td>
      <td class="p-3">${escapeHtml(memberLastPayment(m))}</td>
      <td class="p-3">
        <button class="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-semibold">فتح</button>
      </td>
    `;
    tr.querySelector("button").addEventListener("click", ()=> loadMemberToForm(m));
    m_rows.appendChild(tr);
  });

  m_meta.textContent = `عدد اللاعبين: ${list.length}`;
}

function randomPassword(len=10){
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$";
  const b = new Uint8Array(len);
  crypto.getRandomValues(b);
  let s = "";
  for(let i=0;i<len;i++) s += chars[b[i] % chars.length];
  return s;
}

async function copyText(text){
  await navigator.clipboard.writeText(text);
}

// إظهار/إخفاء كلمة المرور
m_togglePass.addEventListener("click", ()=>{
  if(m_newPass.type === "password") m_newPass.type = "text";
  else m_newPass.type = "password";
});

// توليد + إظهار مباشرة
m_genPass.addEventListener("click", async ()=>{
  m_newPass.value = randomPassword(10);
  m_newPass.type = "text"; // عشان تشوفها
  try{
    await copyText(m_newPass.value);
    m_msg.textContent = "تم توليد كلمة المرور ونسخها ✅";
  }catch{
    m_msg.textContent = "تم توليد كلمة المرور ✅";
  }
});

// نسخ
m_copyPass.addEventListener("click", async ()=>{
  if(!m_newPass.value){
    m_msg.textContent = "لا توجد كلمة مرور للنسخ.";
    return;
  }
  try{
    await copyText(m_newPass.value);
    m_msg.textContent = "تم النسخ ✅";
  }catch{
    m_msg.textContent = "لم يتم النسخ.";
  }
});

// CRUD player
m_reset.addEventListener("click", resetMemberForm);

m_save.addEventListener("click", async ()=>{
  m_msg.textContent = "";
  const name = (m_name.value || "").trim();
  const email = (m_email.value || "").trim();
  const age = m_age.value === "" ? null : Number(m_age.value);
  const groupId = (m_group.value || "").trim();
  const renewalDate = (m_renewal.value || "").trim();
  const debt = m_debt.value === "" ? 0 : Number(m_debt.value);
  const status = (m_status.value || "").trim();
  const note = (m_note.value || "").trim();
  const newPass = (m_newPass.value || "").trim();

  if(!name){ m_msg.textContent = "الاسم مطلوب."; return; }
  if(!email){ m_msg.textContent = "الإيميل مطلوب."; return; }
  if(age != null && (Number.isNaN(age) || age < 0)){ m_msg.textContent = "سن غير صحيح."; return; }
  if(Number.isNaN(debt)){ m_msg.textContent = "مديونية غير صحيحة."; return; }

  const emailLower = email.toLowerCase();
  const emailTaken = store.members.some(m => (m.email||"").toLowerCase() === emailLower && m.id !== currentMemberId);
  if(emailTaken){ m_msg.textContent = "الإيميل مستخدم بالفعل."; return; }

  if(currentMemberId){
    const idx = store.members.findIndex(x => x.id === currentMemberId);
    if(idx === -1){ m_msg.textContent = "اللاعب غير موجود."; return; }

    const oldAuth = store.members[idx].auth || null;
    let auth = oldAuth;
    if(newPass){
      const salt = window.__DS_CRYPTO__.newSaltHex(16);
      const hash = await window.__DS_CRYPTO__.hashPassword(newPass, salt);
      auth = { salt, hash };
    }

    store.members[idx] = {
      ...store.members[idx],
      name, email, age, groupId, renewalDate, debt, status, note,
      auth,
      updatedAt: nowIso()
    };
    saveStore();
    m_msg.textContent = "تم الحفظ ✅";
  }else{
    const id = randId("M");
    let auth = null;
    if(newPass){
      const salt = window.__DS_CRYPTO__.newSaltHex(16);
      const hash = await window.__DS_CRYPTO__.hashPassword(newPass, salt);
      auth = { salt, hash };
    }
    store.members.push({
      id, name, email, age, groupId, renewalDate, debt, status, note,
      auth,
      payments: [],
      createdAt: nowIso(),
      updatedAt: nowIso()
    });
    currentMemberId = id;
    m_id.textContent = id;
    saveStore();
    m_msg.textContent = "تم الإنشاء ✅";
  }

  m_newPass.value = "";
  // ارجع الحقل يخفي بعد الحفظ
  m_newPass.type = "password";

  renderMemberList();
  renderStats();
});

m_delete.addEventListener("click", ()=>{
  if(!currentMemberId){ m_msg.textContent = "اختر لاعب أولاً."; return; }
  const ok = confirm("حذف اللاعب؟");
  if(!ok) return;

  store.members = store.members.filter(m => m.id !== currentMemberId);
  saveStore();
  resetMemberForm();
  renderMemberList();
  renderStats();
  m_msg.textContent = "تم الحذف ✅";
});

// Payments
p_add.addEventListener("click", ()=>{
  if(!currentMemberId){ m_msg.textContent = "اختر لاعب أولاً."; return; }
  const amount = Number(p_amount.value || 0);
  const date = (p_date.value || "").trim();
  if(!amount || !date){ m_msg.textContent = "المبلغ والتاريخ مطلوبين."; return; }

  const m = store.members.find(x => x.id === currentMemberId);
  if(!m){ m_msg.textContent = "اللاعب غير موجود."; return; }

  m.payments = Array.isArray(m.payments) ? m.payments : [];
  m.payments.push({ amount, date });
  m.updatedAt = nowIso();
  saveStore();

  p_amount.value = "";
  p_date.value = "";

  renderPayments(m);
  renderMemberList();
  renderStats();
  m_msg.textContent = "تمت إضافة دفعة ✅";
});

// filters
m_search.addEventListener("input", renderMemberList);
m_filterGroup.addEventListener("change", renderMemberList);

// ---------- Groups CRUD ----------
function resetGroupForm(){
  currentGroupId = null;
  g_id.textContent = "—";
  g_sport.value = "";
  g_name.value = "";
  g_minAge.value = "";
  g_maxAge.value = "";
  g_note.value = "";
  g_msg.textContent = "";
}
function loadGroupToForm(group){
  currentGroupId = group.id;
  g_id.textContent = group.id;
  g_sport.value = group.sport ?? "";
  g_name.value = group.name ?? "";
  g_minAge.value = group.minAge ?? "";
  g_maxAge.value = group.maxAge ?? "";
  g_note.value = group.note ?? "";
  g_msg.textContent = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
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
      const t = `${g.id} ${g.sport||""} ${g.name||""}`.toLowerCase();
      return t.includes(q);
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
        <button class="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-semibold">فتح</button>
      </td>
    `;
    tr.querySelector("button").addEventListener("click", ()=> loadGroupToForm(g));
    g_rows.appendChild(tr);
  });

  g_meta.textContent = `عدد المجموعات: ${list.length}`;
}

g_reset.addEventListener("click", resetGroupForm);

g_save.addEventListener("click", ()=>{
  g_msg.textContent = "";
  const sport = (g_sport.value || "").trim();
  const name = (g_name.value || "").trim();
  const minAge = g_minAge.value === "" ? null : Number(g_minAge.value);
  const maxAge = g_maxAge.value === "" ? null : Number(g_maxAge.value);
  const note = (g_note.value || "").trim();

  if(!sport || !name){ g_msg.textContent = "الرياضة واسم المجموعة مطلوبين."; return; }
  if((minAge != null && Number.isNaN(minAge)) || (maxAge != null && Number.isNaN(maxAge))){ g_msg.textContent = "سن غير صحيح."; return; }
  if(minAge != null && maxAge != null && minAge > maxAge){ g_msg.textContent = "أقل سن يجب أن يكون ≤ أكبر سن."; return; }

  if(currentGroupId){
    const idx = store.groups.findIndex(x => x.id === currentGroupId);
    if(idx === -1){ g_msg.textContent = "المجموعة غير موجودة."; return; }
    store.groups[idx] = { ...store.groups[idx], sport, name, minAge, maxAge, note, updatedAt: nowIso() };
    saveStore();
    g_msg.textContent = "تم الحفظ ✅";
  }else{
    const id = randId("G");
    store.groups.push({ id, sport, name, minAge, maxAge, note, createdAt: nowIso(), updatedAt: nowIso() });
    currentGroupId = id;
    g_id.textContent = id;
    saveStore();
    g_msg.textContent = "تم الإنشاء ✅";
  }

  refreshGroupDropdowns();
  renderGroupList();
  renderMemberList();
  renderStats();
});

g_delete.addEventListener("click", ()=>{
  if(!currentGroupId){ g_msg.textContent = "اختر مجموعة أولاً."; return; }
  const membersUsing = store.members.filter(m => (m.groupId || "") === currentGroupId).length;
  const ok = confirm(membersUsing ? `يوجد ${membersUsing} لاعب داخل المجموعة. حذفها؟` : "حذف المجموعة؟");
  if(!ok) return;

  store.groups = store.groups.filter(g => g.id !== currentGroupId);
  store.members = store.members.map(m => (m.groupId === currentGroupId) ? ({ ...m, groupId: "" }) : m);
  saveStore();

  resetGroupForm();
  refreshGroupDropdowns();
  renderGroupList();
  renderMemberList();
  renderStats();
  g_msg.textContent = "تم الحذف ✅";
});

g_search.addEventListener("input", renderGroupList);

// ---------- Expenses + Stats ----------
function resetExpenseForm(){
  e_category.value = "";
  e_amount.value = "";
  e_date.value = "";
  e_title.value = "";
  e_note.value = "";
  e_msg.textContent = "";
}

e_clear.addEventListener("click", resetExpenseForm);

e_add.addEventListener("click", ()=>{
  e_msg.textContent = "";
  const category = (e_category.value || "").trim();
  const amount = Number(e_amount.value || 0);
  const date = (e_date.value || "").trim();
  const title = (e_title.value || "").trim();
  const note = (e_note.value || "").trim();

  if(!category){ e_msg.textContent = "النوع مطلوب."; return; }
  if(!amount || Number.isNaN(amount)){ e_msg.textContent = "المبلغ مطلوب."; return; }
  if(!date){ e_msg.textContent = "التاريخ مطلوب."; return; }
  if(!title){ e_msg.textContent = "العنوان مطلوب."; return; }

  store.expenses.push({
    id: randId("E"),
    category, amount, date, title, note,
    createdAt: nowIso()
  });
  saveStore();
  resetExpenseForm();
  renderExpensesList();
  renderStats();
  e_msg.textContent = "تمت الإضافة ✅";
});

function renderExpensesList(){
  const q = (e_search.value || "").trim().toLowerCase();
  const list = (store.expenses || [])
    .filter(e=>{
      if(!q) return true;
      const t = `${e.category||""} ${e.title||""} ${e.note||""} ${e.date||""}`.toLowerCase();
      return t.includes(q);
    })
    .sort((a,b)=> (b.date||"").localeCompare(a.date||""));

  e_rows.innerHTML = "";
  if(!list.length){
    const tr = document.createElement("tr");
    tr.innerHTML = `<td class="p-3 text-slate-500" colspan="6">لا توجد مصاريف</td>`;
    e_rows.appendChild(tr);
    return;
  }

  list.forEach(e=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="p-3">${escapeHtml(e.date ?? "-")}</td>
      <td class="p-3">${escapeHtml(e.category ?? "-")}</td>
      <td class="p-3 font-semibold">${escapeHtml(e.title ?? "-")}</td>
      <td class="p-3">${escapeHtml(formatMoney(e.amount))}</td>
      <td class="p-3 text-slate-300">${escapeHtml(e.note ?? "")}</td>
      <td class="p-3">
        <button class="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-sm font-semibold">حذف</button>
      </td>
    `;
    tr.querySelector("button").addEventListener("click", ()=>{
      const ok = confirm("حذف هذا المصروف؟");
      if(!ok) return;
      store.expenses = store.expenses.filter(x => x.id !== e.id);
      saveStore();
      renderExpensesList();
      renderStats();
    });
    e_rows.appendChild(tr);
  });
}

e_search.addEventListener("input", renderExpensesList);

function sumPayments(fromStr, toStr){
  let total = 0;
  (store.members || []).forEach(m=>{
    (m.payments || []).forEach(p=>{
      if(fromStr || toStr){
        if(!inRange(p.date, fromStr, toStr)) return;
      }
      total += Number(p.amount) || 0;
    });
  });
  return total;
}

function sumExpenses(fromStr, toStr){
  let total = 0;
  (store.expenses || []).forEach(e=>{
    if(fromStr || toStr){
      if(!inRange(e.date, fromStr, toStr)) return;
    }
    total += Number(e.amount) || 0;
  });
  return total;
}

function monthKey(dateStr){
  // YYYY-MM-DD -> YYYY-MM
  if(!dateStr || dateStr.length < 7) return "—";
  return dateStr.slice(0, 7);
}

function buildMonthly(fromStr, toStr){
  const byMonth = {};
  // income
  (store.members || []).forEach(m=>{
    (m.payments || []).forEach(p=>{
      if(fromStr || toStr){
        if(!inRange(p.date, fromStr, toStr)) return;
      }
      const k = monthKey(p.date);
      byMonth[k] = byMonth[k] || { income:0, expenses:0 };
      byMonth[k].income += Number(p.amount) || 0;
    });
  });
  // expenses
  (store.expenses || []).forEach(e=>{
    if(fromStr || toStr){
      if(!inRange(e.date, fromStr, toStr)) return;
    }
    const k = monthKey(e.date);
    byMonth[k] = byMonth[k] || { income:0, expenses:0 };
    byMonth[k].expenses += Number(e.amount) || 0;
  });

  const keys = Object.keys(byMonth).filter(k=>k!=="—").sort((a,b)=> b.localeCompare(a));
  return keys.map(k => ({ month:k, income:byMonth[k].income, expenses:byMonth[k].expenses, net: byMonth[k].income - byMonth[k].expenses }));
}

function renderMonthlyTable(fromStr, toStr){
  const rows = buildMonthly(fromStr, toStr);
  s_monthRows.innerHTML = "";
  if(!rows.length){
    const tr = document.createElement("tr");
    tr.innerHTML = `<td class="p-3 text-slate-500" colspan="4">لا يوجد بيانات للفترة المختارة</td>`;
    s_monthRows.appendChild(tr);
    s_meta.textContent = "";
    return;
  }
  rows.forEach(r=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="p-3 font-semibold">${escapeHtml(r.month)}</td>
      <td class="p-3">${escapeHtml(formatMoney(r.income))}</td>
      <td class="p-3">${escapeHtml(formatMoney(r.expenses))}</td>
      <td class="p-3">${escapeHtml(formatMoney(r.net))}</td>
    `;
    s_monthRows.appendChild(tr);
  });
  s_meta.textContent = `عدد الشهور: ${rows.length}`;
}

function renderStats(){
  const fromStr = (s_from.value || "").trim();
  const toStr = (s_to.value || "").trim();

  const income = sumPayments(fromStr, toStr);
  const expenses = sumExpenses(fromStr, toStr);
  const net = income - expenses;

  k_income.textContent = formatMoney(income);
  k_expenses.textContent = formatMoney(expenses);
  k_net.textContent = formatMoney(net);
  k_members.textContent = String((store.members || []).length);

  renderMonthlyTable(fromStr, toStr);
}

s_apply.addEventListener("click", renderStats);
s_reset.addEventListener("click", ()=>{
  s_from.value = "";
  s_to.value = "";
  renderStats();
});

function downloadText(filename, text, mime="application/json;charset=utf-8"){
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

s_export_csv.addEventListener("click", ()=>{
  const fromStr = (s_from.value || "").trim();
  const toStr = (s_to.value || "").trim();
  const rows = buildMonthly(fromStr, toStr);
  const header = "month,income,expenses,net";
  const lines = rows.map(r => `${r.month},${r.income},${r.expenses},${r.net}`);
  downloadText("stats.csv", [header, ...lines].join("\n"), "text/csv;charset=utf-8");
});

// ---------- Export / Import / Repo ----------
async function fetchRepoData(){
  const res = await fetch(`${DATA_URL}?t=${Date.now()}`, { cache:"no-store" });
  if(!res.ok) throw new Error("fetch");
  return await res.json();
}

function exportJson(){
  return JSON.stringify({
    updatedAt: nowIso(),
    groups: store.groups,
    members: store.members,
    expenses: store.expenses
  }, null, 2);
}

ex_download.addEventListener("click", ()=>{
  downloadText("club-data.json", exportJson());
  ex_msg.textContent = "تم التحميل ✅";
});

ex_copy.addEventListener("click", async ()=>{
  try{
    await copyText(exportJson());
    ex_msg.textContent = "تم النسخ ✅";
  }catch{
    ex_msg.textContent = "لم يتم النسخ.";
  }
});

ex_loadRepo.addEventListener("click", async ()=>{
  ex_msg.textContent = "";
  try{
    const data = await fetchRepoData();
    store = normalizeStore(data);
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
    saveStore();
    resetGroupForm(); resetMemberForm(); resetExpenseForm();
    refreshGroupDropdowns();
    renderGroupList(); renderMemberList(); renderExpensesList(); renderStats();
    ex_msg.textContent = "تم التحميل ✅";
  }catch{
    ex_msg.textContent = "فشل التحميل.";
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
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
    saveStore();
    resetGroupForm(); resetMemberForm(); resetExpenseForm();
    refreshGroupDropdowns();
    renderGroupList(); renderMemberList(); renderExpensesList(); renderStats();
    ex_msg.textContent = "تم الاستيراد ✅";
  }catch{
    ex_msg.textContent = "ملف غير صالح.";
  }finally{
    ex_importFile.value = "";
  }
});

// ---------- Backups ----------
function renderBackups(){
  bk_rows.innerHTML = "";
  const list = [...backups].sort((a,b)=> (b.at||"").localeCompare(a.at||""));
  if(!list.length){
    const tr = document.createElement("tr");
    tr.innerHTML = `<td class="p-3 text-slate-500" colspan="4">لا توجد نسخ احتياطية</td>`;
    bk_rows.appendChild(tr);
    bk_meta.textContent = "";
    return;
  }

  list.forEach(bk=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="p-3">${escapeHtml(bk.at || "-")}</td>
      <td class="p-3">${escapeHtml(String(bk.groupsCount ?? 0))}</td>
      <td class="p-3">${escapeHtml(String(bk.membersCount ?? 0))}</td>
      <td class="p-3">
        <div class="flex gap-2 flex-wrap">
          <button class="btnRestore px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-semibold">استرجاع</button>
          <button class="btnDownload px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-sm font-semibold">تحميل</button>
          <button class="btnDelete px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-sm font-semibold">حذف</button>
        </div>
      </td>
    `;
    tr.querySelector(".btnRestore").addEventListener("click", ()=>{
      const ok = confirm("استرجاع النسخة الاحتياطية؟");
      if(!ok) return;
      store = normalizeStore(bk.data);
      localStorage.setItem(STORE_KEY, JSON.stringify(store));
      saveStore();
      resetGroupForm(); resetMemberForm(); resetExpenseForm();
      refreshGroupDropdowns();
      renderGroupList(); renderMemberList(); renderExpensesList(); renderStats();
      bk_msg.textContent = "تم الاسترجاع ✅";
    });
    tr.querySelector(".btnDownload").addEventListener("click", ()=>{
      downloadText(`backup-${(bk.at||"").replaceAll(":", "-")}.json`, JSON.stringify(bk.data, null, 2));
      bk_msg.textContent = "تم التحميل ✅";
    });
    tr.querySelector(".btnDelete").addEventListener("click", ()=>{
      const ok = confirm("حذف النسخة الاحتياطية؟");
      if(!ok) return;
      backups = backups.filter(x => x.id !== bk.id);
      saveBackups();
      renderBackups();
      bk_msg.textContent = "تم الحذف ✅";
    });
    bk_rows.appendChild(tr);
  });

  bk_meta.textContent = `عدد النسخ: ${list.length}`;
}

bk_create.addEventListener("click", ()=>{
  const snapshot = { updatedAt: nowIso(), groups: store.groups, members: store.members, expenses: store.expenses };
  const item = {
    id: randId("BK"),
    at: nowIso(),
    groupsCount: store.groups.length,
    membersCount: store.members.length,
    data: snapshot
  };
  backups.push(item);
  backups = backups.slice(-30);
  saveBackups();
  renderBackups();
  bk_msg.textContent = "تم إنشاء نسخة ✅";
});

bk_clear.addEventListener("click", ()=>{
  const ok = confirm("حذف كل النسخ الاحتياطية؟");
  if(!ok) return;
  backups = [];
  saveBackups();
  renderBackups();
  bk_msg.textContent = "تم الحذف ✅";
});

// ---------- Login ----------
const ADMIN_EMAIL = "admin@designsociety.website";
const ADMIN_PASS = "adminroot";

a_loginBtn.addEventListener("click", ()=>{
  a_loginMsg.textContent = "";
  const email = (a_email.value || "").trim().toLowerCase();
  const pass = (a_pass.value || "").trim();

  if(email === ADMIN_EMAIL && pass === ADMIN_PASS){
    isAuthed = true;
    showDash();
    boot();
  }else{
    a_loginMsg.textContent = "بيانات الدخول غير صحيحة.";
  }
});

logoutBtn.addEventListener("click", ()=>{
  isAuthed = false;
  a_email.value = "";
  a_pass.value = "";
  showLogin();
});

// ---------- Boot ----------
function boot(){
  openTab("players");
  storeStamp.textContent = store.updatedAt ? `آخر تحديث: ${store.updatedAt}` : "";
  refreshGroupDropdowns();
  renderGroupList();
  renderMemberList();
  renderPayments(null);
  renderExpensesList();
  renderStats();
  renderBackups();
  resetMemberForm();
  resetGroupForm();
  resetExpenseForm();
}

showLogin();
