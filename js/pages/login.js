/* ============================================================
   login.js — ports Login.tsx (no real auth; validates → #/app)
   ============================================================ */
import { html, setHTML, on, qs } from "../dom.js";
import { icon } from "../icons.js";
import { resolveRole, setRole, setClientId, clearClientId } from "../session.js";
import { store } from "../store.js";

// 당일배송 마감 18:30 · 카운트다운 시작 09:00 (분 단위). 정책 변경 시 여기만 수정.
const DEADLINE_MIN = 18 * 60 + 30; // 18:30
const OPEN_MIN = 9 * 60;           // 09:00

/**
 * 지금 시각에 따른 당일배송 안내 상태.
 *  00:00~09:00 → 당일 12~13시 배송 안내 (진행바 가득)
 *  09:00~18:30 → 마감까지 카운트다운 (진행바 = 잔여시간 비중)
 *  18:30~24:00 → 익일 12~13시 배송 안내 (진행바 빔)
 */
function deadlineState() {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  if (nowMin >= DEADLINE_MIN)
    return { mode: "info", text: "현재 주문 시 익일 12시~13시 사이 배송됩니다.", pct: 0 };
  if (nowMin < OPEN_MIN)
    return { mode: "info", text: "현재 주문 시 12시~13시 사이 배송됩니다.", pct: 100 };
  const remainMin = DEADLINE_MIN - nowMin;
  const h = Math.floor(remainMin / 60);
  const m = remainMin % 60;
  const pct = Math.round((remainMin / (DEADLINE_MIN - OPEN_MIN)) * 100);
  return { mode: "countdown", text: h > 0 ? `${h}시간 ${m}분` : `${m}분`, pct };
}

export function mount(root, { nav }) {
  let showPassword = false;

  setHTML(
    root,
    html`
      <div class="auth">
        <!-- 좌측 다크 브랜드 패널 -->
        <aside class="auth__brand">
          <div class="auth__brand-logo">
            <span class="auth__brand-logo-text">하림그룹 경조화환 시스템</span>
          </div>
          <div class="auth__brand-body">
            <p class="auth__eyebrow">Enterprise Service</p>
            <h2 class="auth__headline">
              하림그룹에서 발생하는<br />모든 경조사 화환,<br />한 곳에서 관리되도록
            </h2>
            <p class="auth__subcopy">
              하림그룹 임직원을 위한 경조화환 간편처리 시스템입니다
            </p>
            <div class="auth__deadline" data-slot="deadline"></div>
          </div>
          <div class="auth__brand-foot">
            <p class="auth__brand-foot-q">계열사 담당자이신가요?</p>
            <button type="button" class="auth__brand-foot-link" data-action="register">
              계열사 담당자 가입 ${icon("arrow-right", { size: 11 })}
            </button>
          </div>
        </aside>

        <!-- 우측 폼 패널 -->
        <div class="auth__panel">
          <div class="auth__panel-inner">
            <div class="auth__topbar">
              <span class="auth__topbar-logo-text">하림그룹 경조화환 시스템</span>
              <button type="button" class="auth__topbar-link" data-action="register">
                회원가입 ${icon("arrow-right", { size: 11 })}
              </button>
            </div>

            <div class="auth__form-wrap">
              <div class="auth__form-col">
                <div class="auth__title">
                  <h1>로그인</h1>
                  <p>아이디와 비밀번호를 입력해주세요</p>
                </div>

                <form class="login-card" data-form="login" novalidate>
                  <div class="login-card__head">
                    <h3>계정 로그인</h3>
                    <p>하림그룹 계열사 계정으로 로그인하세요</p>
                  </div>
                  <div class="login-card__body">
                    <div data-slot="error"></div>

                    <div class="auth-field">
                      <label class="auth-field__label" for="login-id">아이디 / 사업자번호</label>
                      <input
                        class="auth-field__input"
                        id="login-id"
                        name="id"
                        type="text"
                        placeholder="아이디 또는 사업자번호를 입력해주세요"
                        autocomplete="username"
                      />
                    </div>

                    <div class="auth-field">
                      <label class="auth-field__label" for="login-pw">비밀번호</label>
                      <div class="auth-field__pw">
                        <input
                          class="auth-field__input"
                          id="login-pw"
                          name="password"
                          type="password"
                          placeholder="비밀번호를 입력해주세요"
                          autocomplete="current-password"
                        />
                        <button
                          type="button"
                          class="auth-field__eye"
                          data-action="toggle-pw"
                          aria-label="비밀번호 표시"
                          aria-pressed="false"
                        >
                          ${icon("eye", { size: 16 })}
                        </button>
                      </div>
                    </div>

                    <button type="submit" class="auth__submit">로그인</button>
                  </div>
                </form>

                <div class="auth__divider-block">
                  <div class="auth__divider">
                    <span class="auth__divider-line"></span>
                    <span class="auth__divider-text">또는</span>
                    <span class="auth__divider-line"></span>
                  </div>
                  <button type="button" class="auth__alt-btn" data-action="register">
                    계열사 담당자 가입
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  );

  const form = qs(root, "[data-form='login']");
  const errorSlot = qs(root, "[data-slot='error']");
  const pwInput = qs(root, "#login-pw");
  const eyeBtn = qs(root, "[data-action='toggle-pw']");

  // ── 당일배송 안내 (1분 주기 갱신) ─────────────────────────
  function renderDeadline() {
    const slot = qs(root, "[data-slot='deadline']");
    if (!slot) return;
    const st = deadlineState();
    const head =
      st.mode === "countdown"
        ? html`<div class="auth__deadline-row">
            <span class="auth__deadline-label">당일배송 마감</span>
            <span class="auth__deadline-time">${st.text}</span>
          </div>`
        : html`<p class="auth__deadline-info">${st.text}</p>`;
    setHTML(
      slot,
      html`${head}
        <div class="auth__deadline-track">
          <div class="auth__deadline-fill" style="width:${st.pct}%"></div>
        </div>`
    );
  }
  renderDeadline();
  const deadlineTimer = setInterval(renderDeadline, 60000);

  function clearError() {
    errorSlot.innerHTML = "";
  }
  function showError(msg) {
    setHTML(
      errorSlot,
      html`
        <div class="login-error" role="alert" aria-live="assertive">
          ${icon("alert-circle", { size: 14 })}
          <p>${msg}</p>
        </div>
      `
    );
  }

  const offSubmit = on(form, "submit", (e) => {
    e.preventDefault();
    const id = form.elements.id.value.trim();
    const pw = form.elements.password.value.trim();
    if (!id || !pw) {
      showError("아이디와 비밀번호를 모두 입력해주세요.");
      return;
    }
    clearError();
    const role = resolveRole(id, pw); // "admin" | "enterprise" (DEMO gate)
    setRole(role);
    // Map an enterprise login to its 거래처 when the credentials match a
    // client account → drives per-client pricing in 상품 규격 안내.
    if (role === "enterprise") {
      const c = store.get().clients.find((x) => x.accountId === id && x.password === pw);
      setClientId(c ? c.id : null);
    } else {
      clearClientId();
    }
    nav(role === "admin" ? "#/admin" : "#/app");
  });

  const offInput = on(form, "input", "input", () => clearError());

  const offEye = on(eyeBtn, "click", () => {
    showPassword = !showPassword;
    pwInput.type = showPassword ? "text" : "password";
    eyeBtn.setAttribute("aria-pressed", String(showPassword));
    eyeBtn.setAttribute("aria-label", showPassword ? "비밀번호 숨김" : "비밀번호 표시");
    setHTML(eyeBtn, icon(showPassword ? "eye-off" : "eye", { size: 16 }));
  });

  const offNav = on(root, "click", "[data-action='register']", () =>
    nav("#/register")
  );

  return () => {
    clearInterval(deadlineTimer);
    offSubmit();
    offInput();
    offEye();
    offNav();
  };
}
