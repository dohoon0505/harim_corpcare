/* ============================================================
   delivery-fees.js — 배송지(주소)별 추가 배송비.
   출처: 경조사화환_운영제안서 '배송비 추가지역'(별도 기재 외 전국 무료배송).
   총 69개 지역 · 추가배송비 10,000/20,000원.
   주소 문자열에 지역 키워드(kw)가 포함되면 해당 추가배송비를 적용한다.
   (자동 생성물 — scratchpad/gen-fees.cjs)
   ============================================================ */

/* kw: 주소 부분일치 키워드 · fee: 추가배송비(원) · region: 표시용 지역명 · sido: 시·도
   req: (선택) 동명 지역 오적용 방지 — 주소에 이 힌트 중 하나가 있어야 적용 */
export const DELIVERY_FEE_REGIONS = [
  { kw: "서귀포시", fee: 20000, region: "서귀포시", sido: "제주도" },
  { kw: "가평군", fee: 10000, region: "가평", sido: "경기도" },
  { kw: "양평군", fee: 10000, region: "양평군", sido: "경기도" },
  { kw: "연천군", fee: 10000, region: "연천군", sido: "경기도" },
  { kw: "포천군", fee: 10000, region: "포천군", sido: "경기도" },
  { kw: "철원군", fee: 10000, region: "철원군", sido: "경기도" },
  { kw: "화천군", fee: 20000, region: "화천군", sido: "강원도" },
  { kw: "양구군", fee: 10000, region: "양구군", sido: "강원도" },
  { kw: "인제군", fee: 10000, region: "인제군", sido: "강원도" },
  { kw: "고성군", fee: 20000, region: "고성군", sido: "강원도", req: ["강원"] },
  { kw: "속초시", fee: 10000, region: "속초시", sido: "강원도" },
  { kw: "양양군", fee: 10000, region: "양양군", sido: "강원도" },
  { kw: "홍천군", fee: 10000, region: "홍천군", sido: "강원도" },
  { kw: "횡성군", fee: 20000, region: "횡성군", sido: "강원도" },
  { kw: "평창군", fee: 20000, region: "평창군", sido: "강원도" },
  { kw: "강릉시", fee: 10000, region: "강릉시", sido: "강원도" },
  { kw: "동해시", fee: 10000, region: "동해시", sido: "강원도" },
  { kw: "삼척시", fee: 10000, region: "삼척시", sido: "강원도" },
  { kw: "태백시", fee: 20000, region: "태백시", sido: "강원도" },
  { kw: "정선군", fee: 10000, region: "정선군", sido: "강원도" },
  { kw: "영월군", fee: 10000, region: "영월군", sido: "강원도" },
  { kw: "원주시", fee: 10000, region: "원주시", sido: "강원도" },
  { kw: "보은군", fee: 20000, region: "보은군", sido: "충청북도" },
  { kw: "태안군", fee: 10000, region: "태안군", sido: "충청북도" },
  { kw: "계룡시", fee: 20000, region: "계룡시", sido: "충청북도" },
  { kw: "단양군", fee: 10000, region: "단양", sido: "충청북도" },
  { kw: "증평군", fee: 20000, region: "증평", sido: "충청북도" },
  { kw: "진천군", fee: 20000, region: "진천", sido: "충청북도" },
  { kw: "영동군", fee: 10000, region: "영동", sido: "충청북도" },
  { kw: "청양군", fee: 10000, region: "청양군", sido: "충청북도" },
  { kw: "울진군", fee: 20000, region: "울진군", sido: "경상북도" },
  { kw: "영덕군", fee: 20000, region: "영덕군", sido: "경상북도" },
  { kw: "영양군", fee: 20000, region: "영양군", sido: "경상북도" },
  { kw: "문경시", fee: 10000, region: "문경시", sido: "경상북도" },
  { kw: "상주시", fee: 10000, region: "상주시", sido: "경상북도" },
  { kw: "의성군", fee: 10000, region: "의성군", sido: "경상북도" },
  { kw: "청송군", fee: 20000, region: "청송군", sido: "경상북도" },
  { kw: "예천군", fee: 10000, region: "예천", sido: "경상북도" },
  { kw: "울릉군", fee: 20000, region: "울릉군", sido: "경상북도" },
  { kw: "군위군", fee: 10000, region: "군위군", sido: "대구광역시" },
  { kw: "달성군", fee: 10000, region: "달성군", sido: "대구광역시" },
  { kw: "울주군", fee: 10000, region: "울주군", sido: "울산광역시" },
  { kw: "기장군", fee: 10000, region: "기장군", sido: "부산광역시" },
  { kw: "합천군", fee: 10000, region: "합천군", sido: "경상남도" },
  { kw: "창녕군", fee: 10000, region: "창녕군", sido: "경상남도" },
  { kw: "의령군", fee: 10000, region: "의령군", sido: "경상남도" },
  { kw: "하동군", fee: 10000, region: "하동군", sido: "경상남도" },
  { kw: "산청군", fee: 10000, region: "산청군", sido: "경상남도" },
  { kw: "함안군", fee: 10000, region: "함안군", sido: "경상남도" },
  { kw: "진안군", fee: 10000, region: "진안군", sido: "전라북도" },
  { kw: "무주군", fee: 10000, region: "무주군", sido: "전라북도" },
  { kw: "장수군", fee: 10000, region: "장수군", sido: "전라북도" },
  { kw: "남원시", fee: 10000, region: "남원시", sido: "전라북도" },
  { kw: "임실군", fee: 10000, region: "임실군", sido: "전라북도" },
  { kw: "순창군", fee: 10000, region: "순창군", sido: "전라북도" },
  { kw: "함평군", fee: 10000, region: "함평군", sido: "전라남도" },
  { kw: "곡성군", fee: 10000, region: "곡성군", sido: "전라남도" },
  { kw: "구례군", fee: 20000, region: "구례군", sido: "전라남도" },
  { kw: "광양시", fee: 10000, region: "광양시", sido: "전라남도" },
  { kw: "영암군", fee: 10000, region: "영암군", sido: "전라남도" },
  { kw: "진도군", fee: 10000, region: "진도군", sido: "전라남도" },
  { kw: "해남군", fee: 10000, region: "해남군", sido: "전라남도" },
  { kw: "장흥군", fee: 20000, region: "장흥", sido: "전라남도" },
  { kw: "고흥군", fee: 20000, region: "고흥군", sido: "전라남도" },
  { kw: "제주시", fee: 10000, region: "제주시", sido: "제주도" },
  { kw: "풍기", fee: 10000, region: "영주풍기", sido: "경상북도" },
  { kw: "안동", fee: 10000, region: "서안동", sido: "경상북도" },
  { kw: "용원", fee: 10000, region: "창원 진해 용원", sido: "경상남도", req: ["진해"] },
  { kw: "함열", fee: 10000, region: "익산함열", sido: "전라북도" },
];

/* 주소 → { fee, region }. 해당 없으면 { fee: 0, region: "" }(전국 무료배송). */
export function deliveryFeeFor(address) {
  if (!address) return { fee: 0, region: "" };
  const a = String(address);
  for (const r of DELIVERY_FEE_REGIONS) {
    if (!a.includes(r.kw)) continue;
    if (r.req && !r.req.some((h) => a.includes(h))) continue;
    return { fee: r.fee, region: r.region };
  }
  return { fee: 0, region: "" };
}
