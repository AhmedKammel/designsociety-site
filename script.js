/* ================= GLOBAL STATE ================= */
// Default initial state
const defaultState = {
    members: [],
    expenses: []
};

// Load data from localStorage or initialize
let db = JSON.parse(localStorage.getItem('eliteSportsDB')) || defaultState;

// Admin Credentials (Hardcoded as requested)
const ADMIN_USER = "adminahmed";
const ADMIN_PASS = "ahmedkammel##";

/* ================= AUTHENTICATION ================= */

function switchLoginTab(type) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.login-form').forEach(f => f.classList.add('hidden'));
    
    if (type === 'admin') {
        document.querySelector('.tab-btn:first-child').classList.add('active');
        document.getElementById('admin-login-form').classList.remove('hidden');
    } else {
        document.querySelector('.tab-btn:last-child').classList.add('active');
        document.getElementById('player-login-form').classList.remove('hidden');
    }
}

// Admin Login
document.getElementById('admin-login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('admin-user').value;
    const pass = document.getElementById('admin-pass').value;

    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        showSection('admin-dashboard');
        renderAdminDashboard();
        showToast("Welcome Admin Ahmed");
    } else {
        alert("Invalid Admin Credentials!");
    }
});

// Player Login
document.getElementById('player-login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const code = document.getElementById('player-code').value;
    const player = db.members.find(m => m.code === code);

    if (player) {
        sessionStorage.setItem('currentPlayerCode', code);
        showSection('player-portal');
        renderPlayerPortal(player);
        showToast(`Welcome ${player.name}`);
    } else {
        alert("Invalid Access Code!");
    }
});

function logout() {
    sessionStorage.clear();
    showSection('login-section');
    document.getElementById('admin-login-form').reset();
    document.getElementById('player-login-form').reset();
}

function showSection(id) {
    document.querySelectorAll('section').forEach(s => {
        s.classList.remove('active-section');
        s.classList.add('hidden-section');
    });
    const target = document.getElementById(id);
    target.classList.remove('hidden-section');
    target.classList.add('active-section');
}

/* ================= ADMIN DASHBOARD LOGIC ================= */

function renderAdminView(viewId) {
    // Nav highlight
    document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active-nav'));
    event.currentTarget.classList.add('active-nav');

    // View Toggle
    document.querySelectorAll('.admin-view').forEach(v => v.classList.remove('active-view'));
    document.getElementById(`view-${viewId}`).classList.add('active-view');

    if(viewId === 'members') renderMembersTable();
    if(viewId === 'overview') updateStats();
    if(viewId === 'financials') renderExpenses();
}

// 1. Members Management
function renderMembersTable(filter = "") {
    const tbody = document.getElementById('members-table-body');
    tbody.innerHTML = "";

    // Sort by NAME ASCENDING (A-Z)
    const sortedMembers = [...db.members].sort((a, b) => a.name.localeCompare(b.name));

    sortedMembers.forEach(member => {
        if (member.name.toLowerCase().includes(filter.toLowerCase())) {
            const isExpired = new Date(member.expiryDate) < new Date();
            const statusClass = isExpired ? 'expired' : 'active';
            const statusText = isExpired ? 'Expired' : 'Active';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${member.name}</td>
                <td style="font-family: monospace; color: var(--accent);">${member.code}</td>
                <td>${member.group}</td>
                <td>${formatDate(member.expiryDate)}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="action-btn" onclick="renewMember('${member.code}')" title="Renew"><i class="fa-solid fa-rotate"></i></button>
                    <button class="action-btn delete-btn" onclick="deleteMember('${member.code}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        }
    });
}

function filterMembers() {
    const query = document.getElementById('search-member').value;
    renderMembersTable(query);
}

// Add Member Modal Logic
document.getElementById('add-member-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('new-name').value;
    const age = document.getElementById('new-age').value;
    const group = document.getElementById('new-group').value;
    const phone = document.getElementById('new-phone').value;
    const cost = parseFloat(document.getElementById('new-cost').value);
    const duration = parseInt(document.getElementById('new-duration').value);

    // Calculate Expiry
    const startDate = new Date();
    const expiryDate = new Date(startDate);
    expiryDate.setMonth(startDate.getMonth() + duration);

    // Generate Code
    let code;
    do {
        code = Math.floor(100000 + Math.random() * 900000).toString();
    } while (db.members.some(m => m.code === code));

    const newMember = {
        name, age, group, phone, code,
        startDate: startDate.toISOString(),
        expiryDate: expiryDate.toISOString(),
        payments: [{ date: startDate.toISOString(), amount: cost, type: 'Subscription' }],
        attendance: []
    };

    db.members.push(newMember);
    saveDB();
    
    closeModal('add-member-modal');
    e.target.reset();
    renderMembersTable();
    updateStats();
    showToast(`Added ${name} - Code: ${code}`);
});

function deleteMember(code) {
    if(confirm("Are you sure you want to delete this member?")) {
        db.members = db.members.filter(m => m.code !== code);
        saveDB();
        renderMembersTable();
        updateStats();
    }
}

function renewMember(code) {
    const member = db.members.find(m => m.code === code);
    const amount = parseFloat(prompt("Enter renewal amount ($):", "50"));
    
    if (amount && !isNaN(amount)) {
        // Extend by 1 month default for demo, in real app ask duration
        const currentExp = new Date(member.expiryDate) > new Date() ? new Date(member.expiryDate) : new Date();
        currentExp.setMonth(currentExp.getMonth() + 1);
        
        member.expiryDate = currentExp.toISOString();
        member.payments.push({
            date: new Date().toISOString(),
            amount: amount,
            type: 'Renewal'
        });
        
        saveDB();
        renderMembersTable();
        updateStats();
        showToast("Membership Renewed");
    }
}

// 2. Financials & Stats
function updateStats() {
    const totalMembers = db.members.length;
    
    // Revenue: Sum of all payments from all members
    const totalRevenue = db.members.reduce((sum, member) => {
        return sum + member.payments.reduce((pSum, p) => pSum + p.amount, 0);
    }, 0);

    const totalExpenses = db.expenses.reduce((sum, ex) => sum + ex.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    // DOM Updates
    document.getElementById('total-members-count').innerText = totalMembers;
    document.getElementById('total-revenue').innerText = `$${totalRevenue}`;
    document.getElementById('total-expenses').innerText = `$${totalExpenses}`;
    
    const profitEl = document.getElementById('net-profit');
    profitEl.innerText = `$${netProfit}`;
    profitEl.style.color = netProfit >= 0 ? 'var(--accent)' : 'var(--danger)';

    // Update Chart Bars
    const maxVal = Math.max(totalRevenue, totalExpenses, 1); // Avoid div by 0
    document.getElementById('bar-income').style.width = `${(totalRevenue / maxVal) * 100}%`;
    document.getElementById('bar-expense').style.width = `${(totalExpenses / maxVal) * 100}%`;
}

// Expenses Logic
document.getElementById('expense-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const desc = document.getElementById('expense-desc').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);

    db.expenses.push({
        description: desc,
        amount: amount,
        date: new Date().toISOString()
    });

    saveDB();
    e.target.reset();
    renderExpenses();
    updateStats();
    showToast("Expense Logged");
});

function renderExpenses() {
    const tbody = document.getElementById('expense-table-body');
    tbody.innerHTML = "";
    
    db.expenses.forEach((ex, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${ex.description}</td>
            <td>${formatDate(ex.date)}</td>
            <td style="color: var(--danger)">-$${ex.amount}</td>
            <td><button class="action-btn delete-btn" onclick="deleteExpense(${index})"><i class="fa-solid fa-trash"></i></button></td>
        `;
        tbody.appendChild(tr);
    });
}

function deleteExpense(index) {
    db.expenses.splice(index, 1);
    saveDB();
    renderExpenses();
    updateStats();
}

/* ================= PLAYER PORTAL LOGIC ================= */

function renderPlayerPortal(player) {
    document.getElementById('player-welcome-name').innerText = `Hello, ${player.name}!`;
    document.getElementById('player-expiry-date').innerText = formatDate(player.expiryDate);

    const isExpired = new Date(player.expiryDate) < new Date();
    const indicator = document.getElementById('player-status-indicator');
    
    if(isExpired) {
        indicator.innerText = "EXPIRED";
        indicator.style.color = "var(--danger)";
    } else {
        indicator.innerText = "ACTIVE";
        indicator.style.color = "var(--success)";
    }

    // Render History
    const list = document.getElementById('player-payment-list');
    list.innerHTML = "";
    player.payments.forEach(p => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${p.type} (${formatDate(p.date)})</span> <span style="color: var(--accent)">$${p.amount}</span>`;
        list.appendChild(li);
    });
}

function playerCheckIn() {
    const code = sessionStorage.getItem('currentPlayerCode');
    if (!code) return;

    const player = db.members.find(m => m.code === code);
    const today = new Date().toDateString();

    // Check if already checked in today
    const lastCheckIn = player.attendance.length > 0 ? new Date(player.attendance[player.attendance.length - 1]).toDateString() : "";

    if (lastCheckIn === today) {
        document.getElementById('last-checkin-msg').innerText = "You have already checked in today.";
        document.getElementById('last-checkin-msg').style.color = "var(--accent)";
    } else {
        player.attendance.push(new Date().toISOString());
        saveDB();
        document.getElementById('last-checkin-msg').innerText = "Checked in successfully at " + new Date().toLocaleTimeString();
        document.getElementById('last-checkin-msg').style.color = "var(--success)";
    }
}

/* ================= UTILS & EXPORT ================= */

function saveDB() {
    localStorage.setItem('eliteSportsDB', JSON.stringify(db));
}

function formatDate(isoString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(isoString).toLocaleDateString(undefined, options);
}

// Modal Helpers
function openModal(id) {
    document.getElementById(id).classList.add('show');
}
function closeModal(id) {
    document.getElementById(id).classList.remove('show');
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 3000);
}

// Export Data (Backup)
function exportBackupData() {
    const dataStr = JSON.stringify(db, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'elite_club_backup.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showToast("Database Exported Successfully!");
}

// Initial Load
function renderAdminDashboard() {
    updateStats();
}
