/**
 * middleware/errorHandler.js
 * Global Express error handler
 */
const { error } = require('../utils/response');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error('Unhandled error:', err);

  // MySQL duplicate entry
  if (err.code === 'ER_DUP_ENTRY') {
    return error(res, 'A record with this value already exists.', 409);
  }

  // MySQL foreign key constraint
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return error(res, 'Referenced resource does not exist.', 400);
  }

  const statusCode = err.statusCode || 500;
  const message    = err.message    || 'Internal server error';

  return error(res, message, statusCode);
};

module.exports = { errorHandler };
