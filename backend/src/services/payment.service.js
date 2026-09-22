import Booking, { PAYMENT_STATUS, BOOKING_STATUS } from "../models/Booking.js";
import ShowSeat, { SEAT_STATUS } from "../models/ShowSeat.js";
import ApiError from "../utils/errors.js";
import { normalizeLabels, getShowWithMovie, assertAgeEligible } from "./seat.service.js";

// SIMULATED payment rule (demo only). Real providers never work this way.
export function simulateCard(cardNumber) {
  const digits = String(cardNumber || "").replace(/\D/g, "");
  if (digits.length < 4) return false;
  const last = Number(digits[digits.length - 1]);
  return last % 2 === 0;
}

export async function ensureLocksOwned(showId, labels, user) {
  const now = Date.now();
  const seats = await ShowSeat.find({
    show: showId,
    seatLabel: { $in: labels },
    status: SEAT_STATUS.LOCKED,
    lockedBy: user._id,
    lockedUntil: { $gt: new Date(now) },
  });
  if (seats.length !== labels.length) {
    throw new ApiError(409, "One or more seats are no longer locked for you or the lock expired. Please book again.");
  }
  return seats;
}

export async function simulatePayment({ showId, seatLabels, cardNumber, user }) {
  const labels = normalizeLabels(seatLabels);

  const show = await getShowWithMovie(showId);
  assertAgeEligible(user, show);

  const seats = await ensureLocksOwned(showId, labels, user);
  const amount = seats.reduce((sum, s) => sum + s.price, 0);

  const passed = simulateCard(cardNumber);
  const cardLast4 = String(cardNumber || "").replace(/\D/g, "").slice(-4);

  if (!passed) {
    // Payment FAILED -> release the locks so seats become AVAILABLE again.
    await ShowSeat.updateMany(
      { _id: { $in: seats.map((s) => s._id) }, lockedBy: user._id, status: SEAT_STATUS.LOCKED },
      { $set: { status: SEAT_STATUS.AVAILABLE }, $unset: { lockedBy: 1, lockedUntil: 1 } }
    );
    return {
      status: "FAILED",
      message: `SIMULATED payment FAILED for card ending ${cardLast4 || "____"}. Seats were released.`,
      amount,
    };
  }

  // Payment PASSED -> record a server-side SUCCESS payment on a PENDING booking.
  // The confirm endpoint only confirms bookings whose paymentStatus is SUCCESS,
  // which the frontend can never fake.
  const seatIds = seats.map((s) => s._id);
  const existing = await Booking.findOne({
    user: user._id,
    show: showId,
    bookingStatus: BOOKING_STATUS.PENDING,
    paymentStatus: PAYMENT_STATUS.SUCCESS,
  });
  if (existing && existing.seats.length === labels.length) {
    return { status: "SUCCESS", message: "SIMULATED payment PASSED.", booking: existing, amount };
  }

  const booking = await Booking.create({
    user: user._id,
    movie: show.movie._id,
    show: showId,
    seats: seats.map((s) => ({
      seatLabel: s.seatLabel,
      showSeat: s._id,
      price: s.price,
    })),
    amount,
    paymentStatus: PAYMENT_STATUS.SUCCESS,
    bookingStatus: BOOKING_STATUS.PENDING,
  });

  return { status: "SUCCESS", message: "SIMULATED payment PASSED.", booking, amount };
}