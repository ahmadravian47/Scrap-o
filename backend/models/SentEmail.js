const mongoose = require("mongoose");

const sentEmailSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,

  organizationNumber: {
    type: Number,
    required: true
  },

  to: String,
  subject: String,
  body: String,

  // tracking fields
  openCount: { type: Number, default: 0 },
  openedAt: { type: Date, default: null },
  sentAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("SentEmail", sentEmailSchema);
