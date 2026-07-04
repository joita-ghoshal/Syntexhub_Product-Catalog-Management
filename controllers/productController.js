const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const ApiFeatures = require('../utils/apiFeatures');
const generateSku = require('../utils/generateSku');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * @desc    Create a new product
 * @route   POST /api/v1/products
 * @access  Private
 */
const createProduct = catchAsync(async (req, res) => {
  const body = { ...req.body };

  // Auto-generate a unique SKU if the client did not provide one
  if (!body.sku || body.sku.trim() === '') {
    let sku;
    let exists = true;
    // Ensure the generated SKU is unique (extremely unlikely to collide, but we check anyway)
    while (exists) {
      sku = generateSku(body.name, body.category);
      // eslint-disable-next-line no-await-in-loop
      exists = await Product.exists({ sku });
    }
    body.sku = sku;
  } else {
    const duplicate = await Product.findOne({ sku: body.sku.toUpperCase() });
    if (duplicate) {
      throw ApiError.conflict(`A product with SKU '${body.sku}' already exists`);
    }
  }

  const product = await Product.create(body);
  return sendSuccess(res, 201, 'Product created successfully', product);
});

/**
 * @desc    Get all products with search, filter, sort & pagination
 * @route   GET /api/v1/products
 * @access  Public
 */
const getAllProducts = catchAsync(async (req, res) => {
  const baseQuery = Product.find();

  const features = new ApiFeatures(baseQuery, req.query).search().filter().sort().paginate();

  const [products, total] = await Promise.all([
    features.query,
    Product.countDocuments(
      new ApiFeatures(Product.find(), req.query).search().filter().query.getFilter()
    ),
  ]);

  const { page, limit } = features.pagination;
  const totalPages = Math.ceil(total / limit) || 1;

  return sendSuccess(res, 200, 'Products fetched successfully', products, {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  });
});

/**
 * @desc    Get a single product by ID
 * @route   GET /api/v1/products/:id
 * @access  Public
 */
const getProductById = catchAsync(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, isDeleted: { $ne: true } });

  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  return sendSuccess(res, 200, 'Product fetched successfully', product);
});

/**
 * @desc    Update a product by ID
 * @route   PUT /api/v1/products/:id
 * @access  Private
 */
const updateProduct = catchAsync(async (req, res) => {
  const body = { ...req.body };

  if (body.sku) {
    const duplicate = await Product.findOne({
      sku: body.sku.toUpperCase(),
      _id: { $ne: req.params.id },
    });
    if (duplicate) {
      throw ApiError.conflict(`A product with SKU '${body.sku}' already exists`);
    }
  }

  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, isDeleted: { $ne: true } },
    body,
    { new: true, runValidators: true, context: 'query' }
  );

  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  return sendSuccess(res, 200, 'Product updated successfully', product);
});

/**
 * @desc    Soft-delete a product by ID
 * @route   DELETE /api/v1/products/:id
 * @access  Private
 */
const deleteProduct = catchAsync(async (req, res) => {
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, isDeleted: { $ne: true } },
    { isDeleted: true },
    { new: true }
  );

  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  return sendSuccess(res, 200, 'Product deleted successfully', { id: product._id });
});

/**
 * @desc    Aggregation: total products, per-category counts, avg/min/max price,
 *          out-of-stock count
 * @route   GET /api/v1/products/analytics/summary
 * @access  Private
 */
const getAnalyticsSummary = catchAsync(async (req, res) => {
  const matchStage = { isDeleted: { $ne: true } };

  const [totalProducts, outOfStockCount, priceStats, perCategory] = await Promise.all([
    Product.countDocuments(matchStage),
    Product.countDocuments({ ...matchStage, status: 'Out Of Stock' }),
    Product.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          averagePrice: { $avg: '$price' },
          highestPrice: { $max: '$price' },
          lowestPrice: { $min: '$price' },
        },
      },
    ]),
    Product.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          averagePrice: { $avg: '$price' },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          _id: 0,
          category: '$_id',
          count: 1,
          averagePrice: { $round: ['$averagePrice', 2] },
        },
      },
    ]),
  ]);

  const stats = priceStats[0] || { averagePrice: 0, highestPrice: 0, lowestPrice: 0 };

  return sendSuccess(res, 200, 'Analytics summary generated successfully', {
    totalProducts,
    outOfStockCount,
    averagePrice: Math.round((stats.averagePrice || 0) * 100) / 100,
    highestPrice: stats.highestPrice || 0,
    lowestPrice: stats.lowestPrice || 0,
    productsPerCategory: perCategory,
  });
});

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getAnalyticsSummary,
};
