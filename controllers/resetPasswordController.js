import { User } from "../models/userModel.js";
import { sendMail } from "../helpers/mailer.js";
import { comparePassword, hashPassword } from "../helpers/authHelper.js";

// register user
export const resetPasswordController = async (req, res) => {
  try {
    const { email, password } = req.body;

    // validation

    if (!email) {
      return res
        .status(400)
        .json({ error: true, message: "email address is required" });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({
        error: true,
        message: "password is required and needs to be 8 characters long",
      });
    }

    // find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(500).json({
        error: true,
        message: "User not found",
      });
    }

    // hash password
    const hashedPassword = await hashPassword(password);

    // update password
    user.password = hashedPassword;
    user.passwordLastUpdated = new Date();
    user.passwordResetRequired = true;

    await user.save({ validateModifiedOnly: true });

    // if password has EZP, it is password reset else password update
    if (password.includes("EZP")) {
      await sendMail(email, password);
      console.log("Email sent to:", user.email);
    }

    return res.status(201).json({
      error: false,
      message: "Reset Password Successful",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: `Internal server error ${error}`,
    });
  }
};

export const updatePasswordController = async (req, res) => {
  const user_id = req.user.userId;
  const { old_password, new_password } = req.body;

  try {
    if (!old_password) {
      return res
        .status(400)
        .json({ error: true, message: "Old password is required" });
    }

    if (!new_password) {
      return res
        .status(400)
        .json({ error: true, message: "New password is required" });
    }

    const user = await User.findById({ _id: user_id });
    if (!user) {
      return res.status(400).json({ error: true, message: "User not found" });
    }

    const now = new Date();
    const lastPasswordUpdate = user.lastPasswordUpdate || user.createdAt;
    const daysSinceLastChange = Math.floor(
      (now - lastPasswordUpdate) / (1000 * 60 * 60 * 24)
    );

    if (!user.passwordResetRequired && daysSinceLastChange < 30) {
      return res.status(400).json({
        error: true,
        message: `Password can only be changed after 30 days. ${
          30 - daysSinceLastChange
        } day(s) remaining.`,
      });
    }

    const match = await comparePassword(old_password, user.password);
    if (!match) {
      return res.status(400).json({
        error: true,
        message: "Old password did not match. Please try again.",
      });
    }

    const hashedPassword = await hashPassword(new_password);

    user.password = hashedPassword;
    user.passwordLastUpdated = now;
    user.passwordResetRequired = false;

    await user.save({ validateModifiedOnly: true });

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error updating user information: ", error);
    res.status(500).json({
      error: true,
      message: "Failed to update user password",
    });
  }
};
