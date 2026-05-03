import storyModel from "../models/storySchema.js";
import userModel from "../models/userSchema.js";
import { deleteCloudinaryAsset } from "../cloudinaryHelpers.js";

const createStory = async (req, res) => {
  const { text, duration } = req.body;
  const userId = req.user;

  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Image or video is required" });
    }

    const mediaType = req.file.mimetype?.startsWith("video/")
      ? "video"
      : "image";
    const parsedDuration =
      mediaType === "video" ? Number.parseFloat(duration) : null;

    if (
      mediaType === "video" &&
      (!Number.isFinite(parsedDuration) || parsedDuration <= 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Video duration is required for story uploads",
      });
    }

    if (mediaType === "video" && parsedDuration > 60) {
      return res.status(400).json({
        success: false,
        message: "Story video must be 60 seconds or less",
      });
    }

    const story = await storyModel.create({
      user: userId,
      image: req.file?.path || req.file?.secure_url || "",
      mediaType,
      publicId: req.file?.filename || "",
      resourceType: mediaType,
      duration: mediaType === "video" ? parsedDuration : null,
      text: text || "",
    });

    await story.populate("user");

    res.status(200).json({
      success: true,
      message: "Story created successfully",
      story,
    });
  } catch (error) {
    console.log("Error creating story:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getFollowingStories = async (req, res) => {
  try {
    const userId = req.user;

    // Get current user's following list
    const currentUser = await userModel.findById(userId).select("following");
    const followingList = currentUser?.following || [];

    // Get stories from followed users only
    const userList = followingList;

    // Get stories from followed users (last 24 hours)
    const stories = await storyModel
      .find({
        user: { $in: userList },
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      })
      .populate("user")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, stories });
  } catch (error) {
    console.log("Error fetching stories:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getStoryById = async (req, res) => {
  const { id } = req.params;

  try {
    const story = await storyModel.findById(id).populate("user");

    if (!story) {
      return res
        .status(404)
        .json({ success: false, message: "Story not found" });
    }

    res.status(200).json({ success: true, story });
  } catch (error) {
    console.log("Error fetching story:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getUserStories = async (req, res) => {
  try {
    const userId = req.user;

    // Get current user's own stories (last 24 hours)
    const stories = await storyModel
      .find({
        user: userId,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      })
      .populate("user")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, stories });
  } catch (error) {
    console.log("Error fetching user stories:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getUserStoriesById = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get specific user's stories (last 24 hours)
    const stories = await storyModel
      .find({
        user: userId,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      })
      .populate("user")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, stories });
  } catch (error) {
    console.log("Error fetching user stories:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const deleteStory = async (req, res) => {
  const { id } = req.params;
  const userId = req.user;

  try {
    const story = await storyModel.findById(id);

    if (!story) {
      return res
        .status(404)
        .json({ success: false, message: "Story not found" });
    }

    if (story.user.toString() !== userId) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to delete this story",
        });
    }

    await deleteCloudinaryAsset({
      publicId: story.publicId,
      url: story.image,
      resourceType: story.resourceType || story.mediaType,
    });

    await storyModel.findByIdAndDelete(id);

    res
      .status(200)
      .json({ success: true, message: "Story deleted successfully" });
  } catch (error) {
    console.log("Error deleting story:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const cleanupExpiredStories = async () => {
  try {
    const expiryCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const expiredStories = await storyModel.find({
      createdAt: { $lte: expiryCutoff },
    });

    if (!expiredStories.length) return { removed: 0 };

    for (const story of expiredStories) {
      await deleteCloudinaryAsset({
        publicId: story.publicId,
        url: story.image,
        resourceType: story.resourceType || story.mediaType,
      });
    }

    await storyModel.deleteMany({
      _id: { $in: expiredStories.map((story) => story._id) },
    });

    return { removed: expiredStories.length };
  } catch (error) {
    console.log("Error cleaning expired stories:", error.message);
    return { removed: 0 };
  }
};

const setupStoryCleanupJob = async () => {
  try {
    await storyModel.collection.dropIndex("createdAt_1");
  } catch (error) {
    // Ignore when index does not exist or is already non-TTL.
  }

  try {
    await storyModel.collection.createIndex({ createdAt: -1 });
  } catch (error) {
    console.log("Story index setup warning:", error.message);
  }

  await cleanupExpiredStories();

  setInterval(() => {
    void cleanupExpiredStories();
  }, 10 * 60 * 1000);
};

export {
  createStory,
  getFollowingStories,
  getStoryById,
  getUserStories,
  getUserStoriesById,
  deleteStory,
  cleanupExpiredStories,
  setupStoryCleanupJob,
};
