const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

app.use(
  cors({
    origin: "*", // temporarily for testing
    credentials: true,
  }),
);

app.use(express.json());

// connect MongoDB (SAFE for Vercel)
if (!mongoose.connection.readyState) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log(err));
}

// test route
app.get("/", (req, res) => {
  res.send("API Working");
});

// routes
app.use("/api/users", require("../server/routes/userRoutes"));

module.exports = app;
