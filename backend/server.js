const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fileRoutes = require('./routes/fileRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Add a diagnostic log on startup
console.log(`Starting application in ${process.env.NODE_ENV} mode`);
console.log(`Current directory: ${__dirname}`);
console.log(`Environment variables: PORT=${process.env.PORT}`);

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'UP',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/files', fileRoutes);

// Serve static files from the React frontend app
if (process.env.NODE_ENV === 'production') {
  console.log('Serving static files from:', path.join(__dirname, '../frontend/build'));
  app.use(express.static(path.join(__dirname, '../frontend/build')));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
