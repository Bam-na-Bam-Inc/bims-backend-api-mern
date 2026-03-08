import mongoose from "mongoose";

const { Schema } = mongoose;

const productSchema = new Schema(
  {
    name: { type: String, required: true },
    stock: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    image: { type: String, required: true },
    isDelete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);
