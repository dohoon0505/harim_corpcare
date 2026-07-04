/* eslint-disable */
// ───────────────────────────────────────────────────────────────
//  간편접수 AI 추출 모듈
//  부고장/청첩장 링크(또는 붙여넣은 내용)에서 화환 배송 정보를 추출.
//   · 링크: OpenAI Responses API + web_search 도구로 직접 열람
//   · 내용: 붙여넣은 텍스트를 그대로 파싱
//  config.jsx 의 proxyEndpoint 가 있으면 키 대신 그 백엔드로 호출(키 은닉).
// ───────────────────────────────────────────────────────────────
(function () {
  const CFG = () => window.HARIM_AI_CONFIG || {};
  const SS_KEY = "harim_openai_key";

  function getApiKey() {
    const c = CFG();
    if (c.apiKey) return c.apiKey;
    try { return sessionStorage.getItem(SS_KEY) || ""; } catch (_) { return ""; }
  }
  function setSessionKey(k) { try { sessionStorage.setItem(SS_KEY, k); } catch (_) {} }
  // 키 입력이 필요한지: 프록시가 키를 보관하면 불필요, 아니면 브라우저에 키가 있어야 함
  function hasKey() {
    const c = CFG();
    if (c.proxyEndpoint && c.proxyHoldsKey) return true;
    return !!getApiKey();
  }

  // 추출 결과 형식(프롬프트로 강제) — JSON only, 키 고정
  const SHAPE = {
    obituary: `{
  "deliveryAddress": "장례식장명 + 빈소/호실 + 도로명주소를 한 줄로 (예: '○○병원 장례식장 301호 / 부산 동구 고관로 12')",
  "recipient": "상주 또는 고인 정보와 연락처를 한 줄로 (예: '故 홍길동 / 상주 홍철수 / 010-0000-0000'). 없으면 빈 문자열",
  "summary": "한 줄 요약"
}`,
    wedding: `{
  "deliveryAddress": "예식장명 + 홀/층 + 도로명주소를 한 줄로 (예: '○○웨딩홀 3층 그랜드볼룸 / 서울 강남구 테헤란로 1')",
  "recipient": "신랑·신부(또는 혼주) 성함과 연락처를 한 줄로 (예: '신랑 김○○ · 신부 이○○ / 010-0000-0000'). 없으면 빈 문자열",
  "ceremonyDateTime": "예식 일시를 ISO8601 로 (예: '2026-06-14T11:00'). 시간 정보가 없으면 날짜만, 전혀 없으면 빈 문자열",
  "summary": "한 줄 요약"
}`,
  };

  function instructions(type) {
    const kind = type === "obituary" ? "부고장(장례 부고)" : "청첩장(결혼식 초대장)";
    return [
      `너는 한국어 ${kind}에서 화환 배송에 필요한 정보를 추출하는 도우미야.`,
      `주어진 링크(웹 검색 도구로 열람) 또는 붙여넣은 내용에서 정보를 찾아,`,
      `아래 JSON 형식의 키를 '그대로' 사용해서 값만 채워 출력해.`,
      `JSON 객체 하나만 출력하고, 그 외의 설명·문장·코드펜스(\`\`\`)는 절대 출력하지 마.`,
      `찾을 수 없는 값은 빈 문자열("")로 둬.`,
      SHAPE[type],
    ].join("\n");
  }

  async function extractInvitation({ type, url, text, signal }) {
    const c = CFG();
    const userInput = url
      ? `다음 ${type === "obituary" ? "부고장" : "청첩장"} 링크를 열어 정보를 추출해줘:\n${url}`
      : `다음 ${type === "obituary" ? "부고장" : "청첩장"} 내용에서 정보를 추출해줘:\n\n${text}`;

    let endpoint, headers, body;
    if (c.proxyEndpoint) {
      // 프록시 경유(같은 출처 → CORS 없음). 프록시가 키를 보관하지 않으면 입력한 키를 함께 전달.
      endpoint = c.proxyEndpoint;
      headers = { "Content-Type": "application/json" };
      body = { type: type, url: url || "", text: text || "" };
      if (!c.proxyHoldsKey) {
        const key = getApiKey();
        if (!key) throw new Error("NO_KEY");
        body.apiKey = key;
      }
    } else {
      const key = getApiKey();
      if (!key) throw new Error("NO_KEY");
      endpoint = "https://api.openai.com/v1/responses";
      headers = { "Content-Type": "application/json", "Authorization": "Bearer " + key };
      body = {
        model: c.model || "gpt-4.1",
        instructions: instructions(type),
        input: userInput,
      };
      if (url) body.tools = [{ type: "web_search" }];
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
      signal: signal,
    });
    if (!res.ok) {
      let detail = "";
      try { detail = await res.text(); } catch (_) {}
      throw new Error("HTTP_" + res.status + (detail ? ": " + detail.slice(0, 400) : ""));
    }
    const data = await res.json();
    const raw = pickText(data);
    return parseJSON(raw);
  }

  // 응답에서 텍스트 추출 (Responses API / 프록시 다양한 형태 대응)
  function pickText(data) {
    if (!data) return "";
    if (typeof data.output_text === "string" && data.output_text.trim()) return data.output_text;
    if (Array.isArray(data.output)) {
      const parts = [];
      for (const item of data.output) {
        if (item && item.type === "message" && Array.isArray(item.content)) {
          for (const seg of item.content) {
            if (seg && (seg.type === "output_text" || seg.type === "text") && seg.text) parts.push(seg.text);
          }
        }
      }
      if (parts.length) return parts.join("\n");
    }
    if (typeof data.text === "string" && data.text.trim()) return data.text;
    if (data.choices && data.choices[0] && data.choices[0].message) return data.choices[0].message.content || "";
    // 프록시가 이미 파싱된 객체를 돌려준 경우
    if (data.deliveryAddress || data.recipient || data.ceremonyDateTime) return JSON.stringify(data);
    return "";
  }

  function parseJSON(s) {
    if (!s || !String(s).trim()) throw new Error("EMPTY_RESULT");
    let t = String(s).trim();
    t = t.replace(/^```(?:json)?/i, "").replace(/```\s*$/, "").trim();
    const a = t.indexOf("{"), b = t.lastIndexOf("}");
    if (a >= 0 && b > a) t = t.slice(a, b + 1);
    try {
      return JSON.parse(t);
    } catch (e) {
      throw new Error("PARSE_FAIL");
    }
  }

  window.HARIM_AI = { extractInvitation, getApiKey, setSessionKey, hasKey };
})();
