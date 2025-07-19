const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const authController = require('../controllers/authController');
const {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation
} = require('../utils/validators');

router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/logout', authController.logout);
router.get('/me', auth, authController.getCurrentUser);
router.put('/profile', auth, updateProfileValidation, authController.updateProfile);
router.put('/password', auth, changePasswordValidation, authController.changePassword);

module.exports = router;