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

  // Security headers
  app.use(helmet());

  // Request ID
  app.use(requestIdMiddleware);

  // Logging
  app.use(
    pinoHttp({
      customAttributeKeys: {
        req: "request",
      },
    })
  );

  // ✅ CORS
  // Must be registered BEFORE any API routes.
  const corsOptions = {
    origin: function (origin, callback) {
      // allow server-to-server or tools like Postman (no origin)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
  "https://invoice.eassytorent.in",
  "https://invoice.easytorent.in",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8081",
  "http://localhost:8082",
];

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: false,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };

  app.use(cors(corsOptions));

  // Handle preflight requests explicitly.
  app.options("*", cors(corsOptions));


  // Body parser
  app.use(express.json({ limit: "2mb" }));

  // Rate limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
    })
  );

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      mongodb: mongoose.connection.readyState,
    });
  });

  // Swagger docs
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // API routes
  app.use("/api", routes);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}