/**
 * middleware/auth.js
 * JWT authentication middleware
 */
const jwt    = require('jsonwebtoken');
const jwtCfg = require('../config/jwt');
const { unauthorized } = require('../utils/response');

const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return unauthorized(res, 'Access token required');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, jwtCfg.secret);
    req.user = decoded;           // { id, email, full_name }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return unauthorized(res, 'Token expired. Please log in again.');
    }
    return unauthorized(res, 'Invalid token');
  }
};

module.exports = { authenticate };
