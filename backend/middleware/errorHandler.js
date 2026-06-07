// middleware/errorHandler.js — Global Express error handler
const AppError = require('../utils/AppError');

const errorHandler = (err, req, res, next) => {
  let error = Object.create(err);
  error.message  = err.message;
  error.statusCode = err.statusCode || 500;
  error.status    = err.status || 'error';

  // Mongoose CastError (bad ObjectId)
  if (err.name === 'CastError') {
    error = new AppError(`Resource not found with id: ${err.value}`, 404);
  }

  // MongoDB duplicate key (e.g. duplicate email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = new AppError(`${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const msgs = Object.values(err.errors).map((e) => e.message);
    error = new AppError(msgs.join('. '), 400);
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
