import { Wallet } from "../models/walletModel.js";

// get wallet
export const getWalletController = async (req, res) => {
  try {
    console.log("User from request: ", req.user); // log to verify if user data is attached

    const user_id = req.user.userId;

    console.log("userid check: ", user_id);

    if (!user_id) {
      return res.status(400).json({
        error: true,
        message: "User ID is required",
      });
    }

    // find wallet of user
    const wallet = await Wallet.findOne({ user_id: user_id });
    if (!wallet) {
      return res.status(400).json({ error: true, message: "Wallet not found" });
    }

    return res.status(200).json({
      error: false,
      message: "Wallet retrieved successfully",
      wallet,
    });
  } catch (error) {
    console.error("Error retrieving wallet: ", error);
    return res.status(500).json({ error: true, message: "Server error" });
  }
};
