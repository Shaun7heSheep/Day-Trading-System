const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  userID: {
    type: String,
    required: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
}, { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

module.exports = User;
