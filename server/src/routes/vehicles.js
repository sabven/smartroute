const express = require('express');
const { body, validationResult, param } = require('express-validator');
const { actionLogger } = require('../../middleware/logging');

// Export a function that creates the router with injected models
function createVehiclesRouter(models) {
  const router = express.Router();
  const { Vehicle, User, DriverProfile } = models;

// Validation middleware for vehicle data
const validateVehicleData = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Vehicle name must be between 2-100 characters'),
  body('type').isIn(['truck', 'van', 'car', 'motorcycle', 'other']).withMessage('Valid vehicle type is required'),
  body('licensePlate').trim().isLength({ min: 3, max: 20 }).withMessage('License plate must be between 3-20 characters'),
  body('make').trim().isLength({ min: 2, max: 50 }).withMessage('Make must be between 2-50 characters'),
  body('model').trim().isLength({ min: 2, max: 50 }).withMessage('Model must be between 2-50 characters'),
  body('year').isInt({ min: 1990, max: new Date().getFullYear() + 1 }).withMessage('Valid year is required'),
  body('cabNumber').trim().isLength({ min: 2, max: 20 }).withMessage('Cab number must be between 2-20 characters'),
  body('seatingCapacity').isInt({ min: 1, max: 20 }).withMessage('Seating capacity must be between 1-20'),
  body('fuel.capacity').isFloat({ min: 0 }).withMessage('Fuel capacity must be a positive number'),
  body('fuel.type').isIn(['gasoline', 'diesel', 'electric', 'hybrid']).withMessage('Valid fuel type is required'),
];

// GET /api/vehicles - List all vehicles with pagination and filters
router.get('/', actionLogger('list_vehicles'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      type,
      make,
      assignedDriver,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const { Op } = require('sequelize');
    const whereClause = { isActive: true };

    // Build search query
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { licensePlate: { [Op.iLike]: `%${search}%` } },
        { cabNumber: { [Op.iLike]: `%${search}%` } },
        { make: { [Op.iLike]: `%${search}%` } },
        { model: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Apply filters
    if (status) whereClause.status = status;
    if (type) whereClause.type = type;
    if (make) whereClause.make = { [Op.iLike]: `%${make}%` };
    if (assignedDriver === 'true') whereClause.driverId = { [Op.ne]: null };
    if (assignedDriver === 'false') whereClause.driverId = { [Op.is]: null };

    // Get total count for pagination
    const totalVehicles = await Vehicle.count({ where: whereClause });

    // Fetch vehicles with pagination
    const vehicles = await Vehicle.findAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'driver',
        attributes: ['id', 'name', 'email'],
        required: false
      }],
      order: [[sortBy, sortOrder.toUpperCase()]],
      offset: parseInt(offset),
      limit: parseInt(limit)
    });

    // Calculate pagination info
    const totalPages = Math.ceil(totalVehicles / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      data: vehicles,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalVehicles,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vehicles',
      message: error.message
    });
  }
});

// GET /api/vehicles/stats - Get vehicle statistics
router.get('/stats', actionLogger('get_vehicle_stats'), async (req, res) => {
  try {
    const totalVehicles = await Vehicle.countDocuments({ isActive: true });
    const activeVehicles = await Vehicle.countDocuments({ status: 'active', isActive: true });
    const availableVehicles = await Vehicle.countDocuments({ 
      status: 'active', 
      driver: { $exists: false },
      isActive: true 
    });
    const maintenanceVehicles = await Vehicle.countDocuments({ status: 'maintenance', isActive: true });

    // Vehicle type distribution
    const typeDistribution = await Vehicle.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Fuel type distribution
    const fuelDistribution = await Vehicle.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$fuel.type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalVehicles,
        activeVehicles,
        availableVehicles,
        maintenanceVehicles,
        utilizationRate: totalVehicles > 0 ? ((totalVehicles - availableVehicles) / totalVehicles * 100).toFixed(1) : 0,
        typeDistribution,
        fuelDistribution
      }
    });
  } catch (error) {
    console.error('Error fetching vehicle stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vehicle statistics',
      message: error.message
    });
  }
});

// GET /api/vehicles/available - Get available vehicles for assignment
router.get('/available', actionLogger('get_available_vehicles'), async (req, res) => {
  try {
    const availableVehicles = await Vehicle.find({
      status: 'active',
      driver: { $exists: false },
      isActive: true
    }).select('name licensePlate cabNumber make model seatingCapacity features')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: availableVehicles
    });
  } catch (error) {
    console.error('Error fetching available vehicles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available vehicles',
      message: error.message
    });
  }
});

// GET /api/vehicles/:id - Get single vehicle by ID
router.get('/:id', 
  param('id').isMongoId().withMessage('Valid vehicle ID is required'),
  actionLogger('get_vehicle'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          details: errors.array()
        });
      }

      const vehicle = await Vehicle.findOne({ 
        _id: req.params.id, 
        isActive: true 
      }).populate('driver', 'name email phone');

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          error: 'Vehicle not found'
        });
      }

      res.status(200).json({
        success: true,
        data: vehicle
      });
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch vehicle',
        message: error.message
      });
    }
  }
);

// POST /api/vehicles - Create new vehicle
router.post('/', 
  validateVehicleData,
  actionLogger('create_vehicle'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          details: errors.array()
        });
      }

      // Check for duplicate license plate or cab number
      const existingVehicle = await Vehicle.findOne({
        $or: [
          { licensePlate: req.body.licensePlate },
          { cabNumber: req.body.cabNumber }
        ],
        isActive: true
      });

      if (existingVehicle) {
        return res.status(409).json({
          success: false,
          error: 'Vehicle already exists',
          message: 'A vehicle with this license plate or cab number already exists'
        });
      }

      // Handle driver assignment if provided
      let assignedDriverId = null;
      if (req.body.assignedDriver && req.body.assignedDriver.trim() !== '') {
        // Find and validate the driver
        const driver = await DriverProfile.findOne({ 
          userId: req.body.assignedDriver,
          status: 'active'
        }).populate('user', 'id name email');

        if (!driver) {
          return res.status(400).json({
            success: false,
            error: 'Invalid driver assignment',
            message: 'Selected driver not found or not active'
          });
        }

        // Check if driver is already assigned to another vehicle
        const existingAssignment = await Vehicle.findOne({
          driver: driver.user.id,
          isActive: true
        });

        if (existingAssignment) {
          return res.status(409).json({
            success: false,
            error: 'Driver already assigned',
            message: `Driver ${driver.user.name} is already assigned to vehicle ${existingAssignment.name}`
          });
        }

        assignedDriverId = driver.user.id;
      }

      // Create new vehicle
      const vehicleData = {
        ...req.body,
        // Remove assignedDriver from the vehicle data as it's not a direct field
        assignedDriver: undefined,
        // Set the driver field if a driver was assigned
        driver: assignedDriverId,
        // Set default company - you might want to get this from req.user or request body
        company: '60f1b0b0b0b0b0b0b0b0b0b0', // Replace with actual company ID logic
        status: 'active'
      };

      const vehicle = new Vehicle(vehicleData);
      await vehicle.save();

      // Update driver profile with vehicle assignment if driver was assigned
      if (assignedDriverId) {
        await DriverProfile.updateOne(
          { userId: req.body.assignedDriver },
          { assignedVehicleId: vehicle._id }
        );
      }

      // Fetch the created vehicle with driver populated
      const createdVehicle = await Vehicle.findById(vehicle._id)
        .populate('driver', 'name email phone');

      res.status(201).json({
        success: true,
        data: createdVehicle,
        message: 'Vehicle created successfully'
      });
    } catch (error) {
      console.error('Error creating vehicle:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create vehicle',
        message: error.message
      });
    }
  }
);

// PUT /api/vehicles/:id - Update vehicle
router.put('/:id',
  param('id').isMongoId().withMessage('Valid vehicle ID is required'),
  validateVehicleData,
  actionLogger('update_vehicle'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          details: errors.array()
        });
      }

      // Check if vehicle exists
      const existingVehicle = await Vehicle.findOne({ 
        _id: req.params.id, 
        isActive: true 
      });

      if (!existingVehicle) {
        return res.status(404).json({
          success: false,
          error: 'Vehicle not found'
        });
      }

      // Check for duplicate license plate or cab number (excluding current vehicle)
      const duplicateVehicle = await Vehicle.findOne({
        $or: [
          { licensePlate: req.body.licensePlate },
          { cabNumber: req.body.cabNumber }
        ],
        _id: { $ne: req.params.id },
        isActive: true
      });

      if (duplicateVehicle) {
        return res.status(409).json({
          success: false,
          error: 'Vehicle already exists',
          message: 'A vehicle with this license plate or cab number already exists'
        });
      }

      // Handle driver assignment if provided
      let assignedDriverId = existingVehicle.driver; // Keep existing driver by default
      let driverChanged = false;

      if (req.body.hasOwnProperty('assignedDriver')) {
        if (req.body.assignedDriver && req.body.assignedDriver.trim() !== '') {
          // Find and validate the new driver
          const driver = await DriverProfile.findOne({ 
            userId: req.body.assignedDriver,
            status: 'active'
          }).populate('user', 'id name email');

          if (!driver) {
            return res.status(400).json({
              success: false,
              error: 'Invalid driver assignment',
              message: 'Selected driver not found or not active'
            });
          }

          // Check if driver is already assigned to another vehicle (excluding current vehicle)
          const existingAssignment = await Vehicle.findOne({
            driver: driver.user.id,
            _id: { $ne: req.params.id },
            isActive: true
          });

          if (existingAssignment) {
            return res.status(409).json({
              success: false,
              error: 'Driver already assigned',
              message: `Driver ${driver.user.name} is already assigned to vehicle ${existingAssignment.name}`
            });
          }

          assignedDriverId = driver.user.id;
          driverChanged = true;
        } else {
          // Unassign driver
          assignedDriverId = null;
          driverChanged = true;
        }
      }

      // Update vehicle
      const updateData = {
        ...req.body,
        // Remove assignedDriver from the vehicle data as it's not a direct field
        assignedDriver: undefined,
        // Set the driver field
        driver: assignedDriverId,
        updatedAt: new Date()
      };

      const updatedVehicle = await Vehicle.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).populate('driver', 'name email phone');

      // Update driver profiles if driver assignment changed
      if (driverChanged) {
        // Remove vehicle assignment from old driver if there was one
        if (existingVehicle.driver) {
          await DriverProfile.updateOne(
            { userId: existingVehicle.driver },
            { $unset: { assignedVehicleId: 1 } }
          );
        }

        // Add vehicle assignment to new driver if there is one
        if (assignedDriverId) {
          await DriverProfile.updateOne(
            { userId: req.body.assignedDriver },
            { assignedVehicleId: req.params.id }
          );
        }
      }

      res.status(200).json({
        success: true,
        data: updatedVehicle,
        message: 'Vehicle updated successfully'
      });
    } catch (error) {
      console.error('Error updating vehicle:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update vehicle',
        message: error.message
      });
    }
  }
);

// POST /api/vehicles/:id/assign-driver - Assign driver to vehicle
router.post('/:id/assign-driver',
  param('id').isMongoId().withMessage('Valid vehicle ID is required'),
  body('driverId').isUUID().withMessage('Valid driver ID is required'),
  actionLogger('assign_vehicle_driver'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          details: errors.array()
        });
      }

      const { driverId } = req.body;

      // Find vehicle
      const vehicle = await Vehicle.findOne({ 
        _id: req.params.id, 
        isActive: true 
      });

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          error: 'Vehicle not found'
        });
      }

      // Find driver
      const driver = await DriverProfile.findOne({ 
        userId: driverId,
        status: 'active'
      }).populate('user', 'id name email');

      if (!driver) {
        return res.status(404).json({
          success: false,
          error: 'Driver not found or not active'
        });
      }

      // Check if driver is already assigned to another vehicle
      const existingAssignment = await Vehicle.findOne({
        driver: driver.user.id,
        _id: { $ne: req.params.id },
        isActive: true
      });

      if (existingAssignment) {
        return res.status(409).json({
          success: false,
          error: 'Driver already assigned',
          message: 'This driver is already assigned to another vehicle'
        });
      }

      // Assign driver to vehicle
      vehicle.driver = driver.user.id;
      await vehicle.save();

      // Update driver profile with vehicle assignment
      driver.assignedVehicleId = req.params.id;
      await driver.save();

      const updatedVehicle = await Vehicle.findById(req.params.id)
        .populate('driver', 'name email phone');

      res.status(200).json({
        success: true,
        data: updatedVehicle,
        message: 'Driver assigned to vehicle successfully'
      });
    } catch (error) {
      console.error('Error assigning driver to vehicle:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to assign driver to vehicle',
        message: error.message
      });
    }
  }
);

// DELETE /api/vehicles/:id/unassign-driver - Unassign driver from vehicle
router.delete('/:id/unassign-driver',
  param('id').isMongoId().withMessage('Valid vehicle ID is required'),
  actionLogger('unassign_vehicle_driver'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          details: errors.array()
        });
      }

      // Find vehicle
      const vehicle = await Vehicle.findOne({ 
        _id: req.params.id, 
        isActive: true 
      }).populate('driver', 'id name email');

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          error: 'Vehicle not found'
        });
      }

      if (!vehicle.driver) {
        return res.status(400).json({
          success: false,
          error: 'No driver assigned to this vehicle'
        });
      }

      // Update driver profile to remove vehicle assignment
      await DriverProfile.updateOne(
        { userId: vehicle.driver._id },
        { $unset: { assignedVehicleId: 1 } }
      );

      // Remove driver from vehicle
      vehicle.driver = undefined;
      await vehicle.save();

      res.status(200).json({
        success: true,
        message: 'Driver unassigned from vehicle successfully'
      });
    } catch (error) {
      console.error('Error unassigning driver from vehicle:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to unassign driver from vehicle',
        message: error.message
      });
    }
  }
);

// DELETE /api/vehicles/:id - Soft delete vehicle
router.delete('/:id',
  param('id').isMongoId().withMessage('Valid vehicle ID is required'),
  actionLogger('delete_vehicle'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          details: errors.array()
        });
      }

      const vehicle = await Vehicle.findOne({ 
        _id: req.params.id, 
        isActive: true 
      });

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          error: 'Vehicle not found'
        });
      }

      // Check if vehicle is currently assigned to active bookings
      // You might want to add this check based on your booking system

      // Soft delete by setting isActive to false
      vehicle.isActive = false;
      vehicle.status = 'inactive';
      await vehicle.save();

      // If vehicle had an assigned driver, remove the assignment
      if (vehicle.driver) {
        await DriverProfile.updateOne(
          { userId: vehicle.driver },
          { $unset: { assignedVehicleId: 1 } }
        );
      }

      res.status(200).json({
        success: true,
        message: 'Vehicle deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete vehicle',
        message: error.message
      });
    }
  }
);

  return router;
}

module.exports = createVehiclesRouter;