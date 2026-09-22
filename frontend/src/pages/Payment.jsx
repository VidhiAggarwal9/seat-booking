import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { api } from "../api/client.js";

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};
  const { show, movie, seatLabels, lockedUntil, lockedMinutes } = state;

  const [card, setCard] = useState("");
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [amount, setAmount] = useState(0);
  const [payResult, setPayResult] = useState("");

  if (!show || !movie || !seatLabels) {
    return (
      <div className="page">
        <p>No seats selected. Please start from a movie.</p>
        <Link to="/">Go to movies</Link>
      </div>
    );
  }

  const simulate = async () => {
    setError("");
    setPayResult("");
    setPaying(true);
    try {
      const data = await api.post("/payment/simulate", {
        showId: show.id,
        seatLabels,
        cardNumber: card,
      });
      setAmount(data.amount);
      if (data.status === "SUCCESS") {
        setBookingId(data.bookingId);
        setPayResult(`SIMULATED payment PASSED (${data.message}). Booking ready to confirm.`);
      } else {
        setPayResult(`Simulated payment FAILED — your seats have been released. Pick new seats or try an even-ending card.`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setPaying(false);
    }
  };

  const confirm = async () => {
    setConfirming(true);
    setError("");
    try {
      const data = await api.post("/bookings/confirm", { bookingId });
      navigate("/confirmation", { state: { booking: data.booking } });
    } catch (err) {
      setError(err.message);
      setConfirming(false);
    }
  };

  return (
    <div className="page narrow">
      <h1>Payment (SIMULATED only)</h1>
      <div className="ticket">
        <p><b>{movie.title}</b></p>
        <p>{new Date(show.date).toLocaleDateString()} · {show.startTime} · {show.screen}</p>
        <p>Seats: {seatLabels.join(", ")}</p>
        {lockedUntil && <p>Lock valid until: {new Date(lockedUntil).toLocaleTimeString()} (~{lockedMinutes} min)</p>}
        {amount > 0 && <p className="amount">Total: ₹{amount}</p>}
      </div>

      <p className="notice">
        💳 DEMO RULE: card number ending in an <b>even</b> digit → PASS. Ending in an <b>odd</b> digit → FAIL.
      </p>

      {error && <p className="error">{error}</p>}
      {payResult && <p className={bookingId ? "info" : "error"}>{payResult}</p>}

      <div className="form">
        <input
          placeholder="Demo card number (e.g. 4242 or 4241)"
          value={card}
          onChange={(e) => setCard(e.target.value)}
        />
        <button type="button" className="primary" onClick={simulate} disabled={paying || !card}>
          {paying ? "Simulating…" : "Simulate Payment"}
        </button>
        {bookingId && (
          <button type="button" className="primary" onClick={confirm} disabled={confirming}>
            {confirming ? "Confirming…" : "Confirm Booking"}
          </button>
        )}
      </div>
      <p><Link to="/bookings">My Bookings</Link></p>
    </div>
  );
}