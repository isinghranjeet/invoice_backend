import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },

    details: { type: Object, required: true },
    company: { type: Object, required: true },
    buyer: { type: Object, required: true },
    consignee: { type: Object, required: true },
    items: { type: Array, required: true },
    remarks: { type: String, default: "" },

    totalAmount: { type: Number, required: true },
    totalTax: { type: Number, default: 0 },
    totalAmountInWords: { type: String, default: "" },

    savedAt: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

invoiceSchema.index({ ownerId: 1, "details.invoiceNo": 1 }, { unique: true });

export const Invoice = mongoose.model("Invoice", invoiceSchema);

