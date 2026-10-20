require("dotenv").config();   // must be first
const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");
const app = express();
const PORT = process.env.PORT;

// Where each service lives (use env vars so Docker can override later)
const SERVICES = {
  auth: process.env.USER_SERVICE_URL || "http://localhost:3001",
  products: process.env.PRODUCT_SERVICE_URL || "http://localhost:3002",
  orders: process.env.ORDER_SERVICE_URL || "http://localhost:3003",
};

app.use(cors());

// Simple request logger
app.use((req, res, next) => {
  console.log(`[gateway] ${req.method} ${req.originalUrl}`);
  next();
});

// Helper: forward /api/<name>/* to the matching service
const proxyTo = (name, target) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    pathFilter: `/api/${name}`,
    pathRewrite: { "^/api": "" }, // /api/products/1 -> /products/1
    on: {
      error: (err, req, res) => {
        console.error(`[gateway] ${name} service error:`, err.message);
        res.status(502).json({ message: `${name} service is unavailable` });
      },
    },
  });

// Routes
app.use(proxyTo("auth", SERVICES.auth));         // /api/auth/register, /api/auth/login
app.use(proxyTo("products", SERVICES.products)); // /api/products
app.use(proxyTo("orders", SERVICES.orders));     // /api/orders

// Gateway health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "api-gateway" });
});

// Unknown routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on http://localhost:${PORT}`);
});