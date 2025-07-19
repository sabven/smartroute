const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Get all vehicles - to be implemented' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create vehicle - to be implemented' });
});

router.get('/:id', (req, res) => {
  res.json({ message: `Get vehicle ${req.params.id} - to be implemented` });
});

router.put('/:id', (req, res) => {
  res.json({ message: `Update vehicle ${req.params.id} - to be implemented` });
});

router.delete('/:id', (req, res) => {
  res.json({ message: `Delete vehicle ${req.params.id} - to be implemented` });
});

module.exports = router;