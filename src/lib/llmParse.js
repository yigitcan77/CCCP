// Serbest metni yapılandırılmış JSON'a çeviren TEK LLM çağrısı.
// Sağlayıcı .env üzerinden seçilir: VITE_LLM_PROVIDER = "groq" | "gemini"
//
// ÖNEMLİ (demo güvenliği): Ücretsiz API planları demo sırasında rate-limit
// yiyebilir veya yavaş cevap verebilir. Bu yüzden:
//   1) DEMO_CACHE içinde önceden test edilmiş 5-6 cümle + hazır JSON cevabı var.
//      Kullanıcı bu cümlelerden birine yakın bir şey yazarsa, API'ye hiç
//      gitmeden anında (sahte gecikmeyle) cevap döner — demo asla çökmez.
//   2) API çağrısı 6 saniyede timeout olur ve regex tabanlı basit bir
//      fallback parser'a düşer, yine JSON döner.
// Prova sırasında DEMO_CACHE'e kendi demo cümlenizi ekleyin.

const PROVIDER = import.meta.env.VITE_LLM_PROVIDER || "groq";
const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const SYSTEM_PROMPT = `Ты парсер запросов на попутку между кампусами УрФУ.
Верни ТОЛЬКО JSON, без markdown, без пояснений, в такой форме:
{"direction": "TO_NOVO" | "TO_MAIN", "hour": number, "minute": number, "preferences": string[]}
direction: TO_NOVO — от главного корпуса к Novokoltsovsky, TO_MAIN — обратно.
Если время не указано, поставь hour=9, minute=0.
preferences — выбери из списка, если явно упомянуты: ["музыка тихо","можно с животными","не курить","разговорчивый","тихая поездка","кондиционер"]. Если ничего не подходит — пустой массив.`;

// 1) Prova için önceden test edilmiş demo cümleleri -> hazır JSON
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

// 2) API çağrısı başarısız olursa devreye giren basit regex fallback
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

async function callGroq(text) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-20b",
      temperature: 0,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
    }),
  });
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || "{}";
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}

async function callGemini(text) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nЗапрос: ${text}` }] }],
        generationConfig: { temperature: 0 },
      }),
    }
  );
  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

/**
 * @param {string} text - kullanıcının serbest metin talebi, örn. "Bugün saat 9'da Novokoltsovsky'e gitmem lazım, sigara içilmesin"
 * @returns {Promise<{direction: string, hour: number, minute: number, preferences: string[], source: string}>}
 */
export async function parseRideRequest(text) {
  const cached = tryDemoCache(text);
  if (cached) return { ...cached, source: "cache" };

  try {
    const call = PROVIDER === "gemini" ? callGemini(text) : callGroq(text);
    const result = await withTimeout(call, 6000);
    if (!result.direction) throw new Error("invalid llm response");
    return { ...result, source: "llm" };
  } catch (err) {
    console.warn("LLM çağrısı başarısız, regex fallback kullanılıyor:", err.message);
    return { ...regexFallback(text), source: "fallback" };
  }
}
