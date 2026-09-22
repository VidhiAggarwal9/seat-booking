import mongoose from "mongoose";
import Booking, { BOOKING_STATUS, PAYMENT_STATUS } from "../models/Booking.js";
import ShowSeat, { SEAT_STATUS } from "../models/ShowSeat.js";
import ApiError from "../utils/errors.js";
import { assertAgeEligible } from "./seat.service.js";

function isTxUnsupported(err) {
  return (
    err &&
    (err.code === 20 ||
      /transaction numbers are only allowed|Transaction numbers/i.test(String(err.message)) ||
      /standalone/i.test(String(err.message)))
  );
}

export async function confirmBooking(bookingId, user) {
  if (!mongoose.isValidObjectId(bookingId)) {
    throw new ApiError(400, "Invalid booking id.");
  }

  const booking = await Booking.findById(bookingId).populate("movie").populate("show");
  if (!booking) {
    throw new ApiError(404, "Booking not found.");
  }
  if (String(booking.user) !== String(user._id)) {
    throw new ApiError(403, "You do not have access to this booking.");
  }
  if (booking.bookingStatus === BOOKING_STATUS.CONFIRMED) {
    return booking;
  }
  if (booking.bookingStatus === BOOKING_STATUS.FAILED) {
    throw new ApiError(409, "This booking has already failed and cannot be confirmed.");
  }
  if (booking.paymentStatus !== PAYMENT_STATUS.SUCCESS) {
    throw new ApiError(409, "Payment did not succeed for this booking.");
  }

  // Age is re-validated from the DB at confirmation time too.
  assertAgeEligible(user, booking);

  const showSeatIds = booking.seats.map((s) => s.showSeat).filter(Boolean);
  const now = Date.now();
  const lockFilter = {
    _id: { $in: showSeatIds },
    status: SEAT_STATUS.LOCKED,
    lockedBy: user._id,
    lockedUntil: { $gt: new Date(now) },
  };

  // Preferred path: MongoDB transaction (works on replica sets).
  // For example the in-memory replica set from mongodb-memory-server supports this.
  let confirmedViaTx = false;
  try {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      await session.withTransaction(async () => {
        const lockedSeats = await ShowSeat.find(lockFilter).session(session);
        if (lockedSeats.length !== showSeatIds.length) {
          throw new ApiError(409, "One or more seats are no longer locked or the lock expired.");
        }
        await ShowSeat.updateMany(
          { _id: { $in: showSeatIds } },
          { $set: { status: SEAT_STATUS.BOOKED, booking: booking._id }, $unset: { lockedBy: 1, lockedUntil: 1 } }
        ).session(session);
        booking.bookingStatus = BOOKING_STATUS.CONFIRMED;
        await booking.save({ session });
      });
      confirmedViaTx = true;
    } finally {
      await session.endSession();
    }
  } catch (err) {
    if (isTxUnsupported(err)) {
      console.warn("Transactions not supported by this MongoDB deployment; using atomic fallback.");
    } else {
      throw err;
    }
  }

  if (!confirmedViaTx) {
    // Atomic fallback (standalone MongoDB). Each seat update is a single atomically
    // conditional update so two users can never both convert a seat to BOOKED.
    const upd = await ShowSeat.updateMany(lockFilter, {
      $set: { status: SEAT_STATUS.BOOKED, booking: booking._id },
      $unset: { lockedBy: 1, lockedUntil: 1 },
    });

    if (upd.modifiedCount !== showSeatIds.length) {
      // Roll back any seats that did flip so nobody loses seats to a failed booking.
      await ShowSeat.updateMany(
        { _id: { $in: showSeatIds }, status: SEAT_STATUS.BOOKED, booking: booking._id },
        { $set: { status: SEAT_STATUS.AVAILABLE }, $unset: { booking: 1 } }
      );
      booking.bookingStatus = BOOKING_STATUS.FAILED;
      await booking.save();
      throw new ApiError(409, "Seat is no longer available. Booking could not be confirmed.");
    }

    confirmedViaTx = true;
    booking.bookingStatus = BOOKING_STATUS.CONFIRMED;
    await booking.save();
  }

  return booking;
}

export async function myBookings(userId) {
  return Booking.find({ user: userId })
    .sort({ createdAt: -1 })
    .populate("movie", "title genre ageLimit poster")
    .populate("show", "date startTime screen");
}