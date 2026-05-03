import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

// const storage = new multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/");
//   },
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname) || '.jpg';
//     cb(null, Date.now() + ext);
//   },
// });

// Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith("video/");

    return {
      folder: "social_media_uploads",
      resource_type: "auto",
      allowed_formats: ["jpg", "jpeg", "png", "webp", "mp4", "mov", "webm"],
      ...(isVideo
        ? {}
        : {
            transformation: [{ width: 1000, height: 1000, crop: "limit" }],
          }),
    };
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ];
    if (!allowed.includes(file.mimetype)) {
      cb(
        new Error(
          "Invalid file type. Only JPEG, PNG, WebP, MP4, WEBM, and MOV are allowed."
        )
      );
    } else {
      cb(null, true);
    }
  },
});

export default upload;
export { cloudinary };

// // multer upload
// const upload = multer({ storage });

// export default upload;
