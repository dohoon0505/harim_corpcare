/* ============================================================
   order.js — 경조상품 간편주문 (#/app) · 시안 mockups/order/08-brand.html 이식
   4단계 플로우: 경조사·상품 선택(단계적 공개) → 배송지·일시 → 리본문구·보내는분 → 확인·접수.
   데이터는 store(ALL_PRODUCTS·contacts·profiles) 연동. 드롭다운/데이트피커는 ui.js 공용 헬퍼.
   페이지 규약: mount(root, { nav }) → cleanup. dom.js html``/on() 사용.
   ============================================================ */
import { html, raw, setHTML, on, qs, qsa } from "../dom.js";
import { store, ALL_PRODUCTS, productKey } from "../store.js";
import { pageTitle, makeDropdown, makeDatepicker, simpleModal } from "../ui.js";

/* ── 경조사 정의 (배너 · 카테고리 · 링크 안내문구) ───────────── */
const OCC = {
  obit: { label: "근조 · 부고", cat: "근조화환",
    urlTitle: "부고장 링크가 있다면 붙여넣어주세요!", urlPh: "https:// 부고장 링크 붙여넣기" },
  wed:  { label: "축하 · 행사", cat: "축하화환",
    urlTitle: "청첩장 또는 초대장 링크가 있다면 붙여넣어주세요!", urlPh: "https:// 청첩장 · 초대장 링크 붙여넣기" },
};
/* 해당 경조사 3단화환 2종 (기존 카탈로그 재사용) */
const occProducts = (occ) => ALL_PRODUCTS.filter((p) => p.category === OCC[occ].cat && p.product.includes("3단화환"));

/* 리본 추천 문구 (기존 COMMON_PHRASES 재사용) */
const COMMON_PHRASES = [
  { group: "부고·근조", phrases: ["삼가 고인의 명복을 빕니다", "근조(謹弔)", "조의를 표합니다"] },
  { group: "결혼 축하", phrases: ["축 결혼(祝 結婚)", "화혼을 진심으로 축하드립니다", "행복한 새 출발을 축하합니다"] },
];

/* 부고장·청첩장 URL 데모 DB (경조사별) — 불러오기 시 배송지 자동입력 */
const MOCK_URL_DB = {
  obit: {
    "kakao.com":    { addr: "서울특별시 강남구 테헤란로 152 강남파이낸스센터 3층", toName: "김○○ 상주" },
    "naeil.com":    { addr: "경기도 성남시 분당구 판교로 289 판교오피스 빌딩",     toName: "이○○ 상주" },
    "mobile.co.kr": { addr: "서울특별시 중구 세종대로 110 서울시청 본관 2층",       toName: "박○○ 상주" },
  },
  wed: {
    "wedding.me":      { addr: "서울특별시 서초구 강남대로 373 홀리데이인 강남",     toName: "최○○ 신랑측" },
    "weddingbook.com": { addr: "서울특별시 마포구 백범로 235 서울창업허브 컨벤션홀", toName: "정○○ 신부측" },
  },
};

/* 배송 가능 시간 규정: 09:00 ~ 18:30 */
const BIZ = { openH: 9, closeH: 18, closeM: 30 };
const pad2 = (n) => String(n).padStart(2, "0");
const hourOptions = () => Array.from({ length: BIZ.closeH - BIZ.openH + 1 }, (_, i) => pad2(BIZ.openH + i));
const minOptions = (hour) => (+hour === BIZ.closeH ? ["00", "10", "20", "30"] : ["00", "10", "20", "30", "40", "50"]);
const inBizHours = (d) => { const t = d.getHours() * 60 + d.getMinutes(); return t >= BIZ.openH * 60 && t <= BIZ.closeH * 60 + BIZ.closeM; };
const DOW = ["일", "월", "화", "수", "목", "금", "토"];
const fmtYMD = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const CHECK_SVG = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.5 10 17.5 19 7" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const DONE_SVG = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.5 10 17.5 19 7" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
/* 간편선택 버튼 아이콘 (목록) */
const PICK_SVG = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="4.5" cy="6" r="1.4" fill="currentColor"/><circle cx="4.5" cy="12" r="1.4" fill="currentColor"/><circle cx="4.5" cy="18" r="1.4" fill="currentColor"/></svg>`;

function markup() {
  return html`
    <div class="page-order">
      ${pageTitle({ imgSrc: "./assets/nav-order.png", title: "경조화환 주문" })}
      <div class="sheet">
        <div class="sheet-head">
          <b>경조상품 간편주문</b>
          <span class="sub">경조화환을 간편하게 주문해보세요!</span>
        </div>

        <nav class="tabs">
          <button class="tab active" data-tab="1"><span class="done-dot">●</span>경조사 및 상품 선택</button>
          <button class="tab" data-tab="2"><span class="done-dot">●</span>배송지 정보 입력</button>
          <button class="tab" data-tab="3"><span class="done-dot">●</span>리본문구 입력</button>
          <button class="tab" data-tab="4"><span class="done-dot">●</span>작성내용 확인</button>
        </nav>

        <!-- STEP 1 · 경조사 및 상품 -->
        <section class="panel on" data-panel="1">
          <h2 class="q">어떤 경조사가 있으신가요?</h2>
          <p class="q-sub">경조사를 선택하면 알맞은 주문 방법을 안내해 드려요.</p>
          <div class="sec-gap" style="margin-top:24px;">
            <div class="sec-label" style="justify-content:space-between;">경조사 구분 <small>상황에 따른 상품선택</small></div>
            <div class="occ-stack">
              <button class="intake-card intake-obit" data-occ="obit">
                <span class="lbl"><b>근조 · 부고</b><span>부고장 간편접수 지원</span></span>
                <span class="occ-right"><span class="ck">✓</span><span class="arrow">›</span></span>
              </button>
              <button class="intake-card intake-wedding" data-occ="wed">
                <span class="lbl"><b>축하 · 행사</b><span>청첩장 · 초대장 간편접수 지원</span></span>
                <span class="occ-right"><span class="ck">✓</span><span class="arrow">›</span></span>
              </button>
            </div>
          </div>
          <div class="reveal" data-reveal="url">
            <div class="urlbox">
              <div class="ub-title"><span data-ub-title>부고장 링크가 있다면 붙여넣어주세요!</span> <span class="obadge">간편</span></div>
              <p class="ub-desc">링크 하나로 배송지 정보까지 자동으로 입력돼요.</p>
              <div class="url-row">
                <input type="text" data-url-input placeholder="https:// 부고장 링크 붙여넣기" />
                <button data-url-btn>불러오기</button>
              </div>
              <div class="url-msg" data-url-msg></div>
              <button class="direct-btn" data-direct-btn>링크 없이 직접 작성하기 →</button>
            </div>
          </div>
          <div class="reveal" data-reveal="prod">
            <div class="sec-gap" style="margin-top:32px;">
              <div class="sec-label">상품 선택 <small data-prod-hint></small></div>
              <div class="prod-list" data-prod-list></div>
            </div>
          </div>
          <div class="cta-row">
            <button class="btn-next" data-next="1" disabled>다음</button>
          </div>
        </section>

        <!-- STEP 2 · 배송지 -->
        <section class="panel" data-panel="2">
          <h2 class="q">어디로 보낼까요?</h2>
          <p class="q-sub">화환을 받으실 장소와 시간을 알려주세요.</p>
          <div class="sec-gap">
            <div class="ofield">
              <label>배송지 주소 <span class="auto-chip" data-auto-chip>링크에서 자동입력</span></label>
              <input type="text" data-f-addr placeholder="장례식장 · 예식장 주소를 입력해 주세요" />
            </div>
            <div class="grid2">
              <div class="ofield">
                <label>받는분 성함</label>
                <input type="text" data-f-toname placeholder="예) 김○○ 상주" />
              </div>
              <div class="ofield">
                <label>받는분 연락처</label>
                <input type="text" data-f-tophone placeholder="010-0000-0000" inputmode="numeric" />
              </div>
            </div>
          </div>
          <div class="sec-gap">
            <div class="sec-label">배송 일시</div>
            <div class="seg">
              <button data-seg="sched" class="sel">날짜 · 시간 지정</button>
              <button data-seg="imm">즉시배송</button>
            </div>
            <div class="dt-row" data-dt-row>
              <div class="dd datepick" data-dd-date>
                <button type="button" class="dd-trigger" aria-haspopup="dialog" aria-expanded="false"></button>
                <div class="dd-panel cal-panel" role="dialog" aria-label="배송 날짜 선택">
                  <div class="cal-head">
                    <button type="button" class="cal-nav cal-prev" aria-label="이전 달">‹</button>
                    <b class="cal-title"></b>
                    <button type="button" class="cal-nav cal-next" aria-label="다음 달">›</button>
                  </div>
                  <div class="cal-grid"></div>
                  <p class="cal-note">오늘부터 최대 30일까지 예약할 수 있어요</p>
                </div>
              </div>
              <div class="dd" data-dd-hour>
                <button type="button" class="dd-trigger" aria-haspopup="listbox" aria-expanded="false"></button>
                <div class="dd-panel" role="listbox"></div>
              </div>
              <div class="dd" data-dd-min>
                <button type="button" class="dd-trigger" aria-haspopup="listbox" aria-expanded="false"></button>
                <div class="dd-panel" role="listbox"></div>
              </div>
            </div>
            <div class="imm-note" data-imm-note></div>
            <div class="biz-note" data-biz-note></div>
            <p class="dt-info">배송 시간은 <b>09:00 ~ 18:30</b> 사이에서 지정할 수 있어요 · <b>오전 11시 이전</b> 접수 건은 당일 배송할 수 있어요</p>
          </div>
          <div class="cta-row">
            <button class="btn-back" data-goto="1">이전</button>
            <button class="btn-next" data-next="2" disabled>다음</button>
          </div>
        </section>

        <!-- STEP 3 · 리본문구 -->
        <section class="panel" data-panel="3">
          <h2 class="q">리본에 어떤 마음을 담을까요?</h2>
          <p class="q-sub">왼쪽 리본에는 문구가, 오른쪽 리본에는 보내는분이 새겨져요.</p>
          <div class="sec-gap">
            <div class="sec-label">리본 문구</div>
            <div class="rib-field">
              <div class="ribbon-wrap">
                <input type="text" data-ribbon-input maxlength="20" placeholder="문구를 직접 입력해 주세요" />
                <span class="cnt num" data-ribbon-cnt>0/20</span>
              </div>
              <button class="pick-btn" data-ribbon-pick type="button">${raw(PICK_SVG)}간편선택</button>
            </div>
            <p class="warn-line"><b>배송 시작 후 문구변경 시 비용이 청구될 수 있어요.</b> 한 번 더 확인해 주세요.</p>
          </div>
          <div class="sec-gap">
            <div class="sec-label">보내는분</div>
            <div class="rib-field">
              <div class="ribbon-wrap">
                <input type="text" data-sender-input maxlength="30" placeholder="보내는분을 직접 입력해 주세요" />
                <span class="cnt num" data-sender-cnt>0/30</span>
              </div>
              <button class="pick-btn" data-sender-pick type="button">${raw(PICK_SVG)}간편선택</button>
            </div>
            <p class="rib-hint">저장된 프로필에서 불러오거나, 직접 입력할 수 있어요.</p>
          </div>
          <div class="cta-row">
            <button class="btn-back" data-goto="2">이전</button>
            <button class="btn-next" data-next="3" disabled>다음</button>
          </div>
        </section>

        <!-- STEP 4 · 작성내용 확인 -->
        <section class="panel" data-panel="4">
          <h2 class="q">작성하신 내용을 확인해 주세요</h2>
          <p class="q-sub">잘못된 부분이 있다면 각 항목에서 바로 고칠 수 있어요.</p>
          <div class="confirm-list" data-cf-list></div>
          <div class="cf-amount"><span>결제 금액</span><b class="num" data-cf-amount>0원</b></div>
          <div class="opt-box">
            <div class="opt-row">
              <div class="ol">주문 담당자<small>주문 처리 상황을 안내받을 담당자예요</small></div>
              <select data-mgr-select></select>
            </div>
            <div class="opt-row">
              <div class="ol">배송완료 알림<small>배송이 끝나면 문자로 알려드려요</small></div>
              <div class="toggles">
                <button class="tg on" data-nt="recipient">${raw(CHECK_SVG)}받는분</button>
                <button class="tg on" data-nt="sender">${raw(CHECK_SVG)}보내는분</button>
                <button class="tg on" data-nt="manager">${raw(CHECK_SVG)}담당자</button>
              </div>
            </div>
          </div>
          <div class="cta-row">
            <button class="btn-back" data-goto="3">이전</button>
            <button class="btn-next" data-submit>주문 접수하기</button>
          </div>
          <p class="cta-hint">배송 시작 후 문구변경 시 비용이 청구될 수 있어요 · 문의 02-0000-0000</p>
        </section>

        <!-- 완료 -->
        <section class="panel panel-done" data-panel="done">
          <div class="done-ic">${raw(DONE_SVG)}</div>
          <h2>주문이 접수되었어요</h2>
          <p class="d-sub">배송이 시작되면 알림으로 알려드릴게요.<br />진행 상황은 실시간 주문내역에서 확인할 수 있어요.</p>
          <div class="done-box" data-done-box></div>
          <div class="done-cta">
            <button class="ghost" data-done-new>새 주문 작성하기</button>
            <button class="solid" data-done-orders>주문내역 보기</button>
          </div>
        </section>
      </div>
    </div>
  `;
}

export function mount(root, { nav }) {
  const state = {
    step: 1, maxStep: 1,
    occ: null, viaUrl: false,
    product: null, ribbon: "", sender: "",
    addr: "", toName: "", toPhone: "",
    immediate: false, date: "", hour: "09", min: "00",
    manager: 0,
    notify: { recipient: true, sender: true, manager: true },
  };
  /* 데이트피커 선택 범위: 오늘 00:00 ~ +30일. 기본값 = 내일. (in-place 갱신) */
  const dpMin = new Date(); dpMin.setHours(0, 0, 0, 0);
  const dpMax = new Date(dpMin); dpMax.setDate(dpMax.getDate() + 30);
  state.date = fmtYMD(new Date(dpMin.getTime() + 864e5));

  setHTML(root, markup());
  const $ = (s) => qs(root, s);
  const $$ = (s) => qsa(root, s);
  const scrollTop = () => (root.closest(".shell__main") || window).scrollTo({ top: 0, behavior: "smooth" });

  const valid = {
    1: () => !!(state.occ && state.product),
    2: () => !!(state.addr && state.toName && state.toPhone && (state.immediate || state.date)),
    3: () => !!(state.ribbon && state.sender),
  };

  /* ── 단계 이동 ── */
  function go(n) {
    state.step = n;
    state.maxStep = Math.max(state.maxStep, n);
    $$("[data-panel]").forEach((p) => p.classList.toggle("on", p.dataset.panel === String(n)));
    $$(".tab").forEach((t) => {
      const s = +t.dataset.tab;
      t.classList.toggle("active", s === n);
      t.classList.toggle("reach", s <= state.maxStep && s !== n);
      t.classList.toggle("complete", s < 4 && valid[s] && valid[s]());
    });
    if (n === 4) renderConfirm();
    scrollTop();
  }
  function refreshCtas() {
    $('[data-next="1"]').disabled = !valid[1]();
    $('[data-next="2"]').disabled = !valid[2]();
    $('[data-next="3"]').disabled = !valid[3]();
    $$(".tab").forEach((t) => {
      const s = +t.dataset.tab;
      if (s < 4 && valid[s]) t.classList.toggle("complete", valid[s]());
    });
  }

  /* ── STEP 1 · 단계적 공개 ── */
  function reveal(name) {
    const el = $(`[data-reveal="${name}"]`);
    if (el.classList.contains("show")) return;
    el.classList.add("show");
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  function revealProducts() { reveal("prod"); refreshCtas(); }

  function setOcc(occ) {
    if (state.occ !== occ) {
      state.occ = occ;
      state.product = null;
      state.ribbon = "";
      $("[data-ribbon-input]").value = "";
      updateCnt();
    }
    $$("[data-occ]").forEach((b) => b.classList.toggle("sel", b.dataset.occ === occ));
    $("[data-prod-hint]").textContent = OCC[occ].label + " 상품";
    $("[data-ub-title]").textContent = OCC[occ].urlTitle;
    $("[data-url-input]").placeholder = OCC[occ].urlPh;
    renderProducts(); refreshCtas();
    reveal("url");
  }
  function renderProducts() {
    if (!state.occ) return;
    setHTML($("[data-prod-list]"), html`
      ${occProducts(state.occ).map((p) => html`
        <button class="prod-row ${state.product && productKey(state.product) === productKey(p) ? "sel" : ""}" data-prod="${productKey(p)}">
          <span class="radio"></span>
          <span class="pi"><b>${p.product}</b><span>${p.category} · 표준 규격 · 당일배송 가능</span></span>
          <span class="pp num">${p.price}</span>
        </button>
      `)}
    `);
  }
  function onUrlLoad() {
    const url = $("[data-url-input]").value.trim().toLowerCase();
    const msg = $("[data-url-msg]");
    if (!url) { msg.className = "url-msg err"; msg.textContent = "링크를 입력해 주세요."; return; }
    for (const occ of ["obit", "wed"]) {
      const hit = Object.keys(MOCK_URL_DB[occ]).find((d) => url.includes(d));
      if (hit) {
        const d = MOCK_URL_DB[occ][hit];
        msg.className = "url-msg ok";
        msg.textContent = (occ === "obit" ? "부고장" : "청첩장") + "을 확인했어요. 배송지 정보를 자동으로 입력했어요.";
        setOcc(occ);
        state.addr = d.addr; state.toName = d.toName; state.viaUrl = true;
        $("[data-f-addr]").value = d.addr;
        $("[data-f-toname]").value = d.toName;
        $("[data-auto-chip]").classList.add("show");
        revealProducts();
        return;
      }
    }
    msg.className = "url-msg err";
    msg.textContent = "확인할 수 없는 링크예요. (데모: kakao.com · naeil.com · wedding.me · weddingbook.com)";
  }

  /* ── STEP 2 · 배송지 · 일시 ── */
  function onPhone(t) {
    let v = t.value.replace(/\D/g, "").slice(0, 11);
    if (v.length > 7) v = v.slice(0, 3) + "-" + v.slice(3, 7) + "-" + v.slice(7);
    else if (v.length > 3) v = v.slice(0, 3) + "-" + v.slice(3);
    t.value = v; state.toPhone = v; refreshCtas();
  }
  const ddHour = makeDropdown($("[data-dd-hour]"), {
    unit: "시", options: hourOptions,
    get: () => state.hour,
    set: (v) => {
      state.hour = v;
      if (!minOptions(v).includes(state.min)) { state.min = "30"; ddMin.renderTrigger(); }
    },
  });
  const ddMin = makeDropdown($("[data-dd-min]"), {
    unit: "분", options: () => minOptions(state.hour),
    get: () => state.min,
    set: (v) => { state.min = v; },
  });
  const dpDate = makeDatepicker($("[data-dd-date]"), {
    get: () => state.date, set: (v) => { state.date = v; refreshCtas(); },
    min: dpMin, max: dpMax,
  });

  function setImmediate(on_) {
    state.immediate = on_;
    $('[data-seg="imm"]').classList.toggle("sel", on_);
    $('[data-seg="sched"]').classList.toggle("sel", !on_);
    $("[data-dt-row]").classList.toggle("dim", on_);
    const note = $("[data-imm-note]");
    if (on_) {
      const d = new Date(Date.now() + 4 * 36e5);
      note.textContent = `영업시간 내 접수 건은 4시간 이내(${pad2(d.getHours())}:${pad2(d.getMinutes())} 전)에 배송해 드려요.`;
      note.classList.add("show");
    } else note.classList.remove("show");
    refreshCtas();
  }
  function applyBizRule() {
    const okBiz = inBizHours(new Date());
    $('[data-seg="imm"]').disabled = !okBiz;
    const biz = $("[data-biz-note]");
    if (!okBiz) {
      if (state.immediate) setImmediate(false);
      biz.textContent = "지금은 영업시간이 아니에요. 즉시배송은 영업시간(09:00 ~ 18:30)에만 접수할 수 있어요.";
      biz.classList.add("show");
    } else biz.classList.remove("show");
  }

  /* ── STEP 3 · 리본문구 · 보내는분 (텍스트 입력 + 간편선택 모달) ── */
  function updateCnt() { $("[data-ribbon-cnt]").textContent = $("[data-ribbon-input]").value.length + "/20"; }
  function updateSenderCnt() { $("[data-sender-cnt]").textContent = $("[data-sender-input]").value.length + "/30"; }

  let pickModal = null;
  const closePick = () => { if (pickModal) { pickModal.close(); pickModal = null; } };

  /* 리본 문구 간편선택 — 추천 문구 가이드 모달(직접입력과 병행) */
  function openRibbonPick() {
    closePick();
    const body = html`
      <p class="pick-intro">추천 문구를 선택하면 입력란에 채워져요. 이후 자유롭게 수정할 수 있어요.</p>
      ${COMMON_PHRASES.map((g) => html`
        <div class="pick-group">
          <p class="pick-group__label">${g.group}</p>
          <div class="pick-opts">
            ${g.phrases.map((ph) => html`<button class="pick-opt ${state.ribbon === ph ? "sel" : ""}" data-pick-phrase="${ph}" type="button">${ph}</button>`)}
          </div>
        </div>
      `)}
    `;
    pickModal = simpleModal({ title: "리본 문구 간편선택", panelClass: "modal-panel--pick", body, onClose: () => { pickModal = null; } });
    on(pickModal.panel, "click", "[data-pick-phrase]", (e, t) => {
      state.ribbon = t.dataset.pickPhrase;
      $("[data-ribbon-input]").value = state.ribbon;
      updateCnt(); refreshCtas(); closePick();
    });
  }

  /* 보내는분 간편선택 — 저장된 프로필에서 불러오기(직접입력과 병행) */
  function openSenderPick() {
    closePick();
    const profiles = store.get().profiles;
    const body = html`
      ${profiles.length === 0
        ? html`<div class="pick-empty">저장된 프로필이 없습니다.<br />아래에서 새 명의를 등록해 주세요.</div>`
        : html`<div class="pick-senders">
            ${profiles.map((p) => {
              const text = (p.greeting && p.greeting.trim()) || `${p.role} ${p.name}`;
              return html`<button class="pick-sender ${state.sender === text ? "sel" : ""}" data-pick-sender="${text}" type="button">
                <span class="pick-sender__main"><b>${p.name}</b> · ${p.role}</span>
                <span class="pick-sender__sub">${text}</span>
              </button>`;
            })}
          </div>`}
      <button class="pick-addprofile" data-pick-newprofile type="button">＋ 새 명의 등록하기</button>
    `;
    pickModal = simpleModal({ title: "보내는분 간편선택", panelClass: "modal-panel--pick", body, onClose: () => { pickModal = null; } });
    on(pickModal.panel, "click", "[data-pick-sender]", (e, t) => {
      state.sender = t.dataset.pickSender;
      $("[data-sender-input]").value = state.sender;
      updateSenderCnt(); refreshCtas(); closePick();
    });
    on(pickModal.panel, "click", "[data-pick-newprofile]", () => { closePick(); nav("#/app/profile"); });
  }

  /* ── STEP 4 · 확인 · 접수 ── */
  function dateLabel() {
    if (state.immediate) return "즉시배송";
    const d = new Date(state.date + "T00:00:00");
    return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DOW[d.getDay()]}) ${state.hour}:${state.min}`;
  }
  function renderManagers() {
    const contacts = store.get().contacts;
    setHTML($("[data-mgr-select]"), html`${contacts.map((c, i) => html`<option value="${i}">${c.name} · ${c.role}</option>`)}`);
  }
  function renderConfirm() {
    const p = state.product;
    setHTML($("[data-cf-list]"), html`
      <div class="cf-row"><span class="cl">경조사 · 상품</span>
        <span class="cv">${p.product}<small>${OCC[state.occ].label}</small></span>
        <button class="edit" data-goto="1">변경</button></div>
      <div class="cf-row"><span class="cl">배송지</span>
        <span class="cv">${state.addr}<small>${state.toName} · ${state.toPhone}</small></span>
        <button class="edit" data-goto="2">변경</button></div>
      <div class="cf-row"><span class="cl">배송 일시</span>
        <span class="cv">${dateLabel()}</span>
        <button class="edit" data-goto="2">변경</button></div>
      <div class="cf-row"><span class="cl">리본 문구</span>
        <span class="cv">${state.ribbon}<small>보내는분 · ${state.sender}</small></span>
        <button class="edit" data-goto="3">변경</button></div>
    `);
    $("[data-cf-amount]").textContent = p.price;
  }
  function submit() {
    const contacts = store.get().contacts;
    const c = contacts[state.manager] || contacts[0];
    setHTML($("[data-done-box]"), html`
      <div class="cf-row"><span class="cl">상품</span><span class="cv">${state.product.product}</span></div>
      <div class="cf-row"><span class="cl">리본 문구</span><span class="cv">${state.ribbon}</span></div>
      <div class="cf-row"><span class="cl">배송</span><span class="cv">${dateLabel()}<small>${state.addr}</small></span></div>
      <div class="cf-row"><span class="cl">담당자</span><span class="cv">${c.name} (${c.phone})</span></div>
      <div class="cf-row"><span class="cl">결제 금액</span><span class="cv num done-amount">${state.product.price}</span></div>
    `);
    $$("[data-panel]").forEach((p) => p.classList.remove("on"));
    $('[data-panel="done"]').classList.add("on");
    scrollTop();
  }

  /* ── 새 주문 작성하기: 페이지 재로드 없이 초기화 ── */
  function resetAll() {
    Object.assign(state, {
      step: 1, maxStep: 1, occ: null, viaUrl: false, product: null, ribbon: "", sender: "",
      addr: "", toName: "", toPhone: "", immediate: false, hour: "09", min: "00", manager: 0,
      notify: { recipient: true, sender: true, manager: true },
    });
    dpMin.setTime(Date.now()); dpMin.setHours(0, 0, 0, 0);
    dpMax.setTime(dpMin.getTime()); dpMax.setDate(dpMax.getDate() + 30);
    state.date = fmtYMD(new Date(dpMin.getTime() + 864e5));
    ["[data-url-input]", "[data-f-addr]", "[data-f-toname]", "[data-f-tophone]", "[data-ribbon-input]", "[data-sender-input]"].forEach((s) => { $(s).value = ""; });
    const msg = $("[data-url-msg]"); msg.className = "url-msg"; msg.textContent = "";
    $("[data-auto-chip]").classList.remove("show");
    $$("[data-reveal]").forEach((r) => r.classList.remove("show"));
    $$("[data-occ]").forEach((b) => b.classList.remove("sel"));
    setHTML($("[data-prod-list]"), "");
    $$("[data-nt]").forEach((t) => t.classList.add("on"));
    setImmediate(false);
    ddHour.renderTrigger(); ddMin.renderTrigger(); dpDate.renderTrigger();
    updateCnt(); updateSenderCnt(); applyBizRule();
    go(1);
  }

  /* ── 이벤트 바인딩 (위임 · cleanup 시 해제) ── */
  const offs = [];
  const bind = (type, sel, fn) => offs.push(on(root, type, sel, fn));

  bind("click", ".tab.reach", (e, t) => go(+t.dataset.tab));
  bind("click", "[data-goto]", (e, t) => go(+t.dataset.goto));
  bind("click", '[data-next="1"]', () => go(2));
  bind("click", '[data-next="2"]', () => go(3));
  bind("click", '[data-next="3"]', () => go(4));
  bind("click", "[data-occ]", (e, t) => setOcc(t.dataset.occ));
  bind("click", "[data-url-btn]", onUrlLoad);
  bind("click", "[data-direct-btn]", revealProducts);
  bind("click", "[data-prod]", (e, t) => {
    state.product = occProducts(state.occ).find((p) => productKey(p) === t.dataset.prod) || null;
    renderProducts(); refreshCtas();
  });
  bind("input", "[data-f-addr]", (e, t) => {
    state.addr = t.value.trim();
    if (state.viaUrl) { state.viaUrl = false; $("[data-auto-chip]").classList.remove("show"); }
    refreshCtas();
  });
  bind("input", "[data-f-toname]", (e, t) => { state.toName = t.value.trim(); refreshCtas(); });
  bind("input", "[data-f-tophone]", (e, t) => onPhone(t));
  bind("click", '[data-seg="imm"]', () => setImmediate(true));
  bind("click", '[data-seg="sched"]', () => setImmediate(false));
  bind("click", "[data-ribbon-pick]", openRibbonPick);
  bind("input", "[data-ribbon-input]", (e, t) => {
    state.ribbon = t.value.trim();
    updateCnt(); refreshCtas();
  });
  bind("click", "[data-sender-pick]", openSenderPick);
  bind("input", "[data-sender-input]", (e, t) => {
    state.sender = t.value.trim();
    updateSenderCnt(); refreshCtas();
  });
  bind("change", "[data-mgr-select]", (e, t) => { state.manager = +t.value; });
  bind("click", "[data-nt]", (e, t) => {
    const k = t.dataset.nt;
    state.notify[k] = !state.notify[k];
    t.classList.toggle("on", state.notify[k]);
  });
  bind("click", "[data-submit]", submit);
  bind("click", "[data-done-new]", resetAll);
  bind("click", "[data-done-orders]", () => nav("#/app/orders"));

  /* ── 초기 렌더 ── */
  renderManagers();
  updateCnt();
  updateSenderCnt();
  refreshCtas();
  applyBizRule();
  const bizTimer = setInterval(applyBizRule, 60 * 1000);

  return () => {
    clearInterval(bizTimer);
    closePick();
    ddHour.destroy(); ddMin.destroy(); dpDate.destroy();
    offs.forEach((off) => off());
  };
}
