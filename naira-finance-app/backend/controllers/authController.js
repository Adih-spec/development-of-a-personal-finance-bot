/**
 * controllers/authController.js
 * Handles register, login, profile, password change, logout
 */
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { pool }= require('../config/database');
const jwtCfg  = require('../config/jwt');
const { success, created, error, unauthorized, notFound, badRequest } = require('../utils/response');

// ── Register ──────────────────────────────────────────────────
const register = async (req, res) => {
  const { full_name, email, phone, password } = req.body;
  try {
    // Check duplicate email
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ?', [email]
    );
    if (existing.length > 0) {
      return badRequest(res, 'An account with this email already exists.');
    }

    const rounds       = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const password_hash = await bcrypt.hash(password, rounds);

    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
      [full_name.trim(), email.toLowerCase().trim(), phone || null, password_hash]
    );

    const token = generateToken({ id: result.insertId, email, full_name });

    return created(res, {
      token,
      user: { id: result.insertId, full_name, email, phone: phone || null },
    }, 'Registration successful');
  } catch (err) {
    console.error('register error:', err);
    return error(res, 'Registration failed. Please try again.');
  }
};

// ── Login ─────────────────────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query(
      'SELECT id, full_name, email, phone, password_hash, profile_picture, is_active FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      return unauthorized(res, 'Invalid email or password.');
    }

    const user = rows[0];

    if (!user.is_active) {
      return unauthorized(res, 'Account is deactivated. Contact support.');
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return unauthorized(res, 'Invalid email or password.');
    }

    const token = generateToken({ id: user.id, email: user.email, full_name: user.full_name });

    return success(res, {
      token,
      user: {
        id:              user.id,
        full_name:       user.full_name,
        email:           user.email,
        phone:           user.phone,
        profile_picture: user.profile_picture,
      },
    }, 'Login successful');
  } catch (err) {
    console.error('login error:', err);
    return error(res, 'Login failed. Please try again.');
  }
};

// ── Get Profile ───────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, full_name, email, phone, profile_picture, currency, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return notFound(res, 'User not found.');
    return success(res, { user: rows[0] });
  } catch (err) {
    console.error('getProfile error:', err);
    return error(res);
  }
};

// ── Update Profile ────────────────────────────────────────────
const updateProfile = async (req, res) => {
  const { full_name, phone } = req.body;
  try {
    await pool.query(
      'UPDATE users SET full_name = ?, phone = ? WHERE id = ?',
      [full_name.trim(), phone || null, req.user.id]
    );
    return success(res, {}, 'Profile updated successfully.');
  } catch (err) {
    console.error('updateProfile error:', err);
    return error(res);
  }
};

// ── Change Password ───────────────────────────────────────────
const changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;
  try {
    const [rows] = await pool.query(
      'SELECT password_hash FROM users WHERE id = ?', [req.user.id]
    );
    if (rows.length === 0) return notFound(res, 'User not found.');

    const match = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!match) return badRequest(res, 'Current password is incorrect.');

    const rounds      = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const newHash     = await bcrypt.hash(new_password, rounds);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);

    return success(res, {}, 'Password changed successfully.');
  } catch (err) {
    console.error('changePassword error:', err);
    return error(res);
  }
};

// ── Logout (stateless JWT – client discards token) ────────────
const logout = (_req, res) => {
  return success(res, {}, 'Logged out successfully.');
};

// ── Helper: generate JWT ──────────────────────────────────────
const generateToken = (payload) => {
  return jwt.sign(payload, jwtCfg.secret, { expiresIn: jwtCfg.expiresIn });
};

module.exports = { register, login, getProfile, updateProfile, changePassword, logout };
