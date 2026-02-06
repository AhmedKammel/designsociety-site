// app.js
import {
  ADMIN_CREDS,
  ensureDB,
  loadSession,
  saveSession,
  clearSession,
  saveDB,
  safeUUID,
  todayISO,
  nowHuman,
  isoToHuman,
  addMonthsISO,
  isISOOnOrAfter,
  isThisMonthISO,
  money,
  sortPlayersNameAsc,
  generateUniqueCode,
  playerStatus,
  getPlanById,
  computeRevenueThisMonth,
  computeExpensesThisMonth,
  getPlayerByCode,
} from "./db.js";

import { ensureContent, saveContent } from "./content.js";
import { toast, createModalController, escapeHtml, escapeAttr } from "./ui.js";

export function bootApp() {
  const el = mapDom();
  const modal = createModalController({
    overlay: el.modalOverlay,
    title: el.modalTitle,
    subtitle: el.modalSubtitle,
    body: el.modalBody,
    close: el.modalCloseBtn,
    secondary: el.modalSecondaryBtn,
    primary: el.modalPrimaryBtn,
  });

  const state = {
    db: ensureDB(),
    content: ensureContent(),
    session: loadSession(),
    adminPage: "dashboard",
    memberSearch: "",
  };

  bindAll();
  hydrateInitial();

  function mapDom() {
    return {
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
      playerNow: document.getElementById("playerNow"),
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
      membersPrereqNotice: document.getElementById("membersPrereqNotice"),
      addPlayerForm: document.getElementById("addPlayerForm"),
      createPlayerBtn: document.getElementById("createPlayerBtn"),
      playerNameInput: document.getElementById("playerNameInput"),
      playerAgeInput: document.getElementById("playerAgeInput"),
      playerPhoneInput: document.getElementById("playerPhoneInput"),
      playerGroupSelect: document.getElementById("playerGroupSelect"),
      playerPlanSelect: document.getElementById("playerPlanSelect"),
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
      resetDbBtn: document.getElementById("resetDbBtn"),

      // content settings
      playerAnnouncementInput: document.getElementById("playerAnnouncementInput"),
      savePlayerAnnouncementBtn: document.getElementById("savePlayerAnnouncementBtn"),

      // groups settings
      newGroupInput: document.getElementById("newGroupInput"),
      addGroupBtn: document.getElementById("addGroupBtn"),
      groupsList: document.getElementById("groupsList"),

      // plans settings
      newPlanName: document.getElementById("newPlanName"),
      newPlanMonths: document.getElementById("newPlanMonths"),
      newPlanPrice: document.getElementById("newPlanPrice"),
      addPlanBtn: document.getElementById("addPlanBtn"),
      plansList: document.getElementById("plansList"),

      // player
      playerLogoutBtn: document.getElementById("playerLogoutBtn"),
      playerAvatarLetter: document.getElementById("playerAvatarLetter"),
      playerGreetingName: document.getElementById("playerGreetingName"),
      playerCodeText: document.getElementById("playerCodeText"),
      playerGroupText: document.getElementById("playerGroupText"),
      playerValidUntil: document.getElementById("playerValidUntil"),
      playerStatusBadge: document.getElementById("playerStatusBadge"),
      playerPlanName: document.getElementById("playerPlanName"),
      playerAnnouncementBox: document.getElementById("playerAnnouncementBox"),
      playerNoteBox: document.getElementById("playerNoteBox"),

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
  }

  function bindAll() {
    // clock
    tickNow();
    setInterval(tickNow, 30_000);

    // tabs
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

    // admin login
    el.adminLoginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      clearLoginError();
      const u = String(el.adminUsername.value || "").trim();
      const p = String(el.adminPassword.value || "").trim();
      if (u === ADMIN_CREDS.username && p === ADMIN_CREDS.password) {
        state.session = saveSession({ role: "admin", at: Date.now() });
        toast(el.toasts, "success", "تم الدخول", "مرحباً بك في لوحة الإدارة.");
        showView("admin");
        setAdminPage("dashboard");
        renderAll();
      } else {
        showLoginError("بيانات الإدارة غير صحيحة.");
        toast(el.toasts, "danger", "فشل الدخول", "تحقق من اسم المستخدم وكلمة المرور.");
      }
    });

    // player login
    el.playerLoginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      clearLoginError();
      const code = String(el.playerCode.value || "").trim();
      if (!/^\d{6}$/.test(code)) {
        showLoginError("الرجاء إدخال كود صحيح (6 أرقام).");
        toast(el.toasts, "danger", "كود غير صحيح", "يجب أن يكون الكود 6 أرقام.");
        return;
      }
      const player = getPlayerByCode(state.db, code);
      if (!player) {
        showLoginError("الكود غير موجود.");
        toast(el.toasts, "danger", "فشل الدخول", "الكود غير موجود.");
        return;
      }
      state.session = saveSession({ role: "player", playerId: player.id, at: Date.now() });
      toast(el.toasts, "success", "تم الدخول", `مرحباً ${player.name}.`);
      showView("player");
      renderAll();
    });

    // sidebar open/close
    el.sidebarOpen.addEventListener("click", openSidebar);
    el.sidebarClose.addEventListener("click", closeSidebar);
    el.backdrop.addEventListener("click", closeSidebar);

    // admin nav
    el.sidebar.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-admin-page]");
      if (!btn) return;
      setAdminPage(btn.dataset.adminPage);
    });

    // logout
    el.adminLogoutBtn.addEventListener("click", logout);
    el.playerLogoutBtn.addEventListener("click", logout);

    // add player
    el.addPlayerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!adminPrereqsOk()) return;

      const name = String(el.playerNameInput.value || "").trim();
      const age = Number(el.playerAgeInput.value);
      const phone = String(el.playerPhoneInput.value || "").trim();
      const group = String(el.playerGroupSelect.value || "").trim();
      const planId = String(el.playerPlanSelect.value || "").trim();
      const startDate = el.playerStartDateInput.value || todayISO();

      if (!name || !phone || !Number.isFinite(age) || age < 4) {
        toast(el.toasts, "danger", "بيانات غير صحيحة", "تأكد من الاسم/العمر/الهاتف.");
        return;
      }

      const plan = getPlanById(state.db, planId);
      if (!plan) {
        toast(el.toasts, "danger", "خطة غير موجودة", "اختر خطة اشتراك صحيحة.");
        return;
      }

      const code = generateUniqueCode(state.db.players);
      const expiryDate = addMonthsISO(startDate, Number(plan.months));

      const player = {
        id: safeUUID(),
        name,
        age,
        phone,
        group,
        subscriptionPlanId: plan.id,
        startDate,
        expiryDate,
        accessCode: code,
        adminNote: "",

        attendance: [],
        payments: [
          {
            id: safeUUID(),
            date: startDate,
            amount: Number(plan.price),
            planId: plan.id,
            planName: plan.name,
            note: "اشتراك جديد",
          },
        ],

        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      state.db.players.push(player);
      state.db = saveDB(state.db);

      el.generatedCodeInput.value = code;
      toast(el.toasts, "success", "تم إنشاء اللاعب", `الكود: ${code}`);
      el.playerNameInput.value = "";
      el.playerAgeInput.value = "";
      el.playerPhoneInput.value = "";
      renderAll();
    });

    el.copyCodeBtn.addEventListener("click", async () => {
      const code = String(el.generatedCodeInput.value || "").trim();
      if (!/^\d{6}$/.test(code)) {
        toast(el.toasts, "warn", "لا يوجد كود", "أنشئ لاعباً أولاً.");
        return;
      }
      try {
        await navigator.clipboard.writeText(code);
        toast(el.toasts, "success", "تم النسخ", `تم نسخ الكود: ${code}`);
      } catch {
        const tmp = document.createElement("input");
        tmp.value = code;
        document.body.appendChild(tmp);
        tmp.select();
        document.execCommand("copy");
        tmp.remove();
        toast(el.toasts, "success", "تم النسخ", `تم نسخ الكود: ${code}`);
      }
    });

    // member search
    el.memberSearchInput.addEventListener("input", (e) => {
      state.memberSearch = String(e.target.value || "");
      renderPlayersTable();
    });

    // export
    el.exportMembersBtn.addEventListener("click", exportBackup);
    el.exportDbBtn.addEventListener("click", exportBackup);

    // import
    el.importDbBtn.addEventListener("click", () => importBackup(el.importDbFile.files?.[0] || null));

    // expenses
    el.expenseForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const amount = Number(el.expenseAmountInput.value);
      const date = el.expenseDateInput.value || todayISO();
      const note = String(el.expenseNoteInput.value || "").trim();

      if (!Number.isFinite(amount) || amount < 0 || !note) {
        toast(el.toasts, "danger", "بيانات غير صحيحة", "أدخل مبلغ ووصف صحيح.");
        return;
      }

      state.db.expenses.push({
        id: safeUUID(),
        amount: Math.round(amount),
        date,
        note,
        createdAt: new Date().toISOString(),
      });

      state.db = saveDB(state.db);
      el.expenseAmountInput.value = "";
      el.expenseNoteInput.value = "";
      toast(el.toasts, "success", "تمت الإضافة", "تم إضافة المصروف.");
      renderAll();
    });

    el.expensesTbody.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action='deleteExpense']");
      if (!btn) return;
      const id = btn.dataset.id;

      modal.open({
        title: "حذف المصروف",
        subtitle: "هل أنت متأكد؟",
        primaryText: "حذف",
        secondaryText: "إلغاء",
        bodyHTML: `<div class="alert alert--danger">سيتم حذف المصروف نهائياً.</div>`,
        onConfirm: () => {
          state.db.expenses = state.db.expenses.filter(x => x.id !== id);
          state.db = saveDB(state.db);
          toast(el.toasts, "warn", "تم الحذف", "تم حذف المصروف.");
          modal.close();
          renderAll();
        }
      });
    });

    // players table actions
    el.playersTbody.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const action = btn.dataset.action;
      const id = btn.dataset.id;

      if (action === "edit") openEditPlayer(id);
      if (action === "renew") openRenewPlayer(id);
      if (action === "delete") openDeletePlayer(id);
    });

    // group change in table
    el.playersTbody.addEventListener("change", (e) => {
      const sel = e.target.closest("select[data-action='changeGroup']");
      if (!sel) return;
      const id = sel.dataset.id;
      const group = sel.value;
      const idx = state.db.players.findIndex(p => p.id === id);
      if (idx === -1) return;
      state.db.players[idx].group = group;
      state.db.players[idx].updatedAt = new Date().toISOString();
      state.db = saveDB(state.db);
      toast(el.toasts, "info", "تم التحديث", "تم تغيير المجموعة.");
      renderAll();
    });

    // player check-in
    el.checkInBtn.addEventListener("click", () => {
      if (state.session?.role !== "player") return;
      const idx = state.db.players.findIndex(p => p.id === state.session.playerId);
      if (idx === -1) return;

      const p = state.db.players[idx];
      const t = todayISO();
      p.attendance = Array.isArray(p.attendance) ? p.attendance : [];
      if (p.attendance.includes(t)) {
        toast(el.toasts, "warn", "تم تسجيل اليوم", "لقد سجلت حضورك اليوم بالفعل.");
        renderPlayerPortal();
        return;
      }

      p.attendance.push(t);
      p.updatedAt = new Date().toISOString();
      state.db.players[idx] = p;
      state.db = saveDB(state.db);

      toast(el.toasts, "success", "تم التسجيل", "تم تسجيل حضور اليوم.");
      renderPlayerPortal();
    });

    // groups settings
    el.addGroupBtn.addEventListener("click", () => {
      const name = String(el.newGroupInput.value || "").trim();
      if (!name) {
        toast(el.toasts, "danger", "اسم غير صحيح", "اكتب اسم المجموعة.");
        return;
      }
      if (state.db.groups.some(g => g.toLowerCase() === name.toLowerCase())) {
        toast(el.toasts, "warn", "موجود بالفعل", "هذه المجموعة موجودة.");
        return;
      }
      state.db.groups.push(name);
      state.db = saveDB(state.db);
      el.newGroupInput.value = "";
      toast(el.toasts, "success", "تمت الإضافة", "تم إضافة المجموعة.");
      renderAll();
    });

    el.newGroupInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        el.addGroupBtn.click();
      }
    });

    el.groupsList.addEventListener("click", (e) => {
      const delBtn = e.target.closest("button[data-action='deleteGroup']");
      const editBtn = e.target.closest("button[data-action='editGroup']");
      if (!delBtn && !editBtn) return;

      if (delBtn) {
        const groupName = delBtn.dataset.group;
        const used = state.db.players.some(p => p.group === groupName);
        if (used) {
          toast(el.toasts, "danger", "المجموعة مستخدمة", "غيّر مجموعة اللاعبين أولاً.");
          return;
        }
        if (state.db.groups.length <= 1) {
          toast(el.toasts, "danger", "غير مسموح", "لا يمكن حذف آخر مجموعة.");
          return;
        }

        modal.open({
          title: "حذف المجموعة",
          subtitle: groupName,
          primaryText: "حذف",
          secondaryText: "إلغاء",
          bodyHTML: `<div class="alert alert--danger">سيتم حذف المجموعة نهائياً.</div>`,
          onConfirm: () => {
            state.db.groups = state.db.groups.filter(g => g !== groupName);
            state.db = saveDB(state.db);
            toast(el.toasts, "warn", "تم الحذف", "تم حذف المجموعة.");
            modal.close();
            renderAll();
          }
        });
      }

      if (editBtn) {
        const oldName = editBtn.dataset.group;
        modal.open({
          title: "تعديل اسم المجموعة",
          subtitle: oldName,
          primaryText: "حفظ",
          secondaryText: "إلغاء",
          bodyHTML: `
            <div class="form form--dense">
              <div class="formRow">
                <label class="label" for="m_group_name">اسم جديد</label>
                <input id="m_group_name" class="input" type="text" value="${escapeAttr(oldName)}" />
              </div>
              <p class="hint">سيتم تحديث اللاعبين الذين يستخدمون هذه المجموعة تلقائياً.</p>
            </div>
          `,
          onConfirm: () => {
            const newName = String(document.getElementById("m_group_name")?.value || "").trim();
            if (!newName) {
              toast(el.toasts, "danger", "اسم غير صحيح", "اكتب اسم صحيح.");
              return;
            }
            if (state.db.groups.some(g => g.toLowerCase() === newName.toLowerCase()) && newName !== oldName) {
              toast(el.toasts, "warn", "موجود بالفعل", "اسم المجموعة موجود.");
              return;
            }
            state.db.groups = state.db.groups.map(g => (g === oldName ? newName : g));
            state.db.players = state.db.players.map(p => (p.group === oldName ? { ...p, group: newName } : p));
            state.db = saveDB(state.db);
            toast(el.toasts, "success", "تم التعديل", "تم تعديل المجموعة.");
            modal.close();
            renderAll();
          }
        });
      }
    });

    // plans settings
    el.addPlanBtn.addEventListener("click", () => {
      const name = String(el.newPlanName.value || "").trim();
      const months = Number(el.newPlanMonths.value);
      const price = Number(el.newPlanPrice.value);

      if (!name || !Number.isFinite(months) || months < 1 || !Number.isFinite(price) || price < 0) {
        toast(el.toasts, "danger", "بيانات غير صحيحة", "اكتب اسم + مدة (>=1) + سعر (>=0).");
        return;
      }
      if (state.db.plans.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        toast(el.toasts, "warn", "موجود بالفعل", "خطة بنفس الاسم موجودة.");
        return;
      }

      state.db.plans.push({ id: safeUUID(), name, months: Math.round(months), price: Math.round(price) });
      state.db = saveDB(state.db);

      el.newPlanName.value = "";
      el.newPlanMonths.value = "";
      el.newPlanPrice.value = "";

      toast(el.toasts, "success", "تمت الإضافة", "تم إضافة خطة الاشتراك.");
      renderAll();
    });

    el.plansList.addEventListener("click", (e) => {
      const delBtn = e.target.closest("button[data-action='deletePlan']");
      const editBtn = e.target.closest("button[data-action='editPlan']");
      if (!delBtn && !editBtn) return;

      if (delBtn) {
        const planId = delBtn.dataset.id;
        if (state.db.plans.length <= 1) {
          toast(el.toasts, "danger", "غير مسموح", "لا يمكن حذف آخر خطة.");
          return;
        }

        modal.open({
          title: "حذف خطة",
          subtitle: "سيتم حذف الخطة (لا يؤثر على سجل المدفوعات السابق).",
          primaryText: "حذف",
          secondaryText: "إلغاء",
          bodyHTML: `<div class="alert alert--danger">تأكد أنك تريد حذف الخطة.</div>`,
          onConfirm: () => {
            state.db.plans = state.db.plans.filter(p => p.id !== planId);
            state.db = saveDB(state.db);
            toast(el.toasts, "warn", "تم الحذف", "تم حذف الخطة.");
            modal.close();
            renderAll();
          }
        });
      }

      if (editBtn) {
        const planId = editBtn.dataset.id;
        const plan = state.db.plans.find(p => p.id === planId);
        if (!plan) return;

        modal.open({
          title: "تعديل خطة الاشتراك",
          subtitle: plan.name,
          primaryText: "حفظ",
          secondaryText: "إلغاء",
          bodyHTML: `
            <div class="form form--dense">
              <div class="formGrid">
                <div class="formRow">
                  <label class="label" for="m_plan_name">الاسم</label>
                  <input id="m_plan_name" class="input" type="text" value="${escapeAttr(plan.name)}" />
                </div>
                <div class="formRow">
                  <label class="label" for="m_plan_months">المدة (شهور)</label>
                  <input id="m_plan_months" class="input" type="number" min="1" step="1" value="${escapeAttr(plan.months)}" />
                </div>
                <div class="formRow formRow--span2">
                  <label class="label" for="m_plan_price">السعر</label>
                  <input id="m_plan_price" class="input" type="number" min="0" step="1" value="${escapeAttr(plan.price)}" />
                </div>
              </div>
            </div>
          `,
          onConfirm: () => {
            const name = String(document.getElementById("m_plan_name")?.value || "").trim();
            const months = Number(document.getElementById("m_plan_months")?.value);
            const price = Number(document.getElementById("m_plan_price")?.value);

            if (!name || !Number.isFinite(months) || months < 1 || !Number.isFinite(price) || price < 0) {
              toast(el.toasts, "danger", "بيانات غير صحيحة", "تحقق من المدخلات.");
              return;
            }
            if (state.db.plans.some(p => p.name.toLowerCase() === name.toLowerCase() && p.id !== planId)) {
              toast(el.toasts, "warn", "موجود بالفعل", "اسم الخطة موجود.");
              return;
            }

            state.db.plans = state.db.plans.map(p => p.id === planId ? ({
              ...p,
              name,
              months: Math.round(months),
              price: Math.round(price),
            }) : p);

            state.db = saveDB(state.db);
            toast(el.toasts, "success", "تم الحفظ", "تم تعديل الخطة.");
            modal.close();
            renderAll();
          }
        });
      }
    });

    // player announcement (separate content file)
    el.savePlayerAnnouncementBtn.addEventListener("click", () => {
      const msg = String(el.playerAnnouncementInput.value || "");
      state.content.playerAnnouncement = msg;
      state.content = saveContent(state.content);
      toast(el.toasts, "success", "تم الحفظ", "تم حفظ رسالة الإدارة للاعبين.");
      renderPlayerPortal();
    });

    // reset db
    el.resetDbBtn.addEventListener("click", () => {
      modal.open({
        title: "مسح كل البيانات",
        subtitle: "سيتم حذف كل اللاعبين والمدفوعات والحضور والمصروفات.",
        primaryText: "مسح",
        secondaryText: "إلغاء",
        bodyHTML: `<div class="alert alert--danger">هذا الإجراء لا يمكن التراجع عنه.</div>`,
        onConfirm: () => {
          localStorage.clear();
          sessionStorage.clear();
          location.reload();
        }
      });
    });
  }

  function hydrateInitial() {
    el.playerStartDateInput.value = todayISO();
    el.expenseDateInput.value = todayISO();
    el.playerAnnouncementInput.value = state.content.playerAnnouncement || "";

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
  }

  function tickNow() {
    if (el.adminNow) el.adminNow.textContent = nowHuman();
    if (el.playerNow) el.playerNow.textContent = nowHuman();
    if (el.dbStatus) el.dbStatus.textContent = "قاعدة البيانات: localStorage";
  }

  function showLoginError(msg) {
    el.loginError.textContent = msg;
    el.loginError.classList.remove("hidden");
  }
  function clearLoginError() {
    el.loginError.textContent = "";
    el.loginError.classList.add("hidden");
  }

  function showView(which) {
    el.viewLogin.classList.toggle("view--active", which === "login");
    el.viewAdmin.classList.toggle("view--active", which === "admin");
    el.viewPlayer.classList.toggle("view--active", which === "player");
  }

  function openSidebar() {
    el.sidebar.classList.add("sidebar--open");
    el.backdrop.classList.remove("hidden");
  }
  function closeSidebar() {
    el.sidebar.classList.remove("sidebar--open");
    el.backdrop.classList.add("hidden");
  }

  function logout() {
    clearSession();
    state.session = null;
    toast(el.toasts, "info", "تم تسجيل الخروج", "انتهت الجلسة.");
    showView("login");
    clearLoginError();
  }

  function setAdminPage(page) {
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
    Object.entries(map).forEach(([k, node]) => node.classList.toggle("page--active", k === page));

    // title/subtitle
    const titles = {
      dashboard: { t: "الرئيسية", s: "نظرة عامة وإحصائيات" },
      members: { t: "الأعضاء", s: "إضافة وتعديل وتجديد وتحديد المجموعات" },
      financials: { t: "المالية", s: "إيراد ومصروفات وصافي الربح" },
      settings: { t: "الإعدادات", s: "النسخ الاحتياطي، المجموعات، وخطط الاشتراك" },
    };
    el.adminPageTitle.textContent = titles[page]?.t || "الرئيسية";
    el.adminPageSubtitle.textContent = titles[page]?.s || "";

    closeSidebar();
    renderAll();
  }

  function adminPrereqsOk() {
    // must have at least 1 group and 1 plan
    const ok = (state.db.groups?.length || 0) > 0 && (state.db.plans?.length || 0) > 0;
    el.membersPrereqNotice.classList.toggle("hidden", ok);
    el.createPlayerBtn.disabled = !ok;
    if (!ok) {
      el.membersPrereqNotice.textContent = "لا يمكنك إضافة لاعب قبل إنشاء (مجموعة واحدة على الأقل) و(خطة اشتراك واحدة على الأقل) من الإعدادات.";
    }
    return ok;
  }

  function renderAll() {
    // keep fresh
    state.db = ensureDB();
    state.content = ensureContent();

    if (state.session?.role === "admin") {
      adminPrereqsOk();
      renderSelects();
      renderDashboard();
      renderPlayersTable();
      renderFinancials();
      renderSettingsLists();
      el.playerAnnouncementInput.value = state.content.playerAnnouncement || "";
    }
    if (state.session?.role === "player") {
      renderPlayerPortal();
    }
  }

  function renderSelects() {
    // groups
    el.playerGroupSelect.innerHTML = "";
    for (const g of state.db.groups) {
      const opt = document.createElement("option");
      opt.value = g;
      opt.textContent = g;
      el.playerGroupSelect.appendChild(opt);
    }

    // plans
    el.playerPlanSelect.innerHTML = "";
    for (const p of state.db.plans) {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = `${p.name} — ${p.months} شهر — ${money(p.price, state.db.settings.currencyLabel)}`;
      el.playerPlanSelect.appendChild(opt);
    }
  }

  function renderDashboard() {
    const total = state.db.players.length;
    const active = state.db.players.filter(p => playerStatus(p) === "نشط").length;
    const expired = total - active;

    const revenue = computeRevenueThisMonth(state.db);
    const expenses = computeExpensesThisMonth(state.db);
    const profit = revenue - expenses;

    el.statActiveMembers.textContent = String(active);
    el.statMembersHint.textContent = `${expired} منتهي`;

    el.statRevenue.textContent = money(revenue, state.db.settings.currencyLabel);
    el.statExpenses.textContent = money(expenses, state.db.settings.currencyLabel);
    el.statProfit.textContent = money(profit, state.db.settings.currencyLabel);

    if (profit >= 0) {
      el.statProfitBadge.className = "badge badge--success";
      el.statProfitBadge.textContent = "ربح";
      el.statProfitHint.textContent = "صافي الربح موجب";
      el.barNet.className = "barFill barFill--success";
    } else {
      el.statProfitBadge.className = "badge badge--danger";
      el.statProfitBadge.textContent = "خسارة";
      el.statProfitHint.textContent = "صافي الربح سالب";
      el.barNet.className = "barFill";
      el.barNet.style.background = "linear-gradient(90deg, rgba(255,77,79,0.85), rgba(255,77,79,0.20))";
    }

    const max = Math.max(revenue, expenses, Math.abs(profit), 1);
    el.barRevenue.style.width = `${Math.round((revenue / max) * 100)}%`;
    el.barExpenses.style.width = `${Math.round((expenses / max) * 100)}%`;
    el.barNet.style.width = `${Math.round((Math.abs(profit) / max) * 100)}%`;

    el.barRevenueVal.textContent = money(revenue, state.db.settings.currencyLabel);
    el.barExpensesVal.textContent = money(expenses, state.db.settings.currencyLabel);
    el.barNetVal.textContent = money(profit, state.db.settings.currencyLabel);

    // groups overview
    const counts = {};
    for (const g of state.db.groups) counts[g] = 0;
    for (const p of state.db.players) counts[p.group] = (counts[p.group] || 0) + 1;

    const entries = Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0], "ar"));
    const maxG = Math.max(...entries.map(([, c]) => c), 1);
    el.groupsOverview.innerHTML = "";

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
      count.textContent = `${c} لاعب`;

      const track = document.createElement("div");
      track.className = "groupBar__track";

      const fill = document.createElement("div");
      fill.className = "groupBar__fill";
      fill.style.width = `${Math.round((c / maxG) * 100)}%`;

      top.appendChild(name);
      top.appendChild(count);
      track.appendChild(fill);
      wrap.appendChild(top);
      wrap.appendChild(track);

      el.groupsOverview.appendChild(wrap);
    }
  }

  function renderPlayersTable() {
    const search = String(state.memberSearch || "").trim().toLowerCase();
    let players = sortPlayersNameAsc(state.db.players);

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
      tdCode.innerHTML = `<span class="mono">${escapeHtml(String(p.accessCode))}</span>`;

      const tdGroup = document.createElement("td");
      const sel = document.createElement("select");
      sel.className = "select";
      sel.style.maxWidth = "190px";
      sel.dataset.action = "changeGroup";
      sel.dataset.id = p.id;

      for (const g of state.db.groups) {
        const opt = document.createElement("option");
        opt.value = g;
        opt.textContent = g;
        if (p.group === g) opt.selected = true;
        sel.appendChild(opt);
      }
      tdGroup.appendChild(sel);

      const tdExpiry = document.createElement("td");
      tdExpiry.textContent = isoToHuman(p.expiryDate);

      const tdStatus = document.createElement("td");
      const badge = document.createElement("span");
      badge.className = status === "نشط" ? "badge badge--success" : "badge badge--danger";
      badge.textContent = status;
      tdStatus.appendChild(badge);

      const tdActions = document.createElement("td");
      const actions = document.createElement("div");
      actions.className = "rowActions";

      const btnEdit = document.createElement("button");
      btnEdit.className = "btn btn--ghost";
      btnEdit.type = "button";
      btnEdit.textContent = "تعديل";
      btnEdit.dataset.action = "edit";
      btnEdit.dataset.id = p.id;

      const btnRenew = document.createElement("button");
      btnRenew.className = "btn btn--primary";
      btnRenew.type = "button";
      btnRenew.textContent = "تجديد";
      btnRenew.dataset.action = "renew";
      btnRenew.dataset.id = p.id;

      const btnDelete = document.createElement("button");
      btnDelete.className = "btn btn--danger";
      btnDelete.type = "button";
      btnDelete.textContent = "حذف";
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
  }

  function renderFinancials() {
    const revenue = computeRevenueThisMonth(state.db);
    const expenses = computeExpensesThisMonth(state.db);
    const profit = revenue - expenses;

    el.finRevenue.textContent = money(revenue, state.db.settings.currencyLabel);
    el.finExpenses.textContent = money(expenses, state.db.settings.currencyLabel);
    el.finProfit.textContent = money(profit, state.db.settings.currencyLabel);
    el.finMembers.textContent = String(state.db.players.length);

    if (profit >= 0) {
      el.finProfitBadge.className = "badge badge--success";
      el.finProfitBadge.textContent = "ربح";
      el.finProfitHint.textContent = "صافي الربح موجب";
    } else {
      el.finProfitBadge.className = "badge badge--danger";
      el.finProfitBadge.textContent = "خسارة";
      el.finProfitHint.textContent = "صافي الربح سالب";
    }

    const monthExpenses = state.db.expenses
      .filter(e => e?.date && isThisMonthISO(e.date))
      .sort((a, b) => new Date(`${b.date}T00:00:00`).getTime() - new Date(`${a.date}T00:00:00`).getTime());

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
      tdAmount.innerHTML = `<span class="mono">${escapeHtml(money(ex.amount, state.db.settings.currencyLabel))}</span>`;

      const tdActions = document.createElement("td");
      const actions = document.createElement("div");
      actions.className = "rowActions";

      const del = document.createElement("button");
      del.className = "btn btn--danger";
      del.type = "button";
      del.textContent = "حذف";
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
  }

  function renderSettingsLists() {
    // groups
    el.groupsList.innerHTML = "";
    for (const g of state.db.groups) {
      const used = state.db.players.filter(p => p.group === g).length;

      const li = document.createElement("li");
      li.className = "listItem";

      const left = document.createElement("div");
      left.className = "listItem__left";

      const title = document.createElement("div");
      title.className = "listItem__title";
      title.textContent = g;

      const meta = document.createElement("div");
      meta.className = "listItem__meta";
      meta.textContent = `${used} مُسند`;

      left.appendChild(title);
      left.appendChild(meta);

      const right = document.createElement("div");
      right.className = "rowActions";

      const edit = document.createElement("button");
      edit.className = "btn btn--ghost";
      edit.type = "button";
      edit.textContent = "تعديل";
      edit.dataset.action = "editGroup";
      edit.dataset.group = g;

      const canDelete = used === 0 && state.db.groups.length > 1;
      const del = document.createElement("button");
      del.className = canDelete ? "btn btn--danger" : "btn btn--ghost";
      del.type = "button";
      del.textContent = canDelete ? "حذف" : "مستخدمة";
      del.disabled = !canDelete;
      del.dataset.action = "deleteGroup";
      del.dataset.group = g;

      right.appendChild(edit);
      right.appendChild(del);

      li.appendChild(left);
      li.appendChild(right);

      el.groupsList.appendChild(li);
    }

    // plans
    el.plansList.innerHTML = "";
    for (const p of state.db.plans) {
      const li = document.createElement("li");
      li.className = "listItem";

      const left = document.createElement("div");
      left.className = "listItem__left";

      const title = document.createElement("div");
      title.className = "listItem__title";
      title.textContent = p.name;

      const meta = document.createElement("div");
      meta.className = "listItem__meta";
      meta.textContent = `${p.months} شهر • ${money(p.price, state.db.settings.currencyLabel)}`;

      left.appendChild(title);
      left.appendChild(meta);

      const right = document.createElement("div");
      right.className = "rowActions";

      const edit = document.createElement("button");
      edit.className = "btn btn--ghost";
      edit.type = "button";
      edit.textContent = "تعديل";
      edit.dataset.action = "editPlan";
      edit.dataset.id = p.id;

      const canDelete = state.db.plans.length > 1;
      const del = document.createElement("button");
      del.className = canDelete ? "btn btn--danger" : "btn btn--ghost";
      del.type = "button";
      del.textContent = canDelete ? "حذف" : "آخر خطة";
      del.disabled = !canDelete;
      del.dataset.action = "deletePlan";
      del.dataset.id = p.id;

      right.appendChild(edit);
      right.appendChild(del);

      li.appendChild(left);
      li.appendChild(right);

      el.plansList.appendChild(li);
    }
  }

  function renderPlayerPortal() {
    if (!state.session || state.session.role !== "player") return;

    const p = state.db.players.find(x => x.id === state.session.playerId);
    if (!p) {
      toast(el.toasts, "danger", "جلسة غير صالحة", "اللاعب غير موجود. أعد تسجيل الدخول.");
      clearSession();
      showView("login");
      return;
    }

    const status = playerStatus(p);
    const letter = (p.name || "ل").trim().slice(0, 1).toUpperCase();

    el.playerAvatarLetter.textContent = letter;
    el.playerGreetingName.textContent = p.name || "لاعب";
    el.playerCodeText.textContent = String(p.accessCode);
    el.playerGroupText.textContent = p.group || "—";
    el.playerValidUntil.textContent = isoToHuman(p.expiryDate);

    const plan = getPlanById(state.db, p.subscriptionPlanId);
    el.playerPlanName.textContent = plan ? plan.name : "—";

    if (status === "نشط") {
      el.playerStatusBadge.className = "badge badge--success";
      el.playerStatusBadge.textContent = "نشط";
    } else {
      el.playerStatusBadge.className = "badge badge--danger";
      el.playerStatusBadge.textContent = "منتهي";
    }

    // announcement (content.js)
    const msg = String(state.content.playerAnnouncement || "").trim();
    el.playerAnnouncementBox.textContent = msg ? msg : "لا توجد رسالة حالياً.";

    // per-player note
    const note = String(p.adminNote || "").trim();
    el.playerNoteBox.textContent = note ? note : "لا توجد ملاحظة خاصة حالياً.";

    // attendance
    const attendance = Array.isArray(p.attendance) ? p.attendance : [];
    el.attendanceCount.textContent = String(attendance.length);
    const recent = [...attendance].slice(-12).reverse();

    el.attendanceList.innerHTML = "";
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
        meta.textContent = "تم تسجيل حضور";

        left.appendChild(title);
        left.appendChild(meta);

        const right = document.createElement("div");
        right.innerHTML = `<span class="badge badge--neon">حاضر</span>`;

        li.appendChild(left);
        li.appendChild(right);

        el.attendanceList.appendChild(li);
      }
    }

    // check-in button
    const t = todayISO();
    const already = attendance.includes(t);
    el.checkInBtn.disabled = already;
    el.checkInBtn.textContent = already ? "تم تسجيل اليوم ✅" : "تسجيل حضور اليوم";

    // payments
    const payments = Array.isArray(p.payments) ? p.payments : [];
    const sorted = [...payments].sort((a, b) => {
      const ad = a?.date ? new Date(`${a.date}T00:00:00`).getTime() : 0;
      const bd = b?.date ? new Date(`${b.date}T00:00:00`).getTime() : 0;
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

        const tdPlan = document.createElement("td");
        tdPlan.textContent = pay.planName || "—";

        const tdAmount = document.createElement("td");
        tdAmount.innerHTML = `<span class="mono">${escapeHtml(money(pay.amount, state.db.settings.currencyLabel))}</span>`;

        const tdNote = document.createElement("td");
        tdNote.textContent = pay.note || "—";

        tr.appendChild(tdDate);
        tr.appendChild(tdPlan);
        tr.appendChild(tdAmount);
        tr.appendChild(tdNote);

        el.paymentTbody.appendChild(tr);
      }
    }
  }

  function openEditPlayer(playerId) {
    const p = state.db.players.find(x => x.id === playerId);
    if (!p) return;

    const groupsOptions = state.db.groups
      .map(g => `<option value="${escapeAttr(g)}" ${p.group === g ? "selected" : ""}>${escapeHtml(g)}</option>`)
      .join("");

    const plansOptions = state.db.plans
      .map(pl => `<option value="${escapeAttr(pl.id)}" ${p.subscriptionPlanId === pl.id ? "selected" : ""}>${escapeHtml(pl.name)} — ${pl.months} شهر — ${escapeHtml(money(pl.price, state.db.settings.currencyLabel))}</option>`)
      .join("");

    modal.open({
      title: "تعديل بيانات اللاعب",
      subtitle: `الكود: ${p.accessCode}`,
      primaryText: "حفظ",
      secondaryText: "إلغاء",
      bodyHTML: `
        <div class="form form--dense">
          <div class="formGrid">
            <div class="formRow">
              <label class="label" for="m_name">الاسم</label>
              <input id="m_name" class="input" type="text" value="${escapeAttr(p.name)}" />
            </div>

            <div class="formRow">
              <label class="label" for="m_age">العمر</label>
              <input id="m_age" class="input" type="number" min="4" max="99" value="${escapeAttr(p.age)}" />
            </div>

            <div class="formRow">
              <label class="label" for="m_phone">الهاتف</label>
              <input id="m_phone" class="input" type="tel" value="${escapeAttr(p.phone)}" />
            </div>

            <div class="formRow">
              <label class="label" for="m_group">المجموعة</label>
              <select id="m_group" class="select">${groupsOptions}</select>
            </div>

            <div class="formRow">
              <label class="label" for="m_plan">الخطة</label>
              <select id="m_plan" class="select">${plansOptions}</select>
            </div>

            <div class="formRow">
              <label class="label" for="m_start">تاريخ البداية</label>
              <input id="m_start" class="input" type="date" value="${escapeAttr(p.startDate)}" />
            </div>

            <div class="formRow formRow--span2">
              <label class="label" for="m_note">وصف/ملاحظة من الإدارة (تظهر للاعب)</label>
              <textarea id="m_note" class="input textarea" rows="5" placeholder="اكتب وصف/تعليمات خاصة لهذا اللاعب...">${escapeHtml(p.adminNote || "")}</textarea>
            </div>
          </div>

          <div class="chip chip--outline">
            سيتم إعادة حساب تاريخ الانتهاء إذا غيرت (الخطة) أو (تاريخ البداية).
          </div>
        </div>
      `,
      onConfirm: () => {
        const name = String(document.getElementById("m_name")?.value || "").trim();
        const age = Number(document.getElementById("m_age")?.value);
        const phone = String(document.getElementById("m_phone")?.value || "").trim();
        const group = String(document.getElementById("m_group")?.value || "").trim();
        const planId = String(document.getElementById("m_plan")?.value || "").trim();
        const startDate = String(document.getElementById("m_start")?.value || "").trim() || todayISO();
        const note = String(document.getElementById("m_note")?.value || "");

        if (!name || !phone || !Number.isFinite(age) || age < 4) {
          toast(el.toasts, "danger", "بيانات غير صحيحة", "تأكد من الاسم/العمر/الهاتف.");
          return;
        }

        const plan = getPlanById(state.db, planId);
        if (!plan) {
          toast(el.toasts, "danger", "خطة غير موجودة", "اختر خطة صحيحة.");
          return;
        }

        const idx = state.db.players.findIndex(x => x.id === playerId);
        if (idx === -1) return;

        const old = state.db.players[idx];
        const planChanged = old.subscriptionPlanId !== planId;
        const startChanged = old.startDate !== startDate;

        let expiryDate = old.expiryDate;
        if (planChanged || startChanged) {
          expiryDate = addMonthsISO(startDate, Number(plan.months));
        }

        state.db.players[idx] = {
          ...old,
          name,
          age,
          phone,
          group,
          subscriptionPlanId: planId,
          startDate,
          expiryDate,
          adminNote: note,
          updatedAt: new Date().toISOString(),
        };

        state.db = saveDB(state.db);
        toast(el.toasts, "success", "تم الحفظ", "تم تحديث بيانات اللاعب.");
        modal.close();
        renderAll();
      }
    });
  }

  function openRenewPlayer(playerId) {
    const p = state.db.players.find(x => x.id === playerId);
    if (!p) return;

    const options = state.db.plans.map(pl => `
      <label class="listItem" style="cursor:pointer;">
        <div class="listItem__left">
          <div class="listItem__title">${escapeHtml(pl.name)}</div>
          <div class="listItem__meta">${pl.months} شهر • ${escapeHtml(money(pl.price, state.db.settings.currencyLabel))}</div>
        </div>
        <div><input type="radio" name="renewPlan" value="${escapeAttr(pl.id)}" ${pl.id === p.subscriptionPlanId ? "checked" : ""} /></div>
      </label>
    `).join("");

    modal.open({
      title: "تجديد الاشتراك",
      subtitle: `${p.name} • الانتهاء الحالي: ${isoToHuman(p.expiryDate)}`,
      primaryText: "تأكيد التجديد",
      secondaryText: "إلغاء",
      bodyHTML: `
        <div class="stack">
          <div class="chip chip--outline">
            إذا كان الاشتراك نشطاً: التجديد يبدأ من تاريخ الانتهاء الحالي، وإلا يبدأ من اليوم.
          </div>
          <div class="stack">${options}</div>
        </div>
      `,
      onConfirm: () => {
        const chosen = document.querySelector('input[name="renewPlan"]:checked')?.value || p.subscriptionPlanId;
        const plan = getPlanById(state.db, chosen);
        if (!plan) {
          toast(el.toasts, "danger", "خطة غير موجودة", "اختر خطة صحيحة.");
          return;
        }

        const idx = state.db.players.findIndex(x => x.id === playerId);
        if (idx === -1) return;

        const t = todayISO();
        const base = isISOOnOrAfter(state.db.players[idx].expiryDate, t) ? state.db.players[idx].expiryDate : t;
        const newExpiry = addMonthsISO(base, Number(plan.months));

        const payments = Array.isArray(state.db.players[idx].payments) ? state.db.players[idx].payments : [];
        payments.push({
          id: safeUUID(),
          date: t,
          amount: Number(plan.price),
          planId: plan.id,
          planName: plan.name,
          note: "تجديد",
        });

        state.db.players[idx] = {
          ...state.db.players[idx],
          subscriptionPlanId: plan.id,
          expiryDate: newExpiry,
          payments,
          updatedAt: new Date().toISOString(),
        };

        state.db = saveDB(state.db);
        toast(el.toasts, "success", "تم التجديد", `تم تجديد الاشتراك: ${plan.name}`);
        modal.close();
        renderAll();
      }
    });
  }

  function openDeletePlayer(playerId) {
    const p = state.db.players.find(x => x.id === playerId);
    if (!p) return;

    modal.open({
      title: "حذف اللاعب",
      subtitle: `${p.name} • الكود: ${p.accessCode}`,
      primaryText: "حذف",
      secondaryText: "إلغاء",
      bodyHTML: `
        <div class="alert alert--danger">سيتم حذف اللاعب وسجل الحضور والمدفوعات نهائياً.</div>
        <div class="chip chip--outline">لا يمكن التراجع عن هذا الإجراء.</div>
      `,
      onConfirm: () => {
        state.db.players = state.db.players.filter(x => x.id !== playerId);
        state.db = saveDB(state.db);
        toast(el.toasts, "warn", "تم الحذف", "تم حذف اللاعب.");
        modal.close();
        renderAll();
      }
    });
  }

  function exportBackup() {
    // backup includes: db + content, with players sorted NAME ASC
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const exportObj = {
      exportedAt: new Date().toISOString(),
      db: {
        ...state.db,
        players: sortPlayersNameAsc(state.db.players).map(p => ({ ...p })),
      },
      content: { ...state.content },
    };

    const json = JSON.stringify(exportObj, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-sports-club-${stamp}.json`;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 0);

    toast(el.toasts, "info", "تم التصدير", "تم تنزيل ملف النسخة الاحتياطية.");
  }

  async function importBackup(file) {
    if (!file) {
      toast(el.toasts, "danger", "لا يوجد ملف", "اختر ملف JSON للاستيراد.");
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!parsed || typeof parsed !== "object") throw new Error("Invalid");
      if (!parsed.db || typeof parsed.db !== "object") throw new Error("Invalid");
      if (!Array.isArray(parsed.db.players) || !Array.isArray(parsed.db.expenses) || !Array.isArray(parsed.db.groups) || !Array.isArray(parsed.db.plans)) {
        throw new Error("Invalid");
      }

      // overwrite
      localStorage.setItem("scms_db_v2_ar", JSON.stringify(parsed.db));
      localStorage.setItem("scms_player_content_v1_ar", JSON.stringify(parsed.content || { playerAnnouncement: "", updatedAt: new Date().toISOString() }));

      // reload state
      state.db = ensureDB();
      state.content = ensureContent();

      toast(el.toasts, "success", "تم الاستيراد", "تم استعادة النسخة الاحتياطية.");
      renderAll();
    } catch {
      toast(el.toasts, "danger", "فشل الاستيراد", "الملف غير صالح أو هيكل البيانات غير صحيح.");
    }
  }
}
