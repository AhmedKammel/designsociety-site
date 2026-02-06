// ui.js
export function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function escapeAttr(str) {
  return escapeHtml(str).replaceAll("\n", " ");
}

export function toast(elToasts, type, title, msg) {
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

  elToasts.appendChild(t);

  setTimeout(() => {
    t.style.opacity = "0";
    t.style.transform = "translateY(-4px)";
    t.style.transition = "opacity 200ms ease, transform 200ms ease";
    setTimeout(() => t.remove(), 220);
  }, 3200);
}

export function createModalController(modalEls) {
  const state = { onConfirm: null };

  const open = ({ title, subtitle = "", bodyHTML = "", primaryText = "حفظ", secondaryText = "إلغاء", onConfirm }) => {
    modalEls.title.textContent = title;
    modalEls.subtitle.textContent = subtitle;
    modalEls.body.innerHTML = bodyHTML;

    modalEls.primary.textContent = primaryText;
    modalEls.secondary.textContent = secondaryText;

    state.onConfirm = onConfirm;
    modalEls.overlay.classList.remove("hidden");

    setTimeout(() => {
      const first = modalEls.body.querySelector("input, textarea, select, button");
      if (first) first.focus();
    }, 0);
  };

  const close = () => {
    modalEls.overlay.classList.add("hidden");
    modalEls.body.innerHTML = "";
    state.onConfirm = null;
  };

  const bind = () => {
    modalEls.close.addEventListener("click", close);
    modalEls.secondary.addEventListener("click", close);
    modalEls.primary.addEventListener("click", () => {
      if (typeof state.onConfirm === "function") state.onConfirm();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modalEls.overlay.classList.contains("hidden")) close();
    });
  };

  bind();

  return { open, close };
}
