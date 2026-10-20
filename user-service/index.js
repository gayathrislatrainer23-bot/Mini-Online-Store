require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json()); // services parse their own JSON (not the gateway)

app.use("/auth", authRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "user-service" });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("user-service connected to MongoDB");
    app.listen(PORT, () =>
      console.log(`user-service running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });