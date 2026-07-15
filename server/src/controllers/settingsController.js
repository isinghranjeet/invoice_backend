import { UserSettings } from "../models/UserSettings.js";
import {
  companyProfileUpdateSchema,
  invoiceNumberSettingsUpdateSchema,
  remarksUpdateSchema,
} from "../schemas/settingsSchemas.js";
import { ApiError } from "../utils/apiError.js";

function emptyDefaults() {
  return {
    remarks: [],
    invoiceNumberSettings: {
      invoicePrefix: "INV-",
      quotationPrefix: "QT-",
      nextInvoiceNumber: 1001,
      nextQuotationNumber: 1001,
    },
    companyProfile: {
      name: "",
      address: "",
      gstNumber: "",
      phoneNumber: "",
      email: "",
      logo: "",
    },
  };
}

async function getOrCreateSettings(ownerId) {
  let settings = await UserSettings.findOne({ ownerId });
  if (!settings) {
    settings = await UserSettings.create({
      ownerId,
      ...emptyDefaults(),
    });
  }
  return settings;
}

export async function getSettings(req, res, next) {
  try {
    const settings = await getOrCreateSettings(req.user.id);
    return res.json({ ok: true, settings });
  } catch (e) {
    next(e);
  }
}

export async function updateRemarks(req, res, next) {
  try {
    const payload = remarksUpdateSchema.parse(req.body);
    const settings = await getOrCreateSettings(req.user.id);

    settings.remarks = payload.remarks;
    await settings.save();

    return res.json({ ok: true, settings });
  } catch (e) {
    next(e);
  }
}

export async function updateCompanyProfile(req, res, next) {
  try {
    const payload = companyProfileUpdateSchema.parse(req.body);
    const settings = await getOrCreateSettings(req.user.id);

    settings.companyProfile = payload;
    await settings.save();

    return res.json({ ok: true, settings });
  } catch (e) {
    next(e);
  }
}

export async function updateInvoiceNumberSettings(req, res, next) {
  try {
    const payload = invoiceNumberSettingsUpdateSchema.parse(req.body);
    const settings = await getOrCreateSettings(req.user.id);

    settings.invoiceNumberSettings = payload;
    await settings.save();

    return res.json({ ok: true, settings });
  } catch (e) {
    next(e);
  }
}

// Used by CreateInvoice to generate numbers consistently.
export async function nextDocumentNumbers(req, res, next) {
  try {
    const settings = await getOrCreateSettings(req.user.id);

    const invoice = {
      prefix: settings.invoiceNumberSettings.invoicePrefix,
      next: settings.invoiceNumberSettings.nextInvoiceNumber,
    };
    const quotation = {
      prefix: settings.invoiceNumberSettings.quotationPrefix,
      next: settings.invoiceNumberSettings.nextQuotationNumber,
    };

    return res.json({
      ok: true,
      invoice,
      quotation,
    });
  } catch (e) {
    next(e);
  }
}

export async function consumeDocumentNumber(req, res, next) {
  try {
    const { documentType } = req.body;
    if (!documentType || !["invoice", "quotation"].includes(documentType)) {
      throw new ApiError(400, "Invalid documentType");
    }

    const settings = await getOrCreateSettings(req.user.id);

    if (documentType === "invoice") {
      settings.invoiceNumberSettings.nextInvoiceNumber += 1;
    } else {
      settings.invoiceNumberSettings.nextQuotationNumber += 1;
    }

    await settings.save();

    return res.json({ ok: true, settings });
  } catch (e) {
    next(e);
  }
}

