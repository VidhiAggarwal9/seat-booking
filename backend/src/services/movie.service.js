import Movie from "../models/Movie.js";
import ApiError from "../utils/errors.js";

export const listMovies = async () => Movie.find().sort({ createdAt: 1 });

export const getMovie = async (id) => {
  const movie = await Movie.findById(id);
  if (!movie) throw new ApiError(404, "Movie not found.");
  return movie;
};

export const getMovieShows = async (movieId) => {
  await getMovie(movieId);
  const Show = (await import("../models/Show.js")).default;
  return Show.find({ movie: movieId }).sort({ date: 1, startTime: 1 }).populate("movie");
};