import express from "express";
import userRoutes from "./modules/users/users.routes.js"

const app = express();

app.use(express.json());

app.use("/users",userRoutes);

app.get("/", (req, res) => {
    res.send("Welcome to Sunset Study")
})

export default app;