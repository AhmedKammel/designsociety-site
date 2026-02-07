/**
 * UI Gate (Demo only): blocks pages unless admin logged in.
 * NOTE: this is not real security (static hosting).
 */
const SESSION_KEY = "ds_admin_gate_session_v1";

function hasGateSession(){
  try{
    const raw = localStorage.getItem(SESSION_KEY);
    if(!raw) return false;
    const s = JSON.parse(raw);
    if(s.ok !== true) return false;
    if(!s.exp || Date.now() > s.exp) return false;
    return true;
  }catch{
    return false;
  }
}

function requireGate(){
  if(!hasGateSession()){
    // redirect to admin login
    location.replace("admin.html");
  }
}

function clearGate(){
  localStorage.removeItem(SESSION_KEY);
}

window.__DS_GATE__ = { hasGateSession, requireGate, clearGate };
