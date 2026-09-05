// Sentetik kullanıcı verisi üretici.
// Gerçek bir backend/veritabanı yok — bu veri uygulama açıldığında
// bellekte (in-memory) bir kez üretilir ve oturum boyunca sabit kalır.

const FIRST_NAMES = [
  "Артём", "Мария", "Дмитрий", "Анна", "Иван", "Елена", "Сергей", "Ольга",
  "Никита", "Полина", "Максим", "Дарья", "Егор", "Виктория", "Кирилл",
  "Yiğit", "Yulya", "Алексей", "Ксения", "Роман", "Наталья", "Павел",
  "Светлана", "Тимур", "Алина",
];

const LAST_INITIALS = ["А.", "Б.", "В.", "Г.", "Д.", "К.", "М.", "П.", "С.", "Т."];

// İki kampüs arasındaki ana ara duraklar — rota eşleştirmesi bunlara göre
// hesaplanır (aynı segment / komşu segment / uzak segment).
export const ROUTE_POINTS = [
  "Гл. корпус УрФУ (Мира 19)",
  "Ул. Мира / Гагарина",
  "ТЦ Мега",
  "Кольцовский тракт",
  "п. Novokoltsovsky — общежития",
];

export const CAMPUSES = {
  MAIN: "Главный кампус (Мира 19)",
  NOVO: "Novokoltsovsky кампус",
};

const PREFERENCES = ["музыка тихо", "можно с животными", "не курить", "разговорчивый", "тихая поездка", "кондиционер"];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickMany(arr, n) {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < n && copy.length; i++) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
}

function randomTimeToday(minHour = 7, maxHour = 21) {
  const hour = minHour + Math.floor(Math.random() * (maxHour - minHour));
  const minute = pick([0, 10, 15, 20, 30, 40, 45, 50]);
  return { hour, minute, label: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}` };
}

/**
 * @param {number} count
 * @returns {Array} synthetic ride offers (drivers) + ride requests (passengers)
 */
export function generateSyntheticUsers(count = 42) {
  const users = [];
  for (let i = 0; i < count; i++) {
    const isDriver = i % 2 === 0; // ~yarı yarıya sürücü/yolcu karışımı
    const direction = Math.random() > 0.5 ? "TO_NOVO" : "TO_MAIN";
    const time = randomTimeToday();
    const routeSegment = Math.floor(Math.random() * ROUTE_POINTS.length); // 0..4, komşuluk = benzerlik

    users.push({
      id: `u-${i + 1}`,
      name: `${pick(FIRST_NAMES)} ${pick(LAST_INITIALS)}`,
      role: isDriver ? "driver" : "passenger",
      direction, // TO_NOVO: Гл.корпус -> Novokoltsovsky ; TO_MAIN: tersi
      routeSegment,
      routeLabel: ROUTE_POINTS[routeSegment],
      time,
      rating: Math.round((3.6 + Math.random() * 1.4) * 10) / 10, // 3.6–5.0
      seatsAvailable: isDriver ? 1 + Math.floor(Math.random() * 3) : null,
      preferences: pickMany(PREFERENCES, 1 + Math.floor(Math.random() * 2)),
      priceIfDriver: isDriver ? null : null, // fiyat pricing.js içinde hesaplanır
    });
  }
  return users;
}

export const syntheticUsers = generateSyntheticUsers(42);
