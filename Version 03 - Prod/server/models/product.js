const Mongoose = require('mongoose');
const slug = require('mongoose-slug-generator');
const { Schema } = Mongoose;

const options = {
  separator: '-',
  lang: 'en',
  truncate: 120
};

Mongoose.plugin(slug, options);

// Image schema for Google Drive images
const imageSchema = new Schema({
  id: { type: String },
  url: { type: String }
}, { _id: false });

// Product Schema
const ProductSchema = new Schema({
  sku: {
    type: String
  },
  name: {
    type: String,
    trim: true
  },
  slug: {
    type: String,
    slug: 'name',
    unique: true
  },
  // Keep existing imageUrl and imageKey for backward compatibility
  imageUrl: {
    type: String
  },
  imageKey: {
    type: String
  },
  // Add Google Drive support from Version 1
  images: { 
    type: [imageSchema], 
    default: [] 
  },
  googleDriveId: { 
    type: String 
  },
  fileUrl: { 
    type: String 
  },
  description: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number
  },
  price: {
    type: Number
  },
  // Add support for sale price from Version 1
  salePrice: {
    type: Number
  },
  taxable: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  brand: {
    type: Schema.Types.ObjectId,
    ref: 'Brand',
    default: null
  },
  // Add additional fields from Version 1
  stockStatus: { 
    type: String, 
    enum: ['In Stock', 'Out of Stock'], 
    default: 'In Stock' 
  },
  stockQuantity: { 
    type: Number, 
    default: 0 
  },
  weight: { 
    type: String 
  },
  dimensions: {
    length: { type: Number },
    width: { type: Number },
    height: { type: Number }
  },
  updated: Date,
  created: {
    type: Date,
    default: Date.now
  },
  // Keep timestamp for compatibility
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = Mongoose.model('Product', ProductSchema);