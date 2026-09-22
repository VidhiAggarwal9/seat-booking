import mongoose from "mongoose";
import ApiError from "../utils/errors.js";

export const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const msg = Object.values(err.errors)
      .map((e) => e.message)
      .join("; ");
    return res.status(400).json({ message: msg });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    return res.status(409).json({ message: `${field} already exists` });
  }

  if (err.name === "MongoServerError") {
    return res.status(409).json({ message: err.message });
  }

  console.error("Unhandled error:", err);
  if (err.code === 20) {
    // Transaction numbers only allowed on replica sets — fallback scenario
    return res.status(409).json({ message: err.message });
  }
  return res.status(500).json({ message: "Internal server error" });
};