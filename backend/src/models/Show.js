import mongoose from "mongoose";

const showSchema = new mongoose.Schema(
  {
    movie: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true, index: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    screen: { type: String, required: true },
  },
  { timestamps: true }
);

showSchema.index({ movie: 1, date: 1, startTime: 1, screen: 1 }, { unique: true });

export default mongoose.model("Show", showSchema);