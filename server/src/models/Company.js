const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
  },
  officeLocations: [{
    name: {
      type: String,
      required: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
    },
    coordinates: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
    },
    isMain: {
      type: Boolean,
      default: false,
    },
  }],
  settings: {
    bookingWindowHours: {
      type: Number,
      default: 24, // How many hours in advance can employees book
    },
    cancellationWindowMinutes: {
      type: Number,
      default: 30, // How many minutes before pickup can cancel
    },
    operatingHours: {
      start: {
        type: String,
        default: "06:00",
      },
      end: {
        type: String,
        default: "23:00",
      },
    },
    allowWeekendBookings: {
      type: Boolean,
      default: false,
    },
    maxBookingsPerDay: {
      type: Number,
      default: 2, // Home to office and office to home
    },
  },
  subscription: {
    plan: {
      type: String,
      enum: ['trial', 'basic', 'premium', 'enterprise'],
      default: 'trial',
    },
    maxEmployees: {
      type: Number,
      default: 50,
    },
    maxCabs: {
      type: Number,
      default: 10,
    },
    startDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  contactPerson: {
    name: String,
    designation: String,
    email: String,
    phone: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

companySchema.index({ code: 1 });
companySchema.index({ email: 1 });
companySchema.index({ 'officeLocations.coordinates': '2dsphere' });

companySchema.methods.addOfficeLocation = function(locationData) {
  this.officeLocations.push(locationData);
  return this.save();
};

companySchema.virtual('activeEmployees').get(function() {
  return this.model('User').countDocuments({ 
    company: this._id, 
    isActive: true,
    role: 'employee' 
  });
});

companySchema.virtual('activeCabs').get(function() {
  return this.model('Vehicle').countDocuments({ 
    company: this._id, 
    isActive: true 
  });
});

module.exports = mongoose.model('Company', companySchema);