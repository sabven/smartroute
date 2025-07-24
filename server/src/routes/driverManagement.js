const express = require('express');
const { body, validationResult, param } = require('express-validator');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Import middleware
const { uploadDriverDocuments, handleUploadError, deleteFile, getFileInfo } = require('../middleware/fileUpload');
const { actionLogger } = require('../../middleware/logging');

const router = express.Router();

// Import models (will be injected)
let User, DriverProfile;

// Inject models
const injectModels = (models) => {
  User = models.User;
  DriverProfile = models.DriverProfile;
};

// Validation middleware
const validateDriverData = [
  body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2-50 characters'),
  body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').matches(/^[+]?[\d\s\-()]+$/).withMessage('Valid phone number is required'),
  body('dateOfBirth').isDate().withMessage('Valid date of birth is required'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other'),
  body('address').trim().isLength({ min: 10 }).withMessage('Address must be at least 10 characters'),
  body('city').trim().isLength({ min: 2 }).withMessage('City is required'),
  body('state').trim().isLength({ min: 2 }).withMessage('State is required'),
  body('postalCode').trim().isLength({ min: 3 }).withMessage('Valid postal code is required'),
  body('licenseNumber').trim().isLength({ min: 5 }).withMessage('License number is required'),
  body('licenseType').isIn(['light_motor_vehicle', 'heavy_motor_vehicle', 'transport_vehicle', 'motorcycle']).withMessage('Valid license type is required'),
  body('licenseIssueDate').isDate().withMessage('Valid license issue date is required'),
  body('licenseExpiryDate').isDate().withMessage('Valid license expiry date is required'),
  body('licenseIssuingAuthority').trim().isLength({ min: 3 }).withMessage('License issuing authority is required'),
  body('employmentType').isIn(['full_time', 'part_time', 'contract', 'vendor']).withMessage('Valid employment type is required'),
  body('joinDate').isDate().withMessage('Valid join date is required'),
  body('emergencyContactName').trim().isLength({ min: 2 }).withMessage('Emergency contact name is required'),
  body('emergencyContactPhone').matches(/^[+]?[\d\s\-()]+$/).withMessage('Valid emergency contact phone is required'),
  body('emergencyContactRelation').trim().isLength({ min: 2 }).withMessage('Emergency contact relation is required')
];

// GET /api/drivers - List all drivers with pagination and filters
router.get('/', actionLogger('list_drivers'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      vendor,
      employmentType,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where clause
    const whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { licenseNumber: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (status) whereClause.status = status;
    if (vendor) whereClause.vendor = { [Op.iLike]: `%${vendor}%` };
    if (employmentType) whereClause.employmentType = employmentType;

    const { count, rows } = await DriverProfile.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'role'],
        required: false
      }],
      limit: parseInt(limit),
      offset: offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
      attributes: {
        exclude: ['createdBy', 'updatedBy'] // Exclude sensitive fields in list view
      }
    });

    const totalPages = Math.ceil(count / parseInt(limit));

    res.json({
      success: true,
      data: {
        drivers: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalRecords: count,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Error listing drivers:', error);
    res.status(500).json({
      error: 'Failed to retrieve drivers',
      message: error.message
    });
  }
});

// GET /api/drivers/:id - Get specific driver details
router.get('/:id', param('id').isUUID().withMessage('Invalid driver ID'), actionLogger('get_driver'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array()
      });
    }

    const driver = await DriverProfile.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'role']
      }]
    });

    if (!driver) {
      return res.status(404).json({
        error: 'Driver not found'
      });
    }

    res.json({
      success: true,
      data: driver
    });
  } catch (error) {
    console.error('Error getting driver:', error);
    res.status(500).json({
      error: 'Failed to retrieve driver',
      message: error.message
    });
  }
});

// POST /api/drivers - Create new driver
router.post('/', 
  uploadDriverDocuments,
  handleUploadError,
  validateDriverData,
  actionLogger('create_driver'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Log validation errors for debugging
        console.log('Validation errors:', errors.array());
        console.log('Request body:', req.body);
        
        // Clean up uploaded files if validation fails
        if (req.files) {
          Object.values(req.files).flat().forEach(file => {
            deleteFile(file.path);
          });
        }
        
        return res.status(400).json({
          error: 'Validation Error',
          details: errors.array()
        });
      }

      // Check if email or license number already exists
      const existingDriver = await DriverProfile.findOne({
        where: {
          [Op.or]: [
            { email: req.body.email },
            { licenseNumber: req.body.licenseNumber }
          ]
        }
      });

      if (existingDriver) {
        // Clean up uploaded files
        if (req.files) {
          Object.values(req.files).flat().forEach(file => {
            deleteFile(file.path);
          });
        }
        
        return res.status(409).json({
          error: 'Driver already exists',
          message: 'A driver with this email or license number already exists'
        });
      }

      // Create user account first
      const userEmail = req.body.email;
      const defaultPassword = 'driver123'; // Should be generated and sent via email in production
      
      const user = await User.create({
        email: userEmail,
        password: require('bcryptjs').hashSync(defaultPassword, 12),
        name: `${req.body.firstName} ${req.body.lastName}`,
        role: 'driver'
      });

      // Process uploaded files
      const filePaths = {};
      if (req.files) {
        if (req.files.profilePhoto) {
          filePaths.profilePhotoPath = req.files.profilePhoto[0].path;
        }
        if (req.files.licenseCopy) {
          filePaths.licenseCopyPath = req.files.licenseCopy[0].path;
        }
        if (req.files.govIdCopy) {
          filePaths.govIdCopyPath = req.files.govIdCopy[0].path;
        }
        if (req.files.medicalCertificate) {
          filePaths.medicalCertificatePath = req.files.medicalCertificate[0].path;
        }
        if (req.files.backgroundCheck) {
          filePaths.backgroundCheckPath = req.files.backgroundCheck[0].path;
        }
      }

      // Create driver profile
      const driverData = {
        ...req.body,
        userId: user.id,
        ...filePaths,
        createdBy: req.user?.id // Assuming auth middleware sets req.user
      };

      const driver = await DriverProfile.create(driverData);

      // Return created driver (excluding sensitive data)
      const createdDriver = await DriverProfile.findByPk(driver.id, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'role']
        }],
        attributes: {
          exclude: ['createdBy', 'updatedBy']
        }
      });

      res.status(201).json({
        success: true,
        message: 'Driver created successfully',
        data: createdDriver,
        credentials: {
          email: userEmail,
          password: defaultPassword // In production, this should be sent via email
        }
      });
    } catch (error) {
      console.error('Error creating driver:', error);
      
      // Clean up uploaded files in case of error
      if (req.files) {
        Object.values(req.files).flat().forEach(file => {
          deleteFile(file.path);
        });
      }
      
      res.status(500).json({
        error: 'Failed to create driver',
        message: error.message
      });
    }
  }
);

// PUT /api/drivers/:id - Update driver
router.put('/:id',
  param('id').isUUID().withMessage('Invalid driver ID'),
  uploadDriverDocuments,
  handleUploadError,
  validateDriverData,
  actionLogger('update_driver'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Clean up uploaded files if validation fails
        if (req.files) {
          Object.values(req.files).flat().forEach(file => {
            deleteFile(file.path);
          });
        }
        
        return res.status(400).json({
          error: 'Validation Error',
          details: errors.array()
        });
      }

      const driver = await DriverProfile.findByPk(req.params.id);
      if (!driver) {
        // Clean up uploaded files
        if (req.files) {
          Object.values(req.files).flat().forEach(file => {
            deleteFile(file.path);
          });
        }
        
        return res.status(404).json({
          error: 'Driver not found'
        });
      }

      // Check for duplicate email/license (excluding current driver)
      const existingDriver = await DriverProfile.findOne({
        where: {
          [Op.and]: [
            { id: { [Op.ne]: req.params.id } },
            {
              [Op.or]: [
                { email: req.body.email },
                { licenseNumber: req.body.licenseNumber }
              ]
            }
          ]
        }
      });

      if (existingDriver) {
        // Clean up uploaded files
        if (req.files) {
          Object.values(req.files).flat().forEach(file => {
            deleteFile(file.path);
          });
        }
        
        return res.status(409).json({
          error: 'Duplicate data',
          message: 'Another driver with this email or license number already exists'
        });
      }

      // Process new file uploads and handle old files
      const filePaths = {};
      const oldFilesToDelete = [];
      
      if (req.files) {
        if (req.files.profilePhoto) {
          if (driver.profilePhotoPath) oldFilesToDelete.push(driver.profilePhotoPath);
          filePaths.profilePhotoPath = req.files.profilePhoto[0].path;
        }
        if (req.files.licenseCopy) {
          if (driver.licenseCopyPath) oldFilesToDelete.push(driver.licenseCopyPath);
          filePaths.licenseCopyPath = req.files.licenseCopy[0].path;
        }
        if (req.files.govIdCopy) {
          if (driver.govIdCopyPath) oldFilesToDelete.push(driver.govIdCopyPath);
          filePaths.govIdCopyPath = req.files.govIdCopy[0].path;
        }
        if (req.files.medicalCertificate) {
          if (driver.medicalCertificatePath) oldFilesToDelete.push(driver.medicalCertificatePath);
          filePaths.medicalCertificatePath = req.files.medicalCertificate[0].path;
        }
        if (req.files.backgroundCheck) {
          if (driver.backgroundCheckPath) oldFilesToDelete.push(driver.backgroundCheckPath);
          filePaths.backgroundCheckPath = req.files.backgroundCheck[0].path;
        }
      }

      // Update driver profile
      await driver.update({
        ...req.body,
        ...filePaths,
        updatedBy: req.user?.id
      });

      // Delete old files after successful update
      oldFilesToDelete.forEach(filePath => {
        deleteFile(filePath);
      });

      // Return updated driver
      const updatedDriver = await DriverProfile.findByPk(driver.id, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'role']
        }]
      });

      res.json({
        success: true,
        message: 'Driver updated successfully',
        data: updatedDriver
      });
    } catch (error) {
      console.error('Error updating driver:', error);
      
      // Clean up uploaded files in case of error
      if (req.files) {
        Object.values(req.files).flat().forEach(file => {
          deleteFile(file.path);
        });
      }
      
      res.status(500).json({
        error: 'Failed to update driver',
        message: error.message
      });
    }
  }
);

// DELETE /api/drivers/:id - Delete driver (soft delete by changing status)
router.delete('/:id',
  param('id').isUUID().withMessage('Invalid driver ID'),
  actionLogger('delete_driver'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          details: errors.array()
        });
      }

      const driver = await DriverProfile.findByPk(req.params.id);
      if (!driver) {
        return res.status(404).json({
          error: 'Driver not found'
        });
      }

      // Soft delete - change status to terminated
      await driver.update({
        status: 'terminated',
        updatedBy: req.user?.id
      });

      res.json({
        success: true,
        message: 'Driver deactivated successfully'
      });
    } catch (error) {
      console.error('Error deleting driver:', error);
      res.status(500).json({
        error: 'Failed to delete driver',
        message: error.message
      });
    }
  }
);

// GET /api/drivers/:id/documents/:type - Serve uploaded files
router.get('/:id/documents/:type', 
  param('id').isUUID().withMessage('Invalid driver ID'),
  param('type').isIn(['profilePhoto', 'licenseCopy', 'govIdCopy', 'medicalCertificate', 'backgroundCheck']).withMessage('Invalid document type'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          details: errors.array()
        });
      }

      const driver = await DriverProfile.findByPk(req.params.id);
      if (!driver) {
        return res.status(404).json({
          error: 'Driver not found'
        });
      }

      const documentType = req.params.type;
      const fieldName = `${documentType}Path`;
      const filePath = driver[fieldName];

      if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).json({
          error: 'Document not found'
        });
      }

      // Set appropriate content type
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.pdf': 'application/pdf',
        '.webp': 'image/webp'
      };

      const mimeType = mimeTypes[ext] || 'application/octet-stream';
      
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${path.basename(filePath)}"`);
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving document:', error);
      res.status(500).json({
        error: 'Failed to serve document',
        message: error.message
      });
    }
  }
);

// POST /api/drivers/:id/verify - Mark driver as verified
router.post('/:id/verify',
  param('id').isUUID().withMessage('Invalid driver ID'),
  body('documentsVerified').optional().isBoolean(),
  body('backgroundCheckCleared').optional().isBoolean(),
  body('trainingCompleted').optional().isBoolean(),
  actionLogger('verify_driver'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          details: errors.array()
        });
      }

      const driver = await DriverProfile.findByPk(req.params.id);
      if (!driver) {
        return res.status(404).json({
          error: 'Driver not found'
        });
      }

      const updateData = {
        updatedBy: req.user?.id
      };

      if (req.body.documentsVerified !== undefined) {
        updateData.documentsVerified = req.body.documentsVerified;
      }
      if (req.body.backgroundCheckCleared !== undefined) {
        updateData.backgroundCheckCleared = req.body.backgroundCheckCleared;
      }
      if (req.body.trainingCompleted !== undefined) {
        updateData.trainingCompleted = req.body.trainingCompleted;
      }

      await driver.update(updateData);

      res.json({
        success: true,
        message: 'Driver verification status updated successfully',
        data: {
          documentsVerified: driver.documentsVerified,
          backgroundCheckCleared: driver.backgroundCheckCleared,
          trainingCompleted: driver.trainingCompleted
        }
      });
    } catch (error) {
      console.error('Error updating verification status:', error);
      res.status(500).json({
        error: 'Failed to update verification status',
        message: error.message
      });
    }
  }
);

// GET /api/drivers/stats - Get driver statistics
router.get('/dashboard/stats', actionLogger('get_driver_stats'), async (req, res) => {
  try {
    const stats = await Promise.all([
      DriverProfile.count({ where: { status: 'active' } }),
      DriverProfile.count({ where: { status: 'inactive' } }),
      DriverProfile.count({ where: { status: 'suspended' } }),
      DriverProfile.count({ where: { documentsVerified: true } }),
      DriverProfile.count({ where: { backgroundCheckCleared: true } }),
      DriverProfile.count({ where: { trainingCompleted: true } })
    ]);

    const [active, inactive, suspended, documentsVerified, backgroundVerified, trainingCompleted] = stats;
    const total = active + inactive + suspended;

    res.json({
      success: true,
      data: {
        total,
        active,
        inactive,
        suspended,
        verification: {
          documentsVerified,
          backgroundVerified,
          trainingCompleted
        },
        percentages: {
          active: total > 0 ? Math.round((active / total) * 100) : 0,
          verified: total > 0 ? Math.round((documentsVerified / total) * 100) : 0
        }
      }
    });
  } catch (error) {
    console.error('Error getting driver stats:', error);
    res.status(500).json({
      error: 'Failed to get driver statistics',
      message: error.message
    });
  }
});

module.exports = { router, injectModels };