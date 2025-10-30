import express from 'express';

import { filesStorage } from '../middleware/files.js';
import checkAuth from '../middleware/check-auth.js';
import * as PostController from '../controllers/posts.js';

const router = express.Router();

router.post('', checkAuth, filesStorage.single('image'), PostController.savePost);
router.get('', PostController.getPosts);
router.get('/:id', PostController.getPostWithId);
router.patch('/:id', checkAuth, filesStorage.single('image'), PostController.updatePost);
router.delete('/:id', checkAuth,  PostController.deletePost);

export default router;
