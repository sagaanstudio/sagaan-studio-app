const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  name:  { type: String, required: true },
  price: { type: Number, required: true },
}, { _id: false });

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  category:    { type: String, required: true },
  description: { type: String, default: '' },
  basePrice:   { type: Number, required: true },
  variants:    [variantSchema],
  images:      [{ type: String }],
  itemCode:    { type: String, default: '' },
  isActive:    { type: Boolean, default: true },
  sortOrder:   { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
