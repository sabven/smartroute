const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Get all users - to be implemented' });
});

router.get('/:id', (req, res) => {
  res.json({ message: `Get user ${req.params.id} - to be implemented` });
});

router.put('/:id', (req, res) => {
  res.json({ message: `Update user ${req.params.id} - to be implemented` });
});

router.delete('/:id', (req, res) => {
  res.json({ message: `Delete user ${req.params.id} - to be implemented` });
});

module.exports = router;