const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  label: { type: String, required: true },
  value: { type: String, required: true },
  image: { type: String, default: '' },
}, { _id: false });

const schema = new mongoose.Schema({
  category:  { type: String, required: true, index: true },
  label:     { type: String, required: true },
  fieldKey:  { type: String, required: true },
  type:      { type: String, enum: ['select', 'multiselect', 'toggle'], default: 'select' },
  options:   [optionSchema],
  isActive:  { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('CustomizationField', schema);
