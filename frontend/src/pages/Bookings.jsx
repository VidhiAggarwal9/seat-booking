import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";

const STATUS_CLASS = { CONFIRMED: "ok", PENDING: "info", FAILED: "bad" };

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/bookings/my-bookings")
      .then((d) => setBookings(d.bookings))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page">Loading…</div>;

  return (
    <div className="page">
      <h1>My Bookings</h1>
      {error && <p className="error">{error}</p>}
      {bookings.length === 0 && (
        <p>
          No bookings yet. <Link to="/">Browse movies</Link>
        </p>
      )}
      <div className="cards">
        {bookings.map((b) => (
          <div key={b._id} className="card">
            <div className="card-body">
              <h3>{b.movie ? b.movie.title : "Movie"}</h3>
              <p>
                {b.show
                  ? `${new Date(b.show.date).toLocaleDateString()} · ${b.show.startTime} · ${b.show.screen}`
                  : "—"}
              </p>
              <p>Seats: {b.seats.map((s) => s.seatLabel).join(", ")}</p>
              <p className="amount">₹{b.amount}</p>
              <p>
                Payment: <b>{b.paymentStatus}</b> · Booking:{" "}
                <span className={`pill ${STATUS_CLASS[b.bookingStatus]}`}>{b.bookingStatus}</span>
              </p>
              <p className="muted">Booked {new Date(b.createdAt).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}