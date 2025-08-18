const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    imageUrl: { type: String },
    subtotal: { type: Number, required: true }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true,
        required: true,
        default: function () {
            return 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        }
    },

    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customerInfo: {
        email: { type: String, required: true },
        firstname: { type: String, required: true },
        lastname: { type: String, required: true },
        phone: { type: String, required: true }
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

    items: [orderItemSchema],

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

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },

    statusHistory: [{
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        updatedBy: { type: String },
        notes: { type: String }
    }]
});

orderSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

orderSchema.pre('save', function (next) {
    if (this.isModified('orderStatus')) {
        this.statusHistory.push({
            status: this.orderStatus,
            timestamp: new Date(),
            updatedBy: this.updatedBy || 'System'
        });
    }
    next();
});

module.exports = mongoose.model('Order', orderSchema);
