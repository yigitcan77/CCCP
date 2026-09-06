// Bu dosya SADECE sunucu tarafında çalışır (Vercel function veya `npm run dev`
// sırasında vite.config.js içindeki dev proxy). Tarayıcıya hiç gönderilmez,
// bu yüzden API anahtarları burada güvenle kullanılabilir.

const SYSTEM_PROMPT = `Ты парсер запросов на попутку между кампусами УрФУ.
Верни ТОЛЬКО JSON, без markdown, без пояснений, в такой форме:
{"direction": "TO_NOVO" | "TO_MAIN", "hour": number, "minute": number, "preferences": string[]}
direction: TO_NOVO — от главного корпуса к Novokoltsovsky, TO_MAIN — обратно.
Если время не указано, поставь hour=9, minute=0.
preferences — выбери из списка, если явно упомянуты: ["музыка тихо","можно с животными","не курить","разговорчивый","тихая поездка","кондиционер"]. Если ничего не подходит — пустой массив.`;

async function callGroq(text) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
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
  if (!res.ok) throw new Error(data.error?.message || `Groq HTTP ${res.status}`);
  const raw = data.choices?.[0]?.message?.content || "{}";
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}

async function callGemini(text) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
  if (!res.ok) throw new Error(data.error?.message || `Gemini HTTP ${res.status}`);
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}

/**
 * @param {string} text
 * @returns {Promise<{direction: string, hour: number, minute: number, preferences: string[]}>}
 */
export async function callLLM(text) {
  const provider = process.env.LLM_PROVIDER || "groq";
  return provider === "gemini" ? callGemini(text) : callGroq(text);
}
