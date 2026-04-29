const mongoose = require('mongoose');

const measurementsSchema = new mongoose.Schema({
  chest:    { type: Number },
  shoulder: { type: Number },
  waist:    { type: Number },
  hip:      { type: Number },
  sleeve:   { type: Number },
  neck:     { type: Number },
  inseam:   { type: Number },
  armhole:  { type: Number },
  biceps:   { type: Number },
  thigh:    { type: Number },
  knee:     { type: Number },
  ankle:    { type: Number },
  height:   { type: Number },
  weight:   { type: Number },
}, { _id: false });

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, unique: true, sparse: true },
  email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
  name:        { type: String, default: '' },
  phone:       { type: String, default: '' },
  role:        { type: String, enum: ['admin', 'customer', 'worker'], default: 'customer' },
  initials:    { type: String, default: '' },
  avatar:      { type: String, default: '' },
  measurements: { type: measurementsSchema, default: null },

  // Admin / worker fields
  shopName:    { type: String },
  workerRole:  { type: String },
  load:        { type: Number, default: 0 },

  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

userSchema.pre('save', function (next) {
  if (this.name && !this.initials) {
    this.initials = this.name
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
