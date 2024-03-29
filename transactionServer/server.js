// simple localhost server
const express = require("express");
const mongoose = require("mongoose");
const userRoutes = require("./Routes/userRoutes");
const transactionRoutes = require("./Routes/transactionRoutes");
const stockAccountRoutes = require("./Routes/stockAccountRoutes");
const frontEndRoutes = require("./Routes/frontEndRoutes");
const quoteRoutes = require("./Routes/quoteRoutes");
const reservedAccountRoutes = require("./Routes/reservedAccountRoutes");
const dumplog = require("./Routes/dumplog");
const cookieSession = require("cookie-session");

const app = express();
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.static("public"));
app.use(cookieSession({
  name: "session",
  secret: "secret-key",
  maxAge: 24 * 60 * 60 * 1000 // 1 day
}));

const port = process.env.PORT || 3000;
const dbString =
  process.env.MONGODB_CONNSTRING || "mongodb://localhost:27017/seng468db";



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
app.use("/", stockAccountRoutes);
app.use("/", frontEndRoutes);
app.use("/", reservedAccountRoutes);
app.use("/", dumplog);
// app.use(transactionRoute1);

app.listen(port, () => console.log(`Server is listening on port ${port}`));
