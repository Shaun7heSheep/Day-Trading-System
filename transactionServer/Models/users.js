const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
    },
    balance: {
      type: Number,
      default: 0,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);