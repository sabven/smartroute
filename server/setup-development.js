require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

console.log('🚀 SmartRoute Development Database Setup');
console.log('=====================================\n');

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

// Import model creators
const createEmployeeProfile = require('./src/models/EmployeeProfile');
const createDriverProfile = require('./src/models/DriverProfile');
const createVehicle = require('./src/models/Vehicle');

// User Model
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

// CabBooking Model
const CabBooking = sequelize.define('CabBooking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  bookingId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  tripType: {
    type: DataTypes.ENUM('home_to_office', 'office_to_home', 'custom'),
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  pickupAddress: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  destinationAddress: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'driver_assigned', 'driver_accepted', 'driver_declined', 'in_progress', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  driverName: DataTypes.STRING,
  driverPhone: DataTypes.STRING,
  cabNumber: DataTypes.STRING,
  cabModel: DataTypes.STRING,
  fare: DataTypes.DECIMAL(10, 2),
  driverId: DataTypes.UUID,
  vehicleId: DataTypes.UUID,
  licensePlate: DataTypes.STRING,
  driverResponse: DataTypes.TEXT,
  driverResponseAt: DataTypes.DATE,
  assignedAt: DataTypes.DATE
});

// Notification Model
const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM('booking_assigned', 'driver_declined', 'driver_accepted', 'booking_created'),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  bookingId: DataTypes.UUID,
  driverId: DataTypes.UUID,
  adminId: DataTypes.UUID,
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  readAt: DataTypes.DATE
});

// Create model instances
const EmployeeProfile = createEmployeeProfile(sequelize);
const DriverProfile = createDriverProfile(sequelize);
const Vehicle = createVehicle(sequelize);

// Set up associations
User.hasOne(DriverProfile, { foreignKey: 'userId', as: 'driverProfile' });
DriverProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(EmployeeProfile, { foreignKey: 'userId', as: 'employeeProfile' });
EmployeeProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Vehicle, { foreignKey: 'driverId', as: 'vehicles' });
Vehicle.belongsTo(User, { foreignKey: 'driverId', as: 'driver' });

CabBooking.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(CabBooking, { foreignKey: 'userId' });

// Sample Data
const adminUsers = [
  {
    email: 'admin@techcorp.com',
    password: 'admin123',
    name: 'System Administrator',
    role: 'company_admin'
  }
];

const demoUsers = [
  {
    email: 'priya@techcorp.com',
    password: 'emp123',
    name: 'Priya Singh',
    role: 'employee',
    department: 'Engineering',
    employeeId: 'EMP999'
  },
  {
    email: 'rajesh@smartroute.com',
    password: 'driver123',
    name: 'Rajesh Kumar',
    role: 'driver',
    phone: '+91-9876543210'
  }
];

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

const driverData = [
  {
    firstName: 'Ravi',
    lastName: 'Kumar',
    email: 'ravi.kumar@smartroute.com',
    phone: '+91 9876543210',
    dateOfBirth: '1985-03-15',
    gender: 'male',
    address: 'No. 45, 2nd Main Road, Indiranagar, Bengaluru',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560038',
    licenseNumber: 'KA0320170001234',
    licenseType: 'light_motor_vehicle',
    licenseIssueDate: '2017-01-10',
    licenseExpiryDate: '2037-01-09',
    licenseIssuingAuthority: 'RTO Bengaluru East',
    employmentType: 'full_time',
    joinDate: '2022-01-15',
    emergencyContactName: 'Lakshmi Kumar',
    emergencyContactPhone: '+91 9876543211',
    emergencyContactRelation: 'Wife'
  },
  {
    firstName: 'Suresh',
    lastName: 'Reddy',
    email: 'suresh.reddy@smartroute.com',
    phone: '+91 9876543220',
    dateOfBirth: '1982-07-22',
    gender: 'male',
    address: '123, 4th Cross, Koramangala 5th Block, Bengaluru',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560095',
    licenseNumber: 'KA0320180002345',
    licenseType: 'light_motor_vehicle',
    licenseIssueDate: '2018-03-15',
    licenseExpiryDate: '2038-03-14',
    licenseIssuingAuthority: 'RTO Bengaluru South',
    employmentType: 'full_time',
    joinDate: '2022-03-01',
    emergencyContactName: 'Padma Reddy',
    emergencyContactPhone: '+91 9876543221',
    emergencyContactRelation: 'Wife'
  },
  {
    firstName: 'Prakash',
    lastName: 'Sharma',
    email: 'prakash.sharma@smartroute.com',
    phone: '+91 9876543230',
    dateOfBirth: '1988-11-08',
    gender: 'male',
    address: '67, 1st Floor, Brigade Road, Richmond Town, Bengaluru',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560025',
    licenseNumber: 'KA0320190003456',
    licenseType: 'light_motor_vehicle',
    licenseIssueDate: '2019-05-20',
    licenseExpiryDate: '2039-05-19',
    licenseIssuingAuthority: 'RTO Bengaluru Central',
    employmentType: 'full_time',
    joinDate: '2022-06-10',
    emergencyContactName: 'Meera Sharma',
    emergencyContactPhone: '+91 9876543231',
    emergencyContactRelation: 'Wife'
  },
  {
    firstName: 'Anand',
    lastName: 'Nair',
    email: 'anand.nair@smartroute.com',
    phone: '+91 9876543240',
    dateOfBirth: '1990-05-12',
    gender: 'male',
    address: '89, 3rd Main, HSR Layout Sector 2, Bengaluru',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560102',
    licenseNumber: 'KA0320200004567',
    licenseType: 'light_motor_vehicle',
    licenseIssueDate: '2020-02-10',
    licenseExpiryDate: '2040-02-09',
    licenseIssuingAuthority: 'RTO Bengaluru HSR',
    employmentType: 'full_time',
    joinDate: '2022-08-15',
    emergencyContactName: 'Priya Nair',
    emergencyContactPhone: '+91 9876543241',
    emergencyContactRelation: 'Wife'
  },
  {
    firstName: 'Rajesh',
    lastName: 'Iyer',
    email: 'rajesh.iyer@smartroute.com',
    phone: '+91 9876543250',
    dateOfBirth: '1987-09-30',
    gender: 'male',
    address: '34, 5th Cross, Jayanagar 4th Block, Bengaluru',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560011',
    licenseNumber: 'KA0320210005678',
    licenseType: 'light_motor_vehicle',
    licenseIssueDate: '2021-01-15',
    licenseExpiryDate: '2041-01-14',
    licenseIssuingAuthority: 'RTO Bengaluru South',
    employmentType: 'part_time',
    joinDate: '2023-01-20',
    emergencyContactName: 'Kavitha Iyer',
    emergencyContactPhone: '+91 9876543251',
    emergencyContactRelation: 'Wife'
  }
];

const vehicleData = [
  {
    name: 'Swift Dzire 1',
    type: 'car',
    licensePlate: 'KA01AB1234',
    cabNumber: 'SR001',
    make: 'Maruti Suzuki',
    model: 'Swift Dzire',
    year: 2022,
    seatingCapacity: 4,
    status: 'active',
    fuel: {
      level: 85,
      capacity: 45,
      type: 'petrol'
    },
    features: {
      ac: true,
      musicSystem: true,
      wheelchairAccessible: false,
      gps: true,
      dashcam: true
    },
    driverEmail: 'ravi.kumar@smartroute.com'
  },
  {
    name: 'Honda City 1',
    type: 'car',
    licensePlate: 'KA01BC2345',
    cabNumber: 'SR002',
    make: 'Honda',
    model: 'City',
    year: 2023,
    seatingCapacity: 4,
    status: 'active',
    fuel: {
      level: 92,
      capacity: 42,
      type: 'petrol'
    },
    features: {
      ac: true,
      musicSystem: true,
      wheelchairAccessible: false,
      gps: true,
      dashcam: true
    },
    driverEmail: 'suresh.reddy@smartroute.com'
  },
  {
    name: 'Hyundai Verna 1',
    type: 'car',
    licensePlate: 'KA01CD3456',
    cabNumber: 'SR003',
    make: 'Hyundai',
    model: 'Verna',
    year: 2022,
    seatingCapacity: 4,
    status: 'active',
    fuel: {
      level: 78,
      capacity: 48,
      type: 'diesel'
    },
    features: {
      ac: true,
      musicSystem: true,
      wheelchairAccessible: false,
      gps: true,
      dashcam: false
    },
    driverEmail: 'prakash.sharma@smartroute.com'
  },
  {
    name: 'Toyota Etios 1',
    type: 'car',
    licensePlate: 'KA01DE4567',
    cabNumber: 'SR004',
    make: 'Toyota',
    model: 'Etios',
    year: 2021,
    seatingCapacity: 4,
    status: 'active',
    fuel: {
      level: 65,
      capacity: 45,
      type: 'petrol'
    },
    features: {
      ac: true,
      musicSystem: false,
      wheelchairAccessible: false,
      gps: true,
      dashcam: false
    },
    driverEmail: 'anand.nair@smartroute.com'
  },
  {
    name: 'Maruti Ciaz 1',
    type: 'car',
    licensePlate: 'KA01EF5678',
    cabNumber: 'SR005',
    make: 'Maruti Suzuki',
    model: 'Ciaz',
    year: 2023,
    seatingCapacity: 4,
    status: 'active',
    fuel: {
      level: 88,
      capacity: 50,
      type: 'petrol'
    },
    features: {
      ac: true,
      musicSystem: true,
      wheelchairAccessible: false,
      gps: true,
      dashcam: true
    },
    driverEmail: 'rajesh.iyer@smartroute.com'
  }
];

async function setupDevelopmentDatabase() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    console.log('🔄 Synchronizing models...');
    await sequelize.sync({ force: true }); // This will drop and recreate tables
    console.log('✅ All tables created successfully');

    console.log('\n📊 Creating sample data...\n');

    // Create admin users
    console.log('👑 Creating admin users...');
    for (const admin of adminUsers) {
      const hashedPassword = await bcrypt.hash(admin.password, 10);
      await User.create({
        ...admin,
        password: hashedPassword
      });
      console.log(`✅ Created admin: ${admin.name}`);
    }

    // Create demo users
    console.log('\n🎭 Creating demo users...');
    for (const demo of demoUsers) {
      const hashedPassword = await bcrypt.hash(demo.password, 10);
      await User.create({
        ...demo,
        password: hashedPassword
      });
      console.log(`✅ Created demo user: ${demo.name} (${demo.role})`);
    }

    // Create employees with profiles
    console.log('\n👥 Creating employees with profiles...');
    for (const employee of employeeData) {
      try {
        // Hash password
        const hashedPassword = await bcrypt.hash(employee.user.password, 10);
        
        // Create user
        const user = await User.create({
          ...employee.user,
          password: hashedPassword
        });

        // Create employee profile
        await EmployeeProfile.create({
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

        console.log(`✅ Created employee: ${employee.user.name}`);
      } catch (error) {
        console.error(`❌ Error creating employee ${employee.user.name}:`, error.message);
      }
    }

    // Create drivers with profiles
    console.log('\n🚗 Creating drivers with profiles...');
    
    // Get admin user for createdBy field
    const adminUser = await User.findOne({ where: { role: 'company_admin' } });
    const adminId = adminUser ? adminUser.id : null;
    
    for (const driver of driverData) {
      try {
        // Create user account
        const hashedPassword = await bcrypt.hash('driver123', 10);
        const user = await User.create({
          email: driver.email,
          password: hashedPassword,
          name: `${driver.firstName} ${driver.lastName}`,
          role: 'driver',
          phone: driver.phone
        });

        // Create driver profile
        await DriverProfile.create({
          ...driver,
          userId: user.id,
          status: 'active',
          bloodGroup: 'O+',
          createdBy: adminId
        });

        console.log(`✅ Created driver: ${driver.firstName} ${driver.lastName}`);
      } catch (error) {
        console.error(`❌ Error creating driver ${driver.firstName} ${driver.lastName}:`, error.message);
      }
    }

    // Create vehicles and assign to drivers
    console.log('\n🚙 Creating vehicles...');
    for (const vehicle of vehicleData) {
      try {
        // Find driver by email
        const driver = await User.findOne({ where: { email: vehicle.driverEmail } });
        
        if (driver) {
          const { driverEmail, ...vehicleDataWithoutEmail } = vehicle;
          await Vehicle.create({
            ...vehicleDataWithoutEmail,
            driverId: driver.id
          });
          console.log(`✅ Created vehicle: ${vehicle.name} (${vehicle.licensePlate}) - Assigned to ${driver.name}`);
        } else {
          console.log(`⚠️  Driver not found for vehicle ${vehicle.name}: ${vehicle.driverEmail}`);
        }
      } catch (error) {
        console.error(`❌ Error creating vehicle ${vehicle.name}:`, error.message);
      }
    }

    // Create sample bookings
    console.log('\n📅 Creating sample bookings...');
    const employees = await User.findAll({ where: { role: 'employee' } });
    const sampleBookings = [
      {
        tripType: 'home_to_office',
        date: '2025-07-26',
        time: '09:00:00',
        pickupAddress: 'No. 45, 2nd Cross, Malleswaram, Bangalore',
        destinationAddress: 'Manyata Tech Park, Block A, 4th Floor, Bangalore',
        status: 'confirmed'
      },
      {
        tripType: 'office_to_home',
        date: '2025-07-26',
        time: '18:00:00',
        pickupAddress: 'Bagmane Tech Park, Block C, 7th Floor, Bangalore',
        destinationAddress: 'Apartment 3B, Prestige Shantiniketan, Whitefield, Bangalore',
        status: 'driver_assigned'
      },
      {
        tripType: 'home_to_office',
        date: '2025-07-27',
        time: '08:30:00',
        pickupAddress: 'Villa 12, Brigade Millennium, JP Nagar, Bangalore',
        destinationAddress: 'UB City Mall, Level 3, Vittal Mallya Road, Bangalore',
        status: 'driver_accepted'
      }
    ];

    for (let i = 0; i < sampleBookings.length && i < employees.length; i++) {
      const booking = sampleBookings[i];
      const employee = employees[i];
      
      await CabBooking.create({
        ...booking,
        bookingId: `SR${Date.now()}${i}`,
        userId: employee.id
      });
      console.log(`✅ Created booking: ${booking.tripType} for ${employee.name}`);
    }

    console.log('\n🎉 Development database setup completed successfully!\n');
    
    // Print summary
    const userCount = await User.count();
    const employeeCount = await User.count({ where: { role: 'employee' } });
    const driverCount = await User.count({ where: { role: 'driver' } });
    const vehicleCount = await Vehicle.count();
    const bookingCount = await CabBooking.count();
    
    console.log('📊 Database Summary:');
    console.log(`   👤 Total Users: ${userCount}`);
    console.log(`   👥 Employees: ${employeeCount}`);
    console.log(`   🚗 Drivers: ${driverCount}`);
    console.log(`   🚙 Vehicles: ${vehicleCount}`);
    console.log(`   📅 Bookings: ${bookingCount}`);
    
    console.log('\n🔐 Login Credentials:');
    console.log('\n📋 Admin Account:');
    console.log('   📧 admin@techcorp.com | 🔑 admin123');
    
    console.log('\n📋 Demo Accounts:');
    console.log('   📧 priya@techcorp.com | 🔑 emp123 (Employee)');
    console.log('   📧 rajesh@smartroute.com | 🔑 driver123 (Driver)');
    
    console.log('\n📋 Employee Accounts (Password: password123):');
    employeeData.forEach((emp, index) => {
      console.log(`   ${index + 1}. 📧 ${emp.user.email} | 🔑 password123`);
    });
    
    console.log('\n📋 Driver Accounts (Password: driver123):');
    driverData.forEach((driver, index) => {
      console.log(`   ${index + 1}. 📧 ${driver.email} | 🔑 driver123`);
    });

    console.log('\n🚀 Ready for development!');
    console.log('💡 Start the server with: npm run dev or node server-postgres-working.js');

  } catch (error) {
    console.error('💥 Setup failed:', error);
  } finally {
    await sequelize.close();
    console.log('🔐 Database connection closed');
  }
}

// Run setup
if (require.main === module) {
  setupDevelopmentDatabase();
}

module.exports = setupDevelopmentDatabase;