const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  street: { type: String },
  city: { type: String },
  state: { type: String },
  zipCode: { type: String },
  country: { type: String, default: 'Pakistan' }
}, { _id: false });

const customerSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  phone: { type: String, required: true },

  address: { type: String, required: true }, // Keep original for backward compatibility
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
  gender: { type: String},
  profileImageUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

customerSchema.methods.parseAddress = function (addressString) {
  const parts = addressString.split(',').map(part => part.trim());
  return {
    street: parts[0] || addressString,
    city: parts[1] || '',
    state: parts[2] || '',
    zipCode: parts[3] || '',
    country: 'Pakistan'
  };
};

customerSchema.virtual('fullName').get(function () {
  return `${this.firstname} ${this.lastname}`;
});

module.exports = mongoose.model('Customer', customerSchema);
