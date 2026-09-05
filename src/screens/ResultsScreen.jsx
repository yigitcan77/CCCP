import { findMatches } from "../lib/scoring";
import { explainMatch } from "../lib/explainMatch";
import { estimatePrice } from "../lib/pricing";

export default function ResultsScreen({ request, drivers, onBook, onBack }) {
  const matches = findMatches(request, drivers);

  return (
    <div className="screen">
      <button type="button" className="ghost-btn" onClick={onBack} style={{ marginBottom: 18 }}>
        ← Изменить запрос
      </button>

      <h2 style={{ fontSize: 20, marginBottom: 4 }}>
        {matches.length} {matches.length === 1 ? "попутчик найден" : "попутчиков найдено"}
      </h2>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>
        {request.direction === "TO_NOVO" ? "Главный корпус → Novokoltsovsky" : "Novokoltsovsky → Главный корпус"}
        {" · "}
        {String(request.time.hour).padStart(2, "0")}:{String(request.time.minute).padStart(2, "0")}
      </p>

      {matches.length === 0 && (
        <p style={{ color: "var(--muted)" }}>
          Пока нет подходящих водителей на это время. Попробуйте другое время или направление.
        </p>
      )}

      <div className="results-list">
        {matches.map((match, i) => {
          const { price, taxiPrice } = estimatePrice(match.driver.routeSegment);
          return (
            <div className="match-row" key={match.driver.id}>
              <div className="route-dot-col">
                <div className="route-dot" />
                {i < matches.length - 1 && <div className="route-dot-line" />}
              </div>
              <div className="match-main">
                <strong>{match.driver.name}</strong>
                <div className="match-meta">
                  {match.driver.routeLabel} · выезд {match.driver.time.label} · ★ {match.driver.rating}
                </div>
                <div className="match-explain">{explainMatch(match)}</div>
              </div>
              <div className="match-score-col">
                <div className="match-score">{match.total}%</div>
                <div className="match-price">
                  {price} ₽ <span style={{ textDecoration: "line-through", opacity: 0.6 }}>{taxiPrice} ₽</span>
                </div>
                <button type="button" className="primary-btn" style={{ width: "auto", padding: "8px 14px", fontSize: 13 }} onClick={() => onBook(match, price)}>
                  Забронировать
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
