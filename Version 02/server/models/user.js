const Mongoose = require('mongoose');

const { ROLES, EMAIL_PROVIDER } = require('../constants');

const { Schema } = Mongoose;

// Address schema for structured addresses
const addressSchema = new Schema({
  street: { type: String },
  city: { type: String },
  state: { type: String },
  zipCode: { type: String },
  country: { type: String, default: 'Pakistan' }
}, { _id: false });

// User Schema
const UserSchema = new Schema({
  email: {
    type: String,
    required: () => {
      return this.provider !== 'email' ? false : true;
    }
  },
  phoneNumber: {
    type: String
  },
  firstName: {
    type: String
  },
  lastName: {
    type: String
  },
  password: {
    type: String
  },
  merchant: {
    type: Schema.Types.ObjectId,
    ref: 'Merchant',
    default: null
  },
  provider: {
    type: String,
    required: true,
    default: EMAIL_PROVIDER.Email
  },
  googleId: {
    type: String
  },
  facebookId: {
    type: String
  },
  avatar: {
    type: String
  },
  // Add profile image support from Version 1
  profileImageUrl: { 
    type: String 
  },
  // Add address support from Version 1
  address: { 
    type: String 
  }, // Keep for backward compatibility
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
  gender: { 
    type: String 
  },
  role: {
    type: String,
    default: ROLES.Member,
    enum: [ROLES.Admin, ROLES.Member, ROLES.Merchant]
  },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  updated: Date,
  created: {
    type: Date,
    default: Date.now
  }
});

// Add utility method for address parsing from Version 1
UserSchema.methods.parseAddress = function (addressString) {
  const parts = addressString.split(',').map(part => part.trim());
  return {
    street: parts[0] || addressString,
    city: parts[1] || '',
    state: parts[2] || '',
    zipCode: parts[3] || '',
    country: 'Pakistan'
  };
};

// Add virtual for full name from Version 1
UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});
module.exports = Mongoose.model('User', UserSchema);