import mongoose from "mongoose"

const connectDb = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error(`Database Connection Error: ${error}`);
        process.exit(1);
    }
};

export default connectDb;