const mongoose = require('mongoose');
const scrapeJobSchema = new mongoose.Schema({
  query: { type: String, required: true },
  mustHave: { type: [String], default: [] },
  ratings: { type: [String], default: [] },
  status: { type: String, enum: ['pending', 'done', 'failed'], default: 'pending' },
  result: { type: Array, default: [] },
  error: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

scrapeJobSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const ScrapeJob = mongoose.model('ScrapeJob', scrapeJobSchema);
module.exports = ScrapeJob