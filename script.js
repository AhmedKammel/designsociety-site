// script.js
(() => {
  "use strict";

  /* =========================
     CONFIG
  ========================= */
  const STORAGE_KEY = "scms_db_v1";
  const SESSION_KEY = "scms_session_v1";

  const ADMIN_CREDS = {
    username: "adminahmed",
    password: "ahmedkammel##",
  };

  const DEFAULT_GROUPS = ["Morning A", "Evening B"];

  const SUBSCRIPTIONS = [
    { key: "Monthly", months: 1, price: 500 },
    { key: "Quarterly", months: 3, price: 1350 },
    { key: "Yearly", months: 12, price: 4800 },
  ];

  const CURRENCY = "EGP";

  /* =========================
     STATE
  ========================= */
  const state = {
    db: null,
    session: null,

    adminPage: "dashboard",
    memberSearch: "",
    lastGeneratedCode: null,
  };

  /* =========================
     DOM
  ========================= */
  const el = {
    // views
    viewLogin: document.getElementById("viewLogin"),
    viewAdmin: document.getElementById("viewAdmin"),
    viewPlayer: document.getElementById("viewPlayer"),

    // login tabs
    tabAdmin: document.getElementById("tabAdmin"),
    tabPlayer: document.getElementById("tabPlayer"),
    panelAdmin: document.getElementById("panelAdmin"),
    panelPlayer: document.getElementById("panelPlayer"),

    adminLoginForm: document.getElementById("adminLoginForm"),
    adminUsername: document.getElementById("adminUsername"),
    adminPassword: document.getElementById("adminPassword"),

    playerLoginForm: document.getElementById("playerLoginForm"),
    playerCode: document.getElementById("playerCode"),

    loginError: document.getElementById("loginError"),

    // admin layout
    sidebar: document.getElementById("sidebar"),
    backdrop: document.getElementById("backdrop"),
    sidebarOpen: document.getElementById("sidebarOpen"),
    sidebarClose: document.getElementById("sidebarClose"),
    adminLogoutBtn: document.getElementById("adminLogoutBtn"),

    adminNow: document.getElementById("adminNow"),
    dbStatus: document.getElementById("dbStatus"),

    adminPageTitle: document.getElementById("adminPageTitle"),
    adminPageSubtitle: document.getElementById("adminPageSubtitle"),

    // pages
    adminPageDashboard: document.getElementById("adminPageDashboard"),
    adminPageMembers: document.getElementById("adminPageMembers"),
    adminPageFinancials: document.getElementById("adminPageFinancials"),
    adminPageSettings: document.getElementById("adminPageSettings"),

    // dashboard stats
    statActiveMembers: document.getElementById("statActiveMembers"),
    statMembersHint: document.getElementById("statMembersHint"),
    statRevenue: document.getElementById("statRevenue"),
    statExpenses: document.getElementById("statExpenses"),
    statProfit: document.getElementById("statProfit"),
    statProfitBadge: document.getElementById("statProfitBadge"),
    statProfitHint: document.getElementById("statProfitHint"),

    barRevenue: document.getElementById("barRevenue"),
    barExpenses: document.getElementById("barExpenses"),
    barNet: document.getElementById("barNet"),
    barRevenueVal: document.getElementById("barRevenueVal"),
    barExpensesVal: document.getElementById("barExpensesVal"),
    barNetVal: document.getElementById("barNetVal"),

    groupsOverview: document.getElementById("groupsOverview"),

    // members
    addPlayerForm: document.getElementById("addPlayerForm"),
    playerNameInput: document.getElementById("playerNameInput"),
    playerAgeInput: document.getElementById("playerAgeInput"),
    playerPhoneInput: document.getElementById("playerPhoneInput"),
    playerGroupSelect: document.getElementById("playerGroupSelect"),
    playerSubscriptionSelect: document.getElementById("playerSubscriptionSelect"),
    playerStartDateInput: document.getElementById("playerStartDateInput"),
    generatedCodeInput: document.getElementById("generatedCodeInput"),
    copyCodeBtn: document.getElementById("copyCodeBtn"),
    memberSearchInput: document.getElementById("memberSearchInput"),
    playersTbody: document.getElementById("playersTbody"),
    playersEmpty: document.getElementById("playersEmpty"),
    exportMembersBtn: document.getElementById("exportMembersBtn"),

    // financials
    finRevenue: document.getElementById("finRevenue"),
    finExpenses: document.getElementById("finExpenses"),
    finProfit: document.getElementById("finProfit"),
    finProfitBadge: document.getElementById("finProfitBadge"),
    finProfitHint: document.getElementById("finProfitHint"),
    finMembers: document.getElementById("finMembers"),

    expenseForm: document.getElementById("expenseForm"),
    expenseAmountInput: document.getElementById("expenseAmountInput"),
    expenseDateInput: document.getElementById("expenseDateInput"),
    expenseNoteInput: document.getElementById("expenseNoteInput"),
    expensesTbody: document.getElementById("expensesTbody"),
    expensesEmpty: document.getElementById("expensesEmpty"),

    // settings
    exportDbBtn: document.getElementById("exportDbBtn"),
    importDbFile: document.getElementById("importDbFile"),
    importDbBtn: document.getElementById("importDbBtn"),
    newGroupInput: document.getElementById("newGroupInput"),
    addGroupBtn: document.getElementById("addGroupBtn"),
    groupsList: document.getElementById("groupsList"),
    resetDbBtn: document.getElementById("resetDbBtn"),

    // player
    playerNow: document.getElementById("playerNow"),
    playerLogoutBtn: document.getElementById("playerLogoutBtn"),
    playerAvatarLetter: document.getElementById("playerAvatarLetter"),
    playerGreetingName: document.getElementById("playerGreetingName"),
    playerCodeText: document.getElementById("playerCodeText"),
    playerGroupText: document.getElementById("playerGroupText"),
    playerValidUntil: document.getElementById("playerValidUntil"),
    playerStatusBadge: document.getElementById("playerStatusBadge"),
    playerSubType: document.getElementById("playerSubType"),

    checkInBtn: document.getElementById("checkInBtn"),
    attendanceList: document.getElementById("attendanceList"),
    attendanceEmpty: document.getElementById("attendanceEmpty"),
    attendanceCount: document.getElementById("attendanceCount"),
    paymentTbody: document.getElementById("paymentTbody"),
    paymentsEmpty: document.getElementById("paymentsEmpty"),

    // modal
    modalOverlay: document.getElementById("modalOverlay"),
    modalTitle: document.getElementById("modalTitle"),
    modalSubtitle: document.getElementById("modalSubtitle"),
    modalBody: document.getElementById("modalBody"),
    modalCloseBtn: document.getElementById("modalCloseBtn"),
    modalSecondaryBtn: document.getElementById("modalSecondaryBtn"),
    modalPrimaryBtn: document.getElementById("modalPrimaryBtn"),

    // toasts
    toasts: document.getElementById("toasts"),
  };

  /* =========================
     UTIL
  ========================= */
  const safeUUID = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    // fallback
    return "id_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
  };

  const pad6 = (n) => String(n).padStart(6, "0");

  const todayISO = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const nowHuman = () => {
    const d = new Date();
    return d.toLocaleString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const parseISODate = (iso) => new Date(`${iso}T00:00:00`);

  const toISODate = (dateObj) => {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const addMonthsISO = (iso, months) => {
    const d = parseISODate(iso);
    const day = d.getDate();
    d.setMonth(d.getMonth() + months);
    // handle month overflow (e.g., Jan 31 + 1 month)
    if (d.getDate() !== day) d.setDate(0);
    return toISODate(d);
  };

  const isoToHuman = (iso) => {
    if (!iso) return "—";
    const d = parseISODate(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  };

  const isISOOnOrAfter = (aISO, bISO) => {
    // true if a >= b
    return parseISODate(aISO).getTime() >= parseISODate(bISO).getTime();
  };

  const isThisMonthISO = (iso) => {
    const d = parseISODate(iso);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  };

  const money = (amount) => {
    const n = Number(amount || 0);
    return `${CURRENCY} ${n.toLocaleString(undefined)}`;
  };

  const normalize = (s) => String(s ?? "").trim();

  const toast = (type, title, msg) => {
    const t = document.createElement("div");
    t.className = "toast";

    const dot = document.createElement("div");
    dot.className = `toast__dot toast__dot--${type}`;

    const content = document.createElement("div");
    const h = document.createElement("div");
    h.className = "toast__title";
    h.textContent = title;

    const p = document.createElement("div");
    p.className = "toast__msg";
    p.textContent = msg;

    content.appendChild(h);
    content.appendChild(p);

    t.appendChild(dot);
    t.appendChild(content);

    el.toasts.appendChild(t);

    setTimeout(() => {
      t.style.opacity = "0";
      t.style.transform = "translateY(-4px)";
      t.style.transition = "opacity 200ms ease, transform 200ms ease";
      setTimeout(() => t.remove(), 220);
    }, 3200);
  };

  const showLoginError = (msg) => {
    el.loginError.textContent = msg;
    el.loginError.classList.remove("hidden");
  };

  const clearLoginError = () => {
    el.loginError.textContent = "";
    el.loginError.classList.add("hidden");
  };

  const downloadJSON = (filename, dataObj) => {
    const json = JSON.stringify(dataObj, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 0);
  };

  /* =========================
     DB
  ========================= */
  const defaultDB = () => ({
    meta: {
      version: 1,
      createdAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
    },
    groups: [...DEFAULT_GROUPS],
    expenses: [],
    players: [],
  });

  const loadDB = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      return parsed;
    } catch {
      return null;
    }
  };

  const saveDB = (db) => {
    db.meta = db.meta || {};
    db.meta.lastUpdatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    state.db = db;
  };

  const ensureDB = () => {
    let db = loadDB();
    if (!db) {
      db = defaultDB();
      saveDB(db);
    }
    // ensure minimal shape
    db.groups = Array.isArray(db.groups) ? db.groups : [...DEFAULT_GROUPS];
    db.expenses = Array.isArray(db.expenses) ? db.expenses : [];
    db.players = Array.isArray(db.players) ? db.players : [];
    db.meta = db.meta || { version: 1, createdAt: new Date().toISOString(), lastUpdatedAt: new Date().toISOString() };
    saveDB(db);
    return db;
  };

  /* =========================
     SESSION
  ========================= */
  const loadSession = () => {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      const s = JSON.parse(raw);
      if (!s || typeof s !== "object") return null;
      return s;
    } catch {
      return null;
    }
  };

  const saveSession = (session) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    state.session = session;
  };

  const clearSession = () => {
    sessionStorage.removeItem(SESSION_KEY);
    state.session = null;
  };

  /* =========================
     DOMAIN LOGIC
  ========================= */
  const getSubscription = (key) => SUBSCRIPTIONS.find(s => s.key === key) || SUBSCRIPTIONS[0];

  const playerStatus = (player) => {
    const t = todayISO();
    return isISOOnOrAfter(player.expiryDate, t) ? "Active" : "Expired";
  };

  const generateUniqueCode = (db) => {
    const used = new Set(db.players.map(p => String(p.accessCode)));
    for (let i = 0; i < 2000; i++) {
      const c = pad6(Math.floor(Math.random() * 1000000));
      if (!used.has(c)) return c;
    }
    // fallback deterministic
    let base = 100000;
    while (used.has(String(base))) base++;
    return pad6(base);
  };

  const computeRevenueThisMonth = (db) => {
    let sum = 0;
    for (const p of db.players) {
      const payments = Array.isArray(p.payments) ? p.payments : [];
      for (const pay of payments) {
        if (pay && pay.date && isThisMonthISO(pay.date)) sum += Number(pay.amount || 0);
      }
    }
    return sum;
  };

  const computeExpensesThisMonth = (db) => {
    let sum = 0;
    for (const e of db.expenses) {
      if (e && e.date && isThisMonthISO(e.date)) sum += Number(e.amount || 0);
    }
    return sum;
  };

  const getPlayerByCode = (db, code) => db.players.find(p => String(p.accessCode) === String(code));

  const sortPlayersNameAsc = (players) => {
    return [...players].sort((a, b) => {
      const an = String(a.name || "").toLocaleLowerCase();
      const bn = String(b.name || "").toLocaleLowerCase();
      return an.localeCompare(bn, undefined, { sensitivity: "base" });
    });
  };

  /* =========================
     ROUTING / VIEW
  ========================= */
  const showView = (which) => {
    el.viewLogin.classList.toggle("view--active", which === "login");
    el.viewAdmin.classList.toggle("view--active", which === "admin");
    el.viewPlayer.classList.toggle("view--active", which === "player");
  };

  const setAdminPage = (page) => {
    state.adminPage = page;

    // nav active
    const navBtns = el.sidebar.querySelectorAll("[data-admin-page]");
    navBtns.forEach(btn => btn.classList.toggle("nav__item--active", btn.dataset.adminPage === page));

    // pages
    const map = {
      dashboard: el.adminPageDashboard,
      members: el.adminPageMembers,
      financials: el.adminPageFinancials,
      settings: el.adminPageSettings,
    };

    Object.entries(map).forEach(([k, node]) => {
      node.classList.toggle("page--active", k === page);
    });

    // title/subtitle
    const titles = {
      dashboard: { t: "Dashboard", s: "Overview & analytics" },
      members: { t: "Members", s: "Add, edit, renew & assign groups" },
      financials: { t: "Financials", s: "Revenue, expenses & monthly profit" },
      settings: { t: "Settings", s: "Backup, restore & manage groups" },
    };

    el.adminPageTitle.textContent = titles[page]?.t || "Dashboard";
    el.adminPageSubtitle.textContent = titles[page]?.s || "";

    // close sidebar on mobile
    closeSidebar();
    renderAll();
  };

  const openSidebar = () => {
    el.sidebar.classList.add("sidebar--open");
    el.backdrop.classList.remove("hidden");
  };
  const closeSidebar = () => {
    el.sidebar.classList.remove("sidebar--open");
    el.backdrop.classList.add("hidden");
  };

  /* =========================
     MODAL
  ========================= */
  const modalState = {
    type: null,
    playerId: null,
    expenseId: null,
    onConfirm: null,
  };

  const openModal = ({ title, subtitle = "", bodyHTML = "", primaryText = "Save", secondaryText = "Cancel", onConfirm }) => {
    el.modalTitle.textContent = title;
    el.modalSubtitle.textContent = subtitle;
    el.modalBody.innerHTML = bodyHTML;

    el.modalPrimaryBtn.textContent = primaryText;
    el.modalSecondaryBtn.textContent = secondaryText;

    modalState.onConfirm = onConfirm;

    el.modalOverlay.classList.remove("hidden");

    // focus first input if exists
    setTimeout(() => {
      const first = el.modalBody.querySelector("input, select, textarea, button");
      if (first) first.focus();
    }, 0);
  };

  const closeModal = () => {
    el.modalOverlay.classList.add("hidden");
    el.modalBody.innerHTML = "";
    modalState.type = null;
    modalState.playerId = null;
    modalState.expenseId = null;
    modalState.onConfirm = null;
  };

  /* =========================
     RENDER
  ========================= */
  const renderNow = () => {
    if (el.adminNow) el.adminNow.textContent = nowHuman();
    if (el.playerNow) el.playerNow.textContent = nowHuman();
  };

  const renderSubscriptionOptions = () => {
    // members form select
    el.playerSubscriptionSelect.innerHTML = "";
    for (const s of SUBSCRIPTIONS) {
      const opt = document.createElement("option");
      opt.value = s.key;
      opt.textContent = `${s.key} — ${money(s.price)}`;
      el.playerSubscriptionSelect.appendChild(opt);
    }
  };

  const renderGroupOptions = () => {
    const groups = Array.isArray(state.db.groups) ? state.db.groups : [];
    const ensure = groups.length ? groups : [...DEFAULT_GROUPS];

    el.playerGroupSelect.innerHTML = "";
    for (const g of ensure) {
      const opt = document.createElement("option");
      opt.value = g;
      opt.textContent = g;
      el.playerGroupSelect.appendChild(opt);
    }
  };

  const renderDashboard = () => {
    const db = state.db;

    const totalMembers = db.players.length;
    const activeCount = db.players.filter(p => playerStatus(p) === "Active").length;
    const expiredCount = totalMembers - activeCount;

    const revenue = computeRevenueThisMonth(db);
    const expenses = computeExpensesThisMonth(db);
    const profit = revenue - expenses;

    el.statActiveMembers.textContent = String(activeCount);
    el.statMembersHint.textContent = `${expiredCount} expired`;

    el.statRevenue.textContent = money(revenue);
    el.statExpenses.textContent = money(expenses);
    el.statProfit.textContent = money(profit);

    if (profit >= 0) {
      el.statProfitBadge.className = "badge badge--success";
      el.statProfitBadge.textContent = "Profit";
      el.statProfitHint.textContent = "Positive net profit";
      el.barNet.className = "barFill barFill--success";
    } else {
      el.statProfitBadge.className = "badge badge--danger";
      el.statProfitBadge.textContent = "Loss";
      el.statProfitHint.textContent = "Negative net profit";
      el.barNet.className = "barFill barFill--danger"; // not defined, but fallback; keep width only
    }

    // bars
    const max = Math.max(revenue, expenses, Math.abs(profit), 1);
    const rPct = Math.round((revenue / max) * 100);
    const ePct = Math.round((expenses / max) * 100);
    const nPct = Math.round((Math.abs(profit) / max) * 100);

    el.barRevenue.style.width = `${rPct}%`;
    el.barExpenses.style.width = `${ePct}%`;
    el.barNet.style.width = `${nPct}%`;

    el.barRevenueVal.textContent = money(revenue);
    el.barExpensesVal.textContent = money(expenses);
    el.barNetVal.textContent = money(profit);

    // groups overview
    const groupCounts = {};
    for (const g of db.groups) groupCounts[g] = 0;
    for (const p of db.players) {
      const g = p.group || "—";
      groupCounts[g] = (groupCounts[g] || 0) + 1;
    }

    const entries = Object.entries(groupCounts).sort((a, b) => a[0].localeCompare(b[0]));
    el.groupsOverview.innerHTML = "";

    const maxGroup = Math.max(...entries.map(([, c]) => c), 1);

    for (const [g, c] of entries) {
      const wrap = document.createElement("div");
      wrap.className = "groupBar";

      const top = document.createElement("div");
      top.className = "groupBar__top";

      const name = document.createElement("div");
      name.className = "groupBar__name";
      name.textContent = g;

      const count = document.createElement("div");
      count.className = "groupBar__count";
      count.textContent = `${c} member${c === 1 ? "" : "s"}`;

      top.appendChild(name);
      top.appendChild(count);

      const track = document.createElement("div");
      track.className = "groupBar__track";

      const fill = document.createElement("div");
      fill.className = "groupBar__fill";
      fill.style.width = `${Math.round((c / maxGroup) * 100)}%`;

      track.appendChild(fill);

      wrap.appendChild(top);
      wrap.appendChild(track);

      el.groupsOverview.appendChild(wrap);
    }
  };

  const renderPlayersTable = () => {
    const db = state.db;
    const search = normalize(state.memberSearch).toLowerCase();

    let players = sortPlayersNameAsc(db.players);

    if (search) {
      players = players.filter(p => {
        const hay = `${p.name} ${p.phone} ${p.accessCode}`.toLowerCase();
        return hay.includes(search);
      });
    }

    el.playersTbody.innerHTML = "";

    if (!players.length) {
      el.playersEmpty.classList.remove("hidden");
      return;
    }
    el.playersEmpty.classList.add("hidden");

    for (const p of players) {
      const tr = document.createElement("tr");
      const status = playerStatus(p);

      const tdName = document.createElement("td");
      tdName.textContent = p.name;

      const tdCode = document.createElement("td");
      tdCode.innerHTML = `<span class="mono">${String(p.accessCode)}</span>`;

      const tdGroup = document.createElement("td");
      const groupSelect = document.createElement("select");
      groupSelect.className = "select";
      groupSelect.style.maxWidth = "180px";
      groupSelect.dataset.action = "changeGroup";
      groupSelect.dataset.id = p.id;

      const groups = state.db.groups.length ? state.db.groups : [...DEFAULT_GROUPS];
      for (const g of groups) {
        const opt = document.createElement("option");
        opt.value = g;
        opt.textContent = g;
        if ((p.group || groups[0]) === g) opt.selected = true;
        groupSelect.appendChild(opt);
      }
      tdGroup.appendChild(groupSelect);

      const tdExpiry = document.createElement("td");
      tdExpiry.textContent = isoToHuman(p.expiryDate);

      const tdStatus = document.createElement("td");
      const badge = document.createElement("span");
      badge.className = status === "Active" ? "badge badge--success" : "badge badge--danger";
      badge.textContent = status;
      tdStatus.appendChild(badge);

      const tdActions = document.createElement("td");
      const actions = document.createElement("div");
      actions.className = "rowActions";

      const btnEdit = document.createElement("button");
      btnEdit.className = "btn btn--ghost";
      btnEdit.type = "button";
      btnEdit.textContent = "Edit";
      btnEdit.dataset.action = "edit";
      btnEdit.dataset.id = p.id;

      const btnRenew = document.createElement("button");
      btnRenew.className = "btn btn--primary";
      btnRenew.type = "button";
      btnRenew.textContent = "Renew";
      btnRenew.dataset.action = "renew";
      btnRenew.dataset.id = p.id;

      const btnDelete = document.createElement("button");
      btnDelete.className = "btn btn--danger";
      btnDelete.type = "button";
      btnDelete.textContent = "Delete";
      btnDelete.dataset.action = "delete";
      btnDelete.dataset.id = p.id;

      actions.appendChild(btnEdit);
      actions.appendChild(btnRenew);
      actions.appendChild(btnDelete);
      tdActions.appendChild(actions);

      tr.appendChild(tdName);
      tr.appendChild(tdCode);
      tr.appendChild(tdGroup);
      tr.appendChild(tdExpiry);
      tr.appendChild(tdStatus);
      tr.appendChild(tdActions);

      el.playersTbody.appendChild(tr);
    }
  };

  const renderFinancials = () => {
    const db = state.db;

    const revenue = computeRevenueThisMonth(db);
    const expenses = computeExpensesThisMonth(db);
    const profit = revenue - expenses;

    el.finRevenue.textContent = money(revenue);
    el.finExpenses.textContent = money(expenses);
    el.finProfit.textContent = money(profit);
    el.finMembers.textContent = String(db.players.length);

    if (profit >= 0) {
      el.finProfitBadge.className = "badge badge--success";
      el.finProfitBadge.textContent = "Profit";
      el.finProfitHint.textContent = "Positive net profit this month";
    } else {
      el.finProfitBadge.className = "badge badge--danger";
      el.finProfitBadge.textContent = "Loss";
      el.finProfitHint.textContent = "Negative net profit this month";
    }

    // expenses list for this month
    const monthExpenses = db.expenses
      .filter(e => e && e.date && isThisMonthISO(e.date))
      .sort((a, b) => parseISODate(b.date).getTime() - parseISODate(a.date).getTime());

    el.expensesTbody.innerHTML = "";

    if (!monthExpenses.length) {
      el.expensesEmpty.classList.remove("hidden");
      return;
    }
    el.expensesEmpty.classList.add("hidden");

    for (const ex of monthExpenses) {
      const tr = document.createElement("tr");

      const tdDate = document.createElement("td");
      tdDate.textContent = isoToHuman(ex.date);

      const tdNote = document.createElement("td");
      tdNote.textContent = ex.note;

      const tdAmount = document.createElement("td");
      tdAmount.innerHTML = `<span class="mono">${money(ex.amount)}</span>`;

      const tdActions = document.createElement("td");
      const actions = document.createElement("div");
      actions.className = "rowActions";

      const del = document.createElement("button");
      del.className = "btn btn--danger";
      del.type = "button";
      del.textContent = "Delete";
      del.dataset.action = "deleteExpense";
      del.dataset.id = ex.id;

      actions.appendChild(del);
      tdActions.appendChild(actions);

      tr.appendChild(tdDate);
      tr.appendChild(tdNote);
      tr.appendChild(tdAmount);
      tr.appendChild(tdActions);

      el.expensesTbody.appendChild(tr);
    }
  };

  const renderSettings = () => {
    // groups list
    const db = state.db;
    const groups = (db.groups && db.groups.length) ? db.groups : [...DEFAULT_GROUPS];

    el.groupsList.innerHTML = "";

    const usageMap = {};
    for (const g of groups) usageMap[g] = 0;
    for (const p of db.players) {
      if (p.group && usageMap[p.group] != null) usageMap[p.group] += 1;
    }

    for (const g of groups) {
      const li = document.createElement("li");
      li.className = "listItem";

      const left = document.createElement("div");
      left.className = "listItem__left";

      const title = document.createElement("div");
      title.className = "listItem__title";
      title.textContent = g;

      const meta = document.createElement("div");
      meta.className = "listItem__meta";
      meta.textContent = `${usageMap[g] || 0} assigned`;

      left.appendChild(title);
      left.appendChild(meta);

      const right = document.createElement("div");
      right.className = "rowActions";

      const canDelete = (usageMap[g] || 0) === 0 && groups.length > 1;
      const del = document.createElement("button");
      del.className = canDelete ? "btn btn--danger" : "btn btn--ghost";
      del.type = "button";
      del.textContent = canDelete ? "Delete" : "In Use";
      del.disabled = !canDelete;
      del.dataset.action = "deleteGroup";
      del.dataset.group = g;

      right.appendChild(del);

      li.appendChild(left);
      li.appendChild(right);

      el.groupsList.appendChild(li);
    }
  };

  const renderPlayerPortal = () => {
    const db = state.db;
    const session = state.session;

    if (!session || session.role !== "player") return;

    const p = db.players.find(x => x.id === session.playerId);
    if (!p) {
      toast("danger", "Session invalid", "Player not found. Please login again.");
      clearSession();
      showView("login");
      return;
    }

    const status = playerStatus(p);
    const letter = (p.name || "P").trim().slice(0, 1).toUpperCase();

    el.playerAvatarLetter.textContent = letter;
    el.playerGreetingName.textContent = p.name || "Player";
    el.playerCodeText.textContent = String(p.accessCode);
    el.playerGroupText.textContent = p.group || "—";
    el.playerValidUntil.textContent = isoToHuman(p.expiryDate);
    el.playerSubType.textContent = p.subscriptionType || "—";

    if (status === "Active") {
      el.playerStatusBadge.className = "badge badge--success";
      el.playerStatusBadge.textContent = "Active";
    } else {
      el.playerStatusBadge.className = "badge badge--danger";
      el.playerStatusBadge.textContent = "Expired";
    }

    // attendance
    const attendance = Array.isArray(p.attendance) ? p.attendance : [];
    const recent = [...attendance].slice(-12).reverse(); // latest 12

    el.attendanceList.innerHTML = "";
    el.attendanceCount.textContent = String(attendance.length);

    if (!recent.length) {
      el.attendanceEmpty.classList.remove("hidden");
    } else {
      el.attendanceEmpty.classList.add("hidden");
      for (const iso of recent) {
        const li = document.createElement("li");
        li.className = "listItem";

        const left = document.createElement("div");
        left.className = "listItem__left";

        const title = document.createElement("div");
        title.className = "listItem__title";
        title.textContent = isoToHuman(iso);

        const meta = document.createElement("div");
        meta.className = "listItem__meta";
        meta.textContent = "Checked-in";

        left.appendChild(title);
        left.appendChild(meta);

        const right = document.createElement("div");
        right.innerHTML = `<span class="badge badge--neon">Present</span>`;

        li.appendChild(left);
        li.appendChild(right);

        el.attendanceList.appendChild(li);
      }
    }

    // payments
    const payments = Array.isArray(p.payments) ? p.payments : [];
    const sorted = [...payments].sort((a, b) => {
      const ad = a?.date ? parseISODate(a.date).getTime() : 0;
      const bd = b?.date ? parseISODate(b.date).getTime() : 0;
      return bd - ad;
    });

    el.paymentTbody.innerHTML = "";

    if (!sorted.length) {
      el.paymentsEmpty.classList.remove("hidden");
    } else {
      el.paymentsEmpty.classList.add("hidden");
      for (const pay of sorted.slice(0, 20)) {
        const tr = document.createElement("tr");

        const tdDate = document.createElement("td");
        tdDate.textContent = isoToHuman(pay.date);

        const tdType = document.createElement("td");
        tdType.textContent = pay.subscriptionType || "—";

        const tdAmount = document.createElement("td");
        tdAmount.innerHTML = `<span class="mono">${money(pay.amount)}</span>`;

        const tdNote = document.createElement("td");
        tdNote.textContent = pay.note || "—";

        tr.appendChild(tdDate);
        tr.appendChild(tdType);
        tr.appendChild(tdAmount);
        tr.appendChild(tdNote);

        el.paymentTbody.appendChild(tr);
      }
    }

    // check-in button state
    const t = todayISO();
    const already = attendance.includes(t);
    el.checkInBtn.disabled = already;
    el.checkInBtn.textContent = already ? "Checked-in Today ✅" : "Check-in Today";
  };

  const renderAll = () => {
    renderNow();

    // status
    el.dbStatus.textContent = "DB: LocalStorage";

    if (state.session?.role === "admin") {
      renderSubscriptionOptions();
      renderGroupOptions();

      // set default dates
      if (!el.playerStartDateInput.value) el.playerStartDateInput.value = todayISO();
      if (!el.expenseDateInput.value) el.expenseDateInput.value = todayISO();

      renderDashboard();
      renderPlayersTable();
      renderFinancials();
      renderSettings();
    }

    if (state.session?.role === "player") {
      renderPlayerPortal();
    }
  };

  /* =========================
     ACTIONS - AUTH
  ========================= */
  const loginAdmin = (username, password) => {
    if (username === ADMIN_CREDS.username && password === ADMIN_CREDS.password) {
      saveSession({ role: "admin", at: Date.now() });
      toast("success", "Welcome Admin", "Logged in successfully.");
      showView("admin");
      setAdminPage("dashboard");
      renderAll();
      return true;
    }
    return false;
  };

  const loginPlayer = (code) => {
    const db = state.db;
    const p = getPlayerByCode(db, code);
    if (!p) return false;

    saveSession({ role: "player", playerId: p.id, at: Date.now() });
    toast("success", "Welcome", `Logged in as ${p.name}.`);
    showView("player");
    renderAll();
    return true;
  };

  const logout = () => {
    clearSession();
    showView("login");
    clearLoginError();
    toast("info", "Logged out", "Session ended.");
  };

  /* =========================
     ACTIONS - ADMIN
  ========================= */
  const addPlayer = (payload) => {
    const db = state.db;

    const name = normalize(payload.name);
    const age = Number(payload.age);
    const phone = normalize(payload.phone);
    const group = normalize(payload.group) || (db.groups[0] || DEFAULT_GROUPS[0]);
    const subscriptionType = normalize(payload.subscriptionType) || SUBSCRIPTIONS[0].key;
    const startDate = payload.startDate || todayISO();

    if (!name || !phone || !age || age < 1) {
      toast("danger", "Invalid data", "Please fill all required fields correctly.");
      return;
    }

    const sub = getSubscription(subscriptionType);
    const accessCode = generateUniqueCode(db);
    const expiryDate = addMonthsISO(startDate, sub.months);

    const player = {
      id: safeUUID(),
      name,
      age,
      phone,
      group,
      subscriptionType: sub.key,
      startDate,
      expiryDate,
      accessCode,

      attendance: [],
      payments: [
        {
          id: safeUUID(),
          date: startDate,
          amount: sub.price,
          subscriptionType: sub.key,
          note: "New Subscription",
        },
      ],

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.players.push(player);
    saveDB(db);

    state.lastGeneratedCode = accessCode;
    el.generatedCodeInput.value = accessCode;

    toast("success", "Player created", `${name} added. Code: ${accessCode}`);
    renderAll();
  };

  const updatePlayer = (playerId, changes) => {
    const db = state.db;
    const idx = db.players.findIndex(p => p.id === playerId);
    if (idx === -1) return;

    const p = db.players[idx];

    const name = normalize(changes.name ?? p.name);
    const age = Number(changes.age ?? p.age);
    const phone = normalize(changes.phone ?? p.phone);
    const group = normalize(changes.group ?? p.group);
    const subscriptionType = normalize(changes.subscriptionType ?? p.subscriptionType);
    const startDate = changes.startDate ?? p.startDate;

    if (!name || !phone || !age || age < 1) {
      toast("danger", "Invalid data", "Please provide valid name, age, and phone.");
      return;
    }

    // Recompute expiry if subscriptionType or startDate changed
    const subscriptionChanged = subscriptionType !== p.subscriptionType;
    const startChanged = startDate !== p.startDate;

    let expiryDate = p.expiryDate;
    if (subscriptionChanged || startChanged) {
      const sub = getSubscription(subscriptionType);
      expiryDate = addMonthsISO(startDate, sub.months);
    }

    db.players[idx] = {
      ...p,
      name,
      age,
      phone,
      group,
      subscriptionType,
      startDate,
      expiryDate,
      updatedAt: new Date().toISOString(),
    };

    saveDB(db);
    toast("success", "Player updated", `${name} saved.`);
    renderAll();
  };

  const renewPlayer = (playerId, subscriptionTypeKey) => {
    const db = state.db;
    const idx = db.players.findIndex(p => p.id === playerId);
    if (idx === -1) return;

    const p = db.players[idx];
    const sub = getSubscription(subscriptionTypeKey);

    const t = todayISO();
    const base = isISOOnOrAfter(p.expiryDate, t) ? p.expiryDate : t;
    const newExpiry = addMonthsISO(base, sub.months);

    const payments = Array.isArray(p.payments) ? p.payments : [];
    payments.push({
      id: safeUUID(),
      date: t,
      amount: sub.price,
      subscriptionType: sub.key,
      note: "Renewal",
    });

    db.players[idx] = {
      ...p,
      subscriptionType: sub.key,
      expiryDate: newExpiry,
      payments,
      updatedAt: new Date().toISOString(),
    };

    saveDB(db);
    toast("success", "Renewed", `${p.name} renewed to ${sub.key}.`);
    renderAll();
  };

  const deletePlayer = (playerId) => {
    const db = state.db;
    const p = db.players.find(x => x.id === playerId);
    db.players = db.players.filter(x => x.id !== playerId);
    saveDB(db);
    toast("warn", "Player deleted", p ? `${p.name} removed.` : "Removed.");
    renderAll();
  };

  const changePlayerGroup = (playerId, group) => {
    const db = state.db;
    const idx = db.players.findIndex(p => p.id === playerId);
    if (idx === -1) return;

    db.players[idx].group = group;
    db.players[idx].updatedAt = new Date().toISOString();
    saveDB(db);

    toast("info", "Group updated", `${db.players[idx].name} → ${group}`);
    renderAll();
  };

  const addExpense = ({ amount, date, note }) => {
    const db = state.db;
    const a = Number(amount);
    const d = date || todayISO();
    const n = normalize(note);

    if (!Number.isFinite(a) || a < 0 || !n) {
      toast("danger", "Invalid expense", "Enter a valid amount and note.");
      return;
    }

    db.expenses.push({
      id: safeUUID(),
      amount: Math.round(a),
      date: d,
      note: n,
      createdAt: new Date().toISOString(),
    });

    saveDB(db);
    toast("success", "Expense added", `${money(a)} — ${n}`);
    renderAll();
  };

  const deleteExpense = (expenseId) => {
    const db = state.db;
    const ex = db.expenses.find(e => e.id === expenseId);
    db.expenses = db.expenses.filter(e => e.id !== expenseId);
    saveDB(db);
    toast("warn", "Expense deleted", ex ? `${ex.note}` : "Removed.");
    renderAll();
  };

  const addGroup = (name) => {
    const db = state.db;
    const g = normalize(name);
    if (!g) {
      toast("danger", "Invalid group", "Enter a group name.");
      return;
    }
    if (db.groups.some(x => x.toLowerCase() === g.toLowerCase())) {
      toast("warn", "Already exists", "Group name already exists.");
      return;
    }
    db.groups.push(g);
    saveDB(db);
    toast("success", "Group added", g);
    renderGroupOptions();
    renderAll();
  };

  const deleteGroup = (groupName) => {
    const db = state.db;
    const usage = db.players.filter(p => p.group === groupName).length;
    if (usage > 0) {
      toast("danger", "Group in use", "Reassign members before deleting this group.");
      return;
    }
    if (db.groups.length <= 1) {
      toast("danger", "Cannot delete", "At least one group must remain.");
      return;
    }
    db.groups = db.groups.filter(g => g !== groupName);
    saveDB(db);
    toast("warn", "Group deleted", groupName);
    renderGroupOptions();
    renderAll();
  };

  const exportDB = () => {
    const db = state.db;

    // ensure NAME ASC for players export (requested)
    const exportObj = {
      ...db,
      players: sortPlayersNameAsc(db.players).map(p => ({ ...p })),
      exportedAt: new Date().toISOString(),
    };

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadJSON(`sports-club-backup-${stamp}.json`, exportObj);
    toast("info", "Exported", "Backup JSON downloaded.");
  };

  const importDB = async (file) => {
    if (!file) {
      toast("danger", "No file", "Choose a JSON file to import.");
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      // minimal validation
      if (!parsed || typeof parsed !== "object") throw new Error("Invalid JSON");
      if (!Array.isArray(parsed.players) || !Array.isArray(parsed.expenses) || !Array.isArray(parsed.groups)) {
        throw new Error("Invalid backup structure");
      }

      // sanitize
      const db = {
        meta: parsed.meta || { version: 1, createdAt: new Date().toISOString(), lastUpdatedAt: new Date().toISOString() },
        groups: parsed.groups.length ? parsed.groups : [...DEFAULT_GROUPS],
        expenses: parsed.expenses,
        players: parsed.players,
      };

      saveDB(db);

      toast("success", "Imported", "Backup restored successfully.");
      renderAll();
    } catch (err) {
      toast("danger", "Import failed", "Invalid JSON file or structure.");
    }
  };

  const resetDB = () => {
    const db = defaultDB();
    saveDB(db);
    toast("warn", "Reset complete", "All local data has been cleared.");
    // if player session existed, invalidate
    if (state.session?.role === "player") logout();
    renderAll();
  };

  /* =========================
     ACTIONS - PLAYER
  ========================= */
  const checkIn = () => {
    const db = state.db;
    const session = state.session;
    if (!session || session.role !== "player") return;

    const idx = db.players.findIndex(p => p.id === session.playerId);
    if (idx === -1) return;

    const p = db.players[idx];
    const t = todayISO();
    p.attendance = Array.isArray(p.attendance) ? p.attendance : [];
    if (p.attendance.includes(t)) {
      toast("warn", "Already checked-in", "You already checked-in today.");
      renderAll();
      return;
    }

    p.attendance.push(t);
    p.updatedAt = new Date().toISOString();

    db.players[idx] = p;
    saveDB(db);

    toast("success", "Checked-in", `Attendance saved for ${isoToHuman(t)}.`);
    renderAll();
  };

  /* =========================
     EVENT LISTENERS
  ========================= */
  const bind = () => {
    // live clock
    renderNow();
    setInterval(renderNow, 30_000);

    // Login tabs
    el.tabAdmin.addEventListener("click", () => {
      clearLoginError();
      el.tabAdmin.classList.add("tab--active");
      el.tabPlayer.classList.remove("tab--active");
      el.panelAdmin.classList.add("tabPanel--active");
      el.panelPlayer.classList.remove("tabPanel--active");
      el.tabAdmin.setAttribute("aria-selected", "true");
      el.tabPlayer.setAttribute("aria-selected", "false");
    });

    el.tabPlayer.addEventListener("click", () => {
      clearLoginError();
      el.tabPlayer.classList.add("tab--active");
      el.tabAdmin.classList.remove("tab--active");
      el.panelPlayer.classList.add("tabPanel--active");
      el.panelAdmin.classList.remove("tabPanel--active");
      el.tabPlayer.setAttribute("aria-selected", "true");
      el.tabAdmin.setAttribute("aria-selected", "false");
    });

    // Admin login
    el.adminLoginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      clearLoginError();

      const u = normalize(el.adminUsername.value);
      const p = normalize(el.adminPassword.value);

      if (!loginAdmin(u, p)) {
        showLoginError("Invalid admin credentials.");
        toast("danger", "Login failed", "Invalid username or password.");
      }
    });

    // Player login
    el.playerLoginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      clearLoginError();

      const c = normalize(el.playerCode.value);
      if (!/^\d{6}$/.test(c)) {
        showLoginError("Please enter a valid 6-digit access code.");
        toast("danger", "Invalid code", "Access code must be 6 digits.");
        return;
      }

      if (!loginPlayer(c)) {
        showLoginError("Access code not found.");
        toast("danger", "Login failed", "Access code not found.");
      }
    });

    // Sidebar open/close
    el.sidebarOpen.addEventListener("click", openSidebar);
    el.sidebarClose.addEventListener("click", closeSidebar);
    el.backdrop.addEventListener("click", closeSidebar);

    // Admin nav
    el.sidebar.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-admin-page]");
      if (!btn) return;
      setAdminPage(btn.dataset.adminPage);
    });

    // Logout
    el.adminLogoutBtn.addEventListener("click", logout);
    el.playerLogoutBtn.addEventListener("click", logout);

    // Add player
    el.addPlayerForm.addEventListener("submit", (e) => {
      e.preventDefault();

      addPlayer({
        name: el.playerNameInput.value,
        age: el.playerAgeInput.value,
        phone: el.playerPhoneInput.value,
        group: el.playerGroupSelect.value,
        subscriptionType: el.playerSubscriptionSelect.value,
        startDate: el.playerStartDateInput.value,
      });

      // reset fields but keep date
      el.playerNameInput.value = "";
      el.playerAgeInput.value = "";
      el.playerPhoneInput.value = "";
    });

    el.copyCodeBtn.addEventListener("click", async () => {
      const code = normalize(el.generatedCodeInput.value);
      if (!/^\d{6}$/.test(code)) {
        toast("warn", "No code", "Create a player first to generate a code.");
        return;
      }
      try {
        await navigator.clipboard.writeText(code);
        toast("success", "Copied", `Code ${code} copied to clipboard.`);
      } catch {
        // fallback
        const temp = document.createElement("input");
        temp.value = code;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand("copy");
        temp.remove();
        toast("success", "Copied", `Code ${code} copied.`);
      }
    });

    // Members search
    el.memberSearchInput.addEventListener("input", (e) => {
      state.memberSearch = e.target.value;
      renderPlayersTable();
    });

    // Members export (backup)
    el.exportMembersBtn.addEventListener("click", exportDB);

    // Players table actions (delegation)
    el.playersTbody.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;

      const action = btn.dataset.action;
      const id = btn.dataset.id;

      if (action === "edit") {
        const p = state.db.players.find(x => x.id === id);
        if (!p) return;

        const groups = state.db.groups.length ? state.db.groups : [...DEFAULT_GROUPS];

        const groupOptions = groups
          .map(g => `<option value="${escapeHtml(g)}" ${p.group === g ? "selected" : ""}>${escapeHtml(g)}</option>`)
          .join("");

        const subOptions = SUBSCRIPTIONS
          .map(s => `<option value="${escapeHtml(s.key)}" ${p.subscriptionType === s.key ? "selected" : ""}>${escapeHtml(s.key)} — ${money(s.price)}</option>`)
          .join("");

        openModal({
          title: "Edit Player",
          subtitle: `Code: ${p.accessCode}`,
          primaryText: "Save Changes",
          secondaryText: "Cancel",
          bodyHTML: `
            <form id="editPlayerForm" class="form form--dense">
              <div class="formGrid">
                <div class="formRow">
                  <label class="label" for="m_name">Name</label>
                  <input id="m_name" class="input" type="text" value="${escapeAttr(p.name)}" required />
                </div>

                <div class="formRow">
                  <label class="label" for="m_age">Age</label>
                  <input id="m_age" class="input" type="number" min="4" max="99" value="${escapeAttr(p.age)}" required />
                </div>

                <div class="formRow">
                  <label class="label" for="m_phone">Phone</label>
                  <input id="m_phone" class="input" type="tel" value="${escapeAttr(p.phone)}" required />
                </div>

                <div class="formRow">
                  <label class="label" for="m_group">Group</label>
                  <select id="m_group" class="select">
                    ${groupOptions}
                  </select>
                </div>

                <div class="formRow">
                  <label class="label" for="m_sub">Subscription Type</label>
                  <select id="m_sub" class="select">
                    ${subOptions}
                  </select>
                </div>

                <div class="formRow">
                  <label class="label" for="m_start">Start Date</label>
                  <input id="m_start" class="input" type="date" value="${escapeAttr(p.startDate)}" required />
                </div>
              </div>

              <div class="chip chip--outline">
                Expiry will auto-recalculate if you change start date or subscription type.
              </div>
            </form>
          `,
          onConfirm: () => {
            const name = document.getElementById("m_name")?.value;
            const age = document.getElementById("m_age")?.value;
            const phone = document.getElementById("m_phone")?.value;
            const group = document.getElementById("m_group")?.value;
            const subscriptionType = document.getElementById("m_sub")?.value;
            const startDate = document.getElementById("m_start")?.value;

            updatePlayer(id, { name, age, phone, group, subscriptionType, startDate });
            closeModal();
          }
        });
      }

      if (action === "renew") {
        const p = state.db.players.find(x => x.id === id);
        if (!p) return;

        const options = SUBSCRIPTIONS
          .map(s => `
            <label class="listItem" style="cursor:pointer;">
              <div class="listItem__left">
                <div class="listItem__title">${escapeHtml(s.key)}</div>
                <div class="listItem__meta">${money(s.price)} • +${s.months} month${s.months === 1 ? "" : "s"}</div>
              </div>
              <div>
                <input type="radio" name="renewSub" value="${escapeAttr(s.key)}" ${s.key === p.subscriptionType ? "checked" : ""} />
              </div>
            </label>
          `)
          .join("");

        openModal({
          title: "Renew Subscription",
          subtitle: `${p.name} • Current expiry: ${isoToHuman(p.expiryDate)}`,
          primaryText: "Confirm Renewal",
          secondaryText: "Cancel",
          bodyHTML: `
            <div class="stack">
              <div class="chip chip--outline">
                Renewal extends from <b>current expiry</b> if active, otherwise from <b>today</b>.
              </div>
              <div class="stack">
                ${options}
              </div>
            </div>
          `,
          onConfirm: () => {
            const chosen = document.querySelector('input[name="renewSub"]:checked')?.value || p.subscriptionType;
            renewPlayer(id, chosen);
            closeModal();
          }
        });
      }

      if (action === "delete") {
        const p = state.db.players.find(x => x.id === id);
        if (!p) return;

        openModal({
          title: "Delete Player",
          subtitle: `${p.name} • Code: ${p.accessCode}`,
          primaryText: "Delete",
          secondaryText: "Cancel",
          bodyHTML: `
            <div class="alert alert--danger">
              This will permanently remove the player, attendance, and payment history.
            </div>
            <div class="chip chip--outline">This action cannot be undone.</div>
          `,
          onConfirm: () => {
            deletePlayer(id);
            closeModal();
          }
        });
      }
    });

    // Group change (select)
    el.playersTbody.addEventListener("change", (e) => {
      const sel = e.target.closest("select[data-action='changeGroup']");
      if (!sel) return;
      const id = sel.dataset.id;
      const group = sel.value;
      changePlayerGroup(id, group);
    });

    // Expense form
    el.expenseForm.addEventListener("submit", (e) => {
      e.preventDefault();
      addExpense({
        amount: el.expenseAmountInput.value,
        date: el.expenseDateInput.value,
        note: el.expenseNoteInput.value,
      });
      el.expenseAmountInput.value = "";
      el.expenseNoteInput.value = "";
    });

    // Expense delete (delegation)
    el.expensesTbody.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action='deleteExpense']");
      if (!btn) return;
      const id = btn.dataset.id;

      openModal({
        title: "Delete Expense",
        subtitle: "Remove this expense entry?",
        primaryText: "Delete",
        secondaryText: "Cancel",
        bodyHTML: `
          <div class="alert alert--danger">This will delete the expense permanently.</div>
        `,
        onConfirm: () => {
          deleteExpense(id);
          closeModal();
        }
      });
    });

    // Settings export/import
    el.exportDbBtn.addEventListener("click", exportDB);
    el.importDbBtn.addEventListener("click", () => importDB(el.importDbFile.files?.[0] || null));

    // Add group
    el.addGroupBtn.addEventListener("click", () => {
      addGroup(el.newGroupInput.value);
      el.newGroupInput.value = "";
    });

    el.newGroupInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addGroup(el.newGroupInput.value);
        el.newGroupInput.value = "";
      }
    });

    // Delete group (delegation)
    el.groupsList.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action='deleteGroup']");
      if (!btn) return;

      const groupName = btn.dataset.group;
      openModal({
        title: "Delete Group",
        subtitle: groupName,
        primaryText: "Delete",
        secondaryText: "Cancel",
        bodyHTML: `
          <div class="alert alert--danger">
            This will delete the group name. Players must not be assigned to it.
          </div>
        `,
        onConfirm: () => {
          deleteGroup(groupName);
          closeModal();
        }
      });
    });

    // Reset DB
    el.resetDbBtn.addEventListener("click", () => {
      openModal({
        title: "Reset All Data",
        subtitle: "This will clear localStorage database",
        primaryText: "Reset",
        secondaryText: "Cancel",
        bodyHTML: `
          <div class="alert alert--danger">
            This will delete ALL players, payments, attendance, and expenses.
          </div>
          <div class="chip chip--outline">Export a backup JSON first if needed.</div>
        `,
        onConfirm: () => {
          resetDB();
          closeModal();
        }
      });
    });

    // Player check-in
    el.checkInBtn.addEventListener("click", checkIn);

    // Modal buttons
    el.modalCloseBtn.addEventListener("click", closeModal);
    el.modalSecondaryBtn.addEventListener("click", closeModal);
    el.modalPrimaryBtn.addEventListener("click", () => {
      if (typeof modalState.onConfirm === "function") modalState.onConfirm();
    });

    // Esc to close modal
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !el.modalOverlay.classList.contains("hidden")) {
        closeModal();
      }
    });
  };

  /* =========================
     SECURITY: basic escaping for modal HTML
  ========================= */
  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
  function escapeAttr(str) {
    // attribute safe enough
    return escapeHtml(str).replaceAll("\n", " ");
  }

  /* =========================
     BOOT
  ========================= */
  const boot = () => {
    state.db = ensureDB();
    state.session = loadSession();

    bind();

    // set default date inputs
    el.playerStartDateInput.value = todayISO();
    el.expenseDateInput.value = todayISO();

    // initial selects
    renderSubscriptionOptions();
    renderGroupOptions();

    // show correct view
    if (state.session?.role === "admin") {
      showView("admin");
      setAdminPage("dashboard");
      renderAll();
    } else if (state.session?.role === "player") {
      showView("player");
      renderAll();
    } else {
      showView("login");
    }
  };

  boot();
})();
