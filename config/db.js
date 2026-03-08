import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(
      `Connected to Database: ${mongoose.connection.host}`.bgCyan.white
    );
  } catch (error) {
    console.log(`Error in connection DB: ${error}`.bgRed.white);
    process.exit(1);
  }
};

export default connectDB;
