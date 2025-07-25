const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EmployeeProfile = sequelize.define('EmployeeProfile', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    employeeId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    alternatePhone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    department: {
      type: DataTypes.STRING,
      allowNull: false
    },
    designation: {
      type: DataTypes.STRING,
      allowNull: false
    },
    manager: {
      type: DataTypes.STRING,
      allowNull: true
    },
    joinDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    
    // Home Address
    homeAddress: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    homeCity: {
      type: DataTypes.STRING,
      allowNull: true
    },
    homeState: {
      type: DataTypes.STRING,
      allowNull: true
    },
    homePostalCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    homeCountry: {
      type: DataTypes.STRING,
      defaultValue: 'India',
      allowNull: true
    },
    homeLandmark: {
      type: DataTypes.STRING,
      allowNull: true
    },
    
    // Office Address
    officeAddress: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    officeCity: {
      type: DataTypes.STRING,
      allowNull: true
    },
    officeState: {
      type: DataTypes.STRING,
      allowNull: true
    },
    officePostalCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    officeCountry: {
      type: DataTypes.STRING,
      defaultValue: 'India',
      allowNull: true
    },
    officeLandmark: {
      type: DataTypes.STRING,
      allowNull: true
    },
    officeFloor: {
      type: DataTypes.STRING,
      allowNull: true
    },
    
    // Emergency Contact
    emergencyContactName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emergencyContactPhone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emergencyContactRelation: {
      type: DataTypes.STRING,
      allowNull: true
    },
    
    // Preferences
    preferredPickupTime: {
      type: DataTypes.TIME,
      allowNull: true
    },
    preferredDropTime: {
      type: DataTypes.TIME,
      allowNull: true
    },
    specialRequests: {
      type: DataTypes.JSON,
      defaultValue: {
        ac: true,
        wheelchairAccessible: false,
        notes: ''
      }
    },
    
    // Profile Status
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active',
      allowNull: false
    },
    profileCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    
    // Tracking fields
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
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId']
      },
      {
        unique: true,
        fields: ['employeeId'],
        where: {
          employeeId: {
            [sequelize.Sequelize.Op.ne]: null
          }
        }
      },
      {
        unique: true,
        fields: ['email']
      },
      {
        fields: ['department']
      },
      {
        fields: ['status']
      }
    ]
  });

  return EmployeeProfile;
};