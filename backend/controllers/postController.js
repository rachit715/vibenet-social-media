import PostModel from "../models/postSchema.js";
import userModel from "../models/userSchema.js";
import { deleteCloudinaryAsset, inferResourceTypeFromUrl } from "../cloudinaryHelpers.js";

const createPost = async (req, res) => {
  const { text } = req.body;

  console.log("Received create post request");
  console.log("BODY:", req.body);
  console.log("FILES:", req.files);

  try {
    let media = [];
    if (req.files && req.files.length > 0) {
      media = req.files
        .map((file) => {
          const url = file.path || file.secure_url;
          if (!url) return null;

          return {
            url,
            type: file.mimetype?.startsWith("video/") ? "video" : "image",
            publicId: file.filename || "",
            resourceType: file.mimetype?.startsWith("video/") ? "video" : "image",
          };
        })
        .filter(Boolean);
    } else if (req.file) {
      const mediaUrl = req.file.path || req.file.secure_url;
      media = mediaUrl
        ? [
            {
              url: mediaUrl,
              type: req.file.mimetype?.startsWith("video/") ? "video" : "image",
              publicId: req.file.filename || "",
              resourceType: req.file.mimetype?.startsWith("video/") ? "video" : "image",
            },
          ]
        : [];
    }

    const images = media
      .filter((item) => item.type === "image")
      .map((item) => item.url);

    const post = await PostModel.create({
      user: req.user,
      text,
      image: images.length > 0 ? images[0] : "",
      images,
      media,
    });

    console.log("Post created:", post);

    res
      .status(200)
      .json({ success: true, message: "Post uploaded successfully", post });
  } catch (error) {
    console.log("Error creating post:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getPosts = async (req, res) => {
  try {
    const userId = req.user;

    // Get the current user's following list
    const currentUser = await userModel.findById(userId).select("following");
    const followingList = currentUser?.following || [];

    // Get posts only from users that the current user follows
    const posts = await PostModel.find({
      user: { $in: followingList },
    })
      .populate("user")
      .populate("comments.user")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, posts });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getPostByUser = async (req, res) => {
  try {
    // If userId is provided as a parameter, use that; otherwise use logged-in user
    const targetUserId = req.params.userId || req.user;

    if (!targetUserId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }

    const posts = await PostModel.find({ user: targetUserId })
      .populate("user")
      .populate("comments.user")
      .sort({ createdAt: -1 });

    if (!posts || posts.length === 0) {
      return res.status(200).json({ success: true, posts: [] });
    }

    res
      .status(200)
      .json({ success: true, message: "Posts retrieved successfully", posts });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const updatePost = async (req, res) => {
  const postId = req.params.id;
  const { text } = req.body;

  try {
    const post = await PostModel.findById(postId);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    if (post.user.toString() !== req.user) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to Update this post",
      });
    }

    const updatedPost = await PostModel.findByIdAndUpdate(
      postId,
      {
        text: text || post.text,
        image: req.file?.path || req.file?.secure_url || post.image,
      },
      { new: true },
    );

    res.status(200).json({ success: true, updatedPost });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const deletePost = async (req, res) => {
  const postId = req.params?.id;

  try {
    const post = await PostModel.findById(postId);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    if (post.user.toString() !== req.user) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to Delete this post",
      });
    }

    const mediaToDelete = Array.isArray(post.media) && post.media.length > 0
      ? post.media.map((item) => ({
          publicId: item.publicId,
          url: item.url,
          resourceType: item.resourceType || item.type,
        }))
      : [
          ...(post.images || []).map((url) => ({
            url,
            resourceType: inferResourceTypeFromUrl(url),
          })),
          ...(post.image ? [{ url: post.image, resourceType: inferResourceTypeFromUrl(post.image) }] : []),
        ];

    for (const asset of mediaToDelete) {
      await deleteCloudinaryAsset(asset);
    }

    await post.deleteOne();
    res
      .status(200)
      .json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const toggleLike = async (req, res) => {
  const postId = req.params?.id;
  const userId = req.user || req.user.Id;

  try {
    const post = await PostModel.findById(postId);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    const alreadyLiked = post.likes.some((id) => id.toString() === userId);
    if (alreadyLiked) {
      // If already liked, remove the like
      post.likes = post.likes.filter(
        (id) => id.toString() !== userId.toString(),
      );
    } else {
      // If not liked, add the like
      post.likes.push(userId);
    }

    await post.save();
    res.status(200).json({
      success: true,
      message: alreadyLiked ? "Post unliked" : "Post liked",
      likes: post.likes.length,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const addComment = async (req, res) => {
  const { id: postId } = req.params;
  const userId = req.user || req.user.Id;
  const { text } = req.body;

  try {
    const post = await PostModel.findById(postId);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    post.comments.push({ user: userId, text });
    await post.save();

    res.status(200).json({
      success: true,
      message: "Comment added successfully",
      comment: post.comments[post.comments.length - 1],
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const deleteComment = async (req, res) => {
  const { id: postId, commentId } = req.params;
  const userId = req.user || req.user.Id;

  try {
    const post = await PostModel.findById(postId);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }

    const isCommentOwner = String(comment.user) === String(userId);
    const isPostOwner = String(post.user) === String(userId);

    if (!isCommentOwner && !isPostOwner) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this comment",
      });
    }

    comment.deleteOne();
    await post.save();

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const searchPosts = async (req, res) => {
  const { q } = req.query;

  try {
    if (!q) {
      return res
        .status(400)
        .json({ success: false, message: "Search query required" });
    }

    const posts = await PostModel.find({
      text: { $regex: q, $options: "i" },
    })
      .populate("user")
      .populate("comments.user")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, posts });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getTrendingPosts = async (req, res) => {
  try {
    const posts = await PostModel.find()
      .populate("user")
      .populate("comments.user")
      .sort({ likes: -1, createdAt: -1 })
      .limit(10);

    res.status(200).json({ success: true, posts });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export {
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
};
