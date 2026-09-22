import { Routes, Route, Link, NavLink, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import MovieDetails from "./pages/MovieDetails.jsx";
import SeatSelection from "./pages/SeatSelection.jsx";
import Payment from "./pages/Payment.jsx";
import Confirmation from "./pages/Confirmation.jsx";
import Bookings from "./pages/Bookings.jsx";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user, loading, logout } = useAuth();

  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">
          🎬 Seat Booking
        </Link>
        <nav>
          <NavLink to="/">Movies</NavLink>
          <NavLink to="/bookings">My Bookings</NavLink>
          {!loading && !user && <NavLink to="/login">Login</NavLink>}
          {!loading && !user && <NavLink to="/register">Register</NavLink>}
          {!loading && user && (
            <span className="who">
              {user.name} ({user.age}){" "}
              <button type="button" className="link-btn" onClick={logout}>
                Logout
              </button>
            </span>
          )}
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/movies/:id" element={<MovieDetails />} />
        <Route path="/seats/:showId" element={<Protected><SeatSelection /></Protected>} />
        <Route path="/payment" element={<Protected><Payment /></Protected>} />
        <Route path="/confirmation" element={<Protected><Confirmation /></Protected>} />
        <Route path="/bookings" element={<Protected><Bookings /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}