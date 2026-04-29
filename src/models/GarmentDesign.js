const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  category:  { type: String, required: true, index: true },
  name:      { type: String, required: true },
  image:     { type: String, default: '' },
  desc:      { type: String, default: '' },
  isActive:  { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('GarmentDesign', schema);
