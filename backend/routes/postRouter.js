import express from "express";
import protect from "../middlewares/auth.js";
import upload from "../middlewares/multer.js";
import {
  createPost,
  getPosts,
  getPostByUser,
  updatePost,
  deletePost,
  toggleLike,
  addComment,
  deleteComment,
  searchPosts,
  getTrendingPosts,
} from "../controllers/postController.js";

const postRouter = express.Router();

// Create post
postRouter.post("/create", protect, upload.array("images", 10), createPost);

// Get posts (feed)
postRouter.get("/get-posts", protect, getPosts);

// Get trending posts
postRouter.get("/trending", getTrendingPosts);

// Search posts
postRouter.get("/search", searchPosts);

// Get user posts
postRouter.get("/user-posts/:userId", protect, getPostByUser);
postRouter.get("/user-posts", protect, getPostByUser);

// Update post
postRouter.put("/post/:id", protect, upload.array("images", 10), updatePost);

// Delete post - FIXED: Changed from /post/:id/delete to /post/:id
postRouter.delete("/post/:id", protect, deletePost);
postRouter.delete("/post/:id/delete", protect, deletePost);

// Like/Unlike post
postRouter.put("/post/:id/like", protect, toggleLike);

// Add comment
postRouter.post("/post/:id/comments", protect, addComment);
postRouter.delete("/post/:id/comments/:commentId", protect, deleteComment);

export default postRouter;


// import express from "express";
// import protect from "../middlewares/auth.js";
// import upload from "../middlewares/multer.js";
// import {
//   createPost,
//   getPosts,
//   getPostByUser,
//   updatePost,
//   deletePost,
//   toggleLike,
//   addComment,
//   searchPosts,
//   getTrendingPosts,
// } from "../controllers/postController.js";

// const postRouter = express.Router();
// postRouter.post("/create", protect, upload.array("images", 10), createPost);
// postRouter.get("/get-posts", protect, getPosts);
// postRouter.get("/user-posts/:userId", protect, getPostByUser);
// postRouter.get("/user-posts", protect, getPostByUser);
// postRouter.get("/search", searchPosts);
// postRouter.get("/trending", getTrendingPosts);
// postRouter.put("/posts/:id", protect, upload.array("images", 10), updatePost);
// postRouter.delete("/post/:id/delete", protect, deletePost);
// postRouter.put("/post/:id/like", protect, toggleLike);
// postRouter.post("/post/:id/comments", protect, addComment);

// export default postRouter;
