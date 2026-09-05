// Şablona dayalı "neden eşleşti" açıklaması — LLM çağrısı YOK.
// Skor kırılımındaki en güçlü iki bileşene göre bir cümle üretir.

const LABELS = {
  route: { ru: "маршрут почти совпадает", weight: 1 },
  time: { ru: "время выезда близкое", weight: 1 },
  rating: { ru: "высокий рейтинг водителя", weight: 1 },
  preferences: { ru: "совпадают предпочтения по поездке", weight: 1 },
};

/**
 * @param {{ breakdown: { route: number, time: number, rating: number, preferences: number } }} match
 * @returns {string}
 */
export function explainMatch(match) {
  const entries = Object.entries(match.breakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);

  const phrases = entries.map(([key, value]) => `${LABELS[key].ru} (${value}%)`);

  if (match.total >= 85) {
    return `Отличное совпадение: ${phrases.join(" и ")}.`;
  }
  if (match.total >= 60) {
    return `Хорошее совпадение: ${phrases.join(" и ")}.`;
  }
  return `Есть общая часть маршрута: ${phrases.join(" и ")}.`;
}
