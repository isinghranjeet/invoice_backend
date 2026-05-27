import mongoose from "mongoose";
import dotenv from "dotenv";
import { createApp } from "./app.js";

dotenv.config();

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("Missing MONGODB_URI in environment (.env)");
}

if (!process.env.JWT_SECRET) {
  throw new Error("Missing JWT_SECRET in environment (.env)");
}

const port = Number(process.env.PORT || 4000);

const corsOrigin =
  process.env.CORS_ORIGIN || "http://localhost:5173";

await mongoose.connect(mongoUri);

console.log("MongoDB Connected");

const app = createApp({ corsOrigin });

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});