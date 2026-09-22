import { Router } from "express";
import { register, login, setAuthCookie, clearAuthCookie, toSafeUser } from "../services/auth.service.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/errors.js";

const router = Router();

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, email, password, age } = req.body || {};
    if (!name || !email || !password || age == null) {
      return res.status(400).json({ message: "name, email, password and age are required." });
    }
    const user = await register({ name, email, password, age });
    setAuthCookie(res, user._id);
    return res.status(201).json({ user: toSafeUser(user) });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required." });
    }
    const user = await login({ email, password });
    setAuthCookie(res, user._id);
    return res.json({ user: toSafeUser(user) });
  })
);

router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    clearAuthCookie(res);
    return res.json({ message: "Logged out." });
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => res.json({ user: toSafeUser(req.user) }))
);

export default router;