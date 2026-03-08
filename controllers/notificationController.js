import { Order } from "../models/ordersModel.js";
import { Transaction } from "../models/transactionModel.js";
import { Wallet } from "../models/walletModel.js";

export const getNotificationController = async (req, res) => {
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

    const transactions = await Transaction.find({ wallet_id, isRead: false });
    if (transactions.length === 0) {
      return res.status(200).json({
        error: false,
        message: "No unread transaction found",
        transactions: [],
      });
    }

    return res.status(200).json({
      error: false,
      message: "Transactions fetched successfully",
      transactions,
    });
  } catch (error) {
    console.error("Error retrieving transactions: ", error);
    return res.status(500).json({ error: true, message: "Server Error" });
  }
};

export const readNotificationController = async (req, res) => {
  try {
    const user_id = req.user.userId;

    if (!user_id) {
      return res
        .status(400)
        .json({ error: true, message: "User ID is required" });
    }

    // find the wallet of the user
    const wallet = await Wallet.findOne({ user_id });
    if (!wallet) {
      return res
        .status(400)
        .json({ error: true, message: "Wallet not found for this user" });
    }

    const wallet_id = wallet._id;

    const unreadTransactions = await Transaction.find({
      wallet_id,
      isRead: false,
    });

    if (unreadTransactions.length === 0) {
      return res.status(200).json({
        error: false,
        message: "No unread transaction found",
        transactions: [],
      });
    }

    await Transaction.updateMany(
      { wallet_id, isRead: false },
      { isRead: true }
    );

    return res.status(200).json({
      error: false,
      message: "Transactions updated successfully",
      updatedCount: unreadTransactions.length,
    });
  } catch (error) {
    console.error("Error updating transactions: ", error);
    return res.status(500).json({ error: true, message: "Server Error" });
  }
};

export const adminGetNotificationController = async (req, res) => {
  try {
    const orders = await Order.find({ isRead: false });
    if (orders.length === 0) {
      return res
        .status(200)
        .json({ error: false, message: "No unread orders found", orders: [] });
    }

    return res.status(200).json({
      error: false,
      message: "Orders fetched successfully",
      orders,
    });
  } catch (error) {
    console.error("Error retrieving orders: ", error);
    return res.status(500).json({ error: true, message: "Server Error" });
  }
};

export const adminReadNotificationController = async (req, res) => {
  try {
    const unreadTransactions = await Order.find({
      isRead: false,
    });

    if (unreadTransactions.length === 0) {
      return res.status(200).json({
        error: false,
        message: "No unread transaction found",
        transactions: [],
      });
    }

    await Order.updateMany({ isRead: true });

    return res.status(200).json({
      error: false,
      message: "Unread orders updated successfully",
      updatedCount: unreadTransactions.length,
    });
  } catch (error) {
    console.error("Error updating transactions: ", error);
    return res.status(500).json({ error: true, message: "Server Error" });
  }
};
