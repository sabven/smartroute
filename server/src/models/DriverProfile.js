const { DataTypes } = require('sequelize');

const DriverProfile = (sequelize) => {
  return sequelize.define('DriverProfile', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    // Basic Information
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    employeeId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 50]
      }
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 50]
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        is: /^[+]?[\d\s-()]+$/
      }
    },
    alternatePhone: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        is: /^[+]?[\d\s-()]+$/
      }
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
        isBefore: new Date().toISOString().split('T')[0] // Must be before today
      }
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      allowNull: false
    },
    
    // Address Information
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    postalCode: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'India'
    },
    
    // License Information
    licenseNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    licenseType: {
      type: DataTypes.ENUM('light_motor_vehicle', 'heavy_motor_vehicle', 'transport_vehicle', 'motorcycle'),
      allowNull: false
    },
    licenseIssueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true
      }
    },
    licenseExpiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
        isAfter: new Date().toISOString().split('T')[0] // Must be in future
      }
    },
    licenseIssuingAuthority: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    
    // Employment Information
    vendor: {
      type: DataTypes.STRING,
      allowNull: true // Can be direct employee or from vendor
    },
    vendorContactPerson: {
      type: DataTypes.STRING,
      allowNull: true
    },
    vendorContactPhone: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        is: /^[+]?[\d\s-()]+$/
      }
    },
    employmentType: {
      type: DataTypes.ENUM('full_time', 'part_time', 'contract', 'vendor'),
      allowNull: false,
      defaultValue: 'full_time'
    },
    joinDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true
      }
    },
    salary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    
    // Vehicle Assignment
    assignedVehicleId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    
    // Status and Performance
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended', 'terminated'),
      allowNull: false,
      defaultValue: 'active'
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 5
      }
    },
    totalRides: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    totalDistance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    
    // Emergency Contact
    emergencyContactName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    emergencyContactPhone: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        is: /^[+]?[\d\s-()]+$/
      }
    },
    emergencyContactRelation: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    
    // Medical Information
    bloodGroup: {
      type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
      allowNull: true
    },
    medicalConditions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    lastMedicalCheckup: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: true
      }
    },
    medicalCertificateExpiry: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: true
      }
    },
    
    // Document Paths
    profilePhotoPath: {
      type: DataTypes.STRING,
      allowNull: true
    },
    licenseCopyPath: {
      type: DataTypes.STRING,
      allowNull: true
    },
    govIdCopyPath: {
      type: DataTypes.STRING,
      allowNull: true
    },
    medicalCertificatePath: {
      type: DataTypes.STRING,
      allowNull: true
    },
    backgroundCheckPath: {
      type: DataTypes.STRING,
      allowNull: true
    },
    
    // Additional Information
    experience: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0
      }
    },
    languages: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: ['English']
    },
    specialSkills: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Verification Status
    documentsVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    backgroundCheckCleared: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    trainingCompleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    
    // Metadata
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    tableName: 'driver_profiles',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['licenseNumber']
      },
      {
        fields: ['status']
      },
      {
        fields: ['vendor']
      },
      {
        fields: ['assignedVehicleId']
      }
    ]
  });
};

module.exports = DriverProfile;