/* ============================================================
   invoice.js — 거래명세서 조회 (시안 mockups/invoice/01-simple.html 이식)
   좌: A4 문서 미리보기(invoice-doc.js 그대로) · 우: 조회기간·요약·액션 레일.
   페이지 규약: mount(root, { nav }) → cleanup. dom.js html``/on() 사용.
   A4 문서·PDF는 invoice-doc.js(invoiceDoc/printInvoiceDoc)를 변경 없이 호출.
   ============================================================ */
import { html, raw, setHTML, on, qs } from "../dom.js";
import { icon } from "../icons.js";
import { invoiceDoc, printInvoiceDoc } from "../invoice-doc.js";
import { issueLink, publicInvoiceUrl, SUPPLIER, ACCOUNT } from "../data/invoice-links.js";
import { makeDropdown } from "../ui.js";

/* ── 월별 거래명세서 목데이터 (데모: 2026-03·04) ─────────────
   rows: [배송요청일시, 발송인, 배송지, 주문상품, 결제금액(숫자)] */
const DB = {
  "2026-04": {
    due: "2026년 05월 31일", issue: "2026년 05월 01일",
    rows: [
      ["2026년 04월 28일", "홍길동", "서울 관악구 신림동 산 56-1 65동 서울대학교 교수회관", "근조 3단화환 (기본)", 75000],
      ["2026년 04월 25일", "김태권", "서울 동산구 아에린로29 신정기념관내 로얄마크컨벤션 3층 포장홀", "축하 3단화환 (기본)", 75000],
      ["2026년 04월 21일", "김태권", "경기 마주시 금품억로 190 새디인병원 장례식장 지하1층 특2호실", "근조 3단화환 (기본)", 75000],
      ["2026년 04월 17일", "채상운", "부산 남구 황령대로 401-9 그랜드드몬트 6층 시그니처룸", "축하 3단화환 (고급)", 90000],
      ["2026년 04월 14일", "박진찬", "경상북도 예천군 예천읍 양오로 154 (정북아) 예천농협장례식장 3호실", "근조 3단화환 (기본)", 75000],
      ["2026년 04월 10일", "박진찬", "서울 강남구 논현로 645 렉시미나호텔", "축하 3단화환 (기본)", 75000],
      ["2026년 04월 07일", "홍길동", "서울 관악구 신림동 산 56-1 65동 서울대학교 교수회관", "근조바구니(기본)", 70000],
      ["2026년 04월 03일", "김태권", "서울 동산구 아에린로29 신정기념관내 로얄마크컨벤션 3층 포장홀", "축하 3단화환 (기본)", 75000],
    ],
  },
  "2026-03": {
    due: "2026년 04월 30일", issue: "2026년 04월 01일",
    rows: [
      ["2026년 03월 27일", "오임찬", "서울 서초구 반포대로 179 서울성모병원 장례식장", "근조 3단화환 (고급)", 90000],
      ["2026년 03월 19일", "한다운", "서울 송파구 올림픽로 319 웨딩시그니처 5층", "축하 3단화환 (기본)", 75000],
      ["2026년 03월 12일", "김현수", "인천 연수구 컨벤시아대로 165 송도컨벤시아", "축하 3단화환 (기본)", 75000],
      ["2026년 03월 05일", "오임찬", "대전 서구 둔산대로 100 대전예술의전당", "축하 3단화환 (고급)", 90000],
    ],
  },
};
const BUYER = {
  address: "서울 중구 퇴계로 100 스테이트타워 남산 3층 주식회사 싱크플로",
  company: "주식회사 싱크플로", bizNumber: "680-87-02988", ceo: "홍길동",
  summary: "꽃배달 이용료 청구", invoiceNote: "명세서 조회 후 발급",
};
const YEARS = ["2024", "2025", "2026"];
const MONTHS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
const won = (n) => Number(n).toLocaleString("ko-KR") + "원";
const pad = (n) => String(n).padStart(2, "0");

const DOC_SVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="2.5" width="16" height="19" rx="2.5" style="fill:var(--c-order-blue-soft)"/><path d="M8 8h8M8 12h8M8 16h5" style="stroke:var(--c-order-blue)" stroke-width="1.8" stroke-linecap="round"/></svg>`;

function markup() {
  return html`
    <div class="page-invoice">
      <div class="oinv-wrap">
        <div class="head">
          <h1>거래명세서 ${raw(DOC_SVG)}</h1>
          <p class="sub">월별 거래 내역을 확인하고 명세서와 계산서를 발급받을 수 있어요</p>
        </div>

        <div class="layout">
          <!-- 좌: A4 문서 미리보기 (invoice-doc.js 렌더) -->
          <div class="doc">
            <div class="a4-frame" data-doc-host></div>
          </div>

          <!-- 우: 조회 기간 · 요약 · 액션 -->
          <aside class="rail">
            <div class="oinv-card">
              <div class="ct">조회 기간</div>
              <div class="dd-row">
                <div class="dd" data-dd="year"><button type="button" class="dd-trigger" aria-haspopup="listbox" aria-expanded="false"></button><div class="dd-panel" role="listbox"></div></div>
                <div class="dd" data-dd="month"><button type="button" class="dd-trigger" aria-haspopup="listbox" aria-expanded="false"></button><div class="dd-panel" role="listbox"></div></div>
              </div>
            </div>

            <div class="oinv-card">
              <div class="sum-amt"><span data-sum-label></span><b class="num" data-sum-amt></b></div>
              <div class="sum-rows">
                <div class="srow"><span class="k">결제 · 정산 대금기한</span><span class="v due" data-sum-due></span></div>
                <div class="srow"><span class="k">계산서 발급</span><span class="oinv-chip need" data-sum-tax>동의 필요</span></div>
              </div>
            </div>

            <div>
              <button class="oinv-btn solid" data-pdf>${icon("download", { size: 16 })}<span data-pdf-label></span></button>
              <button class="oinv-btn ghost" data-link>${icon("external-link", { size: 16 })}공개 링크 복사 <span class="oinv-btn__sub">· 로그인 없이 열람</span></button>
            </div>

            <div class="oinv-card agree-wrap" data-agree-wrap>
              <div class="ct">계산서 발급 동의</div>
              <p class="agree-desc">명세서 내용을 확인한 뒤 동의하면, 위 금액으로 세금계산서가 발급돼요. 동의 후에는 내용을 변경할 수 없어요.</p>
              <button class="oinv-btn agree" data-agree>해당 내용으로 계산서 발급에 동의합니다</button>
              <div class="agree-done">
                <span class="ck">✓</span>
                <div><b>계산서 발급 동의 완료</b><span data-agree-date></span></div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div class="oinv-toast" data-toast></div>
    </div>
  `;
}

export function mount(root, { nav }) {
  const state = { year: "2026", month: "04", agreed: false };
  setHTML(root, markup());
  const el = (s) => qs(root, s);

  /* 현재 선택 월 → invoice-doc.js 문서 데이터 객체 */
  function docData() {
    const key = `${state.year}-${state.month}`;
    const data = DB[key];
    const label = `${state.year}년 ${state.month}월`;
    const shortLabel = `${state.year.slice(2)}년 ${state.month}월`;
    const items = data
      ? data.rows.map((r) => ({ date: r[0], sender: r[1], address: r[2], product: r[3], amount: won(r[4]) }))
      : [{ date: "", sender: "", address: "해당 월의 거래 내역이 없습니다", product: "", amount: "" }];
    const total = data ? data.rows.reduce((a, r) => a + r[4], 0) : 0;
    return {
      _label: label, _data: data, _total: total,
      title: `${shortLabel} 거래명세서`,
      period: `${label} 귀속`,
      buyer: { ...BUYER, issueDate: data ? data.issue : "-" },
      supplier: SUPPLIER,
      items,
      account: ACCOUNT,
      total: won(total),
    };
  }

  function render() {
    const d = docData();
    setHTML(el("[data-doc-host]"), invoiceDoc(d));
    el("[data-sum-label]").textContent = `${d._label} 결제금액`;
    el("[data-sum-amt]").textContent = d.total;
    el("[data-sum-due]").textContent = d._data ? d._data.due : "—";
    el("[data-pdf-label]").textContent = `${state.year}_${state.month} 거래명세서 다운로드`;
    const tax = el("[data-sum-tax]");
    tax.textContent = state.agreed ? "동의 완료" : "동의 필요";
    tax.className = "oinv-chip " + (state.agreed ? "done" : "need");
  }

  const ddYear = makeDropdown(el('[data-dd="year"]'), {
    unit: "년", options: () => YEARS, get: () => state.year,
    set: (v) => { state.year = v; render(); },
  });
  const ddMonth = makeDropdown(el('[data-dd="month"]'), {
    unit: "월", options: () => MONTHS, get: () => state.month,
    set: (v) => { state.month = v; render(); },
  });

  /* 토스트 */
  let toastTimer = null;
  function toast(msg) {
    const t = el("[data-toast]");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2000);
  }

  /* 현재 월 문서에 대한 공개 링크 데이터 (invoice-links 계약) */
  function currentDoc() {
    const d = docData();
    return { title: d.title, period: d.period, buyer: d.buyer, supplier: d.supplier, items: d.items, account: d.account, total: d.total };
  }

  const offs = [
    on(root, "click", "[data-pdf]", () => {
      const docEl = el(".invoice-doc");
      try { printInvoiceDoc(docEl, `거래명세서_${state.year}_${state.month}`); }
      catch (err) { console.error("PDF 생성 오류:", err); alert("PDF 생성 중 오류가 발생했습니다. 다시 시도해 주세요."); }
    }),
    on(root, "click", "[data-link]", () => {
      const token = issueLink({ bizNumber: BUYER.bizNumber, doc: currentDoc() });
      const url = publicInvoiceUrl(token);
      const ok = () => toast("공개 링크가 복사되었어요 · 로그인 없이 열람할 수 있어요");
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url).then(ok).catch(() => window.prompt("공개 링크 (복사하세요)", url));
      else window.prompt("공개 링크 (복사하세요)", url);
    }),
    on(root, "click", "[data-agree]", () => {
      state.agreed = true;
      el("[data-agree-wrap]").classList.add("done");
      const dt = new Date();
      el("[data-agree-date]").textContent = `${dt.getFullYear()}. ${pad(dt.getMonth() + 1)}. ${pad(dt.getDate())} 동의`;
      render();
      toast("계산서 발급에 동의했어요");
    }),
  ];

  render();

  return () => {
    offs.forEach((off) => off());
    ddYear.destroy();
    ddMonth.destroy();
    clearTimeout(toastTimer);
  };
}
