import { Settings } from "../models/Settings.js";
import { ApiError } from "../utils/apiError.js";

import { z } from "zod";

import {
  companyProfileUpdateSchema,
  invoiceNumberSettingsUpdateSchema,
  remarksUpdateSchema,
} from "../schemas/settingsSchemas.js";

const settingsUpsertSchema = z
  .object({
    companyName: z.string().default(""),
    address: z.string().default(""),
    gstNumber: z.string().default(""),
    phone: z.string().default(""),
    email: z.string().default(""),
    website: z.string().default(""),
    logo: z.string().default(""),
    invoicePrefix: z.string().default("INV-"),
    quotationPrefix: z.string().default("QT-"),
    invoiceStartNumber: z.number().int().nonnegative().default(1001),
    quotationStartNumber: z.number().int().nonnegative().default(1001),
    remarks: z.array(z.string()).default([]),
    bankDetails: z
      .object({
        accountName: z.string().default(""),
        bankName: z.string().default(""),
        accountNumber: z.string().default(""),
        ifscCode: z.string().default(""),
        branch: z.string().default(""),
      })
      .optional()
      .default({}),
  })
  .strict();


function buildSingleSettingsFromDoc(doc) {
  return {
    companyName: doc.companyName ?? "",
    address: doc.address ?? "",
    gstNumber: doc.gstNumber ?? "",
    phone: doc.phone ?? "",
    email: doc.email ?? "",
    website: doc.website ?? "",
    logo: doc.logo ?? "",
    invoicePrefix: doc.invoicePrefix ?? "INV-",
    quotationPrefix: doc.quotationPrefix ?? "QT-",
    invoiceStartNumber: doc.invoiceStartNumber ?? 1001,
    quotationStartNumber: doc.quotationStartNumber ?? 1001,
    remarks: Array.isArray(doc.remarks) ? doc.remarks : [],

    bankDetails: {
      accountName: doc?.bankDetails?.accountName ?? "",
      bankName: doc?.bankDetails?.bankName ?? "",
      accountNumber: doc?.bankDetails?.accountNumber ?? "",
      ifscCode: doc?.bankDetails?.ifscCode ?? "",
      branch: doc?.bankDetails?.branch ?? "",
    },
  };
}


async function getOrCreateSingleSettings() {
  let settings = await Settings.findOne({});
  if (!settings) {
    settings = await Settings.create(Settings.getDefaultValues());
  }
  return settings;
}

function sanitizeRemarksList(remarks) {
  return Array.from(
    new Set(
      (remarks || [])
        .map((r) => String(r).trim())
        .filter(Boolean)
    )
  );
}

export async function getSettings(_req, res, next) {
  try {

    const settingsDoc = await getOrCreateSingleSettings();
    return res.json({ ok: true, settings: buildSingleSettingsFromDoc(settingsDoc.toObject()) });
  } catch (e) {
    next(e);
  }
}

export async function upsertSettings(req, res, next) {
  try {
    // NOTE: current UI only sends company + invoice prefixes + remarks.
    // bankDetails are handled in a follow-up schema update.
    const payload = settingsUpsertSchema.parse(req.body);

    // sanitize remarks: trim, drop empty, de-dupe
    const sanitizedRemarks = sanitizeRemarksList(payload.remarks);

    const settingsDoc = await getOrCreateSingleSettings();

    // Field-by-field assignment (do not replace objects)
    settingsDoc.companyName = payload.companyName;
    settingsDoc.address = payload.address;
    settingsDoc.gstNumber = payload.gstNumber;
    settingsDoc.phone = payload.phone;
    settingsDoc.email = payload.email;
    settingsDoc.website = payload.website;
    settingsDoc.logo = payload.logo;

    settingsDoc.invoicePrefix = payload.invoicePrefix;
    settingsDoc.quotationPrefix = payload.quotationPrefix;
    settingsDoc.invoiceStartNumber = payload.invoiceStartNumber;
    settingsDoc.quotationStartNumber = payload.quotationStartNumber;

    settingsDoc.remarks = sanitizedRemarks;

    // Save bankDetails if provided
    if (payload.bankDetails) {
      settingsDoc.bankDetails = {
        accountName: payload.bankDetails.accountName ?? "",
        bankName: payload.bankDetails.bankName ?? "",
        accountNumber: payload.bankDetails.accountNumber ?? "",
        ifscCode: payload.bankDetails.ifscCode ?? "",
        branch: payload.bankDetails.branch ?? "",
      };
    }

    await settingsDoc.save();

    return res.json({ ok: true, settings: buildSingleSettingsFromDoc(settingsDoc.toObject()) });
  } catch (e) {
    next(e);
  }
}



export async function updateRemarks(req, res, next) {
  try {
    const payload = remarksUpdateSchema.parse(req.body);
    const settings = await getOrCreateSingleSettings();

    const sanitizedRemarks = sanitizeRemarksList(payload.remarks);

    settings.remarks = sanitizedRemarks;

    await settings.save();

    return res.json({ ok: true, settings: buildSingleSettingsFromDoc(settings.toObject()) });
  } catch (e) {
    next(e);
  }
}


export async function updateCompanyProfile(req, res, next) {
  try {
    const payload = companyProfileUpdateSchema.parse(req.body);
    const settings = await getOrCreateSingleSettings();

    settings.companyName = payload.name;
    settings.address = payload.address;
    settings.gstNumber = payload.gstNumber;
    settings.phone = payload.phoneNumber;
    settings.email = payload.email;
    settings.logo = payload.logo;

    await settings.save();

    return res.json({ ok: true, settings: buildSingleSettingsFromDoc(settings.toObject()) });
  } catch (e) {
    next(e);
  }
}

export async function updateInvoiceNumberSettings(req, res, next) {
  try {
    const payload = invoiceNumberSettingsUpdateSchema.parse(req.body);
    const settings = await getOrCreateSingleSettings();

    settings.invoicePrefix = payload.invoicePrefix;
    settings.quotationPrefix = payload.quotationPrefix;
    settings.invoiceStartNumber = payload.nextInvoiceNumber;
    settings.quotationStartNumber = payload.nextQuotationNumber;

    await settings.save();

    return res.json({ ok: true, settings: buildSingleSettingsFromDoc(settings.toObject()) });
  } catch (e) {
    next(e);
  }
}

function formatThreeDigitSuffix(prefix, n) {
  const safePrefix = typeof prefix === "string" ? prefix : "";
  const suffix = String(Math.trunc(Number(n) || 0)).padStart(3, "0").slice(-3);
  return `${safePrefix}${suffix}`;
}


// Required by task: atomic server-side next number endpoints.
// NOTE: these only compute the next formatted number from Settings.
// Consumption (increment) happens in consumeDocumentNumber to keep numbering atomic.
export async function nextInvoiceNumber(req, res, next) {
  try {
    const settings = await getOrCreateSingleSettings();
    const invoiceNo = formatThreeDigitSuffix(settings.invoicePrefix, settings.invoiceStartNumber);
    return res.json({ ok: true, invoiceNo });
  } catch (e) {
    next(e);
  }
}

export async function nextQuotationNumber(req, res, next) {
  try {
    const settings = await getOrCreateSingleSettings();
    const quotationNo = formatThreeDigitSuffix(settings.quotationPrefix, settings.quotationStartNumber);
    return res.json({ ok: true, quotationNo });
  } catch (e) {
    next(e);
  }
}

// Used by legacy UI: returns prefixes + numeric "next".
export async function nextDocumentNumbers(req, res, next) {
  try {
    const settings = await getOrCreateSingleSettings();

    return res.json({
      ok: true,
      invoice: { prefix: settings.invoicePrefix, next: settings.invoiceStartNumber },
      quotation: { prefix: settings.quotationPrefix, next: settings.quotationStartNumber },
    });
  } catch (e) {
    next(e);
  }
}

// Consumes (increments) the numeric counter stored in Settings.
// Only last 3 digits change because formatting is derived from these counters.
export async function consumeDocumentNumber(req, res, next) {
  try {
    // Required by task: POST /api/settings/consume-number with { documentType: "invoice"|"quotation" }
    const documentType = req.body?.documentType;

    if (!documentType || !["invoice", "quotation"].includes(documentType)) {
      throw new ApiError(400, "Invalid documentType");
    }


    const settings = await getOrCreateSingleSettings();

    if (documentType === "invoice") {
      const invoiceNo = formatThreeDigitSuffix(settings.invoicePrefix, settings.invoiceStartNumber);
      settings.invoiceStartNumber = Number(settings.invoiceStartNumber) + 1;
      await settings.save();
      return res.json({ ok: true, invoiceNo, settings: buildSingleSettingsFromDoc(settings.toObject()) });
    }

    const quotationNo = formatThreeDigitSuffix(settings.quotationPrefix, settings.quotationStartNumber);
    settings.quotationStartNumber = Number(settings.quotationStartNumber) + 1;
    await settings.save();
    return res.json({ ok: true, quotationNo, settings: buildSingleSettingsFromDoc(settings.toObject()) });
  } catch (e) {
    next(e);
  }
}




