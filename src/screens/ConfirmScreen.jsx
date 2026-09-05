export default function ConfirmScreen({ booking, onRestart }) {
  const isDriverPublish = booking.kind === "driver-published";

  return (
    <div className="screen">
      <div className="confirm-badge">✓</div>
      <h2 style={{ fontSize: 22, marginBottom: 8 }}>
        {isDriverPublish ? "Маршрут опубликован" : "Поездка забронирована"}
      </h2>
      <p style={{ color: "var(--muted)", fontSize: 14 }}>
        {isDriverPublish
          ? "Ваш маршрут теперь виден пассажирам, которые ищут попутку в это время."
          : "Водитель получит уведомление о вашей брони."}
      </p>

      <div className="confirm-card">
        {isDriverPublish ? (
          <>
            <div className="confirm-row">
              <span>Направление</span>
              <span>{booking.direction === "TO_NOVO" ? "Главный корпус → Novokoltsovsky" : "Novokoltsovsky → Главный корпус"}</span>
            </div>
            <div className="confirm-row">
              <span>Время выезда</span>
              <span>{String(booking.time.hour).padStart(2, "0")}:{String(booking.time.minute).padStart(2, "0")}</span>
            </div>
            <div className="confirm-row">
              <span>Свободных мест</span>
              <span>{booking.seatsAvailable}</span>
            </div>
          </>
        ) : (
          <>
            <div className="confirm-row">
              <span>Водитель</span>
              <span>{booking.driver.name}</span>
            </div>
            <div className="confirm-row">
              <span>Место встречи</span>
              <span>{booking.driver.routeLabel}</span>
            </div>
            <div className="confirm-row">
              <span>Время</span>
              <span>{booking.driver.time.label}</span>
            </div>
            <div className="confirm-row">
              <span>Рейтинг водителя</span>
              <span>★ {booking.driver.rating}</span>
            </div>
            <div className="confirm-row">
              <span>Стоимость</span>
              <span>{booking.price} ₽</span>
            </div>
          </>
        )}
      </div>

      <button type="button" className="primary-btn" onClick={onRestart}>
        {isDriverPublish ? "Готово" : "На главный экран"}
      </button>

      <div className="future-strip">
        В планах: прогноз спроса на популярные слоты и «Smart Crew» — постоянные группы
        попутчиков с одинаковым расписанием, плюс интеграция с университетской почтой для
        верификации.
      </div>
    </div>
  );
}
