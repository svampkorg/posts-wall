import express from "express";

import {
  extractFile,
  // NOTE: left for use with local storage on server
  // filesStorage,
  // processAndSaveImage,
  processAndUploadToGcp,
} from "../middleware/files.js";
import checkAuth from "../middleware/check-auth.js";
import * as PostController from "../controllers/posts.js";

const router = express.Router();

router.post(
  "",
  checkAuth,
  extractFile,
  // NOTE: left for use with local storage on server
  // processAndSaveImage,
  processAndUploadToGcp,
  PostController.savePost,
);
router.get("", PostController.getPosts);
router.get("/:id", PostController.getPostWithId);
router.patch(
  "/:id",
  checkAuth,
  extractFile,
  // NOTE: left for use with local storage on server
  // processAndSaveImage,
  processAndUploadToGcp,
  PostController.updatePost,
);
router.delete("/:id", checkAuth, PostController.deletePost);

export default router;
