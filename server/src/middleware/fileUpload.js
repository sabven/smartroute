const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { apiLogger } = require('../../logger');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
const documentsDir = path.join(uploadsDir, 'documents');
const profilesDir = path.join(uploadsDir, 'profiles');

const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
};

// Ensure upload directories exist
ensureDirectoryExists(uploadsDir);
ensureDirectoryExists(documentsDir);
ensureDirectoryExists(profilesDir);

// File type validation
const allowedDocumentTypes = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
  'image/webp': '.webp'
};

const allowedImageTypes = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp'
};

// File size limits (in bytes)
const FILE_SIZE_LIMITS = {
  profilePhoto: 5 * 1024 * 1024, // 5MB
  documents: 10 * 1024 * 1024, // 10MB
  default: 5 * 1024 * 1024 // 5MB
};

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = documentsDir;
    
    // Determine upload path based on field name
    if (file.fieldname === 'profilePhoto') {
      uploadPath = profilesDir;
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueId = uuidv4();
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const filename = `${file.fieldname}_${uniqueId}_${Date.now()}${fileExtension}`;
    
    // Log file upload attempt
    apiLogger.info('File upload attempt', {
      requestId: req.id,
      originalName: file.originalname,
      fieldName: file.fieldname,
      fileName: filename,
      mimeType: file.mimetype,
      size: file.size
    });
    
    cb(null, filename);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  try {
    let allowedTypes = allowedDocumentTypes;
    
    // Special validation for profile photos
    if (file.fieldname === 'profilePhoto') {
      allowedTypes = allowedImageTypes;
    }
    
    if (allowedTypes[file.mimetype]) {
      cb(null, true);
    } else {
      const error = new Error(`Invalid file type for ${file.fieldname}. Allowed types: ${Object.keys(allowedTypes).join(', ')}`);
      error.code = 'INVALID_FILE_TYPE';
      cb(error, false);
    }
  } catch (error) {
    apiLogger.error('File filter error', {
      requestId: req.id,
      error: error.message,
      fileName: file.originalname,
      fieldName: file.fieldname
    });
    cb(error, false);
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.documents, // Default max file size
    files: 10 // Max number of files
  }
});

// Specific upload middleware for different document types
const uploadDriverDocuments = upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'licenseCopy', maxCount: 1 },
  { name: 'govIdCopy', maxCount: 1 },
  { name: 'medicalCertificate', maxCount: 1 },
  { name: 'backgroundCheck', maxCount: 1 }
]);

// Single file upload for profile update
const uploadSingleDocument = (fieldName) => {
  return upload.single(fieldName);
};

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let message = 'File upload error';
    
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File too large. Maximum size allowed is 10MB for documents and 5MB for photos.';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files. Maximum 1 file per document type allowed.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field. Please check the field names.';
        break;
      default:
        message = err.message;
    }
    
    apiLogger.error('Multer upload error', {
      requestId: req.id,
      code: err.code,
      message: err.message
    });
    
    return res.status(400).json({
      error: 'File Upload Error',
      message: message,
      code: err.code
    });
  }
  
  if (err && err.code === 'INVALID_FILE_TYPE') {
    apiLogger.error('Invalid file type error', {
      requestId: req.id,
      message: err.message
    });
    
    return res.status(400).json({
      error: 'Invalid File Type',
      message: err.message
    });
  }
  
  if (err) {
    apiLogger.error('Unexpected upload error', {
      requestId: req.id,
      error: err.message
    });
    
    return res.status(500).json({
      error: 'Upload Error',
      message: 'An unexpected error occurred during file upload.'
    });
  }
  
  next();
};

// Utility function to delete file
const deleteFile = (filePath) => {
  return new Promise((resolve) => {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) {
          apiLogger.error('Error deleting file', {
            filePath,
            error: err.message
          });
        } else {
          apiLogger.info('File deleted successfully', { filePath });
        }
        resolve();
      });
    } else {
      resolve();
    }
  });
};

// Utility function to get file info
const getFileInfo = (file) => {
  if (!file) return null;
  
  return {
    originalName: file.originalname,
    fileName: file.filename,
    path: file.path,
    size: file.size,
    mimeType: file.mimetype,
    uploadDate: new Date()
  };
};

// Validation helper for file requirements
const validateFileRequirements = (files, requirements = {}) => {
  const errors = [];
  const requiredFields = requirements.required || [];
  
  // Check required files
  requiredFields.forEach(field => {
    if (!files[field] || files[field].length === 0) {
      errors.push(`${field} is required`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  uploadDriverDocuments,
  uploadSingleDocument,
  handleUploadError,
  deleteFile,
  getFileInfo,
  validateFileRequirements,
  uploadsDir,
  documentsDir,
  profilesDir,
  FILE_SIZE_LIMITS,
  allowedDocumentTypes,
  allowedImageTypes
};