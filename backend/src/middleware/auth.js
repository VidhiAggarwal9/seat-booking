import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import ApiError from "../utils/errors.js";

export const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies && req.cookies.token;
    if (!token) {
      throw new ApiError(401, "Authentication required. Please log in.");
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: false });
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        throw new ApiError(401, "Session expired. Please log in again.");
      }
      throw new ApiError(401, "Invalid token.");
    }

    if (!payload || !payload.id || !mongoose.isValidObjectId(payload.id)) {
      throw new ApiError(401, "Invalid token.");
    }

    const user = await User.findById(payload.id);
    if (!user) {
      throw new ApiError(401, "User no longer exists.");
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};