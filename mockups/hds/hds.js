/* ============================================================
   HDS 시안 공용 스크립트 — 셸 렌더 · 모달 · 토스트
   (file:// 더블클릭 지원을 위해 전역 스크립트로 제공: window.HDS)
   ============================================================ */
(function () {
  const NAV = [
    { sec: "사용자 메뉴" },
    { id: "order",   icon: "🌸", label: "경조화환 주문",   href: "01-order.html" },
    { id: "orders",  icon: "📋", label: "실시간 주문내역", href: "02-orders.html" },
    { sec: "정산관련메뉴" },
    { id: "invoice", icon: "📄", label: "거래명세서 조회", href: "03-invoice.html" },
    { id: "settle",  icon: "💰", label: "정산회계 조회",   href: "04-settlement.html" },
    { sec: "회사관련메뉴" },
    { id: "profile", icon: "👤", label: "프로필 저장공간", href: "05-profile.html" },
    { id: "products",icon: "📦", label: "상품 규격 안내",  href: "06-products.html" },
  ];

  function shell(activeId) {
    const sb = document.querySelector(".sb");
    sb.innerHTML = `
      <div class="sb-brand">
        <div class="sb-logo">❀</div>
        <div><b>올해의경조사</b><span>하림그룹 경조화환 시스템</span></div>
      </div>
      ${NAV.map((n) => n.sec
        ? `<div class="sb-sec">${n.sec}</div>`
        : `<a class="sb-item ${n.id === activeId ? "active" : ""}" href="${n.href}"><span class="ic">${n.icon}</span>${n.label}</a>`
      ).join("")}
      <div class="sb-spacer"></div>
      <div class="sb-out">⎋ 서비스 로그아웃</div>`;
    const hd = document.querySelector(".hd");
    hd.innerHTML = `<b>하림그룹 경조화환 시스템</b><span class="co">🏢 (계열사)하림지주</span>
      <span style="margin-left:auto; font-size:11.5px; color:var(--t-faint);">HDS 리스킨 시안 · 실제 코드 아님</span>`;
  }

  /* 모달: [data-open="id"] 로 열기 · 딤/[data-close]/ESC 로 닫기 */
  function initModals() {
    document.addEventListener("click", (e) => {
      const opener = e.target.closest("[data-open]");
      if (opener) { const m = document.getElementById(opener.dataset.open); if (m) m.classList.add("show"); return; }
      if (e.target.classList && e.target.classList.contains("overlay")) { e.target.classList.remove("show"); return; }
      const closer = e.target.closest("[data-close]");
      if (closer) { const o = closer.closest(".overlay"); if (o) o.classList.remove("show"); }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape")
        document.querySelectorAll(".overlay.show").forEach((o) => o.classList.remove("show"));
    });
  }

  let toastTimer = null;
  function toast(msg) {
    let t = document.querySelector(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2000);
  }

  window.HDS = { shell, initModals, toast };
})();
