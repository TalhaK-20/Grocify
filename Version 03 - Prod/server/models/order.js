const Mongoose = require('mongoose');
const { Schema } = Mongoose;

// Enhanced Cart Item Schema with image support
const CartItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product'
  },
  quantity: Number,
  purchasePrice: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    default: 0
  },
  priceWithTax: {
    type: Number,
    default: 0
  },
  totalTax: {
    type: Number,
    default: 0
  },
  // Add image support from Version 1
  imageUrl: { 
    type: String 
  },
  name: { 
    type: String 
  },
  subtotal: { 
    type: Number 
  },
  status: {
    type: String,
    default: 'Not_processed',
    enum: [
      'Not_processed',
      'Processing', 
      'Shipped',
      'Delivered',
      'Cancelled'
    ]
  }
});

// Enhanced Order Schema
const OrderSchema = new Schema({
  // Keep existing fields
  cart: {
    type: Schema.Types.ObjectId,
    ref: 'Cart'
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  total: {
    type: Number,
    default: 0
  },
  
  // Add comprehensive order fields from Version 1
  orderNumber: {
    type: String,
    unique: true,
    required: true,
    default: function () {
      return 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    }
  },

  customerId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  },
  
  customerInfo: {
    email: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phoneNumber: { type: String, required: true }
  },

  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true, default: 'Pakistan' }
  },

  billingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true, default: 'Pakistan' },
    sameAsShipping: { type: Boolean, default: true }
  },

  items: [CartItemSchema],

  subtotal: { type: Number, required: true },
  shippingCost: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },

  paymentMethod: {
    type: String,
    enum: ['COD', 'Online', 'Card'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  orderStatus: {
    type: String,
    enum: ['Order Placed', 'Order Confirmed', 'Order Dispatched', 'Order Delivered', 'Cancelled'],
    default: 'Order Placed'
  },

  trackingNumber: { type: String },
  notes: { type: String },
  adminNotes: { type: String },

  statusHistory: [{
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: String },
    notes: { type: String }
  }],

  updated: Date,
  created: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware
OrderSchema.pre('save', function (next) {
  this.updated = Date.now();
  next();
});

// Status history middleware
OrderSchema.pre('save', function (next) {
  if (this.isModified('orderStatus')) {
    this.statusHistory.push({
      status: this.orderStatus,
      timestamp: new Date(),
      updatedBy: this.updatedBy || 'System'
    });
  }
  next();
});

module.exports = Mongoose.model('Order', OrderSchema);