import mongoose from "mongoose";

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    genre: { type: String, default: "" },
    duration: { type: Number, default: 120, min: 1 },
    ageLimit: { type: Number, required: true, min: 0 },
    poster: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Movie", movieSchema);