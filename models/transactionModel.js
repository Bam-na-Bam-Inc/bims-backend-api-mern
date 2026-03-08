import mongoose from "mongoose";

const { Schema } = mongoose;

const transactionSchema = new Schema(
  {
    wallet_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet", // Reference to Wallet model
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to User model
      required: true,
    },
    type: {
      type: String,
      enum: ["Credit", "Debit", "Status"], // Type of transaction: credit or debit
      required: true,
    },
    transaction_type: {
      type: String,
      enum: [
        "Added Balance",
        "Received Balance",
        "Transferred Balance",
        "Payment",
        "Ordered",
        "Refund",
        "Completed",
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      default: "",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true } // Automatically add `createdAt` and `updatedAt` fields
);

export const Transaction = mongoose.model("Transaction", transactionSchema);
