import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import colors from "colors";
import morgan from "morgan";
import connectDB from "./config/db.js";
import userRoutes from "./routes/routes.js";

// .env config
dotenv.config();

// mongodb connection
connectDB();

// rest object
const app = express();

// middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// routes
app.use("/api/v1/auth", userRoutes);

// Default route
app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to the EZPay!" });
});

// ports
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running at ${PORT}`.bgGreen.white);
});
