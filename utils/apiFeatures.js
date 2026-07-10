/**
 * A small, reusable query-building helper that chains filtering, searching,
 * sorting, field-limiting and pagination on top of a Mongoose query.
 *
 * Usage:
 *   const features = new ApiFeatures(Product.find(), req.query)
 *     .search()
 *     .filter()
 *     .sort()
 *     .paginate();
 *   const products = await features.query;
 */
class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  // Escape special regex characters to prevent injection
  static escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Case-insensitive search by product name, category or brand
  search() {
    if (this.queryString.search) {
      const safeSearch = ApiFeatures.escapeRegex(this.queryString.search);
      const searchRegex = new RegExp(safeSearch, 'i');
      this.query = this.query.find({
        $or: [{ name: searchRegex }, { category: searchRegex }, { brand: searchRegex }],
      });
    }
    return this;
  }

  // Filtering by category, availability (status) and price range
  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'limit', 'sort', 'fields', 'search'];
    excludedFields.forEach((field) => delete queryObj[field]);

    const mongoFilter = {};

    if (queryObj.category) {
      mongoFilter.category = new RegExp(`^${ApiFeatures.escapeRegex(queryObj.category)}$`, 'i');
    }

    if (queryObj.status) {
      mongoFilter.status = queryObj.status;
    }

    if (queryObj.minPrice || queryObj.maxPrice) {
      mongoFilter.price = {};
      if (queryObj.minPrice) mongoFilter.price.$gte = Number(queryObj.minPrice);
      if (queryObj.maxPrice) mongoFilter.price.$lte = Number(queryObj.maxPrice);
    }

    if (queryObj.brand) {
      mongoFilter.brand = new RegExp(`^${ApiFeatures.escapeRegex(queryObj.brand)}$`, 'i');
    }

    // Only fetch products that have not been soft-deleted
    mongoFilter.isDeleted = { $ne: true };

    this.query = this.query.find(mongoFilter);
    return this;
  }

  // Sorting: name, price, newest, oldest
  sort() {
    const sortMap = {
      name: 'name',
      '-name': '-name',
      price: 'price',
      '-price': '-price',
      newest: '-createdAt',
      oldest: 'createdAt',
    };

    if (this.queryString.sort) {
      const sortKey = sortMap[this.queryString.sort] || '-createdAt';
      this.query = this.query.sort(sortKey);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  paginate() {
    const page = Math.max(parseInt(this.queryString.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(this.queryString.limit, 10) || 10, 1), 100);
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    this.pagination = { page, limit, skip };
    return this;
  }
}

module.exports = ApiFeatures;
