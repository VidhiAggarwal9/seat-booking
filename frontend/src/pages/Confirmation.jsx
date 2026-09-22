import { useLocation, Link } from "react-router-dom";

export default function Confirmation() {
  const location = useLocation();
  const booking = location.state && location.state.booking;

  if (!booking) {
    return (
      <div className="page">
        <p>No recent booking.</p>
        <Link to="/">Go to movies</Link>
      </div>
    );
  }

  const movie = booking.movie || {};
  const show = booking.show || {};

  return (
    <div className="page narrow">
      <h1>🎉 Booking Confirmed</h1>
      <div className="ticket confirmed">
        <p>Booking ID: <b>{booking._id}</b></p>
        <p>Movie: <b>{movie.title}</b></p>
        <p>
          Show: {new Date(show.date).toLocaleDateString()} {show.startTime} · {show.screen}
        </p>
        <p>Seats: <b>{booking.seats.map((s) => s.seatLabel).join(", ")}</b></p>
        <p className="amount">Total: ₹{booking.amount}</p>
        <p>Payment: <b>{booking.paymentStatus}</b> · Booking: <b>{booking.bookingStatus}</b></p>
        <p>Booked on: {new Date(booking.createdAt).toLocaleString()}</p>
      </div>
      <p><Link to="/bookings">View My Bookings</Link></p>
    </div>
  );
}