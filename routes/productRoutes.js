const express = require('express');
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getAnalyticsSummary,
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const {
  createProductValidator,
  updateProductValidator,
  mongoIdParamValidator,
} = require('../middleware/validators');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

// Public routes
router.get('/', getAllProducts);
router.get('/analytics/summary', protect, getAnalyticsSummary);
router.get('/:id', mongoIdParamValidator, validateRequest, getProductById);

// Protected routes (require valid JWT)
router.post('/', protect, createProductValidator, validateRequest, createProduct);
router.put('/:id', protect, updateProductValidator, validateRequest, updateProduct);
router.delete('/:id', protect, mongoIdParamValidator, validateRequest, deleteProduct);

module.exports = router;
