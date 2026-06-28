/* ============================================================
   products.js — ports ProductGuide.tsx (상품 규격 안내)
   상품 상시 노출 + 샘플 사진 모달. (즐겨찾기/저장·카테고리 필터 없음)
   ============================================================ */
import { html, setHTML, on } from "../dom.js";
import { icon } from "../icons.js";
import { store, ALL_PRODUCTS, productKey, won } from "../store.js";
import { getClientId } from "../session.js";
import { pageTitle, tableGrid, openModal } from "../ui.js";

const SAMPLE_IMG = {
  funeral: "https://images.unsplash.com/photo-1728080568516-28156ceae0ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmdW5lcmFsJTIwZmxvd2VyJTIwS29yZWElMjBjZXJlbW9ueXxlbnwxfHx8fDE3NzU2Mzk0ODd8MA&ixlib=rb-4.1.0&q=80&w=1080",
  orchid: "https://images.unsplash.com/photo-1577378978713-9bebf3db8312?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMHBoYWxhZW5vcHNpcyUyMG9yY2hpZCUyMGVsZWdhbnR8ZW58MXx8fHwxNzc1NjM5NDg3fDA&ixlib=rb-4.1.0&q=80&w=1080",
  bouquet: "https://images.unsplash.com/photo-1641430262389-93bbbd2dd754?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMGZsb3dlciUyMGJvdXF1ZXQlMjBjb2xvcmZ1bCUyMGJsb29tfGVufDF8fHx8MTc3NTYzOTQ4N3ww&ixlib=rb-4.1.0&q=80&w=1080",
};
const sampleImages = {
  축하화환: SAMPLE_IMG.bouquet,
  근조화환: SAMPLE_IMG.funeral,
  특수화환: SAMPLE_IMG.orchid,
  근조바구니: SAMPLE_IMG.funeral,
  쌀화환: SAMPLE_IMG.funeral,
};

export function mount(root, { nav }) {
  let activeModal = null;
  const closeModal = () => { if (activeModal) { activeModal.close(); activeModal = null; } };

  // Per-client price override (set in admin '기업별 상품단가 설정'). Falls back
  // to the catalog default when this company has no custom price for the item.
  const clientId = getClientId();
  const priceFor = (p) => {
    const ov = store.get().clientPrices[clientId]?.[productKey(p)];
    return typeof ov === "number" && ov > 0 ? won(ov) : p.price;
  };

  const columns = [
    { label: "구분", width: "90px", render: (r) => r.category },
    { label: "상세상품", width: "170px", render: (r) => r.product },
    { label: "상품금액", width: "120px", align: "right", render: (r) => html`<span class="prod-price">${priceFor(r)}</span>` },
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
    const body = html`
      <div class="psample">
        <div class="psample__head">
          <div><p class="psample__cat">${product.category}</p><h3>${product.product}</h3></div>
          <button class="modal-close" data-action="close" aria-label="닫기">${icon("x", { size: 18 })}</button>
        </div>
        <div class="psample__imgwrap"><img src="${imgUrl}" alt="${product.product}" /></div>
        <div class="psample__body">
          <div class="psample__price-row"><span>상품금액</span><span class="psample__price">${priceFor(product)}</span></div>
          <p class="psample__desc">${product.description}</p>
          <div class="psample__note"><p>※ 실제 상품은 사진과 다를 수 있으며, 계절 및 산지 사정에 따라 품종이 변경될 수 있습니다.</p></div>
        </div>
        <div class="psample__foot"><button class="psample__close-btn" data-action="close">닫기</button></div>
      </div>
    `;
    activeModal = openModal({ panelClass: "modal-panel--sample", body, onClose: () => {} });
    on(activeModal.panel, "click", "[data-action='close']", () => closeModal());
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
