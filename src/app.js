import express from "express";
import userRoutes from "./modules/users/users.routes.js"
import sessionRoutes from "./modules/sessions/sessions.routes.js";
import subjectRoutes from "./modules/subjects/subjects.routes.js";
import topicRoutes from "./modules/topics/topics.routes.js";
import blockRoutes from "./modules/blocks/blocks.routes.js";

const app = express();

app.use(express.json());

app.use("/users",userRoutes);
app.use("/sessions", sessionRoutes);
app.use("/subjects", subjectRoutes);
app.use("/topics", topicRoutes);
app.use("/blocks", blockRoutes);

app.get("/", (req, res) => {
    res.send("Welcome to Sunset Study")
})

export default app;