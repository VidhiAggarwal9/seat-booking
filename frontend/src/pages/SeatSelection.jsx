import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { api } from "../api/client.js";

export default function SeatSelection() {
  const { showId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};
  const movie = state.movie;
  const show = state.show;

  const [seats, setSeats] = useState([]);
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loadingBtn, setLoadingBtn] = useState(false);

  const load = () => {
    api
      .get(`/shows/${showId}/seats`)
      .then((d) => setSeats(d.seats))
      .catch((e) => setError(e.message));
  };

  useEffect(load, [showId]);

  const rows = [...new Set(seats.map((s) => s.row))];
  const cols = [...new Set(seats.map((s) => s.seatNo))].sort((a, b) => a - b);

  const isSelected = (label) => selected.includes(label);

  const toggle = (seat) => {
    if (seat.status !== "AVAILABLE") return;
    setSelected((prev) =>
      prev.includes(seat.seatLabel)
        ? prev.filter((l) => l !== seat.seatLabel)
        : [...prev, seat.seatLabel]
    );
  };

  const lockSeats = async () => {
    if (selected.length === 0) return;
    setError("");
    setInfo("");
    setLoadingBtn(true);
    try {
      const data = await api.post("/seats/lock", { showId, seatLabels: selected });
      navigate("/payment", {
        state: {
          show: data.show,
          movie,
          seatLabels: selected,
          lockedUntil: data.lockedUntil,
          lockedMinutes: data.lockedMinutes,
        },
      });
    } catch (err) {
      setError(err.message);
      setSelected([]);
      load(); // refresh real seat states from the backend
    } finally {
      setLoadingBtn(false);
    }
  };

  if (!movie || !show) {
    return (
      <div className="page">
        <p>Please pick a show from the movie page first.</p>
        <Link to="/">Go to movies</Link>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>{movie.title}</h1>
      <p>
        {new Date(show.date).toLocaleDateString()} · {show.startTime} · {show.screen}
      </p>
      <p className="notice">Green = available · Orange = locked · Grey = booked · Blue = selected</p>

      {error && <p className="error">{error}</p>}
      {info && <p className="info">{info}</p>}

      <div className="screen">SCREEN</div>
      <div className="seat-map">
        {rows.map((row) => (
          <div className="seat-row" key={row}>
            <span className="row-label">{row}</span>
            {cols.map((col) => {
              const seat = seats.find((s) => s.row === row && s.seatNo === col);
              if (!seat) return <span key={`${row}${col}`} className="seat empty" />;
              const cls =
                seat.status === "BOOKED"
                  ? "seat booked"
                  : seat.status === "LOCKED"
                    ? "seat locked"
                    : isSelected(seat.seatLabel)
                      ? "seat selected"
                      : "seat free";
              return (
                <button key={seat.seatLabel} type="button" className={cls} onClick={() => toggle(seat)}>
                  {seat.seatLabel}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="bar">
        <span>
          Selected: {selected.length > 0 ? selected.join(", ") : "none"}
        </span>
        <button type="button" className="primary" onClick={lockSeats} disabled={selected.length === 0 || loadingBtn}>
          {loadingBtn ? "Locking…" : "Lock Seats & Pay"}
        </button>
      </div>
      <p className="hint">Selected seats are locked for 5 minutes. The backend confirms availability atomically.</p>
    </div>
  );
}