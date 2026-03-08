import express from "express";
import {
  getUserController,
  getUserRecieverController,
  loginController,
  registerController,
  updateUserInfoController,
  updateUserPhotoController,
} from "../controllers/userController.js";
import {
  deductBalanceController,
  getBalanceController,
  transferBalanceController,
} from "../controllers/balanceController.js";
import {
  deleteAllTransactionController,
  getTransactionController,
} from "../controllers/transactionController.js";
import {
  resetPasswordController,
  updatePasswordController,
} from "../controllers/resetPasswordController.js";
import { authenticationToken } from "../helpers/token.js";
import {
  deleteAllProductController,
  getAllProductController,
  getDrinkProductController,
  getFoodProductController,
  getMealProductController,
  getSupplyProductController,
} from "../controllers/productController.js";
import {
  addOrderController,
  deleteAllOrdersController,
  getAllOrderController,
  getOrderController,
  getOrderDetailsController,
} from "../controllers/orderController.js";
import { getWalletController } from "../controllers/walletController.js";
import {
  adminGetNotificationController,
  adminReadNotificationController,
  getNotificationController,
  readNotificationController,
} from "../controllers/notificationController.js";
import {
  completeOrderController,
  adminGetAllCompletedOrdersController,
  adminGetAllOrdersController,
  cancelOrderController,
  adminGetAllCanceledOrdersController,
  adminGetLoadReceiverController,
  adminAddBalanceController,
  adminGetAllAddedBalanceController,
  adminAddOrderController,
  adminGetOrderDetailsController,
  adminDeductBalanceController,
  cancelOrderPayAtCanteenController,
  adminAddProductController,
  adminUpdateProductController,
  adminDeleteProductController,
} from "../controllers/adminController.js";

// router object
const router = express.Router();

// user

// routes implementation
// user register
router.post("/register", registerController);
// user login
router.post("/login", loginController);
// reset pass
router.post("/reset-pass", resetPasswordController);
// update password
router.put("/update-pass", authenticationToken, updatePasswordController);
// get user
router.get("/get-user", authenticationToken, getUserController);
// get receiver
router.get("/get-receiver", authenticationToken, getUserRecieverController);
// edit user information
router.put("/update-user", authenticationToken, updateUserInfoController);
// update user photo
router.put("/update-photo", authenticationToken, updateUserPhotoController);

// get wallet
router.get("/get-wallet", authenticationToken, getWalletController);

// transfer balance
router.post(
  "/transfer-balance",
  authenticationToken,
  transferBalanceController
);
// deduct balance
router.put("/deduct-balance", authenticationToken, deductBalanceController);
// get balance
router.get("/get-balance", authenticationToken, getBalanceController);

// get transaction
router.get("/get-transactions", authenticationToken, getTransactionController);
// update notification
router.put(
  "/update-notifications",
  authenticationToken,
  readNotificationController
);
// delete all transaciton
router.delete("/delete-all-transaction", deleteAllTransactionController);

// add order
router.post("/add-order", authenticationToken, addOrderController);
// get order
//delete orders
router.delete("/delete-orders", deleteAllOrdersController);

router.get("/get-order", getOrderController);
// get order
router.get("/get-all-orders", authenticationToken, getAllOrderController);
// get order with names
router.get("/get-orders-name", authenticationToken, getOrderDetailsController);

// get products
router.get("/get-products", getAllProductController);

// get meal products
router.get("/get-meal-products", getMealProductController);
// get food products
router.get("/get-food-products", getFoodProductController);
// get drink products
router.get("/get-drink-products", getDrinkProductController);
// get supply products
router.get("/get-supply-products", getSupplyProductController);
// delete all products
router.get("/delete-products", deleteAllProductController);

// get notification
router.get(
  "/get-notifications",
  authenticationToken,
  getNotificationController
);

// admin

// get load receiver
router.get("/admin-get-receiver", adminGetLoadReceiverController);
// add balance
router.post("/admin-add-balance", adminAddBalanceController);

// get all orders
router.get("/admin-get-all-orders", adminGetAllOrdersController);
// get all completed orders
router.get("/admin-get-completed-orders", adminGetAllCompletedOrdersController);
// get all canceled orders
router.get("/admin-get-cancelled-orders", adminGetAllCanceledOrdersController);
// get all added balance transactions
router.get("/admin-get-added-balance", adminGetAllAddedBalanceController);
// complete order
router.put("/admin-complete-order", completeOrderController);
// cancel order
router.put("/admin-cancel-order", cancelOrderController);
// admin add order
router.post("/admin-add-order", adminAddOrderController);
// get order with names
router.get("/admin-get-orders-name", adminGetOrderDetailsController);
// admin deduct balance
router.put("/admin-deduct-balance", adminDeductBalanceController);
// get all unread orders
router.get("/admin-get-notifications", adminGetNotificationController);
// update read notifications
router.put("/admin-update-notifications", adminReadNotificationController);
// cancel pay at canteen order
router.put("/admin-cancel-pay-canteen", cancelOrderPayAtCanteenController);
// add product
router.post("/admin-add-product", adminAddProductController);
// update product
router.put("/admin-update-product", adminUpdateProductController);
//delete product
router.delete("/admin-delete-product", adminDeleteProductController);

// export
export default router;
