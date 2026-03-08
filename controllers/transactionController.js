import { Transaction } from "../models/transactionModel.js";
import { Wallet } from "../models/walletModel.js";

export const getTransactionController = async (req, res) => {
  try {
    const user_id = req.user.userId;

    if (!user_id) {
      return res
        .status(400)
        .json({ error: true, message: "User ID is required" });
    }

    // find the wallet of user
    const wallet = await Wallet.findOne({ user_id });
    if (!wallet) {
      return res
        .status(400)
        .json({ error: true, message: "Wallet not found for this user" });
    }

    const wallet_id = wallet._id;

    const transaction = await Transaction.find({ wallet_id });
    if (!transaction) {
      return res.status(400).json({
        error: true,
        message: "Transaction not found for this wallet",
      });
    }

    return res.status(200).json({
      error: false,
      message: "transaction fetched successfully",
      transaction,
    });
  } catch (error) {
    console.error("Error retrieving transactions: ", error);
    return res.status(500).json({ error: true, message: "Server Error" });
  }
};

export const deleteAllTransactionController = async (req, res) => {
  try {
    await Transaction.deleteMany({});
    res
      .status(200)
      .json({ message: "All orders have been deleted successfully." });
  } catch (error) {
    console.error("Error deleting orders:", error);
    res.status(500).json({ error: "Failed to delete all orders." });
  }
};
