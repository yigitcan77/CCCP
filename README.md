# Poputka AI — MVP

UrFU ana kampüs ↔ Novokoltsovsky kampüsü arası öğrenci araç paylaşım (ride-sharing) uygulaması. Hackathon Case 10 için hazırlanan MVP.

Backend/veritabanı yok: tüm veri (sentetik kullanıcılar + oturum içinde eklenen yeni sürücüler) tarayıcı belleğinde tutulur, sayfa yenilenince sıfırlanır — demo için yeterli.

## Kurulum

```bash
npm install
cp .env.example .env
```

`.env` dosyasını açıp en az bir LLM sağlayıcısının API anahtarını girin:

- **Groq (önerilir):** https://console.groq.com/keys → ücretsiz, hızlı, `llama-3.1-8b-instant` modeli kullanılıyor.
- **Gemini:** https://aistudio.google.com/apikey → ücretsiz plan, `VITE_LLM_PROVIDER=gemini` yapmayı unutmayın.

```bash
npm run dev
```

## ⚠️ Önemli güvenlik notu

Vite'ta `VITE_*` ile başlayan ortam değişkenleri **derlenen JS dosyasına gömülür** — yani API anahtarınız Vercel'e deploy ettiğinizde herkesin görebileceği şekilde tarayıcıda görünür olur. Hackathon MVP'si için bu kabul edilebilir bir risktir (ücretsiz plan, düşük limit), ama:
- Sadece bu proje için ayrı, ücretsiz bir anahtar oluşturun.
- Hackathon bitince o anahtarı silin/rotate edin.
- Gerçek bir ürüne dönüştürecekseniz, LLM çağrısını bir backend/proxy arkasına almanız gerekir.

## Vercel'e deploy

```bash
npm run build
```

Ardından [vercel.com](https://vercel.com) → "Add New Project" → bu GitHub reposunu seçin → **Environment Variables** kısmına `.env` içindeki değerleri tek tek girin → Deploy.

## Mimari

```
src/
  data/syntheticUsers.js   → 42 sentetik sürücü/yolcu (rota, saat, puan, tercihler)
  lib/scoring.js           → Skorlama: rota %40, zaman %30, puan %15, tercihler %15
  lib/pricing.js           → Mesafeye dayalı basit fiyat formülü (taksiden ucuz)
  lib/llmParse.js          → TEK LLM çağrısı: serbest metin → JSON (+ demo cache + regex fallback)
  lib/explainMatch.js      → Şablona dayalı "neden eşleşti" açıklaması (LLM YOK)
  screens/HomeScreen.jsx   → Rol seçimi + form (yolcu: serbest metin / sürücü: rota formu)
  screens/ResultsScreen.jsx→ Sıralı eşleşme listesi + skor + fiyat + "Rezervasyon Yap"
  screens/ConfirmScreen.jsx→ Rezervasyon / rota yayınlama onayı
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
