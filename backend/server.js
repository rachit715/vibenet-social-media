import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/mongoDB.js";
import userRouter from "./routes/useRouter.js";
import postRouter from "./routes/postRouter.js";
import storyRouter from "./routes/storyRouter.js";
import { setupStoryCleanupJob } from "./controllers/storyController.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));

app.use("/api/user", userRouter);
app.use("/api/posts", postRouter);
app.use("/api/stories", storyRouter);

app.get("/", (req, res) => {
  res.send("API Working");
});

const startServer = async () => {
  await connectDB();
  await setupStoryCleanupJob();

  app.listen(PORT, () => {
    console.log(`Server is connected ${PORT}`);
  });
};

void startServer();

//RjgeiDOmJDv7Qrww
