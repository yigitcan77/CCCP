import { useState } from "react";
import "./styles.css";
import HomeScreen from "./screens/HomeScreen";
import ResultsScreen from "./screens/ResultsScreen";
import ConfirmScreen from "./screens/ConfirmScreen";
import { syntheticUsers } from "./data/syntheticUsers";

export default function App() {
  const [screen, setScreen] = useState("home"); // "home" | "results" | "confirm"
  const [drivers, setDrivers] = useState(() => syntheticUsers.filter((u) => u.role === "driver"));
  const [request, setRequest] = useState(null);
  const [booking, setBooking] = useState(null);

  function handleSearch(req) {
    setRequest(req);
    setScreen("results");
  }

  function handleBook(match, price) {
    setBooking({ kind: "booking", driver: match.driver, price });
    setScreen("confirm");
  }

  function handlePublishRoute(route) {
    const newDriver = {
      id: `u-you-${Date.now()}`,
      name: "Вы",
      role: "driver",
      direction: route.direction,
      routeSegment: route.direction === "TO_NOVO" ? 0 : 4,
      routeLabel: route.direction === "TO_NOVO" ? "Гл. корпус УрФУ (Мира 19)" : "п. Novokoltsovsky — общежития",
      time: { ...route.time, label: `${String(route.time.hour).padStart(2, "0")}:${String(route.time.minute).padStart(2, "0")}` },
      rating: 5.0,
      seatsAvailable: route.seatsAvailable,
      preferences: [],
    };
    setDrivers((prev) => [newDriver, ...prev]);
    setBooking({ kind: "driver-published", ...route });
    setScreen("confirm");
  }

  function handleRestart() {
    setRequest(null);
    setBooking(null);
    setScreen("home");
  }

  return (
    <div className="app-shell">
      <div className="app-header">
        <h1>Poputka</h1>
        <span className="tagline">Попутки между кампусами УрФУ дешевле такси</span>
      </div>

      {screen === "home" && (
        <HomeScreen onSearch={handleSearch} onPublishRoute={handlePublishRoute} />
      )}
      {screen === "results" && (
        <ResultsScreen
          request={request}
          drivers={drivers}
          onBook={handleBook}
          onBack={() => setScreen("home")}
        />
      )}
      {screen === "confirm" && booking && (
        <ConfirmScreen booking={booking} onRestart={handleRestart} />
      )}
    </div>
  );
}
