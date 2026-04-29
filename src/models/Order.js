const mongoose = require('mongoose');

const STAGES = ['measured', 'cutting', 'stitching', 'finishing', 'ready'];

const historyEntrySchema = new mongoose.Schema({
  stage:  { type: String, enum: STAGES },
  at:     { type: Date, default: Date.now },
  byName: { type: String },
  byId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  note:   { type: String, default: '' },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  customer:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product:     { type: String, required: true },
  fabric:      { type: String, required: true },
  fabricClass: { type: String },
  stage:       { type: String, enum: STAGES, default: 'measured' },
  stageIndex:  { type: Number, default: 0, min: 0, max: 4 },
  assignedTo:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  dueDate:     { type: Date },
  price:       { type: Number, required: true },
  paid:        { type: Number, default: 0 },
  channel:     { type: String, enum: ['app', 'shop', 'phone'], default: 'app' },
  notes:       { type: String, default: '' },
  history:     [historyEntrySchema],
  images:      [{ type: String }],
  isDeleted:   { type: Boolean, default: false },
}, { timestamps: true });

// Auto-generate order number: SGN-XXXX
orderSchema.pre('save', async function (next) {
  if (this.isNew && !this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `SGN-${String(2600 + count + 1).padStart(4, '0')}`;
  }
  next();
});

// Keep stageIndex in sync with stage
orderSchema.pre('save', function (next) {
  this.stageIndex = STAGES.indexOf(this.stage);
  next();
});

module.exports = mongoose.model('Order', orderSchema);
