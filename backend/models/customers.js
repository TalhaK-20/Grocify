const mongoose = require('mongoose')

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  images: [{
    id: String,           // Google Drive file ID
    url: String,          // Public URL
    originalName: String,
    isCover: { type: Boolean, default: false }
  }],
  googleDriveId: String,  // Primary file ID (main)
  fileUrl: String,        // Primary file URL (main)
  regularPrice: { type: Number, required: true },
  salePrice: Number,
  stockStatus: { type: String, enum: ['In Stock', 'Out of Stock'], default: 'In Stock' },
  stockQuantity: { type: Number, default: 0 },
  weight: String,
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  }
}, {
  timestamps: true
});