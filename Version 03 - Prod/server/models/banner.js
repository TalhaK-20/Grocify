const mongoose = require('mongoose');
const { Schema } = mongoose;

// Banner Schema
const BannerSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  imageUrl: {
    type: String,
    required: true,
    trim: true
  },
  linkUrl: {
    type: String,
    trim: true,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: null
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
BannerSchema.index({ isActive: 1, displayOrder: 1 });
BannerSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('Banner', BannerSchema);