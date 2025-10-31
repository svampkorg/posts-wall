import multer from "multer";
import { Storage } from "@google-cloud/storage";
import sharp from "sharp";
import fs from "fs";
import path from "path";

const BUCKET_NAME = process.env["GCP_BUCKET_NAME"];

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

// Cloud Storage
const cloudStorage = new Storage();
const bucket = cloudStorage.bucket(BUCKET_NAME);

export const processAndUploadToGcp = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const userId = req.userData.userId;
  if (!userId) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  const name = req.file.originalname.toLocaleLowerCase().split(" ").join("-");
  const filename = `images/${userId}/${name.slice(0, Math.min(8, name.length))}-${Date.now()}.jpeg`;

  let imageBuffer = req.file.buffer;
  const targetSize = 512 * 1024; // 512kb target image file size
  let quality = 90; // starting with 90 in quality

  let processedImage = await resizeImage(imageBuffer, quality);

  // INFO: Gradually lower image quality until targetSize is met.
  // Image width is capped to 1200 pixels through resizeImage
  // Will break out if image quality reaches 10 😬
  while (processedImage.length > targetSize && quality > 10) {
    quality -= 10;
    processedImage = await resizeImage(imageBuffer, quality);
  }

  const blob = bucket.file(filename);
  const blobStream = blob.createWriteStream({
    resumable: false,
    contentType: "image/jpeg",
  });

  new Promise((resolve, reject) => {
    blobStream.on("error", reject);
    // on finish resolve() to trigger .then on promise
    blobStream.on("finish", () => {
      resolve();
    });

    // write/upload the file
    blobStream.end(processedImage);
  })
    .then(async () => {
      // promise resolved w/o errors
      await blob.makePublic();
      const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${filename}`;

      req.file.gcpUrl = publicUrl;
      req.file.gcpFilename = filename;

      next();
    })
    .catch((err) => {
      console.error("GCP Upload or makePublic error: ", err);
      res.status(500).json({ message: "Could not upload the image." });
    });
};

export const deleteImageFromGcp = async (post) => {
  if (!post || !post.imagePath) {
    return;
  }

  try {
    const objectName = new URL(post.imagePath).pathname
      .substring(1)
      .replace(`${BUCKET_NAME}/`, "");
    await bucket.file(objectName).delete();
  } catch (error) {
    console.error(`Failed to delete image from GCP: ${post.imagePath}`, error);
  }
};

// NOTE: left for use with local storage on server
const diskStorage = multer.diskStorage({
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

async function resizeImage(imageBuffer, quality) {
  return await sharp(imageBuffer)
    .resize({ width: 1200, withoutEnlargement: true })
    .toFormat("jpeg")
    .jpeg({ quality: quality })
    .toBuffer();
}

// NOTE: left for use with local storage on server
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

// NOTE: left for use with local storage on server
export const deleteImageFromPost = (post) => {
  const urlPath = new URL(post.imagePath).pathname;
  const diskPath = urlPath.substring(1);
  fs.unlink(diskPath, (error) => {
    if (error) {
      console.error(`Failed to delete image: ${diskPath}`, error);
    }
  });
};

// NOTE: left for use with local storage on server
export const filesStorage = multer({
  storage: diskStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10mb
  },
});
