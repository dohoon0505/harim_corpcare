/* ============================================================
   products.js — ports ProductGuide.tsx (상품 규격 안내)
   상품 상시 노출 + 샘플 사진 모달. (즐겨찾기/저장·카테고리 필터 없음)
   ============================================================ */
import { html, setHTML, on, qs } from "../dom.js";
import { icon } from "../icons.js";
import { ALL_PRODUCTS, productKey } from "../store.js";
import { pageTitle, tableGrid, openModal, openLightbox } from "../ui.js";

/* 상품별 샘플 사진(2:3 세로형) — assets/ 실제 배송 이미지.
   상품명(고유) → 파일명 배열. 2장 이상이면 모달에서 캐러셀(5초 자동 슬라이드 + ‹›). */
const SAMPLE_IMAGES = {
  "축하 3단화환 (기본)": ["축하_기본_예시.png"],
  "축하 3단화환 (고급)": ["축하_고급_예시.png"],
  "근조 3단화환 (기본)": ["근조_기본_예시_2.jpg"],
  "근조 3단화환 (고급)": ["근조_고급_예시.jpg", "근조_고급_예시5.jpg"],
  "오브제(대체발송)": ["오브제_예시.jpg", "오브제_예시_3.jpg"],
  "스탠드(대체발송)": ["스탠드_예시_2.jpg"],
  "10KG 쌀화환(대체발송)": ["쌀화환_예시.jpg", "쌀화환_예시_2.jpg", "쌀화환_예시_3.jpg", "쌀에-리본.png", "쌀화환 청주.jpg", "쌀화환-울산.jpg", "거창쌀화환.jpg", "옥천쌀화환.jpg"],
  "근조바구니(대체발송)": ["근조바구니_예시.png"],
  "꽃바구니(대체발송)": ["꽃바구니_예시.jpg"],
};
/* 파일명 → 안전한 URL(공백·한글 인코딩). 매핑 없으면 빈 배열. */
const sampleUrls = (productName) => (SAMPLE_IMAGES[productName] || []).map((f) => encodeURI("./assets/" + f));

/* 지역별 · 상품(대체발송) 반입가이드 — [시·도, [ [지역·장소, 오브제, 근조바구니, 쌀화환, 상세안내], ... ]] */
const INTAKE_GUIDE = [
  ["서울", [
    ["중구 / 명동성당", 0, 0, 1, "쌀에 리본만 반입가능"],
    ["용산구 / 천주교 의정성당", 0, 0, 1, "쌀화환 반입가능"],
    ["중구 · 강남구 / 라루체 · 빌라드지디 청담", 0, 0, 0, "꽃바구니 반입가능"],
    ["노원구 / 도토은요양병원", 1, 0, 0, "근조 오브제 반입가능"],
    ["강남구 / 압구정성당", 0, 0, 1, "쌀화환 · 난 · 꽃바구니 반입가능"],
    ["마포구 / 웨딩시그니처", 0, 0, 0, "화환은 1층 로비에 배치"],
    ["마포구 / 상암동 데퍼시스 (예식 21층)", 0, 0, 0, "화환은 지하 1층 식당에 배치"],
    ["용산구 / 용산 베르가모", 0, 0, 0, "화환은 1층에만 배치가능"],
    ["서초구 / 외교센터", 0, 0, 0, "화환은 1층에만 배치가능"],
    ["서초구 / JW 메리어트 호텔", 0, 0, 0, "첫 예식 제외 배송비 5천원 추가"],
    ["강남구 / 아펠가모 (4층)", 0, 0, 0, "전체 화환 중 일부만 설치가능"],
    ["강남구 / 코엑스 (지하)", 0, 0, 0, "하모니볼룸 배송비 5천원 추가"],
    ["세빛둥둥섬 · 더채플앳청담 · 용산드래곤시티 · 스테이지28", 0, 0, 0, "당일배송 불가"],
    ["강남구 / 라움아트센터", 0, 0, 0, "꽃바구니 (축하 3단은 지하 배송 → 리본만 전달)"],
  ]],
  ["부산", [
    ["부산 전역 / 영락공원 · 기장 원자력병원 · 착한전문장례식장 · 동구·동래 병원", 1, 0, 0, "오브제 반입가능"],
    ["동구 / 가정성당", 0, 0, 1, "쌀에 리본만 반입가능"],
    ["아시아드시티 마리아주", 0, 0, 0, "꽃바구니 반입가능"],
    ["구포성당", 1, 0, 0, "오브제 반입가능"],
  ]],
  ["대구", [
    ["북구 / 가톨릭병원 장례식장 · 경북요양병원", 0, 1, 0, "근조바구니 반입가능"],
  ]],
  ["울산", [
    ["울주 / 하늘공원", 1, 0, 0, "오브제 반입가능"],
  ]],
  ["세종", [
    ["세종 / 은하수공원 장례식장", 1, 0, 0, "오브제 반입가능"],
  ]],
  ["경기 · 인천", [
    ["수원 / 연화장", 1, 0, 0, "오브제 반입가능"],
    ["군포 / 산본성당", 0, 0, 1, "쌀화환 반입가능"],
    ["인천 / 전지역", 1, 0, 0, "오브제 반입가능"],
  ]],
  ["강원", [
    ["춘천 외 전지역", 1, 0, 0, "오브제 반입가능"],
  ]],
  ["충남", [
    ["예산 / 중앙장례식장", 0, 0, 1, "근조 쌀화환 반입가능"],
    ["공주 / 신풍면 · 이인면", 0, 0, 0, "배송비 발생 가능성 有"],
    ["계룡 / 계룡시 전역", 0, 0, 0, "배송 불가"],
  ]],
  ["충북", [
    ["청주 / 더힐 · 메리다웨딩 등", 0, 0, 1, "쌀화환 (메리다: 예식 시 3단 가능)"],
    ["보은", 0, 0, 0, "근조 · 축하 배송 가능 (규격 축소)"],
  ]],
  ["전남", [
    ["해남 · 진도", 0, 0, 0, "—"],
    ["고흥", 0, 0, 0, "—"],
    ["여수", 1, 0, 0, "근조 오브제 / 축하 3단 가능"],
    ["완도", 0, 0, 1, "근조 쌀화환 반입가능"],
    ["신안군", 0, 0, 0, "배송 불가"],
  ]],
  ["전북", [
    ["전주 · 장수 · 임실", 1, 0, 0, "오브제 반입가능"],
    ["정읍 · 남원", 1, 0, 0, "오브제 반입가능"],
    ["군산 / 근장장례식장 등", 1, 0, 1, "기본 3단 / 오브제 · 쌀화환 반입가능"],
    ["부안", 1, 0, 0, "오브제 반입가능"],
  ]],
  ["경남", [
    ["창원 · 마산 / 상복고 · 마산의료원 · 동마산병원", 0, 1, 0, "근조바구니 반입가능"],
    ["창원 · 진해 / 리베라컨벤션 · 웨딩의전당 · 더연리지컨벤션", 0, 0, 1, "축하 쌀화환 반입가능"],
    ["마산 / 힐스카이웨딩 · 스카이뷰 등 웨딩홀", 0, 0, 1, "축하 쌀화환 반입가능"],
    ["김해 / 웨딩홀 (3단)", 1, 0, 0, "오브제 (꽃바구니 거치형) 반입가능"],
    ["양산 / 양산장례 · 시민장례 · 신세계병원(덕계)", 1, 0, 0, "오브제 반입가능"],
    ["밀양 / 밀양농협", 0, 1, 1, "3단 · 바구니 · 쌀화환 가능 / 그 외 장례식장 쌀화환 반입가능"],
    ["사천 / 공설장례식장", 0, 1, 0, "근조바구니 반입가능"],
    ["산청", 0, 0, 1, "쌀화환 반입가능"],
    ["함안 / 하늘공원", 0, 1, 0, "근조바구니 반입가능"],
    ["거창", 1, 0, 0, "오브제 반입가능"],
    ["거제 / 거붕백병원", 1, 0, 0, "오브제 반입가능"],
    ["창녕 / 공설장례식장", 0, 1, 0, "근조바구니 반입가능"],
    ["고령", 0, 1, 0, "근조바구니 반입가능"],
    ["청도", 0, 0, 1, "근조 쌀화환 반입가능"],
  ]],
];

function intakeGuideMarkup() {
  const yn = (v) => (v ? html`<span class="ig-yes" title="반입가능">✓</span>` : html`<span class="ig-no" aria-hidden="true">·</span>`);
  return html`
    <section class="intake-guide">
      <div class="ig-scroll">
        <table class="ig-table">
          <colgroup><col class="c-sido" /><col class="c-place" /><col class="c-p" /><col class="c-p" /><col class="c-p" /><col class="c-note" /></colgroup>
          <thead>
            <tr><th>시 · 도</th><th>지역 · 장소</th><th>오브제</th><th>근조바구니</th><th>쌀화환</th><th>상세 안내</th></tr>
          </thead>
          <tbody>
            ${INTAKE_GUIDE.flatMap(([sido, rows]) =>
              rows.map((row, i) => html`
                <tr class="${i === 0 ? "ig-grp" : ""}">
                  ${i === 0 ? html`<td class="ig-sido" rowspan="${rows.length}">${sido}</td>` : ""}
                  <td class="ig-place">${row[0]}</td>
                  <td class="ig-c">${yn(row[1])}</td>
                  <td class="ig-c">${yn(row[2])}</td>
                  <td class="ig-c">${yn(row[3])}</td>
                  <td class="ig-note">${row[4]}</td>
                </tr>
              `)
            )}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

export function mount(root, { nav }) {
  let activeModal = null;
  const closeModal = () => { if (activeModal) { activeModal.close(); activeModal = null; } };

  const columns = [
    { label: "상세상품", width: "170px", render: (r) => r.product },
    { label: "상품금액", width: "120px", align: "right", render: (r) => html`<span class="prod-price">${r.price}</span>` },
    { label: "상품설명 및 비고(규격)", width: "1fr", render: (r) => r.description },
    {
      label: "샘플사진", width: "96px", align: "center",
      render: (r) => html`<button class="prod-sample-btn" data-action="sample" data-key="${productKey(r)}">${icon("camera", { size: 13 })}<span>보기</span></button>`,
    },
  ];

  function render() {
    setHTML(
      root,
      html`
        <div class="page-products">
          ${pageTitle({ imgSrc: "./assets/nav-product.png", title: "상품 규격 안내" })}
          <div class="prod-inner">
            <div class="prod-table">
              ${tableGrid({ columns, rows: ALL_PRODUCTS, rowKey: (r) => productKey(r), compact: true })}
            </div>
            ${intakeGuideMarkup()}
          </div>
        </div>
      `
    );
  }

  function openSample(product) {
    closeModal();
    const imgs = sampleUrls(product.product);
    const multi = imgs.length > 1;
    let idx = 0;
    let timer = null;
    /* 세로형(2:3) 샘플 사진 캐러셀을 좌측 고정 배치, 상품 정보는 우측.
       2장 이상이면 하단 ‹›·매수 표기 + 5초 주기 자동 슬라이드(우→좌). */
    const body = html`
      <div class="msplit">
        <div class="msplit__media pcar ${multi ? "pcar--multi" : ""}">
          <div class="pcar__track" data-action="zoom" role="button" tabindex="0" aria-label="샘플 사진 크게 보기">
            ${imgs.map((u, i) => html`<div class="pcar__slide"><img src="${u}" alt="${product.product} 샘플 사진 ${i + 1}" /></div>`)}
          </div>
          <span class="msplit__zoomhint">${icon("search", { size: 12 })}크게 보기</span>
          ${multi
            ? html`<div class="pcar__ctrl">
                <button class="pcar__nav" data-action="prev" aria-label="이전 사진">‹</button>
                <span class="pcar__count"><b data-pcar-cur>1</b> / ${imgs.length}</span>
                <button class="pcar__nav" data-action="next" aria-label="다음 사진">›</button>
              </div>`
            : ""}
        </div>
        <div class="msplit__body">
          <div class="hm__head">
            <div><p class="hm-eyebrow">${product.category}</p><h3>${product.product}</h3></div>
            <button class="hm__x" data-action="close" aria-label="닫기">${icon("x", { size: 14 })}</button>
          </div>
          <div class="msplit__scroll">
            <div class="hm-dl">
              <div class="row"><span class="k">상품금액</span><span class="v amt num">${product.price}</span></div>
              <div class="row"><span class="k">상품설명</span><span class="v">${product.description}</span></div>
            </div>
            <p class="hm-help" style="margin-top:14px;">※ 상품 품질 표준화를 위해 실제 배송되었던 이미지를 참고 이미지로 첨부합니다.</p>
          </div>
          <div class="hm__foot"><button class="hm-btn hm-btn--primary" data-action="close">닫기</button></div>
        </div>
      </div>
    `;
    activeModal = openModal({ panelClass: "modal-panel--split", body, onClose: () => { if (timer) clearInterval(timer); } });
    const track = qs(activeModal.panel, ".pcar__track");
    const curEl = qs(activeModal.panel, "[data-pcar-cur]");
    const show = (i) => {
      idx = (i + imgs.length) % imgs.length;
      if (track) track.style.transform = `translateX(-${idx * 100}%)`;
      if (curEl) curEl.textContent = String(idx + 1);
    };
    const autoplay = () => { if (timer) clearInterval(timer); if (multi) timer = setInterval(() => show(idx + 1), 5000); };
    autoplay();
    on(activeModal.panel, "click", "[data-action='close']", () => closeModal());
    on(activeModal.panel, "click", "[data-action='zoom']", () =>
      openLightbox({ src: imgs[idx], alt: `${product.product} 샘플 사진`, caption: `${product.product} — ${product.price}` })
    );
    if (multi) {
      on(activeModal.panel, "click", "[data-action='prev']", () => { show(idx - 1); autoplay(); });
      on(activeModal.panel, "click", "[data-action='next']", () => { show(idx + 1); autoplay(); });
    }
  }

  render();

  const offClick = on(root, "click", "[data-action]", (e, t) => {
    if (t.dataset.action === "sample") {
      const p = ALL_PRODUCTS.find((x) => productKey(x) === t.dataset.key);
      if (p) openSample(p);
    }
  });

  return () => {
    offClick();
    closeModal();
  };
}
