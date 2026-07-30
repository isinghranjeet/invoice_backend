import { z } from "zod";

export const invoiceCreateSchema = z.object({
  details: z.object({
    invoiceTitle: z.string().optional().default("TAX INVOICE"),
    invoiceNo: z.string().optional().default(""),
    quotationNo: z.string().optional().default(""),
  }).passthrough(),
  company: z.record(z.any()),
  buyer: z.record(z.any()),
  consignee: z.record(z.any()),
  items: z.array(z.record(z.any())),
  remarks: z.string().optional().default(""),
  discount: z
    .object({
      type: z.enum(["percentage", "fixed"]),
      value: z.number(),
    })
    .optional(),
  totalAmount: z.number(),
  totalTax: z.number().optional().default(0),
  totalAmountInWords: z.string().optional().default("")
});


export const invoicesQuerySchema = z.object({
  q: z.string().optional().default(""),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20)
});

