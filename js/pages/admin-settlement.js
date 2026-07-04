/* ============================================================
   admin-settlement.js — 계열사 분리정산 (대시보드)
   상단 필터(년/월·정산 상태·계열사 검색) 아래에
   ① KPI 카드(총 이용금액·주문 건수·이용 계열사·미입금액, 전월 대비 증감)
   ② 인사이트 헤드라인 + 최근 6개월 이용금액 막대차트
   ③ 계열사별 이용 TOP(가로 막대) · 항목별 이용 비중(도넛)
   ④ 정산 진행 현황(진행바) · 월간 분석 리포트 생성(PDF)
   ⑤ 계열사별 정산 종합 테이블(동의/발급/입금 + 링크·명세서 다운로드)
   분석 로직은 data/report.js(buildMonthlyReport), A4 리포트는 report-doc.js.
   ============================================================ */
import { html, setHTML, on, qs, raw, won } from "../dom.js";
import { icon } from "../icons.js";
import { store } from "../store.js";
import { pageTitle } from "../ui.js";
import { CLIENT_SETTLEMENTS, CLIENT_USAGE, USAGE_CATEGORIES, SETTLEMENT_YEARS, DATA_NOW } from "../data/admin-mock.js";
import { buildMonthlyReport } from "../data/report.js";
import { issueLink, publicInvoiceUrl, SUPPLIER, ACCOUNT } from "../data/invoice-links.js";
import { invoiceDoc, printInvoiceDoc } from "../invoice-doc.js";
import { reportDoc } from "../report-doc.js";

const COL = "minmax(180px,1fr) 110px 110px 110px 110px 116px 128px";
const HEADERS = ["계열사", "청구금액", "거래명세서", "계산서 발급", "거래대금", "공개 링크", "명세서 다운로드"];
const STATUS_TABS = [
  { value: "all", label: "전체" },
  { value: "pending", label: "미완료" },
  { value: "done", label: "정산완료" },
];
/* 도넛/범례 색 — tokens.css 차트 팔레트(기존 상태색 재사용 + --ch-purple) */
const DONUT_VARS = ["var(--c-blue)", "var(--c-orange)", "var(--c-success)", "var(--c-warn)", "var(--ch-purple)"];
const pad = (n) => String(n).padStart(2, "0");
const man = (n) => Math.round(n / 10000); // 만원 단위

const ok = (t) => html`<span class="settle-badge settle-badge--ok">${t}</span>`;
const warn = (t) => html`<span class="settle-badge settle-badge--warn">${t}</span>`;
const danger = (t) => html`<span class="settle-badge settle-badge--danger">${t}</span>`;
const agreeBadge = (v) => (v === "동의완료" ? ok("동의완료") : warn("동의대기"));
const issueBadge = (v) => (v === "발급완료" ? ok("발급완료") : warn("동의필요"));
const payBadge = (v) => (v === "입금완료" ? ok("입금완료") : danger("미입금"));
const isDone = (r) => r.거래명세서동의 === "동의완료" && r.계산서발급 === "발급완료" && r.입금완료 === "입금완료";

/* 전월 대비 증감 배지 (증가=적·감소=청, 한국 금융 관례) */
function deltaTag(delta, suffix = "원") {
  if (delta == null) return html`<span class="adash-delta adash-delta--flat">전월 데이터 없음</span>`;
  if (delta === 0) return html`<span class="adash-delta adash-delta--flat">지난달과 동일</span>`;
  const up = delta > 0;
  return html`<span class="adash-delta ${up ? "adash-delta--up" : "adash-delta--down"}">지난달보다 ${up ? "+" : "-"}${Math.abs(delta).toLocaleString("ko-KR")}${suffix}</span>`;
}

// 정산 레코드 → 공개 명세서 doc (요약 1줄). 같은 사업자번호·귀속월이면 issueLink가 시드 토큰 재사용.
const buildDoc = (client, rec) => ({
  title: `${rec.청구년월} 거래명세서`,
  period: `${rec.청구년월} 귀속`,
  buyer: { address: `${client.address} ${client.companyName}`, company: client.companyName, bizNumber: client.bizNumber, ceo: client.ceoName, summary: "경조화환 이용대금 청구", issueDate: rec.발행일, invoiceNote: rec.계산서발급 },
  supplier: SUPPLIER,
  items: [{ date: rec.청구년월, sender: "-", address: "-", product: `${rec.청구년월} 경조화환 이용대금 합계`, amount: rec.정산금액 }],
  account: ACCOUNT,
  total: rec.정산금액,
});

export function mount(root, { nav }) {
  const now = DATA_NOW; // 목데이터 생성 기준과 동일 시각 → 월 전환 후에도 데이터 창 이탈 없음
  const state = { year: now.getFullYear(), month: now.getMonth() + 1, statusFilter: "all", search: "" };
  const curY = now.getFullYear(), curM = now.getMonth() + 1;
  const lastDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastY = lastDate.getFullYear(), lastM = lastDate.getMonth() + 1;

  /* 선택 월 분석 데이터 (대시보드·리포트 공용) — 상태탭/검색과 무관 */
  function reportFor() {
    return buildMonthlyReport({
      year: state.year, month: state.month,
      clients: store.get().clients,
      usage: CLIENT_USAGE, settlements: CLIENT_SETTLEMENTS, categories: USAGE_CATEGORIES,
    });
  }

  function rowsForPeriod() {
    const label = `${state.year}년 ${pad(state.month)}월`;
    return store.get().clients
      .map((c) => {
        const rec = (CLIENT_SETTLEMENTS[c.id] || []).find((r) => r.청구년월 === label);
        return rec ? { client: c, rec } : null;
      })
      .filter(Boolean);
  }
  function visibleRows() {
    let rows = rowsForPeriod();
    if (state.statusFilter === "done") rows = rows.filter(({ rec }) => isDone(rec));
    else if (state.statusFilter === "pending") rows = rows.filter(({ rec }) => !isDone(rec));
    const q = state.search.trim();
    if (q) rows = rows.filter(({ client }) => client.companyName.includes(q));
    return rows;
  }

  /* ── ① KPI 카드 ── */
  function kpiCards(r) {
    return html`
      <div class="adash-kpis">
        <div class="adash-kpi">
          <span class="adash-kpi__lbl">총 이용금액</span>
          <span class="adash-kpi__val num">${won(r.total)}</span>
          ${deltaTag(r.deltaTotal)}
        </div>
        <div class="adash-kpi">
          <span class="adash-kpi__lbl">주문 건수</span>
          <span class="adash-kpi__val num">${r.orders}건</span>
          ${deltaTag(r.deltaOrders, "건")}
        </div>
        <div class="adash-kpi">
          <span class="adash-kpi__lbl">이용 계열사</span>
          <span class="adash-kpi__val num">${r.activeClients}곳</span>
          <span class="adash-delta adash-delta--flat">전체 ${r.clientCount}곳 중</span>
        </div>
        <div class="adash-kpi">
          <span class="adash-kpi__lbl">미입금액</span>
          <span class="adash-kpi__val num ${r.settle.unpaidAmount > 0 ? "is-warn" : ""}">${won(r.settle.unpaidAmount)}</span>
          <span class="adash-delta adash-delta--flat">정산 완료율 ${r.settle.paidRate}%</span>
        </div>
      </div>
    `;
  }

  /* ── ② 인사이트 헤드라인 + 6개월 추이 막대차트 ── */
  function insightCard(r) {
    let headline, face;
    if (r.deltaTotal == null) {
      headline = html`<b>${state.month}월</b> 총 이용금액은 <b class="num">${won(r.total)}</b>이에요`;
      face = "🙂";
    } else if (r.deltaTotal === 0) {
      headline = html`총 이용금액이 지난달과<br /><b class="num">같아요</b> (${won(r.total)})`;
      face = "🙂";
    } else if (r.deltaTotal > 0) {
      headline = html`총 이용금액이 지난달보다<br /><b class="num up">${won(r.deltaTotal)}</b> 늘었어요`;
      face = "😊";
    } else {
      headline = html`총 이용금액이 지난달보다<br /><b class="num down">${won(Math.abs(r.deltaTotal))}</b> 줄었어요`;
      face = "😥";
    }
    const max = Math.max(...r.trend.map((t) => t.total), 1);
    return html`
      <div class="adash-card adash-insight">
        <div class="adash-insight__head">
          <div>
            <p class="adash-insight__headline">${headline}</p>
            <p class="adash-insight__sub">최근 6개월 · 만원 단위</p>
          </div>
          <span class="adash-insight__face" aria-hidden="true">${face}</span>
        </div>
        <div class="adash-bars" role="img" aria-label="최근 6개월 이용금액 추이">
          ${r.trend.map((t) => {
            const h = Math.max(6, Math.round((t.total / max) * 112));
            return html`
              <div class="adash-bar ${t.isCurrent ? "is-cur" : ""}">
                <span class="adash-bar__val num">${t.total === 0 ? "—" : man(t.total)}</span>
                <span class="adash-bar__col" style="height:${h}px"></span>
                <span class="adash-bar__lbl">${t.short}</span>
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }

  /* ── ③-a 계열사별 이용 TOP (가로 막대 순위) ── */
  function affiliateCard(r) {
    const top = r.affiliates[0]?.total || 1;
    return html`
      <div class="adash-card">
        <div class="adash-card__head">
          <b>계열사별 이용 현황</b>
          ${r.affiliates.length > 3 ? html`<span class="adash-card__hint">상위 3사 ${r.top3Share}%</span>` : ""}
        </div>
        <div class="adash-ranks">
          ${r.affiliates.map(
            (a, i) => html`
              <div class="adash-rank">
                <span class="adash-rank__no ${i < 3 ? "is-top" : ""}">${i + 1}</span>
                <span class="adash-rank__name ellipsis">${a.name}</span>
                <span class="adash-rank__track"><span class="adash-rank__bar" style="width:${Math.max(3, Math.round((a.total / top) * 100))}%"></span></span>
                <span class="adash-rank__amt num">${won(a.total)}</span>
                <span class="adash-rank__share num">${a.share}%</span>
              </div>
            `
          )}
        </div>
      </div>
    `;
  }

  /* ── ③-b 항목별 이용 비중 (도넛 + 범례) ── */
  function donutSvg(r) {
    const R = 52, CX = 70, CY = 70, SW = 30;
    const CIRC = 2 * Math.PI * R;
    let acc = 0;
    const segs = r.catStats
      .map((c, i) => {
        const len = r.total > 0 ? (c.amount / r.total) * CIRC : 0;
        const s = `<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" style="stroke:${DONUT_VARS[i % DONUT_VARS.length]}" stroke-width="${SW}" stroke-dasharray="${len} ${CIRC - len}" stroke-dashoffset="${-acc}" transform="rotate(-90 ${CX} ${CY})"/>`;
        acc += len;
        return s;
      })
      .join("");
    return raw(
      `<svg width="140" height="140" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" class="adash-donut__svg" aria-hidden="true">` +
        `<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" style="stroke:var(--c-divider)" stroke-width="${SW}"/>` + segs +
        `<text x="${CX}" y="${CY - 4}" text-anchor="middle" class="adash-donut__t1">총 이용</text>` +
        `<text x="${CX}" y="${CY + 14}" text-anchor="middle" class="adash-donut__t2">${man(r.total)}만</text>` +
        `</svg>`
    );
  }
  function categoryCard(r) {
    return html`
      <div class="adash-card">
        <div class="adash-card__head"><b>항목별 이용 비중</b></div>
        <div class="adash-donut">
          ${donutSvg(r)}
          <div class="adash-legend">
            ${r.catStats.map(
              (c, i) => html`
                <div class="adash-legend__row">
                  <span class="adash-legend__dot" style="background:${DONUT_VARS[i % DONUT_VARS.length]}"></span>
                  <span class="adash-legend__name">${c.key}</span>
                  <span class="adash-legend__cnt num">${c.count}건</span>
                  <span class="adash-legend__amt num">${won(c.amount)}</span>
                  <span class="adash-legend__share num">${c.share}%</span>
                </div>
              `
            )}
          </div>
        </div>
      </div>
    `;
  }

  /* ── ④ 정산 진행 현황 + 월간 리포트 ── */
  function progressCard(r) {
    const s = r.settle;
    const step = (lbl, done, cnt) => html`
      <div class="adash-step ${done === cnt ? "is-done" : ""}">
        <span class="adash-step__lbl">${lbl}</span>
        <span class="adash-step__val num">${done}/${cnt}</span>
      </div>
    `;
    return html`
      <div class="adash-card">
        <div class="adash-card__head">
          <b>정산 진행 현황</b>
          <span class="adash-card__hint">입금 기준 ${s.paidRate}% 완료</span>
        </div>
        <div class="adash-progress">
          <div class="adash-progress__track"><div class="adash-progress__fill" style="width:${s.paidRate}%"></div></div>
          <div class="adash-steps">
            ${step("명세서 동의", s.agreed, s.count)}
            ${step("계산서 발급", s.issued, s.count)}
            ${step("입금 완료", s.paid, s.count)}
          </div>
          <div class="adash-progress__amts">
            <span>입금완료 <b class="num">${won(s.paidAmount)}</b></span>
            <span class="is-warn">미입금 <b class="num">${won(s.unpaidAmount)}</b></span>
          </div>
        </div>
      </div>
    `;
  }
  function reportCard(r) {
    return html`
      <div class="adash-card adash-report">
        <div class="adash-report__body">
          <div class="adash-report__icon">${icon("package", { size: 20 })}</div>
          <div>
            <b class="adash-report__title">${r.label} 월간 분석 리포트</b>
            <p class="adash-report__desc">이용·정산 데이터를 분석해 계열사별 순위, 항목 구성 변화, 정산 현황과 코멘트가 담긴 A4 리포트를 생성합니다.</p>
            <p class="adash-report__preview">${r.insights[0] || ""}</p>
          </div>
        </div>
        <button class="adash-report__btn" data-action="report">${icon("download", { size: 15 })}PDF 리포트 다운로드</button>
      </div>
    `;
  }

  function dashBody() {
    const r = reportFor();
    if (!r) return html`<div class="admin-empty">선택한 조건(${state.year}년 ${pad(state.month)}월)에 이용 데이터가 없습니다.</div>`;
    return html`
      <div class="adash">
        ${kpiCards(r)}
        <div class="adash-row adash-row--main">
          ${insightCard(r)}
          ${affiliateCard(r)}
        </div>
        <div class="adash-row adash-row--sub">
          ${categoryCard(r)}
          ${progressCard(r)}
          ${reportCard(r)}
        </div>
      </div>
    `;
  }

  /* ── ⑤ 정산 테이블 (기존 유지) ── */
  function tableBody() {
    const rows = visibleRows();
    if (rows.length === 0) {
      return html`<div class="admin-empty">선택한 조건(${state.year}년 ${pad(state.month)}월)에 정산 내역이 없습니다.</div>`;
    }
    return html`
      <div class="settle-table">
        <div class="settle-thead" style="grid-template-columns:${COL}">
          ${HEADERS.map((h) => html`<div class="settle-th">${h}</div>`)}
        </div>
        ${rows.map(
          ({ client, rec }) => html`
            <div class="settle-trow" style="grid-template-columns:${COL}">
              <div class="settle-td"><span class="ellipsis">${client.companyName}</span></div>
              <div class="settle-td"><span class="settle-amount">${rec.정산금액}</span></div>
              <div class="settle-td">${agreeBadge(rec.거래명세서동의)}</div>
              <div class="settle-td">${issueBadge(rec.계산서발급)}</div>
              <div class="settle-td">${payBadge(rec.입금완료)}</div>
              <div class="settle-td"><button class="settle-linkbtn" data-action="copylink" data-id="${client.id}">${icon("external-link", { size: 11 })}<span>링크 복사</span></button></div>
              <div class="settle-td"><button class="settle-dlbtn" data-action="download" data-id="${client.id}">${icon("download", { size: 11 })}<span>PDF 다운로드</span></button></div>
            </div>
          `
        )}
      </div>
    `;
  }
  function summaryBody() {
    const rows = visibleRows();
    const done = rows.filter(({ rec }) => isDone(rec)).length;
    return html`총 <strong>${rows.length}</strong>개 계열사 · 정산완료 <strong>${done}</strong>건`;
  }

  function render() {
    setHTML(
      root,
      html`
        <div class="page-admin">
          <div class="admin-inner">
            ${pageTitle({ imgSrc: "./assets/nav-accounting.png", title: "계열사 분리정산" })}
            <div class="orders-filters">
              <div class="orders-frow orders-frow--1">
                <div class="orders-fgroup">
                  <span class="orders-flabel">조회 기간</span>
                  <select class="select" data-ctl="year">
                    ${SETTLEMENT_YEARS.map((y) => html`<option value="${y}" ${state.year === y ? "selected" : ""}>${y}년</option>`)}
                  </select>
                  <select class="select" data-ctl="month">
                    ${Array.from({ length: 12 }, (_, i) => i + 1).map((m) => html`<option value="${m}" ${state.month === m ? "selected" : ""}>${pad(m)}월</option>`)}
                  </select>
                  <div class="orders-chips settle-quickmonth">
                    <button class="orders-datebtn ${state.year === curY && state.month === curM ? "is-active" : ""}" data-action="qmonth" data-v="this">이번달</button>
                    <button class="orders-datebtn ${state.year === lastY && state.month === lastM ? "is-active" : ""}" data-action="qmonth" data-v="last">저번달</button>
                  </div>
                </div>
                <div class="orders-divider"></div>
                <div class="orders-fgroup">
                  <span class="orders-flabel">정산 상태</span>
                  <div class="orders-chips">
                    ${STATUS_TABS.map((t) => html`<button class="chip ${state.statusFilter === t.value ? "is-active" : ""}" data-action="stab" data-v="${t.value}">${t.label}</button>`)}
                  </div>
                </div>
              </div>
              <div class="orders-frow orders-frow--3">
                <div class="orders-search">
                  <div class="orders-search__lbl">${icon("search", { size: 12, cls: "tint-muted" })}<span>계열사 검색</span></div>
                  <input type="text" data-search value="${state.search}" placeholder="계열사명 검색" />
                </div>
              </div>
            </div>
            <div data-slot="dash">${dashBody()}</div>
            <p class="admin-summary" data-slot="summary">${summaryBody()}</p>
            <div data-slot="table">${tableBody()}</div>
          </div>
        </div>
      `
    );
  }
  const refreshTable = () => {
    const tbl = qs(root, "[data-slot='table']");
    const sum = qs(root, "[data-slot='summary']");
    if (tbl) setHTML(tbl, tableBody());
    if (sum) setHTML(sum, summaryBody());
  };

  render();

  const offChange = on(root, "change", "[data-ctl]", (e, t) => {
    state[t.dataset.ctl] = Number(t.value);
    render(); // re-render so 이번달/저번달 active state stays in sync
  });
  const offClick = on(root, "click", "[data-action='stab']", (e, t) => {
    state.statusFilter = t.dataset.v;
    render(); // re-render to update active chip
  });
  const offQuick = on(root, "click", "[data-action='qmonth']", (e, t) => {
    const base = new Date(now.getFullYear(), now.getMonth() - (t.dataset.v === "last" ? 1 : 0), 1);
    state.year = base.getFullYear();
    state.month = base.getMonth() + 1;
    render();
  });
  const offSearch = on(root, "input", "[data-search]", (e, t) => {
    state.search = t.value;
    refreshTable();
  });
  const offCopy = on(root, "click", "[data-action='copylink']", (e, t) => {
    const row = rowsForPeriod().find(({ client }) => client.id === t.dataset.id);
    if (!row) return;
    const token = issueLink({ bizNumber: row.client.bizNumber, doc: buildDoc(row.client, row.rec) });
    const url = publicInvoiceUrl(token);
    const span = t.querySelector("span");
    const flash = () => { if (span) { span.textContent = "복사됨!"; setTimeout(() => { if (span) span.textContent = "링크 복사"; }, 1600); } };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url).then(flash).catch(() => window.prompt("공개 링크", url));
    else window.prompt("공개 링크", url);
  });
  // 명세서 PDF 즉시 다운로드: doc을 off-DOM으로 렌더 → printInvoiceDoc(새 창 인쇄 → PDF 저장)
  const offDownload = on(root, "click", "[data-action='download']", (e, t) => {
    const row = rowsForPeriod().find(({ client }) => client.id === t.dataset.id);
    if (!row) return;
    const holder = document.createElement("div");
    setHTML(holder, invoiceDoc(buildDoc(row.client, row.rec)));
    const docEl = holder.querySelector(".invoice-doc");
    if (!docEl) return;
    try { printInvoiceDoc(docEl, `${row.client.companyName}_${row.rec.청구년월}_거래명세서`); }
    catch (err) { console.error("PDF 생성 오류:", err); alert("PDF 생성 중 오류가 발생했습니다. 다시 시도해 주세요."); }
  });
  // 월간 분석 리포트: 분석 로직 실행 → A4 리포트 렌더 → printInvoiceDoc(새 창 인쇄 → PDF 저장)
  const offReport = on(root, "click", "[data-action='report']", () => {
    const r = reportFor();
    if (!r) return;
    const dt = new Date();
    const generatedAt = `${dt.getFullYear()}. ${pad(dt.getMonth() + 1)}. ${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
    const holder = document.createElement("div");
    setHTML(holder, reportDoc(r, generatedAt));
    const docEl = holder.querySelector(".report-doc");
    if (!docEl) return;
    try { printInvoiceDoc(docEl, `계열사_이용분석_리포트_${state.year}_${pad(state.month)}`); }
    catch (err) { console.error("리포트 생성 오류:", err); alert("리포트 생성 중 오류가 발생했습니다. 다시 시도해 주세요."); }
  });

  return () => { offChange(); offClick(); offQuick(); offSearch(); offCopy(); offDownload(); offReport(); };
}
