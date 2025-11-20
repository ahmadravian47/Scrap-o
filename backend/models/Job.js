const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema({
  query: { type: String, required: true },
  mustHave: { type: [String], default: [] },
  ratings: { type: [String], default: [] },
  status: { type: String, default: "queued" }, // queued, processing, completed, failed
  results: { type: Array, default: [] },
  error: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Job", JobSchema);
