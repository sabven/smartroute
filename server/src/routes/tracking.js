const express = require('express');
const router = express.Router();

router.get('/vehicle/:id', (req, res) => {
  res.json({ message: `Get tracking data for vehicle ${req.params.id} - to be implemented` });
});

router.post('/location', (req, res) => {
  res.json({ message: 'Update vehicle location - to be implemented' });
});

router.get('/live/:vehicleId', (req, res) => {
  res.json({ message: `Get live tracking for vehicle ${req.params.vehicleId} - to be implemented` });
});

module.exports = router;