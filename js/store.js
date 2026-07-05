/* ============================================================
   store.js — global state (profiles / contacts / clients)
   pub/sub + localStorage persistence. Ports AppContext.tsx.
   ============================================================ */
import { INITIAL_CLIENTS } from "./data/admin-mock.js";

/** @typedef {{category:string,product:string,price:string,description:string,icon:string}} Product */
/** @typedef {{no:string,name:string,role:string,phone:string,greeting:string}} Profile */
/** @typedef {{no:string,name:string,role:string,phone:string,message:string,isBilling:boolean}} Contact */
/** @typedef {{id:string,accountId:string,password:string,companyName:string,bizNumber:string,ceoName:string,managerName:string,department:string,contact:string,email:string,address:string,status:string,joinDate:string}} Client */

/* ── Static product catalog (immutable) ─────────────────── */
export const ALL_PRODUCTS = [
  { category: "축하화환",   product: "축하 3단화환 (기본)",    price: "70,000원",  description: "거베라(조화) 70송이 이상 + 다품종 생화(소국, 안개꽃 등) 전체 비율의 5% 이상 + 하단 백합(조화)", icon: "🌸" },
  { category: "축하화환",   product: "축하 3단화환 (고급)",    price: "100,000원", description: "거베라(조화) 80송이 이상 + 다품종 생화(소국, 안개꽃 등) 전체 비율의 10% 이상 + 하단 백합(조화)", icon: "🌸" },
  { category: "근조화환",   product: "근조 3단화환 (기본)",    price: "70,000원",  description: "100% 신품 국화(생화) 70송이 이상 + 하단 백합(조화) + 와네끼, 도시루 등 부소재 데코", icon: "🏵️" },
  { category: "근조화환",   product: "근조 3단화환 (고급)",    price: "100,000원", description: "100% 신품 국화(생화) 80송이 이상 + 하단 및 사이드 백합(조화) + 와네끼, 도시루 등 부소재 데코", icon: "🏵️" },
  { category: "특수화환",   product: "오브제(대체발송)",       price: "70,000원",  description: "철제 받침 • 반입 가능한 형태 + 100% 신품 국화(생화) 30송이 이상 + 백합 조화 또는 도시루 등 부소재 데코", icon: "🌺" },
  { category: "특수화환",   product: "스탠드(대체발송)",       price: "70,000원",  description: "플라스틱 받침 • 반입 가능한 형태 + 100% 신품 국화(생화) 40송이 이상 + 백합 조화 또는 도시루 등 부소재 데코", icon: "🌺" },
  { category: "특수화환",   product: "10KG 쌀화환(대체발송)",  price: "90,000원",  description: "3단 • 반입 가능한 형태 + 쌀 10KG 동반배송", icon: "🌾" },
  { category: "근조바구니", product: "근조바구니(대체발송)",              price: "65,000원",  description: "나무 바구니 • 반입 가능한 형태 + 100% 신품 국화(생화) 40송이 이상 + 백합 조화 또는 도시루 등 부소재 데코", icon: "🧺" },
  { category: "꽃바구니",   product: "꽃바구니(대체발송)",                price: "80,000원",  description: "100% 신품 생화(다품종) 20송이 이상 + 부소재 데코", icon: "💐" },
];

export const productKey = (r) => `${r.category}__${r.product}`;
/** "50,000원" → 50000 */
export const priceNum = (str) => parseInt(String(str).replace(/[^0-9]/g, ""), 10) || 0;
/** 50000 → "50,000원" */
export const won = (n) => Number(n).toLocaleString("ko-KR") + "원";

/* ── Initial mock data ──────────────────────────────────── */
const INITIAL_PROFILES = [
  { no: "01", name: "홍길동", role: "대표이사",   phone: "010-0000-0000", greeting: "(주)하림지주 대표이사 홍길동" },
  { no: "02", name: "정소빈", role: "대표변호사", phone: "010-0000-0000", greeting: "(주)하림지주 대표변호사 정소빈" },
  { no: "03", name: "임직원", role: "일동",        phone: "010-0000-0000", greeting: "(주)하림지주 임직원 일동" },
  { no: "04", name: "임직원", role: "일동",        phone: "010-0000-0000", greeting: "(주)하림지주 임직원 일동" },
  { no: "05", name: "임직원", role: "일동",        phone: "010-0000-0000", greeting: "(주)하림지주 임직원 일동" },
];

const INITIAL_CONTACTS = [
  { no: "01", name: "할다운", role: "비서",   phone: "010-1111-2222", message: "모든 배송완료 마다에 메세지를 수신합니다", isBilling: false },
  { no: "02", name: "오임찬", role: "재경부", phone: "010-3333-4444", message: "메세지를 수신하지 않습니다.",        isBilling: true },
  { no: "03", name: "김현수", role: "경리",   phone: "010-5555-6666", message: "모든 배송완료 마다에 메세지를 수신합니다", isBilling: false },
];

/* ── Reactive store ─────────────────────────────────────── */
const KEY = "yeop.store.v4"; // v4: 프로필 명의(greeting) 하림 브랜딩 교체로 재시드
const subs = new Set();

/* 순번(no) 재부여: 프로필·담당자 목록은 항상 배열 순서대로 01,02,03… 을 유지한다.
   → 대상자 삭제 시 뒤 항목이 자동으로 앞 번호로 당겨진다(빈 번호 방지). */
const reindexNo = (arr) => arr.map((x, i) => ({ ...x, no: String(i + 1).padStart(2, "0") }));

let state = {
  profiles: INITIAL_PROFILES.map((p) => ({ ...p })),
  contacts: INITIAL_CONTACTS.map((c) => ({ ...c })),
  clients: INITIAL_CLIENTS.map((c) => ({ ...c })),
};

function persist() {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        profiles: state.profiles,
        contacts: state.contacts,
        clients: state.clients,
      })
    );
  } catch {
    /* storage full / disabled — keep running from memory */
  }
}

function hydrate() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    state = {
      profiles: Array.isArray(data.profiles) ? reindexNo(data.profiles) : state.profiles,
      contacts: Array.isArray(data.contacts) ? reindexNo(data.contacts.map((c) => ({ isBilling: false, ...c }))) : state.contacts,
      clients: Array.isArray(data.clients) ? data.clients : state.clients,
    };
    // 불변식 보정: 로드된 담당자 중 정산담당이 없으면 첫 담당자로 지정
    if (state.contacts.length > 0 && !state.contacts.some((c) => c.isBilling)) {
      state.contacts = state.contacts.map((c, i) => ({ ...c, isBilling: i === 0 }));
    }
  } catch {
    /* corrupt JSON → keep defaults (self-heal) */
  }
}

function emit() {
  subs.forEach((fn) => fn(state));
}

function resolve(next, current) {
  return typeof next === "function" ? next(current) : next;
}

export const store = {
  hydrate,
  get: () => state,
  subscribe(fn) {
    subs.add(fn);
    return () => subs.delete(fn);
  },
  setProfiles(next) {
    state = { ...state, profiles: reindexNo(resolve(next, state.profiles)) };
    persist();
    emit();
  },
  setContacts(next) {
    let arr = reindexNo(resolve(next, state.contacts));
    // 불변식: 정산·회계 담당자는 항상 1명 존재해야 한다 (없으면 첫 담당자로 자동 지정)
    if (arr.length > 0 && !arr.some((c) => c.isBilling)) {
      arr = arr.map((c, i) => ({ ...c, isBilling: i === 0 }));
    }
    state = { ...state, contacts: arr };
    persist();
    emit();
  },
  /** Designate a single 정산/회계 담당자 (거래명세서·입금 알림 수신). */
  setBillingContact(no) {
    this.setContacts((prev) => prev.map((c) => ({ ...c, isBilling: c.no === no })));
  },
  /** The contact who receives settlement/billing 알림톡, or null. */
  getBillingContact() {
    return state.contacts.find((c) => c.isBilling) || null;
  },
  // ── 계열사 (admin) ──────────────────────────────────────
  setClients(next) {
    state = { ...state, clients: resolve(next, state.clients) };
    persist();
    emit();
  },
  addClient(c) {
    this.setClients((prev) => [...prev, c]);
  },
  updateClient(c) {
    this.setClients((prev) => prev.map((x) => (x.id === c.id ? c : x)));
  },
  removeClient(id) {
    this.setClients((prev) => prev.filter((x) => x.id !== id));
  },
};
