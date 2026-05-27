export function errorHandler(err, _req, res, _next) {
  const status = err?.statusCode || err?.status || 500;
  const message = err?.message || "Internal Server Error";

  // zod errors
  const details = err?.issues || err?.errors;

  res.status(status).json({
    error: {
      code: err?.code || undefined,
      message,
      details,
    },
  });
}


