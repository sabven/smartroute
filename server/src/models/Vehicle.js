const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['truck', 'van', 'car', 'motorcycle', 'other'],
  },
  licensePlate: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  make: {
    type: String,
    required: true,
    trim: true,
  },
  model: {
    type: String,
    required: true,
    trim: true,
  },
  year: {
    type: Number,
    required: true,
    min: 1900,
    max: new Date().getFullYear() + 1,
  },
  capacity: {
    weight: {
      type: Number,
      required: true,
      min: 0,
    },
    volume: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      enum: ['kg', 'tons', 'lbs'],
      default: 'kg',
    },
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  cabNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  seatingCapacity: {
    type: Number,
    required: true,
    min: 1,
    max: 20,
    default: 4,
  },
  features: {
    ac: {
      type: Boolean,
      default: true,
    },
    musicSystem: {
      type: Boolean,
      default: true,
    },
    wheelchairAccessible: {
      type: Boolean,
      default: false,
    },
    gps: {
      type: Boolean,
      default: true,
    },
    dashcam: {
      type: Boolean,
      default: false,
    },
  },
  documents: {
    rcNumber: String,
    insuranceNumber: String,
    pucCertificate: String,
    permitNumber: String,
    rcExpiry: Date,
    insuranceExpiry: Date,
    pucExpiry: Date,
    permitExpiry: Date,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'en_route'],
    default: 'inactive',
  },
  location: {
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  fuel: {
    level: {
      type: Number,
      min: 0,
      max: 100,
      default: 100,
    },
    capacity: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ['gasoline', 'diesel', 'electric', 'hybrid'],
      default: 'gasoline',
    },
  },
  maintenance: {
    lastService: Date,
    nextService: Date,
    mileage: {
      type: Number,
      default: 0,
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

vehicleSchema.index({ location: '2dsphere' });

vehicleSchema.methods.updateLocation = function(latitude, longitude, address) {
  this.location = {
    coordinates: { latitude, longitude },
    address: address || this.location.address,
    lastUpdated: new Date(),
  };
  return this.save();
};

vehicleSchema.methods.updateFuelLevel = function(level) {
  this.fuel.level = Math.max(0, Math.min(100, level));
  return this.save();
};

vehicleSchema.virtual('fuelPercentage').get(function() {
  return this.fuel.level;
});

module.exports = mongoose.model('Vehicle', vehicleSchema);