import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI is not set. Cannot connect to MongoDB.");
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log(`MongoDB connected via ${uri.split("?")[0]}`);

  mongoose.connection.on("error", (err) => console.error("MongoDB error:", err));
  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.disconnect();
}

export async function supportsTransactions() {
  if (!mongoose.connection || !mongoose.connection.db) return false;
  try {
    await mongoose.connection.db.admin().command({ hello: 1 });
  } catch {
    return false;
  }
  return true;
}