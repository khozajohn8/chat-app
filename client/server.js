// client/server.js - Simple Express server for serving static files
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the React build
app.use(express.static(path.join(__dirname, 'build')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    build: fs.existsSync(path.join(__dirname, 'build')) ? 'present' : 'missing'
  });
});

// Handle React routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Client serving static files on port ${PORT}`);
  console.log(`📁 Build directory: ${path.join(__dirname, 'build')}`);
});