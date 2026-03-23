const express = require('express');
const path = require('path');
const app = express();
const rateLimit = require('express-rate-limit');

const PORT = process.env.PORT || 3001;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs (higher than server since it's static files)
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  // Skip rate limiting for health check
  skip: (req) => req.path === '/health'
});

// Apply rate limiter to all routes
app.use(limiter);

// Health check endpoint (required for App Runner)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'build')));

// ✅ Handle all other routes - serve index.html for React Router
app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Client server running on port ${PORT}`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, 'build')}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});