import { Order } from "../models/ordersModel.js";
import { Transaction } from "../models/transactionModel.js";
import { User } from "../models/userModel.js";
import { Wallet } from "../models/walletModel.js";

// get balance
export const getBalanceController = async (req, res) => {
  try {
    console.log("User from request: ", req.user);

    const user_id = req.user.userId;

    console.log("userid check:", user_id);

    if (!user_id) {
      return res
        .status(400)
        .json({ error: true, message: "User ID is required" });
    }

    // find the wallet of user
    const wallet = await Wallet.findOne({ user_id: user_id });
    if (!wallet) {
      return res.status(400).json({ error: true, message: "Wallet not found" });
    }

    return res.status(200).json({
      error: false,
      wallet: {
        balance: wallet.balance,
        id: wallet._id,
      },
      message: "Balance retrieved successfully",
    });
  } catch (error) {
    console.error("Error deducting balance:", error);
    return res.status(500).json({ error: true, message: "Server error" });
  }
};

// deduct balance
export const deductBalanceController = async (req, res) => {
  try {
    const user_id = req.user.userId;
    const { order_id } = req.body;

    console.log("userid check: jidjid ", user_id);

    // validation
    if (!order_id) {
      return res
        .status(400)
        .json({ error: true, message: "Order ID is required" });
    }

    // find order of user
    const order = await Order.findById({ _id: order_id });
    if (!order) {
      return res.status(400).json({ error: true, message: "Order not found" });
    }

    console.log("Order details: ", order);

    // find the wallet of user
    const wallet = await Wallet.findOne({ user_id });
    if (!wallet) {
      return res.status(400).json({ error: true, message: "Wallet not found" });
    }

    console.log("walletttt: ", wallet);

    if (order.total_amount <= 0) {
      return res
        .status(400)
        .json({ error: true, message: "Amount must be greater than 0" });
    }

    if (wallet.balance < order.total_amount) {
      return res
        .status(400)
        .json({ error: true, message: "Insufficient balance" });
    }

    // deduct balance to wallet
    wallet.balance -= order.total_amount;

    console.log("balance: ", wallet.balance);

    // create transaction record
    const transaction = await new Transaction({
      wallet_id: wallet._id,
      type: "Debit",
      transaction_type: "Payment",
      amount: order.total_amount,
      description: `You payed from Canteen worth ₱${order.total_amount
        .toFixed(2)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.`,
    }).save();

    await wallet.save();

    return res.status(200).json({
      error: false,
      updated_balance: wallet.balance,
      message: "Balance deducted successfully",
      transaction,
    });
  } catch (error) {
    console.error("Error deducting balance:", error);
    return res.status(500).json({ error: true, message: "Server error" });
  }
};

// add balance
export const transferBalanceController = async (req, res) => {
  try {
    const user_id = req.user.userId;
    const { receiver_id, amount, reciever_name, sender_name } = req.body;

    console.log("amount: ", amount);

    // validation
    if (!user_id) {
      return res
        .status(400)
        .json({ error: true, message: "User ID is required" });
    }

    if (!receiver_id) {
      return res
        .status(400)
        .json({ error: true, message: "Receiver ID is required" });
    }

    if (!reciever_name) {
      return res
        .status(400)
        .json({ error: true, message: "Reciever name is required" });
    }

    if (!sender_name) {
      return res
        .status(400)
        .json({ error: true, message: "Sender name is required" });
    }

    if (!amount) {
      return res
        .status(400)
        .json({ error: true, message: "Amount is required" });
    }

    if (amount <= 0) {
      return res
        .status(400)
        .json({ error: true, message: "Amount must be greater than 0" });
    }

    if (user_id === receiver_id) {
      return res.status(400).json({
        error: true,
        message:
          "Oops! You can't send balance to yourself. Transaction cannot be processed at this time.",
      });
    }

    // find the wallet of user
    const senderWallet = await Wallet.findOne({ user_id });
    if (!senderWallet) {
      return res
        .status(400)
        .json({ error: true, message: "Sender Wallet not found" });
    }

    // find the wallet of receiver
    const receiverWallet = await Wallet.findOne({ user_id: receiver_id });
    if (!receiverWallet) {
      return res
        .status(400)
        .json({ error: true, message: "Receiver Wallet not found" });
    }

    // add balance to receiver wallet
    receiverWallet.balance += amount;

    if (senderWallet.balance < amount) {
      return res.status(400).json({
        error: true,
        message:
          "Oops! You have insufficient balance. Transaction cannot be processed at this time.",
      });
    }

    // deduct balance to user wallet
    senderWallet.balance -= amount;

    // create transaction record for sender
    const senderTransaction = await new Transaction({
      user_id: user_id,
      wallet_id: senderWallet._id,
      type: "Debit",
      transaction_type: "Transferred Balance",
      amount,
      description: `You transferred balance to ${reciever_name} worth ₱${amount
        .toFixed(2)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.`,
    }).save();

    // create transaction record for receiver
    const recieverTransaction = await new Transaction({
      user_id: receiverWallet.user_id,
      wallet_id: receiverWallet._id,
      type: "Credit",
      transaction_type: "Received Balance",
      amount,
      description: `You received balance from ${sender_name} worth ₱${amount
        .toFixed(2)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.`,
    }).save();

    // save changes to wallets
    receiverWallet.save();
    senderWallet.save();

    return res.status(200).json({
      error: false,
      message: "Balance added successfully",
      senderTransaction,
      recieverTransaction,
    });
  } catch (error) {
    console.error("Error transferring balance:", error);
    return res.status(500).json({ error: true, message: "Server error" });
  }
};
