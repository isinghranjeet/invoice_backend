import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getSettings,
  nextDocumentNumbers,
  updateCompanyProfile,
  updateInvoiceNumberSettings,
  updateRemarks,
  consumeDocumentNumber,
} from "../controllers/settingsController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(getSettings));

router.put("/remarks", asyncHandler(updateRemarks));
router.put("/company", asyncHandler(updateCompanyProfile));
router.put("/number-settings", asyncHandler(updateInvoiceNumberSettings));

router.get("/next-numbers", asyncHandler(nextDocumentNumbers));
router.post("/consume-number", asyncHandler(consumeDocumentNumber));

export default router;

