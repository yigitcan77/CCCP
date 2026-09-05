import { useState } from "react";
import { parseRideRequest } from "../lib/llmParse";
import { ROUTE_POINTS } from "../data/syntheticUsers";

const EXAMPLE = "Мне завтра к 9 утра нужно быть в Novokoltsovsky, не хочу чтобы курили в машине";

export default function HomeScreen({ onSearch, onPublishRoute }) {
  const [role, setRole] = useState("passenger");

  // yolcu formu
  const [freeText, setFreeText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState(null);

  // sürücü formu
  const [driverDirection, setDriverDirection] = useState("TO_NOVO");
  const [driverTime, setDriverTime] = useState("09:00");
  const [driverSeats, setDriverSeats] = useState(2);

  async function handleParse() {
    if (!freeText.trim()) return;
    setParsing(true);
    setError(null);
    try {
      const result = await parseRideRequest(freeText);
      setParsed(result);
    } catch {
      setError("Не получилось разобрать текст, попробуйте ещё раз.");
    } finally {
      setParsing(false);
    }
  }

  function handleSearch() {
    if (!parsed) return;
    onSearch({
      direction: parsed.direction,
      routeSegment: parsed.direction === "TO_NOVO" ? 0 : 4,
      time: { hour: parsed.hour, minute: parsed.minute },
      preferences: parsed.preferences || [],
    });
  }

  function handleDriverSubmit(e) {
    e.preventDefault();
    const [hour, minute] = driverTime.split(":").map(Number);
    onPublishRoute({
      direction: driverDirection,
      time: { hour, minute },
      seatsAvailable: Number(driverSeats),
    });
  }

  return (
    <div className="screen">
      <div className="role-toggle">
        <button
          type="button"
          className="role-btn"
          data-active={role === "passenger"}
          onClick={() => setRole("passenger")}
        >
          <strong>Мне нужна поездка</strong>
          <span>Найти водителя по маршруту и времени</span>
        </button>
        <button
          type="button"
          className="role-btn"
          data-active={role === "driver"}
          onClick={() => setRole("driver")}
        >
          <strong>Я еду и беру попутчиков</strong>
          <span>Опубликовать свой регулярный маршрут</span>
        </button>
      </div>

      {role === "passenger" ? (
        <>
          <div className="field-group">
            <label htmlFor="free-text">Опишите поездку своими словами</label>
            <textarea
              id="free-text"
              placeholder={EXAMPLE}
              value={freeText}
              onChange={(e) => {
                setFreeText(e.target.value);
                setParsed(null);
              }}
            />
          </div>

          <button
            type="button"
            className="ghost-btn"
            onClick={handleParse}
            disabled={parsing || !freeText.trim()}
            style={{ marginBottom: 16 }}
          >
            {parsing ? "Распознаю…" : "Распознать запрос"}
          </button>

          {error && <p className="parse-note" style={{ borderColor: "var(--danger)" }}>{error}</p>}

          {parsed && (
            <div className="parse-note">
              Понял так: направление{" "}
              <strong>
                {parsed.direction === "TO_NOVO" ? "→ Novokoltsovsky" : "→ Главный корпус"}
              </strong>
              , время <strong>{String(parsed.hour).padStart(2, "0")}:{String(parsed.minute).padStart(2, "0")}</strong>
              {parsed.preferences?.length ? <>, пожелания: {parsed.preferences.join(", ")}</> : null}
              {parsed.source === "fallback" && " (без ИИ, по ключевым словам — API был недоступен)"}
            </div>
          )}

          <button
            type="button"
            className="primary-btn"
            style={{ marginTop: 18 }}
            disabled={!parsed}
            onClick={handleSearch}
          >
            Найти попутку
          </button>
        </>
      ) : (
        <form onSubmit={handleDriverSubmit}>
          <div className="field-group">
            <label htmlFor="driver-direction">Направление</label>
            <select
              id="driver-direction"
              value={driverDirection}
              onChange={(e) => setDriverDirection(e.target.value)}
            >
              <option value="TO_NOVO">{ROUTE_POINTS[0]} → {ROUTE_POINTS[4]}</option>
              <option value="TO_MAIN">{ROUTE_POINTS[4]} → {ROUTE_POINTS[0]}</option>
            </select>
          </div>
          <div className="field-row">
            <div className="field-group">
              <label htmlFor="driver-time">Время выезда</label>
              <input
                id="driver-time"
                type="time"
                value={driverTime}
                onChange={(e) => setDriverTime(e.target.value)}
              />
            </div>
            <div className="field-group">
              <label htmlFor="driver-seats">Свободных мест</label>
              <input
                id="driver-seats"
                type="number"
                min={1}
                max={4}
                value={driverSeats}
                onChange={(e) => setDriverSeats(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="primary-btn">
            Опубликовать маршрут
          </button>
        </form>
      )}
    </div>
  );
}
