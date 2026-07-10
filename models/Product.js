const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters long'],
      maxlength: [150, 'Product name cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    stockQuantity: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock quantity cannot be negative'],
      default: 0,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: function (value) {
          if (!value) return true;
          return /^https?:\/\/.+/i.test(value);
        },
        message: 'Product image URL must be a valid http/https URL',
      },
    },
    status: {
      type: String,
      enum: {
        values: ['Available', 'Out Of Stock'],
        message: 'Status must be either "Available" or "Out Of Stock"',
      },
      default: 'Available',
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// Automatically keep status in sync with stock quantity unless explicitly overridden
productSchema.pre('save', function (next) {
  if (this.stockQuantity <= 0) {
    this.status = 'Out Of Stock';
  } else if (this.isModified('stockQuantity') && this.stockQuantity > 0 && this.status === 'Out Of Stock') {
    this.status = 'Available';
  }
  next();
});

// Sync status on findOneAndUpdate as well (save hook doesn't fire here)
productSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update && update.stockQuantity !== undefined) {
    if (update.stockQuantity <= 0) {
      update.status = 'Out Of Stock';
    } else if (update.stockQuantity > 0) {
      update.status = 'Available';
    }
  }
  next();
});

productSchema.index({ name: 'text', category: 'text', brand: 'text' });

module.exports = mongoose.model('Product', productSchema);
