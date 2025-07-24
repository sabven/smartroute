require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Sequelize, DataTypes } = require('sequelize');

// Sample driver data with Indian names and Bengaluru addresses
const sampleDrivers = [
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
  },
  {
    firstName: 'Deepak',
    lastName: 'Gupta',
    email: 'deepak.gupta@smartroute.com',
    phone: '+91 9876543260',
    dateOfBirth: '1984-12-18',
    gender: 'male',
    address: '156, 2nd Floor, Commercial Street, Shivaji Nagar, Bengaluru',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560001',
    licenseNumber: 'KA0320160006789',
    licenseType: 'transport_vehicle',
    licenseIssueDate: '2016-11-25',
    licenseExpiryDate: '2036-11-24',
    licenseIssuingAuthority: 'RTO Bengaluru Central',
    employmentType: 'full_time',
    joinDate: '2021-11-10',
    emergencyContactName: 'Sunita Gupta',
    emergencyContactPhone: '+91 9876543261',
    emergencyContactRelation: 'Wife'
  },
  {
    firstName: 'Venkat',
    lastName: 'Rao',
    email: 'venkat.rao@smartroute.com',
    phone: '+91 9876543270',
    dateOfBirth: '1989-04-05',
    gender: 'male',
    address: '78, 6th Main Road, RT Nagar, Bengaluru',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560032',
    licenseNumber: 'KA0320220007890',
    licenseType: 'light_motor_vehicle',
    licenseIssueDate: '2022-06-30',
    licenseExpiryDate: '2042-06-29',
    licenseIssuingAuthority: 'RTO Bengaluru North',
    employmentType: 'full_time',
    joinDate: '2023-02-28',
    emergencyContactName: 'Shanti Rao',
    emergencyContactPhone: '+91 9876543271',
    emergencyContactRelation: 'Mother'
  },
  {
    firstName: 'Krishna',
    lastName: 'Murthy',
    email: 'krishna.murthy@smartroute.com',
    phone: '+91 9876543280',
    dateOfBirth: '1986-08-14',
    gender: 'male',
    address: '92, 1st Cross, Malleswaram 8th Cross, Bengaluru',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560003',
    licenseNumber: 'KA0320180008901',
    licenseType: 'light_motor_vehicle',
    licenseIssueDate: '2018-12-12',
    licenseExpiryDate: '2038-12-11',
    licenseIssuingAuthority: 'RTO Bengaluru North',
    employmentType: 'contract',
    joinDate: '2023-04-01',
    emergencyContactName: 'Radha Murthy',
    emergencyContactPhone: '+91 9876543281',
    emergencyContactRelation: 'Wife'
  }
];

async function seedDrivers() {
  try {
    console.log('🌱 Starting driver data seeding...');
    
    // Setup PostgreSQL connection
    const sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false
    });
    
    await sequelize.authenticate();
    console.log('🔗 Connected to PostgreSQL');
    
    // Create models like in the main server
    const createDriverProfile = require('../models/DriverProfile');
    const DriverProfile = createDriverProfile(sequelize);
    
    const User = sequelize.define('User', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
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
        allowNull: false
      },
      phone: {
        type: DataTypes.STRING
      }
    });
    
    // Sync models
    await sequelize.sync();
    
    // Clear existing sample data
    console.log('🗑️ Clearing existing sample driver data...');
    const { Op } = require('sequelize');
    await User.destroy({ 
      where: { 
        email: { 
          [Op.in]: sampleDrivers.map(d => d.email) 
        } 
      } 
    });

    console.log('👨‍💼 Creating sample drivers...');
    
    // Create drivers
    for (const driverData of sampleDrivers) {
      try {
        // Create user account
        const hashedPassword = await bcrypt.hash('driver123', 12);
        const user = await User.create({
          email: driverData.email,
          password: hashedPassword,
          name: `${driverData.firstName} ${driverData.lastName}`,
          role: 'driver',
          phone: driverData.phone
        });

        // Create driver profile
        await DriverProfile.create({
          ...driverData,
          userId: user.id,
          status: 'active',
          bloodGroup: 'O+', // Default blood group
          createdBy: 'face9c3b-3fb3-4bc8-a227-84630d32cb4d' // Default admin ID
        });

        console.log(`✅ Created driver: ${driverData.firstName} ${driverData.lastName}`);
      } catch (error) {
        console.log(`❌ Failed to create driver ${driverData.firstName} ${driverData.lastName}:`, error.message);
      }
    }

    console.log('\n🎉 Driver seeding completed successfully!');
    console.log(`📊 Processed ${sampleDrivers.length} drivers`);
    console.log('\n📋 Sample Driver Accounts (Password: driver123):');
    sampleDrivers.forEach((driver, index) => {
      console.log(`${index + 1}. ${driver.firstName} ${driver.lastName} - ${driver.email}`);
    });
    
    console.log('\n📝 Next steps:');
    console.log('1. Login as admin: admin@techcorp.com / admin123'); 
    console.log('2. Go to Vehicle Management page');
    console.log('3. Add vehicles manually or use the API');
    console.log('4. Assign vehicles to drivers');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('💥 Driver seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding
seedDrivers();