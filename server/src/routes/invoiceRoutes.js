import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  createOrUpsertInvoice,
  deleteInvoice,
  getInvoice,
  listInvoices,
} from "../controllers/invoiceController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(requireAuth);

router.post("/", asyncHandler(createOrUpsertInvoice));
router.get("/", asyncHandler(listInvoices));
router.get("/:invoiceNo", asyncHandler(getInvoice));
router.delete("/:invoiceNo", asyncHandler(deleteInvoice));

export default router;

