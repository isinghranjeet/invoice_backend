import { Router } from "express";
import invoiceRoutes from "./invoiceRoutes.js";
import authRoutes from "./authRoutes.js";

export const routes = Router();

routes.use("/auth", authRoutes);
routes.use("/invoices", invoiceRoutes);

