import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/movies")
      .then((d) => setMovies(d.movies))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page">Loading movies…</div>;

  return (
    <div className="page">
      <h1>Now Showing</h1>
      {error && <p className="error">{error}</p>}
      <div className="cards">
        {movies.map((m) => (
          <Link key={m._id} to={`/movies/${m._id}`} className="card">
            <div className="poster">{m.poster}</div>
            <div className="card-body">
              <h3>{m.title}</h3>
              <p>{m.genre} · {m.duration} min</p>
              <span className="limit">Age {m.ageLimit}+</span>
              <p className="desc">{m.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}