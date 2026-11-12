/**
 * config/jwt.js
 * JWT configuration constants
 */
require('dotenv').config();

module.exports = {
  secret:         process.env.JWT_SECRET        || 'changeme_use_env',
  expiresIn:      process.env.JWT_EXPIRES_IN    || '7d',
  refreshExpires: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
};
