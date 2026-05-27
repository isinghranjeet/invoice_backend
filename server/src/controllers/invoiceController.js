import { Invoice } from "../models/Invoice.js";
import { invoiceCreateSchema, invoicesQuerySchema } from "../schemas/invoiceSchemas.js";
import { ApiError } from "../utils/apiError.js";

export async function createOrUpsertInvoice(req, res, next) {
  try {
    const payload = invoiceCreateSchema.parse(req.body);

    const updated = await Invoice.findOneAndUpdate(
      { ownerId: req.user.id, "details.invoiceNo": payload.details.invoiceNo },
      {
        $set: {
          company: payload.company,
          buyer: payload.buyer,
          consignee: payload.consignee,
          details: payload.details,
          items: payload.items,
          remarks: payload.remarks,
          totalAmount: payload.totalAmount,
          totalTax: payload.totalTax,
          totalAmountInWords: payload.totalAmountInWords,
          savedAt: new Date(),
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
    const invoice = await Invoice.findOne({
      ownerId: req.user.id,
      "details.invoiceNo": req.params.invoiceNo,
    });

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
    const deleted = await Invoice.findOneAndDelete({
      ownerId: req.user.id,
      "details.invoiceNo": req.params.invoiceNo,
    });

    if (!deleted) throw new ApiError(404, "Invoice not found");
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

