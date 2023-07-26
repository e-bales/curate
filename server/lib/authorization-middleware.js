import jwt from 'jsonwebtoken';
import { ClientError } from './client-error.js';

export function authorizationMiddleware(req, res, next) {
  // The token will be in the Authorization header with the format `Bearer ${token}`
  const token = req.get('authorization')?.split('Bearer ')[1];
  if (!token) {
    throw new ClientError(401, 'authentication required');
  }
  const payload = jwt.verify(token, process.env.TOKEN_SECRET);
  req.user = payload;
  next();
}
