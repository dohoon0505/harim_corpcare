/* ============================================================
   login.js — ports Login.tsx (no real auth; validates → #/app)
   ============================================================ */
import { html, setHTML, on, qs } from "../dom.js";
import { icon } from "../icons.js";
import { resolveRole, setRole, setClientId, clearClientId } from "../session.js";
import { store } from "../store.js";

// 당일배송 마감 시각(오후 2시) · 접수 시작(오전 8시) — 진행바 기준 구간.
// 운영 정책에 맞춰 두 값만 바꾸면 됩니다.
const DEADLINE_HOUR = 14;
const WINDOW_OPEN_HOUR = 8;

/** 지금 시각 기준 당일배송 마감까지 남은 시간 + 진행바 비율(잔여시간 비중). */
function deadlineState() {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setHours(DEADLINE_HOUR, 0, 0, 0);
  const remainMs = cutoff - now;
  if (remainMs <= 0) return { text: "오늘 마감", pct: 0 };
  const open = new Date(now);
  open.setHours(WINDOW_OPEN_HOUR, 0, 0, 0);
  const pct = Math.max(0, Math.min(100, (remainMs / (cutoff - open)) * 100));
  const h = Math.floor(remainMs / 3600000);
  const m = Math.floor((remainMs % 3600000) / 60000);
  return { text: h > 0 ? `${h}시간 ${m}분` : `${m}분`, pct };
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
            <div class="auth__deadline">
              <div class="auth__deadline-row">
                <span class="auth__deadline-label">당일배송 마감</span>
                <span class="auth__deadline-time" data-slot="deadline-time"></span>
              </div>
              <div class="auth__deadline-track">
                <div class="auth__deadline-fill" data-slot="deadline-fill"></div>
              </div>
            </div>
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

  // ── 당일배송 마감 카운트다운 (1분 주기 갱신) ───────────────
  function renderDeadline() {
    const st = deadlineState();
    const t = qs(root, "[data-slot='deadline-time']");
    const f = qs(root, "[data-slot='deadline-fill']");
    if (t) t.textContent = st.text;
    if (f) f.style.width = st.pct + "%";
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
