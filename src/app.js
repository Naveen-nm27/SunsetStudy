import express from "express";
import cors from "cors";
import userRoutes from "./modules/users/users.routes.js"
import sessionRoutes from "./modules/sessions/sessions.routes.js";
import subjectRoutes from "./modules/subjects/subjects.routes.js";
import topicRoutes from "./modules/topics/topics.routes.js";
import blockRoutes from "./modules/blocks/blocks.routes.js";
import { authMiddleware } from "./middlewares/auth.js";
import todoRoutes from './modules/todos/todos.routes.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use("/users", userRoutes);
app.use("/sessions", authMiddleware, sessionRoutes);
app.use("/subjects", authMiddleware, subjectRoutes);
app.use("/topics", authMiddleware, topicRoutes);
app.use("/blocks", authMiddleware, blockRoutes);
app.use('/todos', authMiddleware, todoRoutes);

app.get("/", (req, res) => {
    res.send("Welcome to Sunset Study")
})

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ message: err.status === 400 ? 'Invalid JSON request' : err.message || 'Request failed' });
});
export default app;
