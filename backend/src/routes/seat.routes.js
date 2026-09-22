import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { lockSeats, releaseSeats, LOCK_DURATION_MS } from "../services/seat.service.js";
import { asyncHandler } from "../utils/errors.js";

const router = Router();

router.post(
  "/lock",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { showId, seatLabels } = req.body || {};
    if (!showId) {
      return res.status(400).json({ message: "showId is required." });
    }
    const result = await lockSeats({ showId, seatLabels, user: req.user });
    res.json({
      message: "Seats locked temporarily.",
      lockedMinutes: LOCK_DURATION_MS / 60000,
      lockedUntil: result.lockedUntil,
      seats: result.locked,
      show: {
        id: result.show._id,
        date: result.show.date,
        startTime: result.show.startTime,
        screen: result.show.screen,
        movie: {
          id: result.show.movie._id,
          title: result.show.movie.title,
          genre: result.show.movie.genre,
          ageLimit: result.show.movie.ageLimit,
        },
      },
    });
  })
);

router.delete(
  "/lock",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { showId, seatLabels } = req.body || {};
    if (!showId) {
      return res.status(400).json({ message: "showId is required." });
    }
    await releaseSeats({ showId, seatLabels, user: req.user });
    res.json({ message: "Seats released." });
  })
);

export default router;