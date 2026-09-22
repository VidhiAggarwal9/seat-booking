import Show from "../models/Show.js";
import ShowSeat, { SEAT_STATUS } from "../models/ShowSeat.js";
import ApiError from "../utils/errors.js";

export const LOCK_DURATION_MS = 5 * 60 * 1000;

export function normalizeLabels(labels) {
  if (!Array.isArray(labels) || labels.length === 0) {
    throw new ApiError(400, "Please select at least one seat.");
  }
  if (labels.length > 12) {
    throw new ApiError(400, "You can book at most 12 seats at once.");
  }
  const clean = labels.map((l) => String(l).trim().toUpperCase().replace(/\s+/g, ""));
  return [...new Set(clean)];
}

export async function getShowWithMovie(showId) {
  const show = await Show.findById(showId).populate("movie");
  if (!show || !show.movie) {
    throw new ApiError(404, "Show not found.");
  }
  return show;
}

export function assertAgeEligible(user, show) {
  const movie = show.movie;
  if (user.age < movie.ageLimit) {
    throw new ApiError(
      403,
      `Age restriction: this movie is rated ${movie.ageLimit}+ and your profile age is ${user.age}.`
    );
  }
  return true;
}

export async function getSeatMap(showId) {
  await getShowWithMovie(showId);
  const now = Date.now();
  const seats = await ShowSeat.find({ show: showId }).sort({ row: 1, seatNo: 1 });
  return seats.map((s) => {
    const expiredLock = s.status === SEAT_STATUS.LOCKED && s.lockedUntil && s.lockedUntil.getTime() <= now;
    return {
      id: s._id,
      seatLabel: s.seatLabel,
      row: s.row,
      seatNo: s.seatNo,
      price: s.price,
      status: expiredLock ? SEAT_STATUS.AVAILABLE : s.status,
    };
  });
}

async function claimSeat(showId, seatLabel, userId, lockedUntil) {
  return ShowSeat.findOneAndUpdate(
    {
      show: showId,
      seatLabel,
      $or: [{ status: SEAT_STATUS.AVAILABLE }, { status: SEAT_STATUS.LOCKED, lockedUntil: { $lt: lockedUntil } }],
    },
    { $set: { status: SEAT_STATUS.LOCKED, lockedBy: userId, lockedUntil } },
    { new: true }
  );
}

export async function lockSeats({ showId, seatLabels, user }) {
  const labels = normalizeLabels(seatLabels);

  const show = await getShowWithMovie(showId);
  assertAgeEligible(user, show);

  const seats = await ShowSeat.find({ show: showId, seatLabel: { $in: labels } });
  const byLabel = new Map(seats.map((s) => [s.seatLabel, s]));
  const unknown = labels.filter((l) => !byLabel.has(l));
  if (unknown.length > 0) {
    throw new ApiError(400, `Invalid seat(s): ${unknown.join(", ")}`);
  }

  const lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
  const locked = [];
  const failures = [];

  for (const label of labels) {
    const claimed = await claimSeat(showId, label, user._id, lockedUntil);
    if (!claimed) {
      // Determine the failure reason for a friendly message.
      const current = await ShowSeat.findOne({ show: showId, seatLabel: label });
      const reason =
        current.status === SEAT_STATUS.BOOKED
          ? `Seat ${label} is already booked.`
          : `${label} is no longer available (locked by another user or invalid).`;
      failures.push({ label: current ? current.seatLabel : label, reason });
      break;
    }
    locked.push({ seatLabel: claimed.seatLabel, price: claimed.price });
  }

  if (failures.length > 0) {
    // Release the seats we already locked so the user does not keep a partial lock.
    const lockedLabels = locked.map((s) => s.seatLabel);
    await ShowSeat.updateMany(
      { show: showId, seatLabel: { $in: lockedLabels }, lockedBy: user._id, status: SEAT_STATUS.LOCKED },
      { $set: { status: SEAT_STATUS.AVAILABLE }, $unset: { lockedBy: 1, lockedUntil: 1 } }
    );
    throw new ApiError(409, failures[0].reason);
  }

  return { show, locked, lockedUntil };
}

export async function releaseSeats({ showId, seatLabels, user }) {
  const labels = normalizeLabels(seatLabels);
  await ShowSeat.updateMany(
    {
      show: showId,
      seatLabel: { $in: labels },
      lockedBy: user._id,
      status: SEAT_STATUS.LOCKED,
    },
    { $set: { status: SEAT_STATUS.AVAILABLE }, $unset: { lockedBy: 1, lockedUntil: 1 } }
  );
}