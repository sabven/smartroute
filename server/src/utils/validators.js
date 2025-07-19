const { body } = require('express-validator');

const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'dispatcher', 'driver'])
    .withMessage('Role must be admin, dispatcher, or driver'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const updateProfileValidation = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
];

const vehicleValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Vehicle name must be between 2 and 50 characters'),
  body('type')
    .isIn(['truck', 'van', 'car', 'motorcycle', 'other'])
    .withMessage('Invalid vehicle type'),
  body('licensePlate')
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('License plate must be between 2 and 20 characters'),
  body('make')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Make must be between 2 and 50 characters'),
  body('model')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Model must be between 2 and 50 characters'),
  body('year')
    .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage('Please provide a valid year'),
  body('capacity.weight')
    .isFloat({ min: 0 })
    .withMessage('Weight capacity must be a positive number'),
  body('capacity.volume')
    .isFloat({ min: 0 })
    .withMessage('Volume capacity must be a positive number'),
  body('fuel.capacity')
    .isFloat({ min: 0 })
    .withMessage('Fuel capacity must be a positive number')
];

const routeValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Route name must be between 2 and 100 characters'),
  body('vehicle')
    .isMongoId()
    .withMessage('Valid vehicle ID is required'),
  body('driver')
    .isMongoId()
    .withMessage('Valid driver ID is required'),
  body('stops')
    .isArray({ min: 1 })
    .withMessage('At least one stop is required'),
  body('stops.*.address')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Stop address is required'),
  body('stops.*.coordinates.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Valid latitude is required'),
  body('stops.*.coordinates.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Valid longitude is required')
];

const trackingValidation = [
  body('vehicle')
    .isMongoId()
    .withMessage('Valid vehicle ID is required'),
  body('location.coordinates.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Valid latitude is required'),
  body('location.coordinates.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Valid longitude is required'),
  body('status')
    .optional()
    .isIn(['moving', 'stopped', 'idle', 'offline'])
    .withMessage('Invalid status'),
  body('metrics.fuelLevel')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Fuel level must be between 0 and 100')
];

module.exports = {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
  vehicleValidation,
  routeValidation,
  trackingValidation
};