import express from "express";
import protect from "../middlewares/auth.js";
import upload from "../middlewares/multer.js";
import {
  createStory,
  getFollowingStories,
  getStoryById,
  getUserStories,
  getUserStoriesById,
  deleteStory,
} from "../controllers/storyController.js";

const storyRouter = express.Router();

storyRouter.post("/create", protect, upload.single("image"), createStory);
storyRouter.get("/get-stories", protect, getFollowingStories);
storyRouter.get("/my-stories", protect, getUserStories);
storyRouter.get("/user/:userId", protect, getUserStoriesById);
storyRouter.get("/:id", protect, getStoryById);
storyRouter.delete("/:id/delete", protect, deleteStory);

export default storyRouter;
