const DATA_URL = "club-data.json";
const STORE_KEY = "ds_club_store_v6"; // نفس المفتاح المستخدم في لوحة الأدمن

const loginBox = document.getElementById("loginBox");
const dash = document.getElementById("dash");

const codeEl = document.getElementById("code");
const loginBtn = document.getElementById("loginBtn");
const loginMsg = document.getElementById("loginMsg");

const memberName = document.getElementById("memberName");
const memberGroup = document.getElementById("memberGroup");

const ageKpi = document.getElementById("ageKpi");
const renewKpi = document.getElementById("renewKpi");
const renewHint = document.getElementById("renewHint");
const debtKpi = document.getElementById("debtKpi");
const statusKpi = document.getElementById("statusKpi");
const noteBox = document.getElementById("noteBox");

const payRows = document.getElementById("payRows");
const updatedAtEl = document.getElementById("updatedAt");

const refreshBtn = document.getElementById("refreshBtn");
const logoutBtn = document.getElementById("logoutBtn");

let currentCode = null; // في الذاكرة فقط (كل Refresh يحتاج تسجيل دخول)

function showLogin(){
  loginBox.classList.remove("hidden");
  dash.classList.add("hidden");
}
function showDash(){
  loginBox.classList.add("hidden");
  dash.classList.remove("hidden");
}

function parseDateYMD(s){
  if(!s) return null;
  const d = new Date(s + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}
function daysDiff(a, b){
  const ms = 24 * 60 * 60 * 1000;
  return Math.floor((a - b) / ms);
}
function groupLabel(groups, groupId){
  const g = (groups || []).find(x => x.id === groupId);
  if(!g) return "—";
  const range = (g.minAge != null && g.maxAge != null) ? ` (${g.minAge}-${g.maxAge})` : "";
  return `${g.sport || "رياضة"} — ${g.name || "مجموعة"}${range}`;
}
function escapeHtml(s){
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function renderPayments(payments){
  payRows.innerHTML = "";
  const list = Array.isArray(payments) ? payments : [];
  if(!list.length){
    const tr = document.createElement("tr");
    tr.innerHTML = `<td class="p-3 text-slate-500" colspan="2">لا توجد دفعات</td>`;
    payRows.appendChild(tr);
    return;
  }
  const sorted = [...list].sort((a,b)=> (b.date||"").localeCompare(a.date||""));
  sorted.forEach(p=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="p-3">${escapeHtml(p.date ?? "-")}</td>
      <td class="p-3">${escapeHtml(String(p.amount ?? "-"))}</td>
    `;
    payRows.appendChild(tr);
  });
}

function renderMember(data, member){
  memberName.textContent = member.name || "—";
  memberGroup.textContent = groupLabel(data.groups || [], member.groupId);

  ageKpi.textContent = (member.age ?? "—");
  renewKpi.textContent = (member.renewalDate || "—");

  const today = new Date();
  const rd = parseDateYMD(member.renewalDate);
  if(rd){
    const diff = daysDiff(rd, today);
    if(diff < 0) renewHint.textContent = `متأخر ${Math.abs(diff)} يوم`;
    else renewHint.textContent = `متبقي ${diff} يوم`;
  }else{
    renewHint.textContent = "—";
  }

  debtKpi.textContent = String(Number(member.debt) || 0);
  statusKpi.textContent = member.status || "—";
  noteBox.textContent = member.note || "—";

  updatedAtEl.textContent = data.updatedAt ? `آخر تحديث: ${data.updatedAt}` : "";
  renderPayments(member.payments);
}

function normalizeStore(data){
  return {
    updatedAt: data.updatedAt || null,
    groups: Array.isArray(data.groups) ? data.groups : [],
    members: Array.isArray(data.members) ? data.members : [],
    expenses: Array.isArray(data.expenses) ? data.expenses : []
  };
}

function readLocalStore(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(!raw) return null;
    return normalizeStore(JSON.parse(raw));
  }catch{
    return null;
  }
}

async function fetchRepoData(){
  const res = await fetch(`${DATA_URL}?t=${Date.now()}`, { cache: "no-store" });
  if(!res.ok) throw new Error("fetch");
  return normalizeStore(await res.json());
}

async function fetchDataPreferLocal(){
  // 1) لو الأدمن عدّل من نفس الجهاز → البيانات موجودة في localStorage
  const local = readLocalStore();
  if(local && (local.members?.length || local.groups?.length || local.expenses?.length)) return local;

  // 2) غير كده اقرأ من ملف الريبو
  return await fetchRepoData();
}

async function authenticate(code){
  const data = await fetchDataPreferLocal();
  const members = Array.isArray(data.members) ? data.members : [];
  const member = members.find(m => String(m.code || "").trim() === String(code).trim());
  if(!member) return { ok:false, msg:"بيانات الدخول غير صحيحة." };
  return { ok:true, data, member };
}

loginBtn.addEventListener("click", async ()=>{
  loginMsg.textContent = "";
  const code = (codeEl.value || "").trim();
  if(!code){
    loginMsg.textContent = "ادخل كود اللاعب.";
    return;
  }

  loginBtn.disabled = true;
  try{
    const r = await authenticate(code);
    if(!r.ok){
      loginMsg.textContent = r.msg;
      return;
    }
    currentCode = code;
    renderMember(r.data, r.member);
    showDash();
  }catch{
    loginMsg.textContent = "حدث خطأ أثناء تحميل البيانات.";
  }finally{
    loginBtn.disabled = false;
  }
});

refreshBtn.addEventListener("click", async ()=>{
  if(!currentCode){
    showLogin();
    return;
  }
  try{
    const r = await authenticate(currentCode);
    if(!r.ok){
      showLogin();
      return;
    }
    renderMember(r.data, r.member);
  }catch{
    // ignore
  }
});

logoutBtn.addEventListener("click", ()=>{
  currentCode = null;
  codeEl.value = "";
  showLogin();
});

showLogin();
