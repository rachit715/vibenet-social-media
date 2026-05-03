import userModel from "../models/userSchema.js";
import PostModel from "../models/postSchema.js";
import storyModel from "../models/storySchema.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { deleteCloudinaryAsset, inferResourceTypeFromUrl } from "../cloudinaryHelpers.js";

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields required" });
    }

    const avatarDP = req.file?.path || req.file?.secure_url || null;

    if (!avatarDP) {
      return res
        .status(400)
        .json({ success: false, message: "Avatar image required" });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await userModel.create({
      username,
      email,
      password: hashedPassword,
      avatar: avatarDP,
      avatarPublicId: req.file?.filename || "",
      avatarResourceType: req.file?.mimetype?.startsWith("video/")
        ? "video"
        : "image",
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, name: newUser.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.cookie("token", token, {
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const userResponse = {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      avatar: newUser.avatar,
    };

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: userResponse,
      token: token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(401)
        .json({ success: false, message: "All fields required" });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.cookie("token", token, {
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
    };

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: userResponse,
      token: token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const me = async (req, res) => {
  try {
    const user = await userModel
      .findById(req.user)
      .select("-password")
      .populate("following", "username avatar email")
      .populate("followers", "username avatar email");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, currentUser: user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res
        .status(400)
        .json({ success: false, message: "Search query required" });
    }

    // Search for partial username match (case-insensitive)
    const users = await userModel
      .find({
        username: { $regex: q, $options: "i" },
      })
      .select("-password")
      .limit(10);

    res.status(200).json({ success: true, users });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await userModel
      .findById(userId)
      .select("-password")
      .populate("following", "username avatar email")
      .populate("followers", "username avatar email");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user;

    if (currentUserId.toString() === userId.toString()) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot follow yourself" });
    }

    const user = await userModel.findById(currentUserId);
    const userToFollow = await userModel.findById(userId);

    if (!userToFollow) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isAlreadyFollowing = user.following.some(
      (id) => id.toString() === userId.toString()
    );

    if (isAlreadyFollowing) {
      return res
        .status(400)
        .json({ success: false, message: "Already following this user" });
    }

    user.following.push(userId);
    userToFollow.followers.push(currentUserId);

    await user.save();
    await userToFollow.save();

    res
      .status(200)
      .json({ success: true, message: "User followed successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user;

    const user = await userModel.findById(currentUserId);
    const userToUnfollow = await userModel.findById(userId);

    if (!userToUnfollow) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isFollowing = user.following.some(
      (id) => id.toString() === userId.toString()
    );

    if (!isFollowing) {
      return res
        .status(400)
        .json({ success: false, message: "Not following this user" });
    }

    user.following = user.following.filter(
      (id) => id.toString() !== userId.toString()
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      (id) => id.toString() !== currentUserId.toString()
    );

    await user.save();
    await userToUnfollow.save();

    res
      .status(200)
      .json({ success: true, message: "User unfollowed successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user;
    const { username, currentPassword, newPassword } = req.body;

    const user = await userModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const trimmedUsername = username?.trim();
    if (!trimmedUsername) {
      return res
        .status(400)
        .json({ success: false, message: "Username is required" });
    }

    const existingUsername = await userModel.findOne({
      username: trimmedUsername,
      _id: { $ne: userId },
    });

    if (existingUsername) {
      return res
        .status(400)
        .json({ success: false, message: "Username already taken" });
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password is required",
        });
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    user.username = trimmedUsername;

    if (req.file?.path || req.file?.secure_url) {
      await deleteCloudinaryAsset({
        publicId: user.avatarPublicId,
        url: user.avatar,
        resourceType: user.avatarResourceType || "image",
      });

      user.avatar = req.file.path || req.file.secure_url;
      user.avatarPublicId = req.file.filename || "";
      user.avatarResourceType = req.file.mimetype?.startsWith("video/")
        ? "video"
        : "image";
    }

    await user.save();

    const updatedUser = await userModel
      .findById(userId)
      .select("-password")
      .populate("following", "username avatar email")
      .populate("followers", "username avatar email");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const userId = req.user;
    const user = await userModel.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const userPosts = await PostModel.find({ user: userId });
    for (const post of userPosts) {
      const postAssets = Array.isArray(post.media) && post.media.length > 0
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
            ...(post.image
              ? [{ url: post.image, resourceType: inferResourceTypeFromUrl(post.image) }]
              : []),
          ];

      for (const asset of postAssets) {
        await deleteCloudinaryAsset(asset);
      }
    }

    const userStories = await storyModel.find({ user: userId });
    for (const story of userStories) {
      await deleteCloudinaryAsset({
        publicId: story.publicId,
        url: story.image,
        resourceType: story.resourceType || story.mediaType,
      });
    }

    await PostModel.deleteMany({ user: userId });
    await storyModel.deleteMany({ user: userId });

    await PostModel.updateMany(
      {},
      {
        $pull: {
          likes: userId,
          comments: { user: userId },
        },
      }
    );

    await userModel.updateMany(
      { $or: [{ following: userId }, { followers: userId }] },
      {
        $pull: {
          following: userId,
          followers: userId,
        },
      }
    );

    await deleteCloudinaryAsset({
      publicId: user.avatarPublicId,
      url: user.avatar,
      resourceType: user.avatarResourceType || "image",
    });

    await user.deleteOne();
    res.clearCookie("token");

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export {
  register,
  login,
  me,
  searchUsers,
  getUserProfile,
  followUser,
  unfollowUser,
  updateProfile,
  deleteAccount,
};
