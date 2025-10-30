import jwt from 'jsonwebtoken';
const SUPER_SECRET = process.env['SUPER_SECRET'];

export default (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token,SUPER_SECRET);
    req.userData = { email: decodedToken.email, userId: decodedToken.id };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Auth failed' });
  }
};
