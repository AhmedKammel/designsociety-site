// content.js (ملف منفصل لمحتوى صفحة اللاعب)
export const CONTENT_KEY = "scms_player_content_v1_ar";

export function defaultContent() {
  return {
    playerAnnouncement: "", // رسالة عامة لكل اللاعبين
    updatedAt: new Date().toISOString(),
  };
}

export function loadContent() {
  const raw = localStorage.getItem(CONTENT_KEY);
  if (!raw) return null;
  try {
    const c = JSON.parse(raw);
    if (!c || typeof c !== "object") return null;
    return c;
  } catch {
    return null;
  }
}

export function saveContent(content) {
  const c = content || defaultContent();
  c.updatedAt = new Date().toISOString();
  localStorage.setItem(CONTENT_KEY, JSON.stringify(c));
  return c;
}

export function ensureContent() {
  let c = loadContent();
  if (!c) c = defaultContent();
  if (typeof c.playerAnnouncement !== "string") c.playerAnnouncement = "";
  saveContent(c);
  return c;
}
