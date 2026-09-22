import mongoose from "mongoose";

export const SEAT_STATUS = Object.freeze({
  AVAILABLE: "AVAILABLE",
  LOCKED: "LOCKED",
  BOOKED: "BOOKED",
});

const showSeatSchema = new mongoose.Schema(
  {
    show: { type: mongoose.Schema.Types.ObjectId, ref: "Show", required: true },
    seatLabel: { type: String, required: true },
    row: { type: String, required: true },
    seatNo: { type: Number, required: true },
    status: {
      type: String,
      enum: Object.values(SEAT_STATUS),
      default: SEAT_STATUS.AVAILABLE,
      required: true,
    },
    lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    lockedUntil: { type: Date, default: null },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", default: null },
    price: { type: Number, required: true, default: 300 },
  },
  { timestamps: true }
);

showSeatSchema.index({ show: 1, seatLabel: 1 }, { unique: true });

export default mongoose.model("ShowSeat", showSeatSchema);