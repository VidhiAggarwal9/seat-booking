import { Router } from "express";
import { listMovies, getMovie, getMovieShows } from "../services/movie.service.js";
import { asyncHandler } from "../utils/errors.js";

const router = Router();

router.get("/", asyncHandler(async (req, res) => res.json({ movies: await listMovies() })));

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const movie = await getMovie(req.params.id);
    const shows = await getMovieShows(movie._id);
    res.json({ movie, shows });
  })
);

export default router;