const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    id: { type: String },
    url: { type: String }
}, { _id: false });

const itemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    images: { type: [imageSchema], default: [] },
    googleDriveId: { type: String },
    fileUrl: { type: String },
    regularPrice: { type: Number, required: true },
    salePrice: { type: Number },
    stockStatus: { type: String, enum: ['In Stock', 'Out of Stock'], default: 'In Stock' },
    stockQuantity: { type: Number, default: 0 },
    weight: { type: String },
    dimensions: {
        length: { type: Number },
        width: { type: Number },
        height: { type: Number }
    },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Item', itemSchema);
