import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { confirmBooking, myBookings } from "../services/booking.service.js";
import { asyncHandler } from "../utils/errors.js";

const router = Router();

router.post(
  "/confirm",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { bookingId } = req.body || {};
    if (!bookingId) {
      return res.status(400).json({ message: "bookingId is required." });
    }
    const booking = await confirmBooking(bookingId, req.user);
    res.json({ message: "Booking confirmed.", booking });
  })
);

router.get(
  "/my-bookings",
  requireAuth,
  asyncHandler(async (req, res) => {
    const bookings = await myBookings(req.user._id);
    res.json({ bookings });
  })
);

export default router;