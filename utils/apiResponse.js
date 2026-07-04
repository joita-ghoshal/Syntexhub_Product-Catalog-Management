/**
 * Standardized success response helper so every endpoint returns a
 * consistent JSON shape.
 */
const sendSuccess = (res, statusCode, message, data = null, meta = null) => {
  const payload = {
    success: true,
    message,
  };

  if (data !== null) payload.data = data;
  if (meta !== null) payload.meta = meta;

  return res.status(statusCode).json(payload);
};

module.exports = { sendSuccess };
