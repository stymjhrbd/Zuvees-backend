import mongoose from "mongoose";

const approvedEmailSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ["customer", "admin", "rider"],
    default: "customer",
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Static method to check if email is approved
approvedEmailSchema.statics.isEmailApproved = async function (email) {
  const approved = await this.findOne({ email: email.toLowerCase() });
  return approved;
};

export default mongoose.model("ApprovedEmail", approvedEmailSchema);
