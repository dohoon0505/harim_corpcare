/* ============================================================
   invoice.js — 거래명세서 조회 (#/app/invoice) · 시안 mockups/invoice/02-brand.html 이식
   좌: A4 문서 미리보기(invoice-doc.js 그대로) · 우: 다운로드·공개링크·조회(연·월 드롭다운)·동의 레일.
   페이지 규약: mount(root, { nav }) → cleanup. dom.js html``/on() 사용.
   A4 문서·PDF 인쇄는 invoice-doc.js(invoiceDoc/printInvoiceDoc)를 변경 없이 호출.
   연·월 드롭다운은 ui.js 공용 makeDropdown() 재사용(페이지 내 재구현 없음).
   ============================================================ */
import { setHTML, on, qs, html } from "../dom.js";
import { icon } from "../icons.js";
import { invoiceDoc, printInvoiceDoc } from "../invoice-doc.js";
import { issueLink, publicInvoiceUrl, SUPPLIER, ACCOUNT } from "../data/invoice-links.js";
import { pageTitle, makeDropdown } from "../ui.js";

/* ── 월별 거래명세서 목데이터 (데모: 2026-03·04) ─────────────
   rows: [배송요청일시, 발송인, 배송지, 주문상품, 결제금액(숫자)] */
const DB = {
  "2026-04": {
    due: "2026년 05월 31일", issue: "2026년 05월 01일",
    rows: [
      ["2026년 04월 28일", "홍길동", "서울 관악구 신림동 산 56-1 65동 서울대학교 교수회관", "근조 3단화환 (기본)", 70000],
      ["2026년 04월 25일", "김태권", "서울 동산구 아에린로29 신정기념관내 로얄마크컨벤션 3층 포장홀", "축하 3단화환 (기본)", 70000],
      ["2026년 04월 21일", "김태권", "경기 마주시 금품억로 190 새디인병원 장례식장 지하1층 특2호실", "근조 3단화환 (기본)", 70000],
      ["2026년 04월 17일", "채상운", "부산 남구 황령대로 401-9 그랜드드몬트 6층 시그니처룸", "축하 3단화환 (고급)", 100000],
      ["2026년 04월 14일", "박진찬", "경상북도 예천군 예천읍 양오로 154 (정북아) 예천농협장례식장 3호실", "근조 3단화환 (기본)", 70000],
      ["2026년 04월 10일", "박진찬", "서울 강남구 논현로 645 렉시미나호텔", "축하 3단화환 (기본)", 70000],
      ["2026년 04월 07일", "홍길동", "서울 관악구 신림동 산 56-1 65동 서울대학교 교수회관", "근조바구니", 65000],
      ["2026년 04월 03일", "김태권", "서울 동산구 아에린로29 신정기념관내 로얄마크컨벤션 3층 포장홀", "축하 3단화환 (기본)", 70000],
    ],
  },
  "2026-03": {
    due: "2026년 04월 30일", issue: "2026년 04월 01일",
    rows: [
      ["2026년 03월 27일", "오임찬", "서울 서초구 반포대로 179 서울성모병원 장례식장", "근조 3단화환 (고급)", 100000],
      ["2026년 03월 19일", "한다운", "서울 송파구 올림픽로 319 웨딩시그니처 5층", "축하 3단화환 (기본)", 70000],
      ["2026년 03월 12일", "김현수", "인천 연수구 컨벤시아대로 165 송도컨벤시아", "축하 3단화환 (기본)", 70000],
      ["2026년 03월 05일", "오임찬", "대전 서구 둔산대로 100 대전예술의전당", "축하 3단화환 (고급)", 100000],
    ],
  },
};
const BUYER = {
  address: "전라북도 익산시 중앙로 121 (주)하림지주", company: "(주)하림지주",
  bizNumber: "306-81-03054", ceo: "김홍국", summary: "경조화환 이용대금 청구", invoiceNote: "명세서 조회 후 발급",
};
const YEARS = ["2024", "2025", "2026"];
const MONTHS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
const won = (n) => Number(n).toLocaleString("ko-KR") + "원";
const pad2 = (n) => String(n).padStart(2, "0");

function markup() {
  return html`
    <div class="page-invoice">
      ${pageTitle({ icon: "📄", title: "거래명세서 조회" })}
      <div class="cols">
        <!-- 좌: A4 문서 미리보기 (invoice-doc.js 렌더) -->
        <div class="doc"><div class="a4-frame" data-doc-host></div></div>

        <!-- 우: 다운로드 · 공개링크 · 조회 · 동의 -->
        <aside class="rail">
          <button class="iv-btn iv-btn--primary" data-pdf>${icon("download", { size: 16 })}<span data-pdf-lbl></span></button>
          <button class="iv-btn iv-btn--secondary" data-link>${icon("external-link", { size: 16 })}공개 링크 복사 <span class="iv-btn__sub">· 로그인 없이 열람</span></button>

          <div class="iv-card">
            <div class="iv-card__head"><b>거래명세서 조회</b></div>
            <div class="iv-card__body">
              <div class="dd-row">
                <div class="dd" data-dd="year"><button type="button" class="dd-trigger" aria-haspopup="listbox" aria-expanded="false"></button><div class="dd-panel" role="listbox"></div></div>
                <div class="dd" data-dd="month"><button type="button" class="dd-trigger" aria-haspopup="listbox" aria-expanded="false"></button><div class="dd-panel" role="listbox"></div></div>
              </div>
              <div class="iv-summary">
                <div class="sum-amt"><span data-sum-lbl></span><b class="num" data-sum-amt>0원</b></div>
                <div class="srow srow--gap"><span class="k">결제 · 정산 대금기한</span><span class="v due num" data-sum-due>—</span></div>
                <div class="srow"><span class="k">계산서 발급</span><span class="iv-badge iv-badge--err" data-sum-tax>동의 필요</span></div>
              </div>
            </div>
          </div>

          <div class="iv-card agree-wrap" data-agree-wrap>
            <div class="iv-card__body">
              <p class="agree-desc">명세서 내용을 확인한 뒤 동의하면 위 금액으로 세금계산서가 발급됩니다. 동의 후에는 내용을 변경할 수 없습니다.</p>
              <button class="iv-btn iv-btn--agree" data-agree>해당 내용으로 계산서 발급에 동의합니다</button>
              <div class="agree-done"><span class="ck">✓</span><div><b>계산서 발급 동의 완료</b><span data-agree-date></span></div></div>
            </div>
          </div>
        </aside>
      </div>

      <div class="iv-toast" data-toast></div>
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
    const total = data ? data.rows.reduce((a, r) => a + r[4], 0) : 0;
    const items = data
      ? data.rows.map((r) => ({ date: r[0], sender: r[1], address: r[2], product: r[3], amount: won(r[4]) }))
      : [{ date: "", sender: "", address: "해당 월의 거래 내역이 없습니다", product: "", amount: "" }];
    return {
      _label: label, _due: data ? data.due : "—",
      title: `${state.year.slice(2)}년 ${state.month}월 거래명세서`,
      period: `${label} 귀속`,
      buyer: { ...BUYER, issueDate: data ? data.issue : "-" },
      supplier: SUPPLIER,
      items,
      account: ACCOUNT,
      total: won(total),
    };
  }

  /* 기간 변경 시 문서·요약·다운로드 라벨을 함께 갱신 (동의 상태는 유지) */
  function render() {
    const d = docData();
    el("[data-doc-host]").innerHTML = invoiceDoc(d);
    el("[data-sum-lbl]").textContent = `${d._label} 결제금액`;
    el("[data-sum-amt]").textContent = d.total;
    el("[data-sum-due]").textContent = d._due;
    el("[data-pdf-lbl]").textContent = `${state.year}_${state.month} 거래명세서 다운로드`;
  }

  const ddYear = makeDropdown(el('[data-dd="year"]'), {
    unit: "년", options: () => YEARS, get: () => state.year,
    set: (v) => { state.year = v; render(); },
  });
  const ddMonth = makeDropdown(el('[data-dd="month"]'), {
    unit: "월", options: () => MONTHS, get: () => state.month,
    set: (v) => { state.month = v; render(); },
  });

  /* 토스트 (잉크 필) */
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
      const ok = () => toast("공개 링크가 복사되었습니다 · 로그인 없이 열람 가능");
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url).then(ok).catch(() => window.prompt("공개 링크 (복사하세요)", url));
      else window.prompt("공개 링크 (복사하세요)", url);
    }),
    on(root, "click", "[data-agree]", () => {
      if (state.agreed) return;
      state.agreed = true;
      el("[data-agree-wrap]").classList.add("done");
      const tax = el("[data-sum-tax]");
      tax.textContent = "동의 완료";
      tax.className = "iv-badge iv-badge--ok";
      const dt = new Date();
      el("[data-agree-date]").textContent = `${dt.getFullYear()}. ${pad2(dt.getMonth() + 1)}. ${pad2(dt.getDate())} 동의`;
      toast("계산서 발급에 동의했습니다");
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
