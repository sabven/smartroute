const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const CabBooking = sequelize.define('CabBooking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  employeeId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  driverId: DataTypes.UUID,
  tripType: {
    type: DataTypes.ENUM('home_to_office', 'office_to_home'),
    allowNull: false
  },
  pickupLocation: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  dropLocation: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  scheduledTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  fare: DataTypes.DECIMAL(10, 2),
  specialRequests: DataTypes.TEXT,
  rating: DataTypes.INTEGER,
  feedback: DataTypes.TEXT
}, {
  timestamps: true
});

module.exports = CabBooking;