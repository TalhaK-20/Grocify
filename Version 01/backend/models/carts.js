const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    imageUrl: { type: String },
    addedAt: { type: Date, default: Date.now }
}, { _id: false });

const cartSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    sessionId: { type: String },
    items: [cartItemSchema],
    totalItems: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

cartSchema.pre('save', function (next) {
    this.totalItems = this.items.reduce((total, item) => total + item.quantity, 0);
    this.totalAmount = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    this.updatedAt = Date.now();
    next();
});

cartSchema.methods.addItem = function (itemData) {
    const existingItemIndex = this.items.findIndex(
        item => item.itemId.toString() === itemData.itemId.toString()
    );

    if (existingItemIndex > -1) {
        this.items[existingItemIndex].quantity += itemData.quantity || 1;
    } else {
        this.items.push(itemData);
    }
};

cartSchema.methods.removeItem = function (itemId) {
    this.items = this.items.filter(item => item.itemId.toString() !== itemId.toString());
};

cartSchema.methods.updateQuantity = function (itemId, quantity) {
    const item = this.items.find(item => item.itemId.toString() === itemId.toString());
    if (item) {
        if (quantity <= 0) {
            this.removeItem(itemId);
        } else {
            item.quantity = quantity;
        }
    }
};

module.exports = mongoose.model('Cart', cartSchema);