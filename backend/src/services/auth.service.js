import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import ApiError from "../utils/errors.js";

const COOKIE_NAME = "token";
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

export function setAuthCookie(res, userId) {
  const token = signToken(userId);
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_MS,
  });
  return token;
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export function toSafeUser(user) {
  return { id: user._id, name: user.name, email: user.email, age: user.age };
}

export const register = async ({ name, email, password, age }) => {
  const existing = await User.findOne({ email: String(email || "").toLowerCase() });
  if (existing) {
    throw new ApiError(409, "An account with this email already exists.");
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hash, age });
  return user;
};

export const login = async ({ email, password }) => {
  const user = await User.findOne({ email: String(email || "").toLowerCase() }).select("+password");
  if (!user) {
    throw new ApiError(401, "Invalid email or password.");
  }
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    throw new ApiError(401, "Invalid email or password.");
  }
  return user;
};