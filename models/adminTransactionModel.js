import mongoose from "mongoose";

const { Schema } = mongoose;

const historySchema = new Schema(
  {
    type: {
      type: String,
      enum: ["Credit", "Debit"], // Type of transaction: credit or debit
      required: true,
    },
    transaction_type: {
      type: String,
      enum: ["Added Balance", "Completed Order", "Canceled Order"],
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
  },
  { timestamps: true } // Automatically add `createdAt` and `updatedAt` fields
);

export const Transaction = mongoose.model("History", historySchema);
