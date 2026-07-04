/* eslint-disable */
// flower_example — 상품 카탈로그 (자동 생성: publishToGitHub)
const CATEGORIES = [
  { id: "tab4", name: "경조화환", blurb: "축하·근조 화환", banner: "img/banner_tab4.png", photo: "img/tab4_grand1.jpg", icon: "wreath", accent: "var(--p-amber-500)", accentBg: "#FEF3D1" },
  { id: "tab_alt", name: "대체상품", blurb: "쌀화환·오브제·바구니 등", banner: "img/banner_tab2.png", photo: "img/tab2_item1_img1.png", icon: "basket", accent: "#D946A6", accentBg: "#FDE7F4" }
];
const SECTIONS = {
  tab4: [
    { kicker: "", key: "congrat", title: "생화가 가득한 축하화환", tag: "예식 · 행사 · 개업", banner: "img/banner_tab4.png", items: [
      { productId: "tab4-basic", id: "tab4-basic", name: "축하 3단화환 (기본)", price: 70000, img: "img/congrat_basic.jpg", desc: "거베라(조화) 70송이 이상 + 다품종 생화(소국, 안개꽃 등) 전체 비율의 5% 이상 + 하단 백합(조화)" },
      { productId: "tab4-premium", id: "tab4-premium", name: "축하 3단화환 (고급)", price: 90000, img: "img/congrat_premium.jpg", desc: "거베라(조화) 80송이 이상 + 다품종 생화(소국, 안개꽃 등) 전체 비율의 10% 이상 + 하단 백합(조화)" }
    ] },
    { kicker: "", key: "condol", title: "100% 생화사용 근조화환", tag: "장례 · 부고 · 애도", banner: "img/banner_tab5.png", items: [
      { productId: "tab5-basic", id: "tab5-basic", name: "근조 3단화환 (기본)", price: 70000, img: "img/condol_basic.jpg", desc: "100% 신품 국화(생화) 70송이 이상 + 하단 백합(조화) + 와네끼, 도시루 등 부소재 데코" },
      { productId: "tab5-premium", id: "tab5-premium", name: "근조 3단화환 (고급)", price: 90000, img: "img/condol_premium.jpg", desc: "100% 신품 국화(생화) 80송이 이상 + 하단 및 사이드 백합(조화) + 와네끼, 도시루 등 부소재 데코" }
    ] }
  ],
  tab_alt: [
    { kicker: "", title: "3단화환 반입불가 대체상품", tag: "대체상품 미리보기", note: "장소에 따라 반입 가능한 상품을 안내드립니다!", items: [
      { productId: "alt-objet", id: "alt-objet", name: "특수화환 (오브제)", price: 75000, img: "img/placeholder.png", desc: "철제 받침·반입 가능한 형태 + 100% 신품 국화(생화) 30송이 이상 + 백합 조화 또는 도시루 등 부소재 데코" },
      { productId: "alt-stand", id: "alt-stand", name: "특수화환 (스탠드)", price: 75000, img: "img/placeholder.png", desc: "플라스틱 받침·반입 가능한 형태 + 100% 신품 국화(생화) 40송이 이상 + 백합 조화 또는 도시루 등 부소재 데코" },
      { productId: "alt-rice-condol", id: "alt-rice-condol", name: "근조특수화환(10KG 쌀화환)", price: 95000, img: "img/placeholder.png", desc: "3단·반입 가능한 형태 + 쌀 10KG 동반배송" },
      { productId: "alt-rice-congrat", id: "alt-rice-congrat", name: "축하특수화환(10KG 쌀화환)", price: 95000, img: "img/placeholder.png", desc: "3단·반입 가능한 형태 + 쌀 10KG 동반배송" },
      { productId: "alt-basket-condol", id: "alt-basket-condol", name: "근조바구니", price: 65000, img: "img/placeholder.png", desc: "나무 바구니·반입 가능한 형태 + 100% 신품 국화(생화) 40송이 이상 + 백합 조화 또는 도시루 등 부소재 데코" },
      { productId: "alt-basket-flower", id: "alt-basket-flower", name: "꽃바구니", price: 80000, img: "img/placeholder.png", desc: "100% 신품 생화(다품종) 20송이 이상 + 부소재 데코" }
    ] }
  ]
};
const HOME_SECTIONS = [
  { id: "hero", type: "hero", title: "히어로", icon: "image", data: { storeDesc: "하림그룹 임직원을 위한 경조화환 간편처리 시스템입니다", storeName: "하림그룹 경조화환\n통합 운영 시스템" } },
  { id: "faq", type: "faq", title: "FAQ", icon: "help", data: { title: "신청 시 자주하는 질문", pickedIds: ["faq-delivery-1", "faq-delivery-2", "faq-delivery-3", "faq-delivery-4", "faq-delivery-5", "faq-delivery-6", "faq-order-1"] } }
];
const FAQS = [
  { id: "faq-delivery-1", cat: "delivery", q: "당일 배송이 가능한 시간은 언제까지인가요?", a: "09:00 ~ 18:30 사이에 접수된 주문에 한하여 당일배송이 가능합니다. 18:30 이후 주문은 익일 오전 중 순차적으로 배송되며, 평균 12시~13시 사이에 도착합니다." },
  { id: "faq-delivery-2", cat: "delivery", q: "배송 완료는 어떻게 확인하나요?", a: "배송이 완료되면 신청인의 연락처로 배송 사진과 수령인 성함을 보내드립니다." },
  { id: "faq-delivery-3", cat: "delivery", q: "배송비가 추가로 발생하나요?", a: "전국 어디든 기본 배송비는 무료입니다. 다만 일부 도서·산간 지역, 차량 진입이 어려운 곳, 또는 30km 이상 장거리 지역은 추가 배송비가 발생할 수 있어요." },
  { id: "faq-delivery-4", cat: "delivery", q: "긴급·심야 배송도 가능한가요?", a: "긴급·심야 배송은 화훼 농가의 현황과 배송 인프라 여건에 따라 가능 유무가 유동적으로 달라질 수 있어, 별도로 신청해주시는 경우 30분 내 확인 후 빠르게 회신드리고 있습니다." },
  { id: "faq-delivery-5", cat: "delivery", q: "장례식장으로 보낼 때 주의할 점이 있나요?", a: "장례식장명, 호실, 고인 성함을 정확히 알려주시면 빠르게 배송됩니다. 다만 빈소가 변경되는 경우가 잦으니 주문 전 호실을 한 번 더 확인 부탁드립니다." },
  { id: "faq-delivery-6", cat: "delivery", q: "결혼식장으로 보낼 때 주의할 점이 있나요?", a: "청첩장을 받아 결혼식장으로 주문하는 경우 정확한 예식일정이 꼭 필요합니다. 예식 시간에 맞추어 화환을 배치해드리고 있어, 신청하신 예식 시간과 실제 예식 시간이 상이한 경우 재배송이 어려워 문제가 발생할 수 있습니다." },
  { id: "faq-order-1", cat: "order", q: "주문은 어떻게 진행되나요?", a: "① 상품 선택 → ② 주문서 작성(받는 분, 배송지, 리본문구) → ③ 작성한 내용으로 신청 완료. 신청에 문제가 있을 경우 담당자가 전화로 세부 사항을 안내해드립니다." },
  { id: "faq-order-2", cat: "order", q: "주문 후 변경이나 취소가 가능한가요?", a: "배송 출발 전이라면 자유롭게 변경·취소가 가능합니다. 이미 상품 제작이 시작된 경우 일부 비용이 발생할 수 있으며, 배송이 출발한 이후에는 취소가 어렵습니다." },
  { id: "faq-order-3", cat: "order", q: "단체 주문이나 정기 주문도 가능한가요?", a: "기업·관공서 단체 주문, 매월·매년 정기 주문 모두 가능합니다. 단가 협의가 필요하니 전화로 별도 문의해주세요." },
  { id: "faq-order-4", cat: "order", q: "주문 내역은 어디서 확인하나요?", a: "전화 또는 문자로 접수된 주문은 본사에서 관리됩니다. 주문번호 또는 보내신 분 성함을 알려주시면 언제든지 진행 상황을 확인해드려요." },
  { id: "faq-product-1", cat: "product", q: "사진과 실제 상품이 다를 수 있나요?", a: "꽃·식물은 시즌과 재고에 따라 색감·구성이 다소 달라질 수 있습니다. 동일한 가치와 풍성함을 유지하되 일부 꽃 종류가 대체될 수 있어요. 특정 꽃을 꼭 사용하셔야 한다면 주문 전 알려주세요." },
  { id: "faq-product-2", cat: "product", q: "화환 종류별 차이는 무엇인가요?", a: "기본형은 깔끔한 표준 구성, 고급형은 장식과 꽃 종류를 추가한 풍성한 구성, 특대/4단형은 가장 화려하고 입체감 있는 최고급 구성입니다. 가격대와 위계감을 함께 고려해 선택하시면 됩니다." },
  { id: "faq-product-3", cat: "product", q: "화분은 어느 정도 관리가 필요한가요?", a: "상품마다 다르지만 대부분은 7~10일에 한 번 물을 주고 햇빛이 잘 드는 곳에 두시면 됩니다. 상품 인수 시 함께 제공되는 관리 카드를 참고해주세요." },
  { id: "faq-payment-1", cat: "payment", q: "결제는 어떻게 진행되나요?", a: "주문 접수 후 담당자가 전화로 확인을 드리고, 계좌이체 또는 카드결제 안내를 드립니다. 결제 완료 후 배송이 시작됩니다." },
  { id: "faq-payment-2", cat: "payment", q: "세금계산서나 현금영수증 발행이 가능한가요?", a: "법인·개인사업자 모두 세금계산서 발행이 가능하며, 개인은 현금영수증으로도 발행해드립니다. 결제 시 사업자등록증 또는 휴대전화 번호를 함께 알려주세요." },
  { id: "faq-payment-3", cat: "payment", q: "환불은 어떻게 처리되나요?", a: "배송 출발 전 취소는 전액 환불됩니다. 상품 제작 후 취소는 제작 비용을 제외한 금액이, 배송 완료 후에는 상품 하자가 확인된 경우에 한해 환불 또는 재배송이 처리됩니다." }
];
const FAQ_CATEGORIES = [];
const ORDER_HISTORY = [
  { id: "20260603-014", status: "delivered", date: "2026-06-03 14:23:05", category: "근조화환", applicant: "이정민 / 010-2345-6789", product: "고급형 근조화환 (1)", recipient: "김영수 / 010-1234-5678", address: "부산 동구 고관로29번길 8 ○○장례식장 201호실", message: "삼가 고인의 명복을 빕니다", sender: "(주)하림 임직원 일동", price: 60000 },
  { id: "20260531-208", status: "pending",   date: "2026-05-31 10:12:44", category: "축하화환", applicant: "박서준 / 010-3456-7890", product: "기본형 축하화환 (1)", recipient: "박지훈 / 010-2222-3333", address: "서울 강남구 테헤란로 123 ○○빌딩 1층 로비", message: "개업을 진심으로 축하합니다", sender: "(주)팜스코 영업본부 일동", price: 50000 },
  { id: "20260528-091", status: "received",  date: "2026-05-28 16:47:09", category: "개업화분", applicant: "김도윤 / 010-4567-8901", product: "행복을 가져다주는 해피트리", recipient: "이서연 / 010-4444-5555", address: "경기 성남시 분당구 ○○로 45 ○○타워 12층", message: "귀사의 번창을 기원합니다", sender: "(주)선진 영업본부 일동", price: 99000 },
  { id: "20260525-177", status: "delivered", date: "2026-05-25 09:38:21", category: "꽃바구니", applicant: "정하은 / 010-5678-9012", product: "파스텔톤 혼합 꽃바구니", recipient: "최민호 / 010-6666-7777", address: "부산 해운대구 ○○로 12 ○○아파트 101동 1503호", message: "생신을 진심으로 축하드립니다", sender: "(주)제일사료 임직원 일동", price: 78000 },
  { id: "20260520-052", status: "cancelled", date: "2026-05-20 11:05:33", category: "축하화환", applicant: "최지우 / 010-6789-0123", product: "특대형 축하화환 (1)", recipient: "정해인 / 010-8888-9999", address: "대구 수성구 ○○로 88 ○○컨벤션 3층", message: "결혼을 진심으로 축하합니다", sender: "(주)팬오션 영업본부 일동", price: 75000 },
];
const RECENT_SENDERS = [
  "(주)하림 영업본부 일동",
  "(주)팜스코 임직원 일동",
  "(주)선진 대표이사 김철수",
  "(주)제일사료 총무팀 일동",
  "(주)NS쇼핑 마케팅팀 일동",
];
const AFFILIATES = ["하림", "팜스코", "선진", "제일사료", "팬오션", "NS쇼핑"];
Object.assign(window, { CATEGORIES, SECTIONS, HOME_SECTIONS, FAQS, FAQ_CATEGORIES, ORDER_HISTORY, RECENT_SENDERS, AFFILIATES });
const SITE_INFO = { phone: "010-7615-2699", kakaoChannel: "", ogTitle: "하림그룹 경조화환 통합 운영 시스템", ogDescription: "하림그룹 임직원을 위한 경조화환 간편처리 시스템입니다", ogImage: "./img/cover.png" };
Object.assign(window, { SITE_INFO });
