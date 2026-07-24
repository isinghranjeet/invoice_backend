import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getSettings,
  upsertSettings,
  nextDocumentNumbers,
  nextInvoiceNumber,
  nextQuotationNumber,
  updateCompanyProfile,
  updateInvoiceNumberSettings,
  updateRemarks,
  consumeDocumentNumber,
} from "../controllers/settingsController.js";

import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(requireAuth);

// Backward compatible: SettingsDrawer + useSettings.ts expects GET /api/settings
router.get("/", asyncHandler(getSettings));

// Upsert settings (full payload)
router.post("/", asyncHandler(upsertSettings));

router.put("/", asyncHandler(upsertSettings));

// Numbering endpoints
router.get("/next-numbers", asyncHandler(nextDocumentNumbers));
router.post("/consume-number", asyncHandler(consumeDocumentNumber));

// Keep older granular update endpoints for backward compatibility
router.put("/remarks", asyncHandler(updateRemarks));
router.put("/company", asyncHandler(updateCompanyProfile));
router.put("/number-settings", asyncHandler(updateInvoiceNumberSettings));

// Legacy helper endpoints
router.get("/next-invoice-number", asyncHandler(nextInvoiceNumber));
router.get("/next-quotation-number", asyncHandler(nextQuotationNumber));

export default router;

