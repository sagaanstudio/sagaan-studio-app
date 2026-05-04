const mongoose = require('mongoose');

const ALL_STATUSES = [
  'pending_payment',  // user order awaiting 50% advance
  'pending_approval', // 50% paid, admin must approve
  'approved',         // admin approved (or walk-in order)
  'assigned',         // karigar assigned
  'cutting',          // production: cutting
  'stitching',        // production: stitching
  'finishing',        // production: finishing
  'ready',            // ready for pickup
  'delivered',        // delivered to customer
  'rejected',         // admin rejected
];

const STATUS_INDEX = {};
ALL_STATUSES.forEach((s, i) => { STATUS_INDEX[s] = i; });

const historyEntrySchema = new mongoose.Schema({
  status: { type: String },
  at:     { type: Date, default: Date.now },
  byName: { type: String },
  byId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  note:   { type: String, default: '' },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber:     { type: String, unique: true },
  customer:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product:         { type: String, default: 'Custom Order' },
  garmentCategory: { type: String, default: '' },
  garmentDesign:   { type: String, default: '' },
  customizations:  { type: mongoose.Schema.Types.Mixed, default: {} },
  fabric:          { type: String, default: '' },
  fabricClass:     { type: String, default: '' },

  // Unified status (replaces stage + stageIndex)
  status:          { type: String, enum: ALL_STATUSES, default: 'pending_payment' },

  assignedTo:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  dueDate:         { type: Date },
  stitchingNotes:  { type: String, default: '' },
  price:           { type: Number, default: 0 },
  paid:            { type: Number, default: 0 },
  channel:         { type: String, enum: ['app', 'shop', 'phone'], default: 'app' },
  notes:           { type: String, default: '' },
  history:         [historyEntrySchema],
  images:          [{ type: String }],

  // Approval fields
  approvedAt:      { type: Date },
  approvedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectedAt:      { type: Date },
  rejectedReason:  { type: String, default: '' },

  isDeleted:       { type: Boolean, default: false },
}, { timestamps: true });

// Auto-generate order number SGN-XXXX
orderSchema.pre('save', async function (next) {
  if (this.isNew && !this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `SGN-${String(2600 + count + 1).padStart(4, '0')}`;
  }
  next();
});

// Virtual: statusIndex for progression tracking
orderSchema.virtual('statusIndex').get(function () {
  return STATUS_INDEX[this.status] ?? 0;
});

// Backward compat: keep stage as alias for status for old code
orderSchema.virtual('stage').get(function () {
  return this.status;
});
orderSchema.virtual('stageIndex').get(function () {
  return STATUS_INDEX[this.status] ?? 0;
});

orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Order', orderSchema);
module.exports.ALL_STATUSES = ALL_STATUSES;
module.exports.STATUS_INDEX = STATUS_INDEX;
