import "dotenv/config";
import app from "./app.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { seedDatabase } from "./seed.js";

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();

  // Auto-seed demo data on first run so the app is usable immediately.
  await seedDatabase({ onlyIfEmpty: true });

  const server = app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
  });

  const shutdown = async () => {
    server.close();
    await disconnectDB();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch((err) => {
  console.error("Failed to start backend:", err);
  process.exit(1);
});