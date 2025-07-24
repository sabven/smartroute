const { execSync } = require('child_process');

const API_BASE_URL = 'http://localhost:5000/api';
const ADMIN_EMAIL = 'admin@techcorp.com';
const ADMIN_PASSWORD = 'admin123';

// First, let's get the driver list to assign them to vehicles
let availableDrivers = [];

// Sample vehicle data with driver assignments
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
    fuel: { level: 85, capacity: 37, type: 'gasoline' },
    features: { ac: true, musicSystem: true, wheelchairAccessible: false, gps: true, dashcam: true }
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
    fuel: { level: 75, capacity: 55, type: 'diesel' },
    features: { ac: true, musicSystem: true, wheelchairAccessible: false, gps: true, dashcam: true }
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
    fuel: { level: 60, capacity: 45, type: 'gasoline' },
    features: { ac: true, musicSystem: true, wheelchairAccessible: false, gps: true, dashcam: false }
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
    fuel: { level: 90, capacity: 42, type: 'gasoline' },
    features: { ac: true, musicSystem: false, wheelchairAccessible: false, gps: true, dashcam: false }
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
    fuel: { level: 70, capacity: 40, type: 'gasoline' },
    features: { ac: true, musicSystem: true, wheelchairAccessible: false, gps: true, dashcam: true }
  }
];

function seedVehicles() {
  try {
    console.log('🚗 Starting vehicle data seeding...');
    
    // First, get auth token
    console.log('🔐 Getting admin authentication token...');
    const loginCmd = `curl -s -X POST "${API_BASE_URL}/auth/login" ` +
      `-H "Content-Type: application/json" ` +
      `-d "{\\"email\\":\\"${ADMIN_EMAIL}\\",\\"password\\":\\"${ADMIN_PASSWORD}\\"}"`;
    
    const loginResult = execSync(loginCmd, { encoding: 'utf8' });
    const loginData = JSON.parse(loginResult);
    
    if (!loginData.token) {
      throw new Error('Failed to get authentication token');
    }
    
    const token = loginData.token;
    console.log('✅ Successfully authenticated as admin');
    
    console.log('🚗 Creating sample vehicles...');
    
    let successCount = 0;
    let failureCount = 0;
    
    // Create each vehicle
    for (const vehicle of sampleVehicles) {
      try {
        const vehicleJson = JSON.stringify(vehicle).replace(/"/g, '\\"');
        const createCmd = `curl -s -X POST "${API_BASE_URL}/vehicles" ` +
          `-H "Content-Type: application/json" ` +
          `-H "Authorization: Bearer ${token}" ` +
          `-d "${vehicleJson}"`;
        
        const result = execSync(createCmd, { encoding: 'utf8' });
        const response = JSON.parse(result);
        
        if (response.success) {
          console.log(`✅ Created vehicle: ${vehicle.name} (${vehicle.licensePlate})`);
          successCount++;
        } else {
          console.log(`❌ Failed to create vehicle ${vehicle.name}: ${response.message || 'Unknown error'}`);
          failureCount++;
        }
      } catch (error) {
        console.log(`❌ Failed to create vehicle ${vehicle.name}:`, error.message);
        failureCount++;
      }
    }
    
    console.log('\n🎉 Vehicle seeding completed!');
    console.log(`📊 Results: ${successCount} created, ${failureCount} failed`);
    
    // Get vehicle stats
    try {
      const statsCmd = `curl -s -X GET "${API_BASE_URL}/vehicles/stats" ` +
        `-H "Authorization: Bearer ${token}"`;
      const statsResult = execSync(statsCmd, { encoding: 'utf8' });
      const statsData = JSON.parse(statsResult);
      
      if (statsData.success) {
        const stats = statsData.data;
        console.log('\n📈 Current Vehicle Statistics:');
        console.log(`Total Vehicles: ${stats.totalVehicles}`);
        console.log(`Active Vehicles: ${stats.activeVehicles}`);
        console.log(`Available Vehicles: ${stats.availableVehicles}`);
        console.log(`Utilization Rate: ${stats.utilizationRate}%`);
      }
    } catch (error) {
      console.log('⚠️ Could not fetch vehicle statistics');
    }
    
    console.log('\n📝 System is now ready with sample data!');
    console.log('✅ 8 Sample Drivers created (Password: driver123)');
    console.log('✅ 5 Sample Vehicles created');
    console.log('\n🎯 Ready to test:');
    console.log('1. Login as admin: admin@techcorp.com / admin123');
    console.log('2. Visit Driver Management page to see drivers');
    console.log('3. Visit Vehicle Management page to see vehicles');
    console.log('4. Assign vehicles to drivers');
    console.log('5. Create bookings and assign driver+vehicle combinations');
    
  } catch (error) {
    console.error('💥 Vehicle seeding failed:', error.message);
  }
}

// Run seeding
seedVehicles();