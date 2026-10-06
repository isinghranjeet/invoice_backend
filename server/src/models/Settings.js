import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, sparse: true, unique: true, index: true },
    companyName: { type: String, default: "" },
    address: { type: String, default: "" },
    gstNumber: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    website: { type: String, default: "" },
    logo: { type: String, default: "" },

    invoicePrefix: { type: String, default: "INV-" },
    quotationPrefix: { type: String, default: "QT-" },

    invoiceStartNumber: { type: Number, default: 1001 },
    quotationStartNumber: { type: Number, default: 1001 },

    // Selectable defaults displayed by UI.
    remarks: { type: [String], default: [] },

    // Bank Details section (Settings -> snapshot into new invoices)
    bankDetails: {
      accountName: { type: String, default: "" },
      bankName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      ifscCode: { type: String, default: "" },
      branch: { type: String, default: "" },
    },
  },
  { timestamps: true }
);


settingsSchema.statics.getDefaultValues = function () {
  return {
    companyName: "",
    address: "",
    gstNumber: "",
    phone: "",
    email: "",
    website: "",
    logo: "",
    invoicePrefix: "INV-",
    quotationPrefix: "QT-",
    invoiceStartNumber: 1001,
    quotationStartNumber: 1001,
    remarks: [],

    bankDetails: {
      accountName: "",
      bankName: "",
      accountNumber: "",
      ifscCode: "",
      branch: "",
    },
  };
};

settingsSchema.statics.getOrCreateForOwner = async function (ownerId) {
  const existing = await this.findOne({ ownerId });
  if (existing) return existing;

  const legacy = await this.findOneAndUpdate(
    { ownerId: { $exists: false } },
    { $set: { ownerId } },
    { new: true }
  );
  if (legacy) return legacy;

  try {
    return await this.findOneAndUpdate(
      { ownerId },
      { $setOnInsert: { ...this.getDefaultValues(), ownerId } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    if (error?.code !== 11000) throw error;
    return this.findOne({ ownerId });
  }
};

export const Settings = mongoose.model("Settings", settingsSchema);


