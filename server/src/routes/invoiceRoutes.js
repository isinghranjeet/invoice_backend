import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  createOrUpsertInvoice,
  debugDumpInvoices,
  deleteInvoice,
  getInvoice,
  listInvoices,
  listInvoiceNumbers,
  listQuotationNumbers,
} from "../controllers/invoiceController.js";

import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(requireAuth);

router.post("/", asyncHandler(createOrUpsertInvoice));
router.get("/", asyncHandler(listInvoices));

// Debug endpoint (must be before :invoiceNo to avoid route conflict)
router.get("/debug/dump", asyncHandler(debugDumpInvoices));

// Distinct keys for creatable dropdowns
router.get("/numbers/invoice", asyncHandler(listInvoiceNumbers));
router.get("/numbers/quotation", asyncHandler(listQuotationNumbers));

router.get("/:invoiceNo", asyncHandler(getInvoice));
router.delete("/:invoiceNo", asyncHandler(deleteInvoice));

export default router;









