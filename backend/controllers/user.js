import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { isValidObjectId } from 'mongoose';
import User from '../models/user.js';

const SUPER_SECRET = process.env['SUPER_SECRET'];

export async function signUpUser(req, res, next) {
  try {
    const salt = await bcrypt.genSalt(10);
    const pwHash = await bcrypt.hash(req.body.password, salt);

    const user = new User({
      email: req.body.email,
      password: pwHash,
    });

    console.log('new user: ', user);

    const savedUser = await user.save();
    if (savedUser) {
      console.log('User created: ', savedUser);

      const token = jwt.sign({ email: savedUser.email, id: savedUser._id }, SUPER_SECRET, {
        expiresIn: '1h',
      });

      return res.status(200).json({
        message: 'User successfully created',
        token: token,
        user: { id: savedUser._id, email: savedUser.email, name: savedUser.name },
      });
    } else {
      return res.status(404).json({
        message: 'no user created',
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
  next();
}

export async function loginUser(req, res, next) {
  try {
    console.log('Finding user with email: ', req.body.email);

    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      console.log('User does not exist');

      return res.status(401).json({
        message: 'Authentication failed',
      });
    }

    console.log('User found: ', user);
    console.log('User password: ', user.password);
    console.log('body: ', req.body);

    const isCorrectPw = await bcrypt.compare(req.body.password, user.password);

    console.log('isCorrectPw: ', isCorrectPw);

    if (!isCorrectPw) {
      return res.status(401).json({
        message: 'Authentication failed, wrong password!',
      });
    }

    const token = jwt.sign({ email: user.email, id: user._id }, SUPER_SECRET, { expiresIn: '1h' });

    return res.status(200).json({
      message: 'successfully logged in',
      token: token,
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

export async function renameUser(req, res, next) {
  const name = req.body.name;
  const userId = req.userData.userId;

  if (!userId) {
    return res.status(404).json({
      message: 'No user id found in auth token',
    });
  }

  if (!isValidObjectId(userId)) {
    return res.status(404).json({
      message: 'User id from token invalid',
    });
  }

  if (!name) {
    return res.status(404).json({
      message: 'No name provided in request body',
    });
  }

  const user = await User.findOneAndUpdate({ _id: userId }, { name: name });

  if (!user) {
    return res.status(404).json({
      message: 'Could not find any user from id ' + userId,
    });
  }

  return res.status(200).json({
    message: 'User name successfully changed',
    name: user.name,
  });
  next();
}

export async function getUser(req, res, next) {
  try {
    const id = req.userData.userId;
    console.log('token id: ', id);

    if (!isValidObjectId(id)) {
        return res.status(404).json({ message: 'Not a valid user id' });
    }
    const user = await User.findOne({ _id: id });

    if (!id || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      message: 'Found user!',
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Could not fetch user' });
  }
  next();
}

export async function getUserNameFromId(req, res, next) {
  try {
    const id = req.params.id;
    console.log('Trying to find user with id: ', id);

    if (!isValidObjectId(id)) {
        return res.status(404).json({ message: 'Not a valid user id' });
    }

    const user = await User.findOne({ _id: id });

    if (!id || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      message: 'Found user!',
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
  next();
}
