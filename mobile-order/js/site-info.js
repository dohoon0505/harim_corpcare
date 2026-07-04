/* eslint-disable */
// SITE_INFO → 런타임 OG meta + document.title 주입.
// publishToGitHub 가 data.jsx 끝에 window.SITE_INFO 를 set 한 뒤 본 스크립트가 적용한다.
// admin/page-settings.jsx 의 입력이 사이트 전체 메타에 반영됨.
(function () {
  if (typeof window === "undefined") return;
  var si = window.SITE_INFO || {};
  function setMeta(key, value, attr) {
    if (!value) return;
    var sel = 'meta[' + attr + '="' + key + '"]';
    var el = document.querySelector(sel);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute("content", value);
  }
  if (si.ogTitle) {
    document.title = si.ogTitle;
    setMeta("og:title", si.ogTitle, "property");
    setMeta("twitter:title", si.ogTitle, "name");
  }
  if (si.ogDescription) {
    setMeta("description", si.ogDescription, "name");
    setMeta("og:description", si.ogDescription, "property");
    setMeta("twitter:description", si.ogDescription, "name");
  }
  if (si.ogImage) {
    setMeta("og:image", si.ogImage, "property");
    setMeta("twitter:image", si.ogImage, "name");
  }
  // window.SITE_INFO.phone / .kakaoChannel 은 app.jsx 가 PHONE_HREF/KAKAO_HREF 빌드 시 참조.
})();
