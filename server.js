// simple localhost server
const express = require('express');
const path = require('path');
const mongoose = require("mongoose");
const userRouter = require("./Routes/users")
const transactionRouter = require("./Routes/tracsactions")

const app = express();
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '/index.html'));
});


app.use(express.json());

mongoose.connect('mongodb://localhost:27017/seng468db',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
);

app.use(userRouter);
app.use(transactionRouter);

app.listen(3000, () => console.log('Server is up and running'));




