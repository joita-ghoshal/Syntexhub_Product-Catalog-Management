const express = require('express');
const authRoutes = require('./authRoutes');
const productRoutes = require('./productRoutes');
const { sendSuccess } = require('../utils/apiResponse');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  return sendSuccess(res, 200, 'Service is healthy', {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/products', productRoutes);

module.exports = router;
