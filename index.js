import "./src/config/env.js";
import connectDB from "./src/db.js";
import app from "./src/app.js"; 

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
    app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
});