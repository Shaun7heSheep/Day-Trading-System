// simple localhost server
const express = require("express");
// const path = require("path");
const mongoose = require("mongoose");
require("./Redis/redis_init");
const userRoutes = require("./Routes/userRoutes");
const transactionRoutes = require("./Routes/transactionRoutes");
const quoteRoutes = require("./Routes/quoteRoutes");
const dumplog = require("./Routes/dumplog");

const app = express();
app.set("view engine", "ejs");
app.set("views", __dirname + "/views/pages");
app.use(express.static("public"));
const port = process.env.PORT || 3000;
const dbString =
  process.env.MONGODB_CONNSTRING || "mongodb://localhost:27017/seng468db";

app.get("/daytrading/login", (req, res) => {
  res.render("login");
});

app.use(express.json());

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
