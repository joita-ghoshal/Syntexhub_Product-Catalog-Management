require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const connectDB = require('./config/db');
const apiRoutes = require('./routes');
const swaggerSpec = require('./utils/swagger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();
const API_VERSION = process.env.API_VERSION || 'v1';

// ------------------------------------------------------------------
// Database
// ------------------------------------------------------------------
connectDB();

// ------------------------------------------------------------------
// Global middleware
// ------------------------------------------------------------------
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || '*',
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(mongoSanitize());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Apply general rate limiting to all API routes
app.use(`/api/${API_VERSION}`, apiLimiter);

// ------------------------------------------------------------------
// Static frontend dashboard
// ------------------------------------------------------------------
app.use('/', express.static(path.join(__dirname, 'client')));

// ------------------------------------------------------------------
// API Documentation (Swagger)
// ------------------------------------------------------------------
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ------------------------------------------------------------------
// API Routes (versioned)
// ------------------------------------------------------------------
app.use(`/api/${API_VERSION}`, apiRoutes);

// ------------------------------------------------------------------
// 404 + centralized error handling
// ------------------------------------------------------------------
app.use(notFoundHandler);
app.use(errorHandler);

// ------------------------------------------------------------------
// Start server
// ------------------------------------------------------------------
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`📘 API Docs available at http://localhost:${PORT}/api-docs`);
  console.log(`🖥️  Dashboard available at http://localhost:${PORT}/`);
});

// Handle unhandled promise rejections gracefully
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;
