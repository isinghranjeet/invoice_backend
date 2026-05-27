export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Happy Invoice Creator Backend",
    version: "1.0.0",
  },
  servers: [{ url: "http://localhost:4000" }],
  tags: [{ name: "auth" }, { name: "invoices" }],
  paths: {
    "/api/health": {
      get: { summary: "Health check", tags: ["health"], responses: { 200: { description: "ok" } } },
    },
    "/api/auth/register": {
      post: {
        tags: ["auth"],
        summary: "Register",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string" },
                  password: { type: "string" },
                  name: { type: "string" },
                },
                required: ["email", "password"],
              },
            },
          },
        },
        responses: { 201: { description: "token" }, 409: { description: "Email already registered" } },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["auth"],
        summary: "Login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { email: { type: "string" }, password: { type: "string" } },
                required: ["email", "password"],
              },
            },
          },
        },
        responses: { 200: { description: "token" }, 401: { description: "Invalid credentials" } },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["auth"],
        summary: "Get current user",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "user" }, 401: { description: "Unauthorized" } },
      },
    },
    "/api/invoices": {
      get: {
        tags: ["invoices"],
        summary: "List invoices (user scoped)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "q", in: "query", required: false, schema: { type: "string" } },
          { name: "page", in: "query", required: false, schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", required: false, schema: { type: "integer", default: 20 } },
        ],
        responses: { 200: { description: "items" } },
      },
      post: {
        tags: ["invoices"],
        summary: "Create/update invoice by invoiceNo (user scoped)",
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },

        responses: { 200: { description: "ok" } },
      },
    },
    "/api/invoices/{invoiceNo}": {
      get: {
        tags: ["invoices"],
        summary: "Get invoice by invoiceNo (user scoped)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "invoiceNo", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "invoice" }, 404: { description: "not found" } },
      },
      delete: {
        tags: ["invoices"],
        summary: "Delete invoice by invoiceNo (user scoped)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "invoiceNo", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "ok" }, 404: { description: "not found" } },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
  },
};


