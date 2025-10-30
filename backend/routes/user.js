import express from 'express';
import checkAuth from '../middleware/check-auth.js';
import * as UserController from '../controllers/user.js';

const router = express.Router();

router.post('/signup', UserController.signUpUser);
router.post('/login', UserController.loginUser);
router.patch('/name', checkAuth, UserController.renameUser);
router.get('', checkAuth, UserController.getUser);
router.get('/name/:id', UserController.getUserNameFromId);

export default router;
