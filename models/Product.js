import mongoose from "mongoose";

const variantSchema = new mongoose.Schema({
  color: {
    type: String,
    required: true,
  },
  colorCode: String, // Hex color code for display
  size: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  stock: {
    type: Number,
    default: 0,
    min: 0,
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
  },
  images: [String], // Variant-specific images
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ["consoles", "controllers", "headsets", "games", "accessories"],
  },
  brand: {
    type: String,
    required: true,
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0,
  },
  images: [
    {
      type: String,
      required: true,
    },
  ],
  features: [String],
  specifications: {
    type: Map,
    of: String,
  },
  variants: {
    type: [variantSchema],
    required: true,
    validate: {
      validator: function (v) {
        return v.length > 0;
      },
      message: "Product must have at least one variant",
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for search
productSchema.index({ name: "text", description: "text", tags: "text" });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ "variants.sku": 1 });

// Update timestamp
productSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for price range
productSchema.virtual("priceRange").get(function () {
  const prices = this.variants.map((v) => v.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return { min, max };
});

// Method to check stock
productSchema.methods.isInStock = function (variantId) {
  const variant = this.variants.id(variantId);
  return variant && variant.stock > 0;
};

// Method to get variant by color and size
productSchema.methods.getVariant = function (color, size) {
  return this.variants.find((v) => v.color === color && v.size === size);
};

export default mongoose.model("Product", productSchema);
