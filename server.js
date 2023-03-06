// simple localhost server
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const userRoutes = require("./Routes/userRoutes");
const transactionRoutes = require("./Routes/transactionRoutes");
const transactionRoute1 = require("./Routes/transactions");
const quoteRoutes = require("./Routes/quoteRoutes");
const dumplog = require("./Routes/dumplog");

const app = express();
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "/index.html"));
});

app.use(express.json());

// Connect to DB
mongoose.connect("mongodb://127.0.0.1:27017/seng468db", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
// Test DB connection
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
  console.log("Connected to MongoDB successfully");
});

app.use("/", userRoutes);
app.use("/", transactionRoutes);
app.use("/", quoteRoutes);
app.use(dumplog);
app.use(transactionRoute1);

app.listen(3000, () => console.log("Server is up and running"));
