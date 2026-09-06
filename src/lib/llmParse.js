// Serbest metni yapılandırılmış JSON'a çeviren istemci tarafı.
// ÖNEMLİ: Gerçek LLM çağrısı artık burada DEĞİL, /api/parse üzerinden
// (sunucu tarafında, bkz. api/_llm.js) yapılıyor. Bunun iki sebebi var:
//   1) Groq/Gemini API anahtarları tarayıcıya hiç gönderilmiyor (güvenlik).
//   2) Groq'un tarayıcıdan gelen isteklere CORS ile izin vermemesi sorunu
//      ortadan kalkıyor (sunucu-sunucu isteğinde CORS kısıtlaması yok).
// /api/parse hem `npm run dev` sırasında (vite.config.js'teki dev proxy)
// hem de Vercel'e deploy edildiğinde (api/parse.js) aynı şekilde çalışır.
//
// DEMO GÜVENLİĞİ: Ücretsiz API planı demo sırasında yavaşlayabilir/limit
// yiyebilir. Bu yüzden:
//   1) DEMO_CACHE'de önceden test edilmiş cümleler + hazır JSON var —
//      eşleşirse hiç ağa gitmeden anında cevap döner.
//   2) İstek 6 saniyede timeout olur ve regex tabanlı fallback'e düşer.
// Prova sırasında DEMO_CACHE'e kendi demo cümlenizi ekleyin.

const DEMO_CACHE = [
  {
    match: /новокольцовск|общаг/i,
    result: { direction: "TO_NOVO", hour: 8, minute: 30, preferences: ["не курить"] },
  },
  {
    match: /главный корпус|мира\s*19|обратно/i,
    result: { direction: "TO_MAIN", hour: 18, minute: 0, preferences: [] },
  },
  {
    match: /утром|9 ?:?00|девять/i,
    result: { direction: "TO_NOVO", hour: 9, minute: 0, preferences: [] },
  },
];

function tryDemoCache(text) {
  const hit = DEMO_CACHE.find((entry) => entry.match.test(text));
  return hit ? hit.result : null;
}

// API çağrısı başarısız olursa devreye giren basit regex fallback
function regexFallback(text) {
  const lower = text.toLowerCase();
  const direction = /новокольцовск|общаг|в универ|на пары/.test(lower) ? "TO_NOVO" : "TO_MAIN";
  const timeMatch = lower.match(/(\d{1,2})[:.](\d{2})/);
  const hour = timeMatch ? parseInt(timeMatch[1], 10) : 9;
  const minute = timeMatch ? parseInt(timeMatch[2], 10) : 0;
  const preferences = [];
  if (/не кур/.test(lower)) preferences.push("не курить");
  if (/животн/.test(lower)) preferences.push("можно с животными");
  if (/тихо|тишин/.test(lower)) preferences.push("тихая поездка");
  return { direction, hour, minute, preferences };
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

/**
 * @param {string} text
 * @returns {Promise<{direction: string, hour: number, minute: number, preferences: string[], source: string}>}
 */
export async function parseRideRequest(text) {
  const cached = tryDemoCache(text);
  if (cached) return { ...cached, source: "cache" };

  try {
    const call = fetch("/api/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    }).then((r) => r.json());

    const result = await withTimeout(call, 6000);
    if (result.error || !result.direction) throw new Error(result.error || "invalid llm response");
    return { ...result, source: "llm" };
  } catch (err) {
    console.warn("LLM çağrısı başarısız, regex fallback kullanılıyor:", err.message);
    return { ...regexFallback(text), source: "fallback" };
  }
}
