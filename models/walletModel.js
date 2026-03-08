import mongoose from "mongoose"; // Import mongoose

const { Schema } = mongoose; // Destructure Schema from mongoose

const walletSchema = new Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to User model
      required: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    transactions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Transaction", // Reference to a transaction model (optional)
      },
    ],
  },
  { timestamps: true }
);

export const Wallet = mongoose.model("Wallet", walletSchema);
