const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Vehicle = sequelize.define('Vehicle', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    type: {
      type: DataTypes.ENUM('truck', 'van', 'car', 'motorcycle', 'other'),
      allowNull: false
    },
    licensePlate: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [3, 20]
      }
    },
    make: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 50]
      }
    },
    model: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 50]
      }
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1990,
        max: new Date().getFullYear() + 1
      }
    },
    cabNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [2, 20]
      }
    },
    seatingCapacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 4,
      validate: {
        min: 1,
        max: 20
      }
    },
    // Features stored as JSON
    features: {
      type: DataTypes.JSON,
      defaultValue: {
        ac: true,
        musicSystem: true,
        wheelchairAccessible: false,
        gps: true,
        dashcam: false
      }
    },
    // Fuel information stored as JSON
    fuel: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {
        level: 100,
        capacity: 50,
        type: 'gasoline'
      }
    },
    // Documents stored as JSON
    documents: {
      type: DataTypes.JSON,
      defaultValue: {
        rcNumber: null,
        insuranceNumber: null,
        pucCertificate: null,
        permitNumber: null,
        rcExpiry: null,
        insuranceExpiry: null,
        pucExpiry: null,
        permitExpiry: null
      }
    },
    // Location stored as JSON
    location: {
      type: DataTypes.JSON,
      defaultValue: {
        address: null,
        coordinates: {
          latitude: null,
          longitude: null
        },
        lastUpdated: new Date()
      }
    },
    // Maintenance stored as JSON
    maintenance: {
      type: DataTypes.JSON,
      defaultValue: {
        lastService: null,
        nextService: null,
        mileage: 0
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'maintenance', 'en_route'),
      defaultValue: 'active'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    // Foreign key for company (UUID)
    companyId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    // Foreign key for driver (UUID)
    driverId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    tableName: 'vehicles',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['licensePlate']
      },
      {
        unique: true,
        fields: ['cabNumber']
      },
      {
        fields: ['status']
      },
      {
        fields: ['type']
      },
      {
        fields: ['driverId']
      }
    ]
  });

  // Instance methods
  Vehicle.prototype.updateLocation = function(latitude, longitude, address) {
    this.location = {
      coordinates: { latitude, longitude },
      address: address || this.location.address,
      lastUpdated: new Date()
    };
    return this.save();
  };

  Vehicle.prototype.updateFuelLevel = function(level) {
    this.fuel = {
      ...this.fuel,
      level: Math.max(0, Math.min(100, level))
    };
    return this.save();
  };

  // Associations are defined in the main server file

  return Vehicle;
};