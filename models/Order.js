import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  productImage: String,
  variant: {
    variantId: mongoose.Schema.Types.ObjectId,
    color: String,
    size: String,
    price: Number,
    sku: String,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  customerInfo: {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
  },
  shippingAddress: {
    street: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    zipCode: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      default: "USA",
    },
  },
  items: {
    type: [orderItemSchema],
    required: true,
    validate: {
      validator: function (v) {
        return v.length > 0;
      },
      message: "Order must have at least one item",
    },
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  tax: {
    type: Number,
    default: 0,
    min: 0,
  },
  shippingCost: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: [
      "pending",
      "paid",
      "processing",
      "shipped",
      "delivered",
      "undelivered",
      "cancelled",
      "refunded",
    ],
    default: "pending",
  },
  paymentInfo: {
    method: {
      type: String,
      enum: ["card", "paypal", "cod"],
      default: "card",
    },
    transactionId: String,
    paidAt: Date,
  },
  rider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  assignedAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
  undeliveredReason: String,
  notes: String,
  trackingNumber: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for queries
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ rider: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });

// Generate order number
orderSchema.pre("save", async function (next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    this.orderNumber = `ORD-${year}${month}${day}-${random}`;
  }
  this.updatedAt = Date.now();
  next();
});

// Calculate totals
orderSchema.pre("save", function (next) {
  if (this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
    this.totalAmount = this.subtotal + this.tax + this.shippingCost;
  }
  next();
});

// Method to update status
orderSchema.methods.updateStatus = async function (newStatus, riderId = null) {
  this.status = newStatus;

  switch (newStatus) {
    case "paid":
      this.paymentInfo.paidAt = new Date();
      break;
    case "shipped":
      this.shippedAt = new Date();
      if (riderId) {
        this.rider = riderId;
        this.assignedAt = new Date();
      }
      break;
    case "delivered":
      this.deliveredAt = new Date();
      break;
    case "undelivered":
      this.deliveredAt = new Date();
      break;
  }

  return this.save();
};

export default mongoose.model("Order", orderSchema);
