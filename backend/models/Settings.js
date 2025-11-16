const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  organizationNumber: {
    type: Number,
    required: true,
    unique: true,
  },

  // SMTP
  smtpHost: String,
  smtpPort: Number,
  smtpSecure: Boolean,
  smtpUser: String,
  smtpPass: String,

  // IMAP
  imapHost: String,
  imapPort: Number,
  imapSecure: Boolean,
  imapUser: String,
  imapPass: String,
});

module.exports = mongoose.model("Settings", settingsSchema);
