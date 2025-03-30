import mongoose from "mongoose";
import { DB_NAME } from "../constatnt.js";

export const ConnectDB = async () => {
  try {
    const ConnectionInstance = await mongoose.connect(
      `${process.env.MONGO_URL}/${DB_NAME}`
    );
    console.log(
      `Mongo DB is now connected AT : ${ConnectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("MongoDb Conncetion Failed", error);
    process.exit(1);
  }
};


