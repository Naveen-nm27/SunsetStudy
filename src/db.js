import mongoose from "mongoose";
import { getMongoDbName, getMongoUri } from "./config/env.js";

const connectDb = async () => {
  try {
    const uri = getMongoUri();
    const dbName = getMongoDbName(uri);
    const options = dbName ? { dbName } : {};

    await mongoose.connect(uri, options);

    const activeDb = mongoose.connection.db?.databaseName ?? dbName ?? "unknown";
    console.log(`Connected to MongoDB (database: ${activeDb})`);
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDb;
