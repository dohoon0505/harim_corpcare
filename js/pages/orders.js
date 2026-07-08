/* ============================================================
   orders.js — ports RealTimeOrders.tsx (실시간 주문처리 내역)
   ============================================================ */
import { html, raw, setHTML, on, qs, qsa } from "../dom.js";
import { icon } from "../icons.js";
import { pageTitle, tableGrid, openModal, openLightbox } from "../ui.js";
import { getDateRange, parseOrderDate, formatDateLabel } from "../util/date.js";

/* 배송 현장사진은 2:3 세로형으로 촬영·수신된다. (데모: 카테고리별 샘플) */
const DELIVERY_PHOTO = {
  근조: "https://images.unsplash.com/photo-1728080568516-28156ceae0ea?auto=format&fit=crop&w=720&h=1080&q=80",
  축하: "https://images.unsplash.com/photo-1641430262389-93bbbd2dd754?auto=format&fit=crop&w=720&h=1080&q=80",
  기타: "https://images.unsplash.com/photo-1577378978713-9bebf3db8312?auto=format&fit=crop&w=720&h=1080&q=80",
};
function deliveryPhoto(order) {
  if (order.product.startsWith("근조")) return DELIVERY_PHOTO.근조;
  if (order.product.startsWith("축하")) return DELIVERY_PHOTO.축하;
  return DELIVERY_PHOTO.기타;
}

const orderData = [
  // 이번 달 (2026/07)
  { id: 17, manager: "김총무", date: "2026/07/08 15:20", address: "서울 서초구 반포대로 222 서울성모병원 장례식장 3호실", sender: "홍길동", profile: "(주)하림지주 대표이사 홍길동", product: "근조 3단화환 (고급)", amount: "100,000원", status: "접수대기", statusColor: "#9e9e9e", hasPhoto: false },
  { id: 18, manager: "박사원", date: "2026/07/08 10:05", address: "경기 고양시 일산동구 정발산로 24 웨스턴돔 웨딩홀 5층", sender: "김현수", profile: "(주)하림지주 인사팀 김현수", product: "축하 3단화환 (기본)", amount: "70,000원", status: "주문접수", statusColor: "#4169e1", hasPhoto: false },
  { id: 19, manager: "이대리", date: "2026/07/07 16:40", address: "부산 서구 감천로 262 고신대복음병원 장례식장 2호실", sender: "영업본부", profile: "(주)하림지주 영업본부", product: "근조바구니(대체발송)", amount: "65,000원", status: "주문접수", statusColor: "#4169e1", hasPhoto: false },
  { id: 20, manager: "최과장", date: "2026/07/07 09:30", address: "대전 유성구 대학로 99 충남대학교 정심화국제문화회관", sender: "홍길동", profile: "(주)하림지주 대표이사 홍길동", product: "축하 3단화환 (고급)", amount: "100,000원", status: "배송완료", statusColor: "#4caf50", hasPhoto: true },
  { id: 21, manager: "오임찬", date: "2026/07/04 14:10", address: "울산 남구 삼산로 200 울산롯데호텔 3층 크리스탈볼룸", sender: "오임찬", profile: "(주)하림지주 재경팀 오임찬", product: "10KG 쌀화환(대체발송)", amount: "90,000원", status: "배송완료", statusColor: "#4caf50", hasPhoto: true },
  { id: 22, manager: "김총무", date: "2026/07/04 11:00", address: "인천 남동구 구월로 12 가천대길병원 장례식장 301호실", sender: "경영지원팀", profile: "(주)하림지주 경영지원팀", product: "근조 3단화환 (기본)", amount: "70,000원", status: "배송완료", statusColor: "#4caf50", hasPhoto: false },
  { id: 23, manager: "박사원", date: "2026/07/03 17:25", address: "광주 동구 필문대로 365 조선대학교병원 장례식장 1호실", sender: "김현수", profile: "(주)하림지주 인사팀 김현수", product: "오브제(대체발송)", amount: "70,000원", status: "배송완료", statusColor: "#4caf50", hasPhoto: true },
  { id: 24, manager: "이대리", date: "2026/07/03 10:40", address: "서울 강남구 테헤란로 406 아펠가모 삼성 4층 그랜드홀", sender: "이대리", profile: "(주)하림지주 영업1팀 이대리", product: "꽃바구니(대체발송)", amount: "80,000원", status: "배송완료", statusColor: "#4caf50", hasPhoto: false },
  { id: 25, manager: "최과장", date: "2026/07/02 15:50", address: "경남 창원시 진해구 충장로 21 진해장례문화원 201호실", sender: "홍길동", profile: "(주)하림지주 대표이사 홍길동", product: "스탠드(대체발송)", amount: "70,000원", status: "배송완료", statusColor: "#4caf50", hasPhoto: true },
  { id: 26, manager: "김총무", date: "2026/07/01 13:15", address: "충남 천안시 동남구 망향로 201 순천향대 천안병원 장례식장 3호실", sender: "경영지원팀", profile: "(주)하림지주 경영지원팀", product: "근조 3단화환 (고급)", amount: "100,000원", status: "배송완료", statusColor: "#4caf50", hasPhoto: true },
  { id: 27, manager: "오임찬", date: "2026/07/01 09:20", address: "서울 중구 을지로 30 롯데호텔서울 3층 크리스탈볼룸", sender: "오임찬", profile: "(주)하림지주 재경팀 오임찬", product: "축하 3단화환 (기본)", amount: "70,000원", status: "배송완료", statusColor: "#4caf50", hasPhoto: false },
  // 지난 달 (2026/06)
  { id: 1, manager: "김총무", date: "2026/06/16 14:30", address: "서울 종로구 대학로 101 서울대학교병원 장례식장 5호실", sender: "홍길동", profile: "(주)하림지주 대표이사 홍길동", product: "근조 3단화환 (고급)", amount: "100,000원", status: "주문접수", statusColor: "#4169e1", hasPhoto: true },
  { id: 2, manager: "박사원", date: "2026/06/16 10:15", address: "경기 성남시 분당구 야탑로 59 분당차병원 장례식장 특실", sender: "김현수", profile: "(주)하림지주 인사팀 김현수", product: "근조바구니(대체발송)", amount: "65,000원", status: "접수대기", statusColor: "#9e9e9e", hasPhoto: false },
  // 내일 (2026/06/17) — 예약 발송
  { id: 3, manager: "이대리", date: "2026/06/17 09:00", address: "부산 해운대구 센텀중앙로 90 벡스코 제2전시장 그랜드볼룸", sender: "영업본부", profile: "(주)하림지주 영업본부", product: "축하 3단화환 (고급)", amount: "100,000원", status: "접수대기", statusColor: "#9e9e9e", hasPhoto: false },
  // 어제 (2026/06/15)
  { id: 4, manager: "김총무", date: "2026/06/15 16:40", address: "인천 남동구 구월로 12 가천대길병원 장례식장 301호실", sender: "경영지원팀", profile: "(주)하림지주 경영지원팀", product: "근조 3단화환 (기본)", amount: "70,000원", status: "배송완료", statusColor: "#4caf50", hasPhoto: true },
  { id: 5, manager: "최과장", date: "2026/06/15 09:30", address: "대전 서구 둔산로 100 대전무역회관 4층 대강당", sender: "홍길동", profile: "(주)하림지주 대표이사 홍길동", product: "축하 3단화환 (기본)", amount: "70,000원", status: "배송완료", statusColor: "#4caf50", hasPhoto: false },
  // 이번 달 (2026/06/01 ~ 06/13)
  { id: 6, manager: "박사원", date: "2026/06/13 11:20", address: "광주 북구 첨단과기로 123 광주과학기술원 오룡관 컨벤션홀", sender: "이대리", profile: "(주)하림지주 영업1팀 이대리", product: "축하 3단화환 (고급)", amount: "100,000원", status: "주문접수", statusColor: "#4169e1", hasPhoto: true },
  { id: 7, manager: "오임찬", date: "2026/06/11 15:00", address: "울산 남구 삼산로 200 울산롯데호텔 3층 크리스탈볼룸", sender: "오임찬", profile: "(주)하림지주 재경팀 오임찬", product: "스탠드(대체발송)", amount: "70,000원", status: "배송완료", statusColor: "#4caf50", hasPhoto: true },
  { id: 8, manager: "김총무", date: "2026/06/09 13:10", address: "경남 창원시 의창구 중앙대로 250 창원컨벤션센터 2층 컨벤션홀", sender: "경영지원팀", profile: "(주)하림지주 경영지원팀", product: "축하 3단화환 (기본)", amount: "70,000원", status: "배송완료", statusColor: "#4caf50", hasPhoto: false },
  { id: 9, manager: "이대리", date: "2026/06/06 10:00", address: "서울 강남구 테헤란로 152 강남파이낸스센터 지하1층 컨퍼런스홀", sender: "영업본부", profile: "(주)하림지주 영업본부", product: "오브제(대체발송)", amount: "70,000원", status: "배송완료", statusColor: "#4caf50", hasPhoto: true },
  { id: 10, manager: "박사원", date: "2026/06/04 17:30", address: "전북 전주시 덕진구 백제대로 567 전북대학교병원 장례식장 특2호실", sender: "김현수", profile: "(주)하림지주 인사팀 김현수", product: "10KG 쌀화환(대체발송)", amount: "90,000원", status: "배송완료", statusColor: "#4caf50", hasPhoto: false },
  { id: 11, manager: "최과장", date: "2026/06/02 09:40", address: "경기 수원시 영통구 광교중앙로 140 수원컨벤션센터 3층 컨벤션홀", sender: "홍길동", profile: "(주)하림지주 대표이사 홍길동", product: "축하 3단화환 (고급)", amount: "100,000원", status: "배송완료", statusColor: "#4caf50", hasPhoto: true },
  { id: 12, manager: "김총무", date: "2026/06/01 11:00", address: "대구 수성구 동대구로 99 대구은행 본점 2층 대강당", sender: "경영지원팀", profile: "(주)하림지주 경영지원팀", product: "축하 3단화환 (기본)", amount: "70,000원", status: "배송완료", statusColor: "#4caf50", hasPhoto: false },
  // 지난 달 (2026/05)
  { id: 13, manager: "오임찬", date: "2026/05/27 14:00", address: "서울 송파구 올림픽로 300 롯데월드타워 SKY31 컨벤션", sender: "오임찬", profile: "(주)하림지주 재경팀 오임찬", product: "축하 3단화환 (고급)", amount: "100,000원", status: "배송완료", statusColor: "#4caf50", hasPhoto: true },
  { id: 14, manager: "이대리", date: "2026/05/20 10:30", address: "충북 청주시 흥덕구 1순환로 776 청주성모병원 장례식장 5호실", sender: "이대리", profile: "(주)하림지주 영업1팀 이대리", product: "근조바구니(대체발송)", amount: "65,000원", status: "배송완료", statusColor: "#4caf50", hasPhoto: false },
  { id: 15, manager: "박사원", date: "2026/05/13 16:20", address: "강원 춘천시 백령로 156 강원대학교병원 장례식장 특실", sender: "김현수", profile: "(주)하림지주 인사팀 김현수", product: "10KG 쌀화환(대체발송)", amount: "90,000원", status: "배송완료", statusColor: "#4caf50", hasPhoto: true },
  { id: 16, manager: "김총무", date: "2026/05/06 09:00", address: "제주 제주시 첨단로 242 제주첨단과학기술단지 컨벤션홀", sender: "경영지원팀", profile: "(주)하림지주 경영지원팀", product: "축하 3단화환 (기본)", amount: "70,000원", status: "배송완료", statusColor: "#4caf50", hasPhoto: false },
].map((o) => (o.status === "배송완료" ? { ...o, hasPhoto: true } : o)); // 배송완료 주문은 항상 사진 보유

// 주문현황 정렬 우선순위(상단→하단): 접수대기 → 주문접수 → 배송완료
const STATUS_RANK = { "접수대기": 0, "주문접수": 1, "배송완료": 2 };

const statusFilters = [
  { label: "전체", value: "all", color: "#555", bg: "#f5f5f5" },
  { label: "접수대기", value: "접수대기", color: "#757575", bg: "#f5f5f5" },
  { label: "주문접수", value: "주문접수", color: "#4169e1", bg: "#eef0ff" },
  { label: "배송완료", value: "배송완료", color: "#2e7d32", bg: "#e8f5e9" },
];
const imageFilterOptions = [
  { label: "이미지 있음", value: "has-image" },
  { label: "이미지 없음", value: "no-image" },
];
const quickDates = ["오늘", "어제", "내일", "이번 달", "지난 달"];
const badgeBg = { "주문접수": "#eef0ff", "접수대기": "#f5f5f5", "배송완료": "#e8f5e9" };
const searchDefs = [
  { key: "profile", label: "프로필 검색", placeholder: "이름·문구를 입력해주세요" },
  { key: "recipient", label: "받는분 검색", placeholder: "받는 분 성함을 입력해주세요" },
  { key: "address", label: "주소지 검색", placeholder: "주소지를 입력해주세요" },
];

/* ── 클레임 접수 (경조사화환 운영 클레임 대응·보상 정책) ─────────
   유형별 희망 보상(options): 선택지가 2개 이상이면 접수 시 선택받는다. */
const CLAIM_TYPES = [
  { key: "배송 오류 (주소지·일시)", policy: "재배송 가능 시 즉시 무상 재배송, 불가 시 대금 100% 환불 + 보상 상품 제공", options: ["즉시 무상 재배송", "대금 100% 환불 + 보상 상품"] },
  { key: "배송 누락 (미배송)", policy: "재배송 가능 시 즉시 무상 재배송, 불가 시 대금 100% 환불 + 보상 상품 제공", options: ["즉시 무상 재배송", "대금 100% 환불 + 보상 상품"] },
  { key: "2시간 이상 배송지연 (사전 안내 없음)", policy: "대금 100% 환불 및 상품 무상 제공", options: ["대금 100% 환불 + 상품 무상 제공"] },
  { key: "재사용·시든 꽃 사용", policy: "대금 100% 환불 + 피해보상금 100% 지급(총 200% 보상) + 신품 생화 상품 2시간 내 무상교환", note: "배송완료 1시간 내 접수 건에 한합니다.", options: ["대금 200% 보상 (환불 + 피해보상금)", "신품 생화 2시간 내 무상교환", "200% 보상 + 무상교환 모두"] },
  { key: "상품 품질 수준 미달", policy: "표준 사양 대비 수준 미달 시 접수 2시간 내 무상교환", options: ["2시간 내 무상교환"] },
  { key: "리본 문구 오작성", policy: "2시간 내 리본 무상 교체", options: ["2시간 내 리본 무상 교체"] },
  { key: "기타 제반사항", policy: "주문자의 요구사항에 따라 환불 또는 충분한 보상 제공", options: ["대금 환불", "보상 상품 제공", "담당자 협의 후 결정"] },
];
const claimStatusStyle = {
  "접수완료": { color: "#757575", bg: "#f5f5f5" },
  "처리중": { color: "#4169e1", bg: "#eef0ff" },
  "처리완료": { color: "#2e7d32", bg: "#e8f5e9" },
};
const initialClaims = [
  { id: "CL-20260707-01", date: "2026/07/07 11:20", type: "상품 품질 수준 미달", desired: "2시간 내 무상교환", status: "처리완료", note: "국화 신선도 미달로 신품 교환 완료 (부산 고신대복음병원)" },
  { id: "CL-20260704-01", date: "2026/07/04 16:05", type: "리본 문구 오작성", desired: "2시간 내 리본 무상 교체", status: "처리중", note: "보내는분 명의 오기입 (울산 롯데호텔 스탠드)" },
  { id: "CL-20260703-01", date: "2026/07/03 10:50", type: "배송 오류 (주소지·일시)", desired: "즉시 무상 재배송", status: "접수완료", note: "호실 오배송 → 재배송 요청 (광주 조선대병원 오브제)" },
];

export function mount(root, { nav }) {
  const state = {
    activeStatus: "all",
    imageFiltersOn: ["has-image", "no-image"],
    activeDateFilter: "이번 달",
    profile: "", recipient: "", address: "",
  };
  let activeModal = null;
  const closeModal = () => { if (activeModal) { activeModal.close(); activeModal = null; } };
  const claims = initialClaims.map((c) => ({ ...c })); // 접수 시 상단에 unshift

  function filtered() {
    const [rangeStart, rangeEnd] = getDateRange(state.activeDateFilter);
    return orderData
      .filter((o) => {
        if (state.activeStatus !== "all" && o.status !== state.activeStatus) return false;
        if (!state.imageFiltersOn.includes("has-image") && o.hasPhoto) return false;
        if (!state.imageFiltersOn.includes("no-image") && !o.hasPhoto) return false;
        const od = parseOrderDate(o.date);
        if (od < rangeStart || od > rangeEnd) return false;
        if (state.profile && !o.profile.includes(state.profile)) return false;
        if (state.recipient && !o.manager.includes(state.recipient)) return false;
        if (state.address && !o.address.includes(state.address)) return false;
        return true;
      })
      // 주문현황 우선순위 내림차순(접수대기 상단 → 배송완료 하단). 동순위는 기존 순서 유지.
      .sort((a, b) => (STATUS_RANK[a.status] ?? 99) - (STATUS_RANK[b.status] ?? 99));
  }

  const columns = [
    { label: "담당자", width: "84px", align: "center", render: (r) => r.manager },
    { label: "배송요청일시", width: "148px", render: (r) => r.date },
    { label: "배송요청주소", render: (r) => html`<div class="orders-trunc">${r.address}</div>` },
    { label: "발송 프로필", width: "120px", render: (r) => html`<div class="orders-trunc">${r.sender}</div>` },
    { label: "주문상품", width: "140px", render: (r) => html`<div class="orders-trunc">${r.product}</div>` },
    { label: "결제금액", width: "96px", align: "right", render: (r) => r.amount },
    {
      label: "주문현황", width: "94px", align: "center",
      render: (r) => html`<span class="orders-badge" style="color:${r.statusColor};background:${badgeBg[r.status] ?? "#f5f5f5"}">${r.status}</span>`,
    },
    {
      label: "사진", width: "60px", align: "center",
      render: (r) => html`<button class="orders-photo ${r.hasPhoto ? "has" : "no"}" data-action="detail" data-id="${r.id}" title="${r.hasPhoto ? "사진 있음 — 클릭하여 상세 보기" : "사진 없음 — 클릭하여 주문 정보 보기"}" aria-label="주문 상세">${icon("camera", { size: 16 })}</button>`,
    },
  ];

  function tableBody() {
    return tableGrid({ columns, rows: filtered(), rowKey: (r) => r.id });
  }
  function countBody() {
    return html`총 <strong>${filtered().length}</strong>건`;
  }

  const claimCols = [
    { label: "접수일시", width: "150px", render: (r) => html`<span class="num">${r.date}</span>` },
    { label: "클레임 유형", width: "230px", render: (r) => html`<div class="orders-trunc">${r.type}</div>` },
    { label: "희망 보상", render: (r) => html`<div class="orders-trunc">${r.desired}</div>` },
    { label: "상세", render: (r) => html`<div class="orders-trunc">${r.note || "—"}</div>` },
    {
      label: "처리결과", width: "100px", align: "center",
      render: (r) => { const s = claimStatusStyle[r.status] ?? { color: "#555", bg: "#f5f5f5" }; return html`<span class="orders-badge" style="color:${s.color};background:${s.bg}">${r.status}</span>`; },
    },
  ];
  function claimBody() {
    return tableGrid({ columns: claimCols, rows: claims, rowKey: (r) => r.id, compact: true });
  }

  function render() {
    const [rangeStart, rangeEnd] = getDateRange(state.activeDateFilter);
    setHTML(
      root,
      html`
        <div class="page-orders">
          <div class="orders-inner">
            ${pageTitle({ imgSrc: "./assets/nav-realtime.png", title: "실시간 주문처리 내역" })}

            <div class="orders-filters">
              <!-- Row 1: status + image -->
              <div class="orders-frow orders-frow--1">
                <div class="orders-fgroup">
                  <span class="orders-flabel">주문현황</span>
                  <div class="orders-chips">
                    ${statusFilters.map((sf) => {
                      const active = state.activeStatus === sf.value;
                      const style = active
                        ? sf.value === "all"
                          ? "background:#333;color:#fff;border-color:#333"
                          : `background:${sf.bg};color:${sf.color};border-color:${sf.color}`
                        : "background:#fff;color:#888;border-color:#e0e0e0";
                      return html`<button class="orders-statbtn" style="${style}" data-action="status" data-v="${sf.value}">${sf.label}</button>`;
                    })}
                  </div>
                </div>
                <div class="orders-divider"></div>
                <div class="orders-fgroup">
                  <span class="orders-flabel">사진 필터</span>
                  ${imageFilterOptions.map((f) => {
                    const on = state.imageFiltersOn.includes(f.value);
                    return html`<label class="orders-check">
                      <input type="checkbox" data-action="imgfilter" data-v="${f.value}" ${on ? "checked" : ""} />
                      <span class="${on ? "is-on" : ""}">${f.label}</span>
                    </label>`;
                  })}
                </div>
                <div class="orders-divider"></div>
                <div class="orders-flow">
                  <span class="orders-flowtag" style="background:#f5f5f5;color:#888">접수대기</span><span>→</span>
                  <span class="orders-flowtag" style="background:#eef0ff;color:#4169e1">주문접수</span><span>→</span>
                  <span class="orders-flowtag" style="background:#e8f5e9;color:#2e7d32">배송완료</span>
                </div>
              </div>

              <!-- Row 2: date -->
              <div class="orders-frow orders-frow--2">
                <span class="orders-flabel">배송요청일</span>
                <div class="orders-daterange">
                  ${icon("calendar-days", { size: 13, cls: "tint-muted" })}
                  <span>${formatDateLabel(rangeStart)}</span>
                  ${icon("chevron-left", { size: 13 })}${icon("chevron-right", { size: 13 })}
                  <span>${formatDateLabel(rangeEnd)}</span>
                </div>
                <div class="orders-chips">
                  ${quickDates.map(
                    (opt) => html`<button class="orders-datebtn ${state.activeDateFilter === opt ? "is-active" : ""}" data-action="date" data-v="${opt}">${opt}</button>`
                  )}
                </div>
              </div>

              <!-- Row 3: search -->
              <div class="orders-frow orders-frow--3">
                ${searchDefs.map(
                  (s) => html`<div class="orders-search">
                    <div class="orders-search__lbl">${icon("search", { size: 12, cls: "tint-muted" })}<span>${s.label}</span></div>
                    <input type="text" data-search="${s.key}" value="${state[s.key]}" placeholder="${s.placeholder}" />
                  </div>`
                )}
              </div>
            </div>

            <div class="orders-notice">
              <span>🔴</span>
              <p>아래에 기재되어 있지 않은 주문은 누락 가능성이 있으므로, CS센터로 확인 문의를 꼭 부탁드립니다.</p>
            </div>

            <div class="orders-count" data-slot="count">${countBody()}</div>

            <div class="orders-table" data-slot="table">${tableBody()}</div>

            <!-- 클레임 접수 -->
            <section class="claims-sec">
              <div class="claims-head">
                <div class="claims-head__l">
                  <span class="claims-bar"></span>
                  <div>
                    <h2 class="claims-title">클레임 접수</h2>
                    <p class="claims-sub">배송·상품 관련 클레임을 접수하고 처리 현황을 확인하세요</p>
                  </div>
                </div>
                <button class="claims-newbtn" data-action="new-claim">＋ 클레임 접수</button>
              </div>
              <div class="claims-table" data-slot="claims">${claimBody()}</div>
            </section>
          </div>
        </div>
      `
    );
  }

  function openDetail(order) {
    closeModal();
    const sc = { "주문접수": { bg: "#eef0ff", text: "#4169e1" }, "접수대기": { bg: "#f5f5f5", text: "#757575" }, "배송완료": { bg: "#e8f5e9", text: "#2e7d32" } }[order.status] ?? { bg: "#f5f5f5", text: "#555" };
    const rows = [
      ["담당자", order.manager],
      ["배송요청일시", order.date],
      ["배송주소", order.address],
      ["발송 프로필", order.profile],
      ["주문상품", order.product],
      ["주문금액", order.amount],
    ];
    const head = html`
      <div class="hm__head">
        <div><p class="hm-eyebrow">주문 상세정보</p><h3>${order.product}</h3></div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="hm-badge" style="background:${sc.bg};color:${sc.text}">${order.status}</span>
          <button class="hm__x" data-action="close" aria-label="닫기">${icon("x", { size: 14 })}</button>
        </div>
      </div>
    `;
    const dl = html`
      <div class="hm-dl">
        ${rows.map(([label, value]) => {
          const vClass = label === "주문금액" ? "v amt num" : label === "배송요청일시" ? "v num" : "v";
          return html`<div class="row"><span class="k">${label}</span><span class="${vClass}">${value}</span></div>`;
        })}
      </div>
    `;
    const foot = html`<div class="hm__foot"><button class="hm-btn hm-btn--primary" data-action="close">닫기</button></div>`;

    /* 사진 보유: 세로형(2:3) 현장사진을 좌측 고정 배치, 정보는 우측 —
       사진 비율을 유지하면서도 모달 세로 길이가 늘어나지 않는다. */
    const body = order.hasPhoto
      ? html`
          <div class="msplit">
            <button class="msplit__media msplit__media--btn" data-action="zoom" aria-label="배송 사진 크게 보기">
              <img src="${deliveryPhoto(order)}" alt="배송 완료 현장사진" />
              <span class="msplit__zoomhint">${icon("search", { size: 12 })}크게 보기</span>
            </button>
            <div class="msplit__body">${head}<div class="msplit__scroll">${dl}</div>${foot}</div>
          </div>
        `
      : html`${head}<div class="hm__body">${dl}</div>${foot}`;
    activeModal = openModal({
      panelClass: order.hasPhoto ? "modal-panel--split" : "",
      body,
      onClose: () => {},
    });
    on(activeModal.panel, "click", "[data-action='close']", () => closeModal());
    on(activeModal.panel, "click", "[data-action='zoom']", () =>
      openLightbox({
        src: deliveryPhoto(order),
        alt: "배송 완료 현장사진",
        caption: `${order.product} — ${order.date} 배송사진`,
      })
    );
  }

  /* ── 클레임 접수 모달 (유형 선택 → 유형별 희망 보상 선택 → 접수) ── */
  function openClaimModal() {
    closeModal();
    const form = { typeIdx: null, option: null, note: "" };
    const valid = () => form.typeIdx != null && !!form.option;
    function compBody() {
      if (form.typeIdx == null) return html`<p class="hm-help">클레임 유형을 먼저 선택하면 보상 옵션이 표시됩니다.</p>`;
      const c = CLAIM_TYPES[form.typeIdx];
      return html`
        ${c.note ? html`<div class="hm-info"><span>${c.note}</span></div>` : ""}
        <div class="claim-comps">
          ${c.options.map((opt) => html`<label class="hm-radio ${form.option === opt ? "is-sel" : ""}">
              <input type="radio" name="claim-comp" value="${opt}" ${form.option === opt ? "checked" : ""} data-claim-comp />
              <div><p class="hm-radio__t">${opt}</p></div>
            </label>`)}
        </div>
      `;
    }
    const body = html`
      <div class="hm__head">
        <div><p class="hm-eyebrow">클레임 접수</p><h3>배송·상품 클레임 접수</h3></div>
        <button class="hm__x" data-action="close" aria-label="닫기">${icon("x", { size: 14 })}</button>
      </div>
      <div class="hm__body claim-form">
        <div class="hm-section">클레임 유형</div>
        <div class="claim-types">
          ${CLAIM_TYPES.map((c, i) => html`<label class="hm-radio ${form.typeIdx === i ? "is-sel" : ""}">
              <input type="radio" name="claim-type" value="${i}" ${form.typeIdx === i ? "checked" : ""} data-claim-type />
              <div><p class="hm-radio__t">${c.key}</p><p class="hm-radio__d">${c.policy}</p></div>
            </label>`)}
        </div>
        <div class="hm-section claim-sec2">희망 보상</div>
        <div data-slot="comp">${compBody()}</div>
        <div class="hm-section claim-sec2">상세 내용 <span class="claim-opt">선택</span></div>
        <textarea class="textarea claim-note" data-claim-note rows="3" placeholder="상황을 간단히 적어주세요 (예: 3호실 오배송, 리본 명의 오기입 등)"></textarea>
      </div>
      <div class="hm__foot">
        <button class="hm-btn hm-btn--secondary" data-action="close">취소</button>
        <button class="hm-btn hm-btn--primary" data-action="submit-claim" disabled>클레임 접수하기</button>
      </div>
    `;
    activeModal = openModal({ panelClass: "modal-panel--claim", body, onClose: () => {} });
    const panel = activeModal.panel;
    const refreshComp = () => { const s = qs(panel, "[data-slot='comp']"); if (s) setHTML(s, compBody()); };
    const refreshSubmit = () => { const b = qs(panel, "[data-action='submit-claim']"); if (b) b.disabled = !valid(); };
    on(panel, "click", "[data-action='close']", () => closeModal());
    on(panel, "change", "[data-claim-type]", (e, t) => {
      form.typeIdx = Number(t.value);
      const opts = CLAIM_TYPES[form.typeIdx].options;
      form.option = opts.length === 1 ? opts[0] : null; // 단일 옵션은 자동 선택
      qsa(panel, ".claim-types .hm-radio").forEach((el, i) => el.classList.toggle("is-sel", i === form.typeIdx));
      refreshComp(); refreshSubmit();
    });
    on(panel, "change", "[data-claim-comp]", (e, t) => {
      form.option = t.value;
      qsa(panel, ".claim-comps .hm-radio").forEach((el) => el.classList.toggle("is-sel", el.querySelector("input").value === t.value));
      refreshSubmit();
    });
    on(panel, "input", "[data-claim-note]", (e, t) => { form.note = t.value.trim(); });
    on(panel, "click", "[data-action='submit-claim']", () => {
      if (!valid()) return;
      const now = new Date();
      const p2 = (n) => String(n).padStart(2, "0");
      const ymd = `${now.getFullYear()}${p2(now.getMonth() + 1)}${p2(now.getDate())}`;
      const date = `${now.getFullYear()}/${p2(now.getMonth() + 1)}/${p2(now.getDate())} ${p2(now.getHours())}:${p2(now.getMinutes())}`;
      const sameDay = claims.filter((c) => c.id.startsWith(`CL-${ymd}`)).length + 1;
      claims.unshift({ id: `CL-${ymd}-${p2(sameDay)}`, date, type: CLAIM_TYPES[form.typeIdx].key, desired: form.option, status: "접수완료", note: form.note || "—" });
      const slot = qs(root, "[data-slot='claims']");
      if (slot) setHTML(slot, claimBody());
      closeModal();
    });
  }

  render();

  const offClick = on(root, "click", "[data-action]", (e, t) => {
    const a = t.dataset.action;
    if (a === "status") { state.activeStatus = t.dataset.v; render(); }
    else if (a === "date") { state.activeDateFilter = t.dataset.v; render(); }
    else if (a === "new-claim") { openClaimModal(); }
    else if (a === "detail") {
      const o = orderData.find((x) => String(x.id) === t.dataset.id);
      if (o) openDetail(o);
    }
  });
  const offChange = on(root, "change", "[data-action='imgfilter']", (e, t) => {
    const v = t.dataset.v;
    state.imageFiltersOn = state.imageFiltersOn.includes(v)
      ? state.imageFiltersOn.filter((x) => x !== v)
      : [...state.imageFiltersOn, v];
    render();
  });
  const offInput = on(root, "input", "[data-search]", (e, t) => {
    state[t.dataset.search] = t.value;
    const tbl = qs(root, "[data-slot='table']");
    const cnt = qs(root, "[data-slot='count']");
    if (tbl) setHTML(tbl, tableBody());
    if (cnt) setHTML(cnt, countBody());
  });

  return () => { offClick(); offChange(); offInput(); closeModal(); };
}
