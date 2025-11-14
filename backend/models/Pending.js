const mongoose = require("mongoose");

const PendingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  hashedPassword: { type: String, required: true },
  verificationToken: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now, expires: '1d' } // auto-delete after 1 day
});

module.exports = mongoose.model('Pending', PendingSchema);
