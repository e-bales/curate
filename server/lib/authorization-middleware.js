import jwt from 'jsonwebtoken';
import ClientError from './client-error.js';

export default function authorizationMiddleware(req, res, next) {
  // The token will be in the Authorization header with the format `Bearer ${token}`
  const token = req.headers.authorization?.split('Bearer ')[1];
  console.log('req here!: ', req.headers);
  if (!token) {
    throw new ClientError(401, 'authentication required');
  }
  const payload = jwt.verify(token, process.env.TOKEN_SECRET);
  req.user = payload;
  next();
}
