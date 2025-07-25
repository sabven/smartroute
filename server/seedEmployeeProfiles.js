require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

// Database setup
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: process.env.NODE_ENV === 'production' ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {},
  logging: false // Disable logging for cleaner output
});

// Import models
const createEmployeeProfile = require('./src/models/EmployeeProfile');
const EmployeeProfile = createEmployeeProfile(sequelize);

// User Model (simplified for seeding)
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('employee', 'driver', 'company_admin'),
    defaultValue: 'employee'
  },
  department: DataTypes.STRING,
  employeeId: DataTypes.STRING,
  phone: DataTypes.STRING
});

// Set up associations
User.hasOne(EmployeeProfile, { foreignKey: 'userId', as: 'employeeProfile' });
EmployeeProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Sample employee data
const employeeData = [
  {
    user: {
      email: 'rajesh.kumar@company.com',
      password: 'password123',
      name: 'Rajesh Kumar',
      role: 'employee',
      department: 'Engineering',
      employeeId: 'EMP001',
      phone: '+91 98765 43210'
    },
    profile: {
      firstName: 'Rajesh',
      lastName: 'Kumar',
      department: 'Engineering',
      designation: 'Senior Software Engineer',
      manager: 'Suresh Reddy',
      joinDate: '2022-01-15',
      homeAddress: 'No. 45, 2nd Cross, Malleswaram',
      homeCity: 'Bangalore',
      homeState: 'Karnataka',
      homePostalCode: '560003',
      homeLandmark: 'Near Malleswaram Metro Station',
      officeAddress: 'Manyata Tech Park, Block A, 4th Floor',
      officeCity: 'Bangalore',
      officeState: 'Karnataka',
      officePostalCode: '560045',
      officeLandmark: 'Near Manyata Embassy',
      officeFloor: '4th Floor, Block A',
      emergencyContactName: 'Priya Kumar',
      emergencyContactPhone: '+91 98765 43211',
      emergencyContactRelation: 'spouse',
      preferredPickupTime: '09:00',
      preferredDropTime: '18:30'
    }
  },
  {
    user: {
      email: 'priya.sharma@company.com',
      password: 'password123',
      name: 'Priya Sharma',
      role: 'employee',
      department: 'Marketing',
      employeeId: 'EMP002',
      phone: '+91 98765 43220'
    },
    profile: {
      firstName: 'Priya',
      lastName: 'Sharma',
      department: 'Marketing',
      designation: 'Marketing Manager',
      manager: 'Anil Gupta',
      joinDate: '2021-08-20',
      homeAddress: 'Apartment 3B, Prestige Shantiniketan, Whitefield',
      homeCity: 'Bangalore',
      homeState: 'Karnataka',
      homePostalCode: '560066',
      homeLandmark: 'Near Phoenix MarketCity',
      officeAddress: 'Bagmane Tech Park, Block C, 7th Floor',
      officeCity: 'Bangalore',
      officeState: 'Karnataka',
      officePostalCode: '560093',
      officeLandmark: 'CV Raman Nagar',
      officeFloor: '7th Floor, Block C',
      emergencyContactName: 'Vikram Sharma',
      emergencyContactPhone: '+91 98765 43221',
      emergencyContactRelation: 'sibling',
      preferredPickupTime: '08:45',
      preferredDropTime: '17:45'
    }
  },
  {
    user: {
      email: 'arun.reddy@company.com',
      password: 'password123',
      name: 'Arun Reddy',
      role: 'employee',
      department: 'Finance',
      employeeId: 'EMP003',
      phone: '+91 98765 43230'
    },
    profile: {
      firstName: 'Arun',
      lastName: 'Reddy',
      department: 'Finance',
      designation: 'Financial Analyst',
      manager: 'Meera Iyer',
      joinDate: '2023-03-10',
      homeAddress: 'Villa 12, Brigade Millennium, JP Nagar',
      homeCity: 'Bangalore',
      homeState: 'Karnataka',
      homePostalCode: '560078',
      homeLandmark: 'Near Sarakki Lake',
      officeAddress: 'UB City Mall, Level 3, Vittal Mallya Road',
      officeCity: 'Bangalore',
      officeState: 'Karnataka',
      officePostalCode: '560001',
      officeLandmark: 'Near Cubbon Park',
      officeFloor: 'Level 3',
      emergencyContactName: 'Lakshmi Reddy',
      emergencyContactPhone: '+91 98765 43231',
      emergencyContactRelation: 'parent',
      preferredPickupTime: '09:15',
      preferredDropTime: '18:00'
    }
  },
  {
    user: {
      email: 'meera.iyer@company.com',
      password: 'password123',
      name: 'Meera Iyer',
      role: 'employee',
      department: 'HR',
      employeeId: 'EMP004',
      phone: '+91 98765 43240'
    },
    profile: {
      firstName: 'Meera',
      lastName: 'Iyer',
      department: 'HR',
      designation: 'HR Business Partner',
      manager: 'Rajiv Nair',
      joinDate: '2020-11-05',
      homeAddress: 'Flat 201, Sobha City, Thanisandra',
      homeCity: 'Bangalore',
      homeState: 'Karnataka',
      homePostalCode: '560077',
      homeLandmark: 'Near Manyata Tech Park',
      officeAddress: 'Embassy Golf Links, Block D, 5th Floor',
      officeCity: 'Bangalore',
      officeState: 'Karnataka',
      officePostalCode: '560071',
      officeLandmark: 'Intermediate Ring Road',
      officeFloor: '5th Floor, Block D',
      emergencyContactName: 'Suresh Iyer',
      emergencyContactPhone: '+91 98765 43241',
      emergencyContactRelation: 'spouse',
      preferredPickupTime: '08:30',
      preferredDropTime: '17:30'
    }
  },
  {
    user: {
      email: 'vikash.singh@company.com',
      password: 'password123',
      name: 'Vikash Singh',
      role: 'employee',
      department: 'Engineering',
      employeeId: 'EMP005',
      phone: '+91 98765 43250'
    },
    profile: {
      firstName: 'Vikash',
      lastName: 'Singh',
      department: 'Engineering',
      designation: 'DevOps Engineer',
      manager: 'Suresh Reddy',
      joinDate: '2022-09-12',
      homeAddress: 'PG Accommodation, Koramangala 4th Block',
      homeCity: 'Bangalore',
      homeState: 'Karnataka',
      homePostalCode: '560034',
      homeLandmark: 'Near Forum Mall',
      officeAddress: 'RMZ Ecospace, Block 1A, 6th Floor',
      officeCity: 'Bangalore',
      officeState: 'Karnataka',
      officePostalCode: '560103',
      officeLandmark: 'Sarjapur Road',
      officeFloor: '6th Floor, Block 1A',
      emergencyContactName: 'Rajesh Singh',
      emergencyContactPhone: '+91 98765 43251',
      emergencyContactRelation: 'parent',
      preferredPickupTime: '09:30',
      preferredDropTime: '19:00'
    }
  },
  {
    user: {
      email: 'anita.das@company.com',
      password: 'password123',
      name: 'Anita Das',
      role: 'employee',
      department: 'Operations',
      employeeId: 'EMP006',
      phone: '+91 98765 43260'
    },
    profile: {
      firstName: 'Anita',
      lastName: 'Das',
      department: 'Operations',
      designation: 'Operations Executive',
      manager: 'Kiran Kumar',
      joinDate: '2023-01-25',
      homeAddress: 'House No. 89, HSR Layout Sector 2',
      homeCity: 'Bangalore',
      homeState: 'Karnataka',
      homePostalCode: '560102',
      homeLandmark: 'Near HSR BDA Complex',
      officeAddress: 'Cessna Business Park, Tower A, 8th Floor',
      officeCity: 'Bangalore',
      officeState: 'Karnataka',
      officePostalCode: '560087',
      officeLandmark: 'Kadubeesanahalli',
      officeFloor: '8th Floor, Tower A',
      emergencyContactName: 'Ravi Das',
      emergencyContactPhone: '+91 98765 43261',
      emergencyContactRelation: 'sibling',
      preferredPickupTime: '08:15',
      preferredDropTime: '17:15'
    }
  }
];

async function seedEmployeeProfiles() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    console.log('🔄 Synchronizing models...');
    await sequelize.sync({ alter: true });
    console.log('✅ Models synchronized');

    console.log('🔄 Creating employee profiles...');

    for (const employee of employeeData) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ where: { email: employee.user.email } });
        
        let user;
        if (existingUser) {
          console.log(`⚠️  User ${employee.user.email} already exists, skipping user creation`);
          user = existingUser;
        } else {
          // Hash password
          const hashedPassword = await bcrypt.hash(employee.user.password, 10);
          
          // Create user
          user = await User.create({
            ...employee.user,
            password: hashedPassword
          });
          console.log(`✅ Created user: ${employee.user.name} (${employee.user.email})`);
        }

        // Check if employee profile already exists
        const existingProfile = await EmployeeProfile.findOne({ where: { userId: user.id } });
        
        if (existingProfile) {
          console.log(`⚠️  Employee profile for ${employee.user.name} already exists, skipping`);
          continue;
        }

        // Create employee profile
        const profile = await EmployeeProfile.create({
          userId: user.id,
          employeeId: employee.profile.employeeId || employee.user.employeeId,
          email: user.email,
          phone: user.phone,
          ...employee.profile,
          specialRequests: {
            ac: true,
            wheelchairAccessible: false,
            notes: ''
          },
          profileCompleted: true,
          createdBy: user.id,
          updatedBy: user.id
        });

        console.log(`✅ Created employee profile: ${employee.user.name}`);
        console.log(`   📍 Home: ${employee.profile.homeAddress}, ${employee.profile.homeCity}`);
        console.log(`   🏢 Office: ${employee.profile.officeAddress}, ${employee.profile.officeCity}`);

      } catch (error) {
        console.error(`❌ Error creating profile for ${employee.user.name}:`, error.message);
      }
    }

    console.log('\n🎉 Employee profile seeding completed!');
    console.log('📊 Summary:');
    
    const totalUsers = await User.count({ where: { role: 'employee' } });
    const totalProfiles = await EmployeeProfile.count();
    
    console.log(`   👥 Total employees: ${totalUsers}`);
    console.log(`   📝 Total profiles: ${totalProfiles}`);
    
    console.log('\n📋 Test Login Credentials:');
    employeeData.forEach(emp => {
      console.log(`   📧 ${emp.user.email} | 🔑 password123`);
    });

  } catch (error) {
    console.error('❌ Error seeding employee profiles:', error);
  } finally {
    await sequelize.close();
    console.log('🔐 Database connection closed');
  }
}

// Run the seeding
if (require.main === module) {
  seedEmployeeProfiles();
}

module.exports = seedEmployeeProfiles;