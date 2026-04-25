import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/chat-app`);

    console.log("✅ Database connected");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};
