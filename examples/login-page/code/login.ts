// Minimal reference implementation: POST /auth/login endpoint
import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface LoginResponse {
  status: 'success' | 'error';
  user_id?: string;
  email?: string;
  session_expires_at?: string;
  error?: string;
  message?: string;
}

// Constants (from environment)
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-32-bytes-min-for-production';
const SESSION_DURATION = 24 * 60 * 60; // 24 hours in seconds
const RATE_LIMIT_WINDOW = 5 * 60; // 5 minutes
const MAX_FAILED_ATTEMPTS = 5;

// Mock database (in production: PostgreSQL)
const users: Record<string, { id: string; email: string; passwordHash: string; status: string }> = {
  'test@company.com': {
    id: 'user-001',
    email: 'test@company.com',
    passwordHash: '$2b$12$8qXhHBGJ8qXhHBGJ8qXhH.E0Z8qXhHBGJ8qXhHBGJ8qXhHBGJ8qXh', // bcrypt hash
    status: 'active'
  }
};

// Mock Redis (in production: real Redis client)
const rateLimitCache: Record<string, { attempts: number; resetAt: number }> = {};

export async function handleLogin(req: Request, res: Response): Promise<void> {
  const { email, password, rememberMe = false } = req.body as LoginRequest;
  const clientIp = req.ip || 'unknown';

  // Step 1: Validate input
  if (!email || !password) {
    res.status(400).json({
      status: 'error',
      error: 'validation_error',
      message: 'Email and password are required'
    });
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({
      status: 'error',
      error: 'validation_error',
      message: 'Invalid email format'
    });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({
      status: 'error',
      error: 'validation_error',
      message: 'Password must be at least 8 characters'
    });
    return;
  }

  // Step 2: Check rate limit
  const rateLimitKey = `login:${email}`;
  const currentLimit = rateLimitCache[rateLimitKey];
  const now = Date.now();

  if (currentLimit && now < currentLimit.resetAt) {
    if (currentLimit.attempts >= MAX_FAILED_ATTEMPTS) {
      res.status(429).json({
        status: 'error',
        error: 'rate_limit_exceeded',
        message: `Too many login attempts. Try again in ${Math.ceil((currentLimit.resetAt - now) / 1000)} seconds`
      });
      return;
    }
  }

  // Step 3: Lookup user
  const user = users[email];
  if (!user) {
    // Record failed attempt
    if (!currentLimit || now >= currentLimit.resetAt) {
      rateLimitCache[rateLimitKey] = { attempts: 1, resetAt: now + RATE_LIMIT_WINDOW * 1000 };
    } else {
      currentLimit.attempts++;
    }

    res.status(401).json({
      status: 'error',
      error: 'invalid_credentials',
      message: 'Email or password is incorrect'
    });
    return;
  }

  // Step 4: Verify password
  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    // Record failed attempt
    if (!currentLimit || now >= currentLimit.resetAt) {
      rateLimitCache[rateLimitKey] = { attempts: 1, resetAt: now + RATE_LIMIT_WINDOW * 1000 };
    } else {
      currentLimit.attempts++;
    }

    res.status(401).json({
      status: 'error',
      error: 'invalid_credentials',
      message: 'Email or password is incorrect'
    });
    return;
  }

  // Step 5: Check account status
  if (user.status !== 'active') {
    res.status(403).json({
      status: 'error',
      error: `account_${user.status}`,
      message: `Account is ${user.status}`
    });
    return;
  }

  // Step 6: Create session token
  const expiresIn = rememberMe ? 30 * 24 * 60 * 60 : SESSION_DURATION; // 30 days or 24 hours
  const token = jwt.sign(
    { user_id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn }
  );

  const expiresAt = new Date(now + expiresIn * 1000).toISOString();

  // Step 7: Set secure cookie
  res.cookie('session_id', token, {
    httpOnly: true, // Prevent JavaScript access (XSS protection)
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict', // CSRF protection
    maxAge: expiresIn * 1000,
    path: '/'
  });

  // Step 8: Clear rate limit on success
  delete rateLimitCache[rateLimitKey];

  // Step 9: Audit log (in production: insert into database)
  console.log(`[AUDIT] Login success: user_id=${user.id}, email=${email}, ip=${clientIp}, timestamp=${new Date().toISOString()}`);

  // Step 10: Return success response
  res.status(200).json({
    status: 'success',
    user_id: user.id,
    email: user.email,
    session_expires_at: expiresAt
  });
}

// Express setup
const app = express();
app.use(express.json());

app.post('/auth/login', handleLogin);

export default app;
