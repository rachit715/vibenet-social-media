import mongoose from "mongoose";

const storySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  mediaType: {
    type: String,
    enum: ["image", "video"],
    default: "image",
  },
  publicId: {
    type: String,
    default: "",
  },
  resourceType: {
    type: String,
    enum: ["image", "video"],
    default: "image",
  },
  duration: {
    type: Number,
    default: null,
  },
  text: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

const storyModel =
  mongoose.models.Story || mongoose.model("Story", storySchema);

export default storyModel;
