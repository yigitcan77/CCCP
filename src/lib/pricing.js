// Basit fiyat formülü — gerçek trafik verisi kullanılmaz.
// Ана kampüs <-> Novokoltsovsky arası sabit referans mesafe ~11 km kabul edilir;
// rota segmentine göre küçük bir sapma eklenir.

const REFERENCE_KM = 11;
const RUB_PER_KM = 18; // yakıt + amortisman payı olarak kaba katsayı
const TAXI_RUB_PER_KM = 32; // karşılaştırma için varsayılan taksi ücreti

export function estimateDistanceKm(routeSegment, routePointCount = 5) {
  const variance = (routeSegment / (routePointCount - 1) - 0.5) * 2; // -1..1
  return Math.round((REFERENCE_KM + variance * 1.5) * 10) / 10;
}

/**
 * @returns {{ price: number, taxiPrice: number, savingsPct: number, distanceKm: number }}
 */
export function estimatePrice(routeSegment) {
  const distanceKm = estimateDistanceKm(routeSegment);
  const price = Math.round((distanceKm * RUB_PER_KM) / 10) * 10;
  const taxiPrice = Math.round((distanceKm * TAXI_RUB_PER_KM) / 10) * 10;
  const savingsPct = Math.round((1 - price / taxiPrice) * 100);
  return { price, taxiPrice, savingsPct, distanceKm };
}
