# PLAN — `harim_mob` → `harim_corpcare` 병합 가이드

> **목표**: 별도 레포 `harim_mob`(모바일 간편주문·AI 간편접수)을 `harim_corpcare`의
> **`/mobile-order/` 하위 경로**로 흡수하고, 로그인 화면의 **"모바일 간편주문"** 버튼이
> 그 경로로 이동하도록 연결한다. 결과적으로 사이트·도메인·배포를 **하나(`harim-corpcare.com`)로 통합**한다.
>
> 이 문서는 **실행 가이드(문서)** 이며, 실제 파일 이동/코드 수정은 포함하지 않는다.
> 아래 순서대로 진행하면 된다.

---

## 0. 결정 사항 (이 가이드의 전제)

| 항목 | 결정 | 비고 |
|---|---|---|
| 통합 경로 | **`/mobile-order/`** | 내부 데스크톱 라우트 `#/app`(경조상품 간편주문)과 구분됨 |
| 대표 도메인 | **`harim-corpcare.com`** 유지 | corpcare의 기존 CNAME |
| `corpcare.kr` | **은퇴** | mob 전용 도메인 폐기, DNS 정리 |
| git 히스토리 | **단순 복사** | subtree 미사용, 새 커밋 1개로 병합 |
| 배포 | 기존 **GitHub Actions → Pages** 그대로 | `deploy-pages.yml`에 경로만 추가 |

---

## 1. 사전 이해 — 두 레포의 구조 차이

병합 전, **두 앱의 방식이 다르다**는 점을 반드시 인지한다. 서브디렉토리로 격리하면
이 차이를 그대로 둔 채 공존시킬 수 있으므로 **코드 변환은 필요 없다**.

| | `harim_corpcare` (대상) | `harim_mob` (소스) |
|---|---|---|
| 성격 | 데스크톱 B2B 관리 SPA | 모바일 간편주문 + AI 간편접수 |
| JS 방식 | **ES 모듈** (`<script type="module">`) | **전역 스크립트** (`window.HARIM_AI_CONFIG` 등) |
| 진입 DOM | `#app`, 해시 라우터(`#/login`, `#/app` …) | `#root`, `js/app.js` 단일 렌더 |
| 폰트 | Pretendard **CDN** | 로컬 **woff** 번들(`fonts/`, ~9.7MB) |
| 백엔드 | 없음(순수 정적) | **`server.js`** = 정적 서빙 + OpenAI 프록시(`/api/ai`) |
| 비밀키 | 없음 | **`keystore.json`** (OpenAI 키) ⚠️ |
| 도메인 | `harim-corpcare.com` | `corpcare.kr` |

> **왜 서브디렉토리인가**: 두 레포 모두 최상위에 `index.html`·`css/`·`js/`가 있어
> 루트 병합 시 **파일명이 충돌**한다. `/mobile-order/`에 통째로 넣으면 충돌이 없고,
> mob의 상대경로(`./js/…`, `./css/…`, `./img/…`)가 그대로 유효하다.

### ⚠️ 병합 전 필독 — 보안 경고

`harim_mob`의 `keystore.json`에는 **실제 OpenAI API 키가 커밋되어 있다**
(mob `.gitignore` 주석 참조 — "사용자 요청으로 커밋함"). 이 파일과 `server.js`·`node_modules`는
**절대 공개 배포 산출물에 포함하면 안 된다.** 아래 3단계에서 복사 대상에서 제외한다.
가능하면 병합을 계기로 **해당 키를 폐기·재발급**할 것을 권장한다.

---

## 2. 병합 후 최종 구조 (목표 형태)

```
harim_corpcare/
├─ index.html                 # (변경 없음) 데스크톱 SPA 진입점
├─ CNAME                      # harim-corpcare.com  ← 유지
├─ .nojekyll                  # (변경 없음) 사이트 전체에 적용
├─ assets/  css/  js/  invoice/   # (변경 없음) 기존 corpcare
│
├─ mobile-order/              # ★ 신규 — harim_mob 이식본
│  ├─ index.html              #   (mob의 index.html 그대로)
│  ├─ css/                    #   app.css, colors_and_type.css
│  ├─ js/                     #   app.js, ai.js, config.js, data.js …
│  ├─ fonts/                  #   Pretendard woff (선택: CDN 전환 가능 — 6절)
│  └─ img/                    #   배너·상품 이미지
│
└─ PLAN_harim_mob_병합.md      # (이 문서)
```

**제외(이식하지 않음)**: `server.js`, `package.json`, `package-lock.json`,
`node_modules/`, `keystore.json`, `CNAME`(mob의 corpcare.kr), `.git*`, `.claude/`,
`.playwright-mcp/`, `screenshots/`, `backend-handoff.docx`.

---

## 3. 단계별 절차

아래 명령은 로컬 작업 트리에서 실행한다. `$MOB`, `$CORP`는 각 레포 경로로 바꾼다.
(예: `MOB=../harim_mob`, `CORP=.` — corpcare 루트에서 실행 가정)

### Step 1 — 작업 브랜치 생성

```bash
cd $CORP
git checkout main && git pull
git checkout -b feat/merge-mobile-order
```

### Step 2 — mob 파일을 `mobile-order/`로 복사 (제외 항목 배제)

`rsync`로 **런타임 파일만** 복사한다. (rsync가 없으면 `cp` 후 불필요 파일 삭제)

```bash
mkdir -p mobile-order
rsync -av \
  --exclude '.git' --exclude '.gitignore' --exclude '.gitattributes' \
  --exclude 'node_modules' --exclude '.claude' --exclude '.playwright-mcp' \
  --exclude 'screenshots' \
  --exclude 'server.js' --exclude 'package.json' --exclude 'package-lock.json' \
  --exclude 'keystore.json' \
  --exclude 'CNAME' \
  --exclude 'backend-handoff.docx' \
  "$MOB"/ mobile-order/
```

복사 후 확인 — **민감 파일이 없어야 한다**:

```bash
ls mobile-order
# 기대: index.html  css  js  fonts  img
find mobile-order -name 'keystore.json' -o -name 'server.js' -o -name 'node_modules'
# 기대: (출력 없음)
```

### Step 3 — 로그인 버튼 링크 연결 (핵심)

파일: **`js/pages/login.js`** (corpcare)

**(3-1)** 상단 상수를 상대경로로 교체:

```js
// AS-IS
// TODO: 모바일 간편주문 링크 (추후 연결 예정) — 임시 placeholder URL
const MOBILE_ORDER_URL = "https://example.com/mobile-order";

// TO-BE
// 병합된 모바일 간편주문 사이트(같은 오리진). /mobile-order/ = harim_mob 이식본.
const MOBILE_ORDER_URL = "/mobile-order/";
```

**(3-2)** 링크 태그(같은 파일 내 `.auth__mobile-order`): 이제 **동일 사이트(1st-party)**
이므로 새 탭 대신 **같은 탭 이동**을 권장. `target`/`rel` 제거:

```html
<!-- AS-IS -->
<a class="auth__mobile-order" href="${MOBILE_ORDER_URL}" target="_blank" rel="noopener">

<!-- TO-BE -->
<a class="auth__mobile-order" href="${MOBILE_ORDER_URL}">
```

> 새 탭 유지를 원하면 AS-IS 그대로 두어도 동작한다. 스타일(`css/pages/auth.css`의
> `.auth__mobile-order`, 모바일 전용 노출 규칙)은 **수정 불필요**.

### Step 4 — `.gitignore` 병합

corpcare `.gitignore`에 mob 전용 무시 항목을 추가한다 (이식본 하위 경로 기준):

```gitignore
# ── 모바일 간편주문(이식본) 개발 산출물 — 배포·커밋 제외 ──
mobile-order/node_modules/
mobile-order/keystore.json
mobile-order/.env
mobile-order/.env.*
```

> `node_modules/`는 corpcare 최상위 규칙으로 이미 무시되지만, 하위 경로 명시로 안전하게.

### Step 5 — 배포 워크플로에 경로 추가 (필수)

파일: **`.github/workflows/deploy-pages.yml`**
"Stage site (앱 파일만)" 스텝의 `cp -r …` 한 줄에 **`mobile-order`를 추가**한다.
이 줄에 없으면 **모바일 사이트가 배포되지 않는다.**

```yaml
# AS-IS
run: |
  mkdir -p _site
  cp -r index.html CNAME .nojekyll assets css js invoice _site/

# TO-BE
run: |
  mkdir -p _site
  cp -r index.html CNAME .nojekyll assets css js invoice mobile-order _site/
```

> 이 워크플로는 **명시한 파일만** 배포하므로, 설령 `mobile-order/`에 `keystore.json`이
> 남아 있어도 `_site`로 복사되지 않아 공개되지 않는다. 그래도 Step 2에서 원천 제외할 것.

### Step 6 — 도메인 정리 (`corpcare.kr` 은퇴)

1. **mob 레포의 CNAME은 이식하지 않음** — 이미 Step 2에서 제외. corpcare의
   `CNAME`(`harim-corpcare.com`)이 **유일한 커스텀 도메인**으로 남는다.
2. **DNS 정리**: 도메인 등록기관에서 `corpcare.kr`의 A/CNAME 레코드(구 mob Pages 대상)를
   **제거**한다. (즉시 삭제가 부담되면, 만료까지 방치해도 무방하나 접속 시 404)
3. **구 harim_mob 레포**: GitHub Pages 설정을 끄고 레포를 **Archive**(읽기전용) 처리.
   → 9절 후속 정리 참고.

> 선택: 기존 `corpcare.kr` 링크/QR을 살리려면 은퇴 대신 **리다이렉트**로 바꿀 수 있으나,
> 이번 결정은 **은퇴**이므로 생략한다.

### Step 7 — AI 간편접수(백엔드) 처리 — 중요

`harim_mob`의 AI 간편접수는 `js/config.js`의 `proxyEndpoint: "/api/ai"`를 통해
**`server.js` 프록시**로 OpenAI를 호출한다. **GitHub Pages는 정적 호스팅이라 `server.js`가
실행되지 않으므로**, 병합 후 `/mobile-order/`에서 `/api/ai`는 **404가 되어 AI 추출이 실패**한다.

동작 로직(요약, `js/ai.js`):
- `proxyEndpoint`가 있으면 → 그 주소로 POST (Pages에선 404).
- `proxyEndpoint`가 **빈 문자열**이면 → 브라우저가 `api.openai.com`을 **직접 호출**
  (사용자가 입력한 키를 `sessionStorage`에 임시 저장).

**두 가지 선택지 중 하나를 적용한다** (`mobile-order/js/config.js` 수정):

**옵션 A — 프록시를 외부에 별도 배포 (권장, 키 은닉 유지)**
`server.js`(또는 동등한 서버리스 함수)를 Vercel/Cloudflare Workers/Render 등에 올리고,
그 URL을 가리킨다. 키는 서버 환경변수(`OPENAI_API_KEY`)로만 보관.
```js
window.HARIM_AI_CONFIG = {
  apiKey: "",
  model: "gpt-4.1",
  proxyEndpoint: "https://<your-proxy-host>/api/ai", // ← 외부 프록시
  proxyHoldsKey: true,
};
```

**옵션 B — 정적만으로 임시 운용 (브라우저 직접호출)**
서버 없이 동작하지만, 사용 시 사용자가 키를 입력해야 하고 키가 브라우저에서 전송된다.
내부/임시용으로만 권장.
```js
window.HARIM_AI_CONFIG = {
  apiKey: "",
  model: "gpt-4.1",
  proxyEndpoint: "",       // ← 비우면 api.openai.com 직접 호출로 폴백
  proxyHoldsKey: false,
};
```

> 어느 옵션이든 **`keystore.json`은 배포하지 않는다.** 프록시를 쓸 경우 키는 서버 측에만 둔다.
> AI 기능을 당장 쓰지 않는다면 옵션 B로 두고 추후 A로 전환해도 프런트 수정은 `config.js` 한 줄뿐이다.

### Step 8 — 커밋 & 배포

```bash
git add mobile-order js/pages/login.js .gitignore .github/workflows/deploy-pages.yml PLAN_harim_mob_병합.md
git commit -m "feat: harim_mob을 /mobile-order로 병합, 로그인 버튼 연결"
git push -u origin feat/merge-mobile-order
# PR 생성 → main 병합 → Actions가 자동 배포
```

---

## 4. 검증 체크리스트

배포 후 `https://harim-corpcare.com` 기준으로 확인한다.

- [ ] **버튼 이동**: 로그인 화면(모바일 뷰)에서 "모바일 간편주문" 클릭 → `/mobile-order/`로 이동
- [ ] **모바일 앱 로드**: `/mobile-order/`에서 화면 정상 렌더(콘솔 404/에러 없음)
- [ ] **정적 자원**: `mobile-order/`의 css·js·img·fonts가 모두 200 응답
- [ ] **데스크톱 무영향**: 기존 `#/login`·`#/app` 등 corpcare 라우트 정상
- [ ] **보안**: `https://harim-corpcare.com/mobile-order/keystore.json` → **404** (노출 안 됨)
- [ ] **보안**: `…/mobile-order/server.js`, `…/node_modules/` → **404**
- [ ] **AI**: 선택한 옵션(A/B)에 맞게 간편접수 동작 or 명시적 키 입력 안내
- [ ] **도메인**: `corpcare.kr` 접속 시 더 이상 유효하지 않음(은퇴 확인)

로컬 사전 검증:
```bash
cd $CORP && node serve.mjs   # http://localhost:8000
# → /mobile-order/ 직접 접속 + 로그인 버튼 클릭 흐름 확인
```

---

## 5. 롤백

문제 발생 시 병합 커밋만 되돌리면 된다.

```bash
git revert <merge-commit>        # 또는 PR Revert
# 구 harim_mob 레포/corpcare.kr을 아직 폐기 전이라면 즉시 원복 가능
```

> 안전을 위해 **DNS 은퇴(Step 6-2)와 mob 레포 Archive(9절)는 병합 배포가 안정화된 뒤** 진행할 것.

---

## 6. 선택 최적화 (병합 후, 급하지 않음)

- **폰트 중복 제거(~9.7MB)**: `mobile-order/`도 corpcare처럼 Pretendard **CDN**을 쓰면
  로컬 `fonts/` 삭제 가능. `mobile-order/index.html`에 CDN `<link>` 추가 후
  `mobile-order/css/colors_and_type.css`의 `@font-face`를 제거/치환.
- **이미지 중복**: `intake_obituary.jpg`·`intake_wedding.jpg` 등은 corpcare `assets/`에도
  존재. 공용화하려면 한쪽을 참조하도록 경로 통일(선택).
- **AI 프록시 정식화**: 옵션 B로 시작했다면, 안정화 후 옵션 A(서버리스 프록시)로 전환.

---

## 7. 후속 정리 — 구 `harim_mob` 레포

병합 배포가 검증되면:

1. `harim_mob` 레포의 **Settings → Pages** 배포 중단.
2. `corpcare.kr` **DNS 레코드 제거**(Step 6-2).
3. 레포 **Archive**(읽기전용) 또는 README에 "→ harim_corpcare/mobile-order 로 이관" 명시.
4. `keystore.json`에 있던 **OpenAI 키 폐기·재발급**(공개 이력이 있으므로 강력 권장).

---

## 부록 A. 파일 매핑 요약

| harim_mob | 병합 위치 | 처리 |
|---|---|---|
| `index.html` | `mobile-order/index.html` | 복사(무변경) |
| `css/`, `js/`, `img/`, `fonts/` | `mobile-order/…` | 복사(무변경) |
| `js/config.js` | `mobile-order/js/config.js` | 복사 후 **Step 7** 편집 |
| `server.js` | — | **제외**(Pages 미실행) |
| `keystore.json` | — | **제외**(키 노출 금지) |
| `package*.json`, `node_modules/` | — | **제외** |
| `CNAME`(corpcare.kr) | — | **제외**(도메인 은퇴) |
| `.claude/`, `.playwright-mcp/`, `screenshots/`, `backend-handoff.docx` | — | 제외(개발 산출물) |

## 부록 B. corpcare 측 편집 파일 요약

| 파일 | 편집 내용 |
|---|---|
| `js/pages/login.js` | `MOBILE_ORDER_URL` → `"/mobile-order/"`, 링크 `target` 정리 |
| `.gitignore` | `mobile-order/` 하위 민감·의존성 무시 추가 |
| `.github/workflows/deploy-pages.yml` | staging `cp -r …`에 `mobile-order` 추가 |
| `CNAME` | 변경 없음(`harim-corpcare.com` 유지) |
