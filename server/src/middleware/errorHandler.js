export function errorHandler(err, _req, res, _next) {
  // Zod validation errors should return 400, not 500
  const isZodError = err?.name === "ZodError" || err?.issues !== undefined;
  const status = isZodError ? 400 : (err?.statusCode || err?.status || 500);
  const message = err?.message || "Internal Server Error";

  // zod errors
  const details = err?.issues || err?.errors;

  if (isZodError) {
    console.warn("[errorHandler] Validation error:", JSON.stringify(details));
  }

  res.status(status).json({
    error: {
      code: err?.code || undefined,
      message,
      details,
    },
  });
}


