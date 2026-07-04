const { body, param } = require('express-validator');

const createProductValidator = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('brand').trim().notEmpty().withMessage('Brand is required'),
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .bail()
    .isFloat({ min: 0 })
    .withMessage('Price cannot be negative'),
  body('stockQuantity')
    .notEmpty()
    .withMessage('Stock quantity is required')
    .bail()
    .isInt({ min: 0 })
    .withMessage('Stock quantity cannot be negative'),
  body('sku').optional().trim().isLength({ min: 3 }).withMessage('SKU must be at least 3 characters'),
  body('imageUrl').optional({ checkFalsy: true }).isURL().withMessage('Product image URL must be valid'),
  body('status')
    .optional()
    .isIn(['Available', 'Out Of Stock'])
    .withMessage('Status must be either "Available" or "Out Of Stock"'),
];

const updateProductValidator = [
  param('id').isMongoId().withMessage('Invalid product ID'),
  body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
  body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
  body('brand').optional().trim().notEmpty().withMessage('Brand cannot be empty'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price cannot be negative'),
  body('stockQuantity').optional().isInt({ min: 0 }).withMessage('Stock quantity cannot be negative'),
  body('sku').optional().trim().isLength({ min: 3 }).withMessage('SKU must be at least 3 characters'),
  body('imageUrl').optional({ checkFalsy: true }).isURL().withMessage('Product image URL must be valid'),
  body('status')
    .optional()
    .isIn(['Available', 'Out Of Stock'])
    .withMessage('Status must be either "Available" or "Out Of Stock"'),
];

const mongoIdParamValidator = [param('id').isMongoId().withMessage('Invalid product ID')];

const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('A valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').optional().isIn(['admin', 'manager']).withMessage('Role must be either admin or manager'),
];

const loginValidator = [
  body('email').trim().isEmail().withMessage('A valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

module.exports = {
  createProductValidator,
  updateProductValidator,
  mongoIdParamValidator,
  registerValidator,
  loginValidator,
};
