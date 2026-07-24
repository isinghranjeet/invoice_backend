import mongoose from "mongoose";
import dotenv from "dotenv";
import { createApp } from "./app.js";
import { Invoice } from "./models/Invoice.js";

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
  process.env.CORS_ORIGIN || "http://localhost:8081";

await mongoose.connect(mongoUri);

console.log("MongoDB Connected");

// Drop the old all-encompassing unique index on ownerId + details.invoiceNo
// that prevented multiple quotations (invoiceNo="") from coexisting.
// The new partial indexes defined in the Invoice model are correct.
try {
  await Invoice.collection.dropIndex("ownerId_1_details.invoiceNo_1");
  console.log("Dropped old unique index ownerId_1_details.invoiceNo_1");
} catch {
  // Index may not exist — that's fine
}

// Ensure the new indexes are created
try {
  await Invoice.ensureIndexes();
  console.log("Invoice indexes synchronized");
} catch (e) {
  console.warn("Index sync warning:", e.message);
}

const app = createApp({ corsOrigin });

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
