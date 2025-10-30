import multer, { diskStorage } from "multer";
import fs from "fs";

const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpg": "jpg",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/bmp": "bmp",
};

const storage = diskStorage({
  destination: (req, file, cb) => {
    const isValid = MIME_TYPE_MAP[file.mimetype];
    let error = new Error("Invalid mime type");
    if (isValid) {
      error = null;
    }

    const userId = req.userData.userId;

    if (!userId) {
      return cb(new Error("User not authenticated"), null);
    }

    const userImagePath = `images/${userId}`;
    fs.mkdirSync(userImagePath, { recursive: true });
    cb(error, userImagePath);
  },
  filename: (_req, file, cb) => {
    const name = file.originalname.toLocaleLowerCase().split(" ").join("-");
    const ext = MIME_TYPE_MAP[file.mimetype];
    const shorterName =
      name.slice(0, Math.min(8, name.length)) + "-" + Date.now() + "." + ext;
    cb(null, shorterName);
  },
});

export const deleteImageFromPost = (post) => {
  const urlPath = new URL(post.imagePath).pathname;
  const diskPath = urlPath.substring(1);
  fs.unlink(diskPath, (error) => {
    if (error) {
      console.error(`Failed to delete image: ${diskPath}`, error);
    }
  });
};

export const filesStorage = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10mb
  }
});
