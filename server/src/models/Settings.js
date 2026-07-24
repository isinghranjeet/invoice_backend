import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
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

export const Settings = mongoose.model("Settings", settingsSchema);


