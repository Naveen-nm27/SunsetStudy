import express from "express";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Welcome to Sunset Study")
})

export default app;