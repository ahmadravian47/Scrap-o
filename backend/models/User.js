const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
  },
  organizationNumber: {
    type: Number,
    unique: true,
  },
});

const User = mongoose.model("User", userSchema);
module.exports = User;