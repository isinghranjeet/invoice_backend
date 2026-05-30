import { z } from "zod";

export const invoiceCreateSchema = z.object({
  details: z.object({
    invoiceTitle: z.string().optional().default("TAX INVOICE"),
    invoiceNo: z.string().min(1),
  }),
  company: z.record(z.any()),
  buyer: z.record(z.any()),
  consignee: z.record(z.any()),
  items: z.array(z.record(z.any())),
  remarks: z.string().optional().default(""),
  totalAmount: z.number(),
  totalTax: z.number().optional().default(0),
  totalAmountInWords: z.string().optional().default("")
});


export const invoicesQuerySchema = z.object({
  q: z.string().optional().default(""),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20)
});

