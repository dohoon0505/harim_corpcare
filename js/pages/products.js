/* ============================================================
   products.js — ports ProductGuide.tsx (상품 규격 안내)
   상품 상시 노출 + 샘플 사진 모달. (즐겨찾기/저장·카테고리 필터 없음)
   ============================================================ */
import { html, setHTML, on } from "../dom.js";
import { icon } from "../icons.js";
import { ALL_PRODUCTS, productKey } from "../store.js";
import { pageTitle, tableGrid, openModal, openLightbox } from "../ui.js";

/* 상품 샘플 사진은 2:3 세로형 규격으로 관리한다. */
const SAMPLE_IMG = {
  funeral: "https://images.unsplash.com/photo-1728080568516-28156ceae0ea?auto=format&fit=crop&w=720&h=1080&q=80",
  orchid: "https://images.unsplash.com/photo-1577378978713-9bebf3db8312?auto=format&fit=crop&w=720&h=1080&q=80",
  bouquet: "https://images.unsplash.com/photo-1641430262389-93bbbd2dd754?auto=format&fit=crop&w=720&h=1080&q=80",
};
const sampleImages = {
  축하화환: SAMPLE_IMG.bouquet,
  근조화환: SAMPLE_IMG.funeral,
  특수화환: SAMPLE_IMG.orchid,
  근조바구니: SAMPLE_IMG.funeral,
  꽃바구니: SAMPLE_IMG.bouquet,
};

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
          </div>
        </div>
      `
    );
  }

  function openSample(product) {
    closeModal();
    const imgUrl = sampleImages[product.category];
    /* 세로형(2:3) 샘플 사진을 좌측 고정 배치, 상품 정보는 우측 —
       사진을 자르지 않고 보여주면서 모달 세로 길이를 사진 높이로 고정한다. */
    const body = html`
      <div class="msplit">
        <button class="msplit__media msplit__media--btn" data-action="zoom" aria-label="샘플 사진 크게 보기">
          <img src="${imgUrl}" alt="${product.product} 샘플 사진" />
          <span class="msplit__zoomhint">${icon("search", { size: 12 })}크게 보기</span>
        </button>
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
            <p class="hm-help" style="margin-top:14px;">※ 실제 상품은 사진과 다를 수 있으며, 계절·산지 사정에 따라 품종이 변경될 수 있습니다.</p>
          </div>
          <div class="hm__foot"><button class="hm-btn hm-btn--primary" data-action="close">닫기</button></div>
        </div>
      </div>
    `;
    activeModal = openModal({ panelClass: "modal-panel--split", body, onClose: () => {} });
    on(activeModal.panel, "click", "[data-action='close']", () => closeModal());
    on(activeModal.panel, "click", "[data-action='zoom']", () =>
      openLightbox({ src: imgUrl, alt: `${product.product} 샘플 사진`, caption: `${product.product} — ${product.price}` })
    );
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
