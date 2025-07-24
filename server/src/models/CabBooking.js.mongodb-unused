const mongoose = require('mongoose');

const cabBookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
    unique: true,
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  trip: {
    type: {
      type: String,
      enum: ['home_to_office', 'office_to_home'],
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    scheduledTime: {
      type: Date,
      required: true,
    },
  },
  pickup: {
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
    landmark: String,
    contactNumber: String,
  },
  destination: {
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
    officeLocation: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  cab: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
  },
  status: {
    type: String,
    enum: [
      'requested',
      'confirmed',
      'driver_assigned',
      'driver_en_route',
      'driver_arrived',
      'trip_started',
      'trip_completed',
      'cancelled',
      'no_show'
    ],
    default: 'requested',
  },
  timeline: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
    location: {
      latitude: Number,
      longitude: Number,
    },
    notes: String,
  }],
  route: {
    distance: Number, // in kilometers
    duration: Number, // in minutes
    optimizedOrder: Number, // for multiple pickups
  },
  fare: {
    base: Number,
    distance: Number,
    time: Number,
    total: Number,
    currency: {
      type: String,
      default: 'INR',
    },
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    comment: String,
    submittedAt: Date,
  },
  specialRequests: {
    wheelchairAccessible: Boolean,
    acRequired: Boolean,
    extraStops: [String],
    notes: String,
  },
  cancellation: {
    cancelledBy: {
      type: String,
      enum: ['employee', 'driver', 'admin', 'system'],
    },
    reason: String,
    timestamp: Date,
    refundAmount: Number,
  },
  isRecurring: {
    type: Boolean,
    default: false,
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
    },
    daysOfWeek: [Number], // 0-6 (Sunday-Saturday)
    endDate: Date,
  },
}, {
  timestamps: true,
});

cabBookingSchema.index({ employee: 1, 'trip.date': -1 });
cabBookingSchema.index({ company: 1, 'trip.date': -1 });
cabBookingSchema.index({ driver: 1, status: 1 });
cabBookingSchema.index({ bookingId: 1 });
cabBookingSchema.index({ 'pickup.coordinates': '2dsphere' });
cabBookingSchema.index({ 'destination.coordinates': '2dsphere' });

// Generate unique booking ID
cabBookingSchema.pre('save', function(next) {
  if (!this.bookingId) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = Date.now().toString().slice(-6);
    this.bookingId = `SR${dateStr}${timeStr}`;
  }
  next();
});

cabBookingSchema.methods.updateStatus = function(newStatus, notes, location) {
  this.status = newStatus;
  this.timeline.push({
    status: newStatus,
    timestamp: new Date(),
    location: location,
    notes: notes,
  });
  return this.save();
};

cabBookingSchema.methods.assignDriver = function(driverId, cabId) {
  this.driver = driverId;
  this.cab = cabId;
  this.status = 'driver_assigned';
  this.timeline.push({
    status: 'driver_assigned',
    timestamp: new Date(),
    notes: 'Driver and cab assigned',
  });
  return this.save();
};

cabBookingSchema.methods.cancelBooking = function(cancelledBy, reason) {
  this.status = 'cancelled';
  this.cancellation = {
    cancelledBy,
    reason,
    timestamp: new Date(),
  };
  this.timeline.push({
    status: 'cancelled',
    timestamp: new Date(),
    notes: `Cancelled by ${cancelledBy}: ${reason}`,
  });
  return this.save();
};

cabBookingSchema.virtual('isActive').get(function() {
  return !['trip_completed', 'cancelled', 'no_show'].includes(this.status);
});

cabBookingSchema.virtual('canCancel').get(function() {
  if (this.status === 'trip_started' || this.status === 'trip_completed') {
    return false;
  }
  
  // Check if within cancellation window (default 30 minutes)
  const now = new Date();
  const scheduledTime = new Date(this.trip.scheduledTime);
  const diffMinutes = (scheduledTime - now) / (1000 * 60);
  
  return diffMinutes > 30; // Can cancel if more than 30 minutes before pickup
});

module.exports = mongoose.model('CabBooking', cabBookingSchema);