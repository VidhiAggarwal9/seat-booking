import "dotenv/config";
import { fileURLToPath, pathToFileURL } from "url";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import Movie from "./models/Movie.js";
import Show from "./models/Show.js";
import ShowSeat from "./models/ShowSeat.js";
import { SEAT_STATUS } from "./models/ShowSeat.js";

const ROWS = ["A", "B", "C", "D"];
const COLS = [1, 2, 3, 4, 5];
const TIMES = ["10:00 AM", "2:00 PM", "6:00 PM", "9:00 PM"];

function priceFor(row) {
  if (row === "A") return 350;
  if (row === "B") return 350;
  if (row === "C") return 300;
  return 250;
}

export async function seedDatabase({ onlyIfEmpty = false } = {}) {
  const count = await Movie.countDocuments();
  if (onlyIfEmpty && count > 0) {
    console.log("Seed skipped: demo data already present.");
    return;
  }

  const movies = await Movie.insertMany([
    {
      title: "Interstellar",
      description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
      genre: "Sci-Fi",
      duration: 169,
      ageLimit: 13,
      poster: "🌌",
    },
    {
      title: "The Avengers",
      description: "Earth's mightiest heroes must come together to stop a global threat.",
      genre: "Action",
      duration: 143,
      ageLimit: 13,
      poster: "🛡️",
    },
    {
      title: "Toy Story",
      description: "A cowboy doll is profoundly threatened when a new spaceman figure supplants him as top toy.",
      genre: "Animation",
      duration: 81,
      ageLimit: 7,
      poster: "🤠",
    },
  ]);

  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);

  let showCount = 0;
  let seatCount = 0;
  for (const movie of movies) {
    for (let day = 1; day <= 2; day++) {
      const date = new Date(baseDate);
      date.setDate(baseDate.getDate() + day);
      for (const startTime of TIMES) {
        const show = await Show.create({
          movie: movie._id,
          date,
          startTime,
          screen: `Screen ${(showCount % 3) + 1}`,
        });

        const seats = [];
        for (const row of ROWS) {
          for (const col of COLS) {
            seats.push({
              show: show._id,
              seatLabel: `${row}${col}`,
              row,
              seatNo: col,
              status: SEAT_STATUS.AVAILABLE,
              price: priceFor(row),
            });
          }
        }
        await ShowSeat.insertMany(seats);
        showCount += 1;
        seatCount += seats.length;
      }
    }
  }

  // Demo users: one adult (can book everything) and one underage (age restrictions apply).
  const demoPass = await bcrypt.hash("demo123", 10);
  await User.updateOne(
    { email: "demo@example.com" },
    { $setOnInsert: { name: "Demo User", email: "demo@example.com", password: demoPass, age: 25 } },
    { upsert: true }
  );
  await User.updateOne(
    { email: "nemo@example.com" },
    { $setOnInsert: { name: "Nemo (kid)", email: "nemo@example.com", password: demoPass, age: 10 } },
    { upsert: true }
  );

  console.log(`Seed complete: ${movies.length} movies, ${showCount} shows, ${seatCount} seats.`);
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  const { connectDB, disconnectDB } = await import("./config/db.js");
  try {
    await connectDB();
    await seedDatabase();
    console.log("Demo users: demo@example.com / demo123 (age 25), nemo@example.com / demo123 (age 10)");
  } finally {
    await disconnectDB();
  }
}