import { Product } from "../models/productModel.js";

export const getAllProductController = async (req, res) => {
  try {
    const products = await Product.find({});

    if (!products) {
      return res
        .status(400)
        .json({ error: true, message: "products not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      products: products,
    });
  } catch (error) {
    console.error("Error retrieving product:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to retrieve product" });
  }
};

// food products
export const getMealProductController = async (req, res) => {
  try {
    const products = await Product.find({ category: "Meals", isDelete: false });

    if (products.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No products found in this category",
        products: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      products,
    });
  } catch (error) {
    console.error("Error retrieving product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve product",
      products: [],
    });
  }
};

// food products
export const getFoodProductController = async (req, res) => {
  try {
    const products = await Product.find({ category: "Foods", isDelete: false });

    if (products.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No products found in this category",
        products: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      products,
    });
  } catch (error) {
    console.error("Error retrieving product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve product",
      products: [],
    });
  }
};

// drink products
export const getDrinkProductController = async (req, res) => {
  try {
    const products = await Product.find({
      category: "Drinks",
      isDelete: false,
    });

    if (products.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No products found in this category",
        products: [],
      });
    }

    return res.status(200).json({
      sucess: true,
      message: "Products retrieved successfully",
      products,
    });
  } catch (error) {
    console.error("Error retrieving product: ", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve product",
      products: [],
    });
  }
};

// supply products
export const getSupplyProductController = async (req, res) => {
  try {
    const products = await Product.find({
      category: "Supplies",
      isDelete: false,
    });

    if (products.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No products found in this category",
        products: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      products,
    });
  } catch (error) {
    console.error("Error retrieving product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve product",
      products: [],
    });
  }
};

export const deleteAllProductController = async (req, res) => {
  try {
    const result = await Product.deleteMany({ category: "Supplies" });
    return res.status(200).json({
      error: false,
      message: `${result.deletedCount} products have been deleted successfully.`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: true,
      message: "Error deleting products",
    });
  }
};
