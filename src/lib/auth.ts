import { cookies } from 'next/headers';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { query, queryOne } from './db';

const SESSION_COOKIE = 'gc_session';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

// ─── User Types ────────────────────────────────────────────────
export interface User {
  id: number;
  username: string;
  display_name: string | null;
  created_at: Date;
}

interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  display_name: string | null;
  created_at: Date;
}

interface SessionRow {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
}

// ─── Signup ────────────────────────────────────────────────────
export async function createUser(
  username: string,
  password: string,
  displayName?: string
): Promise<User> {
  // Check if username exists
  const existing = await queryOne<UserRow>(
    'SELECT id FROM users WHERE username = $1',
    [username.toLowerCase()]
  );
  if (existing) {
    throw new Error('Username already taken');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const row = await queryOne<UserRow>(
    `INSERT INTO users (username, password_hash, display_name)
     VALUES ($1, $2, $3)
     RETURNING id, username, display_name, created_at`,
    [username.toLowerCase(), passwordHash, displayName || username]
  );

  if (!row) throw new Error('Failed to create user');
  return { id: row.id, username: row.username, display_name: row.display_name, created_at: row.created_at };
}

// ─── Login ─────────────────────────────────────────────────────
export async function validateCredentials(
  username: string,
  password: string
): Promise<User | null> {
  const row = await queryOne<UserRow>(
    'SELECT id, username, password_hash, display_name, created_at FROM users WHERE username = $1',
    [username.toLowerCase()]
  );
  if (!row) return null;

  const valid = await bcrypt.compare(password, row.password_hash);
  if (!valid) return null;

  return { id: row.id, username: row.username, display_name: row.display_name, created_at: row.created_at };
}

// ─── Sessions ──────────────────────────────────────────────────
export async function createSession(userId: number): Promise<string> {
  // Cleanup expired sessions
  await query('DELETE FROM sessions WHERE expires_at < NOW()');

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

  await query(
    'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, token, expiresAt]
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });

  return token;
}

export async function validateSession(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE);
    if (!sessionCookie?.value) return null;

    const session = await queryOne<SessionRow>(
      'SELECT * FROM sessions WHERE token = $1 AND expires_at > NOW()',
      [sessionCookie.value]
    );
    if (!session) return null;

    const user = await queryOne<UserRow>(
      'SELECT id, username, display_name, created_at FROM users WHERE id = $1',
      [session.user_id]
    );

    return user ? { id: user.id, username: user.username, display_name: user.display_name, created_at: user.created_at } : null;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE);

    if (sessionCookie?.value) {
      await query('DELETE FROM sessions WHERE token = $1', [sessionCookie.value]);
    }

    cookieStore.set(SESSION_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
  } catch {
    // Ignore
  }
}

// ─── Change Password ───────────────────────────────────────────
export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<boolean> {
  const row = await queryOne<UserRow>(
    'SELECT password_hash FROM users WHERE id = $1',
    [userId]
  );
  if (!row) return false;

  const valid = await bcrypt.compare(currentPassword, row.password_hash);
  if (!valid) return false;

  const newHash = await bcrypt.hash(newPassword, 12);
  await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, userId]);
  return true;
}
