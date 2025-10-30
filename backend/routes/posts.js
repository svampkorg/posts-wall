import express from "express";

import {
  extractFile,
  filesStorage,
  processAndSaveImage,
} from "../middleware/files.js";
import checkAuth from "../middleware/check-auth.js";
import * as PostController from "../controllers/posts.js";

const router = express.Router();

router.post(
  "",
  checkAuth,
  extractFile,
  processAndSaveImage,
  PostController.savePost,
);
router.get("", PostController.getPosts);
router.get("/:id", PostController.getPostWithId);
router.patch(
  "/:id",
  checkAuth,
  extractFile,
  processAndSaveImage,
  PostController.updatePost,
);
router.delete("/:id", checkAuth, PostController.deletePost);

export default router;
