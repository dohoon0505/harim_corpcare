/* ============================================================
   ui.js — shared UI factories
   pageTitle() · openModal() (focus-trapped) · tableGrid() (DataTable)
   ============================================================ */
import { html, raw, setHTML, qs, qsa } from "./dom.js";
import { icon } from "./icons.js";

/* ── PageTitle (ports PageTitle.tsx) ────────────────────── */
export function pageTitle({ icon, imgSrc, title, action } = {}) {
  return html`
    <div class="page-title">
      <div class="page-title__main">
        ${imgSrc
          ? html`<img class="page-title__img" src="${imgSrc}" alt="" />`
          : icon
          ? html`<span class="page-title__emoji">${icon}</span>`
          : ""}
        <h1>${title}</h1>
      </div>
      ${action ? html`<div>${action}</div>` : ""}
    </div>
  `;
}

/* ── DataTable grid (ports DataTable.tsx) ───────────────── */
export function tableGrid({ columns, rows, rowKey, compact = false, fit = false }) {
  const cols = columns.map((c) => c.width ?? "1fr").join(" ");
  const acls = (a) => (a === "center" ? "is-center" : a === "right" ? "is-right" : "");
  return html`
    <div
      class="table-grid ${compact ? "table-grid--compact" : ""} ${fit ? "table-grid--fit" : ""}"
    >
      <div class="table-grid__head" style="grid-template-columns:${cols}">
        ${columns.map(
          (c) => html`<div class="table-grid__cell ${acls(c.align)}">${c.headerLabel ?? c.label}</div>`
        )}
      </div>
      ${rows.map(
        (row, idx) => html`
          <div
            class="table-grid__row"
            data-rowkey="${rowKey(row, idx)}"
            style="grid-template-columns:${cols}"
          >
            ${columns.map(
              (c) => html`<div class="table-grid__cell ${acls(c.align)}">${c.render(row, idx)}</div>`
            )}
          </div>
        `
      )}
    </div>
  `;
}

/* ── Modal chrome with ESC / backdrop / focus-trap ──────── */
const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * openModal({ panelClass, body, labelledBy, onClose }) → { panel, close, render }
 * - body: Html|string for the panel inner content
 * - render(newBody): swap panel content (state-driven modals) and re-focus-trap
 * - any element with [data-modal-close] (e.g. backdrop, X button) closes it
 */
export function openModal({ panelClass = "", body, labelledBy, onClose } = {}) {
  const prevFocus = document.activeElement;
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML =
    `<div class="modal-overlay__backdrop" data-modal-close></div>` +
    `<div class="modal-panel ${panelClass}" role="dialog" aria-modal="true"${
      labelledBy ? ` aria-labelledby="${labelledBy}"` : ""
    } tabindex="-1"></div>`;
  const panel = overlay.querySelector(".modal-panel");
  setHTML(panel, body);
  document.body.appendChild(overlay);

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    document.removeEventListener("keydown", onKey, true);
    overlay.remove();
    if (prevFocus && prevFocus.focus) prevFocus.focus();
    onClose && onClose();
  }
  function focusFirst() {
    const f = qsa(panel, FOCUSABLE);
    (f[0] || panel).focus();
  }
  function onKey(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") {
      const f = qsa(panel, FOCUSABLE);
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
  overlay.addEventListener("click", (e) => {
    if (e.target.closest("[data-modal-close]")) close();
  });
  document.addEventListener("keydown", onKey, true);
  focusFirst();

  return {
    panel,
    close,
    render(newBody) {
      setHTML(panel, newBody);
      focusFirst();
    },
  };
}

/** Standard titled modal (ports Modal.tsx chrome): title bar + X + body slot.
 *  Any [data-action="close"] / [data-modal-close] element closes it. */
export function simpleModal({ title, body, panelClass = "", onClose } = {}) {
  const inner = html`
    <div class="modal-head">
      <h2 class="modal-title" id="modal-title">${title}</h2>
      <button class="modal-close" data-action="close" data-modal-close aria-label="닫기">
        ${icon("x", { size: 18 })}
      </button>
    </div>
    <div class="modal-body">${body}</div>
  `;
  const m = openModal({ panelClass, body: inner, labelledBy: "modal-title", onClose });
  m.panel.addEventListener("click", (e) => {
    if (e.target.closest("[data-action='close']")) m.close();
  });
  return m;
}

/* ── Custom dropdown (harim mob 스타일) ───────────────────────
 * 필드형 트리거 + 위로 뜨는 패널. 한 번에 하나만 열리고 바깥 클릭·ESC로 닫힘.
 * markup: <div class="dd"><button class="dd-trigger" aria-haspopup="listbox"
 *   aria-expanded="false"></button><div class="dd-panel" role="listbox"></div></div>
 * makeDropdown(rootEl, { unit, options, get, set }) → { renderTrigger, renderOpts, close, destroy }
 *   - options(): 현재 옵션 문자열 배열 · get(): 현재값 · set(v): 선택 반영
 *   - destroy(): 등록한 document 리스너 해제 (페이지 cleanup에서 호출) */
export function makeDropdown(root, { unit = "", options, get, set } = {}) {
  const trigger = qs(root, ".dd-trigger");
  const panel = qs(root, ".dd-panel");

  function renderOpts() {
    const cur = get();
    setHTML(
      panel,
      options().map(
        (v) => html`<button type="button" class="dd-opt ${v === cur ? "sel" : ""}"
          role="option" aria-selected="${String(v === cur)}" data-v="${v}">${v}${unit}</button>`
      )
    );
  }
  function renderTrigger() {
    trigger.textContent = get() + unit;
  }
  function close() {
    root.classList.remove("open");
    trigger.setAttribute("aria-expanded", "false");
  }
  function open() {
    qsa(document, ".dd.open").forEach((d) => d !== root && d.classList.remove("open"));
    renderOpts();
    root.classList.add("open");
    trigger.setAttribute("aria-expanded", "true");
    const sel = qs(panel, ".dd-opt.sel");
    if (sel) panel.scrollTop = sel.offsetTop - panel.clientHeight / 2 + sel.offsetHeight / 2;
  }
  const onTrigger = () => (root.classList.contains("open") ? close() : open());
  const onPanel = (e) => {
    const o = e.target.closest("[data-v]");
    if (!o) return;
    set(o.dataset.v);
    renderTrigger();
    close();
  };
  const onDocClick = (e) => { if (!root.contains(e.target)) close(); };
  const onKey = (e) => { if (e.key === "Escape") close(); };

  trigger.addEventListener("click", onTrigger);
  panel.addEventListener("click", onPanel);
  document.addEventListener("click", onDocClick);
  document.addEventListener("keydown", onKey);
  renderTrigger();

  return {
    renderTrigger,
    renderOpts,
    close,
    destroy() {
      trigger.removeEventListener("click", onTrigger);
      panel.removeEventListener("click", onPanel);
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    },
  };
}
