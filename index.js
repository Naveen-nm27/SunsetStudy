import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGO_URI).then(() => console.log("MongoDB Connected")).catch((err) => console.log("Db Connection",err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server Running on port: ${PORT}`));