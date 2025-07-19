const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
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
  estimatedArrival: Date,
  actualArrival: Date,
  estimatedDeparture: Date,
  actualDeparture: Date,
  status: {
    type: String,
    enum: ['pending', 'arrived', 'completed', 'skipped'],
    default: 'pending',
  },
  notes: String,
  deliveryInstructions: String,
  contactInfo: {
    name: String,
    phone: String,
    email: String,
  },
});

const routeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  stops: [stopSchema],
  startLocation: {
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
  },
  endLocation: {
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
  },
  status: {
    type: String,
    enum: ['draft', 'planned', 'active', 'completed', 'cancelled'],
    default: 'draft',
  },
  scheduledStart: Date,
  actualStart: Date,
  scheduledEnd: Date,
  actualEnd: Date,
  optimization: {
    isOptimized: {
      type: Boolean,
      default: false,
    },
    algorithm: {
      type: String,
      enum: ['nearest_neighbor', 'genetic', 'manual'],
      default: 'manual',
    },
    optimizedAt: Date,
  },
  metrics: {
    totalDistance: Number,
    estimatedDuration: Number,
    actualDuration: Number,
    fuelConsumption: Number,
    cost: Number,
    efficiency: Number,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

routeSchema.index({ vehicle: 1, status: 1 });
routeSchema.index({ driver: 1, status: 1 });
routeSchema.index({ createdAt: -1 });

routeSchema.methods.addStop = function(stopData) {
  this.stops.push(stopData);
  return this.save();
};

routeSchema.methods.updateStopStatus = function(stopIndex, status, actualTime) {
  if (this.stops[stopIndex]) {
    this.stops[stopIndex].status = status;
    if (status === 'arrived') {
      this.stops[stopIndex].actualArrival = actualTime || new Date();
    } else if (status === 'completed') {
      this.stops[stopIndex].actualDeparture = actualTime || new Date();
    }
    return this.save();
  }
  throw new Error('Stop not found');
};

routeSchema.methods.startRoute = function() {
  this.status = 'active';
  this.actualStart = new Date();
  return this.save();
};

routeSchema.methods.completeRoute = function() {
  this.status = 'completed';
  this.actualEnd = new Date();
  if (this.actualStart) {
    this.metrics.actualDuration = this.actualEnd - this.actualStart;
  }
  return this.save();
};

routeSchema.virtual('completedStops').get(function() {
  return this.stops.filter(stop => stop.status === 'completed').length;
});

routeSchema.virtual('totalStops').get(function() {
  return this.stops.length;
});

routeSchema.virtual('progress').get(function() {
  if (this.totalStops === 0) return 0;
  return (this.completedStops / this.totalStops) * 100;
});

module.exports = mongoose.model('Route', routeSchema);