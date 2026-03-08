import mongoose from "mongoose";

const { Schema } = mongoose;

const orderSchema = new Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        product_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
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
      },
    ],
    payment_method: {
      type: String,
      enum: ["EZP Balance", "Pay at Canteen"],
      required: true,
    },
    total_amount: {
      type: Number,
      required: true,
      min: 0,
    },
    reference_num: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Cancelled"],
      default: "Pending",
    },
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const Order = mongoose.model("Order", orderSchema);
