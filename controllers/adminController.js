import mongoose from "mongoose";
import { Order } from "../models/ordersModel.js";
import { Transaction } from "../models/transactionModel.js";
import { Wallet } from "../models/walletModel.js";
import { Product } from "../models/productModel.js";

// get load receiver
export const adminGetLoadReceiverController = async (req, res) => {
  try {
    const { wallet_id } = req.query;

    console.log("scan result wallet id: ", wallet_id);

    // validation
    if (!wallet_id) {
      return res
        .status(400)
        .json({ error: true, message: "Wallet ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(wallet_id)) {
      return res.status(400).json({
        error: true,
        message:
          "The QR code is invalid! Please make sure it is a EZP QR Code Wallet.",
      });
    }

    const wallet = await Wallet.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(wallet_id) } },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "userDetails",
        },
      },

      {
        $project: {
          _id: 1,
          balance: 1,
          user_id: 1,
          "userDetails.firstname": 1,
          "userDetails.middlename": 1,
          "userDetails.lastname": 1,
          "userDetails.lrn": 1,
          "userDetails.grade": 1,
          "userDetails.grade_lvl": 1,
          "userDetails.section": 1,
          "userDetails.mobile_number": 1,
          "userDetails.image": 1,
        },
      },
    ]);

    // Handle no result found
    if (!wallet.length) {
      return res.status(404).json({
        error: true,
        message:
          "No wallet found with the scanned QR. Please make sure it is a EZP QR Code Wallet.",
      });
    }

    console.log("Wallet aggregation result:", wallet);

    return res.status(200).json({
      success: true,
      message: "User Wallet fetched successfully",
      wallet: wallet[0],
    });
  } catch (error) {
    console.error("Error fetching user walllet:", error);
    return res
      .status(500)
      .json({ error: true, message: `Server error: ${error}` });
  }
};

// add balance to student
export const adminAddBalanceController = async (req, res) => {
  try {
    const { user_id, wallet_id, amount } = req.body;

    console.log("Wallet id: ", wallet_id);
    console.log("user id: ", user_id);
    console.log("amount: ", amount);

    // validation
    if (!user_id) {
      return res
        .status(400)
        .json({ error: true, message: "User ID is required" });
    }

    if (!wallet_id) {
      return res
        .status(400)
        .json({ error: true, message: "Wallet ID is required" });
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

    const wallet = await Wallet.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(wallet_id) } },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "userDetails",
        },
      },

      {
        $project: {
          _id: 1,
          user_id: 1,
          balance: 1,
          "userDetails.firstname": 1,
          "userDetails.middlename": 1,
          "userDetails.lastname": 1,
          "userDetails.lrn": 1,
          "userDetails.grade": 1,
          "userDetails.grade_lvl": 1,
          "userDetails.section": 1,
          "userDetails.mobile_number": 1,
        },
      },
    ]);

    if (!wallet.length) {
      return res.status(404).json({ error: true, message: "Wallet not found" });
    }

    await Wallet.updateOne(
      { _id: wallet_id },
      { $inc: { balance: parseInt(amount) } }
    );

    // create transaction record
    const transaction = await new Transaction({
      user_id: user_id,
      wallet_id: wallet_id,
      type: "Credit",
      transaction_type: "Added Balance",
      amount,
      description: `You received from Canteen worth ₱${amount
        .toFixed(2)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`,
    }).save();

    return res.status(200).json({
      error: false,
      updated_balance: wallet.balance,
      message: "Balance added successfully",
      transaction,
    });
  } catch (error) {
    console.error("Error adding balance:", error);
    return res.status(500).json({ error: true, message: "Server error" });
  }
};

// get all orders
export const adminGetAllOrdersController = async (req, res) => {
  try {
    const order = await Order.aggregate([
      { $match: { status: "Pending" } },
      // Lookup to join user details with the order
      {
        $lookup: {
          from: "users", // The collection name for products
          localField: "user_id", // Field in Order
          foreignField: "_id", // Field in Product
          as: "userDetails", // Alias for the joined data
        },
      },

      // Lookup to join product details for each order
      {
        $lookup: {
          from: "products", // The name of the products collection
          localField: "products.product_id", // Field in the orders collection
          foreignField: "_id", // Field in the products collection
          as: "productDetails", // Alias for the joined data
        },
      },

      // Add fields to merge products and productDetails
      {
        $addFields: {
          products: {
            $map: {
              input: "$products",
              as: "orderProduct",
              in: {
                product_id: "$$orderProduct.product_id",
                quantity: "$$orderProduct.quantity",
                price: "$$orderProduct.price",
                details: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$productDetails",
                        as: "detail",
                        cond: {
                          $eq: ["$$detail._id", "$$orderProduct.product_id"],
                        },
                      },
                    },
                    0,
                  ],
                },
              },
            },
          },
        },
      },

      // Project only necessary fields
      {
        $project: {
          reference_num: 1,
          total_amount: 1,
          payment_method: 1,
          status: 1,
          createdAt: 1,
          products: 1,
          "userDetails._id": 1,
          "userDetails.firstname": 1,
          "userDetails.middlename": 1,
          "userDetails.lastname": 1,
          "userDetails.lrn": 1,
          "userDetails.grade": 1,
          "userDetails.grade_lvl": 1,
          "userDetails.section": 1,
        },
      },
    ]);

    if (!order || order.length === 0) {
      return res
        .status(200)
        .json({ success: false, message: "Orders not found" });
    }

    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      order,
    });
  } catch (error) {
    console.error("Error fetching orders: ", error);
    res
      .status(500)
      .json({ error: true, message: "Internal Server Errror", error });
  }
};

// get all completed orders
export const adminGetAllCompletedOrdersController = async (req, res) => {
  try {
    const order = await Order.aggregate([
      // Match orders where status is not "Pending"
      { $match: { status: "Completed" } },
      // Lookup to join user details with the order
      {
        $lookup: {
          from: "users", // The collection name for products
          localField: "user_id", // Field in Order
          foreignField: "_id", // Field in Product
          as: "userDetails", // Alias for the joined data
        },
      },

      // Lookup to join product details for each order
      {
        $lookup: {
          from: "products", // The name of the products collection
          localField: "products.product_id", // Field in the orders collection
          foreignField: "_id", // Field in the products collection
          as: "productDetails", // Alias for the joined data
        },
      },

      // Add fields to merge products and productDetails
      {
        $addFields: {
          products: {
            $map: {
              input: "$products",
              as: "orderProduct",
              in: {
                product_id: "$$orderProduct.product_id",
                quantity: "$$orderProduct.quantity",
                price: "$$orderProduct.price",
                details: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$productDetails",
                        as: "detail",
                        cond: {
                          $eq: ["$$detail._id", "$$orderProduct.product_id"],
                        },
                      },
                    },
                    0,
                  ],
                },
              },
            },
          },
        },
      },

      // Project only necessary fields
      {
        $project: {
          reference_num: 1,
          total_amount: 1,
          payment_method: 1,
          status: 1,
          createdAt: 1,
          products: 1,
          "userDetails.firstname": 1,
          "userDetails.middlename": 1,
          "userDetails.lastname": 1,
          "userDetails.lrn": 1,
          "userDetails.grade": 1,
          "userDetails.grade_lvl": 1,
          "userDetails.section": 1,
        },
      },
    ]);

    if (!order || order.length === 0) {
      return res
        .status(200)
        .json({ success: false, message: "Orders not found" });
    }

    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      order,
    });
  } catch (error) {
    console.error("Error fetching orders: ", error);
    res
      .status(500)
      .json({ error: true, message: "Internal Server Error", error });
  }
};

// get all added balance transactions
export const adminGetAllAddedBalanceController = async (req, res) => {
  try {
    const transaction = await Transaction.aggregate([
      { $match: { transaction_type: "Added Balance" } },
      {
        $lookup: {
          from: "wallets", // the collection name for wallet
          localField: "wallet_id", // field in Transaction
          foreignField: "_id", // field in wallet
          as: "walletDetails",
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "walletDetails.user_id",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $project: {
          _id: 1,
          amount: 1,
          description: 1,
          createdAt: 1,
          transaction_type: 1,
          wallet_id: 1,
          "userDetails._id": 1,
          "userDetails.firstname": 1,
          "userDetails.middlename": 1,
          "userDetails.lastname": 1,
          "userDetails.grade": 1,
          "userDetails.section": 1,
        },
      },
    ]);

    if (!transaction || transaction.length === 0) {
      return res.status(200).json({
        success: false,
        message: "Transaction of added balance not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Added balance transaction fetched successfully",
      transaction,
    });
  } catch (error) {
    console.error("Error fetching added balance transaction:", error);
    res
      .status(500)
      .json({ error: true, message: "Failed to fetch added balance" });
  }
};

// get all completed orders
export const adminGetAllCanceledOrdersController = async (req, res) => {
  try {
    const order = await Order.aggregate([
      // Match orders where status is not "Pending"
      { $match: { status: "Cancelled" } },
      // Lookup to join user details with the order
      {
        $lookup: {
          from: "users", // The collection name for products
          localField: "user_id", // Field in Order
          foreignField: "_id", // Field in Product
          as: "userDetails", // Alias for the joined data
        },
      },

      // Lookup to join product details for each order
      {
        $lookup: {
          from: "products", // The name of the products collection
          localField: "products.product_id", // Field in the orders collection
          foreignField: "_id", // Field in the products collection
          as: "productDetails", // Alias for the joined data
        },
      },

      // Add fields to merge products and productDetails
      {
        $addFields: {
          products: {
            $map: {
              input: "$products",
              as: "orderProduct",
              in: {
                product_id: "$$orderProduct.product_id",
                quantity: "$$orderProduct.quantity",
                price: "$$orderProduct.price",
                details: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$productDetails",
                        as: "detail",
                        cond: {
                          $eq: ["$$detail._id", "$$orderProduct.product_id"],
                        },
                      },
                    },
                    0,
                  ],
                },
              },
            },
          },
        },
      },

      // Project only necessary fields
      {
        $project: {
          reference_num: 1,
          total_amount: 1,
          payment_method: 1,
          status: 1,
          createdAt: 1,
          products: 1,
          "userDetails.firstname": 1,
          "userDetails.middlename": 1,
          "userDetails.lastname": 1,
          "userDetails.lrn": 1,
          "userDetails.grade": 1,
          "userDetails.grade_lvl": 1,
          "userDetails.section": 1,
        },
      },
    ]);

    if (!order || order.length === 0) {
      return res
        .status(200)
        .json({ success: false, message: "Orders not found" });
    }

    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      order,
    });
  } catch (error) {
    console.error("Error fetching orders: ", error);
    res
      .status(500)
      .json({ error: true, message: "Internal Server Error", error });
  }
};

// complete order
export const completeOrderController = async (req, res) => {
  const { order_id, user_id, total_amount } = req.body;

  console.log("selected order_id backend: ", order_id);

  if (!order_id) {
    return res
      .status(400)
      .json({ success: false, message: "Order ID is required" });
  }

  if (!user_id) {
    return res
      .status(400)
      .json({ success: false, message: "User ID is required" });
  }

  if (!total_amount) {
    return res
      .status(400)
      .json({ success: false, message: "Total amount is required" });
  }

  try {
    const order = await Order.findById({ _id: order_id });
    if (!order) {
      return res
        .status(200)
        .json({ success: false, message: "Order not found" });
    }

    if (order.status === "Completed") {
      return res
        .status(400)
        .json({ error: true, message: "This order is already completed!" });
    }

    order.status = "Completed";

    const wallet = await Wallet.findOne({ user_id });
    if (!wallet) {
      return res
        .status(200)
        .json({ success: false, message: "Wallet not found" });
    }

    // save transaction
    const transaction = new Transaction({
      wallet_id: wallet._id,
      user_id: wallet.user_id,
      type: "Status",
      transaction_type: "Completed",
      amount: total_amount,
      description: `Your order from Canteen worth ₱${total_amount.toFixed(
        2
      )} is completed.`,
    });

    await order.save();
    await transaction.save();

    res.status(200).json({
      success: true,
      message: "Order completed successfully",
      order: order,
    });
  } catch (error) {
    console.error("Error completing order:", error);
    res.status(500).json({ error: true, message: "Failed to complete order" });
  }
};

// cancel order
export const cancelOrderController = async (req, res) => {
  try {
    const { order_id, user_id, total_amount } = req.body;

    console.log("selected order_id backend: ", order_id);

    if (!order_id) {
      return res
        .status(400)
        .json({ success: false, message: "Order ID is required" });
    }

    if (!user_id) {
      return res
        .status(400)
        .json({ error: true, message: "User ID is required" });
    }

    if (!total_amount) {
      return res
        .status(400)
        .json({ error: true, message: "Total amount is required" });
    }

    // find order
    const order = await Order.findById({ _id: order_id });
    if (!order) {
      return res
        .status(200)
        .json({ success: false, message: "Order not found" });
    }

    if (order.status === "Cancelled") {
      return res
        .status(400)
        .json({ error: true, message: "This order is already cancelled!" });
    }

    // update status to cancelled
    order.status = "Cancelled";
    await order.save();

    // find the wallet of user
    const wallet = await Wallet.findOne({ user_id: user_id });
    if (!wallet) {
      return res.status(400).json({ error: true, message: "Wallet not found" });
    }

    wallet.balance += parseInt(total_amount);
    await wallet.save();

    for (const item of order.products) {
      const product = await Product.findById(item.product_id);
      if (product) {
        product.stock += item.quantity; // Update the stock based on canceled order quantity
        await product.save();
      }
    }

    // save transaction
    const transaction = new Transaction({
      wallet_id: wallet._id,
      user_id: wallet.user_id,
      type: "Status",
      transaction_type: "Refund",
      amount: total_amount,
      description: `Your order from Canteen worth ₱${total_amount.toFixed(
        2
      )} is cancelled.`,
    });

    await transaction.save();

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order: order,
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ error: true, message: "Failed to cancel order" });
  }
};

// add order
export const adminAddOrderController = async (req, res) => {
  try {
    const { wallet_id, products, reference_num, payment_method } = req.body;

    if (!products || products.length === 0) {
      return res.status(400).json({ error: true, message: "Invalid input" });
    }

    if (!reference_num) {
      return res
        .status(400)
        .json({ error: true, message: "Reference number is required" });
    }

    if (!payment_method) {
      return res
        .status(400)
        .json({ error: true, message: "Payment method is required" });
    }

    if (!wallet_id) {
      return res
        .status(400)
        .json({ error: true, message: "Wallet ID is required" });
    }

    // calculate total amount
    const total_amount = products.reduce(
      (sum, product) => sum + product.quantity * product.price,
      0
    );

    // find the user's wallet
    const wallet = await Wallet.findOne({ _id: wallet_id });
    if (!wallet) {
      return res.status(400).json({ error: true, message: "Wallet not found" });
    }

    let dbProduct;
    let product;
    // deduct stock from products
    for (product of products) {
      dbProduct = await Product.findById(product.product_id);

      if (!dbProduct) {
        return res.status(400).json({
          error: true,
          message: `Product with ID ${product._id} not found`,
        });
      }

      if (dbProduct.stock < product.quantity) {
        return res.status(400).json({
          error: true,
          message: `Insufficient stock for product ${dbProduct.name}`,
        });
      }

      dbProduct.stock -= product.quantity;
    }

    // create order
    const newOrder = await Order.create({
      user_id: wallet.user_id,
      products,
      total_amount,
      payment_method: payment_method,
      reference_num,
      status: "Completed",
    });

    await dbProduct.save();
    await wallet.save();

    const savedOrder = await newOrder.save();

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: savedOrder,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res
      .status(500)
      .json({ success: false, message: `Failed to create order: ${error}` });
  }
};

export const adminGetOrderDetailsController = async (req, res) => {
  try {
    const { reference_num } = req.query;

    if (!reference_num) {
      return res
        .status(400)
        .json({ error: true, message: "Reference number is required" });
    }

    const orders = await Order.aggregate([
      // Match the order by reference number
      { $match: { reference_num } },

      // Lookup to join product details with the order
      {
        $lookup: {
          from: "products", // The collection name for products
          localField: "products.product_id", // Field in Order
          foreignField: "_id", // Field in Product
          as: "productDetails", // Alias for the joined data
        },
      },
      // Add fields to combine order products with product details
      {
        $addFields: {
          products: {
            $map: {
              input: "$products",
              as: "orderProduct",
              in: {
                product_id: "$$orderProduct.product_id",
                quantity: "$$orderProduct.quantity",
                price: "$$orderProduct.price",
                details: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$productDetails",
                        as: "detail",
                        cond: {
                          $eq: ["$$detail._id", "$$orderProduct.product_id"],
                        },
                      },
                    },
                    0,
                  ],
                },
              },
            },
          },
        },
      },

      // Project to clean up unnecessary fields (e.g., productDetails field)
      {
        $project: {
          productDetails: 0, // Exclude the raw joined data
        },
      },
    ]);

    // Check if orders are found
    if (!orders.length) {
      return res.status(404).json({ error: true, message: "Order not found" });
    }

    res.status(200).json({ error: false, order: orders[0] });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ error: true, message: "Internal server error" });
  }
};

// deduct balance
export const adminDeductBalanceController = async (req, res) => {
  try {
    const { order_id, user_id, payment_method } = req.body;

    console.log("order id: ", order_id);
    console.log("user id: ", user_id);

    // validation
    if (!user_id) {
      return res
        .status(400)
        .json({ error: true, message: "User ID is required" });
    }

    if (!order_id) {
      return res
        .status(400)
        .json({ error: true, message: "Order ID is required" });
    }

    if (!payment_method) {
      return res
        .status(400)
        .json({ error: true, message: "Payment method is required" });
    }

    // find order of user
    const order = await Order.findById({ _id: order_id });
    if (!order) {
      return res.status(400).json({ error: true, message: "Order not found" });
    }

    console.log("Order details: ", order);

    if (payment_method !== "EZP Balance") {
      order.status = "Completed";
    }

    order.save();

    // find the wallet of user
    const wallet = await Wallet.findOne({ user_id });
    if (!wallet) {
      return res.status(400).json({ error: true, message: "Wallet not found" });
    }

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
      user_id: user_id,
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

// complete order
export const cancelOrderPayAtCanteenController = async (req, res) => {
  try {
    const { order_id } = req.body;

    console.log("selected order_id backend: ", order_id);

    if (!order_id) {
      return res
        .status(400)
        .json({ success: false, message: "Order ID is required" });
    }

    // find order
    const order = await Order.findById({ _id: order_id });
    if (!order) {
      return res
        .status(200)
        .json({ success: false, message: "Order not found" });
    }

    // update status to cancelled
    order.status = "Cancelled";
    await order.save();

    for (const item of order.products) {
      const product = await Product.findById(item.product_id);
      if (product) {
        product.stock += item.quantity; // Update the stock based on canceled order quantity
        await product.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order: order,
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ error: true, message: "Failed to cancel order" });
  }
};

// add product
export const adminAddProductController = async (req, res) => {
  try {
    const { name, price, qty, category, image } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ error: true, message: "Product name is required" });
    }

    if (!price) {
      return res
        .status(400)
        .json({ error: true, message: "Product price is required" });
    }

    if (!qty) {
      return res
        .status(400)
        .json({ error: true, message: "Product quantity is required" });
    }

    if (!category) {
      return res
        .status(400)
        .json({ error: true, message: "Product category is required" });
    }

    if (!image) {
      return res
        .status(400)
        .json({ error: true, message: "Product image is required" });
    }

    if (price <= 0) {
      return res
        .status(400)
        .json({ error: true, message: "Price must be greater than zero" });
    }

    if (qty <= 0) {
      return res
        .status(400)
        .json({ error: true, message: "Quantity must be greater than zero" });
    }

    const existingProduct = await Product.findOne({ name });
    if (existingProduct) {
      return res.status(400).json({
        error: true,
        message: "Product is already added! Please try again.",
      });
    }

    const addProduct = await Product.create({
      name,
      price,
      category,
      image,
      stock: qty,
    });

    const addedProduct = await addProduct.save();

    res.status(200).json({
      success: true,
      message: "Added product successfully",
      product: addedProduct,
    });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ error: true, message: "Failed adding product" });
  }
};

// update product
export const adminUpdateProductController = async (req, res) => {
  try {
    const { product_id, name, price, qty, category, image } = req.body;

    if (!product_id) {
      return res
        .status(400)
        .json({ error: true, message: "Product ID is required" });
    }

    if (!name) {
      return res
        .status(400)
        .json({ error: true, message: "Product name is required" });
    }

    if (!price) {
      return res
        .status(400)
        .json({ error: true, message: "Product price is required" });
    }

    if (!qty) {
      return res
        .status(400)
        .json({ error: true, message: "Product quantity is required" });
    }

    if (!category) {
      return res
        .status(400)
        .json({ error: true, message: "Product category is required" });
    }

    if (!image) {
      return res
        .status(400)
        .json({ error: true, message: "Product image is required" });
    }

    if (price <= 0) {
      return res
        .status(400)
        .json({ error: true, message: "Price must be greater than zero" });
    }

    if (qty <= 0) {
      return res
        .status(400)
        .json({ error: true, message: "Quantity must be greater than zero" });
    }

    // If the product name is changing, check if the new name already exists
    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({
        error: true,
        message: "Product not found",
      });
    }

    if (product.name !== name) {
      const existingProduct = await Product.findOne({ name });
      if (existingProduct) {
        return res.status(400).json({
          error: true,
          message:
            "Product with this name already exists. You can't update with the same name.",
        });
      }
    }

    const updateProduct = await Product.findByIdAndUpdate(
      product_id,
      {
        name,
        price,
        category,
        image,
        stock: qty,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updateProduct) {
      return res
        .status(404)
        .json({ error: true, message: "Product not found" });
    }

    res.status(200).json({
      success: true,
      message: "Updated product successfully",
      product: updateProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: true, message: "Failed updating product" });
  }
};

// delete product
export const adminDeleteProductController = async (req, res) => {
  try {
    const { product_id } = req.query;

    if (!product_id) {
      return res.status(400).json({
        error: true,
        message: "Product ID is required",
      });
    }

    // const deleteProduct = await Product.deleteOne({ _id: product_id });
    const deleteProduct = await Product.updateOne(
      { _id: product_id },
      { $set: { isDelete: true } }
    );

    // if (!deleteProduct) {
    //   return res.status(404).json({
    //     error: true,
    //     message: "Product not found",
    //   });
    // }

    if (deleteProduct.matchedCount === 0) {
      return res.status(404).json({
        error: true,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: true, message: "Failed deleting product" });
  }
};
