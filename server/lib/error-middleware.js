import jwt from 'jsonwebtoken';
import ClientError from './client-error.js';

export default function errorMiddleware(err, req, res, next) {
  if (err instanceof ClientError) {
    res.status(err.status).json({ error: err.message });
  } else if (err instanceof jwt.JsonWebTokenError) {
    res.status(401).json({ error: 'invalid access token' });
  } else {
    console.error(err);
    res.status(500).json({ error: 'an unexpected error occurred' });
  }
}
