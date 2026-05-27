import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import pinoHttp from "pino-http";

import { requestIdMiddleware } from "./middleware/requestId.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { routes } from "./routes/index.js";
import { swaggerSpec } from "./swagger/swaggerSpec.js";

export function createApp({ corsOrigin }) {
  const app = express();

  // Security
  app.use(helmet());

  // Request ID middleware
  app.use(requestIdMiddleware);

  // Logging
  app.use(
    pinoHttp({
      customAttributeKeys: {
        req: "request",
      },
    })
  );

  // CORS
  app.use(
    cors({
      origin: ["http://localhost:5173", "http://localhost:8081"],
      credentials: true,
    })
  );

  // Body parser
  app.use(express.json({ limit: "2mb" }));

  // Rate limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
    })
  );

  // Health Check Route
  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      mongodb: mongoose.connection.readyState,
    });
  });

  // Swagger Docs
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
  );

  // API Routes
  app.use("/api", routes);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}