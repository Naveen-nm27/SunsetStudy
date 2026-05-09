import dotenv from "dotenv";
import connectDB from "./db.js";
import app from "./app.js";

dotenv.config()

const PORT = process.env.PORT || 3000;

// Connect to Database, then start the server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server Running on port: ${PORT}`);
    });
});
