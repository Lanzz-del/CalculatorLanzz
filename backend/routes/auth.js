import express from 'express';
import { verifyGoogleToken, generateJWT } from '../utils/auth.js';
import { getUserByEmail, createUser } from '../utils/supabase.js';

const router = express.Router();

router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Verify Google token
    const googleUser = await verifyGoogleToken(token);
    
    // Check if user exists
    let user = await getUserByEmail(googleUser.email);
    
    // Create user if doesn't exist
    if (!user) {
      user = await createUser({
        email: googleUser.email,
        name: googleUser.name,
        google_id: googleUser.googleId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    // Generate JWT
    const jwtToken = generateJWT(user);

    res.json({
      success: true,
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: error.message || 'Authentication failed' });
  }
});

router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
