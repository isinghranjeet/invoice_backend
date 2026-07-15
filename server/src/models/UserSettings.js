import mongoose from "mongoose";

const userSettingsSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
      unique: true,
    },

    // Remarks that are shown as selectable defaults.
    remarks: {
      type: [String],
      default: [],
    },

    // Invoice/Quotation numbering settings.
    invoiceNumberSettings: {
      type: {
        invoicePrefix: { type: String, default: "INV-" },
        quotationPrefix: { type: String, default: "QT-" },
        nextInvoiceNumber: { type: Number, default: 1001 },
        nextQuotationNumber: { type: Number, default: 1001 },
      },
      default: undefined,
    },

    // Company profile.
    companyProfile: {
      type: {
        name: { type: String, default: "" },
        address: { type: String, default: "" },
        gstNumber: { type: String, default: "" },
        phoneNumber: { type: String, default: "" },
        email: { type: String, default: "" },
        logo: { type: String, default: "" },
      },
      default: undefined,
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

userSettingsSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export const UserSettings = mongoose.model(
  "UserSettings",
  userSettingsSchema
);

