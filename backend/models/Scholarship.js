const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const scholarshipSchema = new mongoose.Schema({
  title: { type: String, required: true },
  provider: { type: String, required: true },
  description: { type: String },
  amount: { type: String }, // e.g. "₹50,000" or "Full tuition"
  deadline: { type: Date },
  eligibility: { type: String },
  category: { 
    type: String, 
    enum: ['Merit', 'Need-based', 'Sports', 'Minority', 'International', 'Research', 'Other'],
    default: 'Other'
  },
  applyUrl: { type: String },
  source: { type: String, default: 'buddy4study' },
  scrapedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

scholarshipSchema.plugin(mongoosePaginate);

// Create text index for search
scholarshipSchema.index({ title: 'text', provider: 'text', description: 'text', eligibility: 'text' });

module.exports = mongoose.model('Scholarship', scholarshipSchema);
