import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function verifyGoogleToken(token) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return {
      email: payload.email,
      name: payload.name,
      googleId: payload.sub,
      picture: payload.picture
    };
  } catch (error) {
    throw new Error('Invalid Google token');
  }
}

export function generateJWT(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET || 'default-secret-change-in-production',
    { expiresIn: '7d' }
  );
}

export function verifyJWT(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'default-secret-change-in-production');
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

export function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyJWT(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
