import mongoose from "mongoose";

export const PAYMENT_STATUS = Object.freeze({
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
});

export const BOOKING_STATUS = Object.freeze({
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  FAILED: "FAILED",
});

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    movie: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
    show: { type: mongoose.Schema.Types.ObjectId, ref: "Show", required: true },
    seats: [
      {
        seatLabel: { type: String, required: true },
        showSeat: { type: mongoose.Schema.Types.ObjectId, ref: "ShowSeat" },
        price: { type: Number, required: true },
      },
    ],
    amount: { type: Number, required: true, default: 0 },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
    bookingStatus: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING,
    },
  },
  { timestamps: true }
);

bookingSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("Booking", bookingSchema);