// simple localhost server
const express = require("express");
// const path = require("path");
const mongoose = require("mongoose");
const path = require('path');
// const fs = require('fs');
// require("./Redis/redis_init");
const userRoutes = require("./Routes/userRoutes");
const transactionRoutes = require("./Routes/transactionRoutes");
const quoteRoutes = require("./Routes/quoteRoutes");
const dumplog = require("./Routes/dumplog");

const app = express();
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.static("public"));
const port = process.env.PORT || 3000;
const dbString =
  process.env.MONGODB_CONNSTRING || "mongodb://localhost:27017/seng468db";

app.get("/daytrading/login", (req, res) => {
  res.render("pages/login", { cache: true });
});

app.get("/daytrading/home", (req, res) => {
  const userID = req.query.userID;
  const balance = req.query.balance;
  res.render("pages/home", {
    userID: userID,
    balance: balance
  });
})

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to DB
mongoose.connect(dbString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
// Test DB connection
const db = mongoose.connection;
mongoose.set('strictQuery', true);
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
  console.log("Connected to MongoDB successfully");
});

app.use("/", userRoutes);
app.use("/", transactionRoutes);
app.use("/", quoteRoutes);
app.use("/", dumplog);
// app.use(transactionRoute1);

app.listen(port, () => console.log(`Server is listening on port ${port}`));
