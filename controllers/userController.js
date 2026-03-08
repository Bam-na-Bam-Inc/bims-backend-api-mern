import { error } from "console";
import { comparePassword, hashPassword } from "../helpers/authHelper.js";
import { User } from "../models/userModel.js";
import { Wallet } from "../models/walletModel.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// register user
export const registerController = async (req, res) => {
  try {
    const {
      firstname,
      lastname,
      middlename,
      gender,
      email,
      mobile_number,
      lrn,
      section,
      password,
      adviser,
      grade,
      grade_lvl,
      image,
    } = req.body;

    // validation
    if (!firstname) {
      return res
        .status(400)
        .json({ error: true, message: "Oops! First name is required." });
    }

    if (!lastname) {
      return res
        .status(400)
        .json({ error: true, message: "Oops! Last name is required." });
    }

    if (!gender) {
      return res
        .status(400)
        .json({ error: true, message: "Oops! Gender is required." });
    }

    if (!email) {
      return res
        .status(400)
        .json({ error: true, message: "Oops! Email address is required." });
    }

    if (!mobile_number) {
      return res
        .status(400)
        .json({ error: true, message: "Oops! Mobile number is required." });
    }

    if (!lrn) {
      return res.status(400).json({
        error: true,
        message: "Oops! Learner Reference Number (LRN) is required.",
      });
    }

    if (!section) {
      return res
        .status(400)
        .json({ error: true, message: "Oops! Section is required." });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({
        error: true,
        message:
          "Oops! Password is required and needs to be 8 characters long.",
      });
    }

    if (!adviser) {
      return res.status(400).json({
        error: true,
        message: "Oops! Name of adviser is required.",
      });
    }

    if (!grade) {
      return res.status(400).json({
        error: true,
        message: "Oops! Grade is required.",
      });
    }

    if (!grade_lvl) {
      return res.status(400).json({
        error: true,
        message: "Oops! Grade level is required.",
      });
    }

    if (!image) {
      return res.status(400).json({
        error: true,
        message: "Oops! Image is required.",
      });
    }

    // exisiting user
    const exisitingUserByLRN = await User.findOne({ lrn });
    if (exisitingUserByLRN) {
      return res.status(400).json({
        error: true,
        message:
          "A user is already registered with this Learner Reference Number (LRN).",
      });
    }

    const exisitingUserByEmal = await User.findOne({ email });
    if (exisitingUserByEmal) {
      return res.status(400).json({
        error: true,
        message: "A user is already registered with this Email.",
      });
    }

    // hash password
    const hashedPassword = await hashPassword(password);

    const user = await User({
      firstname,
      lastname,
      middlename,
      gender,
      email,
      mobile_number,
      lrn,
      section,
      password: hashedPassword,
      adviser,
      grade,
      grade_lvl,
      image,
    }).save();

    // create wallet
    const wallet = await new Wallet({
      user_id: user._id,
      balance: 0.0,
      transaction: [],
    }).save();

    return res.status(201).json({
      error: false,
      user,
      wallet,
      message: "Registration Successful",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "Register API error",
    });
  }
};

// login user
export const loginController = async (req, res) => {
  try {
    const { lrn, password } = req.body;

    // validation
    if (!lrn) {
      return res.status(400).json({ error: true, message: "LRN is required" });
    }

    if (!password) {
      return res
        .status(400)
        .json({ error: true, message: "Password is required" });
    }

    // find user
    const user = await User.findOne({ lrn });
    if (!user) {
      return res.status(404).json({
        error: true,
        message:
          "Learner Reference Number (LRN) not found. Are you registered?",
      });
    }

    console.log("Stored password hash:", user.password);
    console.log("Input password:", password);

    // compare and match hashed password
    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(400).json({
        error: true,
        message: "Password incorrect! Please try again.",
      });
    }

    // token jwt
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // if match
    return res.status(200).json({
      error: false,
      userId: user._id,
      accessToken,
      message: "Login Successful!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "Login API error",
    });
  }
};

// get user
export const getUserController = async (req, res) => {
  try {
    const user_id = req.user.userId;

    console.log("userid check login:", user_id);

    if (!user_id) {
      return res
        .status(400)
        .json({ error: true, message: "User ID is required" });
    }

    // find user
    const user = await User.findById(user_id);

    if (!user) {
      return res.status(400).json({ error: true, message: "User not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "User fetch successfully", user });
  } catch (error) {
    console.error("Error fetching user: ", error);
    return res.status(500).json({ error: true, message: "Server error: " });
  }
};

// edit user
export const updateUserInfoController = async (req, res) => {
  const {
    firstname,
    lastname,
    middlename,
    gender,
    email,
    mobile_number,
    grade,
    section,
    grade_lvl,
    adviser,
  } = req.body;

  // validation
  if (!firstname) {
    return res
      .status(400)
      .json({ error: true, message: "First name is required" });
  }

  if (!lastname) {
    return res
      .status(400)
      .json({ error: true, message: "Last name is required" });
  }

  if (!middlename) {
    return res
      .status(400)
      .json({ error: true, message: "Middle name is required" });
  }

  if (!gender) {
    return res.status(400).json({ error: true, message: "Gender is required" });
  }

  if (!email) {
    return res
      .status(400)
      .json({ error: true, message: "Email address is required" });
  }

  if (!mobile_number) {
    return res
      .status(400)
      .json({ error: true, message: "Mobile number is required" });
  }

  if (!section) {
    return res
      .status(400)
      .json({ error: true, message: "Section is required" });
  }

  if (!adviser) {
    return res.status(400).json({
      error: true,
      message: "Adviser is required",
    });
  }

  if (!grade) {
    return res.status(400).json({
      error: true,
      message: "Grade is required",
    });
  }

  if (!grade_lvl) {
    return res.status(400).json({
      error: true,
      message: "Grade level is required",
    });
  }

  try {
    const user_id = req.user.userId; // get user id

    // update user in the database
    const updateUser = await User.findByIdAndUpdate(
      user_id,
      {
        firstname,
        lastname,
        middlename,
        gender,
        email,
        mobile_number,
        section,
        adviser,
        grade,
        grade_lvl,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updateUser) {
      return res.status(404).json({ error: true, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User information updated successfully",
      data: updateUser,
    });
  } catch (error) {
    console.error("Error updating user information: ", error);
    res.status(500).json({
      error: true,
      message: "Failed to update user information",
    });
  }
};

// update user photo
export const updateUserPhotoController = async (req, res) => {
  const { image } = req.body;

  // validation
  if (!image) {
    return res
      .status(400)
      .json({ error: true, message: "first name is required" });
  }

  try {
    const user_id = req.user.userId; // get user id

    // update user in the database
    const updateUser = await User.findByIdAndUpdate(
      user_id,
      {
        image,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updateUser) {
      return res.status(404).json({ error: true, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User image updated successfully",
      data: updateUser,
    });
  } catch (error) {
    console.error("Error updating user image: ", error);
    res.status(500).json({
      error: true,
      message: "Failed to update user image",
    });
  }
};

// get user load reciever
export const getUserRecieverController = async (req, res) => {
  try {
    const user_id = req.user.userId;
    const { receiver_id } = req.query;

    console.log("Receiver ID:", receiver_id);

    console.log("userid check login:", user_id);

    if (!user_id) {
      return res
        .status(400)
        .json({ error: true, message: "User ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(receiver_id)) {
      return res.status(400).json({
        error: true,
        message:
          "The QR code is invalid! Please make sure it is a EZP QR Code Wallet.",
      });
    }

    // find user
    const user = await User.findById(receiver_id);

    if (!user) {
      return res.status(400).json({
        error: true,
        message:
          "Oops! We couldn't find the user you scanned. Please try again and make sure the QR Code you scanned is a valid EZP Wallet QR.",
      });
    }

    return res
      .status(200)
      .json({ success: true, message: "User fetch successfully", user });
  } catch (error) {
    console.error("Error fetching user: ", error);
    return res.status(500).json({ error: true, message: "Server error: " });
  }
};
