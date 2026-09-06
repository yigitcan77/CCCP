# Poputka AI — MVP

UrFU ana kampüs ↔ Novokoltsovsky kampüsü arası öğrenci araç paylaşım (ride-sharing) uygulaması. Hackathon Case 10 için hazırlanan MVP.

Backend/veritabanı yok: tüm veri (sentetik kullanıcılar + oturum içinde eklenen yeni sürücüler) tarayıcı belleğinde tutulur, sayfa yenilenince sıfırlanır — demo için yeterli.

## Kurulum

```bash
npm install
cp .env.example .env
```

`.env` dosyasını açıp en az bir LLM sağlayıcısının API anahtarını girin:

- **Groq (önerilir):** https://console.groq.com/keys → ücretsiz, hızlı, `openai/gpt-oss-20b` modeli kullanılıyor.
- **Gemini:** https://aistudio.google.com/apikey → ücretsiz plan, `LLM_PROVIDER=gemini` yapmayı unutmayın.

```bash
npm run dev
```

## Mimari notu: LLM çağrısı neden sunucu tarafında?

İlk versiyonda LLM çağrısı doğrudan tarayıcıdan yapılıyordu. İki sorun çıktı:
1. **Groq, tarayıcıdan (CORS) gelen isteklere izin vermiyor** — sadece sunucu-sunucu isteklerini kabul ediyor.
2. API anahtarı tarayıcıya gönderildiği için derlenen JS dosyasında herkese açık görünüyordu.

Bu yüzden LLM çağrısı artık `/api/parse` üzerinden, sunucu tarafında yapılıyor (`api/_llm.js`).
Bu endpoint iki ortamda da aynı şekilde çalışır:
- **`npm run dev` sırasında:** `vite.config.js` içindeki küçük bir dev-proxy bu isteği yakalar.
- **Vercel'e deploy edildiğinde:** `api/parse.js`, Vercel tarafından otomatik olarak bir serverless function olarak algılanır, ekstra ayar gerekmez.

API anahtarları artık tarayıcıya hiç gönderilmiyor — bu hem CORS sorununu çözüyor hem de daha güvenli.

## Vercel'e deploy

```bash
npm run build
```

Ardından [vercel.com](https://vercel.com) → "Add New Project" → bu GitHub reposunu seçin → **Environment Variables** kısmına `.env` içindeki değerleri (GROQ_API_KEY, LLM_PROVIDER vb. — VITE_ öneki OLMADAN) tek tek girin → Deploy. `api/` klasörü Vercel tarafından otomatik olarak serverless function olarak algılanır, ayrıca bir ayara gerek yok.

## Mimari

```
src/
  data/syntheticUsers.js   → 42 sentetik sürücü/yolcu (rota, saat, puan, tercihler)
  lib/scoring.js           → Skorlama: rota %40, zaman %30, puan %15, tercihler %15
  lib/pricing.js           → Mesafeye dayalı basit fiyat formülü (taksiden ucuz)
  lib/llmParse.js          → İstemci tarafı: /api/parse'ı çağırır (+ demo cache + regex fallback)
  lib/explainMatch.js      → Şablona dayalı "neden eşleşti" açıklaması (LLM YOK)
  screens/HomeScreen.jsx   → Rol seçimi + form (yolcu: serbest metin / sürücü: rota formu)
  screens/ResultsScreen.jsx→ Sıralı eşleşme listesi + skor + fiyat + "Rezervasyon Yap"
  screens/ConfirmScreen.jsx→ Rezervasyon / rota yayınlama onayı
api/
  _llm.js                  → Sunucu tarafı: gerçek Groq/Gemini çağrısı (anahtarlar burada)
  parse.js                 → Vercel serverless function girişi (production)
```

## Demo sırasında dikkat

`src/lib/llmParse.js` içindeki `DEMO_CACHE` dizisine, prova ettiğiniz demo cümlesini
ekleyin (regex ile eşleşen bir kalıp + hazır JSON cevabı). Böylece demo sırasında
canlı API'ye hiç gitmeden, anında ve garantili bir cevap alırsınız — ücretsiz API
planının o an yavaşlaması veya limit yemesi ihtimaline karşı bu şart.

## Henüz yapılmayanlar (bilerek — kapsam dışı)

- Gerçek kullanıcı kaydı / e-posta doğrulama
- Gerçek harita entegrasyonu (yer adları metin olarak gösteriliyor)
- Talep tahmini, "Smart Crew" — sadece sunumda sözlü olarak bahsedilecek
- Backend / kalıcı veritabanı
