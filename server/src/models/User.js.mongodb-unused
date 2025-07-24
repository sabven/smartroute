const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ['super_admin', 'company_admin', 'employee', 'driver'],
    default: 'employee',
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
  },
  employeeId: {
    type: String,
    trim: true,
  },
  department: {
    type: String,
    trim: true,
  },
  designation: {
    type: String,
    trim: true,
  },
  homeAddress: {
    address: String,
    landmark: String,
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
    city: String,
    state: String,
    pincode: String,
  },
  emergencyContact: {
    name: String,
    relation: String,
    phone: String,
  },
  preferences: {
    defaultPickupTime: String, // "09:00"
    defaultDropTime: String,   // "18:00"
    acPreference: {
      type: Boolean,
      default: true,
    },
    musicPreference: {
      type: String,
      enum: ['no_preference', 'bollywood', 'classical', 'english', 'regional'],
      default: 'no_preference',
    },
  },
  phone: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
  },
  avatar: {
    type: String,
  },
}, {
  timestamps: true,
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('User', userSchema);