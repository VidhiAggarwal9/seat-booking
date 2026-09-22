import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/movies/${id}`)
      .then((d) => {
        setMovie(d.movie);
        setShows(d.shows);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="page"><p className="error">{error}</p></div>;
  if (!movie) return <div className="page">Loading…</div>;

  const underage = user && user.age < movie.ageLimit;

  const pickShow = (show) => {
    if (!user) return navigate("/login");
    navigate(`/seats/${show._id}`, { state: { movie, show } });
  };

  return (
    <div className="page">
      <h1>{movie.poster} {movie.title}</h1>
      <p>{movie.genre} · {movie.duration} min · Age {movie.ageLimit}+</p>
      <p>{movie.description}</p>
      {underage && (
        <p className="error">
          ⚠ Age restriction: this movie requires age {movie.ageLimit}+ but your profile age is {user.age}.
          The backend will also enforce this.
        </p>
      )}
      {!underage && (
        <p className="notice">
          {user
            ? `You are logged in as ${user.name} (age ${user.age}).`
            : "Login required to book tickets."}
        </p>
      )}

      <h2>Showtimes</h2>
      <div className="shows">
        {shows.map((s) => (
          <button key={s._id} type="button" className="show-btn" onClick={() => pickShow(s)}>
            {new Date(s.date).toLocaleDateString()} · {s.startTime} · {s.screen}
          </button>
        ))}
      </div>
      <p><Link to="/">← Back to movies</Link></p>
    </div>
  );
}