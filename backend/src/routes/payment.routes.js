import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { simulatePayment } from "../services/payment.service.js";
import { asyncHandler } from "../utils/errors.js";

const router = Router();

router.post(
  "/simulate",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { showId, seatLabels, cardNumber } = req.body || {};
    if (!showId) {
      return res.status(400).json({ message: "showId is required." });
    }
    const result = await simulatePayment({ showId, seatLabels, cardNumber, user: req.user });
    res.json({
      ...result,
      bookingId: result.booking ? result.booking._id : undefined,
      simulated: true,
    });
  })
);

export default router;