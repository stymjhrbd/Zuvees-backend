import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  variant: {
    variantId: mongoose.Schema.Types.ObjectId,
    color: String,
    size: String,
    price: Number,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  items: [cartItemSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for user lookup
cartSchema.index({ user: 1 });

// Update timestamp
cartSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for total items
cartSchema.virtual("totalItems").get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Virtual for total price
cartSchema.virtual("totalPrice").get(function () {
  return this.items.reduce(
    (sum, item) => sum + item.variant.price * item.quantity,
    0
  );
});

// Method to add item
cartSchema.methods.addItem = async function (
  productId,
  variantId,
  quantity = 1
) {
  const existingItemIndex = this.items.findIndex(
    (item) =>
      item.product.toString() === productId &&
      item.variant.variantId.toString() === variantId
  );

  if (existingItemIndex > -1) {
    this.items[existingItemIndex].quantity += quantity;
  } else {
    const Product = mongoose.model("Product");
    const product = await Product.findById(productId);
    const variant = product.variants.id(variantId);

    if (!variant) throw new Error("Variant not found");

    this.items.push({
      product: productId,
      variant: {
        variantId: variant._id,
        color: variant.color,
        size: variant.size,
        price: variant.price,
      },
      quantity,
    });
  }

  return this.save();
};

// Method to update quantity
cartSchema.methods.updateQuantity = function (itemId, quantity) {
  const item = this.items.id(itemId);
  if (item) {
    if (quantity <= 0) {
      this.items.pull(itemId);
    } else {
      item.quantity = quantity;
    }
  }
  return this.save();
};

// Method to remove item
cartSchema.methods.removeItem = function (itemId) {
  this.items.pull(itemId);
  return this.save();
};

// Method to clear cart
cartSchema.methods.clearCart = function () {
  this.items = [];
  return this.save();
};

export default mongoose.model("Cart", cartSchema);
