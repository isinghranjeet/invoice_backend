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

    // Immutable snapshot of company/bank/document settings at time of creation.
    // Backend is the single source of truth for these fields.
    snapshot: {
      type: Object,
      required: false,
      default: undefined,
    },


    discount: {
      type: Object,
      required: false,
      default: undefined,
    },
    totalAmount: { type: Number, required: true },
    totalTax: { type: Number, default: 0 },
    totalAmountInWords: { type: String, default: "" },

    savedAt: { type: Date, default: Date.now },

    // Persistent invoice timestamps
    // - createdAt is set once (on first creation)
    // - updatedAt is updated on edits
    createdAt: { type: Date },
    updatedAt: { type: Date }
  },
  { timestamps: false }
);

// Unique index for invoices (where invoiceNo is non-empty).
// Quotations have invoiceNo="" so this partial index only applies to actual invoices.
invoiceSchema.index(
  { ownerId: 1, "details.invoiceNo": 1 },
  { unique: true, partialFilterExpression: { "details.invoiceNo": { $type: "string", $ne: "" } } }
);

// Secondary index for quotations (where quotationNo is non-empty).
invoiceSchema.index(
  { ownerId: 1, "details.quotationNo": 1 },
  { unique: true, partialFilterExpression: { "details.quotationNo": { $type: "string", $ne: "" } } }
);

export const Invoice = mongoose.model("Invoice", invoiceSchema);

