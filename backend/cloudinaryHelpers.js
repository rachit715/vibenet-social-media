import { cloudinary } from "./middlewares/multer.js";

const VIDEO_EXTENSIONS = new Set(["mp4", "mov", "webm", "mkv", "avi", "m4v"]);

const inferResourceTypeFromUrl = (url = "") => {
  const clean = String(url).split("?")[0];
  const ext = clean.split(".").pop()?.toLowerCase() || "";
  return VIDEO_EXTENSIONS.has(ext) ? "video" : "image";
};

const extractPublicIdFromUrl = (url = "") => {
  const uploadMarker = "/upload/";
  const uploadIndex = url.indexOf(uploadMarker);
  if (uploadIndex === -1) return null;

  let pathPart = url.slice(uploadIndex + uploadMarker.length);
  pathPart = pathPart.replace(/^v\d+\//, "");
  const clean = pathPart.split("?")[0];
  const segments = clean.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const last = segments.pop();
  const lastWithoutExt = last.replace(/\.[^.]+$/, "");
  segments.push(lastWithoutExt);

  return segments.join("/");
};

const deleteCloudinaryAsset = async ({ publicId, url, resourceType }) => {
  const targetPublicId = publicId || extractPublicIdFromUrl(url);
  if (!targetPublicId) return;

  const targetResourceType = resourceType || inferResourceTypeFromUrl(url);

  try {
    await cloudinary.uploader.destroy(targetPublicId, {
      resource_type: targetResourceType,
      invalidate: true,
    });
  } catch (error) {
    console.log("Cloudinary delete failed:", targetPublicId, error.message);
  }
};

export { deleteCloudinaryAsset, extractPublicIdFromUrl, inferResourceTypeFromUrl };
