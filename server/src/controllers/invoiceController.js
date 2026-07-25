import mongoose from "mongoose";
import { Invoice } from "../models/Invoice.js";
import { Settings } from "../models/Settings.js";
import { invoiceCreateSchema, invoicesQuerySchema } from "../schemas/invoiceSchemas.js";
import { ApiError } from "../utils/apiError.js";

const FALLBACK_COMPANY = {
  companyName: "Rent My Event",
  address: "A123 Main Road Mandawali Fazelfur Near New Delhi, 110092",
  gstNumber: "07KRDPD7397PIZT",
  phone: "+91 9625340107",
  email: "Rentmyevents@gmail.com",
  website: "",
  logo: "/logo.jpeg",
};

const FALLBACK_BANK = {
  accountName: "Rent My Event",
  bankName: "State Bank of India",
  accountNumber: "44853461690",
  ifscCode: "SBIN0010269",
  branch: "Madhuban Enclave",
};

function pickResolvedString(value, fallback) {
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  return fallback;
}

function normalizeRemarks(settingsDoc) {
  const remarks = Array.isArray(settingsDoc?.remarks) ? settingsDoc.remarks : [];
  const cleaned = remarks.map((r) => String(r).trim()).filter(Boolean);
  // De-dupe while preserving order
  return Array.from(new Set(cleaned));
}

function resolveSettingsForSnapshot(settingsDoc) {
  const company = {
    name: pickResolvedString(settingsDoc?.companyName, FALLBACK_COMPANY.companyName),
    address: pickResolvedString(settingsDoc?.address, FALLBACK_COMPANY.address),
    gstin: pickResolvedString(settingsDoc?.gstNumber, FALLBACK_COMPANY.gstNumber),
    mobile: pickResolvedString(settingsDoc?.phone, FALLBACK_COMPANY.phone),
    email: pickResolvedString(settingsDoc?.email, FALLBACK_COMPANY.email),
    // keep resolved website value for snapshot completeness
    website: pickResolvedString(settingsDoc?.website, FALLBACK_COMPANY.website),
    logo: pickResolvedString(settingsDoc?.logo, FALLBACK_COMPANY.logo),


    // Embed bank details inside the existing company object (Option A + backward compat)
    bankName: pickResolvedString(settingsDoc?.bankDetails?.bankName, FALLBACK_BANK.bankName),
    accountNo: pickResolvedString(settingsDoc?.bankDetails?.accountNumber, FALLBACK_BANK.accountNumber),
    ifscCode: pickResolvedString(settingsDoc?.bankDetails?.ifscCode, FALLBACK_BANK.ifscCode),
    branchAddress: pickResolvedString(settingsDoc?.bankDetails?.branch, FALLBACK_BANK.branch),
    accountHolderName: pickResolvedString(settingsDoc?.bankDetails?.accountName, FALLBACK_BANK.accountName),
  };

  const remarksList = normalizeRemarks(settingsDoc);
  return {
    company,
    remarks: remarksList.join("\n"),
    remarksList,
  };
}

export async function createOrUpsertInvoice(req, res, next) {
  try {
    console.log("[invoiceController] Request body:", JSON.stringify(req.body, null, 2));
const payload = invoiceCreateSchema.parse(req.body);

    // Build the lookup query for existing document.
    // For quotations, invoiceNo is empty string so we must also match on quotationNo.
    const existingQuery = payload.details.invoiceNo
      ? { ownerId: req.user.id, "details.invoiceNo": payload.details.invoiceNo }
      : { ownerId: req.user.id, "details.quotationNo": payload.details.quotationNo };
    const existing = await Invoice.findOne(existingQuery);

if (existing) {
      // Existing invoice: never re-snapshot from live Settings.
      // Use the correct lookup field: for quotations match on quotationNo, for invoices match on invoiceNo
      const updateQuery = payload.details.invoiceNo
        ? { ownerId: req.user.id, "details.invoiceNo": payload.details.invoiceNo }
        : { ownerId: req.user.id, "details.quotationNo": payload.details.quotationNo };

      const updated = await Invoice.findOneAndUpdate(
        updateQuery,
        {
          $set: {
            company: payload.company,
            buyer: payload.buyer,
            consignee: payload.consignee,
            details: payload.details,
            items: payload.items,
            remarks: payload.remarks,
            discount: payload.discount ?? null,
            totalAmount: payload.totalAmount,
            totalTax: payload.totalTax,
            totalAmountInWords: payload.totalAmountInWords,
            updatedAt: new Date(),
          },
        }
      );

      res.status(200).json({ ok: true, invoiceNo: existing.details.invoiceNo });
      return;
    }

// New invoice/quotation: snapshot resolved company + bank + remarks from MongoDB Settings.
    let settingsDoc = await Settings.findOne({});
    if (!settingsDoc) {
      // get resolved fallbacks only (no persistent doc)
      settingsDoc = {
        companyName: FALLBACK_COMPANY.companyName,
        address: FALLBACK_COMPANY.address,
        gstNumber: FALLBACK_COMPANY.gstNumber,
        phone: FALLBACK_COMPANY.phone,
        email: FALLBACK_COMPANY.email,
        logo: FALLBACK_COMPANY.logo,
        bankDetails: { ...FALLBACK_BANK },
        remarks: [],
      };
    }

  const resolved = resolveSettingsForSnapshot(settingsDoc);

    // For new quotations, use quotationNo in the filter; for new invoices use invoiceNo.
    // This prevents the upsert from matching multiple documents with empty invoiceNo.
    const newDocFilter = payload.details.invoiceNo
      ? { ownerId: req.user.id, "details.invoiceNo": payload.details.invoiceNo }
      : { ownerId: req.user.id, "details.quotationNo": payload.details.quotationNo };

    const updated = await Invoice.findOneAndUpdate(
      newDocFilter,
      {
        $set: {
// Snapshot company/bank defaults
          company: resolved.company,
          buyer: payload.buyer,
          consignee: payload.consignee,
          details: payload.details,
          items: payload.items,
          discount: payload.discount ?? null,

          // Snapshot remarks only (selected remarks). Never persist custom text.
          remarks: resolved.remarks || "",

          // Immutable snapshot container for required architecture fields.
          snapshot: {
            companyName: resolved.company.name,
            address: resolved.company.address,
            gstNumber: resolved.company.gstin,
            phone: resolved.company.mobile,
            email: resolved.company.email,
            website: resolved.company.website || "",
            logo: resolved.company.logo,

            bankDetails: {
              accountName: resolved.company.accountHolderName,
              bankName: resolved.company.bankName,
              accountNumber: resolved.company.accountNo,
              ifscCode: resolved.company.ifscCode,
              branch: resolved.company.branchAddress,
            },

            // Prefixes + invoice/quotation numbers from the consumed backend-generated values
            invoicePrefix: payload.details.invoiceNo?.startsWith("INV-")
              ? "INV-"
              : payload.details.invoiceNo?.split("-", 1)[0]
                ? `${payload.details.invoiceNo.split("-")[0]}-`
                : "INV-",
            quotationPrefix: payload.details.quotationNo?.startsWith("QT-")
              ? "QT-"
              : payload.details.quotationNo?.split("-", 1)[0]
                ? `${payload.details.quotationNo.split("-")[0]}-`
                : "QT-",

            invoiceNumber: payload.details.invoiceNo,
            quotationNumber: payload.details.quotationNo || "",

            selectedRemarks: resolved.remarksList || [],
          },

          totalAmount: payload.totalAmount,
          totalTax: payload.totalTax,
          totalAmountInWords: payload.totalAmountInWords,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { new: true, upsert: true }
    );


    res.status(200).json({ ok: true, invoiceNo: updated.details.invoiceNo });
  } catch (e) {
    next(e);
  }
}


export async function getInvoice(req, res, next) {
  try {
    const { invoiceNo } = req.params;
    console.log("[DEBUG getInvoice] req.params.invoiceNo:", JSON.stringify(invoiceNo));
    console.log("[DEBUG getInvoice] invoiceNo type:", typeof invoiceNo);
    console.log("[DEBUG getInvoice] invoiceNo length:", invoiceNo?.length);
    console.log("[DEBUG getInvoice] invoiceNo char codes:", Array.from(invoiceNo || "").map(c => c.charCodeAt(0)));

    // Primary lookup by invoice number
    let invoice = await Invoice.findOne({
      ownerId: req.user.id,
      "details.invoiceNo": invoiceNo,
    });
    console.log("[DEBUG getInvoice] invoiceNo lookup result:", invoice ? invoice._id : "null");

    // Fallback: try by quotationNo (quotations have invoiceNo="")
    if (!invoice) {
      invoice = await Invoice.findOne({
        ownerId: req.user.id,
        "details.quotationNo": invoiceNo,
      });
      console.log("[DEBUG getInvoice] quotationNo lookup result:", invoice ? invoice._id : "null");
    }

    // Fallback: try by MongoDB _id (for backward compatibility with direct MongoDB links)
    if (!invoice && mongoose.Types.ObjectId.isValid(invoiceNo)) {
      invoice = await Invoice.findOne({
        ownerId: req.user.id,
        _id: invoiceNo,
      });
      console.log("[DEBUG getInvoice] _id lookup result:", invoice ? invoice._id : "null");
    }

    // DEBUG: If still not found, log the first 10 invoices for this user to see what's stored
    if (!invoice) {
      const sampleDocs = await Invoice.find({ ownerId: req.user.id }).limit(10).lean();
      console.log("[DEBUG getInvoice] Sample invoice fields for this user:");
      sampleDocs.forEach((doc, i) => {
        console.log(`  [${i}] _id=${doc._id}`);
        console.log(`  [${i}] details.invoiceNo=${JSON.stringify(doc.details?.invoiceNo)} (type=${typeof doc.details?.invoiceNo})`);
        console.log(`  [${i}] details.quotationNo=${JSON.stringify(doc.details?.quotationNo)} (type=${typeof doc.details?.quotationNo})`);
        console.log(`  [${i}] details keys=${Object.keys(doc.details || {})}`);
        // Check if invoiceNo is stored elsewhere
        console.log(`  [${i}] typeof details=${typeof doc.details}`);
        console.log(`  [${i}] details value:`, JSON.stringify(doc.details).substring(0, 300));
      });
    }

    if (!invoice) throw new ApiError(404, "Invoice not found");
    res.json(invoice);
  } catch (e) {
    next(e);
  }
}

export async function listInvoices(req, res, next) {
  try {
    const { q, page, limit } = invoicesQuerySchema.parse(req.query);

    const ownerId = req.user.id;

    const query = {
      ownerId,
      ...(q
        ? {
            $or: [
              { "details.invoiceNo": { $regex: q, $options: "i" } },
              { "buyer.name": { $regex: q, $options: "i" } },
              { "consignee.name": { $regex: q, $options: "i" } },
            ],
          }
        : {}),
    };

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Invoice.find(query).sort({ savedAt: -1 }).skip(skip).limit(limit),
      Invoice.countDocuments(query),
    ]);

    return res.json({
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e) {
    return next(e);
  }
}


export async function deleteInvoice(req, res, next) {
  try {
    const { invoiceNo } = req.params;

    // Primary lookup by invoice number
    let deleted = await Invoice.findOneAndDelete({
      ownerId: req.user.id,
      "details.invoiceNo": invoiceNo,
    });

    // Fallback: try by quotationNo (quotations have invoiceNo="")
    if (!deleted) {
      deleted = await Invoice.findOneAndDelete({
        ownerId: req.user.id,
        "details.quotationNo": invoiceNo,
      });
    }

    // Fallback: try by MongoDB _id (for backward compatibility)
    if (!deleted && mongoose.Types.ObjectId.isValid(invoiceNo)) {
      deleted = await Invoice.findOneAndDelete({
        ownerId: req.user.id,
        _id: invoiceNo,
      });
    }

    if (!deleted) throw new ApiError(404, "Invoice not found");
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

export async function listInvoiceNumbers(req, res, next) {
  try {
    const ownerId = req.user.id;

    const values = await Invoice.distinct("details.invoiceNo", {
      ownerId,
      "details.invoiceNo": { $type: "string", $ne: "" },
    });

    // Stable sort
    const sorted = values
      .filter((v) => typeof v === "string")
      .sort((a, b) => a.localeCompare(b));

    res.json({ items: sorted });
  } catch (e) {
    next(e);
  }
}

export async function listQuotationNumbers(req, res, next) {
  try {
    const ownerId = req.user.id;

    const values = await Invoice.distinct("details.quotationNo", {
      ownerId,
      "details.quotationNo": { $type: "string", $ne: "" },
    });

    const sorted = values
      .filter((v) => typeof v === "string")
      .sort((a, b) => a.localeCompare(b));

    res.json({ items: sorted });
  } catch (e) {
    next(e);
  }
}

/**
 * TEMP DEBUG: Dump invoice identifiers for debugging Quotation 404 issue.
 * Only active when req.query.debug === "quotation-404"
 */
export async function debugDumpInvoices(req, res, next) {
  try {
    if (req.query.debug !== "quotation-404") {
      return res.json({ ok: false, message: "Set ?debug=quotation-404" });
    }

    const ownerId = req.user.id;
    const docs = await Invoice.find({ ownerId }).limit(20).sort({ savedAt: -1 }).lean();

    const summary = docs.map((d) => ({
      _id: d._id.toString(),
      invoiceNo: d.details?.invoiceNo,
      invoiceNoType: typeof d.details?.invoiceNo,
      invoiceNoLen: d.details?.invoiceNo?.length,
      quotationNo: d.details?.quotationNo,
      quotationNoType: typeof d.details?.quotationNo,
      quotationNoLen: d.details?.quotationNo?.length,
      invoiceTitle: d.details?.invoiceTitle,
      detailsInvoiceNoBytes: Array.from(String(d.details?.invoiceNo ?? "")).map((c) => c.charCodeAt(0)),
    }));

    res.json({ count: docs.length, invoices: summary });
  } catch (e) {
    next(e);
  }
}




