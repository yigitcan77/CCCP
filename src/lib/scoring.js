// Eşleştirme skorlama mantığı — hackathon planındaki ağırlıklarla:
// Rota %40, Zaman %30, Puanlama (rating) %15, Tercihler %15
// Backend/DB yok: tüm hesaplama istemci tarafında, senkron olarak yapılır.

export const WEIGHTS = {
  route: 0.4,
  time: 0.3,
  rating: 0.15,
  preferences: 0.15,
};

const ROUTE_POINT_COUNT = 5;

/** Rota benzerliği: aynı yön + segment mesafesine göre 0..1 */
function routeScore(request, candidate) {
  if (request.direction !== candidate.direction) return 0.15; // ters yön, çok düşük ama sıfır değil (aktarma ihtimali)
  const distance = Math.abs(request.routeSegment - candidate.routeSegment);
  return Math.max(0, 1 - distance / (ROUTE_POINT_COUNT - 1));
}

/** Zaman yakınlığı: dakika farkına göre 0..1 (60+ dk fark = 0) */
function timeScore(request, candidate) {
  const reqMinutes = request.time.hour * 60 + request.time.minute;
  const candMinutes = candidate.time.hour * 60 + candidate.time.minute;
  const diff = Math.abs(reqMinutes - candMinutes);
  return Math.max(0, 1 - diff / 60);
}

/** Sürücü puanı 3.6–5.0 aralığından 0..1'e normalize edilir */
function ratingScore(candidate) {
  return Math.max(0, Math.min(1, (candidate.rating - 3.6) / (5.0 - 3.6)));
}

/** Tercih örtüşmesi: ortak tercih oranı 0..1 */
function preferencesScore(request, candidate) {
  const reqPrefs = request.preferences || [];
  const candPrefs = candidate.preferences || [];
  if (reqPrefs.length === 0) return 0.6; // yolcu tercih belirtmediyse nötr bir puan
  const overlap = reqPrefs.filter((p) => candPrefs.includes(p)).length;
  return overlap / reqPrefs.length;
}

/**
 * @param {object} request  - { direction, routeSegment, time, preferences }
 * @param {object} candidate - syntheticUsers içinden bir sürücü kaydı
 * @returns {{ total: number, breakdown: object }} 0..100 arası toplam skor + alt kırılım
 */
export function scoreMatch(request, candidate) {
  const route = routeScore(request, candidate);
  const time = timeScore(request, candidate);
  const rating = ratingScore(candidate);
  const preferences = preferencesScore(request, candidate);

  const total =
    route * WEIGHTS.route +
    time * WEIGHTS.time +
    rating * WEIGHTS.rating +
    preferences * WEIGHTS.preferences;

  return {
    total: Math.round(total * 100),
    breakdown: {
      route: Math.round(route * 100),
      time: Math.round(time * 100),
      rating: Math.round(rating * 100),
      preferences: Math.round(preferences * 100),
    },
  };
}

/**
 * @param {object} request
 * @param {Array} candidates - sadece role === 'driver' olanlar
 * @param {number} limit
 */
export function findMatches(request, candidates, limit = 6) {
  return candidates
    .filter((c) => c.role === "driver" && c.seatsAvailable > 0)
    .map((c) => ({ driver: c, ...scoreMatch(request, c) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}
