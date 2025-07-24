const mongoose = require('mongoose');

const trackingSchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
  },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  location: {
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
    address: String,
    accuracy: Number,
    heading: Number,
    speed: Number,
    altitude: Number,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
  },
  status: {
    type: String,
    enum: ['moving', 'stopped', 'idle', 'offline'],
    default: 'offline',
  },
  metrics: {
    fuelLevel: {
      type: Number,
      min: 0,
      max: 100,
    },
    engineStatus: {
      type: String,
      enum: ['on', 'off', 'idle'],
      default: 'off',
    },
    temperature: Number,
    odometer: Number,
    batteryLevel: Number,
  },
  alerts: [{
    type: {
      type: String,
      enum: ['speed_violation', 'route_deviation', 'low_fuel', 'maintenance_due', 'panic_button'],
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
    acknowledged: {
      type: Boolean,
      default: false,
    },
  }],
  geofence: {
    entered: [{
      name: String,
      timestamp: Date,
    }],
    exited: [{
      name: String,
      timestamp: Date,
    }],
  },
}, {
  timestamps: true,
});

trackingSchema.index({ vehicle: 1, timestamp: -1 });
trackingSchema.index({ route: 1, timestamp: -1 });
trackingSchema.index({ location: '2dsphere' });
trackingSchema.index({ timestamp: -1 });

trackingSchema.statics.getLatestLocation = function(vehicleId) {
  return this.findOne({ vehicle: vehicleId })
    .sort({ timestamp: -1 })
    .populate('vehicle')
    .populate('driver', 'firstName lastName')
    .exec();
};

trackingSchema.statics.getVehicleHistory = function(vehicleId, startDate, endDate) {
  const query = { vehicle: vehicleId };
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .populate('vehicle')
    .populate('driver', 'firstName lastName')
    .exec();
};

trackingSchema.statics.getActiveVehicles = function() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: fiveMinutesAgo },
        status: { $ne: 'offline' }
      }
    },
    {
      $sort: { timestamp: -1 }
    },
    {
      $group: {
        _id: '$vehicle',
        latestTracking: { $first: '$$ROOT' }
      }
    },
    {
      $replaceRoot: { newRoot: '$latestTracking' }
    },
    {
      $lookup: {
        from: 'vehicles',
        localField: 'vehicle',
        foreignField: '_id',
        as: 'vehicle'
      }
    },
    {
      $unwind: '$vehicle'
    }
  ]);
};

trackingSchema.methods.addAlert = function(alertData) {
  this.alerts.push({
    ...alertData,
    timestamp: new Date(),
  });
  return this.save();
};

trackingSchema.methods.acknowledgeAlert = function(alertId) {
  const alert = this.alerts.id(alertId);
  if (alert) {
    alert.acknowledged = true;
    return this.save();
  }
  throw new Error('Alert not found');
};

module.exports = mongoose.model('Tracking', trackingSchema);