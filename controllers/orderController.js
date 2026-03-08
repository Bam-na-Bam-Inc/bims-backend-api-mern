import { Wallet } from "../models/walletModel.js";
import { Transaction } from "../models/transactionModel.js";
import { Order } from "../models/ordersModel.js";
import { Product } from "../models/productModel.js";

// add order
export const addOrderController = async (req, res) => {
  try {
    const user_id = req.user.userId;
    console.log("userid check: ", user_id);

    const { products, reference_num, payment_method } = req.body;

    if (!user_id) {
      return res
        .status(400)
        .json({ error: true, message: "User ID is required" });
    }

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

    // calculate total amount
    const total_amount = products.reduce(
      (sum, product) => sum + product.quantity * product.price,
      0
    );

    // find the user's wallet
    const wallet = await Wallet.findOne({ user_id });
    if (!wallet) {
      return res.status(400).json({ error: true, message: "Wallet not found" });
    }

    if (payment_method === "EZP Balance") {
      if (wallet.balance < total_amount) {
        return res
          .status(400)
          .json({ error: true, message: "Insufficient wallet balance" });
      }

      wallet.balance -= total_amount;

      // save transaction
      const transaction = new Transaction({
        wallet_id: wallet._id,
        user_id: wallet.user_id,
        type: "Debit",
        transaction_type: "Ordered",
        amount: total_amount,
        description: `You ordered from Canteen worth ₱${total_amount.toFixed(
          2
        )}.`,
      });
      await transaction.save();
      await wallet.save();
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
      user_id,
      products,
      total_amount,
      payment_method: payment_method,
      reference_num,
      status: "Pending",
    });

    await dbProduct.save();

    const savedOrder = await newOrder.save();

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: savedOrder,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ success: false, message: "Failed to create order" });
  }
};

export const updateOrderController = async (req, res) => {
  const { order_id } = req.query;

  try {
    const order = await Order.findById({ _id: order_id });
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (status === "Canceled" && order.status !== "Canceled") {
      // Refund the amount
      const wallet = await Wallet.findOne({ user_id: order.user_id });
      wallet.balance += order.total_amount;
      await wallet.save();

      // Log the refund transaction
      const refundTransaction = new Transaction({
        wallet_id: wallet._id,
        type: "Credit",
        amount: order.total_amount,
        description: "Order Refund",
        timestamp: new Date(),
      });
      await refundTransaction.save();
    }

    order.status = status;
    const updatedOrder = await order.save();

    res.status(200).json({
      success: true,
      message: "Order updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ success: false, message: "Failed to update order" });
  }
};

export const getOrderController = async (req, res) => {
  try {
    const { reference_num } = req.query;

    if (!reference_num) {
      return res
        .status(404)
        .json({ error: true, message: "Reference number is required" });
    }

    const order = await Order.findOne({ reference_num });

    if (!order) {
      return res.status(404).json({
        error: true,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Order retrieve successfully",
      order,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to retrieve order" });
  }
};

export const getAllOrderController = async (req, res) => {
  try {
    const user_id = req.user.userId;

    console.log("CHECK: ", user_id);

    if (!user_id) {
      return res
        .status(400)
        .json({ error: true, message: "User ID is required" });
    }

    const order = await Order.find({ user_id });

    if (!order || order.length === 0) {
      return res.status(200).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Order retrieve successfully",
      order,
    });
  } catch (error) {
    console.error("Error retrieving order:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to retrieve order" });
  }
};

export const getOrderDetailsController = async (req, res) => {
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

export const deleteAllOrdersController = async (req, res) => {
  try {
    await Order.deleteMany({});
    res
      .status(200)
      .json({ message: "All orders have been deleted successfully." });
  } catch (error) {
    console.error("Error deleting orders:", error);
    res.status(500).json({ error: "Failed to delete all orders." });
  }
};
