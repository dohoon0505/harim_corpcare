/* ============================================================
   admin-mock.js — ADMIN console mock datasets.
   - INITIAL_CLIENTS: 계열사(group affiliates) — persisted/editable via store.
   - CLIENT_SETTLEMENTS: static read-only mock, keyed by client id.
   Dates are generated RELATIVE TO NOW so the date / year-month filters
   always have current data regardless of when the demo is viewed.
   ============================================================ */

const NOW = new Date();
/** 목데이터 생성 기준 시각. 화면의 '이번달/저번달' 기본값은 반드시 이 값을 써야
 *  자정·월 전환 후에도(모듈은 재평가되지 않으므로) 데이터 창과 어긋나지 않는다. */
export const DATA_NOW = NOW;
const pad = (n) => String(n).padStart(2, "0");
const won = (n) => Number(n).toLocaleString("ko-KR") + "원";

// "YYYY년 MM월" for `monthsAgo` before this month
const ymLabel = (monthsAgo) => {
  const d = new Date(NOW.getFullYear(), NOW.getMonth() - monthsAgo, 1);
  return `${d.getFullYear()}년 ${pad(d.getMonth() + 1)}월`;
};
const fmtDot = (d) => `${d.getFullYear()}. ${pad(d.getMonth() + 1)}. ${pad(d.getDate())}`;

/* ── 계열사 (group affiliates) ──────────────────────────────
   회사명은 실제 하림그룹 계열사. 사업자번호·연락처·이메일·주소·담당자 등
   세부값은 데모용 플레이스홀더(실제 정보 아님). */
export const INITIAL_CLIENTS = [
  { id: "C001", accountId: "panocean", password: "po1234!", companyName: "팬오션",   bizNumber: "180-81-00133", ceoName: "안중호", managerName: "김해운", department: "총무팀",   contact: "010-2201-3360", email: "gm@panocean.com",          address: "서울 종로구 새문안로 76 콘코디언빌딩",        status: "활성",    joinDate: "2022-06-14" },
  { id: "C002", accountId: "cheilfeed", password: "cf2024@", companyName: "제일사료", bizNumber: "131-81-07013", ceoName: "이재면", managerName: "박사료", department: "구매팀",   contact: "010-3380-7742", email: "buy@cheilfeed.co.kr",      address: "충남 천안시 서북구 직산읍 4산단3로 25",       status: "활성",    joinDate: "2023-02-09" },
  { id: "C003", accountId: "harim",    password: "hr1234!", companyName: "(주)하림",  bizNumber: "402-81-34229", ceoName: "정호석", managerName: "한지훈", department: "경영지원팀", contact: "010-5521-8870", email: "ir@harim.com",            address: "전북 익산시 망성면 망성로 92",              status: "활성",    joinDate: "2022-09-01" },
  { id: "C004", accountId: "sunjin",   password: "sj#3030", companyName: "선진",     bizNumber: "126-81-45063", ceoName: "이범권", managerName: "오축산", department: "운영팀",   contact: "010-7720-4416", email: "office@sunjin.co.kr",      address: "서울 동작구 노량진로 10 쇼레이트빌딩",        status: "활성",    joinDate: "2023-11-22" },
  { id: "C005", accountId: "farmsco",  password: "fs$5050", companyName: "팜스코",   bizNumber: "134-81-28774", ceoName: "정민화", managerName: "배수진", department: "자재팀",   contact: "010-4419-7763", email: "md@farmsco.com",           address: "경기 안성시 미양면 제2공단길 30",            status: "활성", joinDate: "2026-06-12" },
  { id: "C006", accountId: "nsmall",   password: "ns2025@", companyName: "NS홈쇼핑", bizNumber: "215-87-61040", ceoName: "조항목", managerName: "신보라", department: "마케팅팀", contact: "010-3326-7740", email: "cs@nsmall.com",            address: "경기 성남시 분당구 서현로180번길 30",        status: "활성",    joinDate: "2024-03-12" },
  { id: "C007", accountId: "harimind", password: "hi#1212", companyName: "하림산업", bizNumber: "405-88-00921", ceoName: "민동기", managerName: "강민재", department: "구매팀",   contact: "010-6627-1108", email: "biz@harim.com",            address: "전북 익산시 함라면 천남로 100",             status: "활성", joinDate: "2026-06-15" },
  { id: "C008", accountId: "harimhd",  password: "hd@3434", companyName: "하림지주", bizNumber: "598-87-00488", ceoName: "김홍국", managerName: "김사원", department: "총무팀",   contact: "010-1234-5678", email: "chong@harim-holdings.com", address: "서울 강남구 영동대로 521 파르나스타워",       status: "활성",    joinDate: "2024-01-30" },
];

/* ── 계열사별·월별 이용 내역 (항목 카테고리 단위) ──────────────
   대시보드 인포그래픽·월간 분석 리포트의 원천 데이터.
   시드 고정 PRNG(mulberry32)로 결정적 생성 → 새로고침해도 값이 흔들리지 않는다.
   정산금액(CLIENT_SETTLEMENTS)은 이 이용 내역의 합계에서 파생 → 표·차트·리포트 정합. */
/* 항목별 이용 비중은 개별 상품 단위(상품 규격 안내 = store.js ALL_PRODUCTS 와 동일). */
export const USAGE_CATEGORIES = [
  { key: "축하 3단화환 (기본)",    unit: 70000 },
  { key: "축하 3단화환 (고급)",    unit: 100000 },
  { key: "근조 3단화환 (기본)",    unit: 70000 },
  { key: "근조 3단화환 (고급)",    unit: 100000 },
  { key: "오브제(대체발송)",       unit: 70000 },
  { key: "스탠드(대체발송)",       unit: 70000 },
  { key: "10KG 쌀화환(대체발송)",  unit: 90000 },
  { key: "근조바구니(대체발송)",              unit: 65000 },
  { key: "꽃바구니(대체발송)",                unit: 80000 },
];
const CAT_WEIGHTS = [0.2, 0.1, 0.28, 0.14, 0.04, 0.03, 0.03, 0.11, 0.07]; // 상품별 이용 비중(대략, 합=1)

const mulberry32 = (a) => () => {
  a |= 0; a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

function usageFor(ci, m) {
  const rnd = mulberry32(97 + ci * 131 + m * 17);
  const scale = 1 + ci * 0.35;        // 계열사 규모 차이
  const growth = 1 + (5 - m) * 0.09;  // 최근 월일수록 이용 증가 추세
  const items = {};
  let orders = 0, total = 0;
  USAGE_CATEGORIES.forEach((cat, i) => {
    const base = 4 * scale * growth * CAT_WEIGHTS[i];
    const count = Math.max(0, Math.round(base + (rnd() - 0.35) * 3));
    items[cat.key] = { count, amount: count * cat.unit };
    orders += count;
    total += count * cat.unit;
  });
  if (orders === 0) { // 최소 1건 보장(빈 월 방지) — 근조 3단화환 (기본)
    const f = USAGE_CATEGORIES[2];
    items[f.key] = { count: 1, amount: f.unit };
    orders = 1; total = f.unit;
  }
  return { items, orders, total };
}

/** CLIENT_USAGE[clientId]["YYYY년 MM월"] = { items:{카테고리:{count,amount}}, orders, total } */
export const CLIENT_USAGE = {};
INITIAL_CLIENTS.forEach((c, ci) => {
  CLIENT_USAGE[c.id] = {};
  for (let m = 0; m <= 5; m++) CLIENT_USAGE[c.id][ymLabel(m)] = usageFor(ci, m);
});

/* ── per-client SETTLEMENTS (settlement.js fields + 3 checks) ── */
function settlementsFor(client) {
  return [0, 1, 2, 3, 4, 5].map((m) => {
    const complete = m >= 2;   // older months: fully settled
    const inProgress = m === 1; // last month: agreed + issued, not paid yet
    const issueD = new Date(NOW.getFullYear(), NOW.getMonth() - m + 1, 1);
    const dueD = new Date(NOW.getFullYear(), NOW.getMonth() - m + 2, 0);
    const amount = CLIENT_USAGE[client.id][ymLabel(m)].total; // 이용 내역 합계에서 파생
    return {
      id: `${client.id}-${ymLabel(m).replace(/[년월\s]/g, "")}`,
      발행일: fmtDot(issueD),
      정산기한: fmtDot(dueD),
      청구내역: `${ymLabel(m)} 경조화환 이용대금 청구`,
      청구년월: ymLabel(m),
      정산금액: won(amount),
      입금자: client.companyName,
      거래명세서동의: complete || inProgress ? "동의완료" : "동의대기",
      계산서발급: complete || inProgress ? "발급완료" : "동의하기",
      입금완료: complete ? "입금완료" : "미입금",
    };
  });
}

export const CLIENT_SETTLEMENTS = {};
INITIAL_CLIENTS.forEach((c) => {
  CLIENT_SETTLEMENTS[c.id] = settlementsFor(c);
});

/** Available billing year/month options (for the settlement selector). */
export const SETTLEMENT_YEARS = (() => {
  const ys = new Set();
  for (let m = 0; m <= 5; m++) ys.add(new Date(NOW.getFullYear(), NOW.getMonth() - m, 1).getFullYear());
  return [...ys].sort((a, b) => b - a);
})();
