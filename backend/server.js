const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const supplierRoutes = require('./routes/supplierRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const requestRoutes = require('./routes/requestRoutes');
const matchRoutes = require('./routes/matchRoutes'); // ← ADD THIS LINE

// Use routes
app.use('/api/suppliers', supplierRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/match', matchRoutes); // ← ADD THIS LINE

// Test route
app.get('/', (req, res) => {
  res.send('API running');
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Mongo connected'))
  .catch(err => console.log(err));

// Start server
app.listen(5000, () => console.log('Server running on port 5000'));
