import { z } from "zod";

export const remarksUpdateSchema = z.object({
  remarks: z.array(z.string().min(1)).default([]),
});

export const companyProfileUpdateSchema = z.object({
  name: z.string().default(""),
  address: z.string().default(""),
  gstNumber: z.string().default(""),
  phoneNumber: z.string().default(""),
  email: z.string().default(""),
  // Stored as URL/base64 string.
  logo: z.string().default(""),
});

export const invoiceNumberSettingsUpdateSchema = z.object({
  invoicePrefix: z.string().default("INV-"),
  quotationPrefix: z.string().default("QT-"),
  nextInvoiceNumber: z.number().int().nonnegative().default(1001),
  nextQuotationNumber: z.number().int().nonnegative().default(1001),
});

