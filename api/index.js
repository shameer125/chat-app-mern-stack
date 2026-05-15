const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

app.use(
  cors({
    origin: "https://your-frontend.vercel.app",
    credentials: true,
  }),
);

app.use(express.json());

// test route
app.get("/", (req, res) => {
  res.send("API Working");
});

// IMPORT ROUTES (check paths carefully)
app.use("/api/users", require("../server/routes/userRoutes"));

module.exports = app;
