import { Router } from "express";
import { getSeatMap, getShowWithMovie } from "../services/seat.service.js";
import { asyncHandler } from "../utils/errors.js";

const router = Router();

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const show = await getShowWithMovie(req.params.id);
    res.json({ show });
  })
);

router.get(
  "/:id/seats",
  asyncHandler(async (req, res) => {
    const seats = await getSeatMap(req.params.id);
    res.json({ seats });
  })
);

export default router;