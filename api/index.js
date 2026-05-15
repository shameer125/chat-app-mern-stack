const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// connect your routes
app.use("/api/users", require("../server/routes/userRoutes"));
app.use("/api/messages", require("../server/routes/messageRoutes"));

app.get("/", (req, res) => {
  res.send("Backend running on Vercel");
});

module.exports = app;
