import multer, { diskStorage } from "multer";
import sharp from "sharp";
import fs from "fs";
import path from "path";

const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpg": "jpg",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/bmp": "bmp",
};

// to hold image file in memory
const memoryStorage = multer.memoryStorage();

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

export const extractFile = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10mb
  },
  fileFilter: (_req, file, cb) => {
    const isValid = MIME_TYPE_MAP[file.mimetype];
    let error = isValid ? null : new Error("Invalid mimetype");
    cb(error, isValid);
  },
}).single("image");

const resizeImage = async (imageBuffer, quality) => {
  return await sharp(imageBuffer)
    .resize({ width: 1200, withoutEnlargement: true })
    .toFormat("jpeg")
    .jpeg({ quality: quality })
    .toBuffer();
};

export const processAndSaveImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const userId = req.userData.userId;
  if (!userId) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  const name = req.file.originalname.toLocaleLowerCase().split(" ").join("-");
  const filename =
    name.slice(0, Math.min(8, name.length)) + "-" + Date.now() + ".jpeg";
  const userImagePath = `images/${userId}`;
  const fullPath = path.join(userImagePath, filename);

  fs.mkdirSync(userImagePath, { recursive: true });

  let imageBuffer = req.file.buffer;
  const targetSize = 512 * 1024; // 512kb
  let quality = 90; // initial jpeg quality

  let processedImage = await resizeImage(imageBuffer, quality);

  while (processedImage.length > targetSize && quality > 10) {
    quality -= 10; // lower quality
    processedImage = await resizeImage(imageBuffer, quality);
  }

  fs.writeFileSync(fullPath, processedImage);

  req.file.filename = filename;
  req.file.path = fullPath;

  next();
};

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
    fileSize: 10 * 1024 * 1024, // 10mb
  },
});
