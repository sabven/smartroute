const axios = require('axios');

const API_BASE_URL = 'http://127.0.0.1:5000/api';

// Admin credentials
const ADMIN_EMAIL = 'admin@techcorp.com';
const ADMIN_PASSWORD = 'admin123';

// First, let's get the driver list to assign them to vehicles
let availableDrivers = [];

// Sample vehicle data with Indian vehicle details
const sampleVehicles = [
  {
    name: 'Swift Dzire - KA01',
    type: 'car',
    licensePlate: 'KA01MN1234',
    make: 'Maruti Suzuki',
    model: 'Swift Dzire',
    year: 2022,
    cabNumber: 'SR001',
    seatingCapacity: 4,
    assignedDriver: '', // Will be filled with actual driver ID
    fuel: {
      level: 85,
      capacity: 37,
      type: 'gasoline'
    },
    features: {
      ac: true,
      musicSystem: true,
      wheelchairAccessible: false,
      gps: true,
      dashcam: true
    }
  },
  {
    name: 'Innova Crysta - KA02',
    type: 'van',
    licensePlate: 'KA02AB5678',
    make: 'Toyota',
    model: 'Innova Crysta',
    year: 2023,
    cabNumber: 'SR002',
    seatingCapacity: 7,
    assignedDriver: '', // Will be filled with actual driver ID
    fuel: {
      level: 75,
      capacity: 55,
      type: 'diesel'
    },
    features: {
      ac: true,
      musicSystem: true,
      wheelchairAccessible: false,
      gps: true,
      dashcam: true
    }
  },
  {
    name: 'Ertiga - KA03',
    type: 'van',
    licensePlate: 'KA03CD9012',
    make: 'Maruti Suzuki',
    model: 'Ertiga',
    year: 2021,
    cabNumber: 'SR003',
    seatingCapacity: 7,
    assignedDriver: '', // Will be filled with actual driver ID
    fuel: {
      level: 60,
      capacity: 45,
      type: 'gasoline'
    },
    features: {
      ac: true,
      musicSystem: true,
      wheelchairAccessible: false,
      gps: true,
      dashcam: false
    }
  },
  {
    name: 'Etios - KA04',
    type: 'car',
    licensePlate: 'KA04EF3456',
    make: 'Toyota',
    model: 'Etios',
    year: 2020,
    cabNumber: 'SR004',
    seatingCapacity: 4,
    assignedDriver: '', // Will be filled with actual driver ID
    fuel: {
      level: 90,
      capacity: 42,
      type: 'gasoline'
    },
    features: {
      ac: true,
      musicSystem: false,
      wheelchairAccessible: false,
      gps: true,
      dashcam: false
    }
  },
  {
    name: 'Verna - KA05',
    type: 'car',
    licensePlate: 'KA05GH7890',
    make: 'Hyundai',
    model: 'Verna',
    year: 2023,
    cabNumber: 'SR005',
    seatingCapacity: 4,
    assignedDriver: '', // Will be filled with actual driver ID
    fuel: {
      level: 70,
      capacity: 40,
      type: 'gasoline'
    },
    features: {
      ac: true,
      musicSystem: true,
      wheelchairAccessible: false,
      gps: true,
      dashcam: true
    }
  },
  {
    name: 'XUV300 - KA06',
    type: 'van',
    licensePlate: 'KA06IJ1357',
    make: 'Mahindra',
    model: 'XUV300',
    year: 2022,
    cabNumber: 'SR006',
    seatingCapacity: 5,
    assignedDriver: '', // Will be filled with actual driver ID
    fuel: {
      level: 80,
      capacity: 42,
      type: 'diesel'
    },
    features: {
      ac: true,
      musicSystem: true,
      wheelchairAccessible: false,
      gps: true,
      dashcam: true
    }
  },
  {
    name: 'City - KA07',
    type: 'car',
    licensePlate: 'KA07KL2468',
    make: 'Honda',
    model: 'City',
    year: 2021,
    cabNumber: 'SR007',
    seatingCapacity: 4,
    assignedDriver: '', // Will be filled with actual driver ID
    fuel: {
      level: 65,
      capacity: 40,
      type: 'gasoline'
    },
    features: {
      ac: true,
      musicSystem: true,
      wheelchairAccessible: false,
      gps: true,
      dashcam: false
    }
  },
  {
    name: 'Creta - KA08',
    type: 'van',
    licensePlate: 'KA08MN3579',
    make: 'Hyundai',
    model: 'Creta',
    year: 2023,
    cabNumber: 'SR008',
    seatingCapacity: 5,
    assignedDriver: '', // Will be filled with actual driver ID
    fuel: {
      level: 55,
      capacity: 50,
      type: 'gasoline'
    },
    features: {
      ac: true,
      musicSystem: true,
      wheelchairAccessible: false,
      gps: true,
      dashcam: true
    }
  }
];

async function seedVehicles() {
  try {
    console.log('🚗 Starting vehicle data seeding via API...');
    
    // Login as admin to get token
    console.log('🔐 Logging in as admin...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    if (!loginResponse.data.token) {
      throw new Error('Failed to get authentication token');
    }

    const token = loginResponse.data.token;
    console.log('✅ Successfully authenticated as admin');

    // Create axios instance with auth header
    const apiClient = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Fetch available drivers first
    console.log('👨‍💼 Fetching available drivers...');
    try {
      const driversResponse = await apiClient.get('/driver-management?status=active');
      if (driversResponse.data.success && driversResponse.data.data && driversResponse.data.data.drivers) {
        availableDrivers = driversResponse.data.data.drivers;
        console.log(`📋 Found ${availableDrivers.length} active drivers`);
      } else {
        console.log('⚠️ No drivers found or invalid response');
        availableDrivers = [];
      }
    } catch (error) {
      console.log('⚠️ Could not fetch drivers, proceeding with vehicles without driver assignment');
      console.log('Error:', error.response?.data || error.message);
      availableDrivers = [];
    }

    // Assign drivers to vehicles (assign only to first 6 vehicles, leave 2 unassigned)
    if (availableDrivers && availableDrivers.length > 0) {
      const driversToAssign = availableDrivers.slice(0, 6);
      for (let i = 0; i < Math.min(sampleVehicles.length - 2, driversToAssign.length); i++) {
        sampleVehicles[i].assignedDriver = driversToAssign[i].userId;
      }
      console.log(`🔗 Assigned drivers to first ${Math.min(sampleVehicles.length - 2, driversToAssign.length)} vehicles`);
    } else {
      console.log('⚠️ No drivers available for assignment, creating vehicles without drivers');
    }

    console.log('🚗 Creating sample vehicles with driver assignments...');
    
    let successCount = 0;
    let failureCount = 0;

    // Create vehicles
    for (const vehicleData of sampleVehicles) {
      try {
        console.log(`Creating vehicle: ${vehicleData.name} with data:`, JSON.stringify(vehicleData, null, 2));
        const response = await apiClient.post('/vehicles', vehicleData);
        
        if (response.data.success) {
          const driverInfo = vehicleData.assignedDriver ? 
            availableDrivers.find(d => d.userId === vehicleData.assignedDriver) : null;
          const driverText = driverInfo ? ` → Driver: ${driverInfo.firstName} ${driverInfo.lastName}` : ' → No driver assigned';
          console.log(`✅ Created vehicle: ${vehicleData.name} (${vehicleData.licensePlate})${driverText}`);
          successCount++;
        } else {
          console.log(`❌ Failed to create vehicle ${vehicleData.name}: ${response.data.message}`);
          failureCount++;
        }
      } catch (error) {
        if (error.response?.status === 409) {
          console.log(`⚠️ Vehicle ${vehicleData.name} already exists, skipping...`);
        } else {
          console.log(`❌ Failed to create vehicle ${vehicleData.name}:`, error.response?.data?.message || error.message);
          failureCount++;
        }
      }
    }

    console.log('\n🎉 Vehicle seeding completed!');
    console.log(`📊 Results: ${successCount} created, ${failureCount} failed`);
    
    // Fetch and display current stats
    try {
      const statsResponse = await apiClient.get('/vehicles/stats');
      if (statsResponse.data.success) {
        const stats = statsResponse.data.data;
        console.log('\n📈 Current Vehicle Statistics:');
        console.log(`Total Vehicles: ${stats.totalVehicles}`);
        console.log(`Active Vehicles: ${stats.activeVehicles}`);
        console.log(`Available Vehicles: ${stats.availableVehicles}`);
        console.log(`Utilization Rate: ${stats.utilizationRate}%`);
      }
    } catch (error) {
      console.log('⚠️ Could not fetch vehicle statistics');
    }

    console.log('\n📝 Next steps:');
    console.log('1. Login as admin: admin@techcorp.com / admin123');
    console.log('2. Go to Vehicle Management page to view vehicles');
    console.log('3. Go to Driver Management page to view drivers');
    console.log('4. Assign vehicles to drivers');
    console.log('5. Test booking assignments with driver+vehicle combinations');

  } catch (error) {
    console.error('💥 Vehicle seeding failed:', error.message);
    if (error.response?.data) {
      console.error('API Error:', error.response.data);
    }
    process.exit(1);
  }
}

// Run seeding
seedVehicles();