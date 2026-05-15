const express = require("express");
const cors = require("cors");

const app = express();

app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);

app.use(express.json());

// TEST ROUTE ONLY
app.get("/", (req, res) => {
  res.send("API WORKING");
});

module.exports = app;
