/* ============================================================
   admin-clients.js — 계열사 접속관리
   계열사 계정 목록 + 상세/수정/생성/삭제 (승인제도 없음, 필터 없음).
   store.clients(영속). 접속 아이디 수정 가능.
   ============================================================ */
import { html, setHTML, on, qs, qsa, el } from "../dom.js";
import { icon } from "../icons.js";
import { store } from "../store.js";
import { pageTitle, tableGrid, openModal, simpleModal, makeDropdown } from "../ui.js";

const STATUS_OPTS = ["활성", "정지"];

const FIELDS = [
  { section: "계정 정보" },
  { key: "accountId", label: "접속 아이디", icon: "user", grid: true, required: true },
  { key: "password", label: "비밀번호", icon: "hash", grid: true, required: true },
  { section: "회사 정보" },
  { key: "companyName", label: "회사명", icon: "building2", required: true },
  { key: "bizNumber", label: "사업자번호", icon: "hash", grid: true, required: true },
  { key: "ceoName", label: "대표자명", icon: "user", grid: true, required: true },
  { section: "담당자 정보" },
  { key: "managerName", label: "담당자명", icon: "user-check", grid: true, required: true },
  { key: "department", label: "부서·직위", icon: "building2", grid: true },
  { key: "contact", label: "연락처", icon: "phone", grid: true, required: true },
  { key: "email", label: "계산서 이메일", icon: "mail", grid: true },
  { section: "기타" },
  { key: "address", label: "사업장주소", icon: "map-pin" },
  { key: "status", label: "상태", type: "select", options: STATUS_OPTS, grid: true },
  { key: "joinDate", label: "등록일", icon: "calendar-days", grid: true },
];
const REQUIRED = FIELDS.filter((f) => f.required).map((f) => f.key);

const PILL = { "활성": "pill--success", "정지": "pill--danger" };
const statusPill = (s) => html`<span class="pill ${PILL[s] ?? "pill--gray"}">${s}</span>`;

function nextId(clients) {
  const max = clients.reduce((m, c) => Math.max(m, parseInt(String(c.id).replace(/\D/g, ""), 10) || 0), 0);
  return "C" + String(max + 1).padStart(3, "0");
}
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function mount(root, { nav }) {
  let activeModal = null;
  let saveTimer = null;
  let toastEl = null;
  let toastTimer = null;

  function closeModal() {
    if (activeModal) { activeModal.close(); activeModal = null; }
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
  }
  function toast(msg, kind = "ok") {
    if (toastEl) toastEl.remove();
    if (toastTimer) clearTimeout(toastTimer);
    toastEl = el(html`<div class="admin-toast admin-toast--${kind}">${icon(kind === "warn" ? "alert-circle" : "check-circle", { size: 16 })}<span>${msg}</span></div>`);
    document.body.appendChild(toastEl);
    toastTimer = setTimeout(() => { if (toastEl) toastEl.remove(); toastEl = null; toastTimer = null; }, 2600);
  }

  const columns = [
    { label: "순번", width: "56px", align: "center", render: (r, i) => String(i + 1).padStart(2, "0") },
    { label: "회사명", width: "1fr", render: (r) => html`<div class="ellipsis">${r.companyName}</div>` },
    { label: "접속 아이디", width: "150px", render: (r) => r.accountId },
    { label: "담당자", width: "96px", align: "center", render: (r) => r.managerName },
    { label: "연락처", width: "140px", align: "center", render: (r) => r.contact },
    { label: "상태", width: "88px", align: "center", render: (r) => statusPill(r.status) },
    {
      label: "관리", width: "96px", align: "center",
      render: (r) => html`<div class="admin-rowact">
          <button class="ptbl-edit" data-action="edit" data-id="${r.id}" aria-label="수정">${icon("pencil", { size: 14 })}</button>
          <button class="ptbl-del" data-action="del" data-id="${r.id}" aria-label="삭제">${icon("trash2", { size: 14 })}</button>
        </div>`,
    },
  ];

  function tableBody() {
    const rows = store.get().clients;
    if (rows.length === 0) return html`<div class="admin-empty">등록된 계열사가 없습니다.</div>`;
    return tableGrid({ columns, rows, rowKey: (r) => r.id, compact: true });
  }
  function summaryBody() {
    return html`총 <strong>${store.get().clients.length}</strong>개 계열사`;
  }

  function render() {
    setHTML(
      root,
      html`
        <div class="page-admin">
          <div class="admin-inner">
            ${pageTitle({
              imgSrc: "./assets/nav-profile.png",
              title: "계열사 접속관리",
              action: html`<button class="btn btn-secondary" data-action="new">${icon("user-plus", { size: 14 })} 신규 계열사 등록</button>`,
            })}
            <p class="admin-summary" data-slot="summary">${summaryBody()}</p>
            <div data-slot="table">${tableBody()}</div>
          </div>
        </div>
      `
    );
  }
  const refreshList = () => {
    const sum = qs(root, "[data-slot='summary']");
    const tbl = qs(root, "[data-slot='table']");
    if (sum) setHTML(sum, summaryBody());
    if (tbl) setHTML(tbl, tableBody());
  };

  // ── create/edit modal ──────────────────────────────────
  function field(f, form, isEdit) {
    if (f.type === "select") {
      return html`
        <div class="hm-field">
          <label>${f.label}</label>
          <div class="dd" data-dd-cf="${f.key}">
            <button type="button" class="dd-trigger" aria-haspopup="listbox" aria-expanded="false"></button>
            <div class="dd-panel" role="listbox"></div>
          </div>
        </div>
      `;
    }
    // 접속 아이디는 수정 시 변경 불가 → 비활성 입력
    const locked = isEdit && f.key === "accountId";
    return html`
      <div class="hm-field">
        <label for="cf-${f.key}">${f.label}${f.required ? html`<span class="req">*</span>` : ""}</label>
        <input class="hm-input" id="cf-${f.key}" data-cf="${f.key}" type="text" value="${form[f.key] ?? ""}" placeholder="${f.placeholder ?? f.label}" ${locked ? "disabled" : ""} />
      </div>
    `;
  }

  function openClientModal(client) {
    closeModal();
    const isEdit = !!client;
    const form = client
      ? { ...client }
      : { id: nextId(store.get().clients), accountId: "", password: "", companyName: "", bizNumber: "", ceoName: "", managerName: "", department: "", contact: "", email: "", address: "", status: "활성", joinDate: todayStr() };
    const isValid = () => REQUIRED.every((k) => String(form[k] ?? "").trim());

    const fieldsHtml = () => {
      const out = [];
      let i = 0;
      while (i < FIELDS.length) {
        const f = FIELDS[i];
        if (f.section) { out.push(html`<div class="hm-section">${f.section}</div>`); i++; continue; }
        if (f.grid && FIELDS[i + 1] && FIELDS[i + 1].grid) {
          out.push(html`<div class="hm-grid2">${field(f, form, isEdit)}${field(FIELDS[i + 1], form, isEdit)}</div>`);
          i += 2;
        } else { out.push(field(f, form, isEdit)); i++; }
      }
      return out;
    };

    const body = html`
      <div class="hm__head">
        <div>
          <h3>${isEdit ? "계열사 정보 수정" : "신규 계열사 등록"}</h3>
          <p>${isEdit ? "계열사 계정·회사·담당자 정보를 수정합니다." : "신규 계열사 계정과 정보를 등록합니다."}</p>
        </div>
        <button class="hm__x" data-action="close" aria-label="닫기">${icon("x", { size: 14 })}</button>
      </div>
      <div class="hm__body">${fieldsHtml()}</div>
      <div class="hm__foot">
        <button class="hm-btn hm-btn--secondary" data-action="close">취소</button>
        <button class="hm-btn hm-btn--primary" data-action="save" ${isValid() ? "" : "disabled"}>${isEdit ? "저장" : "등록"}</button>
      </div>
    `;
    const ddCfs = [];
    activeModal = openModal({ panelClass: "modal-panel--lg", body, onClose: () => { ddCfs.forEach((d) => d.destroy()); } });
    const saveBtn = () => qs(activeModal.panel, "[data-action='save']");
    const syncSave = () => { const b = saveBtn(); if (b) b.disabled = !isValid(); };

    /* select 필드는 공용 커스텀 드롭다운으로 (모달 닫힐 때 destroy) */
    qsa(activeModal.panel, "[data-dd-cf]").forEach((elc) => {
      const key = elc.dataset.ddCf;
      const f = FIELDS.find((x) => x.key === key);
      ddCfs.push(makeDropdown(elc, {
        options: () => f.options,
        get: () => form[key],
        set: (v) => { form[key] = v; syncSave(); },
      }));
    });

    on(activeModal.panel, "input", "[data-cf]", (e, t) => { form[t.dataset.cf] = t.value; syncSave(); });
    on(activeModal.panel, "click", "[data-action='close']", () => closeModal());
    on(activeModal.panel, "click", "[data-action='save']", () => {
      if (!isValid()) return;
      if (isEdit) store.updateClient({ ...form });
      else store.addClient({ ...form });
      const b = saveBtn();
      if (b) {
        b.disabled = true;
        b.className = "hm-btn hm-btn--ok";
        setHTML(b, html`${icon("check", { size: 15 })} ${isEdit ? "저장 완료!" : "등록 완료!"}`);
      }
      saveTimer = setTimeout(() => { saveTimer = null; closeModal(); render(); }, 900);
    });
  }

  function openDelete(client) {
    closeModal();
    const body = html`<div class="hm-warn"><span><b>삭제한 계정은 되돌릴 수 없습니다.</b> 계정(아이디·비밀번호)·정산·주문 정보가 모두 삭제됩니다.</span></div>`;
    const footer = html`
      <button class="hm-btn hm-btn--secondary" data-action="close">취소</button>
      <button class="hm-btn hm-btn--danger" data-action="do-del">삭제</button>
    `;
    activeModal = simpleModal({ title: `${client.companyName} 계열사를 삭제할까요?`, subtitle: client.accountId, size: "sm", body, footer, onClose: () => {} });
    on(activeModal.panel, "click", "[data-action='do-del']", () => {
      store.removeClient(client.id);
      closeModal();
      refreshList();
      toast(`${client.companyName} 계열사를 삭제했습니다`, "warn");
    });
  }

  render();

  const findClient = (id) => store.get().clients.find((c) => c.id === id);
  const offClick = on(root, "click", "[data-action]", (e, t) => {
    const a = t.dataset.action;
    if (a === "new") return openClientModal(null);
    const c = findClient(t.dataset.id);
    if (!c) return;
    if (a === "edit") openClientModal(c);
    else if (a === "del") openDelete(c);
  });

  return () => {
    offClick();
    closeModal();
    if (toastEl) toastEl.remove();
    if (toastTimer) clearTimeout(toastTimer);
  };
}
